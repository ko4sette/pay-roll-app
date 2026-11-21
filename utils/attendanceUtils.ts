import { Attendance } from "../types";

function timestampFor(workDate: string, value: string): Date | null {
  if (/^\d{4}-\d{2}-\d{2}[T ]/.test(value)) {
    const timestamp = new Date(value);
    return Number.isNaN(timestamp.getTime()) ? null : timestamp;
  }

  const match = /^(\d{1,2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?$/.exec(value);
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(workDate);
  if (!match || !dateMatch) return null;

  const [hours, minutes, seconds, milliseconds] = [
    Number(match[1]),
    Number(match[2]),
    Number(match[3] ?? 0),
    Number((match[4] ?? "").padEnd(3, "0") || 0),
  ];
  const [year, month, day] = dateMatch.slice(1).map(Number);
  if (hours > 23 || minutes > 59 || seconds > 59) return null;
  const timestamp = new Date(year, month - 1, day, hours, minutes, seconds, milliseconds);
  return timestamp.getFullYear() === year
    && timestamp.getMonth() === month - 1
    && timestamp.getDate() === day
    ? timestamp
    : null;
}

export function getAttendanceWorkedMinutes(record: Attendance): number | null {
  if (!record.timeIn || !record.timeOut) return null;
  const start = timestampFor(record.workDate, record.timeIn);
  const end = timestampFor(record.workDate, record.timeOut);
  if (!start || !end) return null;
  if (end < start && !/^\d{4}-\d{2}-\d{2}[T ]/.test(record.timeOut)) {
    end.setDate(end.getDate() + 1);
  }
  return Math.max(0, end.getTime() - start.getTime()) / 60_000;
}

export function uniqueAttendanceByEmployeeDay(records: Attendance[]): Attendance[] {
  const unique = new Map<string, Attendance>();
  for (const record of records) {
    const key = `${record.employeeId}:${record.workDate}`;
    const existing = unique.get(key);
    const recordIsComplete = getAttendanceWorkedMinutes(record) !== null;
    const existingIsComplete = existing ? getAttendanceWorkedMinutes(existing) !== null : false;
    if (
      !existing
      || (recordIsComplete && !existingIsComplete)
      || (recordIsComplete === existingIsComplete && (record.updatedAt ?? "") >= (existing.updatedAt ?? ""))
    ) {
      unique.set(key, record);
    }
  }
  return [...unique.values()];
}