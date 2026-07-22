"use client";

import * as React from "react";
import { Cell, Pie, PieChart } from "recharts";
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

export function PaymentMethodChart({
  data,
}: {
  data: { method: string; amount: number; fill: string }[];
}) {
  const total = React.useMemo(
    () => data.reduce((sum, d) => sum + d.amount, 0),
    [data]
  );

  const chartConfig = React.useMemo(() => {
    const config: ChartConfig = {};
    for (const d of data) {
      config[d.method] = { label: d.method, color: d.fill };
    }
    return config;
  }, [data]) satisfies ChartConfig;

  return (
    <Card className="@container/card flex flex-col">
      <CardHeader>
        <CardTitle>To&apos;lov usullari</CardTitle>
        <CardDescription>Joriy oy bo&apos;yicha ulush</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        {total === 0 ? (
          <div className="flex h-60 items-center justify-center text-sm text-muted-foreground">
            Hali savdo qayd etilmagan
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="mx-auto aspect-square h-60"
          >
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    hideLabel
                    formatter={(value, name) => (
                      <div className="flex w-full items-center justify-between gap-4">
                        <span className="text-muted-foreground">{name}</span>
                        <span className="font-mono font-medium tabular-nums text-foreground">
                          {Number(value).toLocaleString("uz-UZ")} so&apos;m
                        </span>
                      </div>
                    )}
                  />
                }
              />
              <Pie
                data={data}
                dataKey="amount"
                nameKey="method"
                innerRadius={55}
                outerRadius={85}
                strokeWidth={4}
              >
                {data.map((entry) => (
                  <Cell key={entry.method} fill={entry.fill} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
        )}
        {total > 0 ? (
          <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-1.5">
            {data.map((d) => (
              <div key={d.method} className="flex items-center gap-1.5 text-xs">
                <span
                  className="h-2 w-2 rounded-xs"
                  style={{ backgroundColor: d.fill }}
                />
                <span className="text-muted-foreground">{d.method}</span>
                <span className="font-medium">
                  {total > 0 ? Math.round((d.amount / total) * 100) : 0}%
                </span>
              </div>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}