/**
 * SecurityLayerView.tsx
 * L2 – Sicherheitsebene: Shows controls per security layer with editable ζ values.
 * Also shows aggregated risk per security layer.
 */

import React from 'react';
import type { Control, ScenarioRisk, ModelOverrides } from '../model/types';
import { DAMPING_VALUE_MAP } from '../model/types';

interface Props {
  controls: Control[];
  scenarioRisks: ScenarioRisk[];
  overrides: ModelOverrides;
  onOverrideChange: (next: ModelOverrides) => void;
}

const LAYERS = ['SE1', 'SE2', 'SE3', 'SE4', 'SE5'] as const;
const LAYER_LABELS: Record<string, string> = {
  SE1: 'SE1 – Normalbetrieb',
  SE2: 'SE2 – Betriebsstörung',
  SE3: 'SE3 – Auslegungsstörfälle',
  SE4: 'SE4 – Auslegungsüberschreitend',
  SE5: 'SE5 – Schwere Störfälle',
};
const LAYER_FUNCTIONS: Record<string, string> = {
  SE1: 'IAM · MFA · PAM · Verschlüsselung · Logging · Monitoring',
  SE2: 'Intrusion Detection · Zugriffskontrolle · Segmentierung · PAM',
  SE3: 'Redundanz · PAM-SR · DLP · Netzwerkisolation',
  SE4: 'Backup · Disaster Recovery · Incident Response',
  SE5: 'Notfallmanagement · Wiederanlaufprozesse · Business Continuity',
};

export const SecurityLayerView: React.FC<Props> = ({
  controls,
  scenarioRisks,
  overrides,
  onOverrideChange,
}) => {
  const handleZetaChange = (controlId: string, val: string) => {
    const dl = val as Control['dampingLevel'];
    if (dl in DAMPING_VALUE_MAP) {
      onOverrideChange({
        ...overrides,
        zetaOverrides: { ...overrides.zetaOverrides, [controlId]: dl },
      });
    }
  };

  // Aggregate risk per layer from scenario assignments
  const riskPerLayer: Record<string, number> = {};
  for (const layer of LAYERS) {
    riskPerLayer[layer] = scenarioRisks
      .filter((sr) => sr.securityLayer === layer)
      .reduce((s, sr) => s + sr.totalRisk, 0);
  }

  return (
    <div className="card">
      <div className="card-title">Sicherheitsebenen SE1–SE5 – Schutzmassnahmen und ζ-Anpassung (L2)</div>
      {LAYERS.map((layer) => {
        const layerControls = controls.filter((c) => c.securityLayer === layer);
        return (
          <div key={layer} style={{ marginBottom: 16 }}>
            <div
              style={{
                fontWeight: 700,
                fontSize: 13,
                marginBottom: 2,
                color: '#1e3a5f',
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <span>{LAYER_LABELS[layer]}</span>
              <span style={{ color: '#64748b', fontWeight: 400 }}>
                R(SE) = {riskPerLayer[layer].toFixed(4)}
              </span>
            </div>
            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6 }}>
              {LAYER_FUNCTIONS[layer]}
            </div>
            {layerControls.length === 0 ? (
              <p style={{ color: '#94a3b8', fontSize: 12 }}>Keine Massnahmen dieser Ebene.</p>
            ) : (
              <table style={{ fontSize: 12 }}>
                <thead>
                  <tr>
                    <th>Massnahme</th>
                    <th>Szenario</th>
                    <th>ζ (Dämpfungsebene)</th>
                    <th>ζ-Wert</th>
                  </tr>
                </thead>
                <tbody>
                  {layerControls.map((ctrl) => {
                    const currentDL =
                      overrides.zetaOverrides[ctrl.id] !== undefined
                        ? overrides.zetaOverrides[ctrl.id]
                        : ctrl.dampingLevel;
                    const currentZeta = DAMPING_VALUE_MAP[currentDL];
                    return (
                      <tr key={ctrl.id}>
                        <td>{ctrl.name}</td>
                        <td>{ctrl.scenarioId}</td>
                        <td>
                          <select
                            value={currentDL}
                            onChange={(e) => handleZetaChange(ctrl.id, e.target.value)}
                          >
                            {Object.keys(DAMPING_VALUE_MAP).map((dl) => (
                              <option key={dl} value={dl}>{dl}</option>
                            ))}
                          </select>
                        </td>
                        <td>{currentZeta.toFixed(1)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        );
      })}
    </div>
  );
};
