"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { THEME_PRESET_NAMES } from "./presets";
import { THEME_FONT_NAMES } from "./font-presets";
import type { ThemeMode, ThemeRadius } from "./types";

const MODES: ThemeMode[] = ["light", "dark", "system"];
const RADII: ThemeRadius[] = ["none", "small", "medium", "large"];

export async function updateUserTheme(data: {
  mode?: ThemeMode;
  primary?: string;
  radius?: ThemeRadius;
  font?: string;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Noto'g'ri/begona qiymat bazaga tushib qolmasligi uchun — bu
  // yerda rad etilgan maydon shunchaki e'tiborga olinmaydi (mavjud
  // qiymat o'zgarmay qoladi), butun so'rov bekor qilinmaydi.
  const safeData: {
    mode?: ThemeMode;
    primary?: string;
    radius?: ThemeRadius;
    font?: string;
  } = {};

  if (data.mode && MODES.includes(data.mode)) safeData.mode = data.mode;
  if (data.primary && THEME_PRESET_NAMES.includes(data.primary as never)) {
    safeData.primary = data.primary;
  }
  if (data.radius && RADII.includes(data.radius)) safeData.radius = data.radius;
  if (data.font && THEME_FONT_NAMES.includes(data.font as never)) {
    safeData.font = data.font;
  }

  const result = await prisma.userThemeSettings.upsert({
    where: {
      userId: session.user.id,
    },
    create: {
      userId: session.user.id,
      ...safeData,
    },
    update: safeData,
  });

  // Butun sayt (barcha sahifalar) serverda shu jadvaldan o'qib
  // renderlanadi (RootLayout) — shuning uchun saqlangandan keyin
  // joriy sahifani "yangilash" kerak, aks holda eski qiymatlar bilan
  // ko'rsatilgan holicha qolib ketadi.
  revalidatePath("/", "layout");

  return result;
}
