/**
 * AnalyseView.tsx
 * Gap-Analyse-Modus des 5LM-Demonstrators.
 *
 * Zwei Arbeitsbereiche:
 *   1. Assets     – frei erfassbare Asset-Tabelle (keine Vorlage, keine Mengenbegrenzung).
 *                   Jedes Asset erhält eine Farbe → relevante Controls im Katalog farbig markiert.
 *   2. Massnahmen – Katalog aller Referenz-Controls (SE1–SE5), Drag & Drop in die Analyse.
 *                   Farbige Mehrfachmarkierung je erfasstem Asset möglich.
 *
 * Farblogik:
 *   controlToAssetIndices: Map<controlId, number[]>
 *   → Für jeden Control: Liste der Asset-Indizes, die ihn benötigen.
 *   → Anzeige als farbige Quadrate im Katalog und in der Drop-Zone.
 */

import React, { useMemo, useState } from 'react';
import type {
  Asset,
  Control,
  Scenario,
  ProtectionGoal,
  ProtectionGoalId,
} from '../model/types';
import { ASSET_VALUE_MAP } from '../model/types';
import type { RiskAssessmentResult } from '../model/types';
import { computeRiskAssessment } from '../model/riskCalculation';
import { assetTypes } from '../data/assetTypes';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SE_LAYERS = ['SE1', 'SE2', 'SE3', 'SE4', 'SE5'] as const;

const SE_LABEL: Record<string, string> = {
  SE1: 'SE1 – Normalbetrieb',
  SE2: 'SE2 – Betriebsstörung',
  SE3: 'SE3 – Auslegungsstörfälle',
  SE4: 'SE4 – Auslegungsüberschreitend',
  SE5: 'SE5 – Schwere Störfälle',
};

const SE_COLOR: Record<string, string> = {
  SE1: '#0369a1', SE2: '#92400e', SE3: '#5b21b6', SE4: '#9d174d', SE5: '#166534',
};

const SE_BG: Record<string, string> = {
  SE1: '#e0f2fe', SE2: '#fef3c7', SE3: '#ede9fe', SE4: '#fce7f3', SE5: '#dcfce7',
};

/** 8 distinct highlight colors for assets – cycles for more than 8 assets */
const ASSET_PALETTE: Array<{ bg: string; border: string; text: string }> = [
  { bg: '#fef3c7', border: '#d97706', text: '#92400e' },  // amber
  { bg: '#dbeafe', border: '#2563eb', text: '#1d4ed8' },  // blue
  { bg: '#fce7f3', border: '#db2777', text: '#9d174d' },  // pink
  { bg: '#dcfce7', border: '#16a34a', text: '#166534' },  // green
  { bg: '#ede9fe', border: '#7c3aed', text: '#5b21b6' },  // purple
  { bg: '#fee2e2', border: '#dc2626', text: '#991b1b' },  // red
  { bg: '#ccfbf1', border: '#0d9488', text: '#0f766e' },  // teal
  { bg: '#fdf4ff', border: '#a855f7', text: '#7e22ce' },  // violet
];

