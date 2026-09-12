// Email tasdiqlash va parolni tiklash uchun 6 xonali kod generatsiya
// qilish/hisoblash yordamchisi. Kod matn ko'rinishida saqlanadi
// (masalan "042917" — boshida 0 bo'lishi mumkin).

export const OTP_TTL_MINUTES = 10;

export function generateOtpCode(): string {
  const code = Math.floor(100000 + Math.random() * 900000);
  return String(code);
}

export function getOtpExpiry(minutes: number = OTP_TTL_MINUTES): Date {
  return new Date(Date.now() + minutes * 60 * 1000);
}

export function isOtpExpired(expiry: Date | null): boolean {
  if (!expiry) return true;
  return expiry.getTime() < Date.now();
}
