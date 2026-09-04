import { Metadata } from "next";
import { cookies } from "next/headers";

import {
  LOCALES,
  type TLocale,
} from "@/config/locales.config";

import { AuthLanguageSelect } from "./_components/auth-language-select";

export const metadata: Metadata = {
  title: "iMart-Auth",
  description: "Authentification",
};

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();

  const cookieLocale = cookieStore.get("NEXT_LOCALE")?.value;

  const locale: TLocale =
    cookieLocale && cookieLocale in LOCALES
      ? (cookieLocale as TLocale)
      : "uz";

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {children}
        <div className="flex justify-end mt-4">
          <AuthLanguageSelect locale={locale} />
        </div>
      </div>
    </div>
  );
}