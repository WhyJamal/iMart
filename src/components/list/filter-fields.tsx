"use client";

import { useState, type ReactNode } from "react";
import { format, parseISO } from "date-fns";
import { CalendarIcon, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ALL } from "./use-url-filters";

/**
 * Filtr qurilish bloklari. Har hujjat o'ziga kerakli filtrlarni shu
 * bloklardan yig'adi (qarang: sales/_components/sale-filters.tsx).
 */

export function FilterBar({
  hasActive,
  onReset,
  children,
}: {
  hasActive: boolean;
  onReset: () => void;
  children: ReactNode;
}) {
  const tCommon = useTranslations("common.list");

  return (
    <div className="flex flex-wrap items-end gap-3">
      {children}

      {hasActive && (
        <Button variant="ghost" size="sm" onClick={onReset} className="mb-0.5">
          <X className="w-3.5 h-3.5 mr-1" />
          {tCommon("resetFilters")}
        </Button>
      )}
    </div>
  );
}

function FilterField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}

export function FilterSelect({
  label,
  allLabel,
  value,
  onChange,
  options,
}: {
  label: string;
  allLabel: string;
  value: string;
  onChange: (value: string) => void;
  options: { id: string; name: string }[];
}) {
  return (
    <FilterField label={label}>
      <Select value={value || ALL} onValueChange={onChange}>
        <SelectTrigger className="w-45">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>{allLabel}</SelectItem>
          {options.map((o) => (
            <SelectItem key={o.id} value={o.id}>
              {o.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FilterField>
  );
}

export function FilterDate({
  label,
  value,
  onChange,
  min,
  max,
}: {
  label: string;
  value: string; // "YYYY-MM-DD" yoki ""
  onChange: (value: string) => void;
  min?: string; // shu sanadan oldingi kunlar o'chiriladi
  max?: string; // shu sanadan keyingi kunlar o'chiriladi
}) {
  const [open, setOpen] = useState(false);

  return (
    <FilterField label={label}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="h-9 w-37.5 justify-start font-normal"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? format(parseISO(value), "dd.MM.yyyy") : label}
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value ? parseISO(value) : undefined}
            onSelect={(date) => {
              // Tanlangan kunni qayta bossa — sana tozalanadi
              onChange(date ? format(date, "yyyy-MM-dd") : "");
              setOpen(false);
            }}
            disabled={(date) =>
              (!!min && date < parseISO(min)) || (!!max && date > parseISO(max))
            }
          />
        </PopoverContent>
      </Popover>
    </FilterField>
  );
}
