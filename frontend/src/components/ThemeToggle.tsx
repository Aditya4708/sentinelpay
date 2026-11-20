import { Sun, Moon, Monitor } from "lucide-react";
import type { CSSProperties } from "react";
import { useTheme, ThemeMode, Palette } from "../context/ThemeContext";

const OPTIONS: { mode: ThemeMode; label: string; icon: typeof Sun }[] = [
  { mode: "light", label: "Light", icon: Sun },
  { mode: "system", label: "System", icon: Monitor },
  { mode: "dark", label: "Dark", icon: Moon },
];

// Fixed swatch colours so each option previews its own colourway, whatever is active.
const SWATCHES: { palette: Palette; label: string; accent: string; base: string }[] = [
  { palette: "ink", label: "Ink", accent: "#4da3ff", base: "#11141c" },
  { palette: "graphite", label: "Graphite", accent: "#3cc6d4", base: "#19191b" },
  { palette: "paper", label: "Paper", accent: "#e0875a", base: "#e9e2d6" },
];

const groupStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 2,
  padding: 2,
  borderRadius: 8,
  border: "1px solid var(--border)",
  background: "var(--surface)",
};

const buttonBase: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 28,
  height: 28,
  borderRadius: 6,
  border: "none",
  cursor: "pointer",
  transition: "background-color 150ms var(--ease), color 150ms var(--ease)",
};

export function PalettePicker() {
  const { palette, setPalette } = useTheme();
  return (
    <div role="radiogroup" aria-label="Colourway" style={groupStyle}>
      {SWATCHES.map((s) => {
        const active = palette === s.palette;
        return (
          <button
            key={s.palette}
            role="radio"
            aria-checked={active}
            aria-label={s.label + " colourway"}
            title={s.label}
            onClick={() => setPalette(s.palette)}
            style={{
              ...buttonBase,
              background: active ? "var(--surface-raised)" : "transparent",
              boxShadow: active ? "var(--highlight)" : "none",
            }}
          >
            <span
              aria-hidden
              style={{
                width: 14,
                height: 14,
                borderRadius: 999,
                background: `linear-gradient(135deg, ${s.base} 0 50%, ${s.accent} 50% 100%)`,
                boxShadow: active ? `0 0 0 1.5px var(--surface), 0 0 0 3px ${s.accent}` : "inset 0 0 0 1px rgba(127,127,127,0.35)",
              }}
            />
          </button>
        );
      })}
    </div>
  );
}

export function ModeToggle() {
  const { mode, setMode } = useTheme();
  return (
    <div role="radiogroup" aria-label="Colour theme" style={groupStyle}>
      {OPTIONS.map(({ mode: m, label, icon: Icon }) => {
        const active = mode === m;
        return (
          <button
            key={m}
            role="radio"
            aria-checked={active}
            aria-label={label + " theme"}
            title={label}
            onClick={() => setMode(m)}
            style={{
              ...buttonBase,
              background: active ? "var(--surface-raised)" : "transparent",
              boxShadow: active ? "var(--highlight)" : "none",
              color: active ? "var(--text-primary)" : "var(--text-muted)",
            }}
          >
            <Icon size={14} strokeWidth={1.5} />
          </button>
        );
      })}
    </div>
  );
}

export default function ThemeToggle() {
  return (
    <div className="inline-flex items-center gap-2 flex-wrap">
      <ModeToggle />
      <PalettePicker />
    </div>
  );
}
