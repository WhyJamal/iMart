import { ISidebar } from "@/types/sidebar.types";
import { PAGES } from "./pages.config";


export const SIDEBARITEMS: ISidebar[] = [
  {
    group: "top",
    items: [
      { id: "dashboard", label: "Dashboard", icon: "dashboard", href: PAGES.HOME },
      { id: "pos", label: "Terminal", icon: "monitor", href: PAGES.POS },
      { id: "items", label: "Items", icon: "tag", href: PAGES.PRODUCTS },
      { id: "purchases", label: "Purchases", icon: "cart", href: PAGES.PURCHASES },
      { id: "sales", label: "Sales", icon: "receipt", href: PAGES.SALES },
      { id: "cash", label: "Cash", icon: "wallet", href: PAGES.CASH },
    ],
  },
  {
    group: "Склад",
    items: [
      { id: "returns", label: "Returns", icon: "undo", href: PAGES.RETURNS },
      { id: "purchase-returns", label: "Supplier returns", icon: "rotate-ccw", href: PAGES.PURCHASE_RETURNS },
    ],
  },
];