"use server";

import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateOtpCode, getOtpExpiry, isOtpExpired } from "@/lib/otp";
import { sendVerificationEmail } from "@/lib/mailer";

const VerifySchema = z.object({
  code: z.string().min(6, "Code must be 6 digits").max(6, "Code must be 6 digits"),
});

type ActionResult =
  | { success: true }
  | { success: false; error: string };

export async function verifyEmailCode(input: { code: string }): Promise<ActionResult> {
  try {
    const parsed = VerifySchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        emailVerified: true,
        verificationCode: true,
        verificationCodeExpiry: true,
      },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    if (user.emailVerified) {
      return { success: true };
    }

    if (!user.verificationCode || user.verificationCode !== parsed.data.code) {
      return { success: false, error: "Invalid code" };
    }

    if (isOtpExpired(user.verificationCodeExpiry)) {
      return { success: false, error: "Code expired" };
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        emailVerified: true,
        verificationCode: null,
        verificationCodeExpiry: null,
      },
    });

    return { success: true };
  } catch (err) {
    console.error("[verifyEmailCode]", err);
    return { success: false, error: "Something went wrong" };
  }
}

export async function resendVerificationCode(): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, emailVerified: true },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    if (user.emailVerified) {
      return { success: true };
    }

    const code = generateOtpCode();

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        verificationCode: code,
        verificationCodeExpiry: getOtpExpiry(),
      },
    });

    await sendVerificationEmail(user.email, code);

    return { success: true };
  } catch (err) {
    console.error("[resendVerificationCode]", err);
    return { success: false, error: "Something went wrong" };
  }
}