const GOAL_ORDER: ProtectionGoalId[] = [
  'Vertraulichkeit', 'Integrität', 'Verbindlichkeit', 'Verlässlichkeit', 'Zuverlässigkeit',
];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface Props {
  baselineResult: RiskAssessmentResult;
  scenarios: Scenario[];
  assets: Asset[];          // not used for pre-filling; only as fallback for result calc
  controls: Control[];
  protectionGoals: ProtectionGoal[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AnalyseView({
  baselineResult,
  scenarios,
  assets: _fallbackAssets,
  controls: catalogue,
  protectionGoals,
}: Props) {

  // ── 1. Analysis Assets – frei erfassbar, leer beim Start ─────────────────
  const [analysisAssets, setAnalysisAssets] = useState<Asset[]>([]);
  const [nextIdx, setNextIdx] = useState(1);

  // ── 2. Selected controls (by ID) ─────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // ── 3. Drag state ────────────────────────────────────────────────────────
  const [isDragOver, setIsDragOver] = useState(false);

  // ── 4. Open SE-layer sections in catalogue ───────────────────────────────
  const [openLayers, setOpenLayers] = useState<Set<string>>(
    new Set(['SE1', 'SE2', 'SE3', 'SE4', 'SE5'])
  );

  // ── 5. Derived: selected Control objects ────────────────────────────────
  const selectedControls = useMemo(
    () => catalogue.filter(c => selectedIds.has(c.id)),
    [selectedIds, catalogue]
  );

  // ── 6. Control → Asset index map (for colour highlighting) ───────────────
  //  For each controlId: sorted list of analysisAsset indices that "need" it
  //  (via assetType.relatedScenarioIds ∋ ctrl.scenarioId)
  const controlToAssetIndices = useMemo<Map<string, number[]>>(() => {
    const map = new Map<string, number[]>();
    analysisAssets.forEach((asset, assetIdx) => {
      const at = assetTypes.find(t => t.id === asset.assetTypeId);
      if (!at) return;
      const relScenarios = new Set(at.relatedScenarioIds);
      for (const ctrl of catalogue) {
        if (relScenarios.has(ctrl.scenarioId)) {
          if (!map.has(ctrl.id)) map.set(ctrl.id, []);
          map.get(ctrl.id)!.push(assetIdx);
        }
      }
    });
    return map;
  }, [analysisAssets, catalogue]);

  // ── 7. Relevant scenarios – dynamic based on captured assets ──────────────
  // A scenario cannot occur if no matching asset is present.
  // With no assets defined: all scenarios are considered relevant.
  const relevantScenarios = useMemo(() => {
    if (analysisAssets.length === 0) return scenarios;
    const relevantIds = new Set<string>();
    for (const asset of analysisAssets) {
      const at = assetTypes.find(t => t.id === asset.assetTypeId);
      if (at) at.relatedScenarioIds.forEach(id => relevantIds.add(id));
    }
    return scenarios.filter(s => relevantIds.has(s.id));
  }, [analysisAssets, scenarios]);

  const excludedScenarios = useMemo(
    () => scenarios.filter(s => !relevantScenarios.includes(s)),
    [scenarios, relevantScenarios]
  );

  // ── 8a. Relevant controls – all controls for relevant scenarios ───────────
  // Σ benötigte Schutzmassnahmen, dynamisch aus den erfassten Assets abgeleitet.
  const relevantControls = useMemo(
    () => catalogue.filter(c => relevantScenarios.some(s => s.id === c.scenarioId)),
    [catalogue, relevantScenarios]
  );

  // ── 8b. Effektive Basis-Assets: C_j aus Analyse-Assets ableiten ──────────
  // Für jeden Asset-Typ wird der höchste C_j-Wert unter allen Analyse-Assets
  // dieses Typs verwendet. Mehrere Assets gleichen Typs → höchster Wert gewinnt.
  const effectiveBaseAssets = useMemo(() => {
    if (analysisAssets.length === 0) return _fallbackAssets;
    // Maximalen C_j pro Asset-Typ bestimmen
    const maxCjByType = new Map<string, number>();
    for (const a of analysisAssets) {
      const current = maxCjByType.get(a.assetTypeId) ?? 0;
      if (a.C_j > current) maxCjByType.set(a.assetTypeId, a.C_j);
    }
    // Fallback-Assets mit abgeleitetem C_j überschreiben
    return _fallbackAssets.map(a => {
      const maxCj = maxCjByType.get(a.assetTypeId);
      if (maxCj === undefined || maxCj === a.C_j) return a;
      const entry = (Object.entries(ASSET_VALUE_MAP) as [Asset['valueCategory'], number][])
        .find(([, v]) => v === maxCj);
      if (!entry) return a;
      return { ...a, valueCategory: entry[0], C_j: maxCj };
    });
  }, [_fallbackAssets, analysisAssets]);

  // ── 8c. Grenzwert: risk with ALL relevant controls fully deployed ──────────
  // Restrisiko bei vollständigem Einsatz aller benötigten Massnahmen.
  // Verwendet effectiveBaseAssets, damit Wertkategorien der Analyse-Assets einfliessen.
  const grenzwertResult = useMemo(
    () => computeRiskAssessment(relevantScenarios, effectiveBaseAssets, relevantControls, protectionGoals),
    [relevantScenarios, effectiveBaseAssets, relevantControls, protectionGoals]
  );

  // ── 8d. Stabilisierungswert (Gap analysis result) ────────────────────────
  // Restrisiko mit den aktuell eingesetzten (ausgewählten) Schutzmassnahmen.
  const gapResult = useMemo(() => {
    const coverage = relevantScenarios.map(s => ({
      scenarioId: s.id,
      covered: selectedControls.some(c => c.scenarioId === s.id),
      matchedControls: selectedControls.filter(c => c.scenarioId === s.id),
    }));
    const riskResult = computeRiskAssessment(
      relevantScenarios, effectiveBaseAssets, selectedControls, protectionGoals
    );
    return {
      coverage,
      riskResult,
      coveredCount: coverage.filter(c => c.covered).length,
      uncoveredCount: coverage.filter(c => !c.covered).length,
    };
  }, [selectedControls, effectiveBaseAssets, relevantScenarios, protectionGoals]);

  // ── Lookup maps ──────────────────────────────────────────────────────────
  const scenarioMap = useMemo(
    () => Object.fromEntries(scenarios.map(s => [s.id, s])),
    [scenarios]
  );

  const catalogueByLayer = useMemo(() => {
    const map: Record<string, Control[]> = {};
    for (const se of SE_LAYERS) map[se] = [];
    for (const ctrl of catalogue) {
      if (map[ctrl.securityLayer]) map[ctrl.securityLayer].push(ctrl);
    }
    return map;
  }, [catalogue]);

  // ── Helpers ──────────────────────────────────────────────────────────────

  function assetColor(idx: number) {
    return ASSET_PALETTE[idx % ASSET_PALETTE.length];
  }

  function assetLabel(idx: number) {
    return String.fromCharCode(65 + (idx % 26));   // A, B, C, …
  }

  // ── Asset CRUD ────────────────────────────────────────────────────────────

  function addAsset() {
    const id = `ANA${String(nextIdx).padStart(2, '0')}`;
    const defaultType = assetTypes[0];
    setAnalysisAssets(prev => [
      ...prev,
      {
        id,
        name: `Asset ${nextIdx}`,
        assetTypeId: defaultType.id,
        type: defaultType.nameDE,
        valueCategory: 'mittel',
        C_j: ASSET_VALUE_MAP['mittel'],
      },
    ]);
    setNextIdx(n => n + 1);
  }

  function removeAsset(id: string) {
    setAnalysisAssets(prev => prev.filter(a => a.id !== id));
  }

  function updateAsset(id: string, field: 'name' | 'assetTypeId' | 'valueCategory', value: string) {
    setAnalysisAssets(prev =>
      prev.map(a => {
        if (a.id !== id) return a;
        if (field === 'name') return { ...a, name: value };
        if (field === 'assetTypeId') {
          const at = assetTypes.find(t => t.id === value);
          return { ...a, assetTypeId: value, type: at ? at.nameDE : a.type };
        }
        if (field === 'valueCategory') {
          const cat = value as Asset['valueCategory'];
          return { ...a, valueCategory: cat, C_j: ASSET_VALUE_MAP[cat] };
        }
        return a;
      })
    );
  }

  // ── Control selection ─────────────────────────────────────────────────────

  function addControl(id: string) {
    setSelectedIds(prev => new Set([...prev, id]));
  }

  function removeControl(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  function toggleLayer(layer: string) {
    setOpenLayers(prev => {
      const next = new Set(prev);
      if (next.has(layer)) next.delete(layer);
      else next.add(layer);
      return next;
    });
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
    const id = e.dataTransfer.getData('controlId');
    if (id) addControl(id);
  }

  // G = Stabilisierungsgrad: refR / anaR ∈ [0, 1]
  // G ≥ 0.9 → Stabil | 0.7 ≤ G < 0.9 → Kritisch | G < 0.7 → Handlungsbedarf
  function riskColor(G: number) {
    if (G < 0.7) return '#dc2626';   // Handlungsbedarf → rot
    if (G < 0.9) return '#f97316';   // Kritisch → orange
    return '#16a34a';                // Stabil → grün
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div>

      {/* ════════════════════════════════════════════════════════════════════
          BEREICH 1 – ASSETS
      ════════════════════════════════════════════════════════════════════ */}
      <SectionBox
        title="Bereich 1 – Assets"
        subtitle="Erfassen Sie die zu analysierenden Assets (keine Vorlage, keine Mengenbegrenzung). Jedes Asset erhält eine Farbe – im Massnahmen-Katalog werden relevante Controls für dieses Asset automatisch farbig markiert. Mehrfachmarkierungen sind möglich."
        accent="#1e3a5f"
      >
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
          <button
            onClick={addAsset}
            style={{ ...ghostBtn(), borderColor: '#1e3a5f', color: '#1e3a5f', fontWeight: 700 }}
          >
            + Asset hinzufügen
          </button>
        </div>

        {analysisAssets.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '32px 16px',
              color: '#94a3b8',
              background: '#f8fafc',
              borderRadius: 8,
              border: '2px dashed #e2e8f0',
              fontSize: 13,
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 8 }}>📦</div>
            <div>Noch keine Assets erfasst.</div>
            <div style={{ fontSize: 11, marginTop: 4 }}>
              Klicken Sie auf „+ Asset hinzufügen", um ein Asset zu erfassen.
            </div>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: '#f1f5f9' }}>
                    <Th style={{ width: 24 }}></Th>
                    <Th>ID</Th>
                    <Th>Name</Th>
                    <Th>Asset-Typ</Th>
                    <Th>Wertkategorie</Th>
                    <Th align="right">Gewicht (C_j)</Th>
                    <Th align="center">Farbe</Th>
                    <Th align="center"></Th>
                  </tr>
                </thead>
                <tbody>
                  {analysisAssets.map((asset, i) => {
                    const color = assetColor(i);
                    return (
                      <tr key={asset.id} style={{ background: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
                        <Td>
                          <div
                            style={{
                              width: 14,
                              height: 14,
                              borderRadius: 3,
                              background: color.bg,
                              border: `2px solid ${color.border}`,
                            }}
                          />
                        </Td>
                        <Td>
                          <code style={{ fontSize: 11, color: '#64748b' }}>{asset.id}</code>
                        </Td>
                        <Td>
                          <input
                            value={asset.name}
                            onChange={e => updateAsset(asset.id, 'name', e.target.value)}
                            style={{
                              padding: '3px 7px',
                              borderRadius: 4,
                              border: '1px solid #d0d5dd',
                              fontSize: 12,
                              width: 170,
                            }}
                          />
                        </Td>
                        <Td>
                          <select
                            value={asset.assetTypeId}
                            onChange={e => updateAsset(asset.id, 'assetTypeId', e.target.value)}
                            style={{
                              padding: '3px 6px',
                              borderRadius: 4,
                              border: '1px solid #d0d5dd',
                              fontSize: 12,
                            }}
                          >
                            {assetTypes.map(at => (
                              <option key={at.id} value={at.id}>
                                {at.nameDE} ({at.name})
                              </option>
                            ))}
                          </select>
                        </Td>
                        <Td>
                          <select
                            value={asset.valueCategory}
                            onChange={e => updateAsset(asset.id, 'valueCategory', e.target.value)}
                            style={{
                              padding: '3px 6px',
                              borderRadius: 4,
                              border: '1px solid #d0d5dd',
                              fontSize: 12,
                            }}
                          >
                            {(Object.keys(ASSET_VALUE_MAP) as Asset['valueCategory'][]).map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        </Td>
                        <Td align="right">
                          <strong style={{ color: '#1e3a5f' }}>{Math.round(asset.C_j * 100)} %</strong>
                        </Td>
                        <Td align="center">
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '1px 8px',
                              borderRadius: 4,
                              background: color.bg,
                              border: `1px solid ${color.border}`,
                              color: color.text,
                              fontSize: 10,
                              fontWeight: 700,
                            }}
                          >
                            {assetLabel(i)}
                          </span>
                        </Td>
                        <Td align="center">
                          <button
                            onClick={() => removeAsset(asset.id)}
                            title="Asset entfernen"
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#dc2626',
                              cursor: 'pointer',
                              fontSize: 18,
                              lineHeight: 1,
                              padding: '0 4px',
                            }}
                          >
                            ×
                          </button>
                        </Td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Farb-Legende */}
            <div
              style={{
                marginTop: 10,
                padding: '6px 10px',
                background: '#f8fafc',
                borderRadius: 6,
                border: '1px solid #e2e8f0',
                display: 'flex',
                gap: 8,
                flexWrap: 'wrap',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: 11, color: '#64748b', flexShrink: 0 }}>
                Katalog-Markierungen:
              </span>
              {analysisAssets.map((a, i) => {
                const color = assetColor(i);
                return (
                  <span
                    key={a.id}
                    style={{
                      fontSize: 10,
                      padding: '2px 8px',
                      borderRadius: 4,
                      background: color.bg,
                      border: `1px solid ${color.border}`,
                      color: color.text,
                      fontWeight: 700,
                    }}
                  >
                    {assetLabel(i)} – {a.name}
                  </span>
                );
              })}
            </div>
          </>
        )}
      </SectionBox>

      {/* ════════════════════════════════════════════════════════════════════
          BEREICH 2 – SCHUTZMASSNAHMEN
      ════════════════════════════════════════════════════════════════════ */}
      <SectionBox
        title="Bereich 2 – Schutzmassnahmen"
        subtitle="Wählen Sie Massnahmen per Drag & Drop oder [+]. Farbige Markierungen im Katalog zeigen, für welche erfassten Assets eine Massnahme relevant ist (Mehrfachmarkierung möglich)."
        accent="#0f766e"
      >
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>

          {/* ── Katalog (links) ──────────────────────────────────────────── */}
          <div
            style={{
              width: 390,
              flexShrink: 0,
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              overflow: 'hidden',
            }}
          >
            {/* Katalog-Header */}
            <div
              style={{
                padding: '8px 12px',
                background: '#f1f5f9',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <strong style={{ fontSize: 12, color: '#1e3a5f' }}>
                Massnahmen-Katalog ({catalogue.length})
              </strong>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={() => setSelectedIds(new Set(catalogue.map(c => c.id)))}
                  style={microBtn('#0369a1')}
                >
                  Alle +
                </button>
                <button
                  onClick={() => setOpenLayers(new Set(SE_LAYERS))}
                  style={microBtn('#475569')}
                >
                  Aufklappen
                </button>
                <button
                  onClick={() => setOpenLayers(new Set())}
                  style={microBtn('#475569')}
                >
                  Einklappen
                </button>
              </div>
            </div>

            {/* Layer-Sektionen */}
            <div style={{ maxHeight: 660, overflowY: 'auto' }}>
              {SE_LAYERS.map(layer => {
                const layerControls = catalogueByLayer[layer] ?? [];
                const isOpen = openLayers.has(layer);
                const selectedInLayer = layerControls.filter(c => selectedIds.has(c.id)).length;

                return (
                  <div key={layer}>
                    <button
                      onClick={() => toggleLayer(layer)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '7px 12px',
                        background: SE_BG[layer],
                        border: 'none',
                        borderBottom: '1px solid #e2e8f0',
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <span style={{ fontSize: 12, fontWeight: 700, color: SE_COLOR[layer] }}>
                        {isOpen ? '▾' : '▸'} {SE_LABEL[layer]}
                      </span>
                      <span style={{ fontSize: 11, color: SE_COLOR[layer] }}>
                        {selectedInLayer}/{layerControls.length} ausgewählt
                      </span>
                    </button>

                    {isOpen && layerControls.map(ctrl => {
                      const isSelected = selectedIds.has(ctrl.id);
                      const sc = scenarioMap[ctrl.scenarioId];
                      const assetIndices = controlToAssetIndices.get(ctrl.id) ?? [];
                      const isHighlighted = assetIndices.length > 0;

                      // background: selected → green, highlighted → lightest tint of first asset color, else white
                      let rowBg = '#fff';
                      if (isSelected) rowBg = '#f0fdf4';
                      else if (isHighlighted) rowBg = assetColor(assetIndices[0]).bg + 'aa';

                      return (
                        <div
                          key={ctrl.id}
                          draggable
                          onDragStart={e => {
                            e.dataTransfer.setData('controlId', ctrl.id);
                            e.dataTransfer.effectAllowed = 'copy';
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 8,
                            padding: '6px 12px',
                            borderBottom: '1px solid #f1f5f9',
                            background: rowBg,
                            cursor: 'grab',
                            userSelect: 'none',
                          }}
                        >
                          <div style={{ flex: 1, minWidth: 0 }}>
                            {/* Control name + asset color dots */}
                            <div
                              style={{
                                fontSize: 11,
                                fontWeight: 600,
                                color: isSelected ? '#166534' : '#1a1a2e',
                                lineHeight: 1.4,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                flexWrap: 'wrap',
                              }}
                            >
                              <span>{ctrl.name}</span>
                              {/* One dot per asset that needs this control */}
                              {assetIndices.map(idx => {
                                const color = assetColor(idx);
                                return (
                                  <span
                                    key={idx}
                                    title={analysisAssets[idx]?.name ?? ''}
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      width: 14,
                                      height: 14,
                                      borderRadius: 3,
                                      background: color.bg,
                                      border: `1.5px solid ${color.border}`,
                                      color: color.text,
                                      fontSize: 8,
                                      fontWeight: 700,
                                      flexShrink: 0,
                                      lineHeight: 1,
                                    }}
                                  >
                                    {assetLabel(idx)}
                                  </span>
                                );
                              })}
                            </div>
                            {/* Sub-info */}
                            <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>
                              <span
                                style={{
                                  background: SE_BG[ctrl.securityLayer],
                                  color: SE_COLOR[ctrl.securityLayer],
                                  padding: '0 4px',
                                  borderRadius: 3,
                                  fontWeight: 600,
                                  marginRight: 4,
                                }}
                              >
                                {ctrl.securityLayer}
                              </span>
                              {ctrl.scenarioId}
                              {sc && ` · ${sc.technique}`}
                              {' · ζ='}{ctrl.zeta.toFixed(2)}
                            </div>
                          </div>

                          {/* Add / Remove button */}
                          <button
                            onClick={() => isSelected ? removeControl(ctrl.id) : addControl(ctrl.id)}
                            title={isSelected ? 'Entfernen' : 'Hinzufügen'}
                            style={{
                              width: 22,
                              height: 22,
                              borderRadius: '50%',
                              border: 'none',
                              background: isSelected
                                ? '#dcfce7'
                                : isHighlighted
                                ? assetColor(assetIndices[0]).bg
                                : '#e0f2fe',
                              color: isSelected
                                ? '#166534'
                                : isHighlighted
                                ? assetColor(assetIndices[0]).text
                                : '#0369a1',
                              fontWeight: 700,
                              fontSize: 14,
                              cursor: 'pointer',
                              flexShrink: 0,
                              lineHeight: 1,
                              padding: 0,
                            }}
                          >
                            {isSelected ? '✓' : '+'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Drop-Zone / Ausgewählte Massnahmen (rechts) ──────────────── */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Drop-Zone-Header */}
            <div
              style={{
                padding: '8px 12px',
                background: '#f1f5f9',
                border: '1px solid #e2e8f0',
                borderBottom: 'none',
                borderRadius: '8px 8px 0 0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <strong style={{ fontSize: 12, color: '#0f766e' }}>
                Ausgewählte Massnahmen ({selectedIds.size})
              </strong>
              {selectedIds.size > 0 && (
                <button onClick={() => setSelectedIds(new Set())} style={microBtn('#dc2626')}>
                  Alle entfernen
                </button>
              )}
            </div>

            {/* Drop-Fläche */}
            <div
              onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              style={{
                border: `2px ${isDragOver ? 'solid' : 'dashed'} ${isDragOver ? '#0f766e' : '#d0d5dd'}`,
                borderTop: 'none',
                borderRadius: '0 0 8px 8px',
                background: isDragOver ? '#f0fdf4' : '#fafafa',
                minHeight: 200,
                padding: 8,
                transition: 'background 0.1s, border-color 0.1s',
              }}
            >
              {selectedIds.size === 0 ? (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: 180,
                    color: '#94a3b8',
                    fontSize: 13,
                    textAlign: 'center',
                    gap: 8,
                  }}
                >
                  <div style={{ fontSize: 32 }}>⬇</div>
                  <div>Massnahmen hierher ziehen</div>
                  <div style={{ fontSize: 11 }}>oder im Katalog auf [+] klicken</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {selectedControls.map(ctrl => {
                    const sc = scenarioMap[ctrl.scenarioId];
                    const assetIndices = controlToAssetIndices.get(ctrl.id) ?? [];
                    return (
                      <div
                        key={ctrl.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '5px 10px',
                          background: '#fff',
                          border: '1px solid #e2e8f0',
                          borderRadius: 6,
                        }}
                      >
                        <span
                          style={{
                            background: SE_BG[ctrl.securityLayer],
                            color: SE_COLOR[ctrl.securityLayer],
                            padding: '1px 5px',
                            borderRadius: 3,
                            fontSize: 10,
                            fontWeight: 700,
                            flexShrink: 0,
                          }}
                        >
                          {ctrl.securityLayer}
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: 11,
                              fontWeight: 600,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                              flexWrap: 'wrap',
                            }}
                          >
                            <span>{ctrl.name}</span>
                            {assetIndices.map(idx => {
                              const color = assetColor(idx);
                              return (
                                <span
                                  key={idx}
                                  title={analysisAssets[idx]?.name ?? ''}
                                  style={{
                                    fontSize: 9,
                                    padding: '1px 5px',
                                    borderRadius: 3,
                                    background: color.bg,
                                    border: `1px solid ${color.border}`,
                                    color: color.text,
                                    fontWeight: 700,
                                  }}
                                >
                                  {assetLabel(idx)}
                                </span>
                              );
                            })}
                          </div>
                          <div style={{ fontSize: 10, color: '#64748b' }}>
                            {ctrl.scenarioId}
                            {sc && ` · ${sc.technique}`}
                            {' · ζ = '}{ctrl.zeta.toFixed(2)}
                          </div>
                        </div>
                        <button
                          onClick={() => removeControl(ctrl.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#94a3b8',
                            cursor: 'pointer',
                            fontSize: 18,
                            fontWeight: 700,
                            lineHeight: 1,
                            padding: '0 2px',
                            flexShrink: 0,
                          }}
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Coverage-Badges */}
            {selectedIds.size > 0 && (
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {[
                  {
                    label: 'Relevant (Szenarien)',
                    v: `${relevantScenarios.length} / ${scenarios.length}`,
                    bg: '#f1f5f9',
                    c: '#1e3a5f',
                  },
                  {
                    label: 'Gedeckt',
                    v: relevantScenarios.length > 0
                      ? `${gapResult.coveredCount} (${Math.round(gapResult.coveredCount / relevantScenarios.length * 100)} %)`
                      : '—',
                    bg: '#dcfce7',
                    c: '#166534',
                  },
                  {
                    label: 'Ungedeckt (ζ = 0)',
                    v: relevantScenarios.length > 0
                      ? `${gapResult.uncoveredCount} (${Math.round(gapResult.uncoveredCount / relevantScenarios.length * 100)} %)`
                      : '—',
                    bg: '#fef2f2',
                    c: '#dc2626',
                  },
                  ...(excludedScenarios.length > 0 ? [{
                    label: 'Nicht anwendbar',
                    v: `${excludedScenarios.length} ausgeschlossen`,
                    bg: '#f8fafc',
                    c: '#94a3b8',
                  }] : []),
                ].map(item => (
                  <div
                    key={item.label}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 6,
                      background: item.bg,
                      color: item.c,
                      flex: 1,
                      minWidth: 120,
                    }}
                  >
                    <div style={{ fontSize: 10 }}>{item.label}</div>
                    <div style={{ fontSize: 17, fontWeight: 700 }}>{item.v}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </SectionBox>

      {/* ════════════════════════════════════════════════════════════════════
          ERGEBNIS – Schutzzielvergleich & Szenarioabdeckung
      ════════════════════════════════════════════════════════════════════ */}
      {selectedIds.size > 0 && (
        <SectionBox
          title="Ergebnis – Schutzzielvergleich & Szenarioabdeckung"
          subtitle="Restrisiko = Restrisiko bei vollständigem Einsatz aller benötigten Massnahmen (Σ aus Assets, dynamisch). Aggregierte Schutzwirkung = Restrisiko mit den aktuell eingesetzten Massnahmen."
          accent="#7c3aed"
        >
          {/* Schutzzielvergleich */}
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1e3a5f', margin: '0 0 8px' }}>
            Schutzzielvergleich
          </h3>
          <div style={{ overflowX: 'auto', marginBottom: 24 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#f1f5f9' }}>
                  <Th>Schutzziel</Th>
                  <Th align="right">Restrisiko</Th>
                  <Th align="right">Aggregierte Schutzwirkung</Th>
                  <Th align="center">Status</Th>
                  <Th align="right">Differenz Schutzzielerfüllung</Th>
                </tr>
              </thead>
              <tbody>
                {GOAL_ORDER.map((goalId, i) => {
                  const refR = grenzwertResult.riskByProtectionGoal[goalId] ?? 0;
                  const anaR = gapResult.riskResult.riskByProtectionGoal[goalId] ?? 0;
                  const diff = anaR - refR;
                  const diffPct = refR > 0 ? (diff / refR) * 100 : 0;
                  // G = Stabilisierungsgrad ∈ [0,1]: refR / anaR
                  // G = 1.0 wenn anaR ≤ refR (optimal), sonst < 1.0
                  const G_stab = anaR > 0 ? Math.min(1.0, refR / anaR) : (refR === 0 ? 1.0 : 0.0);
                  const statusVariant = G_stab >= 0.9 ? 'ok' : G_stab >= 0.7 ? 'warning' : 'violation';
                  const statusLabel = G_stab >= 0.9 ? '✓ Stabil' : G_stab >= 0.7 ? '⚠ Kritisch' : '✗ Handlungsbedarf';
                  return (
                    <tr key={goalId} style={{ background: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
                      <Td><strong>{goalId}</strong></Td>
                      <Td align="right" style={{ color: '#475569' }}>{refR.toFixed(4)}</Td>
                      <Td align="right" style={{ fontWeight: 700, color: riskColor(G_stab) }}>
                        {anaR.toFixed(4)}
                      </Td>
                      <Td align="center">
                        <StatusBadge variant={statusVariant}>{statusLabel}</StatusBadge>
                      </Td>
                      <Td align="right" style={{ fontWeight: 600, color: diff > 0 ? '#dc2626' : diff < 0 ? '#16a34a' : '#64748b' }}>
                        {diff > 0 ? '+' : ''}{diff.toFixed(4)}
                        {' '}
                        <span style={{ fontSize: 10, opacity: 0.85 }}>
                          ({diffPct > 0 ? '+' : ''}{diffPct.toFixed(1)}%)
                        </span>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Szenario-Abdeckung */}
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1e3a5f', margin: '0 0 8px' }}>
            Szenario-Abdeckung
            <span style={{ fontSize: 11, fontWeight: 400, color: '#64748b', marginLeft: 8 }}>
              {relevantScenarios.length} von {scenarios.length} Szenarien relevant
              {excludedScenarios.length > 0 && (
                <span style={{ color: '#94a3b8' }}>
                  {' '}· {excludedScenarios.length} ausgeschlossen (kein passendes Asset)
                </span>
              )}
            </span>
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ background: '#f1f5f9' }}>
                  <Th>ID</Th>
                  <Th>Technik</Th>
                  <Th>VERIS</Th>
                  <Th align="center">SE</Th>
                  <Th align="center">Gedeckt</Th>
                  <Th>Zugeordnete Massnahmen</Th>
                  <Th align="right">B</Th>
                  <Th align="right">Restrisiko</Th>
                  <Th align="right">Aggregierte Schutzwirkung</Th>
                </tr>
              </thead>
              <tbody>
                {relevantScenarios.map((s, i) => {
                  const cov = gapResult.coverage.find(c => c.scenarioId === s.id)!;
                  const refSR = grenzwertResult.scenarioRisks.find(sr => sr.scenarioId === s.id);
                  const anaSR = gapResult.riskResult.scenarioRisks.find(sr => sr.scenarioId === s.id);
                  const zetaEff = cov.covered
                    ? 1 - cov.matchedControls.reduce((p, c) => p * (1 - c.zeta), 1)
                    : 0;
                  const anaRisk = anaSR?.totalRisk ?? 0;
                  const refRisk = refSR?.totalRisk ?? 0;
                  return (
                    <tr key={s.id} style={{ background: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
                      <Td style={{ fontWeight: 700 }}>{s.id}</Td>
                      <Td>{s.technique}</Td>
                      <Td style={{ color: '#64748b' }}>{s.verisClass}</Td>
                      <Td align="center">
                        <span
                          style={{
                            background: SE_BG[s.securityLayer],
                            color: SE_COLOR[s.securityLayer],
                            padding: '1px 5px',
                            borderRadius: 3,
                            fontWeight: 600,
                            fontSize: 10,
                          }}
                        >
                          {s.securityLayer}
                        </span>
                      </Td>
                      <Td align="center">
                        {cov.covered
                          ? <span style={{ color: '#16a34a', fontWeight: 700 }}>✓</span>
                          : <span style={{ color: '#dc2626', fontWeight: 700 }}>✗</span>}
                      </Td>
                      <Td>
                        {cov.matchedControls.length > 0 ? (
                          <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                            {cov.matchedControls.map(c => (
                              <span
                                key={c.id}
                                title={`ζ = ${c.zeta}`}
                                style={{
                                  background: SE_BG[c.securityLayer],
                                  color: SE_COLOR[c.securityLayer],
                                  padding: '0 4px',
                                  borderRadius: 3,
                                  fontSize: 10,
                                  fontWeight: 500,
                                }}
                              >
                                {c.name.length > 30 ? c.name.slice(0, 29) + '…' : c.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>keine Massnahme</span>
                        )}
                      </Td>
                      <Td align="right" style={{ color: cov.covered ? '#0369a1' : '#94a3b8' }}>
                        {zetaEff.toFixed(3)}
                      </Td>
                      <Td align="right">{refRisk.toFixed(3)}</Td>
                      <Td
                        align="right"
                        style={{ fontWeight: 600, color: anaRisk > refRisk ? '#dc2626' : '#16a34a' }}
                      >
                        {anaRisk.toFixed(3)}
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </SectionBox>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SectionBox({
  title,
  subtitle,
  accent,
  children,
}: {
  title: string;
  subtitle: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        marginBottom: 24,
        border: '1px solid #e2e8f0',
        borderRadius: 10,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid #e2e8f0',
          background: '#f8fafc',
          borderLeft: `4px solid ${accent}`,
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 700, color: accent }}>{title}</div>
        <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{subtitle}</div>
      </div>
      <div style={{ padding: 16 }}>{children}</div>
    </div>
  );
}

function Th({
  children,
  align = 'left',
  style: extra,
}: {
  children?: React.ReactNode;
  align?: 'left' | 'right' | 'center';
  style?: React.CSSProperties;
}) {
  return (
    <th
      style={{
        padding: '6px 8px',
        textAlign: align,
        borderBottom: '2px solid #e2e8f0',
        fontWeight: 600,
        fontSize: 11,
        color: '#475569',
        whiteSpace: 'nowrap',
        ...extra,
      }}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  align = 'left',
  style: extra,
}: {
  children?: React.ReactNode;
  align?: 'left' | 'right' | 'center';
  style?: React.CSSProperties;
}) {
  return (
    <td
      style={{
        padding: '5px 8px',
        textAlign: align,
        borderBottom: '1px solid #f1f5f9',
        verticalAlign: 'middle',
        ...extra,
      }}
    >
      {children}
    </td>
  );
}

function StatusBadge({
  children,
  variant,
}: {
  children: React.ReactNode;
  variant: 'ok' | 'warning' | 'violation';
}) {
  const styles: Record<string, React.CSSProperties> = {
    ok: {
      background: '#f0fdf4',
      color: '#16a34a',
      padding: '2px 7px',
      borderRadius: 4,
      fontSize: 10,
      fontWeight: 600,
    },
    warning: {
      background: '#fff7ed',
      color: '#c2410c',
      padding: '2px 7px',
      borderRadius: 4,
      fontSize: 10,
      fontWeight: 600,
    },
    violation: {
      background: '#fef2f2',
      color: '#dc2626',
      padding: '2px 7px',
      borderRadius: 4,
      fontSize: 10,
      fontWeight: 600,
    },
  };
  return <span style={styles[variant]}>{children}</span>;
}

function ghostBtn(): React.CSSProperties {
  return {
    padding: '4px 12px',
    borderRadius: 6,
    border: '1px solid #d0d5dd',
    background: '#fff',
    color: '#475569',
    cursor: 'pointer',
    fontSize: 11,
  };
}

function microBtn(color: string): React.CSSProperties {
  return {
    padding: '2px 8px',
    borderRadius: 4,
    border: `1px solid ${color}`,
    background: '#fff',
    color,
    cursor: 'pointer',
    fontSize: 10,
    fontWeight: 600,
  };
}
