/**
 * riskCalculation.test.ts
 * Unit tests for the 5LM risk calculation model.
 *
 * Tests verify:
 *  1. Formula (1): R(s_i, A_j) = Impact * C_j * (1 - ζ) * G
 *  2. Formula (2): R(s_i) = Σ_j R(s_i, A_j)
 *  3. Formula (3): R_total = Σ_i R(s_i)
 *  4. Input validation rejects out-of-range values
 *  5. Damping ζ=1.0 yields residual risk 0
 *  6. Multi-control parallel combination: ζ_eff = 1 - Π(1 - ζ_k)
 *  7. VERIS and protection goal aggregation
 *  8. Top-10 ordering
 *  9. Threshold violation detection
 */

import { describe, it, expect } from 'vitest';
import {
  computeRiskContribution,
  computeScenarioRisk,
  computeRiskAssessment,
} from '../src/model/riskCalculation';
import { ASSET_VALUE_MAP, DAMPING_VALUE_MAP } from '../src/model/types';
import type { Scenario, Asset, Control, ProtectionGoal } from '../src/model/types';

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const assetCritical: Asset = {
  id: 'A01',
  name: 'Test Asset Critical',
  type: 'Server',
  valueCategory: 'kritisch',
  C_j: ASSET_VALUE_MAP['kritisch'], // 1.0
};

const assetMedium: Asset = {
  id: 'A02',
  name: 'Test Asset Medium',
  type: 'Client',
  valueCategory: 'mittel',
  C_j: ASSET_VALUE_MAP['mittel'], // 0.4
};

const scenarioSimple: Scenario = {
  id: 'S_TEST',
  mitreId: 'T9999',
  technique: 'Test Technique',
  verisClass: 'Hacking',
  description: 'Test scenario',
  affectedAssetTypes: ['Server'],
  securityLayer: 'SE2',
  G: 0.8,
  impactPerAsset: { A01: 0.5, A02: 0.6 },
  affectedProtectionGoals: ['Vertraulichkeit'],
};

const controlStrong: Control = {
  id: 'C_TEST',
  scenarioId: 'S_TEST',
  name: 'Test Control Strong',
  securityLayer: 'SE2',
  dampingLevel: 'stark',
  zeta: DAMPING_VALUE_MAP['stark'], // 0.7
};

const goalConf: ProtectionGoal = {
  id: 'Vertraulichkeit',
  description: 'Test goal',
  threshold: 1.0,
  relatedScenarioIds: ['S_TEST'],
};

// ---------------------------------------------------------------------------
// 1. Formula (1): R(s_i, A_j) = Impact * C_j * (1 - ζ) * G
// ---------------------------------------------------------------------------

describe('computeRiskContribution – Formula (1)', () => {
  it('computes correct residual risk', () => {
    // R = 0.5 * 1.0 * (1 - 0.7) * 0.8 = 0.5 * 1.0 * 0.3 * 0.8 = 0.12
    const result = computeRiskContribution('S1', 'A1', 0.5, 1.0, 0.7, 0.8);
    expect(result.residualRisk).toBeCloseTo(0.12, 8);
  });

  it('returns zero when ζ = 1.0 (full damping)', () => {
    const result = computeRiskContribution('S1', 'A1', 0.9, 1.0, 1.0, 0.8);
    expect(result.residualRisk).toBe(0);
  });

  it('returns zero when G = 0', () => {
    const result = computeRiskContribution('S1', 'A1', 0.9, 1.0, 0.0, 0.0);
    expect(result.residualRisk).toBe(0);
  });

  it('returns zero when Impact = 0', () => {
    const result = computeRiskContribution('S1', 'A1', 0.0, 1.0, 0.0, 0.8);
    expect(result.residualRisk).toBe(0);
  });

  it('returns max risk when all factors = 1 and ζ = 0', () => {
    // R = 1.0 * 1.0 * 1.0 * 1.0 = 1.0
    const result = computeRiskContribution('S1', 'A1', 1.0, 1.0, 0.0, 1.0);
    expect(result.residualRisk).toBe(1.0);
  });

  it('returns correct values with C_j = 0.4', () => {
    // R = 0.6 * 0.4 * (1 - 0.5) * 0.7 = 0.6 * 0.4 * 0.5 * 0.7 = 0.084
    const result = computeRiskContribution('S1', 'A2', 0.6, 0.4, 0.5, 0.7);
    expect(result.residualRisk).toBeCloseTo(0.084, 8);
  });
});

