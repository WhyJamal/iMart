export type SearchResultItem = {
  id: string;
  title: string;
  subtitle?: string;
  url: string;
};

export type SearchGroup = {
  /** Stable key for the entity type, e.g. "product" | "contragent" | "user" */
  type: string;
  /** Human readable group label shown in the dropdown */
  label: string;
  items: SearchResultItem[];
};
