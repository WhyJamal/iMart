"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { checkPermission } from "@/lib/permissions";
import { getUnitLabel } from "@/config/units";
import {
  ReceiptTemplateSchema,
  type ReceiptTemplateInput,
} from "@/schema/receipt-template.schema";
import type { ActionResult } from "@/types/action-result.types";
import type {
  IReceiptData,
  IReceiptTemplate,
  TotalAlign,
} from "@/types/receipt.types";

// Bazada birorta shablon bo'lmasa ishlatiladigan, kod ichidagi
// "zavod" shabloni — shu tufayli /settings'ga umuman kirmagan
// tashkilotda ham chek normal chiqadi.
const BUILTIN_DEFAULT: IReceiptTemplate = {
  id: "__builtin__",
  name: "Standart",
  isDefault: true,
  showProductName: true,
  showQty: true,
  showUnit: true,
  showUnitPrice: true,
  showLineTotal: true,
  totalAlign: "right",
  headerText: null,
  footerText: null,
};

function toTemplateDTO(t: {
  id: string;
  name: string;
  isDefault: boolean;
  showProductName: boolean;
  showQty: boolean;
  showUnit: boolean;
  showUnitPrice: boolean;
  showLineTotal: boolean;
  totalAlign: string;
  headerText: string | null;
  footerText: string | null;
}): IReceiptTemplate {
  return {
    id: t.id,
    name: t.name,
    isDefault: t.isDefault,
    showProductName: t.showProductName,
    showQty: t.showQty,
    showUnit: t.showUnit,
    showUnitPrice: t.showUnitPrice,
    showLineTotal: t.showLineTotal,
    totalAlign: (t.totalAlign as TotalAlign) ?? "right",
    headerText: t.headerText,
    footerText: t.footerText,
  };
}

// ─── Ro'yxat / o'qish ───────────────────────────────────────────────────────

export async function getReceiptTemplates(): Promise<IReceiptTemplate[]> {
  const session = await getServerSession();
  if (!session) return [];

  const rows = await prisma.receiptTemplate.findMany({
    where: { organizationId: session.organizationId },
    orderBy: { createdAt: "asc" },
  });

  return rows.map(toTemplateDTO);
}

async function getActiveTemplateForOrg(
  organizationId: string
): Promise<IReceiptTemplate> {
  const active = await prisma.receiptTemplate.findFirst({
    where: { organizationId, isDefault: true },
  });
  if (active) return toTemplateDTO(active);

  // Shablon umuman yaratilmagan bo'lishi mumkin — shu holatda ham
  // birinchisini (agar bo'lsa) yoki kod ichidagi standartni qaytaramiz.
  const first = await prisma.receiptTemplate.findFirst({
    where: { organizationId },
    orderBy: { createdAt: "asc" },
  });
  return first ? toTemplateDTO(first) : BUILTIN_DEFAULT;
}

// ─── Yaratish / yangilash / o'chirish ───────────────────────────────────────

export async function createReceiptTemplate(
  input: ReceiptTemplateInput
): Promise<ActionResult<IReceiptTemplate>> {
  try {
    const session = await getServerSession();
    if (!session) return { success: false, error: "Unauthorized" };

    const denied = checkPermission(session.role, "organization:manage");
    if (denied) return denied;

    const parsed = ReceiptTemplateSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const existingCount = await prisma.receiptTemplate.count({
      where: { organizationId: session.organizationId },
    });

    const created = await prisma.receiptTemplate.create({
      data: {
        organizationId: session.organizationId,
        name: parsed.data.name,
        showProductName: parsed.data.showProductName,
        showQty: parsed.data.showQty,
        showUnit: parsed.data.showUnit,
        showUnitPrice: parsed.data.showUnitPrice,
        showLineTotal: parsed.data.showLineTotal,
        totalAlign: parsed.data.totalAlign,
        headerText: parsed.data.headerText || null,
        footerText: parsed.data.footerText || null,
        // Tashkilotning BIRINCHI shabloni avtomatik asosiy bo'ladi.
        isDefault: existingCount === 0,
      },
    });

    revalidatePath("/settings/receipt");

    return { success: true, data: toTemplateDTO(created) };
  } catch (err) {
    console.error(err);
    return { success: false, error: "Shablonni yaratishda xatolik yuz berdi." };
  }
}

