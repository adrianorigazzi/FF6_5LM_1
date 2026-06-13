/**
 * ScenarioTable.tsx
 * Displays all scenarios with residual risk, VERIS class, security layer,
 * and per-asset contributions. Supports inline editing of G and impact values.
 */

import React, { useState } from 'react';
import type { ScenarioRisk, Scenario, ModelOverrides } from '../model/types';

interface Props {
  scenarioRisks: ScenarioRisk[];
  scenarios: Scenario[];
  overrides: ModelOverrides;
  onOverrideChange: (next: ModelOverrides) => void;
}

const SE_COLORS: Record<string, string> = {
  SE1: 'badge badge-green',
  SE2: 'badge badge-blue',
  SE3: 'badge badge-yellow',
  SE4: 'badge badge-orange',
  SE5: 'badge badge-red',
};

const VERIS_COLORS: Record<string, string> = {
  Hacking: 'badge badge-blue',
  Malware: 'badge badge-red',
  'Social Engineering': 'badge badge-yellow',
  Misuse: 'badge badge-purple',
  Physical: 'badge badge-green',
  Error: 'badge badge-gray',
  Environmental: 'badge badge-gray',
};

function riskColor(r: number): string {
  if (r > 1.5) return '#b91c1c';
  if (r > 0.8) return '#d97706';
  if (r > 0.3) return '#ca8a04';
  return '#166534';
}

export const ScenarioTable: React.FC<Props> = ({
  scenarioRisks,
  scenarios,
  overrides,
  onOverrideChange,
}) => {
  const [expanded, setExpanded] = useState<string | null>(null);

  const handleGChange = (scenarioId: string, val: string) => {
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 0 && num <= 1) {
      onOverrideChange({
        ...overrides,
        gOverrides: { ...overrides.gOverrides, [scenarioId]: num },
      });
    }
  };

  const handleImpactChange = (scenarioId: string, assetId: string, val: string) => {
    const num = parseFloat(val);
    const key = `${scenarioId}__${assetId}`;
    if (!isNaN(num) && num >= 0 && num <= 1) {
      onOverrideChange({
        ...overrides,
        impactOverrides: { ...overrides.impactOverrides, [key]: num },
      });
    }
  };

  const sorted = [...scenarioRisks].sort((a, b) => b.totalRisk - a.totalRisk);

  return (
    <div className="card">
      <div className="card-title">Szenario-Risikotabelle</div>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Technik</th>
            <th>VERIS</th>
            <th>SE</th>
            <th>G</th>
            <th>R(s_i)</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((sr) => {
            const scenario = scenarios.find((s) => s.id === sr.scenarioId)!;
            const currentG =
              overrides.gOverrides[sr.scenarioId] !== undefined
                ? overrides.gOverrides[sr.scenarioId]
                : scenario.G;
            return (
              <React.Fragment key={sr.scenarioId}>
                <tr>
                  <td><strong>{sr.scenarioId}</strong></td>
                  <td style={{ maxWidth: 220 }}>{scenario.technique}</td>
                  <td><span className={VERIS_COLORS[sr.verisClass] ?? 'badge badge-gray'}>{sr.verisClass}</span></td>
                  <td><span className={SE_COLORS[sr.securityLayer] ?? 'badge'}>{sr.securityLayer}</span></td>
                  <td>
                    <input
                      type="range"
                      min={0} max={1} step={0.05}
                      value={currentG}
                      onChange={(e) => handleGChange(sr.scenarioId, e.target.value)}
                      title={`G = ${currentG.toFixed(2)}`}
                    />
                    <span style={{ marginLeft: 4, fontSize: 11 }}>{currentG.toFixed(2)}</span>
                  </td>
                  <td style={{ fontWeight: 700, color: riskColor(sr.totalRisk) }}>
                    {sr.totalRisk.toFixed(4)}
                  </td>
                  <td>
                    <button
                      style={{ fontSize: 11, padding: '2px 8px', cursor: 'pointer' }}
                      onClick={() => setExpanded(expanded === sr.scenarioId ? null : sr.scenarioId)}
                    >
                      {expanded === sr.scenarioId ? '▲ Einklappen' : '▼ Aufklappen'}
                    </button>
                  </td>
                </tr>
                {expanded === sr.scenarioId && (
                  <tr>
                    <td colSpan={7} style={{ background: '#f8fafc', padding: 12 }}>
                      <div style={{ marginBottom: 6, fontSize: 12, color: '#475569' }}>
                        {scenario.description}
                      </div>
                      <table style={{ fontSize: 12 }}>
                        <thead>
                          <tr>
                            <th>Asset</th>
                            <th>Impact</th>
                            <th>C_j</th>
                            <th>ζ</th>
                            <th>G</th>
                            <th>R(s_i, A_j)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sr.contributions.map((c) => {
                            const impKey = `${sr.scenarioId}__${c.assetId}`;
                            const currentImpact =
                              overrides.impactOverrides[impKey] !== undefined
                                ? overrides.impactOverrides[impKey]
                                : c.impact;
                            return (
                              <tr key={c.assetId}>
                                <td>{c.assetId}</td>
                                <td>
                                  <input
                                    type="range"
                                    min={0} max={1} step={0.05}
                                    value={currentImpact}
                                    onChange={(e) =>
                                      handleImpactChange(sr.scenarioId, c.assetId, e.target.value)
                                    }
                                    title={`Impact = ${currentImpact.toFixed(2)}`}
                                  />
                                  <span style={{ marginLeft: 4 }}>{currentImpact.toFixed(2)}</span>
                                </td>
                                <td>{c.C_j.toFixed(1)}</td>
                                <td>{c.zeta.toFixed(4)}</td>
                                <td>{c.G.toFixed(2)}</td>
                                <td style={{ fontWeight: 700, color: riskColor(c.residualRisk) }}>
                                  {c.residualRisk.toFixed(4)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
