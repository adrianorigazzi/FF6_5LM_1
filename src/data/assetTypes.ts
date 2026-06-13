/**
 * assetTypes.ts
 * Asset type taxonomy aligned with MITRE ATT&CK platforms (L1+).
 *
 * Each AssetType maps:
 *   - to MITRE ATT&CK platform names (used for API-based categorization)
 *   - to the 5LM scenario IDs that can affect it
 *
 * Sources:
 *   - MITRE ATT&CK Enterprise platforms: Windows, macOS, Linux, Network,
 *     Azure AD, Office 365, Google Workspace, SaaS, IaaS, Containers, PRE
 *   - Auslegungsfall marker: isExtension=true for non-MITRE scenarios (Tabelle 4)
 *
 * Asset chain: Asset (A*) → AssetType (AT_*) → Scenario (M*, H*, S*, MU*, P*, E*, ENV*)
 */

import type { AssetType } from '../model/types';

export const assetTypes: AssetType[] = [
  {
    id: 'AT_ENDPOINT',
    name: 'Endpoint',
    nameDE: 'Endgeräte',
    mitrePlatforms: ['Windows', 'macOS', 'Linux'],
    relatedScenarioIds: ['M1', 'M2', 'H5', 'S2', 'S5', 'MU3', 'P2', 'P3'],
    description:
      'Desktop-Computer, Workstations und stationäre Clients. ' +
      'Primäre Ziele für Malware-Ausführung und Credential-Diebstahl.',
    isExtension: false,
  },
  {
    id: 'AT_USER',
    name: 'User',
    nameDE: 'Benutzer',
    mitrePlatforms: ['Windows', 'macOS', 'Linux', 'Azure AD', 'Office 365'],
    relatedScenarioIds: ['M1', 'S1', 'S2', 'S6', 'MU3'],
    description:
      'Menschliche Benutzer und Benutzerkonten. ' +
      'Primärziel für Social-Engineering-Angriffe.',
    isExtension: false,
  },
  {
    id: 'AT_SERVER',
    name: 'Server',
    nameDE: 'Server',
    mitrePlatforms: ['Windows', 'Linux'],
    relatedScenarioIds: ['M2', 'M3', 'M4', 'H1', 'H2', 'P5'],
    description:
      'Server-Systeme (Applikation, Datenbank, File). ' +
      'Ziele für Remote-Exploitation, Ransomware und laterale Bewegung.',
    isExtension: false,
  },
  {
    id: 'AT_NETWORK',
    name: 'Network',
    nameDE: 'Netzwerk',
    mitrePlatforms: ['Network'],
    relatedScenarioIds: ['M3', 'M6', 'H2', 'H3', 'H6', 'MU4', 'P6', 'E2', 'ENV4'],
    description:
      'Netzwerkinfrastruktur, Router, Switches, Firewalls, VPN. ' +
      'Ziele für Reconnaissance, Sniffing und DoS.',
    isExtension: false,
  },
  {
    id: 'AT_DATA',
    name: 'Data',
    nameDE: 'Daten',
    mitrePlatforms: ['Windows', 'Linux', 'IaaS'],
    relatedScenarioIds: ['M4', 'M5', 'MU6'],
    description:
      'Unternehmensdaten, Datenbanken, Backup-Systeme. ' +
      'Primärziele für Exfiltration, Ransomware und Datenzerstörung.',
    isExtension: false,
  },
  {
    id: 'AT_CLOUD',
    name: 'Cloud',
    nameDE: 'Cloud',
    mitrePlatforms: ['Azure AD', 'Office 365', 'Google Workspace', 'SaaS', 'IaaS'],
    relatedScenarioIds: ['M5', 'MU2', 'MU4', 'E3', 'ENV4'],
    description:
      'Cloud-Dienste (IaaS, PaaS, SaaS). ' +
      'Ziele für Fehlkonfiguration, Datenzugriff und Exfiltration.',
    isExtension: false,
  },
  {
    id: 'AT_WEBAPP',
    name: 'Web Application',
    nameDE: 'Web-App',
    mitrePlatforms: ['Windows', 'Linux', 'IaaS'],
    relatedScenarioIds: ['H1'],
    description:
      'Öffentlich zugängliche Web-Applikationen. ' +
      'Primärziel für Schwachstellen-Exploitation.',
    isExtension: false,
  },
  {
    id: 'AT_IAM',
    name: 'IAM',
    nameDE: 'IAM',
    mitrePlatforms: ['Windows', 'Azure AD', 'Office 365', 'Google Workspace'],
    relatedScenarioIds: ['H4', 'H5', 'S3', 'S4', 'MU1', 'MU5', 'E4', 'E6'],
    description:
      'Identity- und Access-Management-Systeme, Verzeichnisdienste. ' +
      'Ziele für Privilege Escalation, Credential-Angriffe und Missbrauch.',
    isExtension: false,
  },
  {
    id: 'AT_BROWSER',
    name: 'Browser',
    nameDE: 'Browser',
    mitrePlatforms: ['Windows', 'macOS', 'Linux'],
    relatedScenarioIds: ['S5'],
    description:
      'Webbrowser auf Endgeräten. ' +
      'Ziele für Drive-by-Angriffe und Browser-Exploits.',
    isExtension: false,
  },
  {
    id: 'AT_PROCESS',
    name: 'Process',
    nameDE: 'Prozesse',
    mitrePlatforms: ['PRE'],
    relatedScenarioIds: ['S6'],
    description:
      'Geschäftsprozesse und organisatorische Abläufe. ' +
      'Ziele für Informationsgewinnung und Social Engineering.',
    isExtension: false,
  },
  {
    id: 'AT_INFRASTRUCTURE',
    name: 'Infrastructure',
    nameDE: 'Infrastruktur',
    mitrePlatforms: ['Network'],
    relatedScenarioIds: ['P1', 'ENV2'],
    description:
      'Physische IT-Infrastruktur (Verkabelung, Racks, physische Netzwerkkomponenten). ' +
      'Ziele für physische Manipulation und Umwelteinflüsse.',
    isExtension: false,
  },
  {
    id: 'AT_LAPTOP',
    name: 'Laptop',
    nameDE: 'Laptops',
    mitrePlatforms: ['Windows', 'macOS', 'Linux'],
    relatedScenarioIds: ['P2', 'P3', 'P4', 'MU3'],
    description:
      'Tragbare Computer (Laptops, Notebooks). ' +
      'Erhöhtes Risiko durch physischen Verlust und USB-Angriffe.',
    isExtension: true, // Auslegungsfall: erweitert AT_ENDPOINT um physischen Kontext
  },
  {
    id: 'AT_SECURITY',
    name: 'Security Systems',
    nameDE: 'Security Systeme',
    mitrePlatforms: ['Windows', 'Linux', 'Network'],
    relatedScenarioIds: ['E1'],
    description:
      'Sicherheitssysteme (EDR, SIEM, IDS/IPS, Antimalware). ' +
      'Ziele für Deaktivierung von Schutzmechanismen.',
    isExtension: false,
  },
  {
    id: 'AT_DATACENTER',
    name: 'Data Center',
    nameDE: 'Rechenzentrum',
    mitrePlatforms: [],
    relatedScenarioIds: ['ENV1', 'ENV5'],
    description:
      'Rechenzentrum-Einrichtungen (Stromversorgung, Kühlung, Brandschutz). ' +
      'Ziele für Umweltereignisse und physische Ausfälle.',
    isExtension: true, // Auslegungsfall: Infrastrukturrisiken ausserhalb MITRE ATT&CK
  },
  {
    id: 'AT_BUILDING',
    name: 'Building',
    nameDE: 'Gebäude',
    mitrePlatforms: [],
    relatedScenarioIds: ['ENV3'],
    description:
      'Physische Gebäude und Standorte. ' +
      'Ziele für Naturereignisse und physische Katastrophen.',
    isExtension: true, // Auslegungsfall: Umwelt-/Naturrisiken
  },
  {
    id: 'AT_HARDWARE',
    name: 'Hardware',
    nameDE: 'Hardware',
    mitrePlatforms: [],
    relatedScenarioIds: ['ENV2', 'ENV6'],
    description:
      'Hardware-Komponenten (Server-Hardware, Netzwerkkarten, Speicher). ' +
      'Ziele für Überhitzung, physische Schäden und Komponentenausfall.',
    isExtension: true, // Auslegungsfall: physische Hardware-Risiken
  },
  {
    id: 'AT_SYSTEMS',
    name: 'Systems',
    nameDE: 'Systeme',
    mitrePlatforms: ['Windows', 'Linux', 'Network'],
    relatedScenarioIds: ['E5'],
    description:
      'Allgemeine IT-Systeme (Produktionssysteme, Betriebssysteme). ' +
      'Ziele für Betriebsfehler und Fehlkonfigurationen.',
    isExtension: false,
  },
];

/** Lookup helper: AssetType by ID */
export function getAssetTypeById(id: string): AssetType | undefined {
  return assetTypes.find((at) => at.id === id);
}

/**
 * Maps MITRE ATT&CK platform names to our AT_* asset type IDs.
 * Used by the MITRE API service to suggest asset types for new techniques.
 */
export const MITRE_PLATFORM_TO_ASSET_TYPE: Record<string, string[]> = {
  Windows:          ['AT_ENDPOINT', 'AT_SERVER', 'AT_IAM', 'AT_LAPTOP'],
  macOS:            ['AT_ENDPOINT', 'AT_LAPTOP'],
  Linux:            ['AT_ENDPOINT', 'AT_SERVER'],
  Network:          ['AT_NETWORK', 'AT_INFRASTRUCTURE'],
  'Azure AD':       ['AT_IAM', 'AT_CLOUD'],
  'Office 365':     ['AT_IAM', 'AT_CLOUD'],
  'Google Workspace': ['AT_IAM', 'AT_CLOUD'],
  SaaS:             ['AT_CLOUD', 'AT_WEBAPP'],
  IaaS:             ['AT_CLOUD', 'AT_DATA', 'AT_SERVER'],
  Containers:       ['AT_SERVER', 'AT_CLOUD'],
  PRE:              ['AT_PROCESS', 'AT_USER'],
};
