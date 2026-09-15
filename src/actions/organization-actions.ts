"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { checkPermission } from "@/lib/permissions";
import {
  UpdateOrganizationSettingsSchema,
  type UpdateOrganizationSettingsInput,
} from "@/schema/organization.schema";
import type { ActionResult } from "@/types/action-result.types";
import type { IOrganizationSettings } from "@/types/organization.types";

export async function getOrganizationSettings(): Promise<IOrganizationSettings> {
  const session = await getServerSession();
  if (!session) throw new Error("Unauthorized");

  const organization = await prisma.organization.findUniqueOrThrow({
    where: { id: session.organizationId },
    select: { pricingMode: true, taxPercent: true },
  });

  return {
    pricingMode:
      organization.pricingMode === "AVERAGE" ? "AVERAGE" : "CATALOG",
    taxPercent: Number(organization.taxPercent),
  };
}

export async function updateOrganizationSettings(
  input: UpdateOrganizationSettingsInput
): Promise<ActionResult<IOrganizationSettings>> {
  try {
    const session = await getServerSession();
    if (!session) return { success: false, error: "Unauthorized" };

    const denied = checkPermission(session.role, "organization:manage");
    if (denied) return denied;

    const parsed = UpdateOrganizationSettingsSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    // DIQQAT: bu yerda faqat Organization.pricingMode / taxPercent
    // yangilanadi. ItemPrice / StockBalance (o'rtacha tannarx
    // registrlari)ga bu action HECH QACHON tegmaydi — ular faqat
    // stock-actions.ts#applyStockMovement orqali, xarid/kirim-chiqim
    // harakatlaridan hisoblanadi. Shuning uchun pricingMode'ni necha
    // marta almashtirsa ham (CATALOG <-> AVERAGE) o'rtacha narx qayta
    // hisoblanmaydi va baza buzilmaydi — bu sozlama faqat POS'da YANGI
    // savdo qo'shilganda TAKLIF qilinadigan narxni tanlaydi, xolos.
    const organization = await prisma.organization.update({
      where: { id: session.organizationId },
      data: {
        pricingMode: parsed.data.pricingMode,
        taxPercent: parsed.data.taxPercent,
      },
      select: { pricingMode: true, taxPercent: true },
    });

    revalidatePath("/settings");
    revalidatePath("/pos");

    return {
      success: true,
      data: {
        pricingMode:
          organization.pricingMode === "AVERAGE" ? "AVERAGE" : "CATALOG",
        taxPercent: Number(organization.taxPercent),
      },
    };
  } catch (err) {
    console.error(err);
    return { success: false, error: "Sozlamalarni saqlashda xatolik yuz berdi." };
  }
}
