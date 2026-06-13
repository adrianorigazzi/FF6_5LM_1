/**
 * AssetTypeManager.tsx
 * UI component for browsing asset types (AT_*) with MITRE ATT&CK alignment.
 *
 * Features:
 * - Lists all 17 AssetTypes with their MITRE platform tags
 * - Shows which assets (A*) are assigned to each type
 * - Shows related scenarios per asset type
 * - "MITRE API abfragen" button to fetch live technique metadata
 * - Auslegungsfall badge for extension types
 */

import React, { useState } from 'react';
import { assetTypes } from '../data/assetTypes';
import { assets } from '../data/assets';
import { scenarios } from '../data/scenarios';
import { fetchMitreTechnique } from '../services/mitreApi';
import type { MitreTechniqueInfo } from '../model/types';
import { ASSET_VALUE_MAP } from '../model/types';

interface ApiState {
  status: 'idle' | 'loading' | 'success' | 'error';
  data?: MitreTechniqueInfo;
  error?: string;
}

export default function AssetTypeManager() {
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);
  const [techniqueInput, setTechniqueInput] = useState('');
  const [apiState, setApiState] = useState<ApiState>({ status: 'idle' });

  const selectedType = assetTypes.find((t) => t.id === selectedTypeId);

  // Assets belonging to the selected type
  const typeAssets = selectedType
    ? assets.filter((a) => a.assetTypeId === selectedType.id)
    : [];

  // Scenarios related to the selected type via relatedScenarioIds
  const typeScenarios = selectedType
    ? scenarios.filter((s) => selectedType.relatedScenarioIds.includes(s.id))
    : [];

  async function handleFetchTechnique() {
    const id = techniqueInput.trim();
    if (!id) return;
    setApiState({ status: 'loading' });
    try {
      const info = await fetchMitreTechnique(id);
      setApiState({ status: 'success', data: info });
    } catch (err) {
      setApiState({
        status: 'error',
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800 mb-1">Asset-Typen & MITRE-Alignment</h2>
        <p className="text-sm text-slate-500">
          Asset-Typ-Taxonomie basierend auf MITRE ATT&CK Plattformen. Auslegungsfälle sind
          Erweiterungen über den MITRE-Katalog hinaus (grün markiert).
        </p>
      </div>

      {/* Asset type grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {assetTypes.map((at) => {
          const cardAssets = assets.filter((a) => a.assetTypeId === at.id);
          const isSelected = selectedTypeId === at.id;
          return (
            <button
              key={at.id}
              onClick={() => setSelectedTypeId(isSelected ? null : at.id)}
              className={`text-left rounded-lg border p-3 transition-all ${
                isSelected
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-sm'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-semibold text-slate-800 text-sm">{at.nameDE}</span>
                  <span className="ml-2 text-xs text-slate-400">{at.id}</span>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  {at.isExtension && (
                    <span className="badge badge-green text-xs">Auslegung</span>
                  )}
                </div>
              </div>

              <div className="mt-1 flex flex-wrap gap-1">
                {at.mitrePlatforms.slice(0, 4).map((p) => (
                  <span key={p} className="text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                    {p}
                  </span>
                ))}
                {at.mitrePlatforms.length > 4 && (
                  <span className="text-xs text-slate-400">
                    +{at.mitrePlatforms.length - 4}
                  </span>
                )}
              </div>

              {cardAssets.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-1">
                  {cardAssets.map((a) => (
                    <span
                      key={a.id}
                      className={`text-xs px-1.5 py-0.5 rounded font-mono border ${
                        a.valueCategory === 'kritisch'
                          ? 'bg-red-50 border-red-200 text-red-700'
                          : a.valueCategory === 'hoch'
                          ? 'bg-orange-50 border-orange-200 text-orange-700'
                          : a.valueCategory === 'mittel'
                          ? 'bg-yellow-50 border-yellow-200 text-yellow-700'
                          : 'bg-green-50 border-green-200 text-green-700'
                      }`}
                      title={`${a.name} · ${a.valueCategory} · C_j=${a.C_j.toFixed(1)}`}
                    >
                      {a.id} {a.name}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-xs text-slate-400 italic">Keine Assets zugeordnet</p>
              )}
            </button>
          );
        })}
      </div>

      {/* Detail panel */}
      {selectedType && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-5 space-y-4">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-bold text-blue-900">{selectedType.nameDE}</h3>
            <span className="text-sm text-blue-500">{selectedType.id}</span>
            {selectedType.isExtension && (
              <span className="badge badge-green">Auslegungsfall</span>
            )}
          </div>

          {/* MITRE Platforms */}
          <div>
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
              MITRE ATT&CK Plattformen
            </p>
            <div className="flex flex-wrap gap-1">
              {selectedType.mitrePlatforms.map((p) => (
                <span key={p} className="badge badge-blue">
                  {p}
                </span>
              ))}
            </div>
          </div>

          {/* Assigned assets – same columns as Asset-Wertbeiträge (C_j) */}
          <div>
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
              Zugeordnete Assets – Wertbeiträge (C_j)
            </p>
            {typeAssets.length === 0 ? (
              <p className="text-sm text-slate-400 italic">Keine Assets zugeordnet</p>
            ) : (
              <div className="overflow-x-auto">
                <table style={{ fontSize: 12, width: '100%' }}>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Typ</th>
                      <th>Wertkategorie</th>
                      <th>C_j</th>
                    </tr>
                  </thead>
                  <tbody>
                    {typeAssets.map((a) => {
                      const cj = ASSET_VALUE_MAP[a.valueCategory];
                      return (
                        <tr key={a.id}>
                          <td>{a.id}</td>
                          <td>{a.name}</td>
                          <td>{a.type}</td>
                          <td>
                            <span
                              className={`text-xs font-medium ${
                                a.valueCategory === 'kritisch'
                                  ? 'text-red-600'
                                  : a.valueCategory === 'hoch'
                                  ? 'text-orange-600'
                                  : a.valueCategory === 'mittel'
                                  ? 'text-yellow-700'
                                  : 'text-green-700'
                              }`}
                            >
                              {a.valueCategory}
                            </span>
                          </td>
                          <td><strong>{cj.toFixed(1)}</strong></td>
						</tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Related scenarios */}
          <div>
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
              Relevante Szenarien
            </p>
            {typeScenarios.length === 0 ? (
              <p className="text-sm text-slate-400 italic">Keine direkten Szenario-Zuordnungen</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {typeScenarios.map((s) => (
                  <div
                    key={s.id}
                    className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm"
                  >
                    <span className="font-mono text-xs font-bold text-blue-700 mr-1">{s.id}</span>
                    <span className="text-slate-700">{s.technique}</span>
                    {s.mitreId !== 'Auslegung' ? (
                      <span className="ml-1 text-xs text-slate-400">{s.mitreId}</span>
                    ) : (
                      <span className="ml-1 badge badge-green text-xs">Auslegung</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MITRE API Query Section */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
        <div>
          <h3 className="font-bold text-slate-800">MITRE ATT&CK API – Technikabruf</h3>
          <p className="text-sm text-slate-500 mt-0.5">
            Technik-ID eingeben (z.B. T1566) um Metadaten live abzufragen. Auslegungsfall-Szenarien
            (mitreId = "Auslegung") verwenden keine MITRE-Technik.
          </p>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={techniqueInput}
            onChange={(e) => setTechniqueInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleFetchTechnique()}
            placeholder="z.B. T1566 oder Auslegung"
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            onClick={handleFetchTechnique}
            disabled={apiState.status === 'loading' || !techniqueInput.trim()}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {apiState.status === 'loading' ? 'Lädt…' : 'MITRE API abfragen'}
          </button>
        </div>

        {apiState.status === 'error' && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            <strong>Fehler:</strong> {apiState.error}
          </div>
        )}

        {apiState.status === 'success' && apiState.data && (
          <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div>
                <span className="font-mono text-sm font-bold text-blue-700">
                  {apiState.data.techniqueId}
                </span>
                {apiState.data.isAuslegungsfall && (
                  <span className="ml-2 badge badge-green">Auslegungsfall</span>
                )}
              </div>
              <h4 className="font-semibold text-slate-800">{apiState.data.name}</h4>
            </div>

            {apiState.data.description && (
              <p className="text-sm text-slate-600 line-clamp-4">{apiState.data.description}</p>
            )}

            {apiState.data.platforms.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-500 mb-1">Plattformen</p>
                <div className="flex flex-wrap gap-1">
                  {apiState.data.platforms.map((p) => (
                    <span key={p} className="badge badge-blue">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {apiState.data.tactics.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-500 mb-1">Taktiken</p>
                <div className="flex flex-wrap gap-1">
                  {apiState.data.tactics.map((t) => (
                    <span key={t} className="badge badge-purple">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {apiState.data.suggestedAssetTypeIds.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-500 mb-1">
                  Empfohlene Asset-Typen (aus Plattform-Mapping)
                </p>
                <div className="flex flex-wrap gap-1">
                  {apiState.data.suggestedAssetTypeIds.map((id) => {
                    const at = assetTypes.find((t) => t.id === id);
                    return (
                      <span key={id} className="badge badge-orange">
                        {at ? at.nameDE : id}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            <p className="text-xs text-slate-400">
              Abgerufen: {new Date(apiState.data.fetchedAt).toLocaleString('de-CH')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
