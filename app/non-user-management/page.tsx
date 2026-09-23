'use client';

import { useState, useEffect, useRef } from 'react';
import { Pencil, Trash2, UserX, Plus, Upload, Download, Search, Filter } from 'lucide-react';
import { NonUser, NonUserFormData, NonUserCategory } from '@/types/non-user';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ResponsiveTable from '@/components/ui/responsive-table';
import { useAppTheme } from '@/app/contexts/ThemeContext';
import { useAccess } from '@/lib/use-access';
import * as XLSX from 'xlsx';
import ThemedPageShell from '@/app/components/ThemedPageShell';
import { AdminGate } from '@/components/access/AdminGate';

const CATEGORIES: NonUserCategory[] = [
  'Visitor',
  'Rental Employee',
  'Client',
  'Contractor',
  'Other',
];

export default function NonUserManagementPage() {
  return (
    <AdminGate>
      <NonUserManagementContent />
    </AdminGate>
  );
}

function NonUserManagementContent() {
  const { theme } = useAppTheme();
  const isLight = theme === 'light';
  const { isAdmin } = useAccess();

  const [nonUsers, setNonUsers] = useState<NonUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'list' | 'create' | 'bulk'>('list');
  const [editingItem, setEditingItem] = useState<NonUser | null>(null);

  // Form State
  const [formData, setFormData] = useState<NonUserFormData>({
    fullName: '',
    nationalId: '',
    serialNumber: '',
    passportNumber: '',
    address: '',
    phone: '',
    email: '',
    category: 'Visitor',
    active: 'Y',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Bulk Upload State
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkMessage, setBulkMessage] = useState<string | null>(null);
  const [isBulkUploading, setIsBulkUploading] = useState(false);

  useEffect(() => {
    fetchNonUsers();
  }, []);

  const fetchNonUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/non-users?limit=200');
      const data = await res.json();
      if (data.success && data.data?.records) {
        setNonUsers(data.data.records);
      } else {
        setNonUsers([]);
      }
    } catch (err) {
      console.error('Failed to fetch non-users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!formData.fullName.trim()) {
      setFormError('Full name is required');
      return;
    }

    try {
      setIsSubmitting(true);
      const url = editingItem?._id ? `/api/non-users/${editingItem._id}` : '/api/non-users';
      const method = editingItem?._id ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save record');
      }

      // Reset form
      setFormData({
        fullName: '',
        nationalId: '',
        serialNumber: '',
        passportNumber: '',
        address: '',
        phone: '',
        email: '',
        category: 'Visitor',
        active: 'Y',
      });
      setEditingItem(null);
      setActiveTab('list');
      fetchNonUsers();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Error saving record');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (item: NonUser) => {
    setEditingItem(item);
    setFormData({
      fullName: item.fullName || '',
      nationalId: item.nationalId || '',
      serialNumber: item.serialNumber || '',
      passportNumber: item.passportNumber || '',
      address: item.address || '',
      phone: item.phone || '',
      email: item.email || '',
      category: item.category || 'Visitor',
      active: item.active || 'Y',
    });
    setActiveTab('create');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this non-user record?')) return;
    try {
      const res = await fetch(`/api/non-users/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || 'Failed to delete record');
        return;
      }
      fetchNonUsers();
    } catch (err) {
      alert('Error deleting record');
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const res = await fetch('/api/non-users/template');
      if (!res.ok) throw new Error('Failed to download template');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'non_user_bulk_template.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      alert('Failed to download template');
    }
  };

  const handleBulkSubmit = async () => {
    if (!bulkFile) return;
    try {
      setIsBulkUploading(true);
      setBulkMessage(null);
      const fd = new FormData();
      fd.append('file', bulkFile);

      const res = await fetch('/api/non-users/bulk-import', {
        method: 'POST',
        body: fd,
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Bulk upload failed');
      }

      setBulkMessage(data.message);
      setBulkFile(null);
      fetchNonUsers();
    } catch (e) {
      setBulkMessage(e instanceof Error ? e.message : 'Bulk upload failed');
    } finally {
      setIsBulkUploading(false);
    }
  };

  // Filtered List
  const filteredNonUsers = nonUsers.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const q = searchTerm.toLowerCase().trim();
    if (!q) return matchesCategory;

    const matchesQuery =
      item.fullName?.toLowerCase().includes(q) ||
      item.nationalId?.toLowerCase().includes(q) ||
      item.serialNumber?.toLowerCase().includes(q) ||
      item.passportNumber?.toLowerCase().includes(q) ||
      item.phone?.toLowerCase().includes(q) ||
      item.email?.toLowerCase().includes(q);

    return matchesCategory && matchesQuery;
  });

  return (
    <ThemedPageShell
      title="Non-User Master (Non-Employees)"
      description="Manage non-employee users such as visitors, rental employees, clients, and contractors who use assets or equipment."
    >
      <div className="space-y-6">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-700/50 pb-3">
          <div className="flex gap-2">
            <button
              onClick={() => {
                setActiveTab('list');
                setEditingItem(null);
              }}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'list'
                  ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30'
                  : isLight
                  ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Non-Users List ({filteredNonUsers.length})
            </button>
            <button
              onClick={() => {
                setActiveTab('create');
                if (!editingItem) {
                  setFormData({
                    fullName: '',
                    nationalId: '',
                    serialNumber: '',
                    passportNumber: '',
                    address: '',
                    phone: '',
                    email: '',
                    category: 'Visitor',
                    active: 'Y',
                  });
                }
              }}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'create'
                  ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30'
                  : isLight
                  ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Plus className="h-4 w-4" />
              {editingItem ? 'Edit Non-User' : 'Add New Non-User'}
            </button>
            <button
              onClick={() => setActiveTab('bulk')}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'bulk'
                  ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30'
                  : isLight
                  ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Upload className="h-4 w-4" />
              Bulk Import
            </button>
          </div>
        </div>

        {/* Tab Content: LIST */}
        {activeTab === 'list' && (
          <div className="space-y-4">
            {/* Search and Category Filter */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="relative sm:col-span-2">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by full name, National ID, serial number, passport, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-9 pr-4 py-2 text-sm rounded-lg border transition-colors ${
                    isLight
                      ? 'bg-white border-slate-300 text-slate-900 focus:border-cyan-500'
                      : 'bg-slate-900 border-slate-700 text-slate-100 focus:border-cyan-400'
                  }`}
                />
              </div>
              <div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className={`w-full px-3 py-2 text-sm rounded-lg border transition-colors ${
                    isLight
                      ? 'bg-white border-slate-300 text-slate-900'
                      : 'bg-slate-900 border-slate-700 text-slate-100'
                  }`}
                >
                  <option value="all">All Categories</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Table */}
            {loading ? (
              <div className="py-12 text-center text-slate-400 text-sm">Loading Non-User master records...</div>
            ) : filteredNonUsers.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm">
                No non-user records found. Click &quot;Add New Non-User&quot; to create one.
              </div>
            ) : (
              <div
                className={`rounded-xl border overflow-hidden ${
                  isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/80 border-slate-800'
                }`}
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead
                      className={`border-b text-xs font-semibold uppercase tracking-wider ${
                        isLight
                          ? 'bg-slate-50 border-slate-200 text-slate-600'
                          : 'bg-slate-800/60 border-slate-700/80 text-slate-400'
                      }`}
                    >
                      <tr>
                        <th className="px-4 py-3">Full Name</th>
                        <th className="px-4 py-3">Category</th>
                        <th className="px-4 py-3">National ID</th>
                        <th className="px-4 py-3">Company Serial No</th>
                        <th className="px-4 py-3">Passport No</th>
                        <th className="px-4 py-3">Phone</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody
                      className={`divide-y ${
                        isLight ? 'divide-slate-200 text-slate-800' : 'divide-slate-800 text-slate-200'
                      }`}
                    >
                      {filteredNonUsers.map((item) => (
                        <tr
                          key={item._id}
                          className={`transition-colors ${
                            isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-800/40'
                          }`}
                        >
                          <td className="px-4 py-3 font-medium text-cyan-400">{item.fullName}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-block px-2 py-0.5 text-xs font-semibold rounded ${
                                isLight
                                  ? 'bg-cyan-100 text-cyan-800'
                                  : 'bg-cyan-900/40 text-cyan-300 border border-cyan-700/50'
                              }`}
                            >
                              {item.category || 'Visitor'}
                            </span>
                          </td>
                          <td className="px-4 py-3">{item.nationalId || '—'}</td>
                          <td className="px-4 py-3">{item.serialNumber || '—'}</td>
                          <td className="px-4 py-3">{item.passportNumber || '—'}</td>
                          <td className="px-4 py-3">{item.phone || '—'}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-0.5 text-xs rounded-full ${
                                item.active === 'N'
                                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              }`}
                            >
                              {item.active === 'N' ? 'Inactive' : 'Active'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right space-x-2">
                            <button
                              onClick={() => handleEditClick(item)}
                              className="p-1.5 rounded text-cyan-400 hover:bg-cyan-950/40 transition-colors"
                              title="Edit"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => item._id && handleDelete(item._id)}
                              className="p-1.5 rounded text-rose-400 hover:bg-rose-950/40 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab Content: CREATE / EDIT FORM */}
        {activeTab === 'create' && (
          <div
            className={`p-6 rounded-xl border max-w-3xl ${
              isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/80 border-slate-800'
            }`}
          >
            <h3 className="text-lg font-semibold text-cyan-400 mb-4">
              {editingItem ? 'Edit Non-User Record' : 'Create Non-User Record'}
            </h3>

            {formError && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateOrUpdate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="e.g. John Smith"
                    className={`w-full px-3 py-2 text-sm rounded-lg border transition-colors ${
                      isLight
                        ? 'bg-white border-slate-300 text-slate-900'
                        : 'bg-slate-950 border-slate-700 text-slate-100'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as NonUserCategory })}
                    className={`w-full px-3 py-2 text-sm rounded-lg border transition-colors ${
                      isLight
                        ? 'bg-white border-slate-300 text-slate-900'
                        : 'bg-slate-950 border-slate-700 text-slate-100'
                    }`}
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    National ID / Iqama
                  </label>
                  <input
                    type="text"
                    value={formData.nationalId}
                    onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
                    placeholder="e.g. 1098765432"
                    className={`w-full px-3 py-2 text-sm rounded-lg border transition-colors ${
                      isLight
                        ? 'bg-white border-slate-300 text-slate-900'
                        : 'bg-slate-950 border-slate-700 text-slate-100'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Company Serial Number
                  </label>
                  <input
                    type="text"
                    value={formData.serialNumber}
                    onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                    placeholder="e.g. SN-99482"
                    className={`w-full px-3 py-2 text-sm rounded-lg border transition-colors ${
                      isLight
                        ? 'bg-white border-slate-300 text-slate-900'
                        : 'bg-slate-950 border-slate-700 text-slate-100'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Passport Number
                  </label>
                  <input
                    type="text"
                    value={formData.passportNumber}
                    onChange={(e) => setFormData({ ...formData, passportNumber: e.target.value })}
                    placeholder="e.g. N9876543"
                    className={`w-full px-3 py-2 text-sm rounded-lg border transition-colors ${
                      isLight
                        ? 'bg-white border-slate-300 text-slate-900'
                        : 'bg-slate-950 border-slate-700 text-slate-100'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="e.g. +966551234567"
                    className={`w-full px-3 py-2 text-sm rounded-lg border transition-colors ${
                      isLight
                        ? 'bg-white border-slate-300 text-slate-900'
                        : 'bg-slate-950 border-slate-700 text-slate-100'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="e.g. user@external-firm.com"
                    className={`w-full px-3 py-2 text-sm rounded-lg border transition-colors ${
                      isLight
                        ? 'bg-white border-slate-300 text-slate-900'
                        : 'bg-slate-950 border-slate-700 text-slate-100'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.value as 'Y' | 'N' })}
                    className={`w-full px-3 py-2 text-sm rounded-lg border transition-colors ${
                      isLight
                        ? 'bg-white border-slate-300 text-slate-900'
                        : 'bg-slate-950 border-slate-700 text-slate-100'
                    }`}
                  >
                    <option value="Y">Active</option>
                    <option value="N">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Address & Details
                </label>
                <textarea
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Full physical address, firm name, or notes..."
                  className={`w-full px-3 py-2 text-sm rounded-lg border transition-colors ${
                    isLight
                      ? 'bg-white border-slate-300 text-slate-900'
                      : 'bg-slate-950 border-slate-700 text-slate-100'
                  }`}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('list');
                    setEditingItem(null);
                  }}
                  className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                    isLight
                      ? 'border-slate-300 text-slate-700 hover:bg-slate-100'
                      : 'border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-sm font-medium rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-600/30 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingItem ? 'Update Non-User' : 'Save Non-User'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab Content: BULK UPLOAD */}
        {activeTab === 'bulk' && (
          <div
            className={`p-6 rounded-xl border max-w-2xl ${
              isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/80 border-slate-800'
            }`}
          >
            <h3 className="text-lg font-semibold text-cyan-400 mb-2">Bulk Import Non-Users</h3>
            <p className="text-sm text-slate-400 mb-6">
              Download the Excel template, fill in the non-user details, and upload the file below.
            </p>

            <div className="space-y-4">
              <button
                onClick={handleDownloadTemplate}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-cyan-500/40 text-cyan-400 hover:bg-cyan-950/30 transition-colors"
              >
                <Download className="h-4 w-4" />
                Download Excel Template
              </button>

              <div className="border-t border-slate-800 pt-4">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Select Filled Excel File (.xlsx, .xls)
                </label>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => setBulkFile(e.target.files?.[0] || null)}
                  className={`block w-full text-sm rounded-lg border cursor-pointer p-2 ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900'
                      : 'bg-slate-950 border-slate-700 text-slate-200'
                  }`}
                />
              </div>

              {bulkMessage && (
                <div
                  className={`p-3 rounded-lg text-sm ${
                    bulkMessage.includes('completed')
                      ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                      : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
                  }`}
                >
                  {bulkMessage}
                </div>
              )}

              <div className="flex justify-end pt-4">
                <button
                  onClick={handleBulkSubmit}
                  disabled={!bulkFile || isBulkUploading}
                  className="px-5 py-2 text-sm font-medium rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-600/30 transition-all disabled:opacity-50"
                >
                  {isBulkUploading ? 'Uploading...' : 'Start Import'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ThemedPageShell>
  );
}
