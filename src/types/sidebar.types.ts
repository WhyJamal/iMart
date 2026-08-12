import type { Permission } from "./role.types";

export type TIcon =
    | "dashboard"
    | "monitor"
    | "tag"
    | "cart"
    | "receipt"
    | "wallet"
    | "wrench"
    | "undo"
    | "rotate-ccw"
    | "users"
    | "landmark"
    | "badge-dollar"
    | "map-pin"
    | "warehouse"
    | "building"
    | "calendar"
    | "clock"
    | "timesheet"
    | "file-minus"
    ;

    export type TItem = {
    id: string;
    label: string;
    icon: TIcon;
    badge?: number;
    href: string;
    permission?: Permission; // bo'lmasa — hammaga ko'rinadi
};

export interface ISidebar { 
    group: string;
    defaultOpen?: boolean;
    items: TItem[];
}