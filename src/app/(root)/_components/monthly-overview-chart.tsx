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

const chartConfig = {
  savdo: {
    label: "Savdo",
    color: "var(--color-chart-2)",
  },
  xarid: {
    label: "Xarid",
    color: "var(--color-chart-4)",
  },
} satisfies ChartConfig;

export function MonthlyOverviewChart({
  data,
}: {
  data: { label: string; savdo: number; xarid: number }[];
}) {
  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Oylik ko&apos;rsatkichlar</CardTitle>
        <CardDescription>So&apos;nggi 6 oy — savdo va xarid</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-70 w-full">
          <BarChart data={data} margin={{ left: 0, right: 12, top: 8 }}>
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
                        {name === "savdo" ? "Savdo" : "Xarid"}
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
            <Bar dataKey="savdo" fill="var(--color-savdo)" radius={4} />
            <Bar dataKey="xarid" fill="var(--color-xarid)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}