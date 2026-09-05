import { Metadata } from "next";
import { cookies } from "next/headers";

import { NextIntlClientProvider } from "next-intl";

import {
  LOCALES,
  type TLocale,
} from "@/config/locales.config";

import { AuthLanguageSelect } from "../(auth)/_components/auth-language-select";

export const metadata: Metadata = {
  title: "iMart-Organization",
  description: "Organization Management",
};

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();

  const cookieLocale = cookieStore.get("NEXT_LOCALE")?.value;

  const locale: TLocale =
    cookieLocale && cookieLocale in LOCALES
      ? (cookieLocale as TLocale)
      : "ru";

  const messages = (
    await import(`../../../messages/${locale}/onboarding.json`)
  ).default;

  return (
    <NextIntlClientProvider
      locale={locale}
      messages={{ onboarding: messages }}
    >
      <div className="min-h-screen bg-red-700 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          {children}

          <div className="flex justify-end mt-4">
            <AuthLanguageSelect locale={locale} />
          </div>
        </div>
      </div>
    </NextIntlClientProvider>
  );
}