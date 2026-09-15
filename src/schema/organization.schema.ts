import { z } from "zod";

// pricingMode — POS/savdoda mahsulot tanlanganda TAKLIF qilinadigan narx:
//   CATALOG -> nomenklaturadagi narx (Product.price)
//   AVERAGE -> joriy o'rtacha tannarx (ItemPrice, sklad yacheykasi bo'yicha)
export const PRICING_MODES = ["CATALOG", "AVERAGE"] as const;
export type PricingMode = (typeof PRICING_MODES)[number];

export const UpdateOrganizationSettingsSchema = z.object({
  pricingMode: z.enum(PRICING_MODES),
  taxPercent: z
    .number()
    .min(0, "Soliq foizi 0 dan kichik bo'lishi mumkin emas")
    .max(100, "Soliq foizi 100 dan katta bo'lishi mumkin emas"),
});

export type UpdateOrganizationSettingsInput = z.infer<
  typeof UpdateOrganizationSettingsSchema
>;
