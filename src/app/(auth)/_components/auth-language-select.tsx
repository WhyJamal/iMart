"use client";

import { useRouter } from "next/navigation";
import {
  LOCALE_KEYS,
  LOCALES,
  type TLocale,
} from "@/config/locales.config";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  locale: TLocale;
}

export function AuthLanguageSelect({ locale }: Props) {
  const router = useRouter();

  const handleChange = (value: TLocale) => {
    // Locale'ni session emas, cookie orqali saqlaymiz
    document.cookie = `NEXT_LOCALE=${value}; path=/; max-age=31536000; samesite=lax`;

    router.refresh();
  };

  return (
    <Select value={locale} onValueChange={handleChange}>
      <SelectTrigger className="h-9 w-30 rounded-lg border-gray-200 bg-white text-sm">
        <SelectValue />
      </SelectTrigger>

      <SelectContent>
        {LOCALE_KEYS.map((item) => (
          <SelectItem key={item} value={item}>
            {LOCALES[item].nativeName}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}