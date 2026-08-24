import { z } from "zod";

export const ProductCategorySchema = z.object({
  name: z.string().min(1, "Nomi kiritilishi shart").max(50),
});

export type ProductCategoryInput = z.infer<typeof ProductCategorySchema>;
