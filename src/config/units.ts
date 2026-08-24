// Nomenklatura uchun o'lchov birliklari. `fractional: true` bo'lgan
// birliklar POS terminalda kasr son bilan sotiladi (masalan 0.8 kg shakar),
// `fractional: false` bo'lganlar esa faqat butun sondagi dona/quti sifatida
// +/- tugmalari bilan qo'shiladi.
export const UNIT_OPTIONS = [
  { value: "dona", label: "Dona", fractional: false },
  { value: "quti", label: "Quti", fractional: false },
  { value: "kg", label: "Kilogramm (kg)", fractional: true },
  { value: "litr", label: "Litr (l)", fractional: true },
  { value: "metr", label: "Metr (m)", fractional: true },
] as const;

export type UnitValue = (typeof UNIT_OPTIONS)[number]["value"];

export const DEFAULT_UNIT: UnitValue = "dona";

export function getUnitLabel(unit: string): string {
  return UNIT_OPTIONS.find((u) => u.value === unit)?.label ?? unit;
}

// kg/litr/metr kabi og'irlik-hajm birliklari — POS'da kasr miqdorda
// (masalan 0.8 kg) sotib olish imkonini beradi.
export function isFractionalUnit(unit: string): boolean {
  return UNIT_OPTIONS.find((u) => u.value === unit)?.fractional ?? false;
}
