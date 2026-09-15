import type { PricingMode } from "@/schema/organization.schema";

export interface IOrganizationSettings {
  pricingMode: PricingMode;
  taxPercent: number;
}
