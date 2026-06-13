/**
 * RiskOverview.tsx
 * L4 – Bewertungsebene: Summary of total risk, VERIS distribution, threshold violations.
 */

import React from 'react';
import type { RiskAssessmentResult } from '../model/types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface Props {
  result: RiskAssessmentResult;
}

const VERIS_COLORS: Record<string, string> = {
  Hacking: '#3b82f6',
  Malware: '#ef4444',
  'Social Engineering': '#f59e0b',
  Misuse: '#8b5cf6',
  Physical: '#10b981',
  Error: '#6b7280',
  Environmental: '#84cc16',
};

function riskLevel(r: number): { label: string; cls: string } {
  if (r > 8) return { label: 'Kritisch', cls: 'badge badge-red' };
  if (r > 5) return { label: 'Hoch', cls: 'badge badge-orange' };
  if (r > 2.5) return { label: 'Mittel', cls: 'badge badge-yellow' };
  return { label: 'Niedrig', cls: 'badge badge-green' };
}

export const RiskOverview: React.FC<Props> = ({ result }) => {
  const level = riskLevel(result.totalRisk);

  const verisData = Object.entries(result.riskByVERIS)
    .map(([cls, val]) => ({ name: cls, value: Math.round(val * 1000) / 1000 }))
    .sort((a, b) => b.value - a.value);

  const goalData = Object.entries(result.riskByProtectionGoal)
    .map(([goal, val]) => ({ name: goal, value: Math.round(val * 1000) / 1000 }))
    .sort((a, b) => b.value - a.value);

  return (
    <div>
      {/* Total risk KPI */}
      <div className="card">
        <div className="card-title">Gesamtrisiko R_total</div>
        <p style={{ fontSize: 28, fontWeight: 800, color: '#1e3a5f', margin: '4px 0' }}>
          {result.totalRisk.toFixed(4)}
          <span style={{ fontSize: 14, fontWeight: 400, marginLeft: 10 }}>
            <span className={level.cls}>{level.label}</span>
          </span>
        </p>
        <p style={{ color: '#64748b', fontSize: 12 }}>
          Formel: R_total = Σ_i R(s_i) &nbsp;|&nbsp; Szenarien: {result.scenarioRisks.length} &nbsp;|&nbsp;
          Schwellenwert-Verletzungen: {result.thresholdViolations.length}
        </p>
        {result.thresholdViolations.length > 0 && (
          <p className="violation">
            ⚠ Grenzwertüberschreitung: {result.thresholdViolations.join(', ')}
          </p>
        )}
      </div>

      <div className="grid-2">
        {/* Risk by VERIS */}
        <div className="card">
          <div className="card-title">Risiko je VERIS-Klasse</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={verisData} margin={{ top: 4, right: 8, left: 0, bottom: 55 }}>
              <XAxis
                dataKey="name"
                interval={0}
                angle={-35}
                textAnchor="end"
                tick={{ fontSize: 10 }}
              />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => v.toFixed(4)} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {verisData.map((entry) => (
                  <Cell key={entry.name} fill={VERIS_COLORS[entry.name] ?? '#94a3b8'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Risk by protection goal */}
        <div className="card">
          <div className="card-title">Risiko je Schutzziel</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={goalData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => v.toFixed(4)} />
              <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
