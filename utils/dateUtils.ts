export function localDateString(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function nextSunday(from = new Date()): Date {
  const result = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  result.setDate(result.getDate() + ((7 - result.getDay()) % 7));
  return result;
}

export function daysBetweenLocalDates(from: Date, to: Date): number {
  const start = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const end = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((end - start) / 86400000);
}

export function dateFromLocalString(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return localDateString(date) === value ? date : null;
}

export function isValidPhoneNumber(value: string): boolean {
  const trimmed = value.trim();
  if (!/^[+0-9() .-]+$/.test(trimmed)) return false;
  const digits = trimmed.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
}

export function formatLongDate(value: string): string {
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const date = dateOnly ? dateFromLocalString(value) : new Date(value);
  if (!date) return value;
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export const formatUsDate = formatLongDate;

export function parseUsDate(value: string): string | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return null;

  const month = Number(match[1]);
  const day = Number(match[2]);
  const year = Number(match[3]);
  const parsed = new Date(year, month - 1, day);
  if (
    parsed.getFullYear() !== year
    || parsed.getMonth() !== month - 1
    || parsed.getDate() !== day
  ) return null;

  return localDateString(parsed);
}

export function formatTimeUpdated(value?: string): string {
  if (!value) return "Time not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-US", { month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

export function formatDuration(hours: number): string {
  const totalMinutes = Math.max(0, Math.round(hours * 60));
  const wholeHours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (wholeHours === 0) return `${minutes} min`;
  const hourLabel = wholeHours === 1 ? "hr" : "hrs";
  return minutes === 0 ? `${wholeHours} ${hourLabel}` : `${wholeHours} ${hourLabel} ${minutes} min`;
}
