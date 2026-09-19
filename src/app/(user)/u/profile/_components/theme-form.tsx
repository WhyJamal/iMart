"use client";

import { useEffect, useState, useTransition } from "react";
import type { CSSProperties } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Sun, Moon, Monitor, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

import { updateUserTheme } from "@/lib/theme/actions";
import { getThemeCssVariables } from "@/lib/theme/css";
import { applyThemeToDocument } from "@/lib/theme/apply-client";
import { themePresets, THEME_PRESET_NAMES } from "@/lib/theme/presets";
import { THEME_FONT_NAMES, fontLabels } from "@/lib/theme/font-presets";
import type { ThemeSettings, ThemeMode, ThemeRadius } from "@/lib/theme/types";

const MODE_ICONS: Record<ThemeMode, typeof Sun> = {
  light: Sun,
  dark: Moon,
  system: Monitor,
};

const RADIUS_PREVIEW: Record<ThemeRadius, string> = {
  none: "rounded-none",
  small: "rounded-sm",
  medium: "rounded-md",
  large: "rounded-xl",
};

// globals.css'dagi :root / .dark bloklaridan AYNAN shu qiymatlar.
// Preview panelida MUHIM: faqat ".dark" klassini qo'shib-o'chirish
// YETARLI EMAS — chunki --background/--foreground CSS o'zgaruvchisi
// meros (inherit) bo'lib, agar haqiqiy sahifaning o'zi hozir dark
// bo'lsa, preview divi klasssiz qolsa ham otasidan dark qiymatni
// meros olib turaveradi (klass yo'qligi uni "qayta oq" qilib
// bermaydi). Shuning uchun bu yerda ikkala palitrani ANIQ qiymat
// bilan to'g'ridan-to'g'ri belgilaymiz.
const PREVIEW_PALETTE = {
  light: {
    background: "oklch(1 0 0)",
    foreground: "oklch(0.145 0 0)",
    card: "oklch(1 0 0)",
    cardForeground: "oklch(0.145 0 0)",
    border: "oklch(0.922 0 0)",
    secondary: "oklch(0.967 0.001 286.375)",
    secondaryForeground: "oklch(0.21 0.006 285.885)",
    destructive: "oklch(0.577 0.245 27.325)",
  },
  dark: {
    background: "oklch(0.145 0 0)",
    foreground: "oklch(0.985 0 0)",
    card: "oklch(0.205 0 0)",
    cardForeground: "oklch(0.985 0 0)",
    border: "oklch(1 0 0 / 10%)",
    secondary: "oklch(0.274 0.006 286.033)",
    secondaryForeground: "oklch(0.985 0 0)",
    destructive: "oklch(0.704 0.191 22.216)",
  },
} as const;

interface Props {
  initialTheme: ThemeSettings;
}

