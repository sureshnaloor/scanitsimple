'use client';

import { useState, useEffect, useRef } from 'react';
import { Employee } from '@/types/ppe';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ResponsiveTable from '@/components/ui/responsive-table';
import PPEIssuesByEmployee from '@/components/PPEIssuesByEmployee';
import { useAppTheme } from '@/app/contexts/ThemeContext';
import * as XLSX from 'xlsx';

interface EmployeeFormData {
  empno: string;
  empname: string;
  department: string;
  designation: string;
  email: string;
  phone: string;
  active: 'Y' | 'N';
}

interface BulkEmployeeRow {
  empno: string;
  empname: string;
  department?: string;
  designation?: string;
  email?: string;
  phone?: string;
  active?: 'Y' | 'N';
  sourceRow?: number;
}

interface MasterLookupItem {
  _id: string;
  name: string;
}

export default function EmployeeManagementPage() {
  const { theme } = useAppTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
  }>>([]);
  const animationFrameRef = useRef<number>();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [empNumberSearch, setEmpNumberSearch] = useState('');
  const [activeTab, setActiveTab] = useState('list');
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState<EmployeeFormData>({
    empno: '',
    empname: '',
    department: '',
    designation: '',
    email: '',
    phone: '',
    active: 'Y'
  });
  const [showBulkInsertModal, setShowBulkInsertModal] = useState(false);
  const [bulkInsertLoading, setBulkInsertLoading] = useState(false);
  const [bulkFileName, setBulkFileName] = useState('');
  const [bulkRows, setBulkRows] = useState<BulkEmployeeRow[]>([]);
  const [validatedRows, setValidatedRows] = useState<BulkEmployeeRow[]>([]);
  const [validationMessage, setValidationMessage] = useState('');
  const [validationSummary, setValidationSummary] = useState<{
    totalUploaded: number;
    validForInsert: number;
    skippedExisting: Array<{ empno: string; sourceRow?: number }>;
  } | null>(null);
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [errorModalTitle, setErrorModalTitle] = useState('Bulk Insert Error');
  const [errorModalContent, setErrorModalContent] = useState('');
  const [departments, setDepartments] = useState<MasterLookupItem[]>([]);
  const [designations, setDesignations] = useState<MasterLookupItem[]>([]);
  const [departmentFormName, setDepartmentFormName] = useState('');
  const [designationFormName, setDesignationFormName] = useState('');
  const [editingDepartmentId, setEditingDepartmentId] = useState<string | null>(null);
  const [editingDesignationId, setEditingDesignationId] = useState<string | null>(null);

  // Fetch employees
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      
      // Build query parameters
      const params = new URLSearchParams();
      
      // If employee number is provided, search only by employee number
      if (empNumberSearch.trim()) {
        params.append('search', empNumberSearch.trim());
        params.append('empno_only', 'true'); // Custom parameter to indicate employee number only search
      } else if (searchTerm.trim()) {
        // If general search term is provided, use it
        params.append('search', searchTerm.trim());
      }
      
      const response = await fetch(`/api/employees?${params.toString()}`);
      const result = await response.json();
      
      if (result.success) {
        setEmployees(result.data.records);
      } else {
        console.error('Failed to fetch employees:', result.error);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [searchTerm, empNumberSearch]);

  const fetchMasterData = async () => {
    try {
      const [departmentResponse, designationResponse] = await Promise.all([
        fetch('/api/departments'),
        fetch('/api/designations')
      ]);
      const [departmentResult, designationResult] = await Promise.all([
        departmentResponse.json(),
        designationResponse.json()
      ]);

      if (departmentResult.success) {
        setDepartments(departmentResult.data || []);
      }
      if (designationResult.success) {
        setDesignations(designationResult.data || []);
      }
    } catch (error) {
      console.error('Error fetching department/designation master data:', error);
    }
  };

  useEffect(() => {
    fetchMasterData();
  }, []);

  // Theme-based styling function
  const getBackgroundStyles = () => {
    switch (theme) {
      case 'glassmorphic':
        return {
          container: 'relative min-h-screen overflow-hidden bg-gradient-to-br from-[#1a2332] via-[#2d3748] to-[#1a2332]',
          headerBg: 'bg-white/10 backdrop-blur-lg border border-white/20',
          headerTitle: 'bg-gradient-to-r from-white to-teal-400 bg-clip-text text-transparent',
          headerSubtitle: 'text-white/80',
          tabsBg: 'bg-white/10 backdrop-blur-lg border border-white/20',
          tabsTrigger: 'data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70',
          cardBg: 'bg-white/10 backdrop-blur-lg border border-white/20',
          cardTitle: 'text-white',
          inputBg: 'bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-white/70 focus:ring-teal-400',
          inputDisabled: 'disabled:opacity-50',
          buttonPrimary: 'bg-teal-500 hover:bg-teal-600 text-white',
          buttonSecondary: 'bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20',
          buttonDestructive: 'bg-red-500 hover:bg-red-600 text-white',
          selectBg: 'bg-white/10 backdrop-blur-md border border-white/20 text-white',
          selectOption: 'bg-[#1a2332]',
          spinnerColor: 'border-teal-400',
          loadingText: 'text-white',
          labelText: 'text-white',
          searchInfo: 'text-white/80'
        };
      case 'light':
        return {
          container: 'relative min-h-screen overflow-hidden bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100',
          headerBg: 'bg-white border-2 border-blue-200 shadow-lg',
          headerTitle: 'bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent',
          headerSubtitle: 'text-gray-700',
          tabsBg: 'bg-white border-2 border-blue-200 shadow-md',
          tabsTrigger: 'data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700 text-gray-600',
          cardBg: 'bg-white border-2 border-blue-200 shadow-md',
          cardTitle: 'text-gray-900',
          inputBg: 'bg-white border-2 border-blue-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500',
          inputDisabled: 'disabled:opacity-50',
          buttonPrimary: 'bg-blue-600 hover:bg-blue-700 text-white border-2 border-blue-500',
          buttonSecondary: 'bg-gray-100 border-2 border-gray-300 text-gray-700 hover:bg-gray-200',
          buttonDestructive: 'bg-red-600 hover:bg-red-700 text-white border-2 border-red-500',
          selectBg: 'bg-white border-2 border-blue-300 text-gray-900',
          selectOption: 'bg-white',
          spinnerColor: 'border-blue-500',
          loadingText: 'text-gray-700',
          labelText: 'text-gray-900',
          searchInfo: 'text-gray-600'
        };
      default: // dark theme
        return {
          container: 'relative min-h-screen overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a]',
          headerBg: 'bg-slate-800/90 border border-slate-700 shadow-xl',
          headerTitle: 'bg-gradient-to-r from-slate-100 to-teal-400 bg-clip-text text-transparent',
          headerSubtitle: 'text-slate-300',
          tabsBg: 'bg-slate-800/90 border border-slate-700 shadow-xl',
          tabsTrigger: 'data-[state=active]:bg-slate-700 data-[state=active]:text-slate-100 text-slate-400',
          cardBg: 'bg-slate-800/90 border border-slate-700 shadow-xl',
          cardTitle: 'text-slate-100',
          inputBg: 'bg-slate-800/90 border border-slate-600 text-slate-100 placeholder-slate-400 focus:ring-teal-400 focus:border-teal-400',
          inputDisabled: 'disabled:opacity-50',
          buttonPrimary: 'bg-teal-600 hover:bg-teal-700 text-white border border-teal-500',
          buttonSecondary: 'bg-slate-700/50 border border-slate-600 text-slate-200 hover:bg-slate-600',
          buttonDestructive: 'bg-red-600 hover:bg-red-700 text-white border border-red-500',
          selectBg: 'bg-slate-800/90 border border-slate-600 text-slate-100',
          selectOption: 'bg-slate-800',
          spinnerColor: 'border-teal-400',
          loadingText: 'text-slate-300',
          labelText: 'text-slate-200',
          searchInfo: 'text-slate-400'
        };
    }
  };

  const backgroundStyles = getBackgroundStyles();

  // Animated particle background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();

    particlesRef.current = [];
    for (let i = 0; i < 50; i++) {
      particlesRef.current.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: Math.random() * 3 + 1
      });
    }

    const animate = () => {
      if (!ctx || !canvas) return;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach((particle, i) => {
        particle.x += particle.vx;
        particle.y += particle.vy;

        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;

        // Draw particle - theme-based colors
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        if (theme === 'light') {
          ctx.fillStyle = 'rgba(59, 130, 246, 0.4)'; // blue for light theme
        } else if (theme === 'glassmorphic') {
          ctx.fillStyle = 'rgba(45, 212, 191, 0.6)'; // teal for glassmorphic
        } else {
          ctx.fillStyle = 'rgba(45, 212, 191, 0.6)'; // teal for dark theme
        }
        ctx.fill();

        particlesRef.current.forEach((otherParticle, j) => {
          if (i !== j) {
            const dx = particle.x - otherParticle.x;
            const dy = particle.y - otherParticle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 100) {
              ctx.beginPath();
              ctx.moveTo(particle.x, particle.y);
              ctx.lineTo(otherParticle.x, otherParticle.y);
              if (theme === 'light') {
                ctx.strokeStyle = `rgba(59, 130, 246, ${0.25 * (1 - distance / 100)})`;
              } else {
                ctx.strokeStyle = `rgba(45, 212, 191, ${0.3 * (1 - distance / 100)})`;
              }
              ctx.lineWidth = 1;
              ctx.stroke();
            }
          }
        });
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      resizeCanvas();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [theme]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingEmployee ? `/api/employees/${editingEmployee.empno}` : '/api/employees';
      const method = editingEmployee ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setActiveTab('list');
        setEditingEmployee(null);
        setFormData({
          empno: '',
          empname: '',
          department: '',
          designation: '',
          email: '',
          phone: '',
          active: 'Y'
        });
        fetchEmployees();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error saving employee:', error);
      alert('Failed to save employee');
    }
  };

  // Handle edit
  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormData({
      empno: employee.empno,
      empname: employee.empname,
      department: employee.department || '',
      designation: employee.designation || '',
      email: employee.email || '',
      phone: employee.phone || '',
      active: employee.active || 'Y'
    });
    setActiveTab('form');
  };

  // Handle employee selection for PPE records
  const handleEmployeeSelect = (employee: Employee) => {
    setSelectedEmployee(employee);
    setActiveTab('ppe-records');
  };

  // Handle deactivate
  const handleDeactivate = async (empno: string) => {
    if (!confirm('Are you sure you want to deactivate this employee?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/employees/${empno}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      
      if (result.success) {
        fetchEmployees();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error deactivating employee:', error);
      alert('Failed to deactivate employee');
    }
  };

  const openBulkErrorModal = (title: string, content: string) => {
    setErrorModalTitle(title);
    setErrorModalContent(content);
    setErrorModalOpen(true);
  };

  const resetBulkInsertState = () => {
    setBulkFileName('');
    setBulkRows([]);
    setValidatedRows([]);
    setValidationMessage('');
    setValidationSummary(null);
  };

  const handleDepartmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = departmentFormName.trim();
    if (!name) {
      alert('Department name is required');
      return;
    }

    try {
      const method = editingDepartmentId ? 'PUT' : 'POST';
      const response = await fetch('/api/departments', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingDepartmentId ? { _id: editingDepartmentId, name } : { name })
      });
      const result = await response.json();
      if (!result.success) {
        alert(`Error: ${result.error}`);
        return;
      }

      setDepartmentFormName('');
      setEditingDepartmentId(null);
      fetchMasterData();
    } catch (error) {
      console.error('Error saving department:', error);
      alert('Failed to save department');
    }
  };

  const handleDesignationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = designationFormName.trim();
    if (!name) {
      alert('Designation name is required');
      return;
    }

    try {
      const method = editingDesignationId ? 'PUT' : 'POST';
      const response = await fetch('/api/designations', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingDesignationId ? { _id: editingDesignationId, name } : { name })
      });
      const result = await response.json();
      if (!result.success) {
        alert(`Error: ${result.error}`);
        return;
      }

      setDesignationFormName('');
      setEditingDesignationId(null);
      fetchMasterData();
    } catch (error) {
      console.error('Error saving designation:', error);
      alert('Failed to save designation');
    }
  };

  const handleDeleteDepartment = async (id: string) => {
    if (!confirm('Are you sure you want to delete this department?')) return;
    try {
      const response = await fetch(`/api/departments?id=${id}`, { method: 'DELETE' });
      const result = await response.json();
      if (!result.success) {
        alert(`Error: ${result.error}`);
        return;
      }
      if (editingDepartmentId === id) {
        setEditingDepartmentId(null);
        setDepartmentFormName('');
      }
      fetchMasterData();
    } catch (error) {
      console.error('Error deleting department:', error);
      alert('Failed to delete department');
    }
  };

  const handleDeleteDesignation = async (id: string) => {
    if (!confirm('Are you sure you want to delete this designation?')) return;
    try {
      const response = await fetch(`/api/designations?id=${id}`, { method: 'DELETE' });
      const result = await response.json();
      if (!result.success) {
        alert(`Error: ${result.error}`);
        return;
      }
      if (editingDesignationId === id) {
        setEditingDesignationId(null);
        setDesignationFormName('');
      }
      fetchMasterData();
    } catch (error) {
      console.error('Error deleting designation:', error);
      alert('Failed to delete designation');
    }
  };

  const normalizeHeader = (header: unknown) => String(header ?? '').trim().toLowerCase();

  const parseBulkFile = async (file: File): Promise<BulkEmployeeRow[]> => {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<(string | number | null)[]>(worksheet, {
      header: 1,
      defval: '',
      raw: false
    });

    if (!rows || rows.length < 2) {
      throw new Error('File must include a header row and at least one data row.');
    }

    const headers = rows[0].map(normalizeHeader);
    const requiredHeaders = ['employee number', 'employee name'];
    const missingHeaders = requiredHeaders.filter((required) => !headers.includes(required));
    if (missingHeaders.length > 0) {
      throw new Error(`Missing required header(s): ${missingHeaders.join(', ')}.`);
    }

    const getCell = (row: (string | number | null)[], names: string[]) => {
      const index = headers.findIndex((header) => names.includes(header));
      if (index === -1) {
        return '';
      }
      return String(row[index] ?? '').trim();
    };

    const parsedRows: BulkEmployeeRow[] = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const empno = getCell(row, ['employee number', 'employee no', 'empno']);
      const empname = getCell(row, ['employee name', 'empname']);
      const department = getCell(row, ['department']);
      const designation = getCell(row, ['designation']);
      const email = getCell(row, ['email']);
      const phone = getCell(row, ['phone', 'mobile']);
      const activeInput = getCell(row, ['active', 'status']).toUpperCase();
      const active: 'Y' | 'N' = activeInput === 'N' ? 'N' : 'Y';

      const hasAnyData = [empno, empname, department, designation, email, phone, activeInput].some(
        (value) => value !== ''
      );
      if (!hasAnyData) {
        continue;
      }

      parsedRows.push({
        empno,
        empname,
        department,
        designation,
        email,
        phone,
        active,
        sourceRow: i + 1
      });
    }

    if (parsedRows.length === 0) {
      throw new Error('No data rows found in uploaded file.');
    }

    return parsedRows;
  };

  const handleDownloadEmployeeTemplate = async () => {
    try {
      const response = await fetch('/api/employees/template');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to download template.');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'employee_bulk_insert_template.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      openBulkErrorModal('Template Download Error', error.message || 'Failed to download template.');
    }
  };

  const handleBulkFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const rows = await parseBulkFile(file);
      setBulkRows(rows);
      setBulkFileName(file.name);
      setValidatedRows([]);
      setValidationMessage('');
      setValidationSummary(null);
    } catch (error: any) {
      setBulkRows([]);
      setValidatedRows([]);
      setValidationMessage('');
      setValidationSummary(null);
      openBulkErrorModal('File Parsing Error', error.message || 'Failed to read uploaded file.');
    }
  };

  const handleValidateBulkInsert = async () => {
    if (!bulkRows.length) {
      openBulkErrorModal('Validation Error', 'Please upload a file with employee data first.');
      return;
    }

    try {
      setBulkInsertLoading(true);
      const response = await fetch('/api/employees/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'validate',
          rows: bulkRows
        })
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        const details = Array.isArray(result.errors) ? result.errors.join('\n') : result.error;
        throw new Error(details || 'Bulk validation failed.');
      }

      const data = result.data;
      setValidatedRows(data.rowsToInsert || []);
      setValidationSummary({
        totalUploaded: data.totalUploaded || 0,
        validForInsert: data.validForInsert || 0,
        skippedExisting: data.skippedExisting || []
      });
      setValidationMessage(result.message || 'Validation successful.');
    } catch (error: any) {
      setValidatedRows([]);
      setValidationSummary(null);
      setValidationMessage('');
      openBulkErrorModal('Validation Error', error.message || 'Bulk validation failed.');
    } finally {
      setBulkInsertLoading(false);
    }
  };

  const handleBulkInsert = async () => {
    if (!validatedRows.length) {
      openBulkErrorModal('Insert Error', 'No validated rows available to insert.');
      return;
    }

    try {
      setBulkInsertLoading(true);
      const response = await fetch('/api/employees/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'insert',
          rows: validatedRows
        })
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        const details = result.details || result.error || 'Bulk insert failed.';
        throw new Error(details);
      }

      alert(result.message || 'Employees inserted successfully.');
      setShowBulkInsertModal(false);
      resetBulkInsertState();
      fetchEmployees();
    } catch (error: any) {
      openBulkErrorModal('Insert Error', error.message || 'Bulk insert failed.');
    } finally {
      setBulkInsertLoading(false);
    }
  };

  // Table columns
  const columns = [
    { key: 'empno', label: 'Employee Number' },
    { key: 'empname', label: 'Employee Name' },
    { key: 'department', label: 'Department' },
    { key: 'designation', label: 'Designation' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'active', label: 'Status' },
    { key: 'actions', label: 'Actions' }
  ];

  const tableData = employees.map(emp => ({
    ...emp,
    active: emp.active === 'N' ? 'Inactive' : 'Active',
    actions: (
      <div className="flex gap-2">
        <Button 
          size="sm" 
          onClick={() => handleEdit(emp)}
          className={backgroundStyles.buttonPrimary}
        >
          Edit
        </Button>
        <Button 
          size="sm" 
          variant="outline" 
          onClick={() => handleEmployeeSelect(emp)}
          className={backgroundStyles.buttonSecondary}
        >
          View PPE Records
        </Button>
        {emp.active !== 'N' && (
          <Button 
            size="sm" 
            variant="destructive" 
            onClick={() => handleDeactivate(emp.empno)}
            className={backgroundStyles.buttonDestructive}
          >
            Deactivate
          </Button>
        )}
      </div>
    )
  }));

  return (
    <div className={backgroundStyles.container}>
      {/* Animated background canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 z-10" />
      
      {/* Main content */}
      <div className="relative z-20 flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6 min-h-screen">
        {/* Header Section */}
        <div className={`${backgroundStyles.headerBg} rounded-2xl p-6 shadow-xl`}>
          <h1 className={`text-2xl font-bold ${backgroundStyles.headerTitle} mb-2`}>
            Employee Management
          </h1>
          <p className={`${backgroundStyles.headerSubtitle} text-lg`}>Manage employee information and status</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className={`${backgroundStyles.tabsBg} rounded-xl p-1`}>
            <TabsTrigger 
              value="list"
              className={backgroundStyles.tabsTrigger}
            >
              Employee List
            </TabsTrigger>
            <TabsTrigger 
              value="form"
              className={backgroundStyles.tabsTrigger}
            >
              {editingEmployee ? 'Edit Employee' : 'Add New Employee'}
            </TabsTrigger>
            <TabsTrigger value="departments" className={backgroundStyles.tabsTrigger}>
              Departments
            </TabsTrigger>
            <TabsTrigger value="designations" className={backgroundStyles.tabsTrigger}>
              Designation
            </TabsTrigger>
            {selectedEmployee && (
              <TabsTrigger 
                value="ppe-records"
                className={backgroundStyles.tabsTrigger}
              >
                PPE Records
              </TabsTrigger>
            )}
          </TabsList>

        <TabsContent value="list">
          <div className={`${backgroundStyles.cardBg} rounded-2xl p-6 shadow-xl`}>
            <div className="mb-6">
              <h2 className={`text-2xl font-semibold ${backgroundStyles.cardTitle} mb-4`}>Employee Records</h2>
              <div className="flex flex-col gap-4">
                <div className="flex gap-4 flex-wrap">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Search by employee number..."
                      value={empNumberSearch}
                      onChange={(e) => {
                        setEmpNumberSearch(e.target.value);
                        // Clear general search when employee number is entered
                        if (e.target.value.trim()) {
                          setSearchTerm('');
                        }
                      }}
                      className={`max-w-sm ${backgroundStyles.inputBg} rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all`}
                    />
                    {empNumberSearch && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setEmpNumberSearch('')}
                        className={backgroundStyles.buttonSecondary}
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Search by name, department, designation..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        // Clear employee number search when general search is entered
                        if (e.target.value.trim()) {
                          setEmpNumberSearch('');
                        }
                      }}
                      className={`max-w-sm ${backgroundStyles.inputBg} rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all`}
                    />
                    {searchTerm && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSearchTerm('')}
                        className={backgroundStyles.buttonSecondary}
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                  <Button 
                    onClick={() => setActiveTab('form')}
                    className={backgroundStyles.buttonPrimary}
                  >
                    Add New Employee
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      resetBulkInsertState();
                      setShowBulkInsertModal(true);
                    }}
                    className={backgroundStyles.buttonSecondary}
                  >
                    Bulk Insert
                  </Button>
                  {(empNumberSearch || searchTerm) && (
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setEmpNumberSearch('');
                        setSearchTerm('');
                      }}
                      className={backgroundStyles.buttonSecondary}
                    >
                      Show All
                    </Button>
                  )}
                </div>
                {(empNumberSearch || searchTerm) && (
                  <div className={`text-sm ${backgroundStyles.searchInfo}`}>
                    {empNumberSearch ? 
                      `Searching by employee number: "${empNumberSearch}"` : 
                      `Searching by name/department/designation: "${searchTerm}"`
                    }
                  </div>
                )}
              </div>
            </div>
            <div>
              {loading ? (
                <div className={`text-center py-8 ${backgroundStyles.loadingText}`}>
                  <div className={`animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 ${backgroundStyles.spinnerColor} mx-auto`}></div>
                </div>
              ) : (
                <ResponsiveTable columns={columns} data={tableData} variant={theme === 'light' ? 'light' : 'glassmorphic'} />
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="form">
          <div className={`${backgroundStyles.cardBg} rounded-2xl p-6 shadow-xl`}>
            <h2 className={`text-2xl font-semibold ${backgroundStyles.cardTitle} mb-6`}>
              {editingEmployee ? 'Edit Employee' : 'Add New Employee'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${backgroundStyles.labelText}`}>
                    Employee Number *
                  </label>
                  <Input
                    value={formData.empno}
                    onChange={(e) => setFormData({ ...formData, empno: e.target.value })}
                    required
                    disabled={!!editingEmployee}
                    className={`${backgroundStyles.inputBg} rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all ${backgroundStyles.inputDisabled}`}
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-1 ${backgroundStyles.labelText}`}>
                    Employee Name *
                  </label>
                  <Input
                    value={formData.empname}
                    onChange={(e) => setFormData({ ...formData, empname: e.target.value })}
                    required
                    className={`${backgroundStyles.inputBg} rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all`}
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-1 ${backgroundStyles.labelText}`}>
                    Department
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className={`w-full px-4 py-2 ${backgroundStyles.selectBg} rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all`}
                  >
                    <option value="" className={backgroundStyles.selectOption}>Select Department</option>
                    {departments.map((department) => (
                      <option key={department._id} value={department.name} className={backgroundStyles.selectOption}>
                        {department.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-1 ${backgroundStyles.labelText}`}>
                    Designation
                  </label>
                  <select
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className={`w-full px-4 py-2 ${backgroundStyles.selectBg} rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all`}
                  >
                    <option value="" className={backgroundStyles.selectOption}>Select Designation</option>
                    {designations.map((designation) => (
                      <option key={designation._id} value={designation.name} className={backgroundStyles.selectOption}>
                        {designation.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-1 ${backgroundStyles.labelText}`}>
                    Email
                  </label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`${backgroundStyles.inputBg} rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all`}
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-1 ${backgroundStyles.labelText}`}>
                    Phone
                  </label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className={`${backgroundStyles.inputBg} rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all`}
                  />
                </div>
                
                {editingEmployee && (
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${backgroundStyles.labelText}`}>
                      Status
                    </label>
                    <select
                      value={formData.active}
                      onChange={(e) => setFormData({ ...formData, active: e.target.value as 'Y' | 'N' })}
                      className={`w-full px-4 py-2 ${backgroundStyles.selectBg} rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all`}
                    >
                      <option value="Y" className={backgroundStyles.selectOption}>Active</option>
                      <option value="N" className={backgroundStyles.selectOption}>Inactive</option>
                    </select>
                  </div>
                )}
              </div>
              
              <div className="flex gap-4">
                <Button 
                  type="submit"
                  className={backgroundStyles.buttonPrimary}
                >
                  {editingEmployee ? 'Update Employee' : 'Create Employee'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setActiveTab('list');
                    setEditingEmployee(null);
                    setFormData({
                      empno: '',
                      empname: '',
                      department: '',
                      designation: '',
                      email: '',
                      phone: '',
                      active: 'Y'
                    });
                  }}
                  className={backgroundStyles.buttonSecondary}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </TabsContent>

        <TabsContent value="departments">
          <div className={`${backgroundStyles.cardBg} rounded-2xl p-6 shadow-xl`}>
            <h2 className={`text-2xl font-semibold ${backgroundStyles.cardTitle} mb-6`}>Departments</h2>
            <form onSubmit={handleDepartmentSubmit} className="flex flex-col gap-4 md:flex-row md:items-end">
              <div className="flex-1">
                <label className={`block text-sm font-medium mb-1 ${backgroundStyles.labelText}`}>
                  Department Name
                </label>
                <Input
                  value={departmentFormName}
                  onChange={(e) => setDepartmentFormName(e.target.value)}
                  required
                  className={`${backgroundStyles.inputBg} rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all`}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" className={backgroundStyles.buttonPrimary}>
                  {editingDepartmentId ? 'Update Department' : 'Add Department'}
                </Button>
                {editingDepartmentId && (
                  <Button
                    type="button"
                    variant="outline"
                    className={backgroundStyles.buttonSecondary}
                    onClick={() => {
                      setEditingDepartmentId(null);
                      setDepartmentFormName('');
                    }}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </form>

            <div className="mt-6">
              <ResponsiveTable
                columns={[
                  { key: 'name', label: 'Department' },
                  { key: 'actions', label: 'Actions' }
                ]}
                data={departments.map((department) => ({
                  name: department.name,
                  actions: (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className={backgroundStyles.buttonPrimary}
                        onClick={() => {
                          setEditingDepartmentId(department._id);
                          setDepartmentFormName(department.name);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className={backgroundStyles.buttonDestructive}
                        onClick={() => handleDeleteDepartment(department._id)}
                      >
                        Delete
                      </Button>
                    </div>
                  )
                }))}
                variant={theme === 'light' ? 'light' : 'glassmorphic'}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="designations">
          <div className={`${backgroundStyles.cardBg} rounded-2xl p-6 shadow-xl`}>
            <h2 className={`text-2xl font-semibold ${backgroundStyles.cardTitle} mb-6`}>Designation</h2>
            <form onSubmit={handleDesignationSubmit} className="flex flex-col gap-4 md:flex-row md:items-end">
              <div className="flex-1">
                <label className={`block text-sm font-medium mb-1 ${backgroundStyles.labelText}`}>
                  Designation Name
                </label>
                <Input
                  value={designationFormName}
                  onChange={(e) => setDesignationFormName(e.target.value)}
                  required
                  className={`${backgroundStyles.inputBg} rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all`}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" className={backgroundStyles.buttonPrimary}>
                  {editingDesignationId ? 'Update Designation' : 'Add Designation'}
                </Button>
                {editingDesignationId && (
                  <Button
                    type="button"
                    variant="outline"
                    className={backgroundStyles.buttonSecondary}
                    onClick={() => {
                      setEditingDesignationId(null);
                      setDesignationFormName('');
                    }}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </form>

            <div className="mt-6">
              <ResponsiveTable
                columns={[
                  { key: 'name', label: 'Designation' },
                  { key: 'actions', label: 'Actions' }
                ]}
                data={designations.map((designation) => ({
                  name: designation.name,
                  actions: (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className={backgroundStyles.buttonPrimary}
                        onClick={() => {
                          setEditingDesignationId(designation._id);
                          setDesignationFormName(designation.name);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className={backgroundStyles.buttonDestructive}
                        onClick={() => handleDeleteDesignation(designation._id)}
                      >
                        Delete
                      </Button>
                    </div>
                  )
                }))}
                variant={theme === 'light' ? 'light' : 'glassmorphic'}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="ppe-records">
          <div className={`${backgroundStyles.cardBg} rounded-2xl p-6 shadow-xl`}>
            <div className="mb-6">
              <h2 className={`text-2xl font-semibold ${backgroundStyles.cardTitle} mb-2`}>
                PPE Records - {selectedEmployee?.empname} ({selectedEmployee?.empno})
              </h2>
              <p className={backgroundStyles.headerSubtitle}>
                View complete PPE issue history for the selected employee
              </p>
            </div>
            <div>
              {selectedEmployee && (
                <PPEIssuesByEmployee 
                  showSearch={false}
                  preSelectedEmployee={selectedEmployee}
                  onEmployeeSelect={setSelectedEmployee}
                />
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {showBulkInsertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className={`${backgroundStyles.cardBg} w-full max-w-3xl rounded-2xl p-6 shadow-xl`}>
            <h3 className={`mb-4 text-2xl font-semibold ${backgroundStyles.cardTitle}`}>Bulk Insert Employees</h3>
            <div className="space-y-4">
              <p className={`text-sm ${backgroundStyles.searchInfo}`}>
                Download the template, fill all rows, upload the file, then validate before insertion.
              </p>

              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  onClick={handleDownloadEmployeeTemplate}
                  className={backgroundStyles.buttonSecondary}
                >
                  Download Template
                </Button>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleBulkFileSelect}
                  className={`max-w-md text-sm ${backgroundStyles.labelText}`}
                />
              </div>

              {bulkFileName && (
                <p className={`text-sm ${backgroundStyles.searchInfo}`}>
                  Selected file: <span className={backgroundStyles.labelText}>{bulkFileName}</span> ({bulkRows.length}{' '}
                  rows detected)
                </p>
              )}

              {validationSummary && (
                <div className={`rounded-xl border p-4 ${backgroundStyles.inputBg}`}>
                  <p className={`font-medium ${backgroundStyles.labelText}`}>{validationMessage}</p>
                  <p className={`mt-2 text-sm ${backgroundStyles.searchInfo}`}>
                    Total uploaded: {validationSummary.totalUploaded} | New rows: {validationSummary.validForInsert} |
                    Existing rows skipped: {validationSummary.skippedExisting.length}
                  </p>
                  {validationSummary.skippedExisting.length > 0 && (
                    <div className={`mt-2 max-h-28 overflow-y-auto text-xs ${backgroundStyles.searchInfo}`}>
                      {validationSummary.skippedExisting.map((item, index) => (
                        <div key={`${item.empno}-${index}`}>
                          Existing empno skipped: {item.empno}
                          {item.sourceRow ? ` (row ${item.sourceRow})` : ''}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {validatedRows.length > 0 && (
                <div className={`rounded-xl border p-4 ${backgroundStyles.inputBg}`}>
                  <p className={`mb-3 text-sm font-medium ${backgroundStyles.labelText}`}>
                    Preview of rows ready to insert ({validatedRows.length})
                  </p>
                  <div className="max-h-64 overflow-auto rounded-lg border border-white/20">
                    <table className="min-w-full text-left text-xs">
                      <thead className="sticky top-0 bg-black/20">
                        <tr>
                          <th className={`px-3 py-2 ${backgroundStyles.labelText}`}>Emp No</th>
                          <th className={`px-3 py-2 ${backgroundStyles.labelText}`}>Name</th>
                          <th className={`px-3 py-2 ${backgroundStyles.labelText}`}>Department</th>
                          <th className={`px-3 py-2 ${backgroundStyles.labelText}`}>Designation</th>
                          <th className={`px-3 py-2 ${backgroundStyles.labelText}`}>Email</th>
                          <th className={`px-3 py-2 ${backgroundStyles.labelText}`}>Phone</th>
                          <th className={`px-3 py-2 ${backgroundStyles.labelText}`}>Active</th>
                        </tr>
                      </thead>
                      <tbody>
                        {validatedRows.map((row, index) => (
                          <tr key={`${row.empno}-${index}`} className="border-t border-white/10">
                            <td className={`px-3 py-2 ${backgroundStyles.searchInfo}`}>{row.empno}</td>
                            <td className={`px-3 py-2 ${backgroundStyles.searchInfo}`}>{row.empname}</td>
                            <td className={`px-3 py-2 ${backgroundStyles.searchInfo}`}>{row.department || '-'}</td>
                            <td className={`px-3 py-2 ${backgroundStyles.searchInfo}`}>{row.designation || '-'}</td>
                            <td className={`px-3 py-2 ${backgroundStyles.searchInfo}`}>{row.email || '-'}</td>
                            <td className={`px-3 py-2 ${backgroundStyles.searchInfo}`}>{row.phone || '-'}</td>
                            <td className={`px-3 py-2 ${backgroundStyles.searchInfo}`}>{row.active || 'Y'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowBulkInsertModal(false);
                    resetBulkInsertState();
                  }}
                  className={backgroundStyles.buttonSecondary}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleValidateBulkInsert}
                  disabled={bulkInsertLoading || bulkRows.length === 0}
                  className={backgroundStyles.buttonPrimary}
                >
                  {bulkInsertLoading ? 'Processing...' : 'Validate'}
                </Button>
                <Button
                  type="button"
                  onClick={handleBulkInsert}
                  disabled={bulkInsertLoading || validatedRows.length === 0}
                  className={backgroundStyles.buttonPrimary}
                >
                  {bulkInsertLoading ? 'Processing...' : 'Insert'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {errorModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className={`${backgroundStyles.cardBg} w-full max-w-2xl rounded-2xl p-6 shadow-xl`}>
            <h3 className={`mb-3 text-xl font-semibold ${backgroundStyles.cardTitle}`}>{errorModalTitle}</h3>
            <div className={`max-h-80 overflow-auto whitespace-pre-wrap rounded-xl border p-4 text-sm ${backgroundStyles.inputBg}`}>
              {errorModalContent}
            </div>
            <div className="mt-4 flex justify-end">
              <Button type="button" onClick={() => setErrorModalOpen(false)} className={backgroundStyles.buttonPrimary}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
