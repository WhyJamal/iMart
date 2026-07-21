export type TIcon =
    | "dashboard"
    | "monitor"
    | "tag"
    | "cart"
    | "receipt"
    | "wallet"
    | "wrench"
    | "undo"
    | "rotate-ccw";

    export type TItem = {
    id: string;
    label: string;
    icon: TIcon;
    badge?: number;
    href: string;
};

export interface ISidebar { 
    group: string;
    defaultOpen?: boolean;
    items: TItem[];
}