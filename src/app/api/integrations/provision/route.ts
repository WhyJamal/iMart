import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { isValidServerSecret } from "@/lib/integration";

/**
 * narsil (SaaS) Vol-mart sotib olinganda shu API'ga murojaat qiladi.
 * Bir xil `saasProjectId` uchun ikkinchi marta chaqirilsa — mavjud
 * tashkilot qaytariladi (dublikat yaratilmaydi).
 *
 * So'rov: POST, header: Authorization: Bearer <INTEGRATION_SECRET>
 * Body: { saasProjectId, organizationName, ownerName, ownerEmail, saasUserId }
 */
export async function POST(req: NextRequest) {
  if (!isValidServerSecret(req.headers.get("authorization"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const saasProjectId = String(body?.saasProjectId ?? "").trim();
  const organizationName = String(body?.organizationName ?? "").trim();
  const ownerName = String(body?.ownerName ?? "").trim() || "Egasi";
  const ownerEmail = String(body?.ownerEmail ?? "").trim();
  const saasUserId = body?.saasUserId ? String(body.saasUserId) : null;

  if (!saasProjectId || !organizationName || !ownerEmail) {
    return NextResponse.json(
      { error: "saasProjectId, organizationName, ownerEmail shart" },
      { status: 400 }
    );
  }

  // Idempotentlik: bu xarid uchun tashkilot allaqachon bor bo'lsa — o'shani qaytaramiz
  const existing = await prisma.organization.findUnique({
    where: { saasProjectId },
    include: { users: { where: { role: "OWNER" }, take: 1 } },
  });

  if (existing) {
    return NextResponse.json({
      organizationId: existing.id,
      userId: existing.users[0]?.id ?? null,
      alreadyExisted: true,
    });
  }

  // Har bir do'kon uchun alohida, sintetik-lekin-ishlaydigan login.
  // Haqiqiy emaildan farqlash uchun tashkilot ID'si qo'shiladi.
  const rawPassword = crypto.randomBytes(9).toString("base64url");
  const hashedPassword = await bcrypt.hash(rawPassword, 10);

  const result = await prisma.$transaction(async (tx) => {
    const organization = await tx.organization.create({
      data: {
        name: organizationName,
        saasProjectId,
        subscriptionExpiresAt: body?.expiresAt ? new Date(body.expiresAt) : null,
      },
    });

    const emailLocal = ownerEmail.split("@")[0] ?? "user";
    const emailDomain = ownerEmail.split("@")[1] ?? "volmart.local";
    const scopedEmail = `${emailLocal}+${organization.id.slice(-8)}@${emailDomain}`;

    const user = await tx.user.create({
      data: {
        name: ownerName,
        email: scopedEmail,
        password: hashedPassword,
        role: "OWNER",
        organizationId: organization.id,
        saasUserId,
      },
    });

    return { organization, user };
  });

  return NextResponse.json({
    organizationId: result.organization.id,
    userId: result.user.id,
    loginEmail: result.user.email,
    loginPassword: rawPassword,
  });
}
