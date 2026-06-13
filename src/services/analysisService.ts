/**
 * analysisService.ts
 * Gap-Analyse-Erweiterung des 5LM-Demonstrators.
 *
 * Workflow:
 *   1. Reale Massnahmen als CSV importieren (parseControlsFromCSV)
 *   2. Massnahmen den Szenarien zuordnen  (buildGapAnalysis)
 *      – über direkte Szenario-ID (z. B. "H1") ODER
 *      – über MITRE ATT&CK Technique-ID (z. B. "T1078")
 *   3. computeRiskAssessment mit abgeleiteten Controls ausführen
 *   4. Gap sichtbar: Szenarien ohne Massnahme erhalten ζ = 0
 *
 * CSV-Format (Controls):
 *   name,scenarioId,mitreId,dampingLevel,securityLayer
 *   "MFA","H1","","sehr stark","SE1"
 *   "Firewall","","T1059","stark","SE2"
 */

import type {
  AnalysedControl,
  Control,
  Scenario,
  Asset,
  ProtectionGoal,
  GapAnalysisResult,
  ScenarioCoverage,
  DampingLevel,
  SecurityLayer,
} from '../model/types';
import { DAMPING_VALUE_MAP } from '../model/types';
import { computeRiskAssessment } from '../model/riskCalculation';

// ---------------------------------------------------------------------------
// CSV parsing helpers
// ---------------------------------------------------------------------------

/** Parse a single CSV line, handling double-quoted fields */
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let inQuote = false;
  let current = '';
  for (const ch of line) {
    if (ch === '"') {
      inQuote = !inQuote;
    } else if (ch === ',' && !inQuote) {
      result.push(current.trim().replace(/^"|"$/g, ''));
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim().replace(/^"|"$/g, ''));
  return result;
}

const VALID_DAMPING: DampingLevel[] = [
  'keine', 'schwach', 'mittel', 'stark', 'sehr stark', 'vollständig',
];

const VALID_LAYERS: SecurityLayer[] = ['SE1', 'SE2', 'SE3', 'SE4', 'SE5'];

/**
 * Parse a CSV string into AnalysedControl objects.
 *
 * Required columns: name, dampingLevel, securityLayer
 * Optional columns: scenarioId, mitreId
 * Header row (case-insensitive) must be present.
 */
export function parseControlsFromCSV(csv: string): AnalysedControl[] {
  const lines = csv.trim().split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length < 2) {
    throw new Error('CSV enthält keine Datenzeilen (mindestens eine Headerzeile + eine Datenzeile erwartet).');
  }

  const header = parseCsvLine(lines[0]).map(h => h.toLowerCase());
  const col = (name: string) => header.indexOf(name);

  const nameIdx       = col('name');
  const scenarioIdIdx = col('scenarioid');
  const mitreIdIdx    = col('mitreid');
  const dampingIdx    = col('dampinglevel');
  const layerIdx      = col('securitylayer');

  if (nameIdx === -1 || dampingIdx === -1 || layerIdx === -1) {
    throw new Error(
      'CSV-Header unvollständig. Pflichtfelder: name, dampingLevel, securityLayer\n' +
      'Optionale Felder: scenarioId, mitreId'
    );
  }

  const results: AnalysedControl[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    const get = (idx: number) => (idx >= 0 && idx < cols.length ? cols[idx] : '');

    const name         = get(nameIdx);
    const scenarioId   = get(scenarioIdIdx) || undefined;
    const mitreId      = get(mitreIdIdx) || undefined;
    const dampingRaw   = get(dampingIdx) as DampingLevel;
    const layerRaw     = get(layerIdx) as SecurityLayer;

    if (!name) continue; // skip empty rows

    const dampingLevel = VALID_DAMPING.includes(dampingRaw)
      ? dampingRaw
      : 'mittel'; // fallback

    const securityLayer = VALID_LAYERS.includes(layerRaw)
      ? layerRaw
      : 'SE2'; // fallback

    results.push({ name, scenarioId, mitreId, dampingLevel, securityLayer });
  }

  return results;
}

