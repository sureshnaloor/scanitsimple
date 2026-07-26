'use client';
import { useState, useEffect, useMemo } from 'react';
import { PencilIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';

import ThemeSwitcher from '@/app/components/ThemeSwitcher';
import {
  FIELD_SCOPES,
  CUSTOM_FIELD_ENTITIES,
  INPUT_TYPES,
  MASTER_SOURCES,
  CustomFieldScope,
  CustomFieldInputType,
} from '@/lib/custom-fields';

interface CustomFieldDef {
  _id: string;
  scope: CustomFieldScope;
  entity: string;
  label: string;
  fieldKey: string;
  inputType: CustomFieldInputType;
  masterSource: string | null;
  options: string[];
  active: boolean;
}

interface DefForm {
  scope: CustomFieldScope;
  entity: string;
  label: string;
  inputType: CustomFieldInputType;
  masterSource: string;
  optionsText: string; // comma separated, for radio
}

const EMPTY_FORM: DefForm = {
  scope: 'basic',
  entity: 'fixedasset',
  label: '',
  inputType: 'text',
  masterSource: '',
  optionsText: '',
};

function entityLabel(value: string): string {
  for (const group of Object.values(CUSTOM_FIELD_ENTITIES)) {
    const found = group.find((e) => e.value === value);
    if (found) return found.label;
  }
  return value;
}

function scopeLabel(value: string): string {
  return FIELD_SCOPES.find((s) => s.value === value)?.label ?? value;
}

function inputTypeLabel(value: string): string {
  return INPUT_TYPES.find((t) => t.value === value)?.label ?? value;
}

function masterSourceLabel(value: string | null): string {
  if (!value) return '—';
  return MASTER_SOURCES.find((s) => s.value === value)?.label ?? value;
}

export default function CustomFieldsManagement() {
  const [defs, setDefs] = useState<CustomFieldDef[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<DefForm>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterScope, setFilterScope] = useState<string>('');
  const [saving, setSaving] = useState(false);

  const entities = useMemo(() => CUSTOM_FIELD_ENTITIES[form.scope], [form.scope]);

  const fetchDefs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/customfielddefs');
      if (!response.ok) throw new Error('Failed to fetch field definitions');
      const data = await response.json();
      setDefs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching field definitions:', err);
      setError('Failed to load field definitions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDefs();
  }, []);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
  };

  const startEdit = (def: CustomFieldDef) => {
    setEditingId(def._id);
    setForm({
      scope: def.scope,
      entity: def.entity,
      label: def.label,
      inputType: def.inputType,
      masterSource: def.masterSource ?? '',
      optionsText: (def.options ?? []).join(', '),
    });
  };

  const handleSubmit = async () => {
    setError(null);

    if (!form.label.trim()) {
      setError('Label is required');
      return;
    }
    if (form.inputType === 'master-select' && !form.masterSource) {
      setError('Choose which master data the dropdown should use');
      return;
    }
    const options =
      form.inputType === 'radio'
        ? form.optionsText
            .split(',')
            .map((o) => o.trim())
            .filter(Boolean)
        : [];
    if (form.inputType === 'radio' && options.length < 2) {
      setError('Radio fields need at least two options (comma separated)');
      return;
    }

    const payload = {
      scope: form.scope,
      entity: form.entity,
      label: form.label.trim(),
      inputType: form.inputType,
      masterSource: form.inputType === 'master-select' ? form.masterSource : null,
      options,
    };

    try {
      setSaving(true);
      const response = await fetch(
        editingId ? `/api/customfielddefs/${editingId}` : '/api/customfielddefs',
        {
          method: editingId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error || 'Failed to save field definition');
      }
      await fetchDefs();
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save field definition');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this field definition? Values already stored for it will remain on records.')) return;
    try {
      const response = await fetch(`/api/customfielddefs/${id}`, { method: 'DELETE' });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error || 'Failed to delete field definition');
      }
      await fetchDefs();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete field definition');
    }
  };

  const visibleDefs = filterScope ? defs.filter((d) => d.scope === filterScope) : defs;

  const inputClass =
    'bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white border border-gray-300 dark:border-slate-600 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent';

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-slate-900">
      <div className="container mx-auto p-6">
        <div className="flex justify-end mb-4">
          <ThemeSwitcher />
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Custom Fields Management
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Define additional labels for master data, static/basic data, or transaction data.
            A field can be a dropdown fed from centrally maintained master data, or a free
            field (text, number, date, radio, toggle).
          </p>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-200 px-4 py-2 rounded-lg text-sm mb-4">
              {error}
            </div>
          )}

          {/* Add / Edit form */}
          <div className="border border-gray-200 dark:border-slate-600 rounded-lg p-4 mb-8 bg-gray-50 dark:bg-slate-700/40">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {editingId ? 'Edit Field Definition' : 'Add New Field'}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Data group
                </label>
                <select
                  value={form.scope}
                  onChange={(e) => {
                    const scope = e.target.value as CustomFieldScope;
                    setForm((prev) => ({
                      ...prev,
                      scope,
                      entity: CUSTOM_FIELD_ENTITIES[scope][0].value,
                    }));
                  }}
                  className={`w-full ${inputClass}`}
                >
                  {FIELD_SCOPES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Applies to
                </label>
                <select
                  value={form.entity}
                  onChange={(e) => setForm((prev) => ({ ...prev, entity: e.target.value }))}
                  className={`w-full ${inputClass}`}
                >
                  {entities.map((ent) => (
                    <option key={ent.value} value={ent.value}>
                      {ent.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Label
                </label>
                <input
                  type="text"
                  value={form.label}
                  onChange={(e) => setForm((prev) => ({ ...prev, label: e.target.value }))}
                  placeholder="e.g. Warranty Provider"
                  className={`w-full ${inputClass}`}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Field type
                </label>
                <select
                  value={form.inputType}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      inputType: e.target.value as CustomFieldInputType,
                    }))
                  }
                  className={`w-full ${inputClass}`}
                >
                  {INPUT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              {form.inputType === 'master-select' && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Master data source
                  </label>
                  <select
                    value={form.masterSource}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, masterSource: e.target.value }))
                    }
                    className={`w-full ${inputClass}`}
                  >
                    <option value="">Select master data…</option>
                    {MASTER_SOURCES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {form.inputType === 'radio' && (
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Options (comma separated)
                  </label>
                  <input
                    type="text"
                    value={form.optionsText}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, optionsText: e.target.value }))
                    }
                    placeholder="e.g. Good, Fair, Poor"
                    className={`w-full ${inputClass}`}
                  />
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors inline-flex items-center gap-2 disabled:opacity-50"
              >
                <PlusIcon className="h-4 w-4" />
                {editingId ? 'Save Changes' : 'Add Field'}
              </button>
              {editingId && (
                <button
                  onClick={resetForm}
                  className="bg-gray-200 dark:bg-slate-600 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-md hover:bg-gray-300 dark:hover:bg-slate-500 transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>

          {/* Filter */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setFilterScope('')}
              className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                filterScope === ''
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-slate-600'
              }`}
            >
              All
            </button>
            {FIELD_SCOPES.map((s) => (
              <button
                key={s.value}
                onClick={() => setFilterScope(s.value)}
                className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                  filterScope === s.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-slate-600'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Definitions table */}
          {loading ? (
            <div className="text-gray-500 dark:text-gray-400 py-8 text-center">Loading…</div>
          ) : visibleDefs.length === 0 ? (
            <div className="text-gray-500 dark:text-gray-400 py-8 text-center">
              No custom fields defined yet. Use the form above to add one.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-600">
                <thead>
                  <tr className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <th className="px-3 py-2">Label</th>
                    <th className="px-3 py-2">Data group</th>
                    <th className="px-3 py-2">Applies to</th>
                    <th className="px-3 py-2">Field type</th>
                    <th className="px-3 py-2">Source / options</th>
                    <th className="px-3 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-600">
                  {visibleDefs.map((def) => (
                    <tr key={def._id} className="text-sm text-gray-900 dark:text-gray-100">
                      <td className="px-3 py-2 font-medium">{def.label}</td>
                      <td className="px-3 py-2">{scopeLabel(def.scope)}</td>
                      <td className="px-3 py-2">{entityLabel(def.entity)}</td>
                      <td className="px-3 py-2">{inputTypeLabel(def.inputType)}</td>
                      <td className="px-3 py-2">
                        {def.inputType === 'master-select'
                          ? masterSourceLabel(def.masterSource)
                          : def.inputType === 'radio'
                          ? (def.options ?? []).join(', ')
                          : '—'}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex justify-end gap-3">
                          <button
                            onClick={() => startEdit(def)}
                            title="Edit field definition"
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(def._id)}
                            title="Delete field definition"
                            className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
