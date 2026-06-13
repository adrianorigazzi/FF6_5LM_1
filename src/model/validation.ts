/**
 * validation.ts
 * Input validation for 5LM risk model parameters.
 *
 * All values outside defined domains are rejected deterministically.
 * No estimation, no KI. Every rule is explicit.
 */

import { ASSET_VALUE_MAP, DAMPING_VALUE_MAP } from './types';
import type { AssetValueCategory, DampingLevel } from './types';

/** Clamps a number to [0,1] and throws if it is not finite. */
export function validateUnitInterval(value: number, label: string): number {
  if (!Number.isFinite(value)) {
    throw new RangeError(`${label} must be a finite number, got: ${value}`);
  }
  if (value < 0 || value > 1) {
    throw new RangeError(`${label} must be in [0,1], got: ${value}`);
  }
  return value;
}

/** Validates Impact(s_i, A_j) ∈ [0,1] */
export function validateImpact(impact: number, scenarioId: string, assetId: string): number {
  return validateUnitInterval(impact, `Impact(${scenarioId}, ${assetId})`);
}

/** Validates G ∈ [0,1] – threat relevance weight */
export function validateG(G: number, scenarioId: string): number {
  return validateUnitInterval(G, `G(${scenarioId})`);
}

/** Validates that C_j is one of the allowed economic contribution values */
export function validateCj(C_j: number, assetId: string): number {
  const allowed = Object.values(ASSET_VALUE_MAP);
  if (!allowed.includes(C_j)) {
    throw new RangeError(
      `C_j(${assetId}) must be one of ${allowed.join(', ')}, got: ${C_j}`
    );
  }
  return C_j;
}

/** Validates that ζ is one of the allowed damping values */
export function validateZeta(zeta: number, controlId: string): number {
  const allowed = Object.values(DAMPING_VALUE_MAP);
  if (!allowed.includes(zeta)) {
    throw new RangeError(
      `ζ(${controlId}) must be one of ${allowed.join(', ')}, got: ${zeta}`
    );
  }
  return zeta;
}

/** Returns true if the string is a valid AssetValueCategory */
export function isValidAssetValueCategory(v: string): v is AssetValueCategory {
  return v in ASSET_VALUE_MAP;
}

/** Returns true if the string is a valid DampingLevel */
export function isValidDampingLevel(v: string): v is DampingLevel {
  return v in DAMPING_VALUE_MAP;
}
