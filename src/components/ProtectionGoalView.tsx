/**
 * ProtectionGoalView.tsx
 * L3 – Schutzzielebene: Visualizes protection goal risks, threshold violations,
 * Teilschutzziele, Schutzzielfunktionen and mapped controls (Massnahmen).
 */

import React, { useState } from 'react';
import type { ProtectionGoal, RiskAssessmentResult, Control } from '../model/types';

interface Props {
  goals: ProtectionGoal[];
  result: RiskAssessmentResult;
  baselineResult: RiskAssessmentResult;
  controls: Control[];
}

function pct(value: number, threshold: number): number {
  return Math.round((value / threshold) * 100);
}

function barColor(p: number): string {
  if (p > 180) return '#b91c1c';  // > 80% über Grenzwert → rot
  if (p > 100) return '#f97316';  // bis 80% über Grenzwert → orange
  return '#4ade80';               // Grenzwert erreicht oder unterschritten → grün
}

function stabilColor(p: number): string {
  if (p > 180) return '#dc2626';
  if (p > 100) return '#f97316';
  return '#16a34a';
}

const SE_COLORS: Record<string, string> = {
  SE1: '#e0f2fe',
  SE2: '#fef3c7',
  SE3: '#ede9fe',
  SE4: '#fce7f3',
  SE5: '#dcfce7',
};
const SE_TEXT: Record<string, string> = {
  SE1: '#0369a1',
  SE2: '#92400e',
  SE3: '#5b21b6',
  SE4: '#9d174d',
  SE5: '#166534',
};

export const ProtectionGoalView: React.FC<Props> = ({ goals, result, baselineResult, controls }) => {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggle = (id: string) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div>
      {/* ── Section 1: Risk overview table ──────────────────────────────── */}
      <div className="card">
        <div className="card-title">Schutzziele – Risikobelastung und Grenzwerte (L3)</div>
        <table>
          <thead>
            <tr>
              <th>Schutzziel</th>
              <th>Beschreibung</th>
              <th title="Restrisiko mit aktuellen Einstellungen (eingesetzte Massnahmen)">Stabilisierungswert</th>
              <th title="Restrisiko bei vollständigem Einsatz aller Massnahmen (keine Overrides)">Grenzwert (R_Ref)</th>
              <th>Auslastung</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {goals.map((goal) => {
              const risk = result.riskByProtectionGoal[goal.id] ?? 0;
              const grenzwert = baselineResult.riskByProtectionGoal[goal.id] ?? goal.threshold;
              const p = pct(risk, grenzwert > 0 ? grenzwert : 1);
              const violated = grenzwert > 0 ? p > 180 : false;
              const kritisch = grenzwert > 0 ? (p > 100 && p <= 180) : false;
              return (
                <tr key={goal.id}>
                  <td><strong>{goal.id}</strong></td>
                  <td style={{ maxWidth: 300, fontSize: 12 }}>{goal.description}</td>
                  <td style={{ fontWeight: 600, color: stabilColor(p) }}>{risk.toFixed(4)}</td>
                  <td>{grenzwert.toFixed(4)}</td>
                  <td style={{ minWidth: 140 }}>
                    <div
                      style={{
                        height: 14,
                        background: '#e5e7eb',
                        borderRadius: 7,
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${Math.min(100, p)}%`,
                          height: '100%',
                          background: barColor(p),
                          transition: 'width 0.3s',
                        }}
                      />
                    </div>
                    <span style={{ fontSize: 11, color: '#475569' }}>{p}%</span>
                  </td>
                  <td>
                    {violated ? (
                      <span className="violation">⚠ Überschritten</span>
                    ) : kritisch ? (
                      <span style={{ color: '#c2410c', fontWeight: 600 }}>⚠ Kritisch</span>
                    ) : (
                      <span className="ok">✓ Stabil</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Section 2: Teilschutzziele & Schutzzielfunktionen ───────────── */}
      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-title">
          Teilschutzziele und Schutzzielfunktionen – Massnahmenzuordnung (L2 → L3)
        </div>
        <p style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>
          Jede Schutzzielfunktion ist mit den Massnahmen aus den Sicherheitsebenen SE1–SE5 verknüpft.
          Klicken Sie auf ein Schutzziel, um die Zuordnung aufzuklappen.
        </p>

        {goals.map((goal) => {
          const isOpen = !!expanded[goal.id];
          return (
            <div
              key={goal.id}
              style={{
                marginBottom: 10,
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                overflow: 'hidden',
              }}
            >
              {/* Collapsible header */}
              <button
                onClick={() => toggle(goal.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 14px',
                  background: isOpen ? '#1e3a5f' : '#f8fafc',
                  color: isOpen ? '#fff' : '#1e3a5f',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: 13,
                  textAlign: 'left',
                }}
              >
                <span>{goal.id}</span>
                <span style={{ fontSize: 16 }}>{isOpen ? '▲' : '▼'}</span>
              </button>

              {/* Expanded content */}
              {isOpen && (
                <div style={{ padding: '10px 14px' }}>
                  {goal.subGoals.map((sub) => (
                    <div key={sub.name} style={{ marginBottom: 12 }}>
                      {/* Teilschutzziel label */}
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: 12,
                          color: '#334155',
                          marginBottom: 4,
                          paddingLeft: 4,
                          borderLeft: '3px solid #1e3a5f',
                        }}
                      >
                        {sub.name}
                      </div>

                      {sub.functions.map((fn, fi) => {
                        const fnControls = fn.controlIds
                          .map((cid) => controls.find((c) => c.id === cid))
                          .filter(Boolean) as Control[];

                        return (
                          <div
                            key={fi}
                            style={{
                              marginLeft: 12,
                              marginBottom: 6,
                            }}
                          >
                            {/* Schutzzielfunktion */}
                            <div
                              style={{
                                fontSize: 11,
                                fontStyle: 'italic',
                                color: '#475569',
                                marginBottom: 4,
                              }}
                            >
                              Schutzzielfunktion: <strong>{fn.name}</strong>
                            </div>

                            {/* Mapped controls as badges */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                              {fnControls.map((ctrl) => (
                                <span
                                  key={ctrl.id}
                                  title={`Szenario: ${ctrl.scenarioId} | ζ: ${ctrl.zeta.toFixed(1)}`}
                                  style={{
                                    display: 'inline-block',
                                    padding: '2px 7px',
                                    borderRadius: 4,
                                    fontSize: 10,
                                    background: SE_COLORS[ctrl.securityLayer] ?? '#f1f5f9',
                                    color: SE_TEXT[ctrl.securityLayer] ?? '#334155',
                                    border: `1px solid ${SE_TEXT[ctrl.securityLayer] ?? '#94a3b8'}`,
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  [{ctrl.securityLayer}] {ctrl.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
