'use client';

import { useEffect, useMemo, useState } from 'react';
import MasterDataPageShell from '@/app/components/MasterDataPageShell';
import { useThemeSurfaces } from '@/lib/themePageStyles';
import { fap } from '@/lib/fixedAssetPageDesign';

interface Category {
  _id: string;
  name: string;
}

interface Subcategory {
  _id: string;
  category: string;
  name: string;
}

export default function FixedAssetSubcategoryPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [newSubcategory, setNewSubcategory] = useState({ category: '', name: '' });
  const [editingSubcategory, setEditingSubcategory] = useState<Subcategory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const s = useThemeSurfaces();

  const fetchCategories = async () => {
    const response = await fetch('/api/categories/fixedasset');
    if (!response.ok) throw new Error('Failed to fetch categories');
    const data = await response.json();
    setCategories(Array.isArray(data) ? data : []);
  };

  const fetchSubcategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const query = selectedCategory ? `?category=${encodeURIComponent(selectedCategory)}` : '';
      const response = await fetch(`/api/subcategories/fixedasset${query}`);
      if (!response.ok) throw new Error('Failed to fetch subcategories');
      const data = await response.json();
      setSubcategories(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Failed to load subcategories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        await fetchCategories();
        await fetchSubcategories();
      } catch (err) {
        setError('Failed to load initial data');
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    fetchSubcategories();
  }, [selectedCategory]);

  const groupedCount = useMemo(() => subcategories.length, [subcategories]);

  const handleAddSubcategory = async () => {
    const payload = {
      category: newSubcategory.category.trim(),
      name: newSubcategory.name.trim()
    };
    if (!payload.category || !payload.name) return;
    try {
      setError(null);
      const response = await fetch('/api/subcategories/fixedasset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error('Failed to add subcategory');
      setNewSubcategory({ category: '', name: '' });
      fetchSubcategories();
    } catch (err) {
      setError('Failed to add subcategory');
    }
  };

  const handleUpdateSubcategory = async () => {
    if (!editingSubcategory) return;
    const payload = {
      _id: editingSubcategory._id,
      category: editingSubcategory.category.trim(),
      name: editingSubcategory.name.trim()
    };
    if (!payload.category || !payload.name) return;
    try {
      setError(null);
      const response = await fetch('/api/subcategories/fixedasset', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error('Failed to update subcategory');
      setEditingSubcategory(null);
      fetchSubcategories();
    } catch (err) {
      setError('Failed to update subcategory');
    }
  };

  const handleDeleteSubcategory = async (id: string) => {
    if (!confirm('Delete this subcategory?')) return;
    try {
      setError(null);
      const response = await fetch(`/api/subcategories/fixedasset?id=${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete subcategory');
      fetchSubcategories();
    } catch (err) {
      setError('Failed to delete subcategory');
    }
  };

  return (
    <MasterDataPageShell>
        <h1 className={s.pageTitle}>Fixed Asset Subcategory Management</h1>

        {error && <div className={s.errorBox}>{error}</div>}

        <div className={`${s.card} p-4`}>
          <h2 className={s.sectionTitle}>Add Subcategory</h2>
          <div className="flex flex-wrap gap-3">
            <select
              value={newSubcategory.category}
              onChange={(e) => setNewSubcategory((prev) => ({ ...prev, category: e.target.value }))}
              className={s.input}
            >
              <option value="">Select Category</option>
              {categories.map((category) => (
                <option key={category._id} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={newSubcategory.name}
              onChange={(e) => setNewSubcategory((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Subcategory name"
              className={`min-w-[240px] flex-1 ${s.input}`}
            />
            <button type="button" onClick={handleAddSubcategory} className={fap.btnPrimary}>
              Add
            </button>
          </div>
        </div>

        <div className={`${s.card} p-4`}>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 className={`text-lg font-semibold ${fap.textPrimary}`}>
              View / Edit Subcategories ({groupedCount})
            </h2>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className={`text-sm ${s.input}`}
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category._id} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <p className={`text-sm ${fap.textSecondary}`}>Loading subcategories...</p>
          ) : subcategories.length === 0 ? (
            <p className={`text-sm ${fap.textSecondary}`}>No subcategories found.</p>
          ) : (
            <div className="space-y-2">
              {subcategories.map((subcategory) => (
                <div key={subcategory._id} className={s.listItem}>
                  {editingSubcategory?._id === subcategory._id ? (
                    <div className="mr-3 flex flex-1 flex-wrap gap-2">
                      <select
                        value={editingSubcategory.category}
                        onChange={(e) =>
                          setEditingSubcategory((prev) => (prev ? { ...prev, category: e.target.value } : null))
                        }
                        className={s.input}
                      >
                        {categories.map((category) => (
                          <option key={category._id} value={category.name}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={editingSubcategory.name}
                        onChange={(e) =>
                          setEditingSubcategory((prev) => (prev ? { ...prev, name: e.target.value } : null))
                        }
                        className={`min-w-[200px] flex-1 ${fap.input}`}
                      />
                    </div>
                  ) : (
                    <span className={s.textPrimary}>
                      <span className={s.textMuted}>{subcategory.category}</span> - {subcategory.name}
                    </span>
                  )}

                  <div className="flex gap-2">
                    {editingSubcategory?._id === subcategory._id ? (
                      <>
                        <button
                          type="button"
                          onClick={handleUpdateSubcategory}
                          className="rounded-md bg-emerald-600 px-3 py-1 text-sm hover:bg-emerald-500"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingSubcategory(null)}
                          className={s.btnSecondary}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => setEditingSubcategory(subcategory)}
                          className="rounded-md bg-blue-600 px-3 py-1 text-sm hover:bg-blue-500"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSubcategory(subcategory._id)}
                          className="rounded-md bg-red-600 px-3 py-1 text-sm hover:bg-red-500"
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
