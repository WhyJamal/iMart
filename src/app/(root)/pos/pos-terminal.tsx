"use client";

import { useMemo, useState, useTransition } from "react";
import type { ReactNode } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { createSale } from "@/actions/sale-actions";
import {
  getPointCellStock,
  getPointStockRecord,
} from "@/actions/warehouse-actions";
import { getActivePromotionDiscounts } from "@/actions/promotion-actions";

import type { IPointOption } from "@/types/point.types";
import type { ICellStockOption } from "@/types/warehouse.types";
import type { IPromotionDiscount } from "@/types/promotion.types";

import { isFractionalUnit } from "@/config/units";
import { useTranslations } from "next-intl";

type Stage = "idle" | "processing" | "success";
type PayMethod = "card" | "cash" | "qr";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface POSProduct {
  id: string;
  name: string;
  price: number;
  code: string;
  category: string;
  unit: string;
  image: string | null;
  stock: number;
}

interface CartItem extends POSProduct {
  qty: number;
  warehouseCellId: string;
  discountPercent?: number;
  promotionName?: string;
}

// ─── Formatters ───────────────────────────────────────────────────────────────

const fmt = (n: number) => n.toFixed(2) + " сум";

// ─── Icons ────────────────────────────────────────────────────────────────────

const CardIcon = () => (
  <svg
    className="w-5 h-5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
  >
    <rect x="1" y="4" width="22" height="16" rx="2" />
    <line x1="1" y1="10" x2="23" y2="10" />
  </svg>
);

