import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { isValidServerSecret } from "@/lib/integration";
import type { TxClient } from "@/types/prisma.types";

/**
 * narsil (SaaS) Vol-mart sotib olinganda shu API'ga murojaat qiladi.
 * Bir xil `saasProjectId` uchun ikkinchi marta chaqirilsa — mavjud
 * tashkilot qaytariladi (dublikat yaratilmaydi).
 *
 * Bitta email bir necha marta (turli `saasProjectId`) bilan kelsa —
 * YANGI User yaratilmaydi, faqat mavjud Userga yangi OrganizationMember
 * (yangi tashkilotga a'zolik) qo'shiladi. Shu tufayli login endi
 * odamning HAQIQIY emaili bilan ishlaydi — sun'iy scoped-email endi
 * yo'q — va u login qilganda bir nechta tashkilotdan birini tanlaydi.
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
  const ownerEmail = String(body?.ownerEmail ?? "")
    .trim()
    .toLowerCase();
  const saasUserId = body?.saasUserId ? String(body.saasUserId) : null;

  if (!saasProjectId || !organizationName || !ownerEmail) {
    return NextResponse.json(
      { error: "saasProjectId, organizationName, ownerEmail shart" },
      { status: 400 }
    );
  }

  // Idempotentlik: bu xarid uchun tashkilot allaqachon bor bo'lsa — o'shani qaytaramiz
  const existingOrg = await prisma.organization.findUnique({
    where: { saasProjectId },
  });

  if (existingOrg) {
    const ownerMembership = await prisma.organizationMember.findFirst({
      where: { organizationId: existingOrg.id, role: "OWNER" },
      select: { userId: true },
    });

    return NextResponse.json({
      organizationId: existingOrg.id,
      userId: ownerMembership?.userId ?? null,
      alreadyExisted: true,
    });
  }

  const result = await prisma.$transaction(async (tx: TxClient) => {
    const organization = await tx.organization.create({
      data: {
        name: organizationName,
        saasProjectId,
        subscriptionExpiresAt: body?.expiresAt ? new Date(body.expiresAt) : null,
      },
    });

    let user = await tx.user.findUnique({ where: { email: ownerEmail } });
    let rawPassword: string | null = null;

    if (!user) {
      rawPassword = crypto.randomBytes(9).toString("base64url");
      const hashedPassword = await bcrypt.hash(rawPassword, 10);

      user = await tx.user.create({
        data: {
          name: ownerName,
          email: ownerEmail,
          password: hashedPassword,
          saasUserId,
        },
      });
      console.log("[provision] YANGI user yaratildi:", ownerEmail);
    } else {
      console.log("[provision] MAVJUD user topildi, parol o'zgartirilmadi:", ownerEmail);
    }

    await tx.organizationMember.create({
      data: { userId: user.id, organizationId: organization.id, role: "OWNER" },
    });

    return { organization, user, rawPassword };
  });

  return NextResponse.json({
    organizationId: result.organization.id,
    userId: result.user.id,
    loginEmail: result.user.email,
    loginPassword: result.rawPassword,
  });
}