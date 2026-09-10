import crypto from "crypto";

/**
 * narsil (SaaS) va Vol-mart-next o'rtasidagi barcha so'rovlar shu
 * umumiy maxfiy kalit bilan imzolanadi. Ikkala loyihaning .env faylida
 * ham BIR XIL qiymat bo'lishi shart: INTEGRATION_SECRET=...
 */
function getSecret(): string {
  const secret = process.env.INTEGRATION_SECRET;
  if (!secret) throw new Error("INTEGRATION_SECRET .env da o'rnatilmagan");
  return secret;
}

function base64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Qisqa muddatli, imzolangan token yaratadi (SSO handoff uchun).
 * `payload` ichiga sir bo'lmagan ma'lumot qo'yiladi (masalan userId).
 */
export function signIntegrationToken(
  payload: Record<string, unknown>,
  expiresInSeconds = 60
): string {
  const body = { ...payload, exp: Math.floor(Date.now() / 1000) + expiresInSeconds };
  const encoded = base64url(JSON.stringify(body));
  const signature = base64url(
    crypto.createHmac("sha256", getSecret()).update(encoded).digest()
  );
  return `${encoded}.${signature}`;
}

/**
 * Tokenni tekshiradi. Muddati o'tgan yoki imzo mos kelmasa — null.
 */
export function verifyIntegrationToken<T = Record<string, unknown>>(
  token: string
): (T & { exp: number }) | null {
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;

  const expected = base64url(
    crypto.createHmac("sha256", getSecret()).update(encoded).digest()
  );

  if (
    signature.length !== expected.length ||
    !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  ) {
    return null;
  }

  try {
    const decoded = JSON.parse(
      Buffer.from(encoded.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString()
    ) as T & { exp: number };

    if (decoded.exp < Math.floor(Date.now() / 1000)) return null;
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Server-to-server so'rovlar (masalan provision) shu sarlavha orqali
 * tasdiqlanadi: `Authorization: Bearer <INTEGRATION_SECRET>`.
 */
export function isValidServerSecret(header: string | null): boolean {
  if (!header?.startsWith("Bearer ")) return false;
  const token = header.slice(7);
  return (
    token.length === getSecret().length &&
    crypto.timingSafeEqual(Buffer.from(token), Buffer.from(getSecret()))
  );
}
