export const LOCALES = {
  uz: {
    name: "O'zbekcha",
    nativeName: "O'zbekcha",
  },
  ru: {
    name: "Russian",
    nativeName: "Русский",
  },
  en: {
    name: "English",
    nativeName: "English",
  },
} as const;

export type TLocale = keyof typeof LOCALES;

export const DEFAULT_LOCALE: TLocale = "ru";

export const LOCALE_KEYS = Object.keys(LOCALES) as TLocale[];

export function isLocale(value: string): value is TLocale {
  return value in LOCALES;
}