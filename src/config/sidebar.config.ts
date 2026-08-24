import { ISidebar } from "@/types/sidebar.types";
import { PAGES } from "./pages.config";

export const SIDEBARITEMS: ISidebar[] = [
  {
    group: "top",
    items: [
      { id: "dashboard", label: "Панель управления", icon: "dashboard", href: PAGES.HOME },
      { id: "pos", label: "Терминал", icon: "monitor", href: PAGES.POS },
      { id: "purchases", label: "Закупки", icon: "cart", href: PAGES.PURCHASES },
      { id: "sales", label: "Продажи", icon: "receipt", href: PAGES.SALES },
      { id: "cash", label: "Касса", icon: "landmark", href: PAGES.CASH, permission: "cash:read" },
      { id: "points", label: "Точки", icon: "map-pin", href: PAGES.POINTS, permission: "warehouses:manage" },
      { id: "contragents", label: "Контрагенты", icon: "building", href: PAGES.CONTRAGENTS, permission: "contragents:manage" },
    ],
  },
  {
    group: "Персонал и зарплата",
    items: [
      { id: "users", label: "Пользователи", icon: "users", href: PAGES.USERS, permission: "users:manage" },
      { id: "calendar", label: "Производственный календарь", icon: "calendar", href: PAGES.CALENDAR, permission: "calendar:manage" },
      { id: "work-schedules", label: "Графики работы", icon: "clock", href: PAGES.WORK_SCHEDULES, permission: "schedules:manage" },
      { id: "timesheets", label: "Табель", icon: "timesheet", href: PAGES.TIMESHEETS, permission: "timesheets:read" },
      { id: "salary", label: "Оклад сотрудника", icon: "badge-dollar", href: PAGES.SALARY, permission: "payroll:read" },
      { id: "payroll", label: "Начисление зарплаты", icon: "wallet", href: PAGES.PAYROLL, permission: "payroll:read" },
    ],
  },
  {
    group: "Склад",
    items: [
      { id: "warehouses", label: "Склады", icon: "warehouse", href: PAGES.WAREHOUSES, permission: "warehouses:manage" },
      { id: "items", label: "Товары", icon: "tag", href: PAGES.PRODUCTS },
      { id: "returns", label: "Возвраты продаж", icon: "undo", href: PAGES.RETURNS, permission: "returns:create" },
      { id: "write-offs", label: "Списание товаров", icon: "file-minus", href: PAGES.WRITE_OFFS, permission: "writeoffs:create" },
      { id: "transfers", label: "Перемещения товаров", icon: "arrow-left-right", href: PAGES.TRANSFERS, permission: "transfers:create" },
      { id: "purchase-returns", label: "Возвраты поставщикам", icon: "rotate-ccw", href: PAGES.PURCHASE_RETURNS, permission: "returns:create" },
    ],
  },
];