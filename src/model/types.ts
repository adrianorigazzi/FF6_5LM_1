/**
 * types.ts
 * Central type definitions for the 5-Layer IT Risk Model (5LM).
 *
 * Model chain:  Störung → Systemzustand → Stabilisierung → Zielverletzung → Bewertung
 * Layers:
 *   L1   – Szenarioebene   (Störfall- und Angriffsszenarien)
 *   L1+  – Systemebene     (betroffene Assets und Wertbeitrag)
 *   L2   – Sicherheitsebene(Stabilisierung durch Schutzmechanismen)
 *   L3   – Schutzzielebene (Verletzung definierter Stabilitäts- und Schutzziele)
 *   L4   – Bewertungsebene (Aggregation zu Risikokennzahlen)
 */

// ---------------------------------------------------------------------------
// VERIS Incident Classification (Action categories)
// ---------------------------------------------------------------------------
export type VERISClass =
  | 'Hacking'
  | 'Malware'
  | 'Social Engineering'
  | 'Misuse'
  | 'Physical'
  | 'Error'
  | 'Environmental';

// ---------------------------------------------------------------------------
// Security Layers SE1–SE5 (Sicherheitsebenen)
// ---------------------------------------------------------------------------
export type SecurityLayer = 'SE1' | 'SE2' | 'SE3' | 'SE4' | 'SE5';

// ---------------------------------------------------------------------------
// Asset value categories → economic contribution C_j
// kritisch=1.0 | hoch=0.7 | mittel=0.4 | niedrig=0.1
// ---------------------------------------------------------------------------
export type AssetValueCategory = 'kritisch' | 'hoch' | 'mittel' | 'niedrig';

export const ASSET_VALUE_MAP: Record<AssetValueCategory, number> = {
  kritisch: 1.0,
  hoch: 0.7,
  mittel: 0.4,
  niedrig: 0.1,
};

// ---------------------------------------------------------------------------
// Damping levels → attenuation coefficient ζ
// 0.0=keine | 0.2=schwach | 0.5=mittel | 0.7=stark | 0.9=sehr stark | 1.0=vollständig
// ---------------------------------------------------------------------------
export type DampingLevel =
  | 'keine'
  | 'schwach'
  | 'mittel'
  | 'stark'
  | 'sehr stark'
  | 'vollständig';

export const DAMPING_VALUE_MAP: Record<DampingLevel, number> = {
  keine: 0.0,
  schwach: 0.2,
  mittel: 0.5,
  stark: 0.7,
  'sehr stark': 0.9,
  vollständig: 1.0,
};

// ---------------------------------------------------------------------------
// Protection goals (Schutzziele) – L3
// ---------------------------------------------------------------------------
export type ProtectionGoalId =
  | 'Vertraulichkeit'
  | 'Integrität'
  | 'Verbindlichkeit'
  | 'Verlässlichkeit'
  | 'Zuverlässigkeit';

// ---------------------------------------------------------------------------
// Data structures
// ---------------------------------------------------------------------------

/** L1 – Scenario */
export interface Scenario {
  id: string;                     // e.g. "S01"
  mitreId: string;                // MITRE ATT&CK Technique ID
  technique: string;              // Technique name
  verisClass: VERISClass;
  description: string;
  affectedAssetTypes: string[];   // Asset type names affected
  securityLayer: SecurityLayer;   // SE1–SE5 classification
  /** G ∈ [0,1] – Threat relevance / likelihood weight (not a probability) */
  G: number;
  /** Impact per asset id: Impact(s_i, A_j) ∈ [0,1] */
  impactPerAsset: Record<string, number>;
  /** Which protection goals this scenario potentially violates */
  affectedProtectionGoals: ProtectionGoalId[];
}

/** L1+ – Asset */
export interface Asset {
  id: string;
  name: string;
  /** Reference to AssetType.id – links this asset to a MITRE-aligned asset type */
  assetTypeId: string;
  type: string;            // human-readable label (from AssetType.name)
  valueCategory: AssetValueCategory;
  /** C_j ∈ {0.1, 0.4, 0.7, 1.0} – economic contribution (derived from valueCategory) */
  C_j: number;
}

/**
 * Asset type taxonomy aligned with MITRE ATT&CK platforms.
 * Asset → AssetType → Scenarios
 */
export interface AssetType {
  id: string;                  // e.g. "AT_IAM"
  name: string;                // e.g. "IAM"
  nameDE: string;              // German label
  mitrePlatforms: string[];    // MITRE ATT&CK platforms this type maps to
  relatedScenarioIds: string[]; // Scenarios (from 5LM data) that affect this type
  description: string;
  /** true for non-MITRE extension scenarios (Auslegungsfälle) */
  isExtension: boolean;
}

