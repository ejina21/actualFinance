export type MonthChange = { absolute: number; percent: number | null };

export function compareMonthValues(base: number, current: number): MonthChange {
  return {
    absolute: current - base,
    percent: base === 0 ? null : ((current - base) / Math.abs(base)) * 100,
  };
}

export function addComparisonMonth(
  baseMonth: string,
  selected: readonly string[],
  candidate: string,
): string[] {
  if (candidate === baseMonth || selected.includes(candidate)) {
    return [...selected];
  }
  return [...selected, candidate];
}
