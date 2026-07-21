"use client";

import { ReactNode, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function Drawer({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);

      setTimeout(() => {
        setVisible(true);
      }, 10);
    } else {
      setVisible(false);

      const t = setTimeout(() => {
        setMounted(false);
      }, 300);

      return () => clearTimeout(t);
    }
  }, [open]);

  if (!mounted) return null;

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/30 transition-opacity duration-300 h-full",
          visible ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
      />

      <div
        className={cn(
          "fixed z-50 bottom-0 right-0 h-[80vh] bg-white border-t shadow-xl rounded-tl-2xl ",
          "left-(--sidebar-width)",
          "transition-transform duration-300 ease-out",
          visible ? "translate-y-0" : "translate-y-full"
        )}
      >
        {children}
      </div>
    </>
  );
}