// ---------------------------------------------------------------------------
// 2. Input validation
// ---------------------------------------------------------------------------

describe('computeRiskContribution – Validation', () => {
  it('throws when Impact > 1', () => {
    expect(() => computeRiskContribution('S1', 'A1', 1.1, 1.0, 0.0, 0.8)).toThrow(RangeError);
  });

  it('throws when Impact < 0', () => {
    expect(() => computeRiskContribution('S1', 'A1', -0.1, 1.0, 0.0, 0.8)).toThrow(RangeError);
  });

  it('throws when G > 1', () => {
    expect(() => computeRiskContribution('S1', 'A1', 0.5, 1.0, 0.0, 1.1)).toThrow(RangeError);
  });

  it('throws when C_j is not an allowed value', () => {
    expect(() => computeRiskContribution('S1', 'A1', 0.5, 0.3, 0.0, 0.8)).toThrow(RangeError);
  });

  it('throws when ζ_eff > 1 (out of unit interval)', () => {
    expect(() => computeRiskContribution('S1', 'A1', 0.5, 1.0, 1.1, 0.8)).toThrow(RangeError);
  });
});

// ---------------------------------------------------------------------------
// 3. Formula (2): R(s_i) = Σ_j R(s_i, A_j)
// ---------------------------------------------------------------------------

describe('computeScenarioRisk – Formula (2)', () => {
  it('sums contributions across assets correctly', () => {
    const sr = computeScenarioRisk(
      scenarioSimple,
      [assetCritical, assetMedium],
      [controlStrong]
    );
    // ζ_eff from one strong control = 0.7
    // A01: 0.5 * 1.0 * (1-0.7) * 0.8 = 0.12
    // A02: 0.6 * 0.4 * (1-0.7) * 0.8 = 0.0576
    // R(S_TEST) = 0.12 + 0.0576 = 0.1776
    expect(sr.totalRisk).toBeCloseTo(0.1776, 6);
    expect(sr.contributions).toHaveLength(2);
  });

  it('applies no damping when no control exists', () => {
    const sr = computeScenarioRisk(
      scenarioSimple,
      [assetCritical, assetMedium],
      [] // no controls
    );
    // ζ_eff = 0
    // A01: 0.5 * 1.0 * 1.0 * 0.8 = 0.4
    // A02: 0.6 * 0.4 * 1.0 * 0.8 = 0.192
    expect(sr.totalRisk).toBeCloseTo(0.592, 6);
  });
});

// ---------------------------------------------------------------------------
// 4. Multi-control parallel ζ combination
// ---------------------------------------------------------------------------

describe('Parallel control combination: ζ_eff = 1 - Π(1 - ζ_k)', () => {
  it('combines two controls correctly', () => {
    // ζ1 = 0.7 (stark), ζ2 = 0.5 (mittel)
    // ζ_eff = 1 - (1-0.7)*(1-0.5) = 1 - 0.3*0.5 = 1 - 0.15 = 0.85
    const ctrl2: Control = {
      id: 'C_TEST2',
      scenarioId: 'S_TEST',
      name: 'Second Control',
      securityLayer: 'SE2',
      dampingLevel: 'mittel',
      zeta: 0.5,
    };
    const sr = computeScenarioRisk(
      scenarioSimple,
      [assetCritical],
      [controlStrong, ctrl2]
    );
    const expectedZeta = 1 - (1 - 0.7) * (1 - 0.5); // 0.85
    const expectedRisk = 0.5 * 1.0 * (1 - expectedZeta) * 0.8; // 0.5 * 1.0 * 0.15 * 0.8 = 0.06
    expect(sr.contributions[0].zeta).toBeCloseTo(0.85, 4);
    expect(sr.contributions[0].residualRisk).toBeCloseTo(expectedRisk, 6);
  });
});

