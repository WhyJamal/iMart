import { themePresets } from "./presets";
import { fontCssVarNames } from "./font-presets";
import type { ThemeSettings } from "./types";

export function getThemeCssVariables(
  theme: ThemeSettings
): Record<string, string> {
  const preset =
    themePresets[theme.primary as keyof typeof themePresets] ??
    themePresets.red;

  const fontVarName =
    fontCssVarNames[theme.font as keyof typeof fontCssVarNames] ??
    fontCssVarNames.geist;

  return {
    "--primary": preset.primary,
    "--primary-foreground": preset.primaryForeground,
    // Sidebar o'zining alohida --sidebar-primary tokeniga ega
    // (shadcn'ning standart pattern'i) — uni ham asosiy rangga
    // tenglashtiramiz, shunda kelajakda shu tokendan foydalanadigan
    // har qanday komponent ham to'g'ri ishlaydi.
    "--sidebar-primary": preset.primary,
    "--sidebar-primary-foreground": preset.primaryForeground,

    // Diagrammalarning 5 ta rangi — avval doim qizil ottenkalarda
    // qattiq yozilgan edi (globals.css'da), endi ASOSIY rangdan
    // och-to'qlik zinasi sifatida hosil qilinadi (color-mix), shunday
    // qilib qaysi rang tanlanmasin, diagrammalar ham o'sha rangga mos
    // keladi.
    "--chart-1": "color-mix(in oklch, var(--primary) 90%, white)",
    "--chart-2": "color-mix(in oklch, var(--primary) 70%, white)",
    "--chart-3": preset.primary,
    "--chart-4": "color-mix(in oklch, var(--primary) 80%, black)",
    "--chart-5": "color-mix(in oklch, var(--primary) 60%, black)",

    "--radius": getRadiusValue(theme.radius),
    // globals.css'da allaqachon `--font-sans: var(--font-geist-sans)`
    // deb belgilangan (@theme inline ichida) — biz shu qiymatni
    // qayta yozamiz, endi u foydalanuvchi tanlagan shriftga ishora
    // qiladi. Boshqa hech narsani o'zgartirish shart emas.
    "--font-sans": `var(${fontVarName})`,
  };
}

// getThemeDarkClass — faqat "dark" yoki "light" aniq tanlangan bo'lsa
// serverning o'zi qaror qabul qila oladi (flash yo'q). "system"
// bo'lsa, server OS afzalligini bilmaydi — bu holatni layout.tsx
// alohida, kichik inline skript bilan hal qiladi (SERVER.md'dagi
// izohga qarang).
export function getThemeDarkClass(mode: ThemeSettings["mode"]): string {
  return mode === "dark" ? "dark" : "";
}

function getRadiusValue(radius: ThemeSettings["radius"]): string {
  switch (radius) {
    case "none":
      return "0rem";
    case "small":
      return "0.375rem";
    case "large":
      return "0.75rem";
    case "medium":
    default:
      return "0.625rem";
  }
}
