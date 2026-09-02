"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { useTranslations } from "next-intl";

type TopProduct = {
  name: string;
  revenue: number;
};

interface TopProductsChartProps {
  data: TopProduct[];
}

const COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

export function TopProductsChart({
  data,
}: TopProductsChartProps) {
  const t = useTranslations("dashboard");

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("topProducts.title")}</CardTitle>

        <CardDescription>
          {t("topProducts.description")}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="h-90">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{
                top: 10,
                right: 20,
                left: 30,
                bottom: 10,
              }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                horizontal={false}
              />

              <XAxis
                type="number"
                tickFormatter={(value) =>
                  value.toLocaleString("uz-UZ")
                }
              />

              <YAxis
                dataKey="name"
                type="category"
                width={120}
              />

              <Tooltip
                formatter={(value) => [
                  `${Number(value ?? 0).toLocaleString("uz-UZ")} so'm`,
                  t("revenue"),
                ]}
              />

              <Bar
                dataKey="revenue"
                radius={[0, 8, 8, 0]}
              >
                {data.map((_, index) => (
                  <Cell
                    key={index}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}