const LOCALE_BY_CURRENCY: Record<string, string> = {
  VND: "vi-VN",
  USD: "en-US",
};

export function formatCurrency(amount: number, currency: string) {
  const locale = LOCALE_BY_CURRENCY[currency] ?? "en-US";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "VND" ? 0 : 2,
  }).format(amount);
}
