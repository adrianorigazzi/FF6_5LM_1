/**
 * mitreApi.ts
 * Service for querying MITRE ATT&CK technique data via the TAXII 2.1 API.
 *
 * TAXII endpoint: https://cti-taxii.mitre.org/
 * Enterprise collection: 95ecc380-afe9-11e4-9b6c-751b66dd541e
 *
 * Special handling:
 * - mitreId "Auslegung" → returns a synthetic AuslegungsfallInfo (no API call)
 * - Network/CORS failures are caught and surfaced as an error message
 */

import type { MitreTechniqueInfo } from '../model/types';
import { MITRE_PLATFORM_TO_ASSET_TYPE } from '../data/assetTypes';

const TAXII_BASE =
  'https://cti-taxii.mitre.org/stix/collections/95ecc380-afe9-11e4-9b6c-751b66dd541e/objects/';

const TECHNIQUE_CACHE = new Map<string, MitreTechniqueInfo>();

/** Synthetic entry returned for Auslegungsfall scenarios that have no MITRE technique. */
const AUSLEGUNGSFALL_INFO: MitreTechniqueInfo = {
  techniqueId: 'Auslegung',
  name: 'Auslegungsfall (keine MITRE-Technik)',
  description:
    'Dieses Szenario ist ein Auslegungsfall, der über den MITRE ATT&CK-Katalog hinausgeht. ' +
    'Es basiert auf der 5LM-Modellerweiterung für physische und umgebungsbedingte Bedrohungen.',
  platforms: [],
  tactics: [],
  suggestedAssetTypeIds: [],
  isAuslegungsfall: true,
  fetchedAt: new Date().toISOString(),
};

/**
 * Fetches MITRE ATT&CK technique metadata for the given technique ID.
 *
 * @param techniqueId - e.g. "T1566", "T1486", or "Auslegung"
 * @returns MitreTechniqueInfo or throws an Error with a human-readable message
 */
export async function fetchMitreTechnique(techniqueId: string): Promise<MitreTechniqueInfo> {
  if (techniqueId === 'Auslegung') {
    return { ...AUSLEGUNGSFALL_INFO, fetchedAt: new Date().toISOString() };
  }

  const cacheKey = techniqueId.toUpperCase();
  if (TECHNIQUE_CACHE.has(cacheKey)) {
    return TECHNIQUE_CACHE.get(cacheKey)!;
  }

  const url = `${TAXII_BASE}?match[external_references.external_id]=${encodeURIComponent(techniqueId)}`;

  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
        Accept: 'application/taxii+json;version=2.1',
      },
    });
  } catch (networkErr) {
    throw new Error(
      `Netzwerkfehler beim Abrufen von ${techniqueId}: ${
        networkErr instanceof Error ? networkErr.message : String(networkErr)
      }. Möglicherweise blockiert CORS die Anfrage im Browser.`
    );
  }

  if (!response.ok) {
    throw new Error(
      `MITRE API Fehler: HTTP ${response.status} ${response.statusText} für Technik ${techniqueId}.`
    );
  }

  let body: { objects?: MitreStixObject[] };
  try {
    body = await response.json();
  } catch {
    throw new Error(`Ungültige JSON-Antwort der MITRE API für Technik ${techniqueId}.`);
  }

  const technique = (body.objects ?? []).find(
    (obj): obj is MitreStixAttackPattern =>
      obj.type === 'attack-pattern' &&
      Array.isArray((obj as MitreStixAttackPattern).external_references) &&
      (obj as MitreStixAttackPattern).external_references.some(
        (ref) => ref.source_name === 'mitre-attack' && ref.external_id === techniqueId
      )
  );

  if (!technique) {
    throw new Error(`Technik ${techniqueId} wurde in der MITRE ATT&CK Enterprise-Kollektion nicht gefunden.`);
  }

  const platforms: string[] = technique.x_mitre_platforms ?? [];
  const tactics: string[] = (technique.kill_chain_phases ?? [])
    .filter((p) => p.kill_chain_name === 'mitre-attack')
    .map((p) => p.phase_name);

  // Map MITRE platforms to AT_* asset type IDs
  const suggestedAssetTypeIds = [
    ...new Set(
      platforms.flatMap((p) => MITRE_PLATFORM_TO_ASSET_TYPE[p] ?? [])
    ),
  ];

  const info: MitreTechniqueInfo = {
    techniqueId,
    name: technique.name,
    description: technique.description ?? '',
    platforms,
    tactics,
    suggestedAssetTypeIds,
    isAuslegungsfall: false,
    fetchedAt: new Date().toISOString(),
  };

  TECHNIQUE_CACHE.set(cacheKey, info);
  return info;
}

// ---------------------------------------------------------------------------
// Internal STIX type helpers (not exported – only used for parsing)
// ---------------------------------------------------------------------------

interface MitreStixObject {
  type: string;
  id: string;
}

interface MitreStixAttackPattern extends MitreStixObject {
  type: 'attack-pattern';
  name: string;
  description?: string;
  x_mitre_platforms?: string[];
  kill_chain_phases?: Array<{ kill_chain_name: string; phase_name: string }>;
  external_references: Array<{ source_name: string; external_id: string; url?: string }>;
}
