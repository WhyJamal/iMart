import { prisma } from "@/lib/prisma";
import { defaultTheme } from "./defaults";
import type { ThemeSettings } from "./types";

export async function getUserTheme(
  userId: string
): Promise<ThemeSettings> {
  const theme = await prisma.userThemeSettings.findUnique({
    where: {
      userId,
    },
    select: {
      mode: true,
      primary: true,
      radius: true,
      font: true,
    },
  });

  if (!theme) {
    return defaultTheme;
  }

  return {
    mode: theme.mode as ThemeSettings["mode"],
    primary: theme.primary,
    radius: theme.radius as ThemeSettings["radius"],
    font: theme.font,
  };
}
