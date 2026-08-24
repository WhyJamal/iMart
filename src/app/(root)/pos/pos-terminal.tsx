"use client";

import { useMemo, useState, useTransition } from "react";
import type { ReactNode } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { createSale } from "@/actions/sale-actions";
import { getPointStockRecord, getPointCellStock } from "@/actions/warehouse-actions";
import type { IPointOption } from "@/types/point.types";
import type { ICellStockOption } from "@/types/warehouse.types";
import { isFractionalUnit } from "@/config/units";

type Stage = "idle" | "processing" | "success";
type PayMethod = "card" | "cash" | "qr";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface POSProduct {
  id: string;
  name: string;
  price: number;
  code: string;
  category: string;
  unit: string; // dona | kg | litr | metr | quti — @/config/units
  image: string | null;
  stock: number; // current qty from InventoryRegister
}

interface CartItem extends POSProduct {
  qty: number;
  warehouseCellId: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TIPS = [
  { label: "No tip", value: 0 },
  { label: "10%", value: 0.1 },
  { label: "15%", value: 0.15 },
  { label: "20%", value: 0.2 },
];

const METHODS: { id: PayMethod; label: string }[] = [
  { id: "card", label: "Card" },
  { id: "cash", label: "Cash" },
  { id: "qr", label: "QR Pay" },
];

// ─── Formatters ───────────────────────────────────────────────────────────────

const fmt = (n: number) => n.toFixed(2) + " сум";

// ─── Icons ────────────────────────────────────────────────────────────────────

const CardIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    <rect x="1" y="4" width="22" height="16" rx="2" />
    <line x1="1" y1="10" x2="23" y2="10" />
  </svg>
);
const CashIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    <rect x="2" y="6" width="20" height="12" rx="2" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);
const QRIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
    <line x1="14" y1="14" x2="14.01" y2="14" strokeWidth="2.5" />
    <line x1="18" y1="14" x2="18.01" y2="14" strokeWidth="2.5" />
    <line x1="14" y1="18" x2="14.01" y2="18" strokeWidth="2.5" />
    <line x1="18" y1="18" x2="18.01" y2="18" strokeWidth="2.5" />
  </svg>
);

const methodIcons: Record<PayMethod, ReactNode> = {
  card: <CardIcon />,
  cash: <CashIcon />,
  qr: <QRIcon />,
};

const CheckIcon = () => (
  <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const SectionLabel = ({ children }: { children: ReactNode }) => (
  <p className="text-[10px] font-bold tracking-widest text-gray-400 uppercase mb-2.5">
    {children}
  </p>
);

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  products: POSProduct[];
  points: IPointOption[];
  defaultPointId: string;
  initialCellStock: Record<string, ICellStockOption[]>;
}

