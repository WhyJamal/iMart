"use client";

import { useRouter } from "next/navigation";
import { Drawer } from "@/components/drawer";

export function DrawerBackdrop({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  return (
    <Drawer open onClose={() => router.back()}>
      {children}
    </Drawer>
  );
}