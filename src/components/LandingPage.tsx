/**
 * LandingPage.tsx
 * Einstiegsseite – Auswahl zwischen Demonstrator (Standardwerte) und Gap-Analyse.
 */

import React from 'react';

type AppMode = 'demonstrator' | 'analyse';

interface Props {
  onSelect: (mode: AppMode) => void;
}

export function LandingPage({ onSelect }: Props) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f0f4ff 0%, #e8f0fe 50%, #f0fdf4 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 16px',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <div
          style={{
            display: 'inline-block',
            background: '#1e3a5f',
            color: '#fff',
            fontWeight: 800,
            fontSize: 13,
            letterSpacing: 3,
            padding: '4px 16px',
            borderRadius: 20,
            marginBottom: 16,
          }}
        >
          5LM · FF6
        </div>
        <h1
          style={{
            fontSize: 32,
            fontWeight: 800,
            color: '#1e3a5f',
            margin: '0 0 12px',
            lineHeight: 1.2,
          }}
        >
          5-Ebenen-IT-Risikomodell
        </h1>
        <p
          style={{
            color: '#475569',
            fontSize: 15,
            maxWidth: 520,
            margin: '0 auto',
            lineHeight: 1.6,
          }}
        >
          Regelbasiertes Artefakt zur IT-Risikobewertung · Deterministisch &
          reproduzierbar · Keine KI · Keine geschätzten Eintrittswahrscheinlichkeiten
        </p>
        <div
          style={{
            marginTop: 12,
            fontSize: 12,
            color: '#94a3b8',
            fontStyle: 'italic',
          }}
        >
          Modellkette: Störung → Systemzustand → Stabilisierung → Zielverletzung → Bewertung
        </div>
      </div>

      {/* Mode Cards */}
      <div
        style={{
          display: 'flex',
          gap: 24,
          flexWrap: 'wrap',
          justifyContent: 'center',
          width: '100%',
          maxWidth: 820,
        }}
      >
        {/* Demonstrator Card */}
        <ModeCard
          title="Demonstrator"
          subtitle="Standardwerte"
          icon="🔬"
          color="#1e3a5f"
          lightColor="#eff6ff"
          features={[
            '42 vordefinierte Szenarien (VERIS)',
            'Theoretische Asset- und Massnahmenwerte',
            'Interaktive Anpassung via Overrides',
            'Vollständige Modellvisualisierung (L1–L4)',
            'Top-10-Risiken, Schutzzielebene, SE-Ansicht',
          ]}
          buttonLabel="Demonstrator starten"
          onClick={() => onSelect('demonstrator')}
        />

        {/* Gap-Analyse Card */}
        <ModeCard
          title="Gap-Analyse"
          subtitle="Analyse-Modus"
          icon="🔍"
          color="#0f766e"
          lightColor="#f0fdf4"
          features={[
            'Reale Assets erfassen & bewerten',
            'Schutzmassnahmen per Drag & Drop zuordnen',
            'Automatische Kalkulation nach 5LM-Formel',
            'Schutzzielvergleich: Ist vs. Soll',
            'Gap-Erkennung: Szenarien ohne Massnahmen',
          ]}
          buttonLabel="Gap-Analyse starten"
          onClick={() => onSelect('analyse')}
        />
      </div>

      {/* Formula footer */}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ModeCard sub-component
// ---------------------------------------------------------------------------

interface ModeCardProps {
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  lightColor: string;
  features: string[];
  buttonLabel: string;
  onClick: () => void;
}

function ModeCard({
  title,
  subtitle,
  icon,
  color,
  lightColor,
  features,
  buttonLabel,
  onClick,
}: ModeCardProps) {
  const [hovered, setHovered] = React.useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#fff',
        border: `2px solid ${hovered ? color : '#e2e8f0'}`,
        borderRadius: 16,
        padding: '28px 28px 24px',
        width: 340,
        minWidth: 280,
        display: 'flex',
        flexDirection: 'column',
        transition: 'border-color 0.15s, box-shadow 0.15s',
        boxShadow: hovered
          ? `0 8px 24px rgba(0,0,0,0.10)`
          : '0 2px 8px rgba(0,0,0,0.06)',
        cursor: 'default',
      }}
    >
      {/* Icon + Title */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
        <div
          style={{
            background: lightColor,
            borderRadius: 12,
            width: 48,
            height: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22,
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color }}>{title}</div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: '#94a3b8',
              letterSpacing: 1,
              textTransform: 'uppercase',
            }}
          >
            {subtitle}
          </div>
        </div>
      </div>

      {/* Features */}
      <ul
        style={{
          listStyle: 'none',
          margin: '0 0 24px',
          padding: 0,
          flex: 1,
        }}
      >
        {features.map(f => (
          <li
            key={f}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8,
              marginBottom: 8,
              fontSize: 13,
              color: '#374151',
            }}
          >
            <span style={{ color, fontWeight: 700, marginTop: 1, flexShrink: 0 }}>✓</span>
            {f}
          </li>
        ))}
      </ul>

      {/* CTA Button */}
      <button
        onClick={onClick}
        style={{
          padding: '10px 0',
          borderRadius: 8,
          border: 'none',
          background: color,
          color: '#fff',
          fontWeight: 700,
          fontSize: 13,
          cursor: 'pointer',
          transition: 'opacity 0.15s',
          opacity: hovered ? 1 : 0.92,
        }}
      >
        {buttonLabel} →
      </button>
    </div>
  );
}
