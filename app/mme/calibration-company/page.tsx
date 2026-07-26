'use client';

import { useEffect, useState } from 'react';
import MasterDataPageShell from '@/app/components/MasterDataPageShell';
import { useThemeSurfaces } from '@/lib/themePageStyles';
import { fap } from '@/lib/fixedAssetPageDesign';
import { useAccess } from '@/lib/use-access';

interface CalibrationCompany {
  _id: string;
  code: string;
  name: string;
  address: string;
  city: string;
  country: string;
}

export default function MMECalibrationCompanyPage() {
  const [companies, setCompanies] = useState<CalibrationCompany[]>([]);
  const [newCompany, setNewCompany] = useState({
    code: '',
    name: '',
    address: '',
    city: '',
    country: ''
  });
  const [editingCompany, setEditingCompany] = useState<CalibrationCompany | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const s = useThemeSurfaces();
  const { isAdmin } = useAccess();

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/calibration-companies');
      if (!response.ok) throw new Error('Failed to fetch companies');
      const data = await response.json();
      setCompanies(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Failed to load calibration companies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleAddCompany = async () => {
    const code = newCompany.code.trim();
    const name = newCompany.name.trim();
    const address = newCompany.address.trim();
    const city = newCompany.city.trim();
    const country = newCompany.country.trim();

    if (!code || !name) {
      setError('Vendor code and name are required');
      return;
    }

    try {
      setError(null);
      const response = await fetch('/api/calibration-companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, name, address, city, country })
      });
      
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to add calibration company');
      
      setNewCompany({
        code: '',
        name: '',
        address: '',
        city: '',
        country: ''
      });
      fetchCompanies();
    } catch (err: any) {
      setError(err.message || 'Failed to add calibration company');
    }
  };

  const handleUpdateCompany = async () => {
    if (!editingCompany || !editingCompany.code.trim() || !editingCompany.name.trim()) {
      setError('Vendor code and name are required');
      return;
    }
    try {
      setError(null);
      const response = await fetch('/api/calibration-companies', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          _id: editingCompany._id,
          code: editingCompany.code.trim(),
          name: editingCompany.name.trim(),
          address: editingCompany.address.trim(),
          city: editingCompany.city.trim(),
          country: editingCompany.country.trim()
        })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to update calibration company');
      
      setEditingCompany(null);
      fetchCompanies();
    } catch (err: any) {
      setError(err.message || 'Failed to update calibration company');
    }
  };

  const handleDeleteCompany = async (id: string) => {
    if (!confirm('Delete this calibration company?')) return;
    try {
      setError(null);
      const response = await fetch(`/api/calibration-companies?id=${id}`, {
        method: 'DELETE'
      });
      
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to delete calibration company');
      
      fetchCompanies();
    } catch (err: any) {
      setError(err.message || 'Failed to delete calibration company');
    }
  };

  return (
    <MasterDataPageShell>
      <h1 className={s.pageTitle}>MME Calibration Company Management</h1>

      {error && <div className={s.errorBox}>{error}</div>}

      {isAdmin && (
        <div className={`${s.card} p-6 mb-6`}>
          <h2 className={`${s.sectionTitle} mb-4`}>Add Calibration Company</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium mb-1">Vendor Code *</label>
              <input
                type="text"
                value={newCompany.code}
                onChange={(e) => setNewCompany(prev => ({ ...prev, code: e.target.value }))}
                placeholder="e.g. VEND-001"
                className={`w-full ${s.input}`}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Vendor Name *</label>
              <input
                type="text"
                value={newCompany.name}
                onChange={(e) => setNewCompany(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Acme Calibration Lab"
                className={`w-full ${s.input}`}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium mb-1">Vendor Address</label>
              <input
                type="text"
                value={newCompany.address}
                onChange={(e) => setNewCompany(prev => ({ ...prev, address: e.target.value }))}
                placeholder="e.g. 123 Industry St"
                className={`w-full ${s.input}`}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">City</label>
              <input
                type="text"
                value={newCompany.city}
                onChange={(e) => setNewCompany(prev => ({ ...prev, city: e.target.value }))}
                placeholder="e.g. Riyadh"
                className={`w-full ${s.input}`}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Country</label>
              <input
                type="text"
                value={newCompany.country}
                onChange={(e) => setNewCompany(prev => ({ ...prev, country: e.target.value }))}
                placeholder="e.g. Saudi Arabia"
                className={`w-full ${s.input}`}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button type="button" onClick={handleAddCompany} className={fap.btnPrimary}>
              Add Company
            </button>
          </div>
        </div>
      )}

      <div className={`${s.card} p-6`}>
        <h2 className={`${s.sectionTitle} mb-4`}>Calibration Companies</h2>
        {loading ? (
          <p className={`text-sm ${fap.textSecondary}`}>Loading calibration companies...</p>
        ) : companies.length === 0 ? (
          <p className={`text-sm ${fap.textSecondary}`}>No calibration companies found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-4 py-2 font-semibold">Code</th>
                  <th className="px-4 py-2 font-semibold">Name</th>
                  <th className="px-4 py-2 font-semibold">Address</th>
                  <th className="px-4 py-2 font-semibold">City</th>
                  <th className="px-4 py-2 font-semibold">Country</th>
                  {isAdmin && <th className="px-4 py-2 font-semibold text-right">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {companies.map((company) => (
                  <tr key={company._id} className="border-b border-white/5 hover:bg-white/5">
                    {editingCompany?._id === company._id ? (
                      <>
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            value={editingCompany.code}
                            onChange={(e) => setEditingCompany(prev => (prev ? { ...prev, code: e.target.value } : null))}
                            className={`w-full ${fap.input} text-xs`}
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            value={editingCompany.name}
                            onChange={(e) => setEditingCompany(prev => (prev ? { ...prev, name: e.target.value } : null))}
                            className={`w-full ${fap.input} text-xs`}
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            value={editingCompany.address}
                            onChange={(e) => setEditingCompany(prev => (prev ? { ...prev, address: e.target.value } : null))}
                            className={`w-full ${fap.input} text-xs`}
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            value={editingCompany.city}
                            onChange={(e) => setEditingCompany(prev => (prev ? { ...prev, city: e.target.value } : null))}
                            className={`w-full ${fap.input} text-xs`}
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            value={editingCompany.country}
                            onChange={(e) => setEditingCompany(prev => (prev ? { ...prev, country: e.target.value } : null))}
                            className={`w-full ${fap.input} text-xs`}
                          />
                        </td>
                        <td className="px-4 py-2 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={handleUpdateCompany}
                              className="rounded-md bg-emerald-600 px-3 py-1 text-sm text-white hover:bg-emerald-500"
                            >
                              Save
                            </button>
                            <button type="button" onClick={() => setEditingCompany(null)} className={s.btnSecondary}>
                              Cancel
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-2 font-mono">{company.code}</td>
                        <td className="px-4 py-2 font-semibold">{company.name}</td>
                        <td className="px-4 py-2">{company.address || '—'}</td>
                        <td className="px-4 py-2">{company.city || '—'}</td>
                        <td className="px-4 py-2">{company.country || '—'}</td>
                        {isAdmin && (
                          <td className="px-4 py-2 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setEditingCompany(company)}
                                className="rounded-md bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-500"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteCompany(company._id)}
                                className="rounded-md bg-red-600 px-3 py-1 text-xs text-white hover:bg-red-500"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        )}
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </MasterDataPageShell>
  );
}
