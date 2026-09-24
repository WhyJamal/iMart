"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

const CloseIcon = () => (
  <svg
    className="w-5 h-5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export function HelpOverlayShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const t = useTranslations("help");

  const close = () => router.back();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={close}
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="w-[98vw] h-[98vh] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          <div className="h-12 shrink-0 flex items-center justify-end px-3 border-b border-border">
            <button
              type="button"
              onClick={close}
              title={t("closeButton")}
              className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <CloseIcon />
            </button>
          </div>

          <div className="flex-1 min-h-0 flex overflow-hidden">
            {children}
          </div>
        </div>
      </div>
    </>
  );
}
