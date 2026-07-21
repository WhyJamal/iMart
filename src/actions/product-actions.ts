"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { ProductSchema } from "@/schema/product.schema";
import type { ProductInput } from "@/schema/product.schema";
import type { ActionResult } from "@/types/action-result.types";
import { generateProductCode } from "@/utils/qr-generate";

export async function getProducts() {
  const session = await getServerSession();
  if (!session) throw new Error("Unauthorized");

  return prisma.product.findMany({
    where: { organizationId: session.organizationId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getProductById(id: string) {
  const session = await getServerSession();
  if (!session) throw new Error("Unauthorized");

  return prisma.product.findFirst({
    where: { id, organizationId: session.organizationId },
  });
}

export async function createProduct(
  input: ProductInput
): Promise<ActionResult<{ id: string; code: string }>> {
  try {
    const session = await getServerSession();
    if (!session) return { success: false, error: "Unauthorized" };

    const parsed = ProductSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const { name, price, code, category, image } = parsed.data;
    const finalCode = code?.trim() ? code.trim() : generateProductCode(name);

    const existing = await prisma.product.findFirst({
      where: { code: finalCode, organizationId: session.organizationId },
    });

    if (existing) {
      return { success: false, error: "Product code already exists" };
    }

    const product = await prisma.product.create({
      data: {
        name,
        price,
        code: finalCode,
        category,
        image: image?.trim() ? image.trim() : null,
        organizationId: session.organizationId,
      },
    });

    revalidatePath("/products");
    return { success: true, data: { id: product.id, code: product.code } };
  } catch (err) {
    console.error("[createProduct]", err);
    return { success: false, error: "Failed to create product" };
  }
}

export async function updateProduct(
  id: string,
  input: ProductInput
): Promise<ActionResult<{ id: string; code: string }>> {
  try {
    const session = await getServerSession();
    if (!session) return { success: false, error: "Unauthorized" };

    const product = await prisma.product.findFirst({
      where: { id, organizationId: session.organizationId },
    });

    if (!product) {
      return { success: false, error: "Product not found" };
    }

    const parsed = ProductSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const { name, price, code, category, image } = parsed.data;
    const finalCode = code?.trim() ? code.trim() : product.code || generateProductCode(name);

    const duplicate = await prisma.product.findFirst({
      where: {
        code: finalCode,
        organizationId: session.organizationId,
        NOT: { id },
      },
    });

    if (duplicate) {
      return { success: false, error: "Product code already exists" };
    }

    await prisma.product.update({
      where: { id: product.id },
      data: {
        name,
        price,
        code: finalCode,
        category,
        image: image?.trim() ? image.trim() : null,
      },
    });

    revalidatePath("/products");
    return { success: true, data: { id: product.id, code: finalCode } };
  } catch (err) {
    console.error("[updateProduct]", err);
    return { success: false, error: "Failed to update product" };
  }
}

export async function deleteProduct(
  id: string
): Promise<ActionResult<undefined>> {
  try {
    const session = await getServerSession();
    if (!session) return { success: false, error: "Unauthorized" };

    const product = await prisma.product.findFirst({
      where: { id, organizationId: session.organizationId },
    });

    if (!product) {
      return { success: false, error: "Product not found" };
    }

    await prisma.product.delete({
      where: { id: product.id },
    });

    revalidatePath("/products");
    return { success: true, data: undefined };
  } catch (err) {
    console.error("[deleteProduct]", err);
    return { success: false, error: "Failed to delete product" };
  }
}