"use client";

import type { CSSProperties } from "react";
import { useTranslations } from "next-intl";
import type { IReceiptData } from "@/types/receipt.types";

// Zigzag ("yirtilgan qog'oz") chetlarni CSS gradient bilan hosil
// qilamiz — rasm yoki SVG kerak emas. Naqsh backdrop rangiga qarshi
// "kesilgan" bo'lib ko'rinadi, shuning uchun --receipt-bg CSS
// o'zgaruvchisi orqali qog'oz rangini beramiz.
const TOOTH = 14; // bitta "tish" kengligi (px)

function zigzagStyle(flip: boolean): CSSProperties {
  return {
    height: TOOTH / 2,
    backgroundImage: `linear-gradient(${flip ? "225deg" : "45deg"}, transparent 50%, var(--receipt-bg) 50%), linear-gradient(${flip ? "135deg" : "-45deg"}, transparent 50%, var(--receipt-bg) 50%)`,
    backgroundSize: `${TOOTH}px ${TOOTH}px`,
    backgroundRepeat: "repeat-x",
    backgroundPosition: "0 0",
  };
}

function fmt(n: number) {
  return new Intl.NumberFormat("ru-RU").format(Math.round(n));
}

export function Receipt({ data }: { data: IReceiptData }) {
  const t = useTranslations("receipt");
  const { template } = data;

  const alignClass =
    template.totalAlign === "left"
      ? "text-left"
      : template.totalAlign === "center"
        ? "text-center"
        : "text-right";

  return (
    <div
      id="receipt-print-area"
      className="mx-auto w-75 font-mono text-[12px] text-neutral-800"
      style={{ ["--receipt-bg" as string]: "#ffffff" }}
    >
      <div style={zigzagStyle(false)} />

      <div className="bg-white px-4 py-4 space-y-3">
        {/* Header */}
        <div className="text-center space-y-0.5">
          <p className="text-[14px] font-bold uppercase tracking-wide">
            {data.organizationName}
          </p>
          {data.pointName && (
            <p className="text-neutral-500">{data.pointName}</p>
          )}
          {template.headerText && (
            <p className="text-neutral-500 whitespace-pre-line">
              {template.headerText}
            </p>
          )}
        </div>

        <div className="border-t border-dashed border-neutral-300" />

        {/* Meta */}
        <div className="flex justify-between text-neutral-500">
          <span>№ {data.saleNumber}</span>
          <span>
            {new Date(data.createdAt).toLocaleString("ru-RU", {
              day: "2-digit",
              month: "2-digit",
              year: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
        {data.cashierName && (
          <div className="text-neutral-500">{t("cashier")}: {data.cashierName}</div>
        )}

        <div className="border-t border-dashed border-neutral-300" />

        {/* Items */}
        <div className="space-y-2">
          {data.items.map((item, i) => (
            <div key={i}>
              {template.showProductName && (
                <p className="leading-tight">{item.productName}</p>
              )}
              <div className="flex justify-between text-neutral-500">
                <span>
                  {template.showQty && (
                    <>
                      {item.qty}
                      {template.showUnit ? ` ${item.unit}` : ""}
                    </>
                  )}
                  {template.showQty && template.showUnitPrice && " × "}
                  {template.showUnitPrice && fmt(item.unitPrice)}
                </span>
                {template.showLineTotal && (
                  <span className="text-neutral-800 font-medium">
                    {fmt(item.lineTotal)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-dashed border-neutral-300" />

        {/* Totals */}
        <div className={alignClass}>
          <div className="flex justify-between text-neutral-500">
            <span>{t("subtotal")}</span>
            <span>{fmt(data.subtotal)}</span>
          </div>
          <div className="flex justify-between text-[15px] font-bold mt-1">
            <span>{t("total")}</span>
            <span>{fmt(data.totalAmount)}</span>
          </div>
          <p className="text-neutral-500 mt-1">
            {t.has(`payment.${data.paymentMethod}`)
              ? t(`payment.${data.paymentMethod}`)
              : data.paymentMethod}
          </p>
        </div>

        {template.footerText && (
          <>
            <div className="border-t border-dashed border-neutral-300" />
            <p className="text-center text-neutral-500 whitespace-pre-line">
              {template.footerText}
            </p>
          </>
        )}
      </div>

      <div style={zigzagStyle(true)} />
    </div>
  );
}
