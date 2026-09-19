import type { Metadata } from "next";
import "./globals.css";
import { SessionProvider } from "next-auth/react";

import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

import { defaultTheme } from "@/lib/theme/defaults";
import { getThemeCssVariables, getThemeDarkClass } from "@/lib/theme/css";
import { FONT_VARIABLE_CLASSNAMES } from "@/lib/theme/font-loaders";
import { auth } from "@/auth";
import { getUserTheme } from "@/lib/theme/server";

export const metadata: Metadata = {
  title: "Vol mart",
  description: "Sale app",
};

// Faqat "system" rejimida kerak — server OS afzalligini bilmaydi,
// shuning uchun bu KICHIK skript sahifa chizilishidan OLDIN (hydration
// emas, undan ham oldin) ishlaydi va kerak bo'lsa <html>ga "dark"
// class qo'shadi. "light"/"dark" aniq tanlangan bo'lsa, bu skript
// umuman ishlamaydi — chunki class allaqachon serverning o'zida
// (pastda) to'g'ri qo'yilgan bo'ladi, hech qanday flash yo'q.
const SYSTEM_MODE_SCRIPT = `
  (function () {
    try {
      var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (prefersDark) document.documentElement.classList.add("dark");
    } catch (e) {}
  })();
  `;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();

  const session = await auth();

  const theme = session?.user?.id
    ? await getUserTheme(session.user.id)
    : defaultTheme;

  const themeVariables = getThemeCssVariables(theme);
  const darkClass = getThemeDarkClass(theme.mode);

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${FONT_VARIABLE_CLASSNAMES} h-full antialiased ${darkClass}`}
      style={themeVariables}
    >
      <head>
        {theme.mode === "system" && (
          <script dangerouslySetInnerHTML={{ __html: SYSTEM_MODE_SCRIPT }} />
        )}
      </head>
      <body className="min-h-full flex flex-col">
        <NextIntlClientProvider>
          <SessionProvider>
            <TooltipProvider>
              {children}
              <Toaster />
            </TooltipProvider>
          </SessionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
