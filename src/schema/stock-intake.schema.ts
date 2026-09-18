import { z } from "zod";

const StockIntakeItemSchema = z.object({
  productId: z.string().min(1),
  warehouseCellId: z.string().min(1, "Yacheyka tanlanishi shart"),
  qty: z.coerce.number().positive("Miqdor 0 dan katta bo'lishi kerak"),
  // Narx IXTIYORIY — bo'sh qoldirilsa, serverda Product.price bilan
  // to'ldiriladi. Shuning uchun bu yerda hech qanday xatolik BERILMAYDI.
  unitCost: z.coerce.number().nonnegative().optional().nullable(),
});

export const StockIntakeSchema = z.object({
  pointId: z.string().min(1, "Nuqta tanlanishi shart"),
  note: z.string().max(500).optional().or(z.literal("")),
  items: z.array(StockIntakeItemSchema).min(1, "Kamida bitta qator bo'lishi kerak"),
});

export type StockIntakeInput = z.infer<typeof StockIntakeSchema>;
export type StockIntakeItemInput = z.infer<typeof StockIntakeItemSchema>;
