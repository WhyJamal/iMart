import { z } from "zod";
import { ROLES } from "@/types/role.types";

export const CreateUserSchema = z.object({
  name: z.string().min(1, "Ism kiritilishi shart"),
  email: z.string().email("Email noto'g'ri kiritildi"),
  password: z.string().min(8, "Parol kamida 8 belgidan iborat bo'lishi kerak"),
  role: z.enum(ROLES as [string, ...string[]]).default("CASHIER"),
  pointId: z.string().optional(),
});

export const UpdateUserRoleSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(ROLES as [string, ...string[]]),
});

export const UpdateUserPointSchema = z.object({
  userId: z.string().min(1),
  pointId: z.string().nullable(),
});

export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type UpdateUserRoleInput = z.infer<typeof UpdateUserRoleSchema>;
export type UpdateUserPointInput = z.infer<typeof UpdateUserPointSchema>;
