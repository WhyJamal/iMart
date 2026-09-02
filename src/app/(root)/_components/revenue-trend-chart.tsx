"use client";

import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useTranslations } from "next-intl";

export function RevenueTrendChart({
  data,
}: {
  data: {
    label: string;
    sales: number;
    purchases: number;
  }[];
}) {
  const t = useTranslations("dashboard");

  const chartConfig = {
    sales: {
      label: t("revenueTrend.sales"),
      color: "var(--color-chart-2)",
    },
    purchases: {
      label: t("revenueTrend.purchases"),
      color: "var(--color-chart-4)",
    },
  } satisfies ChartConfig;

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>{t("revenueTrend.title")}</CardTitle>
        <CardDescription>{t("revenueTrend.description")}</CardDescription>
      </CardHeader>

      <CardContent>
        <ChartContainer config={chartConfig} className="h-70 w-full">
          <AreaChart
            data={data}
            margin={{ left: 0, right: 12, top: 8 }}
          >
            <defs>
              <linearGradient
                id="fillSales"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="5%"
                  stopColor="var(--color-sales)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-sales)"
                  stopOpacity={0.05}
                />
              </linearGradient>

              <linearGradient
                id="fillPurchases"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="5%"
                  stopColor="var(--color-purchases)"
                  stopOpacity={0.6}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-purchases)"
                  stopOpacity={0.05}
                />
              </linearGradient>
            </defs>

            <CartesianGrid vertical={false} />

            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={24}
            />

            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  indicator="dot"
                  formatter={(value, name) => (
                    <div className="flex w-full items-center justify-between gap-4">
                      <span className="text-muted-foreground">
                        {name === "sales"
                          ? t("revenueTrend.sales")
                          : t("revenueTrend.purchases")}
                      </span>

                      <span className="font-mono font-medium tabular-nums text-foreground">
                        {Number(value).toLocaleString("uz-UZ")} so&apos;m
                      </span>
                    </div>
                  )}
                />
              }
            />

            <Area
              dataKey="purchases"
              type="monotone"
              fill="url(#fillPurchases)"
              stroke="var(--color-purchases)"
              strokeWidth={2}
              stackId="a"
            />

            <Area
              dataKey="sales"
              type="monotone"
              fill="url(#fillSales)"
              stroke="var(--color-sales)"
              strokeWidth={2}
              stackId="b"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}