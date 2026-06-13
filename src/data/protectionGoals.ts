/**
 * protectionGoals.ts
 * Protection goal definitions based on Tabellen 8 and 9 of the 5LM (FF5).
 *
 * L3 – Schutzzielebene: Verletzung definierter Stabilitäts- und Schutzziele
 *
 * The five protection goals (Schutzziele):
 *   SZ1 – Vertraulichkeit   – Confidentiality
 *   SZ2 – Integrität        – Integrity
 *   SZ3 – Verbindlichkeit   – Non-repudiation / Accountability
 *   SZ4 – Verlässlichkeit   – Reliability / Availability
 *   SZ5 – Zuverlässigkeit   – Dependability / Continuity
 *
 * subGoals: Teilschutzziele mit Schutzzielfunktionen und zugeordneten
 *   Massnahmen-IDs aus controls.ts (Massnahmen der Sicherheitsebenen SE1–SE5).
 * relatedScenarioIds: Szenarien, die dieses Schutzziel verletzen können.
 * threshold: Maximales akzeptables aggregiertes Restrisiko für dieses Ziel.
 */

import type { ProtectionGoal } from '../model/types';

export const protectionGoals: ProtectionGoal[] = [
  {
    id: 'Vertraulichkeit',
    description:
      'Schutz vor unbefugtem Zugriff auf Informationen und Systeme. ' +
      'Verletzung durch Exfiltration, Mitlesen oder unbefugte Authentifizierung.',
    threshold: 4.0,
    relatedScenarioIds: [
      'M5',
      'H1', 'H4', 'H5', 'H6',
      'S1', 'S3', 'S4', 'S5', 'S6',
      'MU1', 'MU2', 'MU3', 'MU4', 'MU5',
      'P2', 'P4', 'P6',
      'E3', 'E4', 'E6',
    ],
    subGoals: [
      {
        name: 'Zugriffskontrolle',
        functions: [
          {
            name: 'Authentifizierung, MFA, IAM',
            controlIds: ['C15', 'C29', 'C31', 'C32', 'C37', 'C71', 'C72', 'C20', 'C41'],
          },
        ],
      },
      {
        name: 'Schutz privilegierter Zugriffe',
        functions: [
          {
            name: 'PAM',
            controlIds: ['C04', 'C18', 'C22', 'C45', 'C61'],
          },
        ],
      },
      {
        name: 'Schutz sensibler Daten',
        functions: [
          {
            name: 'Verschlüsselung',
            controlIds: ['C55', 'C67', 'C68'],
          },
        ],
      },
      {
        name: 'Verhinderung Datenabfluss',
        functions: [
          {
            name: 'DLP, Segmentierung',
            controlIds: ['C09', 'C33', 'C40', 'C42', 'C43', 'C44', 'C51', 'C52', 'C53'],
          },
        ],
      },
    ],
  },
  {
    id: 'Integrität',
    description:
      'Schutz vor unbefugter Veränderung von Daten, Konfigurationen oder Systemzuständen. ' +
      'Verletzung durch Manipulation, Zerstörung oder Einschleusung von Schadcode.',
    threshold: 3.0,
    relatedScenarioIds: [
      'M1', 'M2', 'M4',
      'MU6',
      'H1',
      'S1', 'S2', 'S5',
      'P1', 'P3', 'P5',
    ],
    subGoals: [
      {
        name: 'Schutz vor Manipulation',
        functions: [
          {
            name: 'Zugriffskontrolle, Signaturen',
            controlIds: ['C03', 'C13', 'C14', 'C19', 'C21', 'C27', 'C30', 'C39', 'C54', 'C59', 'C65', 'C66'],
          },
        ],
      },
      {
        name: 'Kontrolle privilegierter Änderungen',
        functions: [
          {
            name: 'PAM, Change Control',
            controlIds: ['C04', 'C18', 'C63', 'C69', 'C70'],
          },
        ],
      },
      {
        name: 'Erkennung von Manipulation',
        functions: [
          {
            name: 'IDS, Monitoring',
            controlIds: ['C02', 'C05', 'C08', 'C10', 'C11', 'C24', 'C26', 'C38', 'C48', 'C62'],
          },
        ],
      },
    ],
  },
  {
    id: 'Verbindlichkeit',
    description:
      'Sicherstellung nachweisbarer Handlungen und Identitäten. ' +
      'Verletzung durch Identitätsmissbrauch, unautorisierte Konten oder fehlende Nachvollziehbarkeit.',
    threshold: 3.0,
    relatedScenarioIds: [
      'H1', 'H2', 'H3', 'H4', 'H5',
      'S3', 'S4',
      'MU1', 'MU2',
      'P1', 'P6',
      'E2', 'E4', 'E6',
    ],
    subGoals: [
      {
        name: 'Nachweisbarkeit',
        functions: [
          {
            name: 'Logging, Audit Trails',
            controlIds: ['C38', 'C41', 'C46', 'C62'],
          },
        ],
      },
      {
        name: 'Nachvollziehbarkeit privilegierter Aktionen',
        functions: [
          {
            name: 'PAM (Session Recording)',
            controlIds: ['C04', 'C18', 'C22'],
          },
        ],
      },
      {
        name: 'Identitätsbindung',
        functions: [
          {
            name: 'IAM',
            controlIds: ['C32', 'C37', 'C71'],
          },
        ],
      },
    ],
  },
  {
    id: 'Verlässlichkeit',
    description:
      'Fähigkeit des Systems, unter normalen und Stressbedingungen konsistent zu funktionieren. ' +
      'Verletzung durch Überlast, Abschaltung von Schutzmechanismen oder DoS.',
    threshold: 4.0,
    relatedScenarioIds: [
      'M4', 'M6',
      'H2', 'H3',
      'S2',
      'E1', 'E2', 'E3', 'E5',
      'ENV1', 'ENV2', 'ENV3', 'ENV4', 'ENV5', 'ENV6',
    ],
    subGoals: [
      {
        name: 'Sicherstellung Verfügbarkeit',
        functions: [
          {
            name: 'Redundanz',
            controlIds: ['C73', 'C74', 'C75', 'C77', 'C79', 'C80', 'C84'],
          },
        ],
      },
      {
        name: 'Schutz vor Systemstörungen',
        functions: [
          {
            name: 'Segmentierung, Firewalls, Netzwerkisolation',
            controlIds: ['C11', 'C12', 'C16', 'C17', 'C23', 'C34', 'C48', 'C64'],
          },
        ],
      },
      {
        name: 'Aufrechterhaltung des Betriebs',
        functions: [
          {
            name: 'Business Continuity',
            controlIds: ['C78'],
          },
        ],
      },
      {
        name: 'Früherkennung',
        functions: [
          {
            name: 'Monitoring, IDS',
            controlIds: ['C06', 'C24', 'C76', 'C83'],
          },
        ],
      },
    ],
  },
  {
    id: 'Zuverlässigkeit',
    description:
      'Kontinuität kritischer Dienste und Prozesse über die Zeit. ' +
      'Verletzung durch Datenverlust, Ransomware, Systemzerstörung oder anhaltenden DoS.',
    threshold: 4.0,
    relatedScenarioIds: [
      'M1', 'M2', 'M3', 'M4', 'M6',
      'MU6',
      'E1', 'E5',
      'P5',
      'ENV1', 'ENV2', 'ENV3', 'ENV4', 'ENV5', 'ENV6',
    ],
    subGoals: [
      {
        name: 'Wiederherstellbarkeit',
        functions: [
          {
            name: 'Backup, Disaster Recovery, Wiederanlaufprozesse',
            controlIds: ['C07', 'C47', 'C77', 'C82'],
          },
        ],
      },
      {
        name: 'Fehlertoleranz',
        functions: [
          {
            name: 'Failover',
            controlIds: ['C73', 'C74', 'C75', 'C79', 'C80'],
          },
        ],
      },
      {
        name: 'Fehlermanagement',
        functions: [
          {
            name: 'Incident Response',
            controlIds: ['C56', 'C69'],
          },
        ],
      },
      {
        name: 'Systemregeneration',
        functions: [
          {
            name: 'Notfallmanagement',
            controlIds: ['C78', 'C81'],
          },
        ],
      },
      {
        name: 'Stabilität',
        functions: [
          {
            name: 'SRE',
            controlIds: ['C77', 'C84'],
          },
        ],
      },
    ],
  },
];

