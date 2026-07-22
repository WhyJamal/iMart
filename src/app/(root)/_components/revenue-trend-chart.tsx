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

export function RevenueTrendChart({
  data,
}: {
  data: { label: string; savdo: number; xarid: number }[];
}) {
  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Savdo va xarid dinamikasi</CardTitle>
        <CardDescription>So&apos;nggi 14 kun</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-70 w-full">
          <AreaChart data={data} margin={{ left: 0, right: 12, top: 8 }}>
            <defs>
              <linearGradient id="fillSavdo" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-savdo)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-savdo)"
                  stopOpacity={0.05}
                />
              </linearGradient>
              <linearGradient id="fillXarid" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-xarid)"
                  stopOpacity={0.6}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-xarid)"
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
            <Area
              dataKey="xarid"
              type="monotone"
              fill="url(#fillXarid)"
              stroke="var(--color-xarid)"
              strokeWidth={2}
              stackId="a"
            />
            <Area
              dataKey="savdo"
              type="monotone"
              fill="url(#fillSavdo)"
              stroke="var(--color-savdo)"
              strokeWidth={2}
              stackId="b"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}