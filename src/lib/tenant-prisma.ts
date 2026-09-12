import { prisma } from "./prisma";

/**
 * TENANT SCOPING — STRUKTURAVIY HIMOYA
 * ====================================
 *
 * Qo'lda audit qilish (scripts/tenant-audit.py) faqat HOZIRGI kodni
 * tekshiradi. Bu fayl esa — kelajakda kimdir yangi action yozib,
 * organizationId'ni yozishni UNUTIB QO'YSA ham, so'rov baribir
 * tashkilot bo'yicha filtrlanishini KAFOLATLAYDI (Prisma darajasida).
 *
 * Ishlatilishi:
 *   const db = scopedPrisma(session.organizationId);
 *   await db.product.findMany();  // organizationId avtomatik qo'shiladi
 *   await db.product.findUnique({ where: { id } }); // shu ham
 *
 * MUHIM — hozircha OPT-IN:
 * Mavjud src/actions/*.ts fayllar hali ham global `prisma`ni
 * ishlatadi (ular qo'lda to'liq audit qilingan — 2026-yil sana bilan
 * bu faylga qarang: barcha ~190 chaqiriq tekshirilgan). Bu extension
 * ULARNI hali qamramaydi. Yangi kod yozganda (yoki mavjudini
 * bosqichma-bosqich ko'chirganda) `prisma` o'rniga shu yerdagi
 * `scopedPrisma(organizationId)`ni ishlatish tavsiya etiladi —
 * shunda organizationId'ni qo'lda yozish umuman shart bo'lmay qoladi
 * va noto'g'ri yozilgan taqdirda ham xato tashkilotga chiqib
 * ketolmaydi.
 *
 * Yangi tenant-scoped model qo'shsangiz — pastdagi TENANT_MODELS
 * ro'yxatiga ham qo'shing (aks holda bu model uchun himoya ishlamaydi).
 */

export const TENANT_MODELS = new Set([
  "WorkCalendar",
  "BankAccount",
  "CashFlow",
  "CashRegister",
  "Contragent",
  "Debtor",
  "DebtorPayment",
  "SupplierPayment",
  "InventoryRegister",
  "PayrollAccrual",
  "PayrollPayment",
  "SalaryRegister",
  "Point",
  "Product",
  "ProductCategory",
  "Promotion",
  "PurchaseReturn",
  "Purchase",
  "SaleReturn",
  "Sale",
  "Timesheet",
  "Transfer",
  "Warehouse",
  "WorkSchedule",
  "WorkScheduleTemplate",
  "WriteOff",
  "OrganizationMember",
]);

const READ_AND_SINGLE_WRITE_OPS = new Set([
  "findFirst",
  "findFirstOrThrow",
  "findUnique",
  "findUniqueOrThrow",
  "findMany",
  "count",
  "aggregate",
  "groupBy",
  "update",
  "delete",
  "updateMany",
  "deleteMany",
]);

/**
 * Berilgan tashkilot bilan "qulflangan" Prisma client qaytaradi.
 * Tenant-scoped modellar uchun HAR BIR so'rovga organizationId
 * majburiy ravishda qo'shiladi (mavjud where'ga qo'shiladi, create
 * uchun data'ga qo'shiladi) — chaqiruvchi yozmagan yoki noto'g'ri
 * yozgan taqdirda ham.
 */

export function scopedPrisma(organizationId: string) {
  if (!organizationId) {
    throw new Error(
      "scopedPrisma(): organizationId bo'sh bo'lishi mumkin emas"
    );
  }

  return prisma.$extends({
    name: "tenant-scope",

    query: {
      $allModels: {
        async $allOperations({
          model,
          operation,
          args,
          query,
        }: {
          model: string;
          operation: string;
          args: any;
          query: (args: any) => any;
        }) {
          if (!model || !TENANT_MODELS.has(model)) {
            return query(args);
          }

          const a = args as {
            where?: Record<string, unknown>;
            data?: unknown;
          };

          if (READ_AND_SINGLE_WRITE_OPS.has(operation)) {
            a.where = {
              ...(a.where ?? {}),
              organizationId,
            };
          } else if (operation === "create") {
            a.data = {
              ...(a.data as Record<string, unknown>),
              organizationId,
            };
          } else if (
            operation === "createMany" &&
            Array.isArray(a.data)
          ) {
            a.data = (a.data as Record<string, unknown>[]).map((d) => ({
              ...d,
              organizationId,
            }));
          } else if (operation === "upsert") {
            const u = args as {
              where?: Record<string, unknown>;
              create?: Record<string, unknown>;
            };

            u.where = {
              ...(u.where ?? {}),
              organizationId,
            };

            u.create = {
              ...(u.create ?? {}),
              organizationId,
            };
          }

          return query(args);
        },
      },
    },
  });
}

export type ScopedPrismaClient = ReturnType<typeof scopedPrisma>;
