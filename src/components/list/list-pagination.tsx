"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

interface Props {
  page: number;
  totalPages: number;
}

/**
 * Hamma ro'yxatlar uchun umumiy pagination. Faqat `page` parametrini
 * o'zgartiradi, qolgan barcha query parametrlar (filtrlar) saqlanadi.
 */
export function ListPagination({ page, totalPages }: Props) {
  const tCommon = useTranslations("common.list");
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  const hrefFor = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    return `${pathname}?${params.toString()}`;
  };

  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <div className="flex items-center justify-between pt-2">
      <span className="text-sm text-muted-foreground">
        {tCommon("pageOf", { page, totalPages })}
      </span>

      <div className="flex gap-2">
        <Button variant="outline" size="sm" asChild={canPrev} disabled={!canPrev}>
          {canPrev ? (
            <Link href={hrefFor(page - 1)}>
              <ChevronLeft className="w-4 h-4" />
            </Link>
          ) : (
            <span>
              <ChevronLeft className="w-4 h-4" />
            </span>
          )}
        </Button>

        <Button variant="outline" size="sm" asChild={canNext} disabled={!canNext}>
          {canNext ? (
            <Link href={hrefFor(page + 1)}>
              <ChevronRight className="w-4 h-4" />
            </Link>
          ) : (
            <span>
              <ChevronRight className="w-4 h-4" />
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}
