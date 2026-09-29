import type { Prisma } from "@/generated/prisma/client";

export const DEFAULT_PAGE_SIZE = 1;

export interface ListFilters {
  createdBy?: string;
  dateFrom?: string; // "YYYY-MM-DD"
  dateTo?: string; // "YYYY-MM-DD"
  page?: number;
  pageSize?: number;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PageWindow {
  page: number;
  pageSize: number;
  totalPages: number;
  skip: number;
}

function toPositiveInt(value: unknown): number | undefined {
  const n = Number(value);
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : undefined;
}

export function resolvePagination(
  total: number,
  opts: { page?: number; pageSize?: number } = {}
): PageWindow {
  const pageSize = toPositiveInt(opts.pageSize) ?? DEFAULT_PAGE_SIZE;
  const totalPages = Math.max(Math.ceil(total / pageSize), 1);
  const page = Math.min(toPositiveInt(opts.page) ?? 1, totalPages);
  return { page, pageSize, totalPages, skip: (page - 1) * pageSize };
}

export function paginated<T>(
  items: T[],
  total: number,
  window: PageWindow
): Paginated<T> {
  return {
    items,
    total,
    page: window.page,
    pageSize: window.pageSize,
    totalPages: window.totalPages,
  };
}

function parseLocalDate(
  value: string | undefined,
  edge: "start" | "end"
): Date | undefined {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const time = edge === "start" ? "00:00:00.000" : "23:59:59.999";
  const d = new Date(`${value}T${time}`);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

export function dateRangeFilter(
  dateFrom?: string,
  dateTo?: string
): Prisma.DateTimeFilter | undefined {
  const gte = parseLocalDate(dateFrom, "start");
  const lte = parseLocalDate(dateTo, "end");
  if (!gte && !lte) return undefined;

  const filter: Prisma.DateTimeFilter = {};
  if (gte) filter.gte = gte;
  if (lte) filter.lte = lte;
  return filter;
}

export function inDateRange(
  date: Date | null | undefined,
  dateFrom?: string,
  dateTo?: string
): boolean {
  if (!dateFrom && !dateTo) return true;
  if (!date) return false;

  const from = parseLocalDate(dateFrom, "start");
  if (from && date < from) return false;

  const to = parseLocalDate(dateTo, "end");
  if (to && date > to) return false;

  return true;
}
