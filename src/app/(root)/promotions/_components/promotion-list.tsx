"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Clock3, Trash2, Percent } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { IPromotion } from "@/types/promotion.types";
import { deletePromotion } from "@/actions/promotion-actions";

const moneyDate = (d: Date) => new Intl.DateTimeFormat("ru-RU", { dateStyle: "medium", timeStyle: "short" }).format(new Date(d));
const countdown = (ms: number) => {
  if (ms <= 0) return "Завершена";

  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  const mins = Math.floor((ms % 3600000) / 60000);
  const secs = Math.floor((ms % 60000) / 1000);

  const s = String(secs).padStart(2, "0");

  if (days > 0) {
    return `${days}д ${hours}ч ${mins}м ${s}с`;
  }

  if (hours > 0) {
    return `${hours}ч ${mins}м ${s}с`;
  }

  if (mins > 0) {
    return `${mins}м ${s}с`;
  }

  return `${s}с`;
};

export function PromotionList({ promotions }: { promotions: IPromotion[] }) {
  if (!promotions.length) return <div className="text-center py-24 text-muted-foreground"><Percent className="w-10 h-10 mx-auto mb-3 opacity-30" /><p className="text-sm">Акций пока нет</p></div>;
  return <div className="grid gap-3">{promotions.map((p) => <PromotionCard key={p.id} promotion={p} />)}</div>;
}
function PromotionCard({ promotion: p }: { promotion: IPromotion }) {
  const router = useRouter(); const [pending, startTransition] = useTransition();
  const [remaining, setRemaining] = useState(() => new Date(p.endsAt).getTime() - Date.now());
  useEffect(() => { const timer = window.setInterval(() => setRemaining(new Date(p.endsAt).getTime() - Date.now()), 1000); return () => window.clearInterval(timer); }, [p.endsAt]);
  const expired = remaining <= 0;
  const remove = () => startTransition(async () => { const r = await deletePromotion(p.id); if (r.success) { toast.success("Акция удалена"); router.refresh() } else toast.error(r.error) });
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">
              {p.name}
            </h3>
            <Badge variant={expired ? "secondary" : "default"}>
              {p.discountPercent}%
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {p.pointName} · {p.warehouseName} · {p.warehouseCellName}
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={remove} disabled={pending}>
          <Trash2 className="w-4 h-4 text-destructive" />
        </Button>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {p.items.map(i =>
          <Badge key={i.id} variant="outline">
            {i.productName}
          </Badge>)}
      </div>
      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Clock3 className="w-3.5 h-3.5" />
          до {moneyDate(p.endsAt)}
        </span>
        <span className={expired ? "text-muted-foreground" : "font-semibold text-white bg-red-500 p-0.5 px-2 rounded-lg"}>
          {countdown(remaining)}
        </span>
      </div>
      {p.comment && <p className="mt-3 text-xs text-muted-foreground border-t pt-3">{p.comment}</p>}
    </div>
  )
};
