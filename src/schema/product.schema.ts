import { z } from "zod";

export const ProductSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  price: z.coerce.number().positive("Price must be positive"),
  code: z.string().max(50).optional().or(z.literal("")),
  category: z.string().min(1, "Category is required").max(50),
  image: z.string().optional().or(z.literal("")),
});

export type ProductInput = z.infer<typeof ProductSchema>;