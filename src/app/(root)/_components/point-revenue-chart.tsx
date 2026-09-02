"use client";

import { Trophy } from "lucide-react";
import { useTranslations } from "next-intl";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type PointRevenue = {
  name: string;
  revenue: number;
};

interface PointRevenueChartProps {
  data: PointRevenue[];
}

const RANK_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

const fmt = (n: number) => n.toLocaleString("uz-UZ");

export function PointRevenueChart({ data }: PointRevenueChartProps) {
  const t = useTranslations("dashboard");

  const total = data.reduce((sum, p) => sum + p.revenue, 0);

  const max =
    data.length > 0
      ? Math.max(...data.map((p) => p.revenue))
      : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{t("pointRevenue.title")}</CardTitle>

            <CardDescription>
              {t("pointRevenue.description")}
            </CardDescription>
          </div>

          {total > 0 && (
            <div className="text-right">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide">
                {t("pointRevenue.total")}
              </p>

              <p className="text-lg font-bold tabular-nums">
                {fmt(total)}{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  so'm
                </span>
              </p>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {data.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <Trophy className="w-8 h-8 opacity-20" />

            <p className="text-sm">
              {t("pointRevenue.noSales")}
            </p>
          </div>
        ) : (
          <ol className="space-y-4">
            {data.map((point, index) => {
              const share =
                total > 0
                  ? (point.revenue / total) * 100
                  : 0;

              const width =
                max > 0
                  ? (point.revenue / max) * 100
                  : 0;

              const color =
                RANK_COLORS[index % RANK_COLORS.length];

              return (
                <li
                  key={point.name}
                  className="flex items-center gap-3"
                >
                  <span
                    className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold text-white"
                    style={{ backgroundColor: color }}
                  >
                    {index + 1}
                  </span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2 mb-1">
                      <span className="text-sm font-medium truncate">
                        {point.name}
                      </span>

                      <span className="text-sm font-semibold tabular-nums shrink-0">
                        {fmt(point.revenue)}{" "}
                        <span className="text-[11px] font-normal text-muted-foreground">
                          ({share.toFixed(0)}%)
                        </span>
                      </span>
                    </div>

                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${width}%`,
                          backgroundColor: color,
                        }}
                      />
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}