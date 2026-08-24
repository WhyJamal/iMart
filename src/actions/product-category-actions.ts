"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { ProductCategorySchema } from "@/schema/product-category.schema";
import type { ActionResult } from "@/types/action-result.types";

export async function getProductCategories() {
  const session = await getServerSession();
  if (!session) throw new Error("Unauthorized");

  return prisma.productCategory.findMany({
    where: { organizationId: session.organizationId },
    orderBy: { name: "asc" },
  });
}

// Nomenklatura formasida foydalanuvchi "+ Yangi categoriya" orqali
// spravochnikni o'zi to'ldiradi. Nom allaqachon mavjud bo'lsa — o'sha
// yozuv qaytariladi (dublikat yaratilmaydi).
export async function createProductCategory(input: {
  name: string;
}): Promise<ActionResult<{ id: string; name: string }>> {
  try {
    const session = await getServerSession();
    if (!session) return { success: false, error: "Unauthorized" };

    const parsed = ProductCategorySchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const name = parsed.data.name.trim();

    const existing = await prisma.productCategory.findFirst({
      where: { organizationId: session.organizationId, name },
    });
    if (existing) {
      return { success: true, data: { id: existing.id, name: existing.name } };
    }

    const category = await prisma.productCategory.create({
      data: { name, organizationId: session.organizationId },
    });

    revalidatePath("/products");
    return { success: true, data: { id: category.id, name: category.name } };
  } catch (err) {
    console.error("[createProductCategory]", err);
    return { success: false, error: "Failed to create category" };
  }
}

export async function deleteProductCategory(
  id: string
): Promise<ActionResult<undefined>> {
  try {
    const session = await getServerSession();
    if (!session) return { success: false, error: "Unauthorized" };

    const category = await prisma.productCategory.findFirst({
      where: { id, organizationId: session.organizationId },
    });
    if (!category) return { success: false, error: "Category not found" };

    // Product.categoryId onDelete: SetNull — shu categoriyadagi
    // mahsulotlar categoriyasiz qolib ketmasligi uchun frontend
    // o'chirishdan oldin ogohlantiradi (products-count orqali).
    await prisma.productCategory.delete({ where: { id } });

    revalidatePath("/products");
    return { success: true, data: undefined };
  } catch (err) {
    console.error("[deleteProductCategory]", err);
    return { success: false, error: "Failed to delete category" };
  }
}
