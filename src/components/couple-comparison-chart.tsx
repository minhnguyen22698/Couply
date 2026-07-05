"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency } from "@/lib/format";

export type ComparisonDatum = { month: string; mine: number; partner: number };

export function CoupleComparisonChart({
  data,
  partnerName,
  currency,
}: {
  data: ComparisonDatum[];
  partnerName: string;
  currency: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="#e1e0d9" />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 12, fill: "#52514e" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis hide />
        <Tooltip
          formatter={(value) => formatCurrency(Number(value), currency)}
          contentStyle={{
            borderRadius: 12,
            border: "1px solid #e1e0d9",
            fontSize: 12,
          }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="mine" name="Bạn" fill="#c1633b" radius={[4, 4, 0, 0]} barSize={16} />
        <Bar
          dataKey="partner"
          name={partnerName}
          fill="#5f8575"
          radius={[4, 4, 0, 0]}
          barSize={16}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
