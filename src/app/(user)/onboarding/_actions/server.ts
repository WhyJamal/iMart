"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

const OrgSchema = z.object({
  name: z.string().min(2, "Organization name must be at least 2 characters").max(80),
});

type ActionResult =
  | { success: true; organizationId: string }
  | { success: false; error: string };

export async function createOrganization(input: {
  name: string;
}): Promise<ActionResult> {
  try {
    const session = await getAuthUser();
    if (!session) return { success: false, error: "Unauthorized" };
    if (session.organizationId) return { success: false, error: "Organization already exists" };

    const parsed = OrgSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const organizationId = await prisma.$transaction(async (tx: any) => {
      const org = await tx.organization.create({
        data: { name: parsed.data.name },
      });

      await tx.organizationMember.create({
        data: { userId: session.userId, organizationId: org.id, role: "OWNER" },
      });

      return org.id as string;
    });

    revalidatePath("/");
    return { success: true, organizationId };
  } catch (err) {
    console.error("[createOrganization]", err);
    return { success: false, error: "Failed to create organization" };
  }
}