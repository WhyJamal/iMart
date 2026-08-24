"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { PAGES } from "@/config/pages.config";
import type { SearchGroup } from "@/types/search.types";

const RESULTS_PER_GROUP = 5;
const MIN_QUERY_LENGTH = 2;

const dateFmt = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });

/**
 * Global header search.
 *
 * Runs in two passes:
 *   1. Direct matches — entity fields (name, code, email, ...) against `q`.
 *   2. Linked documents — for entities found in pass 1 (e.g. a Contragent,
 *      a Product), pull the records that reference them (Purchases, Sales)
 *      so typing a contragent/product name also surfaces its history.
 *
 * To add a new searchable entity in the future:
 *   1. Write a `search<Entity>()` helper below, following the same shape
 *      (organizationId-scoped, `take: RESULTS_PER_GROUP`, mapped to a group).
 *   2. Add it to the first `Promise.all` list and push its group below.
 *   3. If it has related documents worth surfacing, write a
 *      `search<Entity>Documents()` helper (see the two examples below) and
 *      add it to the second `Promise.all`.
 * Nothing else (client component, dropdown UI) needs to change.
 */
export async function globalSearch(query: string): Promise<SearchGroup[]> {
  const session = await getServerSession();
  if (!session) return [];

  const q = query.trim();
  if (q.length < MIN_QUERY_LENGTH) return [];

  const { organizationId } = session;

  const [products, contragents, users] = await Promise.all([
    searchProducts(q, organizationId),
    searchContragents(q, organizationId),
    searchUsers(q, organizationId),
  ]);

  const [productDocs, contragentDocs] = await Promise.all([
    searchProductDocuments(products, organizationId),
    searchContragentDocuments(contragents, organizationId),
  ]);

  const groups: SearchGroup[] = [];

  if (products.length) {
    groups.push({
      type: "product",
      label: "Mahsulotlar",
      items: products.map((p) => ({
        id: p.id,
        title: p.name,
        subtitle: `${p.code} · ${p.category?.name ?? "Bo'limsiz"}`,
        url: PAGES.PRODUCTS,
      })),
    });
  }

  if (productDocs.length) {
    groups.push({
      type: "product-document",
      label: "Mahsulot bo'yicha hujjatlar",
      items: productDocs,
    });
  }

  if (contragents.length) {
    groups.push({
      type: "contragent",
      label: "Kontragentlar",
      items: contragents.map((c) => ({
        id: c.id,
        title: c.name,
        subtitle: c.phone ?? c.inn ?? (c.type === "SUPPLIER" ? "Sotuvchi" : "Xaridor"),
        url: PAGES.CONTRAGENTS,
      })),
    });
  }

  if (contragentDocs.length) {
    groups.push({
      type: "contragent-document",
      label: "Kontragent hujjatlari",
      items: contragentDocs,
    });
  }

  if (users.length) {
    groups.push({
      type: "user",
      label: "Xodimlar",
      items: users.map((u) => ({
        id: u.id,
        title: u.name,
        subtitle: u.email,
        url: PAGES.USER_PROFILE(u.id),
      })),
    });
  }

  return groups;
}

function searchProducts(q: string, organizationId: string) {
  // SQLite doesn't support Prisma's `mode: "insensitive"`, so keep queries plain.
  return prisma.product.findMany({
    where: {
      organizationId,
      OR: [
        { name: { contains: q } },
        { code: { contains: q } },
        { category: { name: { contains: q } } },
      ],
    },
    take: RESULTS_PER_GROUP,
    orderBy: { name: "asc" },
    include: { category: { select: { name: true } } },
  });
}

function searchContragents(q: string, organizationId: string) {
  return prisma.contragent.findMany({
    where: {
      organizationId,
      OR: [
        { name: { contains: q } },
        { phone: { contains: q } },
        { inn: { contains: q } },
      ],
    },
    take: RESULTS_PER_GROUP,
    orderBy: { name: "asc" },
  });
}

function searchUsers(q: string, organizationId: string) {
  return prisma.user.findMany({
    where: {
      organizationId,
      OR: [{ name: { contains: q } }, { email: { contains: q } }],
    },
    take: RESULTS_PER_GROUP,
    orderBy: { name: "asc" },
  });
}

/** Purchase receipts tied to a Contragent that already matched the query. */
async function searchContragentDocuments(
  contragents: { id: string }[],
  organizationId: string
) {
  if (!contragents.length) return [];

  const purchases = await prisma.purchase.findMany({
    where: {
      organizationId,
      contragentId: { in: contragents.map((c) => c.id) },
    },
    take: RESULTS_PER_GROUP,
    orderBy: { createdAt: "desc" },
    include: { contragent: { select: { name: true } } },
  });

  return purchases.map((p) => ({
    id: p.id,
    title: p.receiptNumber,
    subtitle: `${p.contragent?.name ?? ""} · ${dateFmt.format(p.createdAt)}`,
    url: PAGES.PURCHASES,
  }));
}

/** Recent sales & purchases that contain a Product which already matched the query. */
async function searchProductDocuments(
  products: { id: string; name: string }[],
  organizationId: string
) {
  if (!products.length) return [];

  const productIds = products.map((p) => p.id);

  const [saleItems, purchaseItems] = await Promise.all([
    prisma.saleItem.findMany({
      where: { productId: { in: productIds }, sale: { organizationId } },
      take: RESULTS_PER_GROUP,
      orderBy: { sale: { createdAt: "desc" } },
      include: { sale: { select: { saleNumber: true, createdAt: true } }, product: { select: { name: true } } },
    }),
    prisma.purchaseItem.findMany({
      where: { productId: { in: productIds }, receipt: { organizationId } },
      take: RESULTS_PER_GROUP,
      orderBy: { receipt: { createdAt: "desc" } },
      include: { receipt: { select: { receiptNumber: true, createdAt: true } }, product: { select: { name: true } } },
    }),
  ]);

  const sales = saleItems.map((item) => ({
    id: item.id,
    title: item.sale.saleNumber,
    subtitle: `Sotuv · ${item.product.name} · ${dateFmt.format(item.sale.createdAt)}`,
    url: PAGES.SALES,
  }));

  const purchases = purchaseItems.map((item) => ({
    id: item.id,
    title: item.receipt.receiptNumber,
    subtitle: `Xarid · ${item.product.name} · ${dateFmt.format(item.receipt.createdAt)}`,
    url: PAGES.PURCHASES,
  }));

  // Merge, most recent first, capped so one product with a long history
  // doesn't crowd out everything else in the dropdown.
  return [...sales, ...purchases].slice(0, RESULTS_PER_GROUP);
}