export default function POSTerminal({ products, points, defaultPointId, initialCellStock }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isLoadingStock, startStockLoad] = useTransition();

  const [pointId, setPointId] = useState(defaultPointId);
  // Point o'zgartirilganda shu Point'dagi qoldiqlar bilan almashtiriladi
  const [stockOverride, setStockOverride] = useState<Record<string, number> | null>(null);
  // productId -> shu Point ostidagi yacheykalar (eng ko'p qoldiqlisi birinchi)
  const [cellStock, setCellStock] = useState<Record<string, ICellStockOption[]>>(initialCellStock);

  const [search, setSearch] = useState("");
  const [qrInput, setQrInput] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [tip, setTip] = useState(0);
  const [method, setMethod] = useState<PayMethod>("card");
  const [stage, setStage] = useState<Stage>("idle");
  const [searchOpen, setSearchOpen] = useState(false);
  const [lastSaleNumber, setLastSaleNumber] = useState("");

  // Point o'zgarganda stockOverride bilan almashtiriladi — dastlab
  // serverdan kelgan (defaultPointId uchun hisoblangan) qoldiq ishlatiladi
  const effectiveProducts = useMemo(() => {
    if (!stockOverride) return products;
    return products.map((p) => ({ ...p, stock: stockOverride[p.id] ?? 0 }));
  }, [products, stockOverride]);

  const handlePointChange = (newPointId: string) => {
    setPointId(newPointId);
    setCart([]); // boshqa Point'ga o'tganda savat tozalanadi
    startStockLoad(() => {
      void (async () => {
        const record = await getPointStockRecord(newPointId);
        const cells = await getPointCellStock(newPointId);
        setStockOverride(record);
        setCellStock(cells);
      })();
    });
  };

  // Only show in-stock products in search
  const suggestions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return effectiveProducts
      .filter(
        (p) =>
          p.stock > 0 &&
          (p.name.toLowerCase().includes(q) ||
            p.category.toLowerCase().includes(q) ||
            p.code.toLowerCase().includes(q))
      )
      .slice(0, 6);
  }, [search, effectiveProducts]);

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const taxAmt = subtotal * 0.08;
  const tipAmt = subtotal * tip;
  const total = subtotal + taxAmt + tipAmt;
  const totalItems = cart.reduce((s, i) => s + i.qty, 0);

  const addToCart = (product: POSProduct) => {
    const cells = cellStock[product.id] ?? [];
    if (cells.length === 0) {
      toast.error(`"${product.name}" uchun bu nuqtada yacheyka topilmadi`);
      return;
    }
    const bestCell = cells[0]; // eng ko'p qoldiqli — avtomatik tanlanadi

    const fractional = isFractionalUnit(product.unit);
    // Dona/quti uchun har bosishda +1 qo'shiladi. Kg/litr/metr kabi
    // kasr birliklarda esa avval 1 birlik (masalan 1 kg) qo'yiladi — aniq
    // og'irlikni (masalan 0.8 kg) kassir keyin qatordagi inputga yozadi.
    const step = 1;

    setCart((prev) => {
      const found = prev.find(
        (item) => item.id === product.id && item.warehouseCellId === bestCell.warehouseCellId
      );
      const currentQty = found?.qty ?? 0;
      if (currentQty >= bestCell.available) {
        toast.warning(`Bu yacheykada faqat ${bestCell.available} ${product.unit} bor`);
        return prev;
      }
      const nextQty = Math.min(currentQty + step, bestCell.available);
      if (found) {
        return prev.map((item) =>
          item === found ? { ...item, qty: nextQty } : item
        );
      }
      return [
        ...prev,
        {
          ...product,
          qty: fractional ? Math.min(step, bestCell.available) : 1,
          warehouseCellId: bestCell.warehouseCellId,
          price: bestCell.price, // ItemPrice — statik product.price emas
        },
      ];
    });
  };

  const setQty = (id: string, warehouseCellId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.id !== id || item.warehouseCellId !== warehouseCellId) return item;
          const cell = (cellStock[item.id] ?? []).find(
            (c) => c.warehouseCellId === warehouseCellId
          );
          const available = cell?.available ?? 0;
          const newQty = item.qty + delta;
          if (delta > 0 && newQty > available) {
            toast.warning(`Bu yacheykada faqat ${available} dona bor`);
            return item;
          }
          return { ...item, qty: newQty };
        })
        .filter((item) => item.qty > 0);
    });
  };

  // Kilolik (fractional) tovarlar uchun — kassir aniq og'irlikni qo'lda
  // kiritadi, masalan haridor 800 gr shakar olsa "0.8" deb yoziladi.
  // Item bo'sh/0 holatda qatordan bo'sh input bilan qolaveradi — Remove
  // tugmasidan boshqa hech narsa qatorni avtomatik o'chirmaydi, shunda
  // foydalanuvchi qiymatni kiritib bo'lguncha qator yo'qolib ketmaydi.
  const setExactQty = (id: string, warehouseCellId: string, raw: string) => {
    const parsed = parseFloat(raw);
    setCart((prev) =>
      prev.map((item) => {
        if (item.id !== id || item.warehouseCellId !== warehouseCellId) return item;
        if (raw.trim() === "" || Number.isNaN(parsed)) return { ...item, qty: 0 };

        const cell = (cellStock[item.id] ?? []).find(
          (c) => c.warehouseCellId === warehouseCellId
        );
        const available = cell?.available ?? 0;
        if (parsed > available) {
          toast.warning(`Bu yacheykada faqat ${available} ${item.unit} bor`);
          return { ...item, qty: available };
        }
        return { ...item, qty: parsed };
      })
    );
  };

  // Input'dan chiqqanda (blur) — hali ham 0/bo'sh qolgan qatorni tozalaydi
  const cleanupZeroQty = () => {
    setCart((prev) => prev.filter((item) => item.qty > 0));
  };

  const switchCell = (id: string, oldCellId: string, newCellId: string) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id !== id || item.warehouseCellId !== oldCellId) return item;
        const cell = (cellStock[item.id] ?? []).find(
          (c) => c.warehouseCellId === newCellId
        );
        const available = cell?.available ?? 0;
        if (available === 0) {
          toast.error("Tanlangan yacheykada qoldiq yo'q");
          return item;
        }
        const qty = Math.min(item.qty, available);
        if (qty < item.qty) {
          toast.warning(`Miqdor ${qty} taga tushirildi (yacheykada shuncha bor)`);
        }
        return { ...item, warehouseCellId: newCellId, qty, price: cell!.price };
      })
    );
  };

  const removeItem = (id: string, warehouseCellId: string) =>
    setCart((prev) =>
      prev.filter(
        (item) => !(item.id === id && item.warehouseCellId === warehouseCellId)
      )
    );

  const handleCharge = () => {
    if (cart.length === 0 || stage !== "idle") return;
    if (!pointId) {
      toast.error("Avval Point tanlang");
      return;
    }

    setStage("processing");

    startTransition(async () => {
      const result = await createSale({
        pointId,
        paymentMethod: method,
        totalAmount: total,
        items: cart.map((item) => ({
          productId: item.id,
          qty: item.qty,
          unitPrice: item.price,
          warehouseCellId: item.warehouseCellId,
        })),
      });

      if (result.success) {
        setLastSaleNumber(result.data.saleNumber);
        setStage("success");
        router.refresh(); // revalidate stock counts on the page
      } else {
        toast.error(result.error);
        setStage("idle");
      }
    });
  };

  const reset = () => {
    setStage("idle");
    setTip(0);
    setMethod("card");
    setSearch("");
    setQrInput("");
    setCart([]);
    setLastSaleNumber("");
  };

  return (
    <div className="flex flex-col h-full bg-slate-100 select-none">
      <div className="flex-1 flex gap-3 p-3 overflow-hidden">
        {/* ── Left: product search + cart ────────────────────────────────── */}
        <div className="flex-[1.35] flex flex-col gap-3 min-w-0 overflow-hidden">
          {/* Search */}
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <SectionLabel>Search products</SectionLabel>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="relative">
                <input
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setSearchOpen(true); }}
                  onFocus={() => setSearchOpen(true)}
                  onBlur={() => setTimeout(() => setSearchOpen(false), 150)}
                  placeholder="Search by name, category or code..."
                  className="w-full h-11 rounded-xl border border-gray-200 px-4 text-sm outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400"
                />
                {searchOpen && suggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-12 z-30 rounded-2xl border border-gray-200 bg-white shadow-xl overflow-hidden">
                    {suggestions.map((p) => (
                      <button
                        key={p.id}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => { addToCart(p); setSearch(""); setSearchOpen(false); }}
                        className="w-full flex items-center gap-3 px-3 py-3 hover:bg-gray-50 text-left"
                      >
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 shrink-0 flex items-center justify-center text-xl">
                          {p.image ? (
                            <Image src={p.image} alt={p.name} width={48} height={48} className="object-cover" />
                          ) : (
                            "📦"
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold">{p.name}</p>
                          <p className="text-[11px] text-gray-400">
                            {p.category} · {p.stock} {p.unit} in stock
                          </p>
                        </div>
                        <p className="font-bold">
                          {fmt(cellStock[p.id]?.[0]?.price ?? p.price)}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* QR / barcode scan */}
              <input
                value={qrInput}
                onChange={(e) => setQrInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const found = effectiveProducts.find(
                      (p) => p.code.toLowerCase() === qrInput.trim().toLowerCase()
                    );
                    if (found) {
                      addToCart(found);
                      setQrInput("");
                    } else {
                      toast.error("Product not found");
                    }
                  }
                }}
                placeholder="Scan QR / barcode ↵"
                className="h-11 rounded-xl border border-gray-200 px-4 text-sm outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400"
              />
            </div>
          </div>

          {/* Cart */}
          <div className="bg-white rounded-2xl shadow-sm p-4 flex-1 min-h-0 flex flex-col">
            <SectionLabel>Products</SectionLabel>
            <p className="text-xs text-gray-400 mb-2">
              {totalItems} items · {cart.length} lines
            </p>

            {cart.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                No products added yet
              </div>
            ) : (
              <div className="space-y-3 overflow-y-auto flex-1 pr-1">
                {cart.map((item) => {
                  const cells = cellStock[item.id] ?? [];
                  const currentCell = cells.find(
                    (c) => c.warehouseCellId === item.warehouseCellId
                  );
                  const fractional = isFractionalUnit(item.unit);
                  return (
                    <div
                      key={`${item.id}:${item.warehouseCellId}`}
                      className="rounded-2xl border border-gray-100 p-4 flex items-center gap-3"
                    >
                      <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-gray-100 flex items-center justify-center text-2xl">
                        {item.image ? (
                          <Image src={item.image} alt={item.name} width={56} height={56} className="object-cover" />
                        ) : (
                          "📦"
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{item.name}</p>
                        <p className="text-[11px] text-gray-400">
                          {item.qty} {item.unit} × {fmt(item.price)}
                          {currentCell && (
                            <>
                              {" "}· {(currentCell.available - item.qty).toFixed(fractional ? 3 : 0)} {item.unit} remaining
                            </>
                          )}
                        </p>

                        {cells.length > 0 && (
                          <select
                            value={item.warehouseCellId}
                            onChange={(e) =>
                              switchCell(item.id, item.warehouseCellId, e.target.value)
                            }
                            className="mt-1 text-[11px] rounded-lg border border-gray-200 px-2 py-1 outline-none focus:ring-1 focus:ring-red-300 max-w-full"
                          >
                            {cells.map((c) => (
                              <option key={c.warehouseCellId} value={c.warehouseCellId}>
                                {c.warehouseName} — {c.cellName} ({c.available})
                              </option>
                            ))}
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
                                onChange={(e) =>
                                  setExactQty(item.id, item.warehouseCellId, e.target.value)
                                }
                                onBlur={cleanupZeroQty}
                                className="w-20 h-7 rounded-lg border border-gray-200 px-2 text-sm font-bold outline-none focus:ring-1 focus:ring-red-300"
                              />
                              <span className="text-[11px] text-gray-400">{item.unit}</span>
                            </>
                          ) : (
                            <>
                              <button onClick={() => setQty(item.id, item.warehouseCellId, -1)} className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 font-bold">−</button>
                              <span className="text-sm font-bold w-6 text-center">{item.qty}</span>
                              <button onClick={() => setQty(item.id, item.warehouseCellId, 1)} className="w-7 h-7 rounded-full bg-blue-500 text-white hover:bg-blue-600 font-bold">+</button>
                            </>
                          )}
                          <button onClick={() => removeItem(item.id, item.warehouseCellId)} className="ml-2 text-[11px] font-semibold text-red-500 hover:text-red-600">Remove</button>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="font-bold text-gray-900">{fmt(item.qty * item.price)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Right: payment panel ────────────────────────────────────────── */}
        <div className="w-100 flex flex-col gap-3 shrink-0">
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <SectionLabel>Point</SectionLabel>
            <select
              value={pointId}
              onChange={(e) => handlePointChange(e.target.value)}
              disabled={isLoadingStock}
              className="w-full h-11 rounded-xl border border-gray-200 px-3 text-sm outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 disabled:opacity-50"
            >
              {points.length === 0 && <option value="">Point yo'q</option>}
              {points.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            {isLoadingStock && (
              <p className="text-[11px] text-gray-400 mt-1.5">Qoldiq yuklanmoqda…</p>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-4">
            <SectionLabel>Payment method</SectionLabel>
            <div className="grid grid-cols-3 gap-2">
              {METHODS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMethod(m.id)}
                  className={`py-3 rounded-[13px] border-[1.5px] flex flex-col items-center gap-1.5 transition-all duration-150 cursor-pointer
                    ${method === m.id
                      ? "border-red-500 bg-red-50 text-red-600"
                      : "border-gray-200 text-gray-400 bg-white hover:border-gray-300"
                    }`}
                >
                  {methodIcons[m.id]}
                  <span className={`text-[11px] font-semibold ${method === m.id ? "text-red-600" : "text-gray-500"}`}>
                    {m.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-4">
            <SectionLabel>Add tip</SectionLabel>
            <div className="grid grid-cols-4 gap-2">
              {TIPS.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setTip(t.value)}
                  className={`py-2 rounded-full text-xs font-semibold border-[1.5px] transition-all duration-150 cursor-pointer
                    ${tip === t.value
                      ? "border-red-500 bg-blue-50 text-red-600 font-bold"
                      : "border-gray-200 text-gray-500 hover:border-gray-300 bg-transparent"
                    }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-4 sticky bottom-0">
            <div className="flex justify-between items-center py-1 text-[11px] text-gray-400">
              <span>Subtotal</span><span>{fmt(subtotal)}</span>
            </div>
            <div className="flex justify-between items-center py-1 text-[11px] text-gray-400">
              <span>Tax 8%</span><span>{fmt(taxAmt)}</span>
            </div>
            {tipAmt > 0 && (
              <div className="flex justify-between items-center py-1 text-[11px] text-gray-400">
                <span>Tip {tip * 100}%</span><span>{fmt(tipAmt)}</span>
              </div>
            )}
            <div className="flex justify-between items-center py-1 border-t border-gray-100 mt-2 pt-2.5">
              <span className="text-[13px] text-gray-800 font-bold">Total</span>
              <span className="text-[13px] text-gray-800 font-bold">{fmt(total)}</span>
            </div>

            <button
              onClick={handleCharge}
              disabled={stage !== "idle" || cart.length === 0 || isPending}
              className={`w-full mt-4 py-4 rounded-2xl text-[14px] font-bold tracking-tight transition-all duration-200 cursor-pointer
                ${stage === "idle" && cart.length > 0
                  ? "bg-red-500 text-white shadow-lg shadow-red-300 hover:bg-red-600 active:scale-[.98]"
                  : "bg-gray-100 text-gray-400 cursor-default"
                }`}
            >
              {cart.length === 0
                ? "Add products first"
                : stage === "idle"
                  ? `Charge ${fmt(total)}`
                  : "Processing…"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Payment overlay ─────────────────────────────────────────────────── */}
      {(stage === "processing" || stage === "success") && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl px-11 py-9 text-center shadow-2xl min-w-67.5">
            {stage === "processing" ? (
              <>
                <div className="w-12 h-12 border-[3px] border-blue-100 border-t-blue-500 rounded-full mx-auto mb-5 animate-spin" />
                <p className="text-[17px] font-bold text-gray-800">Processing payment</p>
                <p className="text-xs text-gray-400 mt-1.5">Please wait…</p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center mx-auto mb-4">
                  <CheckIcon />
                </div>
                <p className="text-[18px] font-bold text-gray-800">Payment approved</p>
                <p className="text-xs text-gray-500 mt-1 font-mono">{lastSaleNumber}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {fmt(total)} via {method}
                </p>
                <div className="flex gap-2 mt-6">
                  <button
                    onClick={reset}
                    className="flex-1 py-2.5 bg-gray-50 rounded-xl text-xs font-semibold text-gray-500 hover:bg-gray-100 cursor-pointer transition-colors"
                  >
                    New Sale
                  </button>
                  <button className="flex-1 py-2.5 bg-blue-500 rounded-xl text-xs font-semibold text-white hover:bg-blue-600 cursor-pointer transition-colors shadow-md shadow-blue-200">
                    Receipt
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