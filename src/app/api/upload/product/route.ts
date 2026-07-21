import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import path from "path";
import fs from "fs";

export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const oldPath = formData.get("oldPath") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file" }, { status: 400 });
    }

    const orgId = session.organizationId;

    const dir = path.join(process.cwd(), "public", "uploads", orgId, "products");

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (oldPath) {
      const fullOldPath = path.join(process.cwd(), "public", oldPath);
      if (fs.existsSync(fullOldPath)) {
        fs.unlinkSync(fullOldPath);
      }
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const fileName = `${Date.now()}-${file.name}`;
    const filePath = path.join(dir, fileName);

    fs.writeFileSync(filePath, buffer);

    const fileUrl = `/uploads/${orgId}/products/${fileName}`;

    return NextResponse.json({ url: fileUrl });
  } catch (e) {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}