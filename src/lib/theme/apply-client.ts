import { getThemeCssVariables } from "./css";
import type { ThemeSettings } from "./types";

// applyThemeToDocument — saqlangandan keyin JORIY sahifada ham darhol
// ko'rinishi uchun; to'liq reload yoki navigatsiya kutilmaydi.
// Serverdagi RootLayout mantig'ini takrorlaydi (getThemeCssVariables +
// dark class), faqat DOM'ning o'zida.
export function applyThemeToDocument(theme: ThemeSettings) {
  const root = document.documentElement;

  const vars = getThemeCssVariables(theme);
  Object.entries(vars).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });

  if (theme.mode === "dark") {
    root.classList.add("dark");
  } else if (theme.mode === "light") {
    root.classList.remove("dark");
  } else {
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    root.classList.toggle("dark", prefersDark);
  }
}
