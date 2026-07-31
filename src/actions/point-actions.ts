"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { checkPermission } from "@/lib/permissions";
import {
  CreatePointSchema,
  UpdatePointSchema,
  type CreatePointInput,
  type UpdatePointInput,
} from "@/schema/point.schema";
import type { ActionResult } from "@/types/action-result.types";
import type { IPoint, IPointOption } from "@/types/point.types";

export async function getPoints(): Promise<IPoint[]> {
  const session = await getServerSession();
  if (!session) throw new Error("Unauthorized");

  const points = await prisma.point.findMany({
    where: { organizationId: session.organizationId },
    include: {
      _count: { select: { warehouses: true, users: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return points.map((p: (typeof points)[number]) => ({
    id: p.id,
    name: p.name,
    warehouseCount: p._count.warehouses,
    userCount: p._count.users,
    createdAt: p.createdAt,
  }));
}

export async function getPointOptions(): Promise<IPointOption[]> {
  const session = await getServerSession();
  if (!session) throw new Error("Unauthorized");

  const points = await prisma.point.findMany({
    where: { organizationId: session.organizationId },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return points;
}

export async function createPoint(
  input: CreatePointInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await getServerSession();
    if (!session) return { success: false, error: "Unauthorized" };

    const denied = checkPermission(session.role, "warehouses:manage");
    if (denied) return denied;

    const parsed = CreatePointSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const point = await prisma.point.create({
      data: { organizationId: session.organizationId, name: parsed.data.name },
    });

    revalidatePath("/points");
    return { success: true, data: { id: point.id } };
  } catch (err) {
    console.error("[createPoint]", err);
    return { success: false, error: "Nuqtani yaratib bo'lmadi" };
  }
}

export async function updatePoint(
  input: UpdatePointInput
): Promise<ActionResult<undefined>> {
  try {
    const session = await getServerSession();
    if (!session) return { success: false, error: "Unauthorized" };

    const denied = checkPermission(session.role, "warehouses:manage");
    if (denied) return denied;

    const parsed = UpdatePointSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }
    const { id, name } = parsed.data;

    const existing = await prisma.point.findFirst({
      where: { id, organizationId: session.organizationId },
    });
    if (!existing) return { success: false, error: "Nuqta topilmadi" };

    await prisma.point.update({ where: { id }, data: { name } });

    revalidatePath("/points");
    return { success: true, data: undefined };
  } catch (err) {
    console.error("[updatePoint]", err);
    return { success: false, error: "Nuqtani yangilab bo'lmadi" };
  }
}

export async function deletePoint(id: string): Promise<ActionResult<undefined>> {
  try {
    const session = await getServerSession();
    if (!session) return { success: false, error: "Unauthorized" };

    const denied = checkPermission(session.role, "warehouses:manage");
    if (denied) return denied;

    const existing = await prisma.point.findFirst({
      where: { id, organizationId: session.organizationId },
      include: { _count: { select: { warehouses: true } } },
    });
    if (!existing) return { success: false, error: "Nuqta topilmadi" };
    if (existing._count.warehouses > 0) {
      return {
        success: false,
        error: "Avval shu nuqtadagi skladlarni o'chiring yoki ko'chiring",
      };
    }

    await prisma.point.delete({ where: { id } });

    revalidatePath("/points");
    return { success: true, data: undefined };
  } catch (err) {
    console.error("[deletePoint]", err);
    return { success: false, error: "Nuqtani o'chirib bo'lmadi" };
  }
}
