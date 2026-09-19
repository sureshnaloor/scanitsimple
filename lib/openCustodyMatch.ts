export function openCustodyClause() {
  return {
    $or: [{ custodyto: null }, { custodyto: { $exists: false } }, { custodyto: '' }],
  };
}

export function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export const WAREHOUSE_REPORT_CITIES = ['Dammam', 'Jubail'] as const;
export type WarehouseReportCity = (typeof WAREHOUSE_REPORT_CITIES)[number];

export function openWarehouseMatch(city?: string) {
  const clauses: object[] = [
    openCustodyClause(),
    {
      $or: [{ locationType: 'warehouse' }, { warehouseCity: { $gt: '' } }],
    },
  ];
  const trimmed = city?.trim();
  if (trimmed) {
    const rx = `^${escapeRegex(trimmed)}$`;
    clauses.push({
      $or: [
        { warehouseCity: { $regex: rx, $options: 'i' } },
        { custodyCity: { $regex: rx, $options: 'i' } },
      ],
    });
  }
  return { $and: clauses };
}

export function parseProjectIdentifier(projectId: string): { wbs: string; name: string; full: string } {
  const trimmed = String(projectId || '').trim();
  const idx = trimmed.indexOf(' - ');
  if (idx === -1) return { wbs: trimmed, name: '', full: trimmed };
  return {
    wbs: trimmed.slice(0, idx).trim(),
    name: trimmed.slice(idx + 3).trim(),
    full: trimmed,
  };
}

/** Match custody rows whether `project` is "WBS", "WBS - name", or the full identifier. */
export function openProjectCustodyMatch(projectId: string) {
  const { wbs, full } = parseProjectIdentifier(projectId);
  const projectOr: object[] = [];
  if (full) projectOr.push({ project: full });
  if (wbs) {
    if (wbs !== full) projectOr.push({ project: wbs });
    projectOr.push({ project: { $regex: `^${escapeRegex(wbs)}(\\s*-\\s*|$)` } });
  }
  return {
    $and: [openCustodyClause(), { $or: projectOr.length ? projectOr : [{ project: full }] }],
  };
}
