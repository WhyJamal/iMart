"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { checkPermission } from "@/lib/permissions";
import {
  CreateContragentSchema,
  UpdateContragentSchema,
  type CreateContragentInput,
  type UpdateContragentInput,
} from "@/schema/contragent.schema";
import type { ActionResult } from "@/types/action-result.types";
import type {
  IContragent,
  IContragentOption,
  ContragentType,
} from "@/types/contragent.types";

export async function getContragents(): Promise<IContragent[]> {
  const session = await getServerSession();
  if (!session) throw new Error("Unauthorized");

  const rows = await prisma.contragent.findMany({
    where: { organizationId: session.organizationId },
    include: { _count: { select: { purchases: true } } },
    orderBy: { createdAt: "asc" },
  });

  return rows.map((c: (typeof rows)[number]) => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
    inn: c.inn,
    type: c.type as ContragentType,
    purchaseCount: c._count.purchases,
    createdAt: c.createdAt,
  }));
}

export async function getContragentOptions(
  type?: ContragentType
): Promise<IContragentOption[]> {
  const session = await getServerSession();
  if (!session) throw new Error("Unauthorized");

  const rows = await prisma.contragent.findMany({
    where: {
      organizationId: session.organizationId,
      ...(type ? { type } : {}),
    },
    select: { id: true, name: true, type: true },
    orderBy: { name: "asc" },
  });

  return rows.map((c: (typeof rows)[number]) => ({
    ...c,
    type: c.type as ContragentType,
  }));
}

export async function createContragent(
  input: CreateContragentInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await getServerSession();
    if (!session) return { success: false, error: "Unauthorized" };

    const denied = checkPermission(session.role, "contragents:manage");
    if (denied) return denied;

    const parsed = CreateContragentSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const contragent = await prisma.contragent.create({
      data: {
        organizationId: session.organizationId,
        name: parsed.data.name,
        phone: parsed.data.phone ?? null,
        inn: parsed.data.inn ?? null,
        type: parsed.data.type,
      },
    });

    revalidatePath("/contragents");
    return { success: true, data: { id: contragent.id } };
  } catch (err) {
    console.error("[createContragent]", err);
    return { success: false, error: "Kontragentni yaratib bo'lmadi" };
  }
}

export async function updateContragent(
  input: UpdateContragentInput
): Promise<ActionResult<undefined>> {
  try {
    const session = await getServerSession();
    if (!session) return { success: false, error: "Unauthorized" };

    const denied = checkPermission(session.role, "contragents:manage");
    if (denied) return denied;

    const parsed = UpdateContragentSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }
    const { id, name, phone, inn, type } = parsed.data;

    const existing = await prisma.contragent.findFirst({
      where: { id, organizationId: session.organizationId },
    });
    if (!existing) return { success: false, error: "Kontragent topilmadi" };

    await prisma.contragent.update({
      where: { id },
      data: { name, phone: phone ?? null, inn: inn ?? null, type },
    });

    revalidatePath("/contragents");
    return { success: true, data: undefined };
  } catch (err) {
    console.error("[updateContragent]", err);
    return { success: false, error: "Kontragentni yangilab bo'lmadi" };
  }
}

export async function deleteContragent(
  id: string
): Promise<ActionResult<undefined>> {
  try {
    const session = await getServerSession();
    if (!session) return { success: false, error: "Unauthorized" };

    const denied = checkPermission(session.role, "contragents:manage");
    if (denied) return denied;

    const existing = await prisma.contragent.findFirst({
      where: { id, organizationId: session.organizationId },
      include: { _count: { select: { purchases: true } } },
    });
    if (!existing) return { success: false, error: "Kontragent topilmadi" };
    if (existing._count.purchases > 0) {
      return {
        success: false,
        error: "Bu kontragent bilan bog'liq kirimlar bor, o'chirib bo'lmaydi",
      };
    }

    await prisma.contragent.delete({ where: { id } });

    revalidatePath("/contragents");
    return { success: true, data: undefined };
  } catch (err) {
    console.error("[deleteContragent]", err);
    return { success: false, error: "Kontragentni o'chirib bo'lmadi" };
  }
}
