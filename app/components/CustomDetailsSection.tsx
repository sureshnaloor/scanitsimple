'use client';

import { useEffect, useState } from 'react';
import FixedAssetSection from '@/app/components/fixedasset/FixedAssetSection';
import { fap } from '@/lib/fixedAssetPageDesign';
import { useAccess } from '@/lib/use-access';
import { fetchMasterOptions } from '@/lib/custom-fields';

type AssetType =
  | 'portable'
  | 'software'
  | 'transport'
  | 'facility'
  | 'mme'
  | 'fixedasset'
  | 'tool'
  | 'custody'
  | 'calibration';

type FieldType = 'text' | 'number' | 'date' | 'toggle' | 'radio' | 'master-select';

interface CustomDetailRecord {
  _id: string;
  assetType: AssetType;
  assetnumber: string;
  label: string;
  fieldType: FieldType;
  valueText?: string | null;
  valueNumber?: number | null;
  valueDate?: string | Date | null;
  valueBool?: boolean | null;
  defId?: string;
  fieldKey?: string;
  createdby?: string;
  createdat?: string | Date;
  updatedby?: string;
  updatedat?: string | Date;
}

interface CustomFieldDef {
  _id: string;
  entity: string;
  label: string;
  fieldKey: string;
  inputType: FieldType;
  masterSource: string | null;
  options: string[];
  active: boolean;
}

interface MergedRow {
  key: string;
  def?: CustomFieldDef;
  record?: CustomDetailRecord;
}

interface Props {
  assetType: AssetType;
  assetnumber: string;
  /** Section heading; defaults to "Custom details". */
  title?: string;
  /** When true, render nothing until a field is defined or a value exists. */
  hideWhenEmpty?: boolean;
}

const TYPE_LABELS: Record<FieldType, string> = {
  text: 'Text',
  number: 'Number',
  date: 'Date',
  toggle: 'Toggle',
  radio: 'Radio',
  'master-select': 'Dropdown',
};

function formatValue(record: CustomDetailRecord): string {
  if (record.fieldType === 'number') {
    return record.valueNumber !== null && record.valueNumber !== undefined
      ? String(record.valueNumber)
      : '—';
  }
  if (record.fieldType === 'date') {
    if (!record.valueDate) return '—';
    const d = new Date(record.valueDate);
    return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString();
  }
  if (record.fieldType === 'toggle') {
    if (record.valueBool === null || record.valueBool === undefined) return '—';
    return record.valueBool ? 'Yes' : 'No';
  }
  // text, radio, master-select
  return record.valueText?.trim() ? record.valueText : '—';
}

function formatMetaDate(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString();
}

