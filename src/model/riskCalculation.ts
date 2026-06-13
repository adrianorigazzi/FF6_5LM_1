/**
 * riskCalculation.ts
 * Core risk calculation logic for the 5-Layer IT Risk Model (5LM).
 *
 * Model chain:  Störung → Systemzustand → Stabilisierung → Zielverletzung → Bewertung
 *
 * Formulas (strictly preserved):
 *
 *   (1) Residual risk contribution per scenario-asset pair:
 *       R(s_i, A_j) = Impact(s_i, A_j) * C_j * (1 - ζ) * G
 *
 *   (2) Aggregated risk per scenario:
 *       R(s_i) = Σ_j  R(s_i, A_j)
 *
 *   (3) Total risk:
 *       R_total = Σ_i  R(s_i)
 *
 * All inputs are validated before computation.
 * No generative AI, no estimated probabilities, no black-box logic.
 */

import type {
  Scenario,
  Asset,
  Control,
  ProtectionGoal,
  RiskContribution,
  ScenarioRisk,
  RiskAssessmentResult,
  VERISClass,
  ProtectionGoalId,
  ModelOverrides,
} from './types';
import { ASSET_VALUE_MAP, DAMPING_VALUE_MAP } from './types';
import {
  validateImpact,
  validateG,
  validateCj,
  validateUnitInterval,
} from './validation';

// ---------------------------------------------------------------------------
// Step 1 – Compute R(s_i, A_j) for one (scenario, asset) pair
// ---------------------------------------------------------------------------

/**
 * Computes the residual risk contribution for a single (scenario, asset) pair.
 *
 * Formula (1): R(s_i, A_j) = Impact(s_i, A_j) * C_j * (1 - ζ) * G
 *
 * @param scenarioId  Identifier of scenario s_i
 * @param assetId     Identifier of asset A_j
 * @param impact      Impact(s_i, A_j) ∈ [0,1]
 * @param C_j         Economic contribution C_j ∈ {0.1, 0.4, 0.7, 1.0}
 * @param zeta        Damping coefficient ζ ∈ {0.0, 0.2, 0.5, 0.7, 0.9, 1.0}
 * @param G           Threat relevance weight G ∈ [0,1]
 */
export function computeRiskContribution(
  scenarioId: string,
  assetId: string,
  impact: number,
  C_j: number,
  zeta: number,
  G: number
): RiskContribution {
  // Validate all inputs before any calculation.
  // Note: zeta here is the *effective* ζ_eff ∈ [0,1], which may be a
  // derived parallel-combination value and is not restricted to discrete levels.
  const validImpact = validateImpact(impact, scenarioId, assetId);
  const validCj = validateCj(C_j, assetId);
  const validZeta = validateUnitInterval(zeta, `ζ_eff(${scenarioId}__${assetId})`);
  const validG = validateG(G, scenarioId);

  // Formula (1): R(s_i, A_j) = Impact * C_j * (1 - ζ) * G
  const residualRisk = validImpact * validCj * (1 - validZeta) * validG;

  return {
    scenarioId,
    assetId,
    impact: validImpact,
    C_j: validCj,
    zeta: validZeta,
    G: validG,
    residualRisk,
  };
}

// ---------------------------------------------------------------------------
// Step 2 – Aggregate R(s_i) for one scenario across all its assets
// ---------------------------------------------------------------------------

/**
 * Computes the aggregated residual risk for a single scenario.
 *
 * Formula (2): R(s_i) = Σ_j  R(s_i, A_j)
 *
 * Only assets that appear in scenario.impactPerAsset are considered.
 */
