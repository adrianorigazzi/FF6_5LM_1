/**
 * RiskMatrix.tsx
 * Top-10 scenarios ranked by residual risk with a horizontal bar chart.
 */

import React from 'react';
import type { ScenarioRisk, Scenario } from '../model/types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LabelList,
  Cell,
} from 'recharts';

interface Props {
  top10: ScenarioRisk[];
  scenarios: Scenario[];
}

const RISK_COLORS = ['#b91c1c', '#dc2626', '#ef4444', '#f97316', '#fb923c',
                     '#fbbf24', '#facc15', '#a3e635', '#4ade80', '#86efac'];

export const RiskMatrix: React.FC<Props> = ({ top10, scenarios }) => {
  const data = top10.map((sr, i) => {
    const scen = scenarios.find((s) => s.id === sr.scenarioId);
    return {
      name: `${sr.scenarioId} – ${scen?.technique ?? ''}`,
      risk: Math.round(sr.totalRisk * 10000) / 10000,
      color: RISK_COLORS[i] ?? '#94a3b8',
    };
  });

  return (
    <div className="card">
      <div className="card-title">Top-10 Szenarien nach residualem Risiko</div>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 80, left: 180, bottom: 4 }}
        >
          <XAxis type="number" tick={{ fontSize: 11 }} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={180} />
          <Tooltip formatter={(v: number) => v.toFixed(4)} />
          <Bar dataKey="risk" radius={[0, 4, 4, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
            <LabelList dataKey="risk" position="right" formatter={(v: number) => v.toFixed(4)} style={{ fontSize: 11 }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