export default function CustomDetailsSection({
  assetType,
  assetnumber,
  title = 'Custom details',
  hideWhenEmpty = false,
}: Props) {
  const { canModify } = useAccess();
  const [rows, setRows] = useState<CustomDetailRecord[]>([]);
  const [defs, setDefs] = useState<CustomFieldDef[]>([]);
  const [masterOptions, setMasterOptions] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [newField, setNewField] = useState({
    label: '',
    fieldType: 'text' as FieldType,
    valueText: '',
    valueNumber: '',
    valueDate: '',
  });
  const [editField, setEditField] = useState({
    label: '',
    fieldType: 'text' as FieldType,
    valueText: '',
    valueNumber: '',
    valueDate: '',
    valueBool: false,
  });

  const base = `/api/customdata/${encodeURIComponent(assetType)}/${encodeURIComponent(assetnumber)}`;
  const inputClass = fap.input;

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const [rowsRes, defsRes] = await Promise.all([
        fetch(base),
        fetch(`/api/customfielddefs?entity=${encodeURIComponent(assetType)}`),
      ]);
      const rowsData = await rowsRes.json().catch(() => []);
      const defsData = await defsRes.json().catch(() => []);
      if (!rowsRes.ok) throw new Error(rowsData.error || 'Failed to load custom details');
      const loadedRows: CustomDetailRecord[] = Array.isArray(rowsData) ? rowsData : [];
      const loadedDefs: CustomFieldDef[] = Array.isArray(defsData)
        ? defsData.filter((d) => d.active !== false)
        : [];
      setRows(loadedRows);
      setDefs(loadedDefs);

      // Preload master dropdown options for master-select defs
      const optionEntries = await Promise.all(
        loadedDefs
          .filter((d) => d.inputType === 'master-select' && d.masterSource)
          .map(async (d) => [d._id, await fetchMasterOptions(d.masterSource as string)] as const)
      );
      setMasterOptions(Object.fromEntries(optionEntries));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load custom details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!assetnumber) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assetnumber, assetType]);

  // Merge admin-defined fields with stored values, plus legacy ad-hoc rows
  const mergedRows: MergedRow[] = (() => {
    const matched = new Set<string>();
    const fromDefs: MergedRow[] = defs.map((def) => {
      const record =
        rows.find((r) => r.defId === def._id) ??
        rows.find(
          (r) => !r.defId && (r.fieldKey === def.fieldKey || r.label === def.label)
        );
      if (record) matched.add(record._id);
      return { key: `def:${def._id}`, def, record };
    });
    const legacy: MergedRow[] = rows
      .filter((r) => !matched.has(r._id))
      .map((r) => ({ key: r._id, record: r }));
    return [...fromDefs, ...legacy];
  })();

  // Sections marked hideWhenEmpty stay invisible until an admin defines a
  // field for this data group or a value has been stored.
  if (hideWhenEmpty && !loading && mergedRows.length === 0) {
    return null;
  }

  const addCustomDetail = async () => {
    if (!newField.label.trim()) {
      alert('Label is required.');
      return;
    }

    try {
      setSaving(true);
      const payload: Record<string, unknown> = {
        label: newField.label.trim(),
        fieldType: newField.fieldType,
      };

      if (newField.fieldType === 'number') {
        payload.valueNumber = newField.valueNumber.trim() === '' ? null : Number(newField.valueNumber);
      } else if (newField.fieldType === 'date') {
        payload.valueDate = newField.valueDate || null;
      } else {
        payload.valueText = newField.valueText.trim() || null;
      }

      const res = await fetch(base, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to add custom detail');

      setNewField({
        label: '',
        fieldType: 'text',
        valueText: '',
        valueNumber: '',
        valueDate: '',
      });
      setIsAdding(false);
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to add custom detail');
    } finally {
      setSaving(false);
    }
  };

  const deleteCustomDetail = async (id: string) => {
    if (!confirm('Delete this custom detail?')) return;
    try {
      const res = await fetch(`${base}/${encodeURIComponent(id)}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to delete custom detail');
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to delete custom detail');
    }
  };

  const effectiveType = (row: MergedRow): FieldType =>
    row.def?.inputType ?? row.record?.fieldType ?? 'text';

  const openEdit = (row: MergedRow) => {
    const type = effectiveType(row);
    const record = row.record;
    setEditingKey(row.key);
    setEditField({
      label: row.def?.label ?? record?.label ?? '',
      fieldType: type,
      valueText: record?.valueText ?? '',
      valueNumber:
        record?.valueNumber !== null && record?.valueNumber !== undefined
          ? String(record.valueNumber)
          : '',
      valueDate: record?.valueDate ? new Date(record.valueDate).toISOString().slice(0, 10) : '',
      valueBool: record?.valueBool === true,
    });
  };

  const saveEdit = async (row: MergedRow) => {
    if (!editingKey) return;
    if (!editField.label.trim()) {
      alert('Label is required.');
      return;
    }
    try {
      setEditSaving(true);
      const payload: Record<string, unknown> = {
        label: editField.label.trim(),
        fieldType: editField.fieldType,
      };

      if (row.def) {
        payload.defId = row.def._id;
        payload.fieldKey = row.def.fieldKey;
      }

      if (editField.fieldType === 'number') {
        payload.valueNumber = editField.valueNumber.trim() === '' ? null : Number(editField.valueNumber);
      } else if (editField.fieldType === 'date') {
        payload.valueDate = editField.valueDate || null;
      } else if (editField.fieldType === 'toggle') {
        payload.valueBool = editField.valueBool;
      } else {
        payload.valueText = editField.valueText.trim() || null;
      }

      const isNewValue = !row.record;
      const res = await fetch(
        isNewValue ? base : `${base}/${encodeURIComponent(row.record!._id)}`,
        {
          method: isNewValue ? 'POST' : 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to update custom detail');

      setEditingKey(null);
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to update custom detail');
    } finally {
      setEditSaving(false);
    }
  };

  const renderEditValueInput = (row: MergedRow) => {
    const type = editField.fieldType;

    if (type === 'number') {
      return (
        <input
          type="number"
          step="any"
          className={`w-full rounded border px-2 py-1 text-xs ${fap.input}`}
          value={editField.valueNumber}
          onChange={(e) => setEditField((f) => ({ ...f, valueNumber: e.target.value }))}
        />
      );
    }
    if (type === 'date') {
      return (
        <input
          type="date"
          className={`w-full rounded border px-2 py-1 text-xs ${fap.input}`}
          value={editField.valueDate}
          onChange={(e) => setEditField((f) => ({ ...f, valueDate: e.target.value }))}
        />
      );
    }
    if (type === 'toggle') {
      return (
        <label className="inline-flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={editField.valueBool}
            onChange={(e) => setEditField((f) => ({ ...f, valueBool: e.target.checked }))}
            className="h-4 w-4 accent-[#00B4D8]"
          />
          <span className={fap.textSecondary}>{editField.valueBool ? 'Yes' : 'No'}</span>
        </label>
      );
    }
    if (type === 'radio') {
      const options = row.def?.options ?? [];
      return (
        <div className="flex flex-wrap gap-3">
          {options.map((opt) => (
            <label key={opt} className="inline-flex items-center gap-1.5 text-xs">
              <input
                type="radio"
                name={`custom-radio-${row.key}`}
                checked={editField.valueText === opt}
                onChange={() => setEditField((f) => ({ ...f, valueText: opt }))}
                className="accent-[#00B4D8]"
              />
              <span>{opt}</span>
            </label>
          ))}
        </div>
      );
    }
    if (type === 'master-select') {
      const options = row.def ? masterOptions[row.def._id] ?? [] : [];
      return (
        <select
          className={`w-full rounded border px-2 py-1 text-xs ${fap.input}`}
          value={editField.valueText}
          onChange={(e) => setEditField((f) => ({ ...f, valueText: e.target.value }))}
        >
          <option value="">Select…</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      );
    }
    return (
      <input
        className={`w-full rounded border px-2 py-1 text-xs ${fap.input}`}
        value={editField.valueText}
        onChange={(e) => setEditField((f) => ({ ...f, valueText: e.target.value }))}
      />
    );
  };

  return (
    <FixedAssetSection title={title} defaultExpanded>
      <div className="w-full max-w-4xl space-y-4">
        <p className={`text-sm ${fap.textSecondary}`}>
          {canModify
            ? 'Set values for admin-defined fields, or add your own custom fields per record.'
            : 'Additional details defined for this record.'}
        </p>

        {error && <div className={fap.errorBox}>{error}</div>}

        {loading ? (
          <div className={`text-sm ${fap.textSecondary}`}>Loading custom details…</div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-[#2A3B4C]/50">
            <table className="min-w-full text-left text-sm">
              <thead className={fap.tableHead}>
                <tr>
                  <th className="px-3 py-2">Label</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Value</th>
                  <th className="px-3 py-2">Created</th>
                  <th className="px-3 py-2">Last updated</th>
                  {canModify && <th className="px-3 py-2" />}
                </tr>
              </thead>
              <tbody>
                {mergedRows.map((row) => {
                  const type = effectiveType(row);
                  const record = row.record;
                  const isEditing = editingKey === row.key;
                  return (
                    <tr key={row.key} className={`border-t ${fap.tableRow}`}>
                      <td className="px-3 py-2">
                        {isEditing && !row.def ? (
                          <input
                            className={`w-full rounded border px-2 py-1 text-xs ${fap.input}`}
                            value={editField.label}
                            onChange={(e) => setEditField((f) => ({ ...f, label: e.target.value }))}
                          />
                        ) : (
                          row.def?.label ?? record?.label
                        )}
                      </td>
                      <td className="px-3 py-2 capitalize">
                        {isEditing && !row.def ? (
                          <select
                            className={`w-full rounded border px-2 py-1 text-xs ${fap.input}`}
                            value={editField.fieldType}
                            onChange={(e) =>
                              setEditField((f) => ({
                                ...f,
                                fieldType: e.target.value as FieldType,
                                valueText: '',
                                valueNumber: '',
                                valueDate: '',
                                valueBool: false,
                              }))
                            }
                          >
                            <option value="text">Text</option>
                            <option value="number">Number</option>
                            <option value="date">Date</option>
                          </select>
                        ) : (
                          TYPE_LABELS[type] ?? type
                        )}
                      </td>
                      <td className="px-3 py-2">
                        {isEditing ? renderEditValueInput(row) : record ? formatValue(record) : '—'}
                      </td>
                      <td className={`px-3 py-2 text-xs ${fap.textMuted}`}>
                        {record?.createdby || '—'}
                      </td>
                      <td className={`px-3 py-2 text-xs ${fap.textMuted}`}>
                        {record
                          ? (record.updatedby || '—') + ' / ' + formatMetaDate(record.updatedat)
                          : '—'}
                      </td>
                      {canModify && (
                        <td className="px-3 py-2 whitespace-nowrap">
                          {isEditing ? (
                            <>
                              <button
                                type="button"
                                onClick={() => saveEdit(row)}
                                disabled={editSaving}
                                className="mr-2 text-xs text-[#00B4D8] hover:underline disabled:opacity-50"
                              >
                                {editSaving ? 'Saving…' : 'Save'}
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingKey(null)}
                                className={`mr-2 text-xs hover:underline ${fap.textSecondary}`}
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => openEdit(row)}
                                className="mr-2 text-xs text-[#00B4D8] hover:underline"
                              >
                                {record ? 'Edit' : 'Set'}
                              </button>
                              {record && (
                                <button
                                  type="button"
                                  onClick={() => deleteCustomDetail(record._id)}
                                  className="text-xs text-[#EF4444] hover:underline"
                                >
                                  Delete
                                </button>
                              )}
                            </>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
                {mergedRows.length === 0 && (
                  <tr>
                    <td colSpan={canModify ? 6 : 5} className={`px-3 py-4 text-center ${fap.textMuted}`}>
                      No custom details yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {canModify &&
          (!isAdding ? (
            <button
              type="button"
              onClick={() => setIsAdding(true)}
              className={fap.btnPrimary}
            >
              + Add custom field
            </button>
          ) : (
            <div className="grid gap-3 border-t border-slate-200 pt-4 sm:grid-cols-2 dark:border-[#2A3B4C]/50">
              <label className="block">
                <span className={`text-xs ${fap.textSecondary}`}>Label</span>
                <input
                  className={inputClass}
                  value={newField.label}
                  onChange={(e) => setNewField((f) => ({ ...f, label: e.target.value }))}
                  placeholder="e.g. Fuel card number"
                />
              </label>
              <label className="block">
                <span className={`text-xs ${fap.textSecondary}`}>Input type</span>
                <select
                  className={inputClass}
                  value={newField.fieldType}
                  onChange={(e) =>
                    setNewField((f) => ({
                      ...f,
                      fieldType: e.target.value as FieldType,
                      valueText: '',
                      valueNumber: '',
                      valueDate: '',
                    }))
                  }
                >
                  <option value="text">Text</option>
                  <option value="number">Number</option>
                  <option value="date">Date</option>
                </select>
              </label>

              {newField.fieldType === 'text' && (
                <label className="block sm:col-span-2">
                  <span className={`text-xs ${fap.textSecondary}`}>Value</span>
                  <input
                    className={inputClass}
                    value={newField.valueText}
                    onChange={(e) => setNewField((f) => ({ ...f, valueText: e.target.value }))}
                  />
                </label>
              )}

              {newField.fieldType === 'number' && (
                <label className="block sm:col-span-2">
                  <span className={`text-xs ${fap.textSecondary}`}>Value</span>
                  <input
                    type="number"
                    step="any"
                    className={inputClass}
                    value={newField.valueNumber}
                    onChange={(e) => setNewField((f) => ({ ...f, valueNumber: e.target.value }))}
                  />
                </label>
              )}

              {newField.fieldType === 'date' && (
                <label className="block sm:col-span-2">
                  <span className={`text-xs ${fap.textSecondary}`}>Value</span>
                  <input
                    type="date"
                    className={inputClass}
                    value={newField.valueDate}
                    onChange={(e) => setNewField((f) => ({ ...f, valueDate: e.target.value }))}
                  />
                </label>
              )}

              <div className="sm:col-span-2 flex gap-2">
                <button
                  type="button"
                  onClick={addCustomDetail}
                  disabled={saving}
                  className={`${fap.btnPrimary} disabled:opacity-50`}
                >
                  {saving ? 'Saving…' : 'Save custom field'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className={fap.btnSecondary}
                >
                  Cancel
                </button>
              </div>
            </div>
          ))}
      </div>
    </FixedAssetSection>
  );
}
