export function parseDate(value) {
  if (!value || typeof value !== 'string') return null;
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

export function addMonths(date, months) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

export function diffDaysInclusive(startDate, endDate) {
  if (!(startDate instanceof Date) || !(endDate instanceof Date)) return null;
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return null;
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  return Math.floor((endDate - startDate) / millisecondsPerDay) + 1;
}
