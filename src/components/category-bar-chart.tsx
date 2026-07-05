"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency } from "@/lib/format";
import { palette } from "@/lib/palette";

export type CategoryDatum = { name: string; icon: string; total: number };

export function CategoryBarChart({
  data,
  currency,
}: {
  data: CategoryDatum[];
  currency: string;
}) {
  const chartData = data.map((d) => ({
    label: `${d.icon} ${d.name}`,
    total: d.total,
  }));

  return (
    <ResponsiveContainer
      width="100%"
      height={Math.max(120, chartData.length * 40)}
    >
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ left: 8, right: 24, top: 4, bottom: 4 }}
      >
        <CartesianGrid horizontal={false} stroke={palette.gridline} />
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="label"
          width={130}
          tick={{ fontSize: 12, fill: palette.inkSecondary }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          formatter={(value) => formatCurrency(Number(value), currency)}
          labelFormatter={() => ""}
          contentStyle={{
            borderRadius: 12,
            border: `1px solid ${palette.gridline}`,
            fontSize: 12,
          }}
        />
        <Bar dataKey="total" fill={palette.a} radius={[0, 4, 4, 0]} barSize={20} />
      </BarChart>
    </ResponsiveContainer>
  );
}
