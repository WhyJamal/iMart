"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { checkPermission } from "@/lib/permissions";
import {
    CreateWriteOffSchema,
    type CreateWriteOffInput,
} from "@/schema/write-off.schema";
import type { ActionResult } from "@/types/action-result.types";
import type { TxClient } from "@/types/prisma.types";
import type {
    TWriteOffWithItems,
    TSerializedWriteOff,
    IWriteOffStockRow,
} from "@/types/write-off.types";
import { applyStockMovement } from "@/actions/stock-actions";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateWriteOffNumber(): string {
    const ts = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `SPIS-${ts}-${rand}`;
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function getWriteOffs(): Promise<TSerializedWriteOff[]> {
    const session = await getServerSession();
    if (!session) throw new Error("Unauthorized");

    const writeOffs = await prisma.writeOff.findMany({
        where: { organizationId: session.organizationId },
        include: {
            point: { select: { id: true, name: true } },
            items: {
                include: {
                    product: { select: { id: true, name: true, code: true } },
                    warehouseCell: { select: { id: true, name: true } },
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });

    return (writeOffs as TWriteOffWithItems[]).map((w) => ({
        ...w,
        totalAmount: Number(w.totalAmount),
        items: w.items.map((item) => ({
            ...item,
            qty: Number(item.qty),
            unitCost: Number(item.unitCost),
        })),
    }));
}

/**
 * Bitta sklad yacheykasidagi hozirgi qoldiqli mahsulotlar ro'yxati —
 * spisaniye formasida yacheyka tanlanganda ko'rsatiladi. Qoldiq
 * InventoryRegister'dan (IN - OUT), narx esa ItemPrice'dan olinadi.
 */
export async function getCellStockForWriteOff(
    warehouseCellId: string,
    pointId: string
): Promise<IWriteOffStockRow[]> {
    const session = await getServerSession();
    if (!session) throw new Error("Unauthorized");

    const cell = await prisma.warehouseCell.findFirst({
        where: {
            id: warehouseCellId,
            warehouse: {
                organizationId: session.organizationId,
                pointId,
            },
        },
        select: { id: true, name: true },
    });
    if (!cell) return [];

    const registers = await prisma.inventoryRegister.findMany({
        where: { warehouseCellId },
        include: { product: { select: { id: true, name: true, code: true } } },
    });

    const qtyMap = new Map<
        string,
        { qty: number; product: { id: string; name: string; code: string } }
    >();
    for (const r of registers) {
        const signedQty = r.direction === "IN" ? Number(r.qty) : -Number(r.qty);
        const existing = qtyMap.get(r.productId);
        if (existing) {
            existing.qty += signedQty;
        } else {
            qtyMap.set(r.productId, { qty: signedQty, product: r.product });
        }
    }

    const productIds = [...qtyMap.keys()];
    const prices = await prisma.itemPrice.findMany({
        where: { warehouseCellId, productId: { in: productIds } },
    });
    const priceMap = new Map<string, number>();

    for (const p of prices) {
        priceMap.set(p.productId, Number(p.price));
    }

    return [...qtyMap.entries()]
        .filter(([, v]) => v.qty > 0)
        .map(([productId, v]) => ({
            cellId: cell.id,
            cellName: cell.name,
            productId,
            productName: v.product.name,
            productCode: v.product.code,
            qty: v.qty,
            price: priceMap.get(productId) ?? 0,
        }))
        .sort((a, b) => a.productName.localeCompare(b.productName));
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * createWriteOff — sklad yacheykasidagi tovarni sabab bilan hisobdan
 * chiqaradi (yaroqlilik muddati, buzilish, kamomad va h.k.).
 *
 * Steps (bitta tranzaksiyada):
 *  1. Zod bilan input tekshiriladi.
 *  2. Har bir qator uchun shu yacheykadagi joriy qoldiq tekshiriladi —
 *     qoldiqdan ko'p hisobdan chiqarib bo'lmaydi.
 *  3. WriteOff + WriteOffItem yaratiladi.
 *  4. InventoryRegister'ga direction: "OUT" yozuvi qo'shiladi
 *     (docType: "ADJUSTMENT") va applyStockMovement() orqali
 *     StockBalance/ItemPrice yangilanadi. Pulga aloqasi yo'q — kassaga
 *     hech narsa yozilmaydi, faqat tovar zarari.
 */
export async function createWriteOff(
    input: CreateWriteOffInput
): Promise<ActionResult<{ id: string; writeOffNumber: string }>> {
    try {
        const session = await getServerSession();
        if (!session) return { success: false, error: "Unauthorized" };

        const denied = checkPermission(session.role, "writeoffs:create");
        if (denied) return denied;

        const parsed = CreateWriteOffSchema.safeParse(input);
        if (!parsed.success) {
            return { success: false, error: parsed.error.issues[0].message };
        }
        const { pointId, reason, items } = parsed.data;

        const point = await prisma.point.findFirst({
            where: {
                id: pointId,
                organizationId: session.organizationId,
            },
            select: { id: true },
        });
        if (!point) {
            return { success: false, error: "Point not found" };
        }

        // ── Yacheykalar tanlangan Point'ga tegishliligini va joriy qoldiqni tekshirish ──
        const cellIds = [...new Set(items.map((i) => i.warehouseCellId))];
        const cells = await prisma.warehouseCell.findMany({
            where: {
                id: { in: cellIds },
                warehouse: {
                    organizationId: session.organizationId,
                    pointId,
                },
            },
            select: { id: true },
        });
        if (cells.length !== cellIds.length) {
            return { success: false, error: "One or more warehouse cells not found" };
        }

        const registers = await prisma.inventoryRegister.findMany({
            where: { warehouseCellId: { in: cellIds } },
        });
        const stockMap = new Map<string, number>();
        for (const r of registers) {
            const key = `${r.warehouseCellId}:${r.productId}`;
            const signedQty = r.direction === "IN" ? Number(r.qty) : -Number(r.qty);
            stockMap.set(key, (stockMap.get(key) ?? 0) + signedQty);
        }

        let totalAmount = 0;
        for (const item of items) {
            const key = `${item.warehouseCellId}:${item.productId}`;
            const currentStock = stockMap.get(key) ?? 0;
            if (item.qty > currentStock) {
                return {
                    success: false,
                    error: `Not enough stock to write off. Current stock: ${currentStock}`,
                };
            }
            totalAmount += item.qty * item.unitCost;
        }

        const writeOffNumber = generateWriteOffNumber();

        // ── Persist — bitta tranzaksiyada ────────────────────────────────
        const writeOff = await prisma.$transaction(async (tx: TxClient) => {
            const doc = await tx.writeOff.create({
                data: {
                    writeOffNumber,
                    organizationId: session.organizationId,
                    pointId,
                    reason: reason ?? null,
                    totalAmount,
                    createdBy: session.userId,
                    items: {
                        create: items.map((item) => ({
                            warehouseCellId: item.warehouseCellId,
                            productId: item.productId,
                            qty: item.qty,
                            unitCost: item.unitCost,
                        })),
                    },
                },
            });

            // Tovar ombordan hisobdan chiqadi (OUT) — sotuv/qaytarish emas,
            // shuning uchun docType: "ADJUSTMENT" va kassaga yozuv yo'q.
            for (const item of items) {
                await tx.inventoryRegister.create({
                    data: {
                        organizationId: session.organizationId,
                        productId: item.productId,
                        warehouseCellId: item.warehouseCellId,
                        docType: "ADJUSTMENT",
                        docId: doc.id,
                        direction: "OUT",
                        qty: item.qty,
                        unitCost: item.unitCost,
                    },
                });

                await applyStockMovement(tx, {
                    warehouseCellId: item.warehouseCellId,
                    productId: item.productId,
                    direction: "OUT",
                    qty: item.qty,
                    unitCost: item.unitCost,
                });
            }

            return doc;
        });

        revalidatePath("/write-offs");
        revalidatePath("/warehouses");
        revalidatePath("/products");

        return {
            success: true,
            data: { id: writeOff.id, writeOffNumber: writeOff.writeOffNumber },
        };
    } catch (err) {
        console.error("[createWriteOff]", err);
        return { success: false, error: "Failed to create write-off" };
    }
}

export async function deleteWriteOff(
    id: string
): Promise<ActionResult<undefined>> {
    try {
        const session = await getServerSession();
        if (!session) return { success: false, error: "Unauthorized" };

        const denied = checkPermission(session.role, "writeoffs:delete");
        if (denied) return denied;

        const writeOff = await prisma.writeOff.findFirst({
            where: { id, organizationId: session.organizationId },
        });
        if (!writeOff) return { success: false, error: "Write-off not found" };

        await prisma.$transaction(async (tx: TxClient) => {
            const registers = await tx.inventoryRegister.findMany({
                where: { docType: "ADJUSTMENT", docId: id },
            });
            for (const reg of registers) {
                if (!reg.warehouseCellId) continue;
                await applyStockMovement(tx, {
                    warehouseCellId: reg.warehouseCellId,
                    productId: reg.productId,
                    direction: "IN", // eski OUT'ni bekor qilish uchun teskarisi
                    qty: Number(reg.qty),
                    unitCost: Number(reg.unitCost ?? 0),
                });
            }

            await tx.inventoryRegister.deleteMany({
                where: { docType: "ADJUSTMENT", docId: id },
            });
            await tx.writeOff.delete({ where: { id } });
        });

        revalidatePath("/write-offs");
        revalidatePath("/warehouses");
        revalidatePath("/products");

        return { success: true, data: undefined };
    } catch (err) {
        console.error("[deleteWriteOff]", err);
        return { success: false, error: "Failed to delete write-off" };
    }
}