export function computeScenarioRisk(
  scenario: Scenario,
  assets: Asset[],
  controls: Control[],
  overrides?: ModelOverrides
): ScenarioRisk {
  const contributions: RiskContribution[] = [];

  // Determine effective G (may be overridden via UI)
  const effectiveG =
    overrides?.gOverrides[scenario.id] !== undefined
      ? overrides.gOverrides[scenario.id]
      : scenario.G;

  // Resolve damping ζ: take the control assigned to this scenario (if any)
  // Multiple controls per scenario are aggregated as: ζ_eff = 1 - Π(1 - ζ_k)
  // (parallel protection combination – each control independently reduces residual risk)
  const scenarioControls = controls.filter((c) => c.scenarioId === scenario.id);

  let effectiveZeta: number;
  if (scenarioControls.length === 0) {
    effectiveZeta = 0.0; // No control → no damping
  } else {
    // Parallel combination: ζ_eff = 1 - Π_k (1 - ζ_k)
    const product = scenarioControls.reduce((acc, ctrl) => {
      const zetaValue =
        overrides?.zetaOverrides[ctrl.id] !== undefined
          ? DAMPING_VALUE_MAP[overrides.zetaOverrides[ctrl.id]]
          : ctrl.zeta;
      return acc * (1 - zetaValue);
    }, 1);
    effectiveZeta = 1 - product;
    // Clamp to allowed max (1.0)
    effectiveZeta = Math.min(1.0, effectiveZeta);
    // Round to 4 decimals to avoid floating-point drift
    effectiveZeta = Math.round(effectiveZeta * 10000) / 10000;
  }

  for (const assetId of Object.keys(scenario.impactPerAsset)) {
    const asset = assets.find((a) => a.id === assetId);
    if (!asset) continue; // Skip if asset definition not found

    // Determine effective impact (may be overridden)
    const impactKey = `${scenario.id}__${assetId}`;
    const impact =
      overrides?.impactOverrides[impactKey] !== undefined
        ? overrides.impactOverrides[impactKey]
        : scenario.impactPerAsset[assetId];

    // Determine effective C_j (may be overridden)
    const valueCategory =
      overrides?.assetValueOverrides[assetId] !== undefined
        ? overrides.assetValueOverrides[assetId]
        : asset.valueCategory;
    const C_j = ASSET_VALUE_MAP[valueCategory];

    const contribution = computeRiskContribution(
      scenario.id,
      assetId,
      impact,
      C_j,
      effectiveZeta,
      effectiveG
    );
    contributions.push(contribution);
  }

  // Formula (2): R(s_i) = Σ_j R(s_i, A_j)
  const totalRisk = contributions.reduce((sum, c) => sum + c.residualRisk, 0);

  return {
    scenarioId: scenario.id,
    verisClass: scenario.verisClass,
    securityLayer: scenario.securityLayer,
    contributions,
    totalRisk,
  };
}

// ---------------------------------------------------------------------------
// Step 3 – Full model aggregation
// ---------------------------------------------------------------------------

/**
 * Runs the complete 5LM risk assessment.
 *
 * Formula (3): R_total = Σ_i  R(s_i)
 *
 * Additionally computes:
 *  – Risk per VERIS class
 *  – Risk per protection goal
 *  – Top-10 scenarios
 *  – Threshold violations per protection goal
 */
export function computeRiskAssessment(
  scenarios: Scenario[],
  assets: Asset[],
  controls: Control[],
  protectionGoals: ProtectionGoal[],
  overrides?: ModelOverrides
): RiskAssessmentResult {
  // Compute per-scenario risk
  const scenarioRisks: ScenarioRisk[] = scenarios.map((s) =>
    computeScenarioRisk(s, assets, controls, overrides)
  );

  // Formula (3): R_total = Σ_i R(s_i)
  const totalRisk = scenarioRisks.reduce((sum, sr) => sum + sr.totalRisk, 0);

  // Aggregate per VERIS class
  const riskByVERIS = {} as Record<VERISClass, number>;
  for (const sr of scenarioRisks) {
    riskByVERIS[sr.verisClass] = (riskByVERIS[sr.verisClass] ?? 0) + sr.totalRisk;
  }

  // Aggregate per protection goal
  // A scenario contributes to a goal's risk sum if it is listed in goal.relatedScenarioIds
  const riskByProtectionGoal = {} as Record<ProtectionGoalId, number>;
  for (const goal of protectionGoals) {
    riskByProtectionGoal[goal.id] = scenarioRisks
      .filter((sr) => goal.relatedScenarioIds.includes(sr.scenarioId))
      .reduce((sum, sr) => sum + sr.totalRisk, 0);
  }

  // Top-10 scenarios sorted by descending residual risk
  const top10Scenarios = [...scenarioRisks]
    .sort((a, b) => b.totalRisk - a.totalRisk)
    .slice(0, 10);

  // Threshold violation check: compare aggregated risk per goal against goal.threshold
  const thresholdViolations: ProtectionGoalId[] = protectionGoals
    .filter((g) => riskByProtectionGoal[g.id] > g.threshold)
    .map((g) => g.id);

  return {
    scenarioRisks,
    totalRisk,
    riskByVERIS,
    riskByProtectionGoal,
    top10Scenarios,
    thresholdViolations,
  };
}
