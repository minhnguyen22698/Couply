"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatCurrency } from "@/lib/format";
import { categoricalPalette, palette } from "@/lib/palette";

export type CategoryDatum = { name: string; icon: string; total: number };

const MAX_SLICES = 7;

/** Sorts desc and folds anything past the token ceiling into "Khác". */
export function foldTopCategories(data: CategoryDatum[]): CategoryDatum[] {
  const sorted = [...data].sort((a, b) => b.total - a.total);
  if (sorted.length <= MAX_SLICES + 1) return sorted;

  const head = sorted.slice(0, MAX_SLICES);
  const otherTotal = sorted
    .slice(MAX_SLICES)
    .reduce((sum, d) => sum + d.total, 0);
  return [...head, { name: "Khác", icon: "📦", total: otherTotal }];
}

type PieLabelProps = {
  cx?: number;
  cy?: number;
  midAngle?: number;
  innerRadius?: number;
  outerRadius?: number;
  percent?: number;
};

function renderPercentLabel({
  cx = 0,
  cy = 0,
  midAngle = 0,
  innerRadius = 0,
  outerRadius = 0,
  percent = 0,
}: PieLabelProps) {
  // Slivers under 5% would collide with neighboring labels — the legend
  // below the chart still carries their exact value.
  if (percent < 0.05) return null;

  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.6;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill={palette.paper}
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={12}
      fontWeight={600}
    >
      {Math.round(percent * 100)}%
    </text>
  );
}

export function CategoryPieChart({
  data,
  currency,
}: {
  data: CategoryDatum[];
  currency: string;
}) {
  const chartData = data;

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={chartData}
          dataKey="total"
          nameKey="name"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          stroke={palette.paper}
          strokeWidth={2}
          label={renderPercentLabel}
          labelLine={false}
          isAnimationActive={false}
        >
          {chartData.map((entry, index) => (
            <Cell
              key={entry.name}
              fill={categoricalPalette[index % categoricalPalette.length]}
            />
          ))}
        </Pie>
        <Tooltip
          formatter={(value) => formatCurrency(Number(value), currency)}
          contentStyle={{
            borderRadius: 12,
            border: `1px solid ${palette.gridline}`,
            fontSize: 12,
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
