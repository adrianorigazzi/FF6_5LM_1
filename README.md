# 5-Ebenen-IT-Risikomodell (5LM) — Software-Demonstrator FF6

Regelbasiertes Artefakt zur objektiveren Entscheidungsunterstützung in der IT-Risikobewertung.

> **Hinweis:** Dieses Artefakt enthält **keine generative KI-Komponente**. Alle Bewertungen sind regelbasiert, mathematisch deterministisch und vollständig reproduzierbar.

---

## Installation

**Voraussetzungen:** Node.js ≥ 18, npm ≥ 9

```bash
# Im Projektverzeichnis
npm install

# Entwicklungsserver starten
npm run dev
# → http://localhost:5173

# Tests ausführen
npm test

# Produktions-Build
npm run build
```

---

## Modellbeschreibung

Das 5LM operationalisiert die folgende theoretische Modellkette (FF5):

```
Störung → Systemzustand → Stabilisierung → Zielverletzung → Bewertung
```

### Ebenen

| Ebene | Bezeichnung | Inhalt |
|-------|-------------|--------|
| L1 | Szenarioebene | Störfall- und Angriffsszenarien (MITRE ATT&CK, VERIS) |
| L1+ | Systemebene | Betroffene Assets und ihr ökonomischer Wertbeitrag C_j |
| L2 | Sicherheitsebene | Schutzmassnahmen und Dämpfungskennzahl ζ |
| L3 | Schutzzielebene | Verletzung definierter Stabilitäts- und Schutzziele |
| L4 | Bewertungsebene | Aggregation zu Risikokennzahlen R(s_i), R_total |

### Asset-Wertkategorien (C_j)

| Kategorie | C_j |
|-----------|-----|
| kritisch | 1.0 |
| hoch | 0.7 |
| mittel | 0.4 |
| niedrig | 0.1 |

### Dämpfungskennzahl (ζ)

| Stufe | ζ |
|-------|---|
| keine | 0.0 |
| schwach | 0.2 |
| mittel | 0.5 |
| stark | 0.7 |
| sehr stark | 0.9 |
| vollständig | 1.0 |

---

## Formeln

### (1) Residualer Risikobeitrag pro Szenario-Asset-Paar

```
R(s_i, A_j) = Impact(s_i, A_j) · C_j · (1 − ζ) · G
```

- `Impact(s_i, A_j) ∈ [0,1]` — Schadenspotenzial des Szenarios auf das Asset
- `C_j ∈ {0.1, 0.4, 0.7, 1.0}` — ökonomischer Wertbeitrag des Assets
- `ζ ∈ {0.0, 0.2, 0.5, 0.7, 0.9, 1.0}` — Dämpfung durch Schutzmassnahmen
- `G ∈ [0,1]` — Bedrohungsrelevanzgewicht (keine Eintrittswahrscheinlichkeit)

### (2) Aggregation pro Szenario

```
R(s_i) = Σ_j  R(s_i, A_j)
```

### (3) Gesamtrisiko

```
R_total = Σ_i  R(s_i)
```

### (4) Parallele Schutzmassnahmen-Kombination

Wenn mehrere Massnahmen ein Szenario abdecken:

```
ζ_eff = 1 − Π_k (1 − ζ_k)
```

---

## Qualitätsprinzipien

- **Keine geschätzten Eintrittswahrscheinlichkeiten** — G ist ein Bedrohungsrelevanzgewicht, kein probabilistischer Wert.
- **Keine Black-Box-Logik** — Jede Berechnung ist im Quellcode als Kommentar dokumentiert.
- **Keine KI-Entscheidungen** — Das Modell ist vollständig regelbasiert.
- **Reproduzierbarkeit** — Gleiche Eingaben → gleiche Ausgaben, immer.
- **Validierung** — Werte ausserhalb definierter Domänen werden abgewiesen (`RangeError`).

---

## Projektstruktur

```
src/
  data/
    scenarios.ts        — 20 Szenarien (MITRE, VERIS, Impacts, Schutzziele)
    assets.ts           — 15 Assets mit C_j
    controls.ts         — 41 Schutzmassnahmen mit ζ
    protectionGoals.ts  — 5 Schutzziele mit Grenzwerten
  model/
    types.ts            — Alle Typdefinitionen
    riskCalculation.ts  — Risikoberechnungslogik (Formeln 1–4)
    validation.ts       — Eingabevalidierung
  components/
    RiskOverview.tsx    — Gesamtrisiko, VERIS, Schutzziele
    ScenarioTable.tsx   — Alle Szenarien mit Inline-Editierung
    RiskMatrix.tsx      — Top-10-Visualisierung
    ProtectionGoalView.tsx — Schutzzielebene mit Grenzwerten
    SecurityLayerView.tsx  — SE1–SE5 mit ζ-Anpassung
    AssetEditor.tsx     — Asset-Wertbeitrag anpassen
  App.tsx               — Wurzelkomponente
tests/
  riskCalculation.test.ts — Unit-Tests für Formeln 1–4
```

---

## Beispieldaten

Das System enthält als Beispieldaten:

- **20 Szenarien** (S01–S20) basierend auf MITRE ATT&CK-Techniken mit VERIS-Klassifikation
- **15 Assets** (A01–A15) mit definierten Wertkategorien
- **41 Schutzmassnahmen** (C01–C41) über alle Sicherheitsebenen
- **5 Schutzziele** mit Grenzwerten (Vertraulichkeit, Integrität, Verbindlichkeit, Verlässlichkeit, Zuverlässigkeit)