// ---------------------------------------------------------------------------
// 5. Formula (3): R_total + aggregations
// ---------------------------------------------------------------------------

describe('computeRiskAssessment – Full aggregation', () => {
  const scenario2: Scenario = {
    id: 'S_TEST2',
    mitreId: 'T8888',
    technique: 'Test2',
    verisClass: 'Malware',
    description: 'Second test scenario',
    affectedAssetTypes: ['Server'],
    securityLayer: 'SE3',
    G: 0.5,
    impactPerAsset: { A01: 0.8 },
    affectedProtectionGoals: ['Integrität'],
  };

  const goalInt: ProtectionGoal = {
    id: 'Integrität',
    description: 'Test',
    threshold: 0.05,
    relatedScenarioIds: ['S_TEST2'],
  };

  it('aggregates R_total correctly', () => {
    const r = computeRiskAssessment(
      [scenarioSimple, scenario2],
      [assetCritical, assetMedium],
      [controlStrong],
      [goalConf, goalInt]
    );
    // R(S_TEST) = 0.1776 (verified above)
    // R(S_TEST2): no control → ζ=0; 0.8 * 1.0 * 1.0 * 0.5 = 0.4
    // R_total = 0.1776 + 0.4 = 0.5776
    expect(r.totalRisk).toBeCloseTo(0.5776, 4);
  });

  it('aggregates by VERIS class', () => {
    const r = computeRiskAssessment(
      [scenarioSimple, scenario2],
      [assetCritical, assetMedium],
      [controlStrong],
      [goalConf, goalInt]
    );
    expect(r.riskByVERIS['Hacking']).toBeCloseTo(0.1776, 4);
    expect(r.riskByVERIS['Malware']).toBeCloseTo(0.4, 6);
  });

  it('detects threshold violations', () => {
    const r = computeRiskAssessment(
      [scenarioSimple, scenario2],
      [assetCritical, assetMedium],
      [controlStrong],
      [goalConf, goalInt] // goalInt threshold = 0.05, but R(S_TEST2) = 0.4 → violation
    );
    expect(r.thresholdViolations).toContain('Integrität');
    expect(r.thresholdViolations).not.toContain('Vertraulichkeit'); // threshold 1.0 > 0.1776
  });

  it('returns top-10 sorted by descending risk', () => {
    const r = computeRiskAssessment(
      [scenarioSimple, scenario2],
      [assetCritical, assetMedium],
      [controlStrong],
      [goalConf, goalInt]
    );
    expect(r.top10Scenarios[0].totalRisk).toBeGreaterThanOrEqual(
      r.top10Scenarios[1]?.totalRisk ?? 0
    );
  });
});

// ---------------------------------------------------------------------------
// 6. ASSET_VALUE_MAP and DAMPING_VALUE_MAP correctness
// ---------------------------------------------------------------------------

describe('Domain constant maps', () => {
  it('ASSET_VALUE_MAP has correct values', () => {
    expect(ASSET_VALUE_MAP['kritisch']).toBe(1.0);
    expect(ASSET_VALUE_MAP['hoch']).toBe(0.7);
    expect(ASSET_VALUE_MAP['mittel']).toBe(0.4);
    expect(ASSET_VALUE_MAP['niedrig']).toBe(0.1);
  });

  it('DAMPING_VALUE_MAP has correct values', () => {
    expect(DAMPING_VALUE_MAP['keine']).toBe(0.0);
    expect(DAMPING_VALUE_MAP['schwach']).toBe(0.2);
    expect(DAMPING_VALUE_MAP['mittel']).toBe(0.5);
    expect(DAMPING_VALUE_MAP['stark']).toBe(0.7);
    expect(DAMPING_VALUE_MAP['sehr stark']).toBe(0.9);
    expect(DAMPING_VALUE_MAP['vollständig']).toBe(1.0);
  });
});
