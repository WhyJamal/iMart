"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export const ALL = "__all__";

export function useUrlFilters(keys: readonly string[]) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const get = (key: string) => searchParams.get(key) ?? "";

  const push = useCallback(
    (params: URLSearchParams) => {
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname]
  );

  const set = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (!value || value === ALL) params.delete(key);
      else params.set(key, value);
      params.delete("page");
      push(params);
    },
    [searchParams, push]
  );

  const reset = () => {
    const params = new URLSearchParams(searchParams.toString());
    [...keys, "page"].forEach((key) => params.delete(key));
    push(params);
  };

  const hasActive = keys.some((key) => !!searchParams.get(key));

  const setMany = useCallback(
    (entries: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(entries)) {
        if (!value || value === ALL) params.delete(key);
        else params.set(key, value);
      }
      params.delete("page");
      push(params);
    },
    [searchParams, push]
  );

  return { get, set, setMany, reset, hasActive };
}
