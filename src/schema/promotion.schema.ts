import { z } from "zod";

export const PromotionItemSchema = z.object({
  productId: z.string().min(1, "Товар обязателен"),
});

export const CreatePromotionSchema = z.object({
  pointId: z.string().min(1, "Точка обязательна"),
  warehouseId: z.string().min(1, "Склад обязателен"),
  warehouseCellId: z.string().min(1, "Ячейка обязательна"),
  name: z.string().trim().min(1, "Название акции обязательно").max(120),
  discountPercent: z.number().positive().max(100),
  endsAt: z.string().min(1, "Дата окончания обязательна"),
  comment: z.string().max(500).optional(),
  productIds: z.array(z.string().min(1)).min(1, "Добавьте хотя бы один товар"),
});

export type CreatePromotionInput = z.infer<typeof CreatePromotionSchema>;
