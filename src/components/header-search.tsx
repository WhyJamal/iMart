"use client";

import { useEffect, useRef, useState, useTransition } from "react";

import { Loader2, Search } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { useDebounce } from "@/hooks/use-debounce";
import { globalSearch } from "@/actions/search-actions";
import type { SearchGroup } from "@/types/search.types";

const MIN_QUERY_LENGTH = 2;

export function HeaderSearch() {
  const t = useTranslations("header");

  const [query, setQuery] = useState("");
  const [groups, setGroups] = useState<SearchGroup[]>([]);
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const containerRef = useRef<HTMLDivElement>(null);

  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    const q = debouncedQuery.trim();

    if (q.length < MIN_QUERY_LENGTH) {
      setGroups([]);
      return;
    }

    startTransition(() => {
      void (async () => {
        const result = await globalSearch(q);
        setGroups(result);
      })();
    });
  }, [debouncedQuery]);

  // Close the dropdown when clicking outside of it.
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const trimmedLength = query.trim().length;

  const hasResults = groups.some(
    (group) => group.items.length > 0
  );

  const showDropdown =
    open && trimmedLength >= MIN_QUERY_LENGTH;

  return (
    <div ref={containerRef} className="relative flex-1">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 w-4 h-4 pointer-events-none" />

      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={t("placeholder")}
        className="w-full bg-white/5 border border-white/10 rounded pl-9 pr-9 py-2 text-sm
        text-white placeholder-white/40 focus:outline-none focus:ring-2
        focus:ring-red-500 focus:bg-white/10 transition-all duration-150"
      />

      {isPending && (
        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 animate-spin" />
      )}

      {showDropdown && (
        <div
          className="absolute left-0 right-0 top-[calc(100%+8px)] max-h-96 overflow-y-auto
          rounded-lg border border-white/10 bg-[#1f0a0a] shadow-2xl z-50"
        >
          {!hasResults && !isPending && (
            <p className="px-4 py-6 text-sm text-white/40 text-center">
              {t("noResults")}
            </p>
          )}

          {groups.map((group) => (
            <div key={group.type} className="py-1.5">
              <p className="px-4 pt-1.5 pb-1 text-[11px] font-medium uppercase tracking-wide text-white/40">
                {group.label}
              </p>

              {group.items.map((item) => (
                <Link
                  key={`${group.type}-${item.id}`}
                  href={item.url}
                  onClick={() => setOpen(false)}
                  className="flex flex-col px-4 py-2 hover:bg-white/5 transition"
                >
                  <span className="text-sm text-white">
                    {item.title}
                  </span>

                  {item.subtitle && (
                    <span className="text-xs text-white/40">
                      {item.subtitle}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}