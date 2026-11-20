import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Theme = "light" | "dark";
export type ThemeMode = "light" | "dark" | "system";

export type Palette = "ink" | "graphite" | "paper";
export const PALETTES: Palette[] = ["ink", "graphite", "paper"];

interface ThemeContextType {
  theme: Theme; // the theme actually applied
  mode: ThemeMode; // what the user picked
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  palette: Palette;
  setPalette: (palette: Palette) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
const STORAGE_KEY = "sentinelpay-theme-mode";
const PALETTE_KEY = "sentinelpay-palette";

function readPalette(): Palette {
  try {
    const v = localStorage.getItem(PALETTE_KEY);
    if (v && (PALETTES as string[]).includes(v)) return v as Palette;
  } catch {
    /* storage unavailable */
  }
  return "ink";
}

function systemTheme(): Theme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function readStored(fallback: ThemeMode): ThemeMode {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "light" || v === "dark" || v === "system") return v;
  } catch {
    /* storage unavailable */
  }
  return fallback;
}

export function ThemeProvider({ children, defaultTheme = "light" }: { children: ReactNode; defaultTheme?: Theme }) {
  const [mode, setModeState] = useState<ThemeMode>(() => readStored(defaultTheme));
  const [theme, setTheme] = useState<Theme>(() => (readStored(defaultTheme) === "system" ? systemTheme() : (readStored(defaultTheme) as Theme)));

  // Work out the applied theme whenever the mode changes, and follow the OS while in system mode.
  useEffect(() => {
    if (mode !== "system") {
      setTheme(mode);
      return;
    }
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => setTheme(mq.matches ? "dark" : "light");
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [mode]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const [palette, setPaletteState] = useState<Palette>(readPalette);

  useEffect(() => {
    document.documentElement.setAttribute("data-palette", palette);
  }, [palette]);

  const setPalette = (p: Palette) => {
    setPaletteState(p);
    try {
      localStorage.setItem(PALETTE_KEY, p);
    } catch {
      /* ignore */
    }
  };

  const setMode = (m: ThemeMode) => {
    setModeState(m);
    try {
      localStorage.setItem(STORAGE_KEY, m);
    } catch {
      /* ignore */
    }
  };

  const toggleTheme = () => setMode(theme === "light" ? "dark" : "light");

  return <ThemeContext.Provider value={{ theme, mode, setMode, toggleTheme, palette, setPalette }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
}
