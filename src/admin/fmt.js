// Small formatting helpers shared by every admin screen.

export const cx = (...parts) => parts.filter(Boolean).join(" ");

export function naira(value, { compact = false } = {}) {
  const n = Number(value) || 0;
  if (compact) return `₦${compactNumber(n)}`;
  return `₦${n.toLocaleString("en-NG", { maximumFractionDigits: 2, minimumFractionDigits: n % 1 ? 2 : 0 })}`;
}

// 350000 -> "350K", 10700 -> "10.7K", 1200000 -> "1.2M"
export function compactNumber(value) {
  const n = Number(value) || 0;
  const abs = Math.abs(n);
  const trim = (x) => String(Math.round(x * 10) / 10);
  if (abs >= 1e9) return `${trim(n / 1e9)}B`;
  if (abs >= 1e6) return `${trim(n / 1e6)}M`;
  if (abs >= 1e3) return `${trim(n / 1e3)}K`;
  return String(Math.round(n));
}

export const number = (n) => (Number(n) || 0).toLocaleString("en-NG");

const two = (n) => String(n).padStart(2, "0");

// 01-01-2025
export function dateDMY(input) {
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return "—";
  return `${two(d.getDate())}-${two(d.getMonth() + 1)}-${d.getFullYear()}`;
}

// 01 Oct | 11:29 am
export function dateTimeShort(input) {
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return "—";
  const month = d.toLocaleString("en-GB", { month: "short" });
  let h = d.getHours();
  const am = h < 12;
  h = h % 12 || 12;
  return `${two(d.getDate())} ${month} | ${two(h)}:${two(d.getMinutes())} ${am ? "am" : "pm"}`;
}

// 15.01.2025
export function dateDots(input) {
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return "—";
  return `${two(d.getDate())}.${two(d.getMonth() + 1)}.${d.getFullYear()}`;
}

// "a nice top value" + evenly spaced ticks for a chart axis
export function niceTicks(max, count = 5) {
  const top = Math.max(Number(max) || 0, 1);
  const rough = top / count;
  const pow = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= rough) ?? 10 * pow;
  return Array.from({ length: count + 1 }, (_, i) => i * step);
}

export const pageCount = (total, size = 10) => Math.max(1, Math.ceil(total / size));
