"use client";

import { useMemo, useState } from "react";

export function useLocalSearch<T>(items: T[], getSearchText: (item: T) => string) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => getSearchText(item).toLowerCase().includes(q));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, search]);

  return { search, setSearch, filtered };
}
