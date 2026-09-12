"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isOtpExpired } from "@/lib/otp";

const Schema = z.object({
  email: z.string().email("Invalid email address"),
  code: z.string().length(6, "Code must be 6 digits"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type ActionResult =
  | { success: true }
  | { success: false; error: string };

export async function resetPassword(
  input: { email: string; code: string; password: string }
): Promise<ActionResult> {
  try {
    const parsed = Schema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const { email, code, password } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, resetCode: true, resetCodeExpiry: true },
    });

    if (!user || !user.resetCode || user.resetCode !== code) {
      return { success: false, error: "Invalid code" };
    }

    if (isOtpExpired(user.resetCodeExpiry)) {
      return { success: false, error: "Code expired" };
    }

    const hashed = await bcrypt.hash(password, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashed,
        resetCode: null,
        resetCodeExpiry: null,
      },
    });

    return { success: true };
  } catch (err) {
    console.error("[resetPassword]", err);
    return { success: false, error: "Something went wrong" };
  }
}
