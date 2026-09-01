"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "@/lib/auth"
import { applyStockMovement } from "@/actions/stock-actions"
import type { ActionResult } from "@/types/action-result.types"
import type { TxClient } from "@/types/prisma.types"
import { z } from "zod"

const ImportRowSchema = z.object({
  name: z.string().trim().min(1),
  price: z.number().nonnegative(),
  quantity: z.number().nonnegative(),
  unit: z.enum(["dona", "quti", "kg", "litr", "metr"]),
  warehouseCellId: z.string().min(1),
})

function normalizeProductName(name: string) {
  return name
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("ru-RU")
}

export async function confirmProductImport(
  rows: z.infer<typeof ImportRowSchema>[]
): Promise<ActionResult<{ count: number }>> {
  const session = await getServerSession()

  if (!session?.organizationId) {
    return {
      success: false,
      error: "Пройти авторизацию",
    }
  }

  const validated = z.array(ImportRowSchema).min(1).safeParse(rows)

  if (!validated.success) {
    return {
      success: false,
      error: "Данные введены некорректно",
    }
  }

  const validatedRows = validated.data

  const cellIds = [
    ...new Set(validatedRows.map((r) => r.warehouseCellId)),
  ]

  const cells = await prisma.warehouseCell.findMany({
    where: {
      id: { in: cellIds },
      warehouse: {
        organizationId: session.organizationId,
      },
    },
    select: {
      id: true,
    },
  })

  if (cells.length !== cellIds.length) {
    return {
      success: false,
      error: "Ячейка склада не найдена",
    }
  }

  try {
    const count = await prisma.$transaction(async (tx: TxClient) => {
      let created = 0

      const existingProducts = await tx.product.findMany({
        where: {
          organizationId: session.organizationId,
        },
      })

      const productMap = new Map(
        existingProducts.map((product) => [
          normalizeProductName(product.name),
          product,
        ])
      )

      for (const row of validatedRows) {
        const name = row.name.trim()
        const normalizedName = normalizeProductName(name)

        const existingProduct = productMap.get(normalizedName)

        let product

        if (existingProduct) {
          product = existingProduct

          await tx.inventoryRegister.create({
            data: {
              organizationId: session.organizationId,
              productId: product.id,
              warehouseCellId: row.warehouseCellId,
              docType: "IMPORT",
              docId: product.id,
              direction: "IN",
              qty: row.quantity,
              unitCost: product.price,
            },
          })

          await applyStockMovement(tx, {
            warehouseCellId: row.warehouseCellId,
            productId: product.id,
            direction: "IN",
            qty: row.quantity,
            unitCost: product.price,
          })
        } else {
          product = await tx.product.create({
            data: {
              name,
              price: row.price,
              code: crypto.randomUUID(),
              unit: row.unit,
              organizationId: session.organizationId,
            },
          })

          productMap.set(normalizedName, product)

          await tx.inventoryRegister.create({
            data: {
              organizationId: session.organizationId,
              productId: product.id,
              warehouseCellId: row.warehouseCellId,
              docType: "IMPORT",
              docId: product.id,
              direction: "IN",
              qty: row.quantity,
              unitCost: row.price,
            },
          })

          await applyStockMovement(tx, {
            warehouseCellId: row.warehouseCellId,
            productId: product.id,
            direction: "IN",
            qty: row.quantity,
            unitCost: row.price,
          })

          created++
        }
      }

      return created
    })

    revalidatePath("/products")
    revalidatePath("/warehouses")

    return {
      success: true,
      data: { count },
    }
  } catch (err) {
    console.error("Import confirm error:", err)

    return {
      success: false,
      error: "Ошибка при записи в базу",
    }
  }
}