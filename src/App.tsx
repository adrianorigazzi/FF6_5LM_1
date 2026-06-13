/**
 * App.tsx
 * Root component of the 5LM Risk Demonstrator (FF6).
 *
 * Architecture:
 *  - All data loaded from local TS files (no backend, no DB, no AI)
 *  - Model logic in src/model/riskCalculation.ts
 *  - Overrides managed as React state → deterministic recalculation on every change
 *
 * Model chain visualized:
 *   Szenario → Assetwirkung → Dämpfung → Schutzzielverletzung → Risikowert
 */

import React, { useMemo, useState } from 'react';
import { scenarios } from './data/scenarios';
import { assets } from './data/assets';
import { controls } from './data/controls';
import { protectionGoals } from './data/protectionGoals';
import { computeRiskAssessment } from './model/riskCalculation';
import type { ModelOverrides } from './model/types';
import { RiskOverview } from './components/RiskOverview';
import { ScenarioTable } from './components/ScenarioTable';
import { RiskMatrix } from './components/RiskMatrix';
import { ProtectionGoalView } from './components/ProtectionGoalView';
import { SecurityLayerView } from './components/SecurityLayerView';
import { AssetEditor } from './components/AssetEditor';
import AssetTypeManager from './components/AssetTypeManager';
import { AnalyseView } from './components/AnalyseView';
import { LandingPage } from './components/LandingPage';

type AppMode = 'landing' | 'demonstrator' | 'analyse';

const TABS = [
  { id: 'overview',   label: 'Übersicht' },
  { id: 'top10',      label: 'Top-10' },
  { id: 'scenarios',  label: 'Szenarien' },
  { id: 'assets',     label: 'Assets' },
  { id: 'assetTypes', label: 'Asset-Typen' },
  { id: 'layers',     label: 'Sicherheitsebenen' },
  { id: 'goals',      label: 'Schutzziele' },
] as const;

type TabId = (typeof TABS)[number]['id'];

const EMPTY_OVERRIDES: ModelOverrides = {
  impactOverrides: {},
  assetValueOverrides: {},
  zetaOverrides: {},
  gOverrides: {},
};

export default function App() {
  const [appMode, setAppMode] = useState<AppMode>('landing');
  const [tab, setTab] = useState<TabId>('overview');
  const [overrides, setOverrides] = useState<ModelOverrides>(EMPTY_OVERRIDES);

  // True baseline: all 84 controls, no overrides – used as Grenzwert everywhere
  const baselineResult = useMemo(
    () => computeRiskAssessment(scenarios, assets, controls, protectionGoals, EMPTY_OVERRIDES),
    [] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Deterministic recalculation on every override change
  const result = useMemo(
    () => computeRiskAssessment(scenarios, assets, controls, protectionGoals, overrides),
    [overrides]
  );

  const resetOverrides = () => setOverrides(EMPTY_OVERRIDES);

  // ── Landing Page ─────────────────────────────────────────────────────────
  if (appMode === 'landing') {
    return <LandingPage onSelect={setAppMode} />;
  }

  // ── Shared app shell (Demonstrator or Gap-Analyse) ────────────────────────
  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '16px' }}>
      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <h1 style={{ fontSize: 20, color: '#1e3a5f', margin: 0 }}>
            5-Ebenen-IT-Risikomodell (5LM) — Software-Demonstrator FF6
          </h1>
          <button
            onClick={() => setAppMode('landing')}
            style={{
              padding: '5px 14px',
              borderRadius: 6,
              border: '1px solid #d0d5dd',
              background: '#fff',
              color: '#475569',
              cursor: 'pointer',
              fontSize: 12,
              flexShrink: 0,
            }}
          >
            ← Startseite
          </button>
        </div>
        <p style={{ color: '#64748b', fontSize: 12, margin: '4px 0 0' }}>
          Regelbasiertes Artefakt zur IT-Risikobewertung · Keine KI · Keine geschätzten
          Eintrittswahrscheinlichkeiten · Alle Berechnungen deterministisch und reproduzierbar.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
          <span style={{ fontSize: 11, color: '#94a3b8' }}>
            Modus:
          </span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: 4,
              background: appMode === 'demonstrator' ? '#eff6ff' : '#f0fdf4',
              color: appMode === 'demonstrator' ? '#1d4ed8' : '#0f766e',
            }}
          >
            {appMode === 'demonstrator' ? '🔬 Demonstrator' : '🔍 Gap-Analyse'}
          </span>
          {appMode === 'demonstrator' && (
            <button
              onClick={() => setAppMode('analyse')}
              style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, border: '1px solid #0f766e', background: '#f0fdf4', color: '#0f766e', cursor: 'pointer' }}
            >
              → Zur Gap-Analyse wechseln
            </button>
          )}
          {appMode === 'analyse' && (
            <button
              onClick={() => setAppMode('demonstrator')}
              style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, border: '1px solid #1d4ed8', background: '#eff6ff', color: '#1d4ed8', cursor: 'pointer' }}
            >
              → Zum Demonstrator wechseln
            </button>
          )}
        </div>
      </div>

      {/* Navigation – nur im Demonstrator-Modus */}
      {appMode === 'demonstrator' && <div style={{ display: 'flex', gap: 4, marginBottom: 16, flexWrap: 'wrap' }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '6px 16px',
              borderRadius: 6,
              border: '1px solid #d0d5dd',
              background: tab === t.id ? '#1e3a5f' : '#fff',
              color: tab === t.id ? '#fff' : '#1a1a2e',
              fontWeight: tab === t.id ? 700 : 400,
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            {t.label}
          </button>
        ))}
        <button
          onClick={resetOverrides}
          style={{
            padding: '6px 16px',
            borderRadius: 6,
            border: '1px solid #f97316',
            background: '#fff7ed',
            color: '#9a3412',
            cursor: 'pointer',
            fontSize: 13,
            marginLeft: 'auto',
          }}
        >
          Anpassungen zurücksetzen
        </button>
      </div>}

      {/* Tab content – Demonstrator */}
      {appMode === 'demonstrator' && tab === 'overview' && <RiskOverview result={result} />}
      {appMode === 'demonstrator' && tab === 'top10' && <RiskMatrix top10={result.top10Scenarios} scenarios={scenarios} />}
      {appMode === 'demonstrator' && tab === 'scenarios' && (
        <ScenarioTable
          scenarioRisks={result.scenarioRisks}
          scenarios={scenarios}
          overrides={overrides}
          onOverrideChange={setOverrides}
        />
      )}
      {appMode === 'demonstrator' && tab === 'goals' && (
        <ProtectionGoalView goals={protectionGoals} result={result} baselineResult={baselineResult} controls={controls} />
      )}
      {appMode === 'demonstrator' && tab === 'layers' && (
        <SecurityLayerView
          controls={controls}
          scenarioRisks={result.scenarioRisks}
          overrides={overrides}
          onOverrideChange={setOverrides}
        />
      )}
      {appMode === 'demonstrator' && tab === 'assets' && (
        <AssetEditor assets={assets} overrides={overrides} onOverrideChange={setOverrides} />
      )}
      {appMode === 'demonstrator' && tab === 'assetTypes' && <AssetTypeManager />}

      {/* Gap-Analyse-Modus */}
      {appMode === 'analyse' && (
        <AnalyseView
          baselineResult={baselineResult}
          scenarios={scenarios}
          assets={assets}
          controls={controls}
          protectionGoals={protectionGoals}
        />
      )}

      {/* Formula reference footer */}
      <div
        style={{
          marginTop: 24,
          padding: '10px 14px',
          background: '#f1f5f9',
          borderRadius: 8,
          fontSize: 11,
          color: '#475569',
          borderLeft: '3px solid #1e3a5f',
        }}
      >
        <strong>Formelreferenz:</strong>&ensp;
        R(s_i, A_j) = Impact(s_i, A_j) · C_j · (1 − ζ) · G &ensp;|&ensp;
        R(s_i) = Σ_j R(s_i, A_j) &ensp;|&ensp;
        R_total = Σ_i R(s_i) &ensp;|&ensp;
        ζ_eff = 1 − Π_k(1 − ζ_k)
      </div>
    </div>
  );
}
