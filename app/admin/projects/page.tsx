'use client';
import { useState, useEffect, useCallback } from 'react';
import { PencilIcon, TrashIcon, PlusIcon, XMarkIcon, CheckIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useAppTheme } from '@/app/contexts/ThemeContext';
import SearchableEmployeeSelect from '@/components/SearchableEmployeeSelect';
import * as XLSX from 'xlsx';

interface Project {
  _id: string;
  projectname: string;
  wbs: string;
  status: string;
  description?: string;
  projectManagerEmpNo?: string;
  projectManagerName?: string;
  department?: string;
  locationCity?: string;
  startDate?: string | Date;
  endDate?: string | Date;
  createdAt?: string;
  updatedAt?: string;
}

interface DepartmentRow {
  _id: string;
  name: string;
}

interface BulkProjectRow {
  wbs: string;
  projectname: string;
  status?: string;
  description?: string;
  projectManagerEmpNo: string;
  department: string;
  locationCity: string;
  startDate?: string;
  endDate?: string;
  sourceRow?: number;
}

function toDateInputValue(d: unknown): string {
  if (d == null || d === '') return '';
  const date =
    typeof d === 'string' ? new Date(d) : d instanceof Date ? d : new Date(String(d));
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

const emptyForm = () => ({
  projectname: '',
  wbs: '',
  status: 'active',
  description: '',
  projectManagerEmpNo: '',
  projectManagerName: '',
  department: '',
  locationCity: '',
  startDate: '',
  endDate: '',
});

export default function ProjectsManagement() {
  const { theme } = useAppTheme();
  const [projects, setProjects] = useState<Project[]>([]);
  const [departments, setDepartments] = useState<DepartmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState(emptyForm);
  const [departmentCityNames, setDepartmentCityNames] = useState<string[]>([]);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkFileName, setBulkFileName] = useState('');
  const [bulkRows, setBulkRows] = useState<BulkProjectRow[]>([]);
  const [validatedRows, setValidatedRows] = useState<BulkProjectRow[]>([]);
  const [validationMessage, setValidationMessage] = useState('');
  const [validationSummary, setValidationSummary] = useState<{
    totalUploaded: number;
    validForInsert: number;
    skippedExisting: Array<{ wbs: string; sourceRow?: number }>;
  } | null>(null);
  const [bulkErrorModalOpen, setBulkErrorModalOpen] = useState(false);
  const [bulkErrorModalTitle, setBulkErrorModalTitle] = useState('');
  const [bulkErrorModalContent, setBulkErrorModalContent] = useState('');

  const getThemeStyles = () => {
    switch (theme) {
      case 'glassmorphic':
        return {
          bg: 'bg-gradient-to-br from-[#1a2332] via-[#2d3748] to-[#1a2332]',
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
          bg: 'bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100',
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
          bg: 'bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a]',
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

  const fetchDepartments = useCallback(async () => {
    try {
      const response = await fetch('/api/departments');
      if (!response.ok) return;
      const json = await response.json();
      if (json.success && Array.isArray(json.data)) {
        setDepartments(json.data);
      }
    } catch {
      /* non-fatal */
    }
  }, []);

  useEffect(() => {
    fetchProjects();
    fetchDepartments();
  }, [fetchDepartments]);

  useEffect(() => {
    fetch('/api/location-cities')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return;
        setDepartmentCityNames((data.department || []).map((x: { name: string }) => x.name));
      })
      .catch(() => {});
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/projects');
      if (!response.ok) throw new Error('Failed to fetch projects');
      const data = await response.json();
      setProjects(data);
    } catch (err) {
      setError('Failed to load projects');
      console.error('Error fetching projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);

      if (!formData.projectname.trim() || !formData.wbs.trim()) {
        setError('Project name and WBS are required');
        return;
      }
      if (!formData.status?.trim()) {
        setError('Status is required');
        return;
      }

      const method = editingProject ? 'PUT' : 'POST';
      const body: Record<string, unknown> = editingProject
        ? {
            _id: editingProject._id,
            projectname: formData.projectname.trim(),
            wbs: formData.wbs.trim(),
            status: formData.status,
            description: formData.description,
            projectManagerEmpNo: formData.projectManagerEmpNo.trim(),
            department: formData.department.trim(),
            locationCity: formData.locationCity.trim(),
            startDate: formData.startDate ? formData.startDate : null,
            endDate: formData.endDate ? formData.endDate : null,
          }
        : {
            projectname: formData.projectname.trim(),
            wbs: formData.wbs.trim(),
            status: formData.status,
            description: formData.description,
            projectManagerEmpNo: formData.projectManagerEmpNo.trim() || undefined,
            department: formData.department.trim() || undefined,
            locationCity: formData.locationCity.trim() || undefined,
            startDate: formData.startDate || undefined,
            endDate: formData.endDate || undefined,
          };

      const response = await fetch('/api/projects', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save project');
      }

      setSuccess(editingProject ? 'Project updated successfully' : 'Project created successfully');
      fetchProjects();
      resetForm();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      setError(null);
      const response = await fetch(`/api/projects?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete project');

      setSuccess('Project deleted successfully');
      fetchProjects();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete project');
    }
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setFormData({
      projectname: project.projectname,
      wbs: project.wbs,
      status: project.status,
      description: project.description || '',
      projectManagerEmpNo: project.projectManagerEmpNo ?? '',
      projectManagerName: project.projectManagerName ?? '',
      department: project.department ?? '',
      locationCity: project.locationCity ?? '',
      startDate: toDateInputValue(project.startDate),
      endDate: toDateInputValue(project.endDate),
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData(emptyForm());
    setEditingProject(null);
    setShowForm(false);
  };

  const filteredProjects = projects.filter((project) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      (project.projectname && project.projectname.toLowerCase().includes(query)) ||
      (project.wbs && project.wbs.toLowerCase().includes(query)) ||
      (project.status && project.status.toLowerCase().includes(query)) ||
      (project.description && project.description.toLowerCase().includes(query)) ||
      (project.projectManagerName && project.projectManagerName.toLowerCase().includes(query)) ||
      (project.projectManagerEmpNo && project.projectManagerEmpNo.toLowerCase().includes(query)) ||
      (project.department && project.department.toLowerCase().includes(query)) ||
      (project.locationCity && project.locationCity.toLowerCase().includes(query))
    );
  });

  const formatDisplayDate = (d: unknown) => {
    const s = toDateInputValue(d);
    if (!s) return '—';
    try {
      return new Date(s + 'T12:00:00').toLocaleDateString();
    } catch {
      return s;
    }
  };

  const openBulkErrorModal = (title: string, content: string) => {
    setBulkErrorModalTitle(title);
    setBulkErrorModalContent(content);
    setBulkErrorModalOpen(true);
  };

  const resetBulkState = () => {
    setBulkFileName('');
    setBulkRows([]);
    setValidatedRows([]);
    setValidationMessage('');
    setValidationSummary(null);
  };

  const normalizeHeader = (header: unknown) => String(header ?? '').trim().toLowerCase();

  const parseBulkFile = async (file: File): Promise<BulkProjectRow[]> => {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<(string | number | null)[]>(worksheet, {
      header: 1,
      defval: '',
      raw: false,
    });

    if (!rows || rows.length < 2) {
      throw new Error('File must include a header row and at least one data row.');
    }

    const headers = rows[0].map(normalizeHeader);
    const requiredHeaders = ['wbs', 'project name', 'status'];
    const missing = requiredHeaders.filter((h) => !headers.includes(h));
    if (missing.length > 0) {
      throw new Error(`Missing required header(s): ${missing.join(', ')}.`);
    }

    const getCell = (row: (string | number | null)[], names: string[]) => {
      const idx = headers.findIndex((h) => names.includes(h));
      if (idx === -1) return '';
      return String(row[idx] ?? '').trim();
    };

    const parsed: BulkProjectRow[] = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const wbs = getCell(row, ['wbs', 'work breakdown structure']);
      const projectname = getCell(row, ['project name', 'projectname']);
      const status = getCell(row, ['status']);
      const description = getCell(row, ['description']);
      const projectManagerEmpNo = getCell(row, [
        'project manager emp no',
        'project manager employee number',
        'manager emp no',
        'pm emp no',
      ]);
      const department = getCell(row, ['department']);
      const locationCity = getCell(row, ['location city', 'city']);
      const startDate = getCell(row, ['start date', 'startdate']);
      const endDate = getCell(row, ['end date', 'enddate']);

      const hasAny = [
        wbs,
        projectname,
        status,
        description,
        projectManagerEmpNo,
        department,
        locationCity,
        startDate,
        endDate,
      ].some((v) => v !== '');
      if (!hasAny) continue;

      parsed.push({
        wbs,
        projectname,
        status,
        description,
        projectManagerEmpNo,
        department,
        locationCity,
        startDate,
        endDate,
        sourceRow: i + 1,
      });
    }

    if (parsed.length === 0) {
      throw new Error('No data rows found in uploaded file.');
    }

    return parsed;
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch('/api/projects/template');
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error || 'Failed to download template.');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'projects_bulk_insert_template.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      openBulkErrorModal(
        'Template download error',
        err instanceof Error ? err.message : 'Failed to download template.'
      );
    }
  };

  const handleBulkFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const rows = await parseBulkFile(file);
      setBulkRows(rows);
      setBulkFileName(file.name);
      setValidatedRows([]);
      setValidationMessage('');
      setValidationSummary(null);
    } catch (err) {
      resetBulkState();
      openBulkErrorModal(
        'File parsing error',
        err instanceof Error ? err.message : 'Failed to parse uploaded file.'
      );
    }
  };

  const handleValidateBulk = async () => {
    if (!bulkRows.length) {
      openBulkErrorModal('Validation error', 'Upload a file first.');
      return;
    }
    try {
      setBulkLoading(true);
      const response = await fetch('/api/projects/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'validate', rows: bulkRows }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        const details = Array.isArray(result.errors) ? result.errors.join('\n') : result.error;
        throw new Error(details || 'Validation failed.');
      }
      const data = result.data;
      setValidatedRows(data.rowsToInsert || []);
      setValidationSummary({
        totalUploaded: data.totalUploaded || 0,
        validForInsert: data.validForInsert || 0,
        skippedExisting: data.skippedExisting || [],
      });
      setValidationMessage(result.message || 'Validation successful.');
    } catch (err) {
      setValidatedRows([]);
      setValidationSummary(null);
      setValidationMessage('');
      openBulkErrorModal('Validation error', err instanceof Error ? err.message : 'Validation failed.');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleInsertBulk = async () => {
    if (!validatedRows.length) {
      openBulkErrorModal('Insert error', 'No validated rows ready to insert.');
      return;
    }
    try {
      setBulkLoading(true);
      const response = await fetch('/api/projects/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'insert', rows: validatedRows }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.details || result.error || 'Insert failed.');
      }
      setSuccess(result.message || 'Projects inserted successfully.');
      setShowBulkModal(false);
      resetBulkState();
      fetchProjects();
      setTimeout(() => setSuccess(null), 4000);
    } catch (err) {
      openBulkErrorModal('Insert error', err instanceof Error ? err.message : 'Insert failed.');
    } finally {
      setBulkLoading(false);
    }
  };

  return (
    <div className={`min-h-screen ${styles.bg} p-4 sm:p-6 lg:p-8`}>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className={`text-2xl font-bold ${styles.text} mb-2`}>Projects Management</h1>
            <p className={styles.textMuted}>Add, edit, and delete projects</p>
          </div>
          {!showForm && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className={`${styles.button} flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-200`}
              >
                <PlusIcon className="h-5 w-5" />
                New Project
              </button>
              <button
                type="button"
                onClick={() => {
                  resetBulkState();
                  setShowBulkModal(true);
                }}
                className={`${styles.buttonSecondary} flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-200`}
              >
                Bulk insert
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 text-red-200 rounded-lg flex items-center justify-between">
            <span>{error}</span>
            <button type="button" onClick={() => setError(null)} className="text-red-200 hover:text-red-100">
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 text-green-200 rounded-lg flex items-center justify-between">
            <span className="flex items-center gap-2">
              <CheckIcon className="h-5 w-5" />
              {success}
            </span>
            <button type="button" onClick={() => setSuccess(null)} className="text-green-200 hover:text-green-100">
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        )}

        {showForm && (
          <div className={`${styles.card} p-6 rounded-lg mb-8`}>
            <h2 className={`${styles.text} text-2xl font-bold mb-6`}>
              {editingProject ? 'Edit Project' : 'Create New Project'}
            </h2>
            <form onSubmit={handleAddOrUpdate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium ${styles.text} mb-2`}>Project Name *</label>
                  <input
                    type="text"
                    value={formData.projectname}
                    onChange={(e) => setFormData({ ...formData, projectname: e.target.value })}
                    className={`w-full ${styles.input} px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500`}
                    placeholder="Enter project name"
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${styles.text} mb-2`}>
                    WBS (Work Breakdown Structure) *
                  </label>
                  <input
                    type="text"
                    value={formData.wbs}
                    onChange={(e) => setFormData({ ...formData, wbs: e.target.value })}
                    className={`w-full ${styles.input} px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500`}
                    placeholder="Enter WBS code"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium ${styles.text} mb-2`}>Status *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className={`w-full ${styles.input} px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500`}
                    required
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium ${styles.text} mb-2`}>Project manager</label>
                <p className={`text-xs ${styles.textMuted} mb-2`}>
                  Optional. If set, must be an active employee.
                </p>
                <SearchableEmployeeSelect
                  key={editingProject?._id ?? 'create'}
                  value={formData.projectManagerEmpNo}
                  initialEmpName={formData.projectManagerName}
                  onChange={(empno, empname) =>
                    setFormData((prev) => ({
                      ...prev,
                      projectManagerEmpNo: empno,
                      projectManagerName: empname,
                    }))
                  }
                  placeholder="Search by employee number or name..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium ${styles.text} mb-2`}>Department</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className={`w-full ${styles.input} px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500`}
                  >
                    <option value="">—</option>
                    {departments.map((d) => (
                      <option key={String(d._id)} value={d.name}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={`block text-sm font-medium ${styles.text} mb-2`}>Location city</label>
                  <select
                    value={formData.locationCity}
                    onChange={(e) => setFormData({ ...formData, locationCity: e.target.value })}
                    className={`w-full ${styles.input} px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500`}
                  >
                    <option value="">—</option>
                    {departmentCityNames.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium ${styles.text} mb-2`}>Start date</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className={`w-full ${styles.input} px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${styles.text} mb-2`}>End date</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className={`w-full ${styles.input} px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium ${styles.text} mb-2`}>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className={`w-full ${styles.input} px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none`}
                  placeholder="Enter project description"
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className={`${styles.button} px-6 py-2.5 rounded-lg font-medium transition-all duration-200`}
                >
                  {editingProject ? 'Update Project' : 'Create Project'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className={`${styles.buttonSecondary} px-6 py-2.5 rounded-lg font-medium transition-all duration-200`}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {!showForm && !loading && projects.length > 0 && (
          <div className={`${styles.card} p-4 rounded-lg mb-6`}>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className={`h-5 w-5 ${styles.textMuted}`} />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full ${styles.input} pl-10 pr-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500`}
                placeholder="Search by name, WBS, manager, department, city, status..."
              />
            </div>
            {searchQuery && (
              <p className={`mt-2 text-sm ${styles.textMuted}`}>
                {filteredProjects.length} {filteredProjects.length === 1 ? 'project' : 'projects'} found
              </p>
            )}
          </div>
        )}

        <div className={`${styles.card} rounded-lg overflow-hidden`}>
          {loading ? (
            <div className={`p-8 text-center ${styles.textMuted}`}>
              <p>Loading projects...</p>
            </div>
          ) : projects.length === 0 ? (
            <div className={`p-8 text-center ${styles.textMuted}`}>
              <p>No projects found. Create your first project!</p>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className={`p-8 text-center ${styles.textMuted}`}>
              <p>No projects match your search query.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className={`${styles.tableRow} border-b`}>
                    <th className={`px-4 py-3 text-left font-semibold ${styles.text}`}>Project</th>
                    <th className={`px-4 py-3 text-left font-semibold ${styles.text}`}>WBS</th>
                    <th className={`px-4 py-3 text-left font-semibold ${styles.text}`}>Manager</th>
                    <th className={`px-4 py-3 text-left font-semibold ${styles.text}`}>Dept</th>
                    <th className={`px-4 py-3 text-left font-semibold ${styles.text}`}>City</th>
                    <th className={`px-4 py-3 text-left font-semibold ${styles.text}`}>Start</th>
                    <th className={`px-4 py-3 text-left font-semibold ${styles.text}`}>End</th>
                    <th className={`px-4 py-3 text-left font-semibold ${styles.text}`}>Status</th>
                    <th className={`px-4 py-3 text-left font-semibold ${styles.text} max-w-[140px]`}>Notes</th>
                    <th className={`px-4 py-3 text-right font-semibold ${styles.text}`}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProjects.map((project) => (
                    <tr key={project._id} className={`${styles.tableRow} border-b transition-colors duration-150`}>
                      <td className={`px-4 py-3 ${styles.text} font-medium`}>{project.projectname}</td>
                      <td className={`px-4 py-3 ${styles.textMuted}`}>{project.wbs}</td>
                      <td className={`px-4 py-3 ${styles.textMuted}`}>
                        {project.projectManagerName || project.projectManagerEmpNo ? (
                          <>
                            {project.projectManagerName || '—'}
                            {project.projectManagerEmpNo ? (
                              <span className="block text-xs opacity-80">{project.projectManagerEmpNo}</span>
                            ) : null}
                          </>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className={`px-4 py-3 ${styles.textMuted}`}>{project.department || '—'}</td>
                      <td className={`px-4 py-3 ${styles.textMuted}`}>{project.locationCity || '—'}</td>
                      <td className={`px-4 py-3 ${styles.textMuted}`}>{formatDisplayDate(project.startDate)}</td>
                      <td className={`px-4 py-3 ${styles.textMuted}`}>{formatDisplayDate(project.endDate)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                            project.status === 'active'
                              ? 'bg-green-500/20 text-green-200'
                              : project.status === 'completed'
                                ? 'bg-blue-500/20 text-blue-200'
                                : project.status === 'inactive'
                                  ? 'bg-gray-500/20 text-gray-200'
                                  : 'bg-yellow-500/20 text-yellow-200'
                          }`}
                        >
                          {project.status}
                        </span>
                      </td>
                      <td className={`px-4 py-3 ${styles.textMuted} max-w-[140px] truncate`} title={project.description}>
                        {project.description || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleEdit(project)}
                            className={`${styles.buttonSecondary} p-2 rounded-lg transition-all duration-200 hover:scale-110`}
                            title="Edit"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(project._id, project.projectname)}
                            className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-200 p-2 rounded-lg transition-all duration-200 hover:scale-110"
                            title="Delete"
                          >
                            <TrashIcon className="h-5 w-5" />
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

        {showBulkModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className={`${styles.card} w-full max-w-4xl rounded-2xl p-6 shadow-xl max-h-[90vh] overflow-y-auto`}>
              <h3 className={`mb-2 text-2xl font-semibold ${styles.text}`}>Bulk insert projects</h3>
              <p className={`mb-4 text-sm ${styles.textMuted}`}>
                Required columns: <strong className={styles.text}>WBS</strong>,{' '}
                <strong className={styles.text}>Project Name</strong>, and{' '}
                <strong className={styles.text}>Status</strong> (active, inactive, completed, pending). All other
                columns are optional. WBS is the unique key—rows whose WBS already exists are skipped. If you fill
                project manager, department, or location city, they are validated against the database (same rules
                as single project create).
              </p>

              <div className="mb-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className={`${styles.buttonSecondary} px-4 py-2 rounded-lg text-sm`}
                >
                  Download template
                </button>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleBulkFileSelect}
                  className={`text-sm ${styles.text}`}
                />
              </div>

              {bulkFileName && (
                <p className={`mb-3 text-sm ${styles.textMuted}`}>
                  Selected file: {bulkFileName} ({bulkRows.length} rows)
                </p>
              )}

              {validationSummary && (
                <div className={`mb-4 rounded-xl border p-4 ${styles.input}`}>
                  <p className={styles.text}>{validationMessage}</p>
                  <p className={`mt-2 text-sm ${styles.textMuted}`}>
                    Total uploaded: {validationSummary.totalUploaded} | New rows: {validationSummary.validForInsert}{' '}
                    | WBS skipped (already exist): {validationSummary.skippedExisting.length}
                  </p>
                  {validationSummary.skippedExisting.length > 0 && (
                    <div className={`mt-2 max-h-24 overflow-auto text-xs ${styles.textMuted}`}>
                      {validationSummary.skippedExisting.map((item, idx) => (
                        <div key={`${item.wbs}-${idx}`}>
                          Skipped WBS: {item.wbs}
                          {item.sourceRow ? ` (row ${item.sourceRow})` : ''}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {validatedRows.length > 0 && (
                <div className={`mb-4 rounded-xl border p-4 ${styles.input}`}>
                  <p className={`mb-3 text-sm font-medium ${styles.text}`}>
                    Ready to insert ({validatedRows.length})
                  </p>
                  <div className="max-h-56 overflow-auto rounded-lg border border-white/10">
                    <table className="min-w-full text-left text-xs">
                      <thead className="sticky top-0 bg-black/20">
                        <tr>
                          <th className={`px-3 py-2 ${styles.text}`}>WBS</th>
                          <th className={`px-3 py-2 ${styles.text}`}>Name</th>
                          <th className={`px-3 py-2 ${styles.text}`}>Status</th>
                          <th className={`px-3 py-2 ${styles.text}`}>PM Emp</th>
                          <th className={`px-3 py-2 ${styles.text}`}>Dept</th>
                          <th className={`px-3 py-2 ${styles.text}`}>City</th>
                        </tr>
                      </thead>
                      <tbody>
                        {validatedRows.map((row, idx) => (
                          <tr key={`${row.wbs}-${idx}`} className="border-t border-white/10">
                            <td className={`px-3 py-2 ${styles.textMuted}`}>{row.wbs}</td>
                            <td className={`px-3 py-2 ${styles.textMuted}`}>{row.projectname}</td>
                            <td className={`px-3 py-2 ${styles.textMuted}`}>{row.status}</td>
                            <td className={`px-3 py-2 ${styles.textMuted}`}>{row.projectManagerEmpNo || '—'}</td>
                            <td className={`px-3 py-2 ${styles.textMuted}`}>{row.department || '—'}</td>
                            <td className={`px-3 py-2 ${styles.textMuted}`}>{row.locationCity || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowBulkModal(false);
                    resetBulkState();
                  }}
                  className={`${styles.buttonSecondary} px-4 py-2 rounded-lg`}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleValidateBulk}
                  disabled={bulkLoading || bulkRows.length === 0}
                  className={`${styles.buttonSecondary} px-4 py-2 rounded-lg disabled:opacity-50`}
                >
                  {bulkLoading ? 'Processing…' : 'Validate'}
                </button>
                <button
                  type="button"
                  onClick={handleInsertBulk}
                  disabled={bulkLoading || validatedRows.length === 0}
                  className={`${styles.button} px-4 py-2 rounded-lg disabled:opacity-50`}
                >
                  {bulkLoading ? 'Processing…' : 'Insert'}
                </button>
              </div>
            </div>
          </div>
        )}

        {bulkErrorModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className={`${styles.card} w-full max-w-2xl rounded-2xl p-6 shadow-xl`}>
              <h3 className={`mb-3 text-xl font-semibold ${styles.text}`}>{bulkErrorModalTitle}</h3>
              <div
                className={`max-h-80 overflow-auto whitespace-pre-wrap rounded-xl border p-4 text-sm ${styles.input}`}
              >
                {bulkErrorModalContent}
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setBulkErrorModalOpen(false)}
                  className={`${styles.buttonSecondary} px-4 py-2 rounded-lg`}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
