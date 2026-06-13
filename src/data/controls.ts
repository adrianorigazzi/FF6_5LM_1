/**
 * controls.ts
 * Schutzmassnahmen (L2 – Sicherheitsebene).
 *
 * Jede Massnahme ist einem Szenario (scenarioId) zugeordnet.
 * Die Zuordnung zur Sicherheitsebene folgt den Schutzzielfunktionen gemäss Tabelle 9:
 *   SE1 – Normalbetrieb:         IAM, MFA, PAM, Verschlüsselung, Logging, Monitoring
 *   SE2 – Betriebsstörung:       Intrusion Detection, Zugriffskontrolle, Segmentierung, PAM
 *   SE3 – Auslegungsstörfälle:   Redundanz, PAM-SR, DLP, Netzwerkisolation
 *   SE4 – Auslegungsüberschr.:   Backup, Disaster Recovery, Incident Response
 *   SE5 – Schwere Störfälle:     Notfallmanagement, Wiederanlaufprozesse, Business Continuity
 *
 * MITRE-Mitigation-IDs (M10xx) in Klammern geben den Mitigation-Kontext an.
 * Der Dämpfungswert ζ ergibt sich aus der MITRE-Einschätzung der Mitigation-Wirksamkeit:
 *   sehr stark (0.9) – hohe MITRE-Wirksamkeit (z. B. MFA, Backup, Credential Guard)
 *   stark     (0.7)  – gute MITRE-Wirksamkeit (z. B. PAM, Segmentierung, WAF)
 *   mittel    (0.5)  – moderate Wirksamkeit   (z. B. NIP, EDR, Patch Mgmt)
 *   schwach   (0.2)  – geringe Wirksamkeit    (z. B. Training, Anomalieerkennung allein)
 */

import type { Control } from '../model/types';
import { DAMPING_VALUE_MAP } from '../model/types';

function ctrl(
  id: string,
  scenarioId: string,
  name: string,
  securityLayer: Control['securityLayer'],
  dampingLevel: Control['dampingLevel']
): Control {
  return { id, scenarioId, name, securityLayer, dampingLevel, zeta: DAMPING_VALUE_MAP[dampingLevel] };
}

