"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { generateOtpCode, getOtpExpiry } from "@/lib/otp";
import { sendPasswordResetEmail } from "@/lib/mailer";

const Schema = z.object({
  email: z.string().email("Invalid email address"),
});

type ActionResult =
  | { success: true }
  | { success: false; error: string };

export async function requestPasswordReset(
  input: { email: string }
): Promise<ActionResult> {
  try {
    const parsed = Schema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email },
      select: { id: true, email: true },
    });

    // Email mavjud bo'lmasa ham "success" qaytaramiz — aks holda kimning
    // ro'yxatdan o'tgan-o'tmaganini bilib olish (user enumeration) mumkin
    // bo'lib qoladi.
    if (user) {
      const code = generateOtpCode();

      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetCode: code,
          resetCodeExpiry: getOtpExpiry(),
        },
      });

      await sendPasswordResetEmail(user.email, code);
    }

    return { success: true };
  } catch (err) {
    console.error("[requestPasswordReset]", err);
    return { success: false, error: "Something went wrong" };
  }
}