export async function updateReceiptTemplate(
  id: string,
  input: ReceiptTemplateInput
): Promise<ActionResult<IReceiptTemplate>> {
  try {
    const session = await getServerSession();
    if (!session) return { success: false, error: "Unauthorized" };

    const denied = checkPermission(session.role, "organization:manage");
    if (denied) return denied;

    const parsed = ReceiptTemplateSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const existing = await prisma.receiptTemplate.findFirst({
      where: { id, organizationId: session.organizationId },
    });
    if (!existing) return { success: false, error: "Shablon topilmadi" };

    const updated = await prisma.receiptTemplate.update({
      where: { id },
      data: {
        name: parsed.data.name,
        showProductName: parsed.data.showProductName,
        showQty: parsed.data.showQty,
        showUnit: parsed.data.showUnit,
        showUnitPrice: parsed.data.showUnitPrice,
        showLineTotal: parsed.data.showLineTotal,
        totalAlign: parsed.data.totalAlign,
        headerText: parsed.data.headerText || null,
        footerText: parsed.data.footerText || null,
      },
    });

    revalidatePath("/settings/receipt");

    return { success: true, data: toTemplateDTO(updated) };
  } catch (err) {
    console.error(err);
    return { success: false, error: "Shablonni saqlashda xatolik yuz berdi." };
  }
}

export async function deleteReceiptTemplate(id: string): Promise<ActionResult> {
  try {
    const session = await getServerSession();
    if (!session) return { success: false, error: "Unauthorized" };

    const denied = checkPermission(session.role, "organization:manage");
    if (denied) return denied;

    const existing = await prisma.receiptTemplate.findFirst({
      where: { id, organizationId: session.organizationId },
    });
    if (!existing) return { success: false, error: "Shablon topilmadi" };

    if (existing.isDefault) {
      return {
        success: false,
        error: "Avval boshqa shablonni asosiy qiling, keyin buni o'chiring.",
      };
    }

    await prisma.receiptTemplate.delete({ where: { id } });

    revalidatePath("/settings/receipt");

    return { success: true, data: undefined };
  } catch (err) {
    console.error(err);
    return { success: false, error: "Shablonni o'chirishda xatolik yuz berdi." };
  }
}

// setDefaultReceiptTemplate — tanlangan shablonni asosiy qiladi.
// Bitta tranzaksiyada: avvalgi asosiyni o'chiradi (isDefault=false),
// yangisiga qo'yadi. Shu tufayli bazada har doim FAQAT bitta shablon
// isDefault=true bo'lib qoladi va butun tizim (POS + Sales) shu
// yangi shablon bilan ishlay boshlaydi — boshqa hech narsani
// o'zgartirish shart emas.
export async function setDefaultReceiptTemplate(
  id: string
): Promise<ActionResult> {
  try {
    const session = await getServerSession();
    if (!session) return { success: false, error: "Unauthorized" };

    const denied = checkPermission(session.role, "organization:manage");
    if (denied) return denied;

    const existing = await prisma.receiptTemplate.findFirst({
      where: { id, organizationId: session.organizationId },
    });
    if (!existing) return { success: false, error: "Shablon topilmadi" };

    await prisma.$transaction([
      prisma.receiptTemplate.updateMany({
        where: { organizationId: session.organizationId, isDefault: true },
        data: { isDefault: false },
      }),
      prisma.receiptTemplate.update({
        where: { id },
        data: { isDefault: true },
      }),
    ]);

    revalidatePath("/settings/receipt");
    revalidatePath("/pos");
    revalidatePath("/sales");

    return { success: true, data: undefined };
  } catch (err) {
    console.error(err);
    return { success: false, error: "Asosiy shablonni belgilashda xatolik yuz berdi." };
  }
}

// ─── Bitta sotuvni chek ko'rinishida olish ──────────────────────────────────

export async function getSaleReceiptData(
  saleId: string
): Promise<ActionResult<IReceiptData>> {
  try {
    const session = await getServerSession();
    if (!session) return { success: false, error: "Unauthorized" };

    const sale = await prisma.sale.findFirst({
      where: { id: saleId, organizationId: session.organizationId },
      include: {
        organization: { select: { name: true } },
        point: { select: { name: true } },
        cashier: { select: { name: true } },
        items: { include: { product: { select: { name: true, unit: true } } } },
      },
    });
    if (!sale) return { success: false, error: "Sotuv topilmadi" };

    const template = await getActiveTemplateForOrg(session.organizationId);

    const items = sale.items.map((item: (typeof sale.items)[number]) => {
      const qty = Number(item.qty);
      const unitPrice = Number(item.unitPrice);
      return {
        productName: item.product.name,
        qty,
        unit: getUnitLabel(item.product.unit),
        unitPrice,
        lineTotal: qty * unitPrice,
      };
    });

    const subtotal = items.reduce((sum: number, i: (typeof items)[number]) => sum + i.lineTotal, 0);

    return {
      success: true,
      data: {
        saleNumber: sale.saleNumber,
        createdAt: sale.createdAt.toISOString(),
        organizationName: sale.organization.name,
        pointName: sale.point?.name ?? null,
        cashierName: sale.cashier?.name ?? null,
        paymentMethod: sale.paymentMethod,
        items,
        subtotal,
        totalAmount: Number(sale.totalAmount),
        template,
      },
    };
  } catch (err) {
    console.error(err);
    return { success: false, error: "Chekni yuklashda xatolik yuz berdi." };
  }
}