/** Result from the MITRE ATT&CK API for a technique */
export interface MitreTechniqueInfo {
  techniqueId: string;          // e.g. "T1190"
  name: string;
  description: string;
  platforms: string[];           // MITRE ATT&CK platforms
  tactics: string[];             // Kill-chain phases
  /** Suggested AT_* asset type IDs derived from platforms */
  suggestedAssetTypeIds: string[];
  /** true when the technique ID is "Auslegung" (non-MITRE extension) */
  isAuslegungsfall: boolean;
  /** ISO timestamp of fetch */
  fetchedAt: string;
}

/** L2 – Control / Schutzmassnahme */
export interface Control {
  id: string;
  scenarioId: string;
  name: string;
  securityLayer: SecurityLayer;
  dampingLevel: DampingLevel;
  /** ζ ∈ [0,1] – damping coefficient (derived from dampingLevel) */
  zeta: number;
}

/** L3 – Schutzzielfunktion: one function within a Teilschutzziel */
export interface ProtectionGoalFunction {
  /** e.g. "Authentifizierung, MFA, IAM" */
  name: string;
  /** Control IDs (from controls.ts) that implement this function */
  controlIds: string[];
}

/** L3 – Teilschutzziel: sub-goal within a Schutzziel */
export interface SubProtectionGoal {
  /** e.g. "Zugriffskontrolle" */
  name: string;
  functions: ProtectionGoalFunction[];
}

/** L3 – Protection goal definition */
export interface ProtectionGoal {
  id: ProtectionGoalId;
  description: string;
  /** Threshold: max acceptable residual risk contribution from this goal */
  threshold: number;
  /** Which scenario ids contribute to this goal's violation */
  relatedScenarioIds: string[];
  /** Teilschutzziele und Schutzzielfunktionen (Tabelle 8) */
  subGoals: SubProtectionGoal[];
}

/** L4 – Risk result for one (scenario, asset) pair */
export interface RiskContribution {
  scenarioId: string;
  assetId: string;
  impact: number;      // Impact(s_i, A_j)
  C_j: number;
  zeta: number;        // ζ
  G: number;
  /** R(s_i, A_j) = Impact * C_j * (1 - ζ) * G */
  residualRisk: number;
}

/** L4 – Aggregated risk per scenario */
export interface ScenarioRisk {
  scenarioId: string;
  verisClass: VERISClass;
  securityLayer: SecurityLayer;
  contributions: RiskContribution[];
  /** R(s_i) = Σ_j R(s_i, A_j) */
  totalRisk: number;
}

/** L4 – Full model output */
export interface RiskAssessmentResult {
  scenarioRisks: ScenarioRisk[];
  /** R_total = Σ_i R(s_i) */
  totalRisk: number;
  /** Aggregated risk per VERIS class */
  riskByVERIS: Record<VERISClass, number>;
  /** Aggregated risk per protection goal */
  riskByProtectionGoal: Record<ProtectionGoalId, number>;
  /** Top 10 scenarios sorted by descending residual risk */
  top10Scenarios: ScenarioRisk[];
  /** Which protection goals exceed their thresholds */
  thresholdViolations: ProtectionGoalId[];
}

/** Mutable overrides for interactive UI adjustments */
export interface ModelOverrides {
  /** Override Impact(s_i, A_j): key = `${scenarioId}__${assetId}` */
  impactOverrides: Record<string, number>;
  /** Override C_j per asset id */
  assetValueOverrides: Record<string, AssetValueCategory>;
  /** Override ζ per control id */
  zetaOverrides: Record<string, DampingLevel>;
  /** Override G per scenario id */
  gOverrides: Record<string, number>;
}

// ---------------------------------------------------------------------------
// Analysis / Gap Analysis types
// ---------------------------------------------------------------------------

/** An imported real-world control from CSV */
export interface AnalysedControl {
  /** Name as in the real ISMS / asset register */
  name: string;
  /** Direct scenario ID match (e.g. "H1", "M3") */
  scenarioId?: string;
  /** MITRE ATT&CK technique ID (e.g. "T1078") – used when no scenarioId */
  mitreId?: string;
  dampingLevel: DampingLevel;
  securityLayer: SecurityLayer;
}

/** Coverage status for one scenario after analysis matching */
export interface ScenarioCoverage {
  scenarioId: string;
  covered: boolean;
  matchedControls: Control[];
}

/** Full gap analysis result */
export interface GapAnalysisResult {
  coverage: ScenarioCoverage[];
  derivedControls: Control[];
  riskResult: RiskAssessmentResult;
  coveredCount: number;
  uncoveredCount: number;
}
