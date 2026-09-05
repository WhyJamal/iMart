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
    | "percent"
    | "arrow-left-right"
    | "file-bar-chart"
    ;

    export type TItem = {
    id: string;
    labelKey: string;
    icon: TIcon;
    badge?: number;
    href: string;
    permission?: Permission; 
};

export interface ISidebar { 
    groupKey: string;
    defaultOpen?: boolean;
    items: TItem[];
}