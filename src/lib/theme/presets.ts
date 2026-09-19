import type { ThemeSettings } from "./types";

// Har bir presetda ikkalasi ham bor: primary (asosiy rang) va
// primaryForeground (o'sha rang ustidagi matn rangi). Shu tufayli
// foydalanuvchi qaysi rangni tanlamasin, matn har doim o'qiladigan
// bo'lib qoladi — buni alohida hisoblashning hojati yo'q.
export const themePresets = {
  red: {
    primary: "oklch(0.505 0.213 27.518)",
    primaryForeground: "oklch(0.985 0 0)",
  },

  blue: {
    primary: "oklch(0.488 0.243 264.376)",
    primaryForeground: "oklch(0.985 0 0)",
  },

  green: {
    primary: "oklch(0.527 0.154 150.069)",
    primaryForeground: "oklch(0.985 0 0)",
  },

  violet: {
    primary: "oklch(0.541 0.281 293.009)",
    primaryForeground: "oklch(0.985 0 0)",
  },

  orange: {
    primary: "oklch(0.646 0.222 41.116)",
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
