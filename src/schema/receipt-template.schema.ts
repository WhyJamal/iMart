import { z } from "zod";
import { TOTAL_ALIGNS } from "@/types/receipt.types";

export const ReceiptTemplateSchema = z.object({
  name: z.string().min(1, "Shablon nomi kiritilishi shart").max(80),
  showProductName: z.boolean(),
  showQty: z.boolean(),
  showUnit: z.boolean(),
  showUnitPrice: z.boolean(),
  showLineTotal: z.boolean(),
  totalAlign: z.enum(TOTAL_ALIGNS),
  headerText: z.string().max(500).optional().or(z.literal("")),
  footerText: z.string().max(500).optional().or(z.literal("")),
});

export type ReceiptTemplateInput = z.infer<typeof ReceiptTemplateSchema>;
