/**
 * assets.ts
 * Asset definitions (L1+ – Systemebene).
 *
 * Each asset is assigned an assetTypeId (AT_*) that links it to the
 * MITRE ATT&CK-aligned asset type taxonomy in assetTypes.ts.
 *
 * Asset chain: Asset (A*) → AssetType (AT_*) → Scenarios
 *
 * C_j ∈ {0.1, 0.4, 0.7, 1.0} is derived from valueCategory:
 *   kritisch = 1.0 | hoch = 0.7 | mittel = 0.4 | niedrig = 0.1
 */

import type { Asset } from '../model/types';
import { ASSET_VALUE_MAP } from '../model/types';

function asset(
  id: string,
  name: string,
  assetTypeId: string,
  type: string,
  valueCategory: Asset['valueCategory']
): Asset {
  return { id, name, assetTypeId, type, valueCategory, C_j: ASSET_VALUE_MAP[valueCategory] };
}

export const assets: Asset[] = [
  // ── IAM ─────────────────────────────────────────────────────────────────
  asset('A01', 'Active Directory / LDAP',    'AT_IAM',           'IAM',             'kritisch'),
  asset('A16', 'Benutzerkonten (AD-Konten)', 'AT_USER',          'Benutzer',        'hoch'),

  // ── Server ──────────────────────────────────────────────────────────────
  asset('A02', 'ERP-System (SAP)',            'AT_SERVER',        'Server',          'kritisch'),
  asset('A03', 'Datenbankserver',             'AT_SERVER',        'Server',          'kritisch'),
  asset('A05', 'E-Mail-Server',               'AT_SERVER',        'Server',          'hoch'),
  asset('A07', 'Fileserver',                  'AT_SERVER',        'Server',          'mittel'),
  asset('A12', 'Entwicklungsumgebung',        'AT_SERVER',        'Server',          'niedrig'),

  // ── Web Application ─────────────────────────────────────────────────────
  asset('A04', 'Webapplikation (extern)',     'AT_WEBAPP',        'Web-App',         'hoch'),

  // ── Network ─────────────────────────────────────────────────────────────
  asset('A06', 'Netzwerkinfrastruktur',       'AT_NETWORK',       'Netzwerk',        'hoch'),
  asset('A10', 'VPN-Gateway',                'AT_NETWORK',       'Netzwerk',        'mittel'),
  asset('A14', 'DNS-Server',                 'AT_NETWORK',       'Netzwerk',        'hoch'),

  // ── Endpoint ─────────────────────────────────────────────────────────────
  asset('A08', 'Endgeräte (Desktop-Clients)','AT_ENDPOINT',      'Endgeräte',       'mittel'),
  asset('A15', 'IoT-Geräte',                 'AT_ENDPOINT',      'Endgeräte',       'niedrig'),
  asset('A17', 'Webbrowser',                 'AT_BROWSER',       'Browser',         'niedrig'),
  asset('A18', 'Laptops / Mobile Geräte',    'AT_LAPTOP',        'Laptops',         'mittel'),

  // ── Data ─────────────────────────────────────────────────────────────────
  asset('A25', 'Unternehmensdaten',          'AT_DATA',          'Daten',           'kritisch'),
  asset('A09', 'Backup-System',              'AT_DATA',          'Daten',           'hoch'),

  // ── Cloud ────────────────────────────────────────────────────────────────
  asset('A11', 'Cloud-Dienste (IaaS/SaaS)', 'AT_CLOUD',         'Cloud',           'hoch'),

  // ── Security Systems ────────────────────────────────────────────────────
  asset('A13', 'Monitoring- / SIEM-System',  'AT_SECURITY',      'Security Systeme','mittel'),

  // ── Physical Infrastructure ──────────────────────────────────────────────
  asset('A20', 'Physische IT-Infrastruktur', 'AT_INFRASTRUCTURE','Infrastruktur',   'hoch'),
  asset('A21', 'Rechenzentrum',              'AT_DATACENTER',    'Rechenzentrum',   'kritisch'),
  asset('A22', 'Gebäude / Standorte',        'AT_BUILDING',      'Gebäude',         'hoch'),
  asset('A23', 'Hardware-Komponenten',       'AT_HARDWARE',      'Hardware',        'mittel'),

  // ── Process & Systems ────────────────────────────────────────────────────
  asset('A19', 'Geschäftsprozesse',          'AT_PROCESS',       'Prozesse',        'mittel'),
  asset('A24', 'Produktionssysteme',         'AT_SYSTEMS',       'Systeme',         'hoch'),
];
