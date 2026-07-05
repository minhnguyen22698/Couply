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
