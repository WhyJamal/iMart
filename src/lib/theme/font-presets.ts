// Bu faylda next/font import QILINMAYDI — shu tufayli client
// komponentlar ham (masalan, tema formasi) buni xavfsiz import qila
// oladi. Shriftning o'zini YUKLASH (next/font/google chaqiruvi) faqat
// font-loaders.ts'da, faqat layout.tsx orqali sodir bo'ladi.
export const fontCssVarNames = {
  geist: "--font-geist-sans",
  inter: "--font-preset-inter",
  manrope: "--font-preset-manrope",
  poppins: "--font-preset-poppins",
} as const;

export type ThemeFontName = keyof typeof fontCssVarNames;
export const THEME_FONT_NAMES = Object.keys(
  fontCssVarNames
) as ThemeFontName[];

export const fontLabels: Record<ThemeFontName, string> = {
  geist: "Geist",
  inter: "Inter",
  manrope: "Manrope",
  poppins: "Poppins",
};
