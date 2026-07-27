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

interface CustomMaster {
  _id: string;
  name: string;
  key: string;
  values: string[];
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

export default function CustomFieldsManagement() {
  const [activeTab, setActiveTab] = useState<'fields' | 'masters'>('fields');
  
  // Custom Fields States
  const [defs, setDefs] = useState<CustomFieldDef[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<DefForm>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterScope, setFilterScope] = useState<string>('');
  const [saving, setSaving] = useState(false);

  // Custom Masters States
  const [customMasters, setCustomMasters] = useState<CustomMaster[]>([]);
  const [masterForm, setMasterForm] = useState({ name: '', valuesText: '' });
  const [editingMasterId, setEditingMasterId] = useState<string | null>(null);
  const [savingMaster, setSavingMaster] = useState(false);
  const [masterError, setMasterError] = useState<string | null>(null);

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

  const fetchCustomMasters = async () => {
    try {
      const response = await fetch('/api/custom-masters');
      if (response.ok) {
        const data = await response.json();
        setCustomMasters(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error fetching custom masters:', err);
    }
  };

  useEffect(() => {
    fetchDefs();
    fetchCustomMasters();
  }, []);

  const masterSourceLabel = (value: string | null): string => {
    if (!value) return '—';
    const found = MASTER_SOURCES.find((s) => s.value === value);
    if (found) return found.label;
    const custom = customMasters.find((cm) => cm.key === value);
    if (custom) return `Custom Master: ${custom.name}`;
    return value;
  };

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

  // Custom Masters handlers
  const resetMasterForm = () => {
    setMasterForm({ name: '', valuesText: '' });
    setEditingMasterId(null);
    setMasterError(null);
  };

  const startMasterEdit = (cm: CustomMaster) => {
    setEditingMasterId(cm._id);
    setMasterForm({
      name: cm.name,
      valuesText: cm.values.join('\n')
    });
  };

  const handleMasterSubmit = async () => {
    setMasterError(null);
    if (!masterForm.name.trim()) {
      setMasterError('Name is required');
      return;
    }

    const values = masterForm.valuesText
      .split('\n')
      .map((v) => v.trim())
      .filter(Boolean);

    if (values.length === 0) {
      setMasterError('At least one value option is required');
      return;
    }

    try {
      setSavingMaster(true);
      const payload = {
        name: masterForm.name.trim(),
        values
      };

      const url = editingMasterId 
        ? `/api/custom-masters/${editingMasterId}` 
        : '/api/custom-masters';

      const response = await fetch(url, {
        method: editingMasterId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error || 'Failed to save custom master list');
      }

      await fetchCustomMasters();
      resetMasterForm();
    } catch (err: any) {
      setMasterError(err.message || 'Failed to save custom master list');
    } finally {
      setSavingMaster(false);
    }
  };

  const handleMasterDelete = async (id: string) => {
    if (!confirm('Delete this custom master list? Fields using this master dropdown will lose their source items.')) return;
    try {
      const response = await fetch(`/api/custom-masters/${id}`, { method: 'DELETE' });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error || 'Failed to delete custom master list');
      }
      await fetchCustomMasters();
    } catch (err: any) {
      alert(err.message || 'Failed to delete custom master list');
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
            Custom Fields &amp; Masters Configuration
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Define custom field schema metadata, or build standalone custom master dropdown lists like countries, companies, or custom tags.
          </p>

          {/* TAB SEGMENTS */}
          <div className="flex border-b border-gray-200 dark:border-slate-750 mb-6 gap-6">
            <button
              onClick={() => setActiveTab('fields')}
              className={`pb-2.5 font-semibold text-sm transition-colors border-b-2 cursor-pointer ${
                activeTab === 'fields'
                  ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Custom Fields Schema
            </button>
            <button
              onClick={() => setActiveTab('masters')}
              className={`pb-2.5 font-semibold text-sm transition-colors border-b-2 cursor-pointer ${
                activeTab === 'masters'
                  ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Custom Master Lists
            </button>
          </div>

          {/* TAB 1: CUSTOM FIELDS SCHEMA */}
          {activeTab === 'fields' && (
            <div>
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-200 px-4 py-2 rounded-lg text-sm mb-4">
                  {error}
                </div>
              )}

              {/* Add / Edit form */}
              <div className="border border-gray-200 dark:border-slate-650 rounded-lg p-4 mb-8 bg-gray-50/70 dark:bg-slate-750/30">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
                  {editingId ? 'Edit Field Definition' : 'Add New Custom Field'}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  <div className="flex flex-col">
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                      Data Group
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

                  <div className="flex flex-col">
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                      Applies To
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

                  <div className="flex flex-col">
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                      Field Label
                    </label>
                    <input
                      type="text"
                      value={form.label}
                      onChange={(e) => setForm((prev) => ({ ...prev, label: e.target.value }))}
                      placeholder="e.g. Warranty Provider"
                      className={`w-full ${inputClass}`}
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                      Input Type
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
                    <div className="flex flex-col">
                      <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                        Master Data Source
                      </label>
                      <select
                        value={form.masterSource}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, masterSource: e.target.value }))
                        }
                        className={`w-full ${inputClass}`}
                      >
                        <option value="">Select master data source…</option>
                        <optgroup label="System Master Data">
                          {MASTER_SOURCES.map((s) => (
                            <option key={s.value} value={s.value}>
                              {s.label}
                            </option>
                          ))}
                        </optgroup>
                        {customMasters.length > 0 && (
                          <optgroup label="Custom Admin Master Lists">
                            {customMasters.map((cm) => (
                              <option key={cm.key} value={cm.key}>
                                {cm.name} ({cm.values.length} items)
                              </option>
                            ))}
                          </optgroup>
                        )}
                      </select>
                    </div>
                  )}

                  {form.inputType === 'radio' && (
                    <div className="md:col-span-2 flex flex-col">
                      <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
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
                    className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors inline-flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    <PlusIcon className="h-4 w-4" />
                    {editingId ? 'Save Changes' : 'Add Field'}
                  </button>
                  {editingId && (
                    <button
                      onClick={resetForm}
                      className="bg-gray-200 dark:bg-slate-600 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-md hover:bg-gray-300 dark:hover:bg-slate-500 transition-colors cursor-pointer"
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
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
                    filterScope === ''
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-150 dark:bg-slate-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-slate-650'
                  }`}
                >
                  All
                </button>
                {FIELD_SCOPES.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setFilterScope(s.value)}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
                      filterScope === s.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-150 dark:bg-slate-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-slate-650'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {/* Definitions table */}
              {loading ? (
                <div className="text-gray-500 dark:text-gray-400 py-8 text-center">Loading schema data…</div>
              ) : visibleDefs.length === 0 ? (
                <div className="text-gray-500 dark:text-gray-400 py-8 text-center">
                  No custom fields defined yet. Use the form above to add one.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-slate-700">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700 text-sm">
                    <thead className="bg-gray-50 dark:bg-slate-900/50">
                      <tr className="text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        <th className="px-4 py-3">Label</th>
                        <th className="px-4 py-3">Data Group</th>
                        <th className="px-4 py-3">Applies To</th>
                        <th className="px-4 py-3">Field Type</th>
                        <th className="px-4 py-3">Source / Options</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-slate-700 bg-white dark:bg-slate-800">
                      {visibleDefs.map((def) => (
                        <tr key={def._id} className="text-gray-900 dark:text-gray-100 hover:bg-gray-50/50 dark:hover:bg-slate-750/30 transition-colors">
                          <td className="px-4 py-3 font-semibold">{def.label}</td>
                          <td className="px-4 py-3 text-slate-500">{scopeLabel(def.scope)}</td>
                          <td className="px-4 py-3 text-slate-500">{entityLabel(def.entity)}</td>
                          <td className="px-4 py-3 text-slate-500">
                            <span className="bg-blue-50 text-blue-700 dark:bg-blue-900/10 dark:text-blue-400 text-xs font-semibold py-0.5 px-2 rounded-full border border-blue-200 dark:border-blue-900/20">
                              {inputTypeLabel(def.inputType)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-400 font-mono text-xs">
                            {def.inputType === 'master-select'
                              ? masterSourceLabel(def.masterSource)
                              : def.inputType === 'radio'
                              ? (def.options ?? []).join(', ')
                              : '—'}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-3">
                              <button
                                onClick={() => startEdit(def)}
                                title="Edit field definition"
                                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 cursor-pointer"
                              >
                                <PencilIcon className="h-4.5 w-4.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(def._id)}
                                title="Delete field definition"
                                className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 cursor-pointer"
                              >
                                <TrashIcon className="h-4.5 w-4.5" />
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
          )}

          {/* TAB 2: CUSTOM MASTER LISTS */}
          {activeTab === 'masters' && (
            <div>
              {masterError && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-200 px-4 py-2 rounded-lg text-sm mb-4">
                  {masterError}
                </div>
              )}

              {/* Master Creation Form */}
              <div className="border border-gray-200 dark:border-slate-650 rounded-lg p-4 mb-8 bg-gray-50/70 dark:bg-slate-750/30">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
                  {editingMasterId ? 'Edit Custom Master List' : 'Create New Master List (Country, Company, etc.)'}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="flex flex-col">
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                      Master List Name
                    </label>
                    <input
                      type="text"
                      value={masterForm.name}
                      onChange={(e) => setMasterForm((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g. Country"
                      className={`w-full ${inputClass}`}
                    />
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                      This defines the custom list name which will show in Master data source dropdown.
                    </span>
                  </div>

                  <div className="flex flex-col">
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                      Dropdown Option Values (one value per line)
                    </label>
                    <textarea
                      value={masterForm.valuesText}
                      onChange={(e) => setMasterForm((prev) => ({ ...prev, valuesText: e.target.value }))}
                      placeholder="Saudi Arabia&#10;United Arab Emirates&#10;Qatar&#10;Bahrain"
                      rows={5}
                      className={`w-full ${inputClass}`}
                    />
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                      Press enter to write each item on a separate line.
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleMasterSubmit}
                    disabled={savingMaster}
                    className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors inline-flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    <PlusIcon className="h-4 w-4" />
                    {editingMasterId ? 'Save List' : 'Create List'}
                  </button>
                  {editingMasterId && (
                    <button
                      onClick={resetMasterForm}
                      className="bg-gray-200 dark:bg-slate-600 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-md hover:bg-gray-300 dark:hover:bg-slate-500 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>

              {/* Master lists table */}
              {customMasters.length === 0 ? (
                <div className="text-gray-500 dark:text-gray-400 py-8 text-center">
                  No custom master lists created yet. Fill the form above to add Countries, Companies, etc.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-slate-700">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700 text-sm">
                    <thead className="bg-gray-50 dark:bg-slate-900/50">
                      <tr className="text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        <th className="px-4 py-3">List Name</th>
                        <th className="px-4 py-3">Internal Identifier (Key)</th>
                        <th className="px-4 py-3">Item Count</th>
                        <th className="px-4 py-3">Options List Preview</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-slate-700 bg-white dark:bg-slate-800">
                      {customMasters.map((cm) => (
                        <tr key={cm._id} className="text-gray-900 dark:text-gray-100 hover:bg-gray-50/50 dark:hover:bg-slate-750/30 transition-colors">
                          <td className="px-4 py-3 font-semibold">{cm.name}</td>
                          <td className="px-4 py-3 font-mono text-xs text-blue-600 dark:text-blue-400">{cm.key}</td>
                          <td className="px-4 py-3">
                            <span className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 text-xs font-semibold py-0.5 px-2 rounded-full">
                              {cm.values.length} items
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-500 max-w-sm truncate" title={cm.values.join(', ')}>
                            {cm.values.join(', ')}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-3">
                              <button
                                onClick={() => startMasterEdit(cm)}
                                title="Edit master list details"
                                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 cursor-pointer"
                              >
                                <PencilIcon className="h-4.5 w-4.5" />
                              </button>
                              <button
                                onClick={() => handleMasterDelete(cm._id)}
                                title="Delete master list"
                                className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 cursor-pointer"
                              >
                                <TrashIcon className="h-4.5 w-4.5" />
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
          )}
        </div>
      </div>
    </div>
  );
}