export function ThemeForm({ initialTheme }: Props) {
  const t = useTranslations("profile.theme");
  const [isPending, startTransition] = useTransition();

  const [draft, setDraft] = useState<ThemeSettings>(initialTheme);
  const [systemPrefersDark, setSystemPrefersDark] = useState(false);

  useEffect(() => {
    setSystemPrefersDark(
      window.matchMedia("(prefers-color-scheme: dark)").matches
    );
  }, []);

  const isDirty = JSON.stringify(draft) !== JSON.stringify(initialTheme);

  const previewIsDark =
    draft.mode === "dark" || (draft.mode === "system" && systemPrefersDark);

  const previewVars = getThemeCssVariables(draft);

  const handleSave = () => {
    startTransition(async () => {
      try {
        await updateUserTheme(draft);
        applyThemeToDocument(draft);
        toast.success(t("saved"));
      } catch {
        toast.error(t("error"));
      }
    });
  };

  return (
    <div className="pt-6 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
        {/* Boshqaruvlar */}
        <div className="space-y-6">
          {/* Mode */}
          <div className="space-y-2">
            <Label className="text-[13px] font-medium text-[#6e6e73]">
              {t("mode")}
            </Label>
            <div className="grid grid-cols-3 gap-2 max-w-sm">
              {(["light", "dark", "system"] as ThemeMode[]).map((mode) => {
                const Icon = MODE_ICONS[mode];
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setDraft((d) => ({ ...d, mode }))}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-lg border py-3 text-xs font-medium transition-colors",
                      draft.mode === mode
                        ? "border-[#e30013] bg-[#e30013]/5 text-[#e30013]"
                        : "border-[#d2d2d7] text-[#6e6e73] hover:bg-[#f5f5f7]"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {t(`modes.${mode}`)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Rang */}
          <div className="space-y-2">
            <Label className="text-[13px] font-medium text-[#6e6e73]">
              {t("color")}
            </Label>
            <div className="flex gap-3">
              {THEME_PRESET_NAMES.map((name) => (
                <button
                  key={name}
                  type="button"
                  title={t(`colors.${name}`)}
                  onClick={() => setDraft((d) => ({ ...d, primary: name }))}
                  className="relative w-9 h-9 rounded-full flex items-center justify-center ring-offset-2 transition-shadow"
                  style={{
                    backgroundColor: themePresets[name].primary,
                    boxShadow:
                      draft.primary === name
                        ? `0 0 0 2px white, 0 0 0 4px ${themePresets[name].primary}`
                        : undefined,
                  }}
                >
                  {draft.primary === name && (
                    <Check className="w-4 h-4 text-white" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Radius */}
          <div className="space-y-2">
            <Label className="text-[13px] font-medium text-[#6e6e73]">
              {t("radius")}
            </Label>
            <div className="grid grid-cols-4 gap-2 max-w-sm">
              {(["none", "small", "medium", "large"] as ThemeRadius[]).map(
                (radius) => (
                  <button
                    key={radius}
                    type="button"
                    onClick={() => setDraft((d) => ({ ...d, radius }))}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-lg border py-3 text-xs font-medium transition-colors",
                      draft.radius === radius
                        ? "border-[#e30013] bg-[#e30013]/5 text-[#e30013]"
                        : "border-[#d2d2d7] text-[#6e6e73] hover:bg-[#f5f5f7]"
                    )}
                  >
                    <span
                      className={cn(
                        "w-5 h-5 border-2 border-current",
                        RADIUS_PREVIEW[radius]
                      )}
                    />
                    {t(`radii.${radius}`)}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Shrift */}
          <div className="space-y-2 max-w-xs">
            <Label className="text-[13px] font-medium text-[#6e6e73]">
              {t("font")}
            </Label>
            <Select
              value={draft.font}
              onValueChange={(font) => setDraft((d) => ({ ...d, font }))}
            >
              <SelectTrigger className="h-10 rounded-lg border-[#d2d2d7] text-[15px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {THEME_FONT_NAMES.map((name) => (
                  <SelectItem key={name} value={name}>
                    {fontLabels[name]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleSave} disabled={isPending || !isDirty}>
            {isPending ? t("saving") : t("save")}
          </Button>
        </div>

        {/* Jonli preview — o'zgartirish paytida DARHOL ko'rinadi,
            lekin haqiqiy sahifaga "Saqlash" bosilgunicha ta'sir
            qilmaydi. */}
        <div className="space-y-2">
          <Label className="text-[13px] font-medium text-[#6e6e73]">
            {t("preview")}
          </Label>
          <div
            className={cn(
              "rounded-2xl border overflow-hidden",
              previewIsDark && "dark"
            )}
            style={{
              ...previewVars,
              // Ikkala palitradan mosini ANIQ (inherit'ga
              // ishonmasdan) belgilaymiz — shu tufayli preview
              // haqiqiy sahifaning joriy holatidan mustaqil ishlaydi.
              "--background": PREVIEW_PALETTE[previewIsDark ? "dark" : "light"].background,
              "--foreground": PREVIEW_PALETTE[previewIsDark ? "dark" : "light"].foreground,
              "--card": PREVIEW_PALETTE[previewIsDark ? "dark" : "light"].card,
              "--card-foreground": PREVIEW_PALETTE[previewIsDark ? "dark" : "light"].cardForeground,
              "--border": PREVIEW_PALETTE[previewIsDark ? "dark" : "light"].border,
              "--secondary": PREVIEW_PALETTE[previewIsDark ? "dark" : "light"].secondary,
              "--secondary-foreground": PREVIEW_PALETTE[previewIsDark ? "dark" : "light"].secondaryForeground,
              "--destructive": PREVIEW_PALETTE[previewIsDark ? "dark" : "light"].destructive,
              backgroundColor: "var(--background)",
              color: "var(--foreground)",
              borderColor: "var(--border)",
              fontFamily: "var(--font-sans)",
            } as CSSProperties}
          >
            <Card className="border-0 rounded-none shadow-none">
              <CardHeader>
                <CardTitle className="text-base">{t("previewTitle")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Button size="sm">{t("previewSamples.primary")}</Button>
                  <Button size="sm" variant="secondary">
                    {t("previewSamples.secondary")}
                  </Button>
                  <Button size="sm" variant="outline">
                    {t("previewSamples.outline")}
                  </Button>
                  <Button size="sm" variant="destructive">
                    {t("previewSamples.destructive")}
                  </Button>
                </div>

                <Input placeholder={t("previewSamples.inputPlaceholder")} />

                <div className="flex gap-2">
                  <Badge>{t("previewSamples.badge")}</Badge>
                  <Badge variant="secondary">
                    {t("previewSamples.badgeSecondary")}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}