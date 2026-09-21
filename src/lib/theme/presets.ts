import type { ThemeSettings } from "./types";

// Har bir presetda ikkalasi ham bor: primary (asosiy rang) va
// primaryForeground (o'sha rang ustidagi matn rangi). Shu tufayli
// foydalanuvchi qaysi rangni tanlamasin, matn har doim o'qiladigan
// bo'lib qoladi — buni alohida hisoblashning hojati yo'q.
export const themePresets = {
  red: {
    primary: "oklch(0.577 0.245 27.325)",
    primaryForeground: "oklch(0.985 0 0)",
  },

  orange: {
    primary: "oklch(0.646 0.222 41.116)",
    primaryForeground: "oklch(0.985 0 0)",
  },

  amber: {
    primary: "oklch(0.666 0.179 58.318)",
    primaryForeground: "oklch(0.985 0 0)",
  },

  yellow: {
    primary: "oklch(0.795 0.184 86.047)",
    primaryForeground: "oklch(0.25 0.05 85)",
  },

  lime: {
    primary: "oklch(0.648 0.2 131.684)",
    primaryForeground: "oklch(0.985 0 0)",
  },

  green: {
    primary: "oklch(0.527 0.154 150.069)",
    primaryForeground: "oklch(0.985 0 0)",
  },

  emerald: {
    primary: "oklch(0.596 0.145 163.225)",
    primaryForeground: "oklch(0.985 0 0)",
  },

  teal: {
    primary: "oklch(0.6 0.118 184.704)",
    primaryForeground: "oklch(0.985 0 0)",
  },

  cyan: {
    primary: "oklch(0.609 0.126 221.723)",
    primaryForeground: "oklch(0.985 0 0)",
  },

  sky: {
    primary: "oklch(0.588 0.158 241.966)",
    primaryForeground: "oklch(0.985 0 0)",
  },

  blue: {
    primary: "oklch(0.488 0.243 264.376)",
    primaryForeground: "oklch(0.985 0 0)",
  },

  indigo: {
    primary: "oklch(0.457 0.24 277.023)",
    primaryForeground: "oklch(0.985 0 0)",
  },

  violet: {
    primary: "oklch(0.541 0.281 293.009)",
    primaryForeground: "oklch(0.985 0 0)",
  },

  purple: {
    primary: "oklch(0.558 0.288 302.321)",
    primaryForeground: "oklch(0.985 0 0)",
  },

  fuchsia: {
    primary: "oklch(0.591 0.293 322.896)",
    primaryForeground: "oklch(0.985 0 0)",
  },

  pink: {
    primary: "oklch(0.592 0.249 0.584)",
    primaryForeground: "oklch(0.985 0 0)",
  },

  rose: {
    primary: "oklch(0.586 0.253 17.585)",
    primaryForeground: "oklch(0.985 0 0)",
  },

  gray: {
    primary: "oklch(0.446 0.03 256.802)",
    primaryForeground: "oklch(0.985 0 0)",
  },

  slate: {
    primary: "oklch(0.446 0.043 257.281)",
    primaryForeground: "oklch(0.985 0 0)",
  },

  zinc: {
    primary: "oklch(0.442 0.005 285.823)",
    primaryForeground: "oklch(0.985 0 0)",
  },
} as const;

export type ThemePresetName = keyof typeof themePresets;
export const THEME_PRESET_NAMES = Object.keys(
  themePresets
) as ThemePresetName[];

export function getThemePreset(
  name: ThemePresetName,
  settings: ThemeSettings
) {
  const preset = themePresets[name] ?? themePresets.red;

  return {
    ...settings,
    primary: preset.primary,
  };
}
