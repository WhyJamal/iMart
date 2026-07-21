"use client";

import { useRouter } from "next/navigation";
import { Drawer } from "@/components/drawer";

export function DrawerBackdrop({ children, isOpen = false }: { children: React.ReactNode, isOpen?: boolean; }) {
  const router = useRouter();
  return (
    <Drawer open={isOpen} onClose={() => router.back()}>
      {children}
    </Drawer>
  );
}