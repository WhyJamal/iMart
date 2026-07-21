import crypto from "crypto";

export function generateProductCode(name: string) {
  const base = name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 12);

  const suffix = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `${base || "PRD"}-${suffix}`;
}