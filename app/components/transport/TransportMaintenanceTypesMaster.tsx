'use client';

import { useEffect, useState } from 'react';

import MasterDataPageShell from '@/app/components/MasterDataPageShell';
import { useThemeSurfaces } from '@/lib/themePageStyles';
import { fap } from '@/lib/fixedAssetPageDesign';

interface Row {
  _id: string;
  name: string;
}

type Props = {
  apiPath: '/api/transportassets/maintenance-types/preventive' | '/api/transportassets/maintenance-types/breakdown';
  title: string;
  description: string;
  placeholder: string;
};

export default function TransportMaintenanceTypesMaster({
  apiPath,
  title,
  description,
  placeholder,
}: Props) {
  const s = useThemeSurfaces();

  const [rows, setRows] = useState<Row[]>([]);
  const [newName, setNewName] = useState('');
  const [editing, setEditing] = useState<Row | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(apiPath);
        if (!res.ok) throw new Error('Failed to load');
        const data = await res.json();
        setRows(Array.isArray(data) ? data : []);
      } catch {
        setError('Failed to load types');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [apiPath]);

  const reload = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(apiPath);
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setRows(Array.isArray(data) ? data : []);
    } catch {
      setError('Failed to load types');
    } finally {
      setLoading(false);
    }
  };

  const add = async () => {
    const name = newName.trim();
    if (!name) return;
    try {
      setError(null);
      const res = await fetch(apiPath, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error || 'Failed to add');
      }
      setNewName('');
      reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add');
    }
  };

  const saveEdit = async () => {
    if (!editing?.name.trim()) return;
    try {
      setError(null);
      const res = await fetch(apiPath, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ _id: editing._id, name: editing.name.trim() }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error || 'Failed to update');
      }
      setEditing(null);
      reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update');
    }
  };

  const del = async (id: string) => {
    if (!confirm('Delete this maintenance type?')) return;
    try {
      setError(null);
      const res = await fetch(`${apiPath}?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      reload();
    } catch {
      setError('Failed to delete');
    }
  };

  const linkEdit = s.isLight ? 'text-sm text-cyan-700 hover:underline' : 'text-sm text-teal-400 hover:underline';
  const linkDelete = s.isLight ? 'text-sm text-red-600 hover:underline' : 'text-sm text-red-400 hover:underline';
  const linkCancel = s.isLight ? 'text-sm text-slate-500 hover:underline' : 'text-sm text-white/70 hover:underline';

  return (
    <MasterDataPageShell>
      <div>
        <h1 className={s.pageTitle}>{title}</h1>
        <p className={`mt-1 ${s.heroSubtitle}`}>{description}</p>
      </div>

      {error && <div className={s.errorBox}>{error}</div>}

      <div className={`${s.card} p-4`}>
        <h2 className={s.sectionTitle}>Add type</h2>
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={placeholder}
            className={`min-w-[200px] flex-1 ${s.input}`}
          />
          <button type="button" onClick={add} className={fap.btnPrimary}>
            Add
          </button>
        </div>
      </div>

      <div className={`${s.card} p-4`}>
        <h2 className={s.sectionTitle}>Types</h2>
        {loading ? (
          <p className={s.textMuted}>Loading…</p>
        ) : (
          <ul className="space-y-2">
            {rows.map((r) => (
              <li key={r._id} className={s.listItem}>
                {editing?._id === r._id ? (
                  <>
                    <input
                      className={`flex-1 ${s.input}`}
                      value={editing.name}
                      onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                    />
                    <button type="button" onClick={saveEdit} className={linkEdit}>
                      Save
                    </button>
                    <button type="button" onClick={() => setEditing(null)} className={linkCancel}>
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <span className={s.textPrimary}>{r.name}</span>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setEditing({ ...r })} className={linkEdit}>
                        Edit
                      </button>
                      <button type="button" onClick={() => del(r._id)} className={linkDelete}>
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </MasterDataPageShell>
  );
}
