"use client";

import { useEffect } from "react";

/**
 * useHotkey — bitta klaviatura qisqa yo'lini ro'yxatdan o'tkazadi.
 * Drawer/Dialog kabi UMUMIY modullarga (masalan ESC yopish) tegishli
 * bo'lmagan, alohida sahifa/komponentga xos qisqa yo'llar uchun.
 *
 * Ishlatish:
 *   useHotkey("Escape", () => setOpen(false));
 *   useHotkey("s", () => handleSave(), { ctrl: true }); // Ctrl+S
 *   useHotkey("k", () => openSearch(), { ctrl: true, enabled: someCondition });
 */
export function useHotkey(
  key: string,
  handler: () => void,
  options?: { ctrl?: boolean; shift?: boolean; enabled?: boolean }
) {
  const { ctrl = false, shift = false, enabled = true } = options ?? {};

  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (e: KeyboardEvent) => {
      const keyMatches = e.key.toLowerCase() === key.toLowerCase();
      const ctrlMatches = ctrl ? e.ctrlKey || e.metaKey : true;
      const shiftMatches = shift ? e.shiftKey : true;

      if (keyMatches && ctrlMatches && shiftMatches) {
        if (ctrl) e.preventDefault(); // brauzer default (masalan Ctrl+S) bloklanadi
        handler();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [key, ctrl, shift, enabled, handler]);
}