export const controls: Control[] = [
  // ── M1 – T1204 User Execution ───────────────────────────────────────────
  ctrl('C01', 'M1',   'Security Awareness Training (M1017)',                       'SE1', 'schwach'),
  ctrl('C02', 'M1',   'Endpoint Detection and Response – EDR (M1049/M1040)',        'SE3', 'mittel'),

  // ── M2 – T1059 Command Execution ────────────────────────────────────────
  ctrl('C03', 'M2',   'Execution Prevention / AppLocker (M1038)',                   'SE3', 'stark'),
  ctrl('C04', 'M2',   'Privileged Access Management – PAM (M1026)',                 'SE1', 'mittel'),

  // ── M3 – T1105 Ingress Tool Transfer ────────────────────────────────────
  ctrl('C05', 'M3',   'Network Intrusion Prevention / NGFW (M1031)',                'SE2', 'mittel'),
  ctrl('C06', 'M3',   'Filter Network Traffic / DNS-Sinkholing (M1037)',            'SE2', 'mittel'),

  // ── M4 – T1486 Data Encryption for Impact (Ransomware) ──────────────────
  ctrl('C07', 'M4',   'Offline-Backups und getestete Wiederherstellung (M1053)',    'SE4', 'sehr stark'),
  ctrl('C08', 'M4',   'Behavior Prevention on Endpoint – EDR (M1040)',              'SE3', 'mittel'),

  // ── M5 – T1041 Exfiltration Over C2 Channel ─────────────────────────────
  ctrl('C09', 'M5',   'Data Loss Prevention – DLP (M1057)',                         'SE3', 'stark'),
  ctrl('C10', 'M5',   'Network Intrusion Prevention (M1031)',                       'SE2', 'mittel'),

  // ── M6 – T1071 Application Layer Protocol (C2) ──────────────────────────
  ctrl('C11', 'M6',   'Next-Gen Firewall mit Protokollanalyse (M1031)',             'SE2', 'stark'),
  ctrl('C12', 'M6',   'Filter Network Traffic / Egress-Kontrolle (M1037)',          'SE2', 'mittel'),

  // ── H1 – T1190 Exploit Public-Facing Application ────────────────────────
  ctrl('C13', 'H1',   'Web Application Firewall – WAF (M1050)',                     'SE2', 'stark'),
  ctrl('C14', 'H1',   'Vulnerability Management und Patch-Prozess (M1051)',         'SE2', 'mittel'),

  // ── H2 – T1133 External Remote Services ─────────────────────────────────
  ctrl('C15', 'H2',   'Multi-Faktor-Authentifizierung – MFA (M1032)',               'SE1', 'sehr stark'),
  ctrl('C16', 'H2',   'Netzwerksegmentierung (M1030)',                              'SE2', 'stark'),

  // ── H3 – T1021 Remote Services – Lateral Movement ───────────────────────
  ctrl('C17', 'H3',   'Netzwerksegmentierung und Mikrosegmentierung (M1030)',       'SE2', 'stark'),
  ctrl('C18', 'H3',   'Privileged Access Management – PAM (M1026)',                 'SE1', 'mittel'),

  // ── H4 – T1068 Exploitation for Privilege Escalation ────────────────────
  ctrl('C19', 'H4',   'Patch Management – Update Software (M1051)',                 'SE2', 'stark'),
  ctrl('C20', 'H4',   'Least-Privilege-Prinzip / RBAC (M1026)',                     'SE1', 'mittel'),

  // ── H5 – T1003 OS Credential Dumping ────────────────────────────────────
  ctrl('C21', 'H5',   'Credential Guard und Memory Protection (M1043)',             'SE3', 'sehr stark'),
  ctrl('C22', 'H5',   'Privileged Access Management – PAM (M1026)',                 'SE1', 'stark'),

  // ── H6 – T1046 Network Service Discovery ────────────────────────────────
  ctrl('C23', 'H6',   'Netzwerksegmentierung und Port-Filterung (M1030)',           'SE2', 'mittel'),
  ctrl('C24', 'H6',   'Intrusion Detection / Anomalieerkennung (M1031)',            'SE2', 'schwach'),

  // ── S1 – T1566 Phishing ──────────────────────────────────────────────────
  ctrl('C25', 'S1',   'Security Awareness Training (M1017)',                        'SE1', 'mittel'),
  ctrl('C26', 'S1',   'E-Mail-Filterung und Anti-Phishing-Gateway (M1031/M1049)',   'SE2', 'mittel'),

  // ── S2 – T1204 User Execution (Social) ──────────────────────────────────
  ctrl('C27', 'S2',   'Sandbox-basierte Anhanganalyse / Exec Prevention (M1038)',  'SE3', 'stark'),
  ctrl('C28', 'S2',   'Security Awareness Training (M1017)',                        'SE1', 'schwach'),

  // ── S3 – T1056 Input Capture ─────────────────────────────────────────────
  ctrl('C29', 'S3',   'Multi-Faktor-Authentifizierung – MFA (M1032)',               'SE1', 'sehr stark'),
  ctrl('C30', 'S3',   'Anti-Keylogging-Software / AV (M1049)',                      'SE3', 'mittel'),

  // ── S4 – T1078 Valid Accounts (Social) ──────────────────────────────────
  ctrl('C31', 'S4',   'Multi-Faktor-Authentifizierung – MFA (M1032)',               'SE1', 'sehr stark'),
  ctrl('C32', 'S4',   'Identity und Access Management – IAM (M1026)',               'SE1', 'mittel'),

  // ── S5 – T1189 Drive-by Compromise ──────────────────────────────────────
  ctrl('C33', 'S5',   'Web-Proxy und URL-Filterung (M1021)',                        'SE2', 'stark'),
  ctrl('C34', 'S5',   'Browser-Isolierung / Application Isolation (M1048)',         'SE3', 'mittel'),

  // ── S6 – T1598 Phishing for Information ──────────────────────────────────
  ctrl('C35', 'S6',   'Security Awareness Training (M1017)',                        'SE1', 'mittel'),
  ctrl('C36', 'S6',   'Datenklassifizierung und Zugriffskontrollen (M1022)',        'SE1', 'schwach'),

  // ── MU1 – T1078 Valid Accounts (Misuse) ─────────────────────────────────
  ctrl('C37', 'MU1',  'Identity Governance & Administration – IGA (M1018)',         'SE1', 'stark'),
  ctrl('C38', 'MU1',  'User Behaviour Analytics – UBA (M1047)',                     'SE2', 'mittel'),

  // ── MU2 – T1530 Data from Cloud Storage ─────────────────────────────────
  ctrl('C39', 'MU2',  'Cloud Access Security Broker – CASB (M1018)',                'SE2', 'stark'),
  ctrl('C40', 'MU2',  'Data Loss Prevention Cloud – DLP (M1057)',                   'SE3', 'stark'),

  // ── MU3 – T1005 Data from Local System ──────────────────────────────────
  ctrl('C41', 'MU3',  'Least-Privilege und Zugriffsprotokollierung (M1022/M1026)',  'SE1', 'mittel'),
  ctrl('C42', 'MU3',  'Endpoint Data Loss Prevention – DLP (M1057)',                'SE3', 'mittel'),

  // ── MU4 – T1567 Exfiltration Over Web Service ───────────────────────────
  ctrl('C43', 'MU4',  'Egress-Filterung und Web-Proxy (M1021/M1037)',              'SE2', 'stark'),
  ctrl('C44', 'MU4',  'Data Loss Prevention – DLP (M1057)',                         'SE3', 'stark'),

  // ── MU5 – T1087 Account Discovery ───────────────────────────────────────
  ctrl('C45', 'MU5',  'Privilegienminimierung und Account-Monitoring (M1026/M1028)','SE1', 'mittel'),
  ctrl('C46', 'MU5',  'User Behaviour Analytics – UBA (M1047)',                     'SE2', 'schwach'),

  // ── MU6 – T1485 Data Destruction ────────────────────────────────────────
  ctrl('C47', 'MU6',  'Immutable Backups und WORM-Speicher (M1053)',               'SE4', 'sehr stark'),
  ctrl('C48', 'MU6',  'Netzwerkisolation und Integrity Monitoring (M1030/M1022)',  'SE3', 'mittel'),

  // ── P1 – T1200 Hardware Additions ───────────────────────────────────────
  ctrl('C49', 'P1',   'Physische Zutrittskontrolle (Serverraeume) (M1035)',        'SE1', 'mittel'),
  ctrl('C50', 'P1',   'Asset Inventory und Port-Blocking (M1054)',                 'SE1', 'schwach'),

  // ── P2 – T1052 Exfiltration over Physical Medium ────────────────────────
  ctrl('C51', 'P2',   'USB-Port-Sperrung / Limit Hardware Installation (M1034)',   'SE1', 'stark'),
  ctrl('C52', 'P2',   'Endpoint Data Loss Prevention – DLP (M1057)',               'SE3', 'mittel'),

  // ── P3 – T1091 Replication Through Removable Media ──────────────────────
  ctrl('C53', 'P3',   'USB-Zugriffskontrollen und Whitelisting (M1034)',           'SE1', 'stark'),
  ctrl('C54', 'P3',   'Automatischer Malware-Scan fuer Wechselmedien (M1049)',     'SE3', 'mittel'),

  // ── P4 – Auslegung Device Theft ─────────────────────────────────────────
  ctrl('C55', 'P4',   'Festplattenverschluesselung / BitLocker (M1041)',           'SE1', 'sehr stark'),
  ctrl('C56', 'P4',   'Mobile Device Management – MDM mit Remote Wipe',           'SE4', 'stark'),

  // ── P5 – Auslegung Hardware Manipulation ────────────────────────────────
  ctrl('C57', 'P5',   'Physische Zutrittskontrolle mit Protokollierung (M1035)',   'SE1', 'stark'),
  ctrl('C58', 'P5',   'Hardware-Inventar und Tamper-Evident-Siegel (M1054)',       'SE1', 'mittel'),

  // ── P6 – Auslegung Network Port Access ──────────────────────────────────
  ctrl('C59', 'P6',   '802.1X Netzwerkzugangskontrolle – NAC (M1035)',            'SE2', 'stark'),
  ctrl('C60', 'P6',   'Physische Portabsicherung und VLAN (M1054)',                'SE1', 'mittel'),

  // ── E1 – T1562 Impair Defenses ──────────────────────────────────────────
  ctrl('C61', 'E1',   'Rechtebeschraenkung fuer Sicherheitstools (M1022)',         'SE1', 'mittel'),
  ctrl('C62', 'E1',   'Integrity Monitoring und SIEM-Alerting (M1047)',            'SE2', 'mittel'),

  // ── E2 – Auslegung Firewall Misconfiguration ─────────────────────────────
  ctrl('C63', 'E2',   'Infrastructure as Code – IaC mit Review',                  'SE3', 'stark'),
  ctrl('C64', 'E2',   'Firewall-Regelwerk-Review (quartalsweise)',                 'SE2', 'mittel'),

  // ── E3 – Auslegung Cloud Misconfiguration ────────────────────────────────
  ctrl('C65', 'E3',   'Cloud Security Posture Management – CSPM',                 'SE3', 'sehr stark'),
  ctrl('C66', 'E3',   'Cloud Compliance Scanning (CIS Benchmark)',                 'SE3', 'mittel'),

  // ── E4 – Auslegung Credential Exposure ──────────────────────────────────
  ctrl('C67', 'E4',   'Vault / Secrets Management (M1047)',                        'SE1', 'stark'),
  ctrl('C68', 'E4',   'Secret Scanning in CI/CD-Pipeline (M1047)',                 'SE1', 'stark'),

  // ── E5 – Auslegung Operational Error ────────────────────────────────────
  ctrl('C69', 'E5',   'Change-Management-Prozess – CAB',                           'SE4', 'mittel'),
  ctrl('C70', 'E5',   'Vier-Augen-Prinzip fuer kritische Operationen',             'SE1', 'mittel'),

  // ── E6 – Auslegung Permission Error ─────────────────────────────────────
  ctrl('C71', 'E6',   'Identity Governance & Access Review (M1018)',               'SE1', 'stark'),
  ctrl('C72', 'E6',   'Automatisierte Rechtevergabe – RBAC (M1022)',               'SE1', 'mittel'),

  // ── ENV1 – Power Outage ──────────────────────────────────────────────────
  ctrl('C73', 'ENV1', 'Unterbrechungsfreie Stromversorgung – USV',                 'SE5', 'sehr stark'),
  ctrl('C74', 'ENV1', 'Notstromaggregat (Diesel-Generator)',                       'SE5', 'stark'),

  // ── ENV2 – Cooling Failure ───────────────────────────────────────────────
  ctrl('C75', 'ENV2', 'Redundante Kuehlsysteme (N+1)',                             'SE5', 'sehr stark'),
  ctrl('C76', 'ENV2', 'Temperaturmonitoring und Fruehwarnsystem',                  'SE5', 'mittel'),

  // ── ENV3 – Natural Hazard ────────────────────────────────────────────────
  ctrl('C77', 'ENV3', 'Ausweichrechenzentrum / Disaster Recovery Site',            'SE5', 'sehr stark'),
  ctrl('C78', 'ENV3', 'Gebaeudeschutz und Business Continuity Plan',               'SE5', 'mittel'),

  // ── ENV4 – Provider Outage ───────────────────────────────────────────────
  ctrl('C79', 'ENV4', 'Redundante ISP-Anbindung (Multi-Homing)',                   'SE5', 'sehr stark'),
  ctrl('C80', 'ENV4', 'SD-WAN mit automatischem Failover',                         'SE5', 'stark'),

  // ── ENV5 – Fire ──────────────────────────────────────────────────────────
  ctrl('C81', 'ENV5', 'Brandschutzanlage (FM-200 / Inertgas)',                     'SE5', 'sehr stark'),
  ctrl('C82', 'ENV5', 'Replikation in geografisch getrenntes RZ',                  'SE5', 'stark'),

  // ── ENV6 – Overheating ───────────────────────────────────────────────────
  ctrl('C83', 'ENV6', 'Thermisches Monitoring mit automatischem Alert',            'SE5', 'stark'),
  ctrl('C84', 'ENV6', 'Redundante Kuehlung und Hot-Aisle-Containment',             'SE5', 'sehr stark'),
];