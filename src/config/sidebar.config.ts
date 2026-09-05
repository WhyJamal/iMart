import { ISidebar } from "@/types/sidebar.types";
import { PAGES } from "./pages.config";

export const SIDEBARITEMS: ISidebar[] = [
  {
    groupKey: "top",
    items: [
      {
        id: "dashboard",
        labelKey: "dashboard",
        icon: "dashboard",
        href: PAGES.HOME,
      },
      {
        id: "pos",
        labelKey: "pos",
        icon: "monitor",
        href: PAGES.POS,
      },
      {
        id: "purchases",
        labelKey: "purchases",
        icon: "cart",
        href: PAGES.PURCHASES,
      },
      {
        id: "sales",
        labelKey: "sales",
        icon: "receipt",
        href: PAGES.SALES,
      },
      {
        id: "cash",
        labelKey: "cash",
        icon: "landmark",
        href: PAGES.CASH,
        permission: "cash:read",
      },
      {
        id: "points",
        labelKey: "points",
        icon: "map-pin",
        href: PAGES.POINTS,
        permission: "warehouses:manage",
      },
      {
        id: "contragents",
        labelKey: "contragents",
        icon: "building",
        href: PAGES.CONTRAGENTS,
        permission: "contragents:manage",
      },
    ],
  },

  {
    groupKey: "staffAndPayroll",
    items: [
      {
        id: "users",
        labelKey: "users",
        icon: "users",
        href: PAGES.USERS,
        permission: "users:manage",
      },
      {
        id: "calendar",
        labelKey: "calendar",
        icon: "calendar",
        href: PAGES.CALENDAR,
        permission: "calendar:manage",
      },
      {
        id: "work-schedules",
        labelKey: "workSchedules",
        icon: "clock",
        href: PAGES.WORK_SCHEDULES,
        permission: "schedules:manage",
      },
      {
        id: "timesheets",
        labelKey: "timesheets",
        icon: "timesheet",
        href: PAGES.TIMESHEETS,
        permission: "timesheets:read",
      },
      {
        id: "salary",
        labelKey: "salary",
        icon: "badge-dollar",
        href: PAGES.SALARY,
        permission: "payroll:read",
      },
      {
        id: "payroll",
        labelKey: "payroll",
        icon: "wallet",
        href: PAGES.PAYROLL,
        permission: "payroll:read",
      },
    ],
  },

  {
    groupKey: "warehouses",
    items: [
      {
        id: "warehouses",
        labelKey: "warehouses",
        icon: "warehouse",
        href: PAGES.WAREHOUSES,
        permission: "warehouses:manage",
      },
      {
        id: "items",
        labelKey: "items",
        icon: "tag",
        href: PAGES.PRODUCTS,
      },
      {
        id: "promotions",
        labelKey: "promotions",
        icon: "percent",
        href: PAGES.PROMOTIONS,
        permission: "promotions:manage",
      },
      {
        id: "transfers",
        labelKey: "transfers",
        icon: "arrow-left-right",
        href: PAGES.TRANSFERS,
        permission: "transfers:create",
      },
      {
        id: "write-offs",
        labelKey: "writeOffs",
        icon: "file-minus",
        href: PAGES.WRITE_OFFS,
        permission: "writeoffs:create",
      },
      {
        id: "purchase-returns",
        labelKey: "purchaseReturns",
        icon: "rotate-ccw",
        href: PAGES.PURCHASE_RETURNS,
        permission: "returns:create",
      },
      {
        id: "returns",
        labelKey: "returns",
        icon: "undo",
        href: PAGES.RETURNS,
        permission: "returns:create",
      }
    ],
  },
  {
    groupKey: "reports",
    items: [
      {
        id: "material-report",
        labelKey: "materialReport",
        icon: "file-bar-chart",
        href: PAGES.MATERIAL_REPORT,
        permission: "reports:read",
      },
    ],
  },
];