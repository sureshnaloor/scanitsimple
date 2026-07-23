'use client';

import { useEffect, useState } from 'react';
import MasterDataPageShell from '@/app/components/MasterDataPageShell';
import { useThemeSurfaces } from '@/lib/themePageStyles';
import { fap } from '@/lib/fixedAssetPageDesign';

interface Manufacturer {
  _id: string;
  name: string;
}

export default function FixedAssetManufacturerPage() {
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [newManufacturerName, setNewManufacturerName] = useState('');
  const [editingManufacturer, setEditingManufacturer] = useState<Manufacturer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const s = useThemeSurfaces();

  const fetchManufacturers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/manufacturers/mme');
      if (!response.ok) throw new Error('Failed to fetch manufacturers');
      const data = await response.json();
      setManufacturers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Failed to load manufacturers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchManufacturers();
  }, []);

  const handleAddManufacturer = async () => {
    const name = newManufacturerName.trim();
    if (!name) return;
    try {
      setError(null);
      const response = await fetch('/api/manufacturers/mme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      if (!response.ok) throw new Error('Failed to add manufacturer');
      setNewManufacturerName('');
      fetchManufacturers();
    } catch (err) {
      setError('Failed to add manufacturer');
    }
  };

  const handleUpdateManufacturer = async () => {
    if (!editingManufacturer || !editingManufacturer.name.trim()) return;
    try {
      setError(null);
      const response = await fetch('/api/manufacturers/mme', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          _id: editingManufacturer._id,
          name: editingManufacturer.name.trim()
        })
      });
      if (!response.ok) throw new Error('Failed to update manufacturer');
      setEditingManufacturer(null);
      fetchManufacturers();
    } catch (err) {
      setError('Failed to update manufacturer');
    }
  };

  const handleDeleteManufacturer = async (id: string) => {
    if (!confirm('Delete this manufacturer?')) return;
    try {
      setError(null);
      const response = await fetch(`/api/manufacturers/mme?id=${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete manufacturer');
      fetchManufacturers();
    } catch (err) {
      setError('Failed to delete manufacturer');
    }
  };

  return (
    <MasterDataPageShell>
        <h1 className={s.pageTitle}>MME Manufacturer Management</h1>

        {error && <div className={s.errorBox}>{error}</div>}

        <div className={`${s.card} p-4`}>
          <h2 className={s.sectionTitle}>Add Manufacturer</h2>
          <div className="flex gap-3">
            <input
              type="text"
              value={newManufacturerName}
              onChange={(e) => setNewManufacturerName(e.target.value)}
              placeholder="Manufacturer name"
              className={`flex-1 ${s.input}`}
            />
            <button type="button" onClick={handleAddManufacturer} className={fap.btnPrimary}>
              Add
            </button>
          </div>
        </div>

        <div className={`${s.card} p-4`}>
          <h2 className={s.sectionTitle}>View / Edit Manufacturers</h2>
          {loading ? (
            <p className={`text-sm ${fap.textSecondary}`}>Loading manufacturers...</p>
          ) : manufacturers.length === 0 ? (
            <p className={`text-sm ${fap.textSecondary}`}>No manufacturers found.</p>
          ) : (
            <div className="space-y-2">
              {manufacturers.map((manufacturer) => (
                <div key={manufacturer._id} className={s.listItem}>
                  {editingManufacturer?._id === manufacturer._id ? (
                    <input
                      type="text"
                      value={editingManufacturer.name}
                      onChange={(e) =>
                        setEditingManufacturer((prev) => (prev ? { ...prev, name: e.target.value } : null))
                      }
                      className={`mr-3 flex-1 ${fap.input}`}
                    />
                  ) : (
                    <span className={s.textPrimary}>{manufacturer.name}</span>
                  )}

                  <div className="flex gap-2">
                    {editingManufacturer?._id === manufacturer._id ? (
                      <>
                        <button
                          type="button"
                          onClick={handleUpdateManufacturer}
                          className="rounded-md bg-emerald-600 px-3 py-1 text-sm text-white hover:bg-emerald-500"
                        >
                          Save
                        </button>
                        <button type="button" onClick={() => setEditingManufacturer(null)} className={s.btnSecondary}>
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => setEditingManufacturer(manufacturer)}
                          className="rounded-md bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-500"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteManufacturer(manufacturer._id)}
                          className="rounded-md bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-500"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
    </MasterDataPageShell>
  );
}
