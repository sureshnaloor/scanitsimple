'use client';

import { useEffect, useState } from 'react';
import MasterDataPageShell from '@/app/components/MasterDataPageShell';
import { useThemeSurfaces } from '@/lib/themePageStyles';
import { fap } from '@/lib/fixedAssetPageDesign';

interface Category {
  _id: string;
  name: string;
}

export default function FixedAssetCategoryPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const s = useThemeSurfaces();

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/categories/mme');
      if (!response.ok) throw new Error('Failed to fetch categories');
      const data = await response.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAddCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) return;
    try {
      setError(null);
      const response = await fetch('/api/categories/mme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      if (!response.ok) throw new Error('Failed to add category');
      setNewCategoryName('');
      fetchCategories();
    } catch (err) {
      setError('Failed to add category');
    }
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory || !editingCategory.name.trim()) return;
    try {
      setError(null);
      const response = await fetch('/api/categories/mme', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          _id: editingCategory._id,
          name: editingCategory.name.trim()
        })
      });
      if (!response.ok) throw new Error('Failed to update category');
      setEditingCategory(null);
      fetchCategories();
    } catch (err) {
      setError('Failed to update category');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Delete this category?')) return;
    try {
      setError(null);
      const response = await fetch(`/api/categories/mme?id=${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete category');
      fetchCategories();
    } catch (err) {
      setError('Failed to delete category');
    }
  };

  return (
    <MasterDataPageShell>
        <h1 className={s.pageTitle}>MME Category Management</h1>

        {error && <div className={s.errorBox}>{error}</div>}

        <div className={`${s.card} p-4`}>
          <h2 className={s.sectionTitle}>Add Category</h2>
          <div className="flex gap-3">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Category name"
              className={`flex-1 ${s.input}`}
            />
            <button type="button" onClick={handleAddCategory} className={fap.btnPrimary}>
              Add
            </button>
          </div>
        </div>

        <div className={`${s.card} p-4`}>
          <h2 className={s.sectionTitle}>View / Edit Categories</h2>
          {loading ? (
            <p className={`text-sm ${fap.textSecondary}`}>Loading categories...</p>
          ) : categories.length === 0 ? (
            <p className={`text-sm ${fap.textSecondary}`}>No categories found.</p>
          ) : (
            <div className="space-y-2">
              {categories.map((category) => (
                <div key={category._id} className={s.listItem}>
                  {editingCategory?._id === category._id ? (
                    <input
                      type="text"
                      value={editingCategory.name}
                      onChange={(e) =>
                        setEditingCategory((prev) => (prev ? { ...prev, name: e.target.value } : null))
                      }
                      className={`mr-3 flex-1 ${fap.input}`}
                    />
                  ) : (
                    <span className={s.textPrimary}>{category.name}</span>
                  )}

                  <div className="flex gap-2">
                    {editingCategory?._id === category._id ? (
                      <>
                        <button
                          type="button"
                          onClick={handleUpdateCategory}
                          className="rounded-md bg-emerald-600 px-3 py-1 text-sm text-white hover:bg-emerald-500"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingCategory(null)}
                          className={s.btnSecondary}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => setEditingCategory(category)}
                          className="rounded-md bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-500"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(category._id)}
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
