export interface HelpTopic {
  slug: string;
  sidebarLabelKey?: string;
}

export interface HelpTopicGroup {
  groupKey: string;
  topics: HelpTopic[];
}

export const HELP_TOPICS: HelpTopicGroup[] = [
  {
    groupKey: "top",
    topics: [
      { slug: "overview" },
      { slug: "dashboard", sidebarLabelKey: "dashboard" },
      { slug: "pos", sidebarLabelKey: "pos" },
      { slug: "purchases", sidebarLabelKey: "purchases" },
      { slug: "stock-intake", sidebarLabelKey: "stockIntake" },
      { slug: "sales", sidebarLabelKey: "sales" },
      { slug: "cash", sidebarLabelKey: "cash" },
      { slug: "points", sidebarLabelKey: "points" },
      { slug: "contragents", sidebarLabelKey: "contragents" },
      { slug: "debtors", sidebarLabelKey: "debtors" },
    ],
  },
  {
    groupKey: "staffAndPayroll",
    topics: [
      { slug: "users", sidebarLabelKey: "users" },
      { slug: "calendar", sidebarLabelKey: "calendar" },
      { slug: "work-schedules", sidebarLabelKey: "workSchedules" },
      { slug: "timesheets", sidebarLabelKey: "timesheets" },
      { slug: "salary", sidebarLabelKey: "salary" },
      { slug: "payroll", sidebarLabelKey: "payroll" },
    ],
  },
  {
    groupKey: "warehouses",
    topics: [
      { slug: "warehouses", sidebarLabelKey: "warehouses" },
      { slug: "items", sidebarLabelKey: "items" },
      { slug: "promotions", sidebarLabelKey: "promotions" },
      { slug: "transfers", sidebarLabelKey: "transfers" },
      { slug: "write-offs", sidebarLabelKey: "writeOffs" },
      { slug: "purchase-returns", sidebarLabelKey: "purchaseReturns" },
      { slug: "returns", sidebarLabelKey: "returns" },
    ],
  },
  {
    groupKey: "reports",
    topics: [
      { slug: "material-report", sidebarLabelKey: "materialReport" },
      { slug: "sales-report", sidebarLabelKey: "salesReport" },
      { slug: "debt-report", sidebarLabelKey: "debtReport" },
      { slug: "profit-loss", sidebarLabelKey: "profitLoss" },
    ],
  },
  {
    groupKey: "system",
    topics: [{ slug: "settings", sidebarLabelKey: "settings" }],
  },
];