// ---------------------------------------------------------------------------
// Matching & gap analysis
// ---------------------------------------------------------------------------

/**
 * Match imported controls to scenarios and compute a full gap analysis.
 *
 * Matching priority:
 *   1. scenarioId  → exact match against scenario.id (e.g. "H1")
 *   2. mitreId     → match against scenario.mitreId (e.g. "T1078")
 *
 * Scenarios without any matched control will have ζ_eff = 0 in the risk
 * calculation (no damping → maximum residual risk contribution).
 */
export function buildGapAnalysis(
  analysedControls: AnalysedControl[],
  scenarios: Scenario[],
  assets: Asset[],
  protectionGoals: ProtectionGoal[]
): GapAnalysisResult {
  const derivedControls: Control[] = [];
  let counter = 0;

  for (const ac of analysedControls) {
    const matchedScenarios: Scenario[] = [];

    // Priority 1: direct scenario ID
    if (ac.scenarioId) {
      const s = scenarios.find(s => s.id === ac.scenarioId);
      if (s) matchedScenarios.push(s);
    }

    // Priority 2: MITRE technique ID (may match multiple scenarios)
    if (matchedScenarios.length === 0 && ac.mitreId) {
      matchedScenarios.push(...scenarios.filter(s => s.mitreId === ac.mitreId));
    }

    for (const scenario of matchedScenarios) {
      counter++;
      derivedControls.push({
        id: `AC${String(counter).padStart(3, '0')}`,
        scenarioId: scenario.id,
        name: ac.name,
        securityLayer: ac.securityLayer,
        dampingLevel: ac.dampingLevel,
        zeta: DAMPING_VALUE_MAP[ac.dampingLevel] ?? 0,
      });
    }
  }

  // Build per-scenario coverage map
  const coverage: ScenarioCoverage[] = scenarios.map(scenario => {
    const matchedControls = derivedControls.filter(c => c.scenarioId === scenario.id);
    return {
      scenarioId: scenario.id,
      covered: matchedControls.length > 0,
      matchedControls,
    };
  });

  const coveredCount   = coverage.filter(c => c.covered).length;
  const uncoveredCount = coverage.filter(c => !c.covered).length;

  // Run standard risk assessment with only the real derived controls
  const riskResult = computeRiskAssessment(scenarios, assets, derivedControls, protectionGoals);

  return { coverage, derivedControls, riskResult, coveredCount, uncoveredCount };
}

// ---------------------------------------------------------------------------
// CSV template for download
// ---------------------------------------------------------------------------

/** Returns a CSV template string with example rows for the user to fill in */
export function generateControlTemplate(scenarios: Scenario[]): string {
  const header = 'name,scenarioId,mitreId,dampingLevel,securityLayer';
  const examples = [
    '"Multi-Faktor-Authentifizierung (MFA)","H1","","sehr stark","SE1"',
    '"Privileged Access Management (PAM)","H2","","stark","SE1"',
    '"Netzwerksegmentierung","","T1190","stark","SE2"',
    '"Offline-Backup","M4","","sehr stark","SE4"',
    '"Awareness-Training","S1","","schwach","SE1"',
    '"EDR / Endpoint Protection","","T1059","mittel","SE3"',
  ];

  const scenarioList = scenarios
    .map(s => `# ${s.id}  mitreId=${s.mitreId}  ${s.technique}  (${s.verisClass})`)
    .join('\n');

  return (
    '# 5LM Analyse – Massnahmen-Import\n' +
    '# Pflichtfelder: name, dampingLevel, securityLayer\n' +
    '# Optional:      scenarioId (z.B. H1) ODER mitreId (z.B. T1078)\n' +
    '# dampingLevel:  keine | schwach | mittel | stark | sehr stark | vollständig\n' +
    '# securityLayer: SE1 | SE2 | SE3 | SE4 | SE5\n' +
    '#\n' +
    '# Verfügbare Szenarien:\n' +
    scenarioList.split('\n').map(l => l).join('\n') +
    '\n#\n' +
    header + '\n' +
    examples.join('\n')
  );
}
