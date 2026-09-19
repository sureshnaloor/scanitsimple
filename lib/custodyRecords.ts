/** True when this row is the live custodian (custodyto is null / empty). */
export function isOpenCustody(record: { custodyto?: unknown } | null | undefined): boolean {
  if (!record) return false;
  const to = record.custodyto;
  return to == null || to === '';
}

export function splitCustodyRecords<T extends { _id?: unknown; custodyto?: unknown }>(
  records: T[]
): { current: T | null; history: T[] } {
  const unique: T[] = [];
  const seen = new Set<string>();

  for (const record of records || []) {
    if (!record) continue;
    const key = record._id != null ? String(record._id) : '';
    if (key) {
      if (seen.has(key)) continue;
      seen.add(key);
    }
    unique.push(record);
  }

  const open = unique.filter(isOpenCustody);
  const closed = unique.filter((record) => !isOpenCustody(record));
  return {
    current: open[0] ?? null,
    history: [...open.slice(1), ...closed],
  };
}
