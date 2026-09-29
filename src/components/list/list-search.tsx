"use client";

import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function ListSearch({ value, onChange, placeholder, className }: Props) {
  const tCommon = useTranslations("common.list");

  return (
    <div className={`relative max-w-sm ${className ?? ""}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? tCommon("searchPlaceholder")}
        className="pl-9 h-9"
      />
    </div>
  );
}
