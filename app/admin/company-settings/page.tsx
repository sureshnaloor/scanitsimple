// app/admin/company-settings/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/toaster';
import { useThemeSurfaces } from '@/lib/themePageStyles';
import { fap } from '@/lib/fixedAssetPageDesign';
import ThemeSwitcher from '@/app/components/ThemeSwitcher';
import { BuildingOfficeIcon, PhotoIcon, TrashIcon, CloudArrowUpIcon } from '@heroicons/react/24/outline';

export default function CompanySettingsPage() {
  const s = useThemeSurfaces();
  const { show } = useToast();

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [logo, setLogo] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/company-settings');
        if (res.ok) {
          const data = await res.json();
          setName(data.name || '');
          setAddress(data.address || '');
          setCity(data.city || '');
          setCountry(data.country || '');
          setLogo(data.logo || '');
        }
      } catch (err) {
        show({ title: 'Error', description: 'Failed to load company settings', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    if (!file.type.match(/image\/(png|jpeg|jpg)/)) {
      show({ title: 'Invalid File', description: 'Please upload only PNG or JPEG images', variant: 'destructive' });
      return;
    }

    // Validate size (limit to 1.5MB to prevent huge payload)
    if (file.size > 1.5 * 1024 * 1024) {
      show({ title: 'File Too Large', description: 'Logo size must be less than 1.5MB', variant: 'destructive' });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setLogo(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      show({ title: 'Required', description: 'Company Name is required', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/company-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, address, city, country, logo }),
      });

      if (res.ok) {
        show({ title: 'Saved', description: 'Company settings updated successfully. Reload to apply changes.', variant: 'success' });
      } else {
        const err = await res.json();
        show({ title: 'Error', description: err.error || 'Failed to update company settings', variant: 'destructive' });
      }
    } catch {
      show({ title: 'Error', description: 'Failed to update company settings', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleClearLogo = () => {
    setLogo('');
    show({ title: 'Cleared', description: 'Logo cleared. Default app logo will be used.', variant: 'success' });
  };

  const inputClass =
    'bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white border border-gray-300 dark:border-slate-600 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent';

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-slate-900 p-6">
      <div className="container mx-auto max-w-4xl">
        <div className="flex justify-end mb-4">
          <ThemeSwitcher />
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
          <div className="flex items-center gap-3 border-b border-gray-200 dark:border-slate-750 pb-4 mb-6">
            <BuildingOfficeIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Logo &amp; Company Details
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Manage the company name, address details, and custom branding logo printed on E-Pass documents and PDFs.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading settings...</div>
          ) : (
            <div className="space-y-6">
              {/* Form details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                    Company Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. GCC LABS COMPANY"
                    className={inputClass}
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                    Street Address / Division
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. Industrial Area"
                    className={inputClass}
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Dammam"
                    className={inputClass}
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="e.g. Saudi Arabia"
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Logo section */}
              <div className="border border-gray-200 dark:border-slate-700 rounded-lg p-4 bg-gray-50/50 dark:bg-slate-750/10">
                <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-1.5">
                  <PhotoIcon className="h-5 w-5" /> Company Logo
                </h3>

                <div className="flex flex-col md:flex-row gap-6 items-center">
                  {/* Image preview */}
                  <div className="w-48 h-24 border border-dashed border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 flex items-center justify-center overflow-hidden p-2 relative group">
                    {logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={logo} alt="Company logo preview" className="max-w-full max-h-full object-contain" />
                    ) : (
                      <span className="text-[10px] text-gray-400 text-center">No Logo Uploaded (Using default logo)</span>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 w-full max-w-sm">
                    <label className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md text-xs cursor-pointer inline-flex items-center justify-center gap-1.5 transition-colors">
                      <CloudArrowUpIcon className="h-4 w-4" /> Upload Custom Logo
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/jpg"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                    </label>
                    {logo && (
                      <button
                        onClick={handleClearLogo}
                        className="bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 font-medium py-2 px-4 rounded-md text-xs cursor-pointer inline-flex items-center justify-center gap-1.5 border border-red-200 dark:border-red-900/30 transition-colors"
                      >
                        <TrashIcon className="h-4 w-4" /> Clear Custom Logo
                      </button>
                    )}
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 leading-relaxed">
                      Please upload a PNG or JPEG file with transparent background or landscape format (optimal size: 400x120 pixels). Maximum size 1.5MB.
                    </span>
                  </div>
                </div>
              </div>

              {/* Save actions */}
              <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-slate-750">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-6 rounded-md text-sm transition-colors cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
