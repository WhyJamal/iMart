"use client";

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
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
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useTranslations } from "next-intl";

export function MonthlyOverviewChart({
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
      label: t("monthlyOverview.sales"),
      color: "var(--color-chart-2)",
    },
    purchases: {
      label: t("monthlyOverview.purchases"),
      color: "var(--color-chart-4)",
    },
  } satisfies ChartConfig;

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>{t("monthlyOverview.title")}</CardTitle>
        <CardDescription>{t("monthlyOverview.description")}</CardDescription>
      </CardHeader>

      <CardContent>
        <ChartContainer config={chartConfig} className="h-70 w-full">
          <BarChart
            data={data}
            margin={{ left: 0, right: 12, top: 8 }}
          >
            <CartesianGrid vertical={false} />

            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
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
                          ? t("monthlyOverview.sales")
                          : t("monthlyOverview.purchases")}
                      </span>

                      <span className="font-mono font-medium tabular-nums text-foreground">
                        {Number(value).toLocaleString("uz-UZ")} so&apos;m
                      </span>
                    </div>
                  )}
                />
              }
            />

            <ChartLegend content={<ChartLegendContent />} />

            <Bar
              dataKey="sales"
              fill="var(--color-sales)"
              radius={4}
            />

            <Bar
              dataKey="purchases"
              fill="var(--color-purchases)"
              radius={4}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}