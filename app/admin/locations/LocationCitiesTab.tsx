'use client';

import { useState, useEffect } from 'react';
import { PencilIcon, TrashIcon, PlusIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';
import { useAppTheme } from '@/app/contexts/ThemeContext';

interface CityRow {
  _id: string;
  name: string;
  order: number;
}

export default function LocationCitiesTab() {
  const { theme } = useAppTheme();
  const [warehouse, setWarehouse] = useState<CityRow[]>([]);
  const [department, setDepartment] = useState<CityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [newKind, setNewKind] = useState<'warehouse' | 'department'>('department');
  const [newName, setNewName] = useState('');
  const [editing, setEditing] = useState<{ _id: string; name: string } | null>(null);

  const getThemeStyles = () => {
    switch (theme) {
      case 'glassmorphic':
        return {
          card: 'bg-white/10 backdrop-blur-lg border border-white/20',
          input: 'bg-white/10 border border-white/20 text-white placeholder-white/50',
          button: 'bg-teal-500 hover:bg-teal-600 text-white',
          buttonSecondary: 'bg-white/10 hover:bg-white/20 text-white border border-white/20',
          text: 'text-white',
          textMuted: 'text-white/60',
          tableRow: 'border-white/10 hover:bg-white/5',
        };
      case 'light':
        return {
          card: 'bg-white border-2 border-blue-200 shadow-md',
          input: 'bg-white border-2 border-blue-200 text-gray-900 placeholder-gray-500',
          button: 'bg-blue-600 hover:bg-blue-700 text-white',
          buttonSecondary: 'bg-gray-100 hover:bg-gray-200 text-gray-900 border-2 border-blue-200',
          text: 'text-gray-900',
          textMuted: 'text-gray-600',
          tableRow: 'border-blue-200 hover:bg-blue-50',
        };
      default:
        return {
          card: 'bg-slate-800/50 border border-slate-700',
          input: 'bg-slate-700 border border-slate-600 text-slate-100 placeholder-slate-400',
          button: 'bg-teal-600 hover:bg-teal-700 text-white',
          buttonSecondary: 'bg-slate-700 hover:bg-slate-600 text-slate-100 border border-slate-600',
          text: 'text-slate-100',
          textMuted: 'text-slate-400',
          tableRow: 'border-slate-700 hover:bg-slate-700/50',
        };
    }
  };

  const styles = getThemeStyles();

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/location-cities');
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setWarehouse(data.warehouse || []);
      setDepartment(data.department || []);
    } catch {
      setError('Failed to load city lists');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    try {
      setError(null);
      const res = await fetch('/api/location-cities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: newKind, name }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || 'Failed to add');
      setSuccess('City added');
      setNewName('');
      load();
      setTimeout(() => setSuccess(null), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add');
    }
  };

  const handleSaveEdit = async () => {
    if (!editing || !editing.name.trim()) return;
    try {
      setError(null);
      const res = await fetch('/api/location-cities', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ _id: editing._id, name: editing.name.trim() }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || 'Failed to update');
      setSuccess('City updated');
      setEditing(null);
      load();
      setTimeout(() => setSuccess(null), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update');
    }
  };

  const handleDelete = async (id: string, label: string) => {
    if (!confirm(`Delete city "${label}"?`)) return;
    try {
      setError(null);
      const res = await fetch(`/api/location-cities?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || 'Failed to delete');
      setSuccess('City deleted');
      load();
      setTimeout(() => setSuccess(null), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  const renderTable = (title: string, rows: CityRow[]) => (
    <div className={`${styles.card} rounded-lg overflow-hidden mb-8`}>
      <div className={`px-4 py-3 border-b border-white/10 ${styles.text} font-semibold`}>{title}</div>
      {loading ? (
        <div className={`p-6 text-center ${styles.textMuted}`}>Loading…</div>
      ) : rows.length === 0 ? (
        <div className={`p-6 text-center ${styles.textMuted}`}>No cities yet.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={`${styles.tableRow} border-b`}>
                <th className={`px-4 py-2 text-left ${styles.text}`}>Name</th>
                <th className={`px-4 py-2 text-right ${styles.text}`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row._id} className={`${styles.tableRow} border-b`}>
                  <td className={`px-4 py-2 ${styles.text}`}>
                    {editing?._id === row._id ? (
                      <input
                        type="text"
                        value={editing.name}
                        onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                        className={`w-full max-w-xs ${styles.input} px-2 py-1 rounded`}
                      />
                    ) : (
                      row.name
                    )}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {editing?._id === row._id ? (
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={handleSaveEdit}
                          className={`${styles.button} p-1.5 rounded`}
                          title="Save"
                        >
                          <CheckIcon className="h-5 w-5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditing(null)}
                          className={`${styles.buttonSecondary} p-1.5 rounded`}
                          title="Cancel"
                        >
                          <XMarkIcon className="h-5 w-5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditing({ _id: row._id, name: row.name })}
                          className={`${styles.buttonSecondary} p-1.5 rounded`}
                          title="Edit"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(row._id, row.name)}
                          className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-200 p-1.5 rounded"
                          title="Delete"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return (
    <div>
      <p className={`${styles.textMuted} mb-6 max-w-2xl`}>
        These lists drive warehouse and department/camp city dropdowns in custody forms and the project site city field.
        Physical buildings and rooms are managed under the Premises tab.
      </p>

      {error && (
        <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 text-red-200 rounded-lg flex justify-between items-center">
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)}>
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      )}
      {success && (
        <div className="mb-4 p-4 bg-green-500/20 border border-green-500/50 text-green-200 rounded-lg flex justify-between items-center">
          <span className="flex items-center gap-2">
            <CheckIcon className="h-5 w-5" />
            {success}
          </span>
          <button type="button" onClick={() => setSuccess(null)}>
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      )}

      <form onSubmit={handleAdd} className={`${styles.card} p-4 rounded-lg mb-8 flex flex-wrap gap-3 items-end`}>
        <div>
          <label className={`block text-xs ${styles.textMuted} mb-1`}>List</label>
          <select
            value={newKind}
            onChange={(e) => setNewKind(e.target.value as 'warehouse' | 'department')}
            className={`${styles.input} px-3 py-2 rounded-lg`}
          >
            <option value="warehouse">Warehouse cities</option>
            <option value="department">Department / camp cities</option>
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className={`block text-xs ${styles.textMuted} mb-1`}>City name</label>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className={`w-full ${styles.input} px-3 py-2 rounded-lg`}
            placeholder="e.g. Dammam"
          />
        </div>
        <button type="submit" className={`${styles.button} px-4 py-2 rounded-lg flex items-center gap-2`}>
          <PlusIcon className="h-5 w-5" />
          Add city
        </button>
      </form>

      {renderTable('Warehouse cities', warehouse)}
      {renderTable('Department / camp cities', department)}
    </div>
  );
}