const CashIcon = () => (
  <svg
    className="w-5 h-5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
  >
    <rect x="2" y="6" width="20" height="12" rx="2" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

const QRIcon = () => (
  <svg
    className="w-5 h-5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
  >
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
    <line
      x1="14"
      y1="14"
      x2="14.01"
      y2="14"
      strokeWidth="2.5"
    />
    <line
      x1="18"
      y1="14"
      x2="18.01"
      y2="14"
      strokeWidth="2.5"
    />
    <line
      x1="14"
      y1="18"
      x2="14.01"
      y2="18"
      strokeWidth="2.5"
    />
    <line
      x1="18"
      y1="18"
      x2="18.01"
      y2="18"
      strokeWidth="2.5"
    />
  </svg>
);

const CheckIcon = () => (
  <svg
    className="w-7 h-7"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#16a34a"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const SectionLabel = ({ children }: { children: ReactNode }) => (
  <p className="text-[10px] font-bold tracking-widest text-gray-400 uppercase mb-2.5">
    {children}
  </p>
);

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  products: POSProduct[];
  points: IPointOption[];
  defaultPointId: string;
  initialCellStock: Record<string, ICellStockOption[]>;
  initialPromotions: IPromotionDiscount[];
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function POSTerminal({
  products,
  points,
  defaultPointId,
  initialCellStock,
  initialPromotions,
}: Props) {
  const t = useTranslations("pos-terminal");

  const router = useRouter();

  const [isPending, startTransition] = useTransition();
  const [isLoadingStock, startStockLoad] = useTransition();

  const [pointId, setPointId] = useState(defaultPointId);

  const [stockOverride, setStockOverride] = useState<
    Record<string, number> | null
  >(null);

  const [cellStock, setCellStock] =
    useState<Record<string, ICellStockOption[]>>(initialCellStock);

  const [promotionDiscounts, setPromotionDiscounts] =
    useState<IPromotionDiscount[]>(initialPromotions);

  const [search, setSearch] = useState("");
  const [qrInput, setQrInput] = useState("");

  const [cart, setCart] = useState<CartItem[]>([]);

  const [tip, setTip] = useState(0);
  const [method, setMethod] = useState<PayMethod>("card");

  const [stage, setStage] = useState<Stage>("idle");
  const [searchOpen, setSearchOpen] = useState(false);

  const [lastSaleNumber, setLastSaleNumber] = useState("");

  // ─── Translated payment methods ─────────────────────────────────────────────

  const methods: { id: PayMethod; label: string }[] = [
    {
      id: "card",
      label: t("paymentMethods.card"),
    },
    {
      id: "cash",
      label: t("paymentMethods.cash"),
    },
    {
      id: "qr",
      label: t("paymentMethods.qr"),
    },
  ];

  // ─── Translated tips ────────────────────────────────────────────────────────

  const tips = [
    {
      label: t("tips.none"),
      value: 0,
    },
    {
      label: "10%",
      value: 0.1,
    },
    {
      label: "15%",
      value: 0.15,
    },
    {
      label: "20%",
      value: 0.2,
    },
  ];

  // ─── Icons ──────────────────────────────────────────────────────────────────

  const methodIcons: Record<PayMethod, ReactNode> = {
    card: <CardIcon />,
    cash: <CashIcon />,
    qr: <QRIcon />,
  };

  // ─── Promotion helpers ──────────────────────────────────────────────────────

  const getDiscount = (
    warehouseCellId: string,
    productId: string
  ) =>
    promotionDiscounts.find(
      (promotion) =>
        promotion.warehouseCellId === warehouseCellId &&
        promotion.productId === productId
    );

  const getSellPrice = (
    cell: ICellStockOption,
    productId: string
  ) => {
    const promotion = getDiscount(
      cell.warehouseCellId,
      productId
    );

    return promotion
      ? cell.price *
      (1 - promotion.discountPercent / 100)
      : cell.price;
  };

  const getPreferredCell = (productId: string) => {
    const cells = cellStock[productId] ?? [];

    return [...cells].sort((a, b) => {
      const aPromotion = getDiscount(
        a.warehouseCellId,
        productId
      );

      const bPromotion = getDiscount(
        b.warehouseCellId,
        productId
      );

      if (
        Boolean(aPromotion) !== Boolean(bPromotion)
      ) {
        return aPromotion ? -1 : 1;
      }

      return b.available - a.available;
    })[0];
  };

  // ─── Effective products ─────────────────────────────────────────────────────

  const effectiveProducts = useMemo(() => {
    if (!stockOverride) {
      return products;
    }

    return products.map((product) => ({
      ...product,
      stock: stockOverride[product.id] ?? 0,
    }));
  }, [products, stockOverride]);

  // ─── Point change ───────────────────────────────────────────────────────────

  const handlePointChange = (newPointId: string) => {
    setPointId(newPointId);
    setCart([]);

    startStockLoad(() => {
      void (async () => {
        const record = await getPointStockRecord(newPointId);
        const cells = await getPointCellStock(newPointId);
        const promotions =
          await getActivePromotionDiscounts(newPointId);

        setStockOverride(record);
        setCellStock(cells);
        setPromotionDiscounts(promotions);
      })();
    });
  };

  // ─── Product search ─────────────────────────────────────────────────────────

  const suggestions = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return [];
    }

    return effectiveProducts
      .filter(
        (product) =>
          product.stock > 0 &&
          (product.name.toLowerCase().includes(query) ||
            product.category
              .toLowerCase()
              .includes(query) ||
            product.code.toLowerCase().includes(query))
      )
      .slice(0, 6);
  }, [search, effectiveProducts]);

  // ─── Totals ─────────────────────────────────────────────────────────────────

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.qty,
    0
  );

  const taxAmt = subtotal * 0.08;
  const tipAmt = subtotal * tip;
  const total = subtotal + taxAmt + tipAmt;

  const totalItems = cart.reduce(
    (sum, item) => sum + item.qty,
    0
  );

  // ─── Add product ────────────────────────────────────────────────────────────

  const addToCart = (product: POSProduct) => {
    const cells = cellStock[product.id] ?? [];

    if (cells.length === 0) {
      toast.error(
        t("messages.cellNotFound", {
          product: product.name,
        })
      );
      return;
    }

    const bestCell = getPreferredCell(product.id)!;

    const fractional = isFractionalUnit(product.unit);

    const step = 1;

    setCart((previousCart) => {
      const found = previousCart.find(
        (item) =>
          item.id === product.id &&
          item.warehouseCellId ===
          bestCell.warehouseCellId
      );

      const currentQty = found?.qty ?? 0;

      if (currentQty >= bestCell.available) {
        toast.warning(
          t("messages.cellStockLimit", {
            quantity: bestCell.available,
            unit: product.unit,
          })
        );

        return previousCart;
      }

      const nextQty = Math.min(
        currentQty + step,
        bestCell.available
      );

      if (found) {
        return previousCart.map((item) =>
          item === found
            ? {
              ...item,
              qty: nextQty,
            }
            : item
        );
      }

      const promotion = getDiscount(
        bestCell.warehouseCellId,
        product.id
      );

      return [
        ...previousCart,
        {
          ...product,
          qty: fractional
            ? Math.min(step, bestCell.available)
            : 1,
          warehouseCellId:
            bestCell.warehouseCellId,
          price: getSellPrice(
            bestCell,
            product.id
          ),
          discountPercent:
            promotion?.discountPercent,
          promotionName:
            promotion?.promotionName,
        },
      ];
    });
  };

  // ─── Quantity ───────────────────────────────────────────────────────────────

  const setQty = (
    id: string,
    warehouseCellId: string,
    delta: number
  ) => {
    setCart((previousCart) =>
      previousCart
        .map((item) => {
          if (
            item.id !== id ||
            item.warehouseCellId !== warehouseCellId
          ) {
            return item;
          }

          const cell = (
            cellStock[item.id] ?? []
          ).find(
            (stockCell) =>
              stockCell.warehouseCellId ===
              warehouseCellId
          );

          const available = cell?.available ?? 0;
          const newQty = item.qty + delta;

          if (
            delta > 0 &&
            newQty > available
          ) {
            toast.warning(
              t("messages.availableQuantity", {
                quantity: available,
                unit: item.unit,
              })
            );

            return item;
          }

          return {
            ...item,
            qty: newQty,
          };
        })
        .filter((item) => item.qty > 0)
    );
  };

  // ─── Exact fractional quantity ──────────────────────────────────────────────

  const setExactQty = (
    id: string,
    warehouseCellId: string,
    raw: string
  ) => {
    const parsed = parseFloat(raw);

    setCart((previousCart) =>
      previousCart.map((item) => {
        if (
          item.id !== id ||
          item.warehouseCellId !== warehouseCellId
        ) {
          return item;
        }

        if (
          raw.trim() === "" ||
          Number.isNaN(parsed)
        ) {
          return {
            ...item,
            qty: 0,
          };
        }

        const cell = (
          cellStock[item.id] ?? []
        ).find(
          (stockCell) =>
            stockCell.warehouseCellId ===
            warehouseCellId
        );

        const available = cell?.available ?? 0;

        if (parsed > available) {
          toast.warning(
            t("messages.cellStockLimit", {
              quantity: available,
              unit: item.unit,
            })
          );

          return {
            ...item,
            qty: available,
          };
        }

        return {
          ...item,
          qty: parsed,
        };
      })
    );
  };

  // ─── Cleanup ────────────────────────────────────────────────────────────────

  const cleanupZeroQty = () => {
    setCart((previousCart) =>
      previousCart.filter((item) => item.qty > 0)
    );
  };

  // ─── Switch warehouse cell ──────────────────────────────────────────────────

  const switchCell = (
    id: string,
    oldCellId: string,
    newCellId: string
  ) => {
    setCart((previousCart) =>
      previousCart.map((item) => {
        if (
          item.id !== id ||
          item.warehouseCellId !== oldCellId
        ) {
          return item;
        }

        const cell = (
          cellStock[item.id] ?? []
        ).find(
          (stockCell) =>
            stockCell.warehouseCellId ===
            newCellId
        );

        const available = cell?.available ?? 0;

        if (available === 0) {
          toast.error(
            t("messages.emptyCell")
          );

          return item;
        }

        const qty = Math.min(
          item.qty,
          available
        );

        if (qty < item.qty) {
          toast.warning(
            t("messages.quantityReduced", {
              quantity: qty,
            })
          );
        }

        const promotion = cell
          ? getDiscount(
            cell.warehouseCellId,
            item.id
          )
          : undefined;

        return {
          ...item,
          warehouseCellId: newCellId,
          qty,
          price: cell
            ? getSellPrice(cell, item.id)
            : item.price,
          discountPercent:
            promotion?.discountPercent,
          promotionName:
            promotion?.promotionName,
        };
      })
    );
  };

  // ─── Remove item ─────────────────────────────────────────────────────────────

  const removeItem = (
    id: string,
    warehouseCellId: string
  ) => {
    setCart((previousCart) =>
      previousCart.filter(
        (item) =>
          !(
            item.id === id &&
            item.warehouseCellId ===
            warehouseCellId
          )
      )
    );
  };

  // ─── Charge ─────────────────────────────────────────────────────────────────

  const handleCharge = () => {
    if (
      cart.length === 0 ||
      stage !== "idle"
    ) {
      return;
    }

    if (!pointId) {
      toast.error(
        t("messages.selectPoint")
      );
      return;
    }

    setStage("processing");

    startTransition(async () => {
      const result = await createSale({
        pointId,
        paymentMethod: method,
        totalAmount: total,
        subtotal,
        tipPercent: tip * 100,
        items: cart.map((item) => ({
          productId: item.id,
          qty: item.qty,
          unitPrice:
            cellStock[item.id]?.find(
              (cell) =>
                cell.warehouseCellId ===
                item.warehouseCellId
            )?.price ?? item.price,
          warehouseCellId:
            item.warehouseCellId,
        })),
      });

      if (result.success) {
        setLastSaleNumber(
          result.data.saleNumber
        );

        const [
          freshStock,
          freshCells,
          freshPromotions,
        ] = await Promise.all([
          getPointStockRecord(pointId),
          getPointCellStock(pointId),
          getActivePromotionDiscounts(
            pointId
          ),
        ]);

        setStockOverride(freshStock);
        setCellStock(freshCells);
        setPromotionDiscounts(
          freshPromotions
        );

        setStage("success");

        router.refresh();
      } else {
        toast.error(result.error);
        setStage("idle");
      }
    });
  };

  // ─── Reset ──────────────────────────────────────────────────────────────────

  const reset = () => {
    setStage("idle");
    setTip(0);
    setMethod("card");
    setSearch("");
    setQrInput("");
    setCart([]);
    setLastSaleNumber("");
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full bg-slate-100 select-none">
      <div className="flex-1 flex gap-3 p-3 overflow-hidden">

        {/* Left: search + cart */}
        <div className="flex-[1.35] flex flex-col gap-3 min-w-0 overflow-hidden">

          {/* Search */}
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <SectionLabel>
              {t("search.title")}
            </SectionLabel>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

              {/* Product search */}
              <div className="relative">
                <input
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setSearchOpen(true);
                  }}
                  onFocus={() =>
                    setSearchOpen(true)
                  }
                  onBlur={() =>
                    setTimeout(
                      () =>
                        setSearchOpen(false),
                      150
                    )
                  }
                  placeholder={t(
                    "search.placeholder"
                  )}
                  className="w-full h-11 rounded-xl border border-gray-200 px-4 text-sm outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400"
                />

                {searchOpen &&
                  suggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-12 z-30 rounded-2xl border border-gray-200 bg-white shadow-xl overflow-hidden">
                      {suggestions.map(
                        (product) => {
                          const cell =
                            getPreferredCell(
                              product.id
                            );

                          const promotion =
                            cell
                              ? getDiscount(
                                cell.warehouseCellId,
                                product.id
                              )
                              : undefined;

                          const price = cell
                            ? getSellPrice(
                              cell,
                              product.id
                            )
                            : product.price;

                          return (
                            <button
                              key={product.id}
                              onMouseDown={(event) =>
                                event.preventDefault()
                              }
                              onClick={() => {
                                addToCart(
                                  product
                                );
                                setSearch("");
                                setSearchOpen(
                                  false
                                );
                              }}
                              className="w-full flex items-center gap-3 px-3 py-3 hover:bg-gray-50 text-left"
                            >
                              <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 shrink-0 flex items-center justify-center text-xl">
                                {product.image ? (
                                  <Image
                                    src={
                                      product.image
                                    }
                                    alt={
                                      product.name
                                    }
                                    width={48}
                                    height={48}
                                    className="object-cover"
                                  />
                                ) : (
                                  "📦"
                                )}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-semibold truncate">
                                    {
                                      product.name
                                    }
                                  </p>

                                  {promotion && (
                                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-600">
                                      −
                                      {
                                        promotion.discountPercent
                                      }
                                      %
                                    </span>
                                  )}
                                </div>

                                <p className="text-[11px] text-gray-400">
                                  {
                                    product.category
                                  }{" "}
                                  ·{" "}
                                  {
                                    product.stock
                                  }{" "}
                                  {
                                    product.unit
                                  }{" "}
                                  {t(
                                    "search.inStock"
                                  )}
                                </p>
                              </div>

                              {promotion ? (
                                <div className="text-right shrink-0">
                                  <p className="text-[11px] text-gray-400 line-through">
                                    {fmt(
                                      cell?.price ??
                                      product.price
                                    )}
                                  </p>

                                  <p className="font-bold text-red-600">
                                    {fmt(price)}
                                  </p>
                                </div>
                              ) : (
                                <p className="font-bold">
                                  {fmt(price)}
                                </p>
                              )}
                            </button>
                          );
                        }
                      )}
                    </div>
                  )}
              </div>

              {/* QR / Barcode */}
              <input
                value={qrInput}
                onChange={(event) =>
                  setQrInput(
                    event.target.value
                  )
                }
                onKeyDown={(event) => {
                  if (event.key !== "Enter") {
                    return;
                  }

                  const found =
                    effectiveProducts.find(
                      (product) =>
                        product.code
                          .toLowerCase() ===
                        qrInput
                          .trim()
                          .toLowerCase()
                    );

                  if (found) {
                    addToCart(found);
                    setQrInput("");
                  } else {
                    toast.error(
                      t("messages.productNotFound")
                    );
                  }
                }}
                placeholder={t(
                  "search.qrPlaceholder"
                )}
                className="h-11 rounded-xl border border-gray-200 px-4 text-sm outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400"
              />
            </div>
          </div>

          {/* Cart */}
          <div className="bg-white rounded-2xl shadow-sm p-4 flex-1 min-h-0 flex flex-col">
            <SectionLabel>
              {t("cart.title")}
            </SectionLabel>

            <p className="text-xs text-gray-400 mb-2">
              {totalItems}{" "}
              {t("cart.items")} ·{" "}
              {cart.length}{" "}
              {t("cart.lines")}
            </p>

            {cart.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                {t("cart.empty")}
              </div>
            ) : (
              <div className="space-y-3 overflow-y-auto flex-1 pr-1">
                {cart.map((item) => {
                  const cells =
                    cellStock[item.id] ?? [];

                  const currentCell =
                    cells.find(
                      (cell) =>
                        cell.warehouseCellId ===
                        item.warehouseCellId
                    );

                  const fractional =
                    isFractionalUnit(
                      item.unit
                    );

                  return (
                    <div
                      key={`${item.id}:${item.warehouseCellId}`}
                      className="rounded-2xl border border-gray-100 p-4 flex items-center gap-3"
                    >
                      <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-gray-100 flex items-center justify-center text-2xl">
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt={item.name}
                            width={56}
                            height={56}
                            className="object-cover"
                          />
                        ) : (
                          "📦"
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">
                          {item.name}
                        </p>

                        <p className="text-[11px] text-gray-400">
                          {item.qty}{" "}
                          {item.unit} ×{" "}
                          {fmt(item.price)}

                          {currentCell && (
                            <>
                              {" "}
                              ·{" "}
                              {(
                                currentCell.available -
                                item.qty
                              ).toFixed(
                                fractional
                                  ? 3
                                  : 0
                              )}{" "}
                              {item.unit}{" "}
                              {t(
                                "cart.remaining"
                              )}
                            </>
                          )}
                        </p>

                        {cells.length > 0 && (
                          <select
                            value={
                              item.warehouseCellId
                            }
                            onChange={(event) =>
                              switchCell(
                                item.id,
                                item.warehouseCellId,
                                event.target.value
                              )
                            }
                            className="mt-1 text-[11px] rounded-lg border border-gray-200 px-2 py-1 outline-none focus:ring-1 focus:ring-red-300 max-w-full"
                          >
                            {cells.map(
                              (cell) => (
                                <option
                                  key={
                                    cell.warehouseCellId
                                  }
                                  value={
                                    cell.warehouseCellId
                                  }
                                >
                                  {
                                    cell.warehouseName
                                  }{" "}
                                  —{" "}
                                  {
                                    cell.cellName
                                  }{" "}
                                  (
                                  {
                                    cell.available
                                  }
                                  )
                                </option>
                              )
                            )}
                          </select>
                        )}

                        <div className="flex items-center gap-2 mt-2">
                          {fractional ? (
                            <>
                              <input
                                type="number"
                                step="0.001"
                                min="0"
                                value={item.qty}
                                onChange={(
                                  event
                                ) =>
                                  setExactQty(
                                    item.id,
                                    item.warehouseCellId,
                                    event.target
                                      .value
                                  )
                                }
                                onBlur={
                                  cleanupZeroQty
                                }
                                className="w-20 h-7 rounded-lg border border-gray-200 px-2 text-sm font-bold outline-none focus:ring-1 focus:ring-red-300"
                              />

                              <span className="text-[11px] text-gray-400">
                                {item.unit}
                              </span>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() =>
                                  setQty(
                                    item.id,
                                    item.warehouseCellId,
                                    -1
                                  )
                                }
                                className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 font-bold"
                              >
                                −
                              </button>

                              <span className="text-sm font-bold w-6 text-center">
                                {item.qty}
                              </span>

                              <button
                                onClick={() =>
                                  setQty(
                                    item.id,
                                    item.warehouseCellId,
                                    1
                                  )
                                }
                                className="w-7 h-7 rounded-full bg-blue-500 text-white hover:bg-blue-600 font-bold"
                              >
                                +
                              </button>
                            </>
                          )}

                          <button
                            onClick={() =>
                              removeItem(
                                item.id,
                                item.warehouseCellId
                              )
                            }
                            className="ml-2 text-[11px] font-semibold text-red-500 hover:text-red-600"
                          >
                            {t(
                              "cart.remove"
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="text-right shrink-0 min-w-25">
                        {item.discountPercent &&
                          item.discountPercent >
                          0 &&
                          currentCell ? (
                          <div className="leading-tight">
                            <div className="text-[11px] text-gray-400 line-through">
                              {fmt(
                                item.qty *
                                currentCell.price
                              )}
                            </div>

                            <div className="text-sm font-extrabold text-red-600">
                              {fmt(
                                item.qty *
                                item.price
                              )}
                            </div>

                            <div className="mt-1 inline-flex rounded-full bg-red-50 px-2 py-0.5 text-[9px] font-bold text-red-600">
                              −
                              {
                                item.discountPercent
                              }
                              %{" "}
                              {t(
                                "cart.promotion"
                              )}
                            </div>
                          </div>
                        ) : (
                          <p className="font-bold text-gray-900">
                            {fmt(
                              item.qty *
                              item.price
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: payment */}
        <div className="w-100 flex flex-col gap-3 shrink-0">

          {/* Point */}
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <SectionLabel>
              {t("point.title")}
            </SectionLabel>

            <select
              value={pointId}
              onChange={(event) =>
                handlePointChange(
                  event.target.value
                )
              }
              disabled={isLoadingStock}
              className="w-full h-11 rounded-xl border border-gray-200 px-3 text-sm outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 disabled:opacity-50"
            >
              {points.length === 0 && (
                <option value="">
                  {t("point.empty")}
                </option>
              )}

              {points.map((point) => (
                <option
                  key={point.id}
                  value={point.id}
                >
                  {point.name}
                </option>
              ))}
            </select>

            {isLoadingStock && (
              <p className="text-[11px] text-gray-400 mt-1.5">
                {t(
                  "point.loading"
                )}
              </p>
            )}
          </div>

          {/* Payment method */}
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <SectionLabel>
              {t("payment.title")}
            </SectionLabel>

            <div className="grid grid-cols-3 gap-2">
              {methods.map((paymentMethod) => (
                <button
                  key={paymentMethod.id}
                  onClick={() =>
                    setMethod(
                      paymentMethod.id
                    )
                  }
                  className={`py-3 rounded-[13px] border-[1.5px] flex flex-col items-center gap-1.5 transition-all duration-150 cursor-pointer ${method ===
                      paymentMethod.id
                      ? "border-red-500 bg-red-50 text-red-600"
                      : "border-gray-200 text-gray-400 bg-white hover:border-gray-300"
                    }`}
                >
                  {methodIcons[
                    paymentMethod.id
                  ]}

                  <span
                    className={`text-[11px] font-semibold ${method ===
                        paymentMethod.id
                        ? "text-red-600"
                        : "text-gray-500"
                      }`}
                  >
                    {paymentMethod.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Tip */}
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <SectionLabel>
              {t("tip.title")}
            </SectionLabel>

            <div className="grid grid-cols-4 gap-2">
              {tips.map((tipOption) => (
                <button
                  key={tipOption.value}
                  onClick={() =>
                    setTip(
                      tipOption.value
                    )
                  }
                  className={`py-2 rounded-full text-xs font-semibold border-[1.5px] transition-all duration-150 cursor-pointer ${tip ===
                      tipOption.value
                      ? "border-red-500 bg-blue-50 text-red-600 font-bold"
                      : "border-gray-200 text-gray-500 hover:border-gray-300 bg-transparent"
                    }`}
                >
                  {tipOption.label}
                </button>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-white rounded-2xl shadow-sm p-4 sticky bottom-0">
            <div className="flex justify-between items-center py-1 text-[11px] text-gray-400">
              <span>
                {t("summary.subtotal")}
              </span>
              <span>{fmt(subtotal)}</span>
            </div>

            <div className="flex justify-between items-center py-1 text-[11px] text-gray-400">
              <span>
                {t("summary.tax", {
                  percent: 8,
                })}
              </span>
              <span>{fmt(taxAmt)}</span>
            </div>

            {tipAmt > 0 && (
              <div className="flex justify-between items-center py-1 text-[11px] text-gray-400">
                <span>
                  {t("summary.tip", {
                    percent: tip * 100,
                  })}
                </span>
                <span>
                  {fmt(tipAmt)}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center py-1 border-t border-gray-100 mt-2 pt-2.5">
              <span className="text-[13px] text-gray-800 font-bold">
                {t("summary.total")}
              </span>

              <span className="text-[13px] text-gray-800 font-bold">
                {fmt(total)}
              </span>
            </div>

            <button
              onClick={handleCharge}
              disabled={
                stage !== "idle" ||
                cart.length === 0 ||
                isPending
              }
              className={`w-full mt-4 py-4 rounded-2xl text-[14px] font-bold tracking-tight transition-all duration-200 cursor-pointer ${stage === "idle" &&
                  cart.length > 0
                  ? "bg-red-500 text-white shadow-lg shadow-red-300 hover:bg-red-600 active:scale-[.98]"
                  : "bg-gray-100 text-gray-400 cursor-default"
                }`}
            >
              {cart.length === 0
                ? t(
                  "summary.addProducts"
                )
                : stage === "idle"
                  ? t(
                    "summary.charge",
                    {
                      amount: fmt(total),
                    }
                  )
                  : t(
                    "summary.processing"
                  )}
            </button>
          </div>
        </div>
      </div>

      {/* Payment overlay */}
      {(stage === "processing" ||
        stage === "success") && (
          <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-3xl px-11 py-9 text-center shadow-2xl min-w-67.5">

              {stage === "processing" ? (
                <>
                  <div className="w-12 h-12 border-[3px] border-blue-100 border-t-blue-500 rounded-full mx-auto mb-5 animate-spin" />

                  <p className="text-[17px] font-bold text-gray-800">
                    {t(
                      "overlay.processingTitle"
                    )}
                  </p>

                  <p className="text-xs text-gray-400 mt-1.5">
                    {t(
                      "overlay.pleaseWait"
                    )}
                  </p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center mx-auto mb-4">
                    <CheckIcon />
                  </div>

                  <p className="text-[18px] font-bold text-gray-800">
                    {t(
                      "overlay.approved"
                    )}
                  </p>

                  <p className="text-xs text-gray-500 mt-1 font-mono">
                    {lastSaleNumber}
                  </p>

                  <p className="text-xs text-gray-500 mt-1">
                    {fmt(total)}{" "}
                    {t("overlay.via")}{" "}
                    {methods.find(
                      (paymentMethod) =>
                        paymentMethod.id ===
                        method
                    )?.label}
                  </p>

                  <div className="flex gap-2 mt-6">
                    <button
                      onClick={reset}
                      className="flex-1 py-2.5 bg-gray-50 rounded-xl text-xs font-semibold text-gray-500 hover:bg-gray-100 cursor-pointer transition-colors"
                    >
                      {t(
                        "overlay.newSale"
                      )}
                    </button>

                    <button className="flex-1 py-2.5 bg-blue-500 rounded-xl text-xs font-semibold text-white hover:bg-blue-600 cursor-pointer transition-colors shadow-md shadow-blue-200">
                      {t(
                        "overlay.receipt"
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
    </div>
  );
}