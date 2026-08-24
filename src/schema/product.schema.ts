import { z } from "zod";

export const ProductSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  price: z.coerce.number().positive("Price must be positive"),
  code: z.string().max(50).optional().or(z.literal("")),
  categoryId: z.string().min(1, "Category is required"),
  unit: z.string().min(1, "Unit is required").max(20),
  image: z.string().optional().or(z.literal("")),
});

export type ProductInput = z.infer<typeof ProductSchema>;
