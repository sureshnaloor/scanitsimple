'use client';

import { useState, useEffect, useRef } from 'react';
import { PPEIssueRecord } from '@/types/ppe';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toaster';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ResponsiveTable from '@/components/ui/responsive-table';
import SearchableEmployeeSelect from '@/components/SearchableEmployeeSelect';
import SearchablePPESelect from '@/components/SearchablePPESelect';
import { useAppTheme } from '@/app/contexts/ThemeContext';

interface PPEIssueFormData {
  userEmpNumber: string;
  userEmpName: string;
  dateOfIssue: string;
  reservationNumber: string;
  fileReferenceNumber: string;
  remarks: string;
}

interface ItemRow {
  ppeId: string;
  ppeName: string;
  quantityIssued: number;
  size: string;
  isFirstIssue: boolean;
  issueAgainstDue: boolean;
}

export default function PPEIssueRecordsPage() {
  const { theme } = useAppTheme();
  const [issueRecords, setIssueRecords] = useState<PPEIssueRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('list');
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [formData, setFormData] = useState<PPEIssueFormData>({
    userEmpNumber: '',
    userEmpName: '',
    dateOfIssue: new Date().toISOString().split('T')[0],
    reservationNumber: '',
    fileReferenceNumber: '',
    remarks: ''
  });
  const [itemRows, setItemRows] = useState<ItemRow[]>([
    { ppeId: '', ppeName: '', quantityIssued: 1, size: '', isFirstIssue: true, issueAgainstDue: true },
    { ppeId: '', ppeName: '', quantityIssued: 1, size: '', isFirstIssue: true, issueAgainstDue: true },
    { ppeId: '', ppeName: '', quantityIssued: 1, size: '', isFirstIssue: true, issueAgainstDue: true },
  ]);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null);
  const { show } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
  }>>([]);
  const animationFrameRef = useRef<number>();

  // Fetch data
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch issue records
      const issueResponse = await fetch(`/api/ppe-records?search=${searchTerm}`);
      const issueResult = await issueResponse.json();
      
      if (issueResult.success) {
        setIssueRecords(issueResult.data.records);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Theme-based styling function
  const getBackgroundStyles = () => {
    switch (theme) {
      case 'glassmorphic':
        return {
          container: 'relative min-h-screen overflow-hidden bg-gradient-to-br from-[#1a2332] via-[#2d3748] to-[#1a2332]',
          headerBg: 'bg-white/10 backdrop-blur-lg border border-white/20',
          headerHover: 'hover:bg-white/15',
          headerTitle: 'bg-gradient-to-r from-white to-teal-400 bg-clip-text text-transparent',
          headerSubtitle: 'text-white',
          tabsBg: 'bg-white/10 backdrop-blur-lg border border-white/20',
          tabsTrigger: 'rounded-lg px-6 py-2 text-sm font-medium data-[state=active]:bg-white/20 data-[state=active]:text-white data-[state=inactive]:text-white/70',
          cardBg: 'bg-white/10 backdrop-blur-lg border border-white/20',
          cardHover: 'hover:bg-white/15',
          cardTitle: 'text-white',
          inputBg: 'bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-white/70 focus:ring-teal-400',
          inputDisabled: 'disabled:opacity-50 disabled:cursor-not-allowed',
          buttonPrimary: 'bg-teal-500/20 backdrop-blur-md border border-teal-400/30 text-teal-300 hover:bg-teal-500/30 hover:border-teal-400/50',
          buttonSecondary: 'bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20',
          buttonDelete: 'bg-red-500/20 backdrop-blur-md border border-red-400/30 text-red-300 hover:bg-red-500/30',
          buttonDisabled: 'disabled:opacity-50 disabled:cursor-not-allowed',
          spinnerColor: 'border-teal-400',
          loadingText: 'text-white',
          editBannerBg: 'bg-blue-500/20 backdrop-blur-md border border-blue-400/30',
          editBannerText: 'text-blue-300',
          tableBg: 'bg-white/5 backdrop-blur-md border border-white/20',
          tableHeaderBg: 'bg-white/5 backdrop-blur-sm border-b border-white/10',
          tableHeaderText: 'text-white/90',
          tableRowBorder: 'border-b border-white/5',
          tableRowHover: 'hover:bg-white/10',
          tableCellText: 'text-white',
          labelText: 'text-white',
          labelTextSecondary: 'text-slate-300',
          checkboxAccent: 'accent-teal-400',
          detailLabel: 'text-teal-300',
          detailValue: 'text-white',
          emptyText: 'text-white/70',
          errorText: 'text-red-300'
        };
      case 'light':
        return {
          container: 'relative min-h-screen overflow-hidden bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100',
          headerBg: 'bg-white border-2 border-blue-200 shadow-lg',
          headerHover: 'hover:bg-blue-50',
          headerTitle: 'bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent',
          headerSubtitle: 'text-gray-700',
          tabsBg: 'bg-white border-2 border-blue-200 shadow-md',
          tabsTrigger: 'rounded-lg px-6 py-2 text-sm font-medium data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700 data-[state=inactive]:text-gray-600',
          cardBg: 'bg-white border-2 border-blue-200 shadow-md',
          cardHover: 'hover:bg-blue-50',
          cardTitle: 'text-gray-900',
          inputBg: 'bg-white border-2 border-blue-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500',
          inputDisabled: 'disabled:opacity-50 disabled:cursor-not-allowed',
          buttonPrimary: 'bg-blue-600 hover:bg-blue-700 text-white border-2 border-blue-500',
          buttonSecondary: 'bg-gray-100 border-2 border-gray-300 text-gray-700 hover:bg-gray-200',
          buttonDelete: 'bg-red-600 hover:bg-red-700 text-white border-2 border-red-500',
          buttonDisabled: 'disabled:opacity-50 disabled:cursor-not-allowed',
          spinnerColor: 'border-blue-500',
          loadingText: 'text-gray-700',
          editBannerBg: 'bg-blue-100 border-2 border-blue-300',
          editBannerText: 'text-blue-800',
          tableBg: 'bg-white border-2 border-blue-200',
          tableHeaderBg: 'bg-blue-50 border-b-2 border-blue-200',
          tableHeaderText: 'text-gray-900',
          tableRowBorder: 'border-b border-gray-200',
          tableRowHover: 'hover:bg-blue-50',
          tableCellText: 'text-gray-900',
          labelText: 'text-gray-900',
          labelTextSecondary: 'text-gray-600',
          checkboxAccent: 'accent-blue-600',
          detailLabel: 'text-blue-700',
          detailValue: 'text-gray-900',
          emptyText: 'text-gray-500',
          errorText: 'text-red-600'
        };
      default: // dark theme
        return {
          container: 'relative min-h-screen overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a]',
          headerBg: 'bg-slate-800/90 border border-slate-700 shadow-xl',
          headerHover: 'hover:bg-slate-700/90',
          headerTitle: 'bg-gradient-to-r from-slate-100 to-teal-400 bg-clip-text text-transparent',
          headerSubtitle: 'text-slate-300',
          tabsBg: 'bg-slate-800/90 border border-slate-700 shadow-xl',
          tabsTrigger: 'rounded-lg px-6 py-2 text-sm font-medium data-[state=active]:bg-slate-700 data-[state=active]:text-slate-100 data-[state=inactive]:text-slate-400',
          cardBg: 'bg-slate-800/90 border border-slate-700 shadow-xl',
          cardHover: 'hover:bg-slate-700/90',
          cardTitle: 'text-slate-100',
          inputBg: 'bg-slate-800/90 border border-slate-600 text-slate-100 placeholder-slate-400 focus:ring-teal-400 focus:border-teal-400',
          inputDisabled: 'disabled:opacity-50 disabled:cursor-not-allowed',
          buttonPrimary: 'bg-teal-600 hover:bg-teal-700 text-white border border-teal-500',
          buttonSecondary: 'bg-slate-700/50 border border-slate-600 text-slate-200 hover:bg-slate-600',
          buttonDelete: 'bg-red-600 hover:bg-red-700 text-white border border-red-500',
          buttonDisabled: 'disabled:opacity-50 disabled:cursor-not-allowed',
          spinnerColor: 'border-teal-400',
          loadingText: 'text-slate-300',
          editBannerBg: 'bg-blue-900/50 border border-blue-700',
          editBannerText: 'text-blue-300',
          tableBg: 'bg-slate-800/50 border border-slate-700',
          tableHeaderBg: 'bg-slate-800/80 border-b border-slate-700',
          tableHeaderText: 'text-slate-200',
          tableRowBorder: 'border-b border-slate-700',
          tableRowHover: 'hover:bg-slate-700/50',
          tableCellText: 'text-slate-200',
          labelText: 'text-slate-200',
          labelTextSecondary: 'text-slate-400',
          checkboxAccent: 'accent-teal-400',
          detailLabel: 'text-teal-400',
          detailValue: 'text-slate-200',
          emptyText: 'text-slate-400',
          errorText: 'text-red-400'
        };
    }
  };

  const backgroundStyles = getBackgroundStyles();

  // Network canvas animation
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

    // Initialize particles
    particlesRef.current = [];
    for (let i = 0; i < 40; i++) {
      particlesRef.current.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        radius: Math.random() * 2 + 1
      });
    }

    const animate = () => {
      if (!ctx || !canvas) return;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      particlesRef.current.forEach((particle, i) => {
        particle.x += particle.vx;
        particle.y += particle.vy;

        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;

        // Draw particle - theme-based colors
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        if (theme === 'light') {
          ctx.fillStyle = 'rgba(59, 130, 246, 0.3)'; // blue for light theme
        } else if (theme === 'glassmorphic') {
          ctx.fillStyle = 'rgba(45, 212, 191, 0.4)'; // teal for glassmorphic
        } else {
          ctx.fillStyle = 'rgba(45, 212, 191, 0.4)'; // teal for dark theme
        }
        ctx.fill();

        // Draw connections
        particlesRef.current.forEach((otherParticle, j) => {
          if (i !== j) {
            const dx = particle.x - otherParticle.x;
            const dy = particle.y - otherParticle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 120) {
              ctx.beginPath();
              ctx.moveTo(particle.x, particle.y);
              ctx.lineTo(otherParticle.x, otherParticle.y);
              if (theme === 'light') {
                ctx.strokeStyle = `rgba(59, 130, 246, ${0.15 * (1 - distance / 120)})`;
              } else {
                ctx.strokeStyle = `rgba(45, 212, 191, ${0.2 * (1 - distance / 120)})`;
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

  useEffect(() => {
    fetchData();
  }, [searchTerm]);


  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validRows = itemRows.filter(r => r.ppeId && r.quantityIssued > 0);
    if (validRows.length === 0) {
      show({ title: 'No items', description: 'Add at least one PPE item row', variant: 'destructive' });
      return;
    }

    try {
      setSubmitLoading(true);
      const isEditing = Boolean(editingRecordId);
      if (isEditing) {
        const r = validRows[0];
        const response = await fetch(`/api/ppe-records/${editingRecordId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userEmpNumber: formData.userEmpNumber,
            userEmpName: formData.userEmpName,
            dateOfIssue: formData.dateOfIssue,
            reservationNumber: formData.reservationNumber,
            fileReferenceNumber: formData.fileReferenceNumber,
            ppeId: r.ppeId,
            ppeName: r.ppeName,
            quantityIssued: r.quantityIssued,
            size: r.size,
            isFirstIssue: r.isFirstIssue,
            issueAgainstDue: r.issueAgainstDue,
            remarks: formData.remarks,
          }),
        });
        const result = await response.json();
        if (!result.success) throw new Error(result.error || 'Failed to update record');
        show({ title: 'PPE issue updated', description: 'Record updated successfully', variant: 'success' });
      } else {
        let created = 0;
        for (const r of validRows) {
          const res = await fetch('/api/ppe-records', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userEmpNumber: formData.userEmpNumber,
              userEmpName: formData.userEmpName,
              dateOfIssue: formData.dateOfIssue,
              reservationNumber: formData.reservationNumber,
              fileReferenceNumber: formData.fileReferenceNumber,
              ppeId: r.ppeId,
              ppeName: r.ppeName,
              quantityIssued: r.quantityIssued,
              size: r.size,
              isFirstIssue: r.isFirstIssue,
              issueAgainstDue: r.issueAgainstDue,
              remarks: formData.remarks,
            }),
          });
          const js = await res.json();
          if (!js.success) throw new Error(js.error || 'Failed to create some records');
          created += 1;
        }
        show({ title: 'PPE issued', description: `Created ${created} issue record(s)`, variant: 'success' });
      }

      setActiveTab('list');
      setEditingRecordId(null);
      setFormData({
        userEmpNumber: '',
        userEmpName: '',
        dateOfIssue: new Date().toISOString().split('T')[0],
        reservationNumber: '',
        fileReferenceNumber: '',
        remarks: ''
      });
      setItemRows([
        { ppeId: '', ppeName: '', quantityIssued: 1, size: '', isFirstIssue: true, issueAgainstDue: true },
        { ppeId: '', ppeName: '', quantityIssued: 1, size: '', isFirstIssue: true, issueAgainstDue: true },
        { ppeId: '', ppeName: '', quantityIssued: 1, size: '', isFirstIssue: true, issueAgainstDue: true },
      ]);
      fetchData();
    } catch (error: any) {
      console.error('Error creating PPE issue record:', error);
      let errorDescription = 'Could not complete the request';
      if (error instanceof Error && error.message.includes('Insufficient stock')) {
        errorDescription = 'Stock is not sufficient - please check if any receipt posting is pending';
      }
      show({ title: 'Request failed', description: errorDescription, variant: 'destructive' });
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleEdit = async (record: PPEIssueRecord) => {
    console.log('Editing record:', record); // Debug log
    setEditingRecordId(record._id || null);
    setFormData({
      userEmpNumber: record.userEmpNumber,
      userEmpName: record.userEmpName,
      dateOfIssue: new Date(record.dateOfIssue).toISOString().split('T')[0],
      reservationNumber: (record as any).reservationNumber || '',
      fileReferenceNumber: (record as any).fileReferenceNumber || '',
      remarks: record.remarks || ''
    });
    setItemRows([{
      ppeId: record.ppeId,
      ppeName: record.ppeName,
      quantityIssued: record.quantityIssued,
      size: (record as any).size || '',
      isFirstIssue: record.isFirstIssue,
      issueAgainstDue: record.issueAgainstDue,
    }]);
    setActiveTab('form');
  };

  const handleDelete = async (record: PPEIssueRecord) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this issue record? This will revert stock.');
    if (!confirmDelete || !record._id) return;
    try {
      setDeleteLoadingId(record._id);
      const response = await fetch(`/api/ppe-records/${record._id}`, { method: 'DELETE' });
      const result = await response.json();
      if (result.success) {
        show({ title: 'Record deleted', description: 'Issue record deleted and stock reverted', variant: 'success' });
        fetchData();
      } else {
        show({ title: 'Delete failed', description: result.error || 'Unknown error', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error deleting PPE issue record:', error);
      show({ title: 'Request failed', description: 'Failed to delete PPE issue record', variant: 'destructive' });
    } finally {
      setDeleteLoadingId(null);
    }
  };

  // Row handlers
  const updateRowPPE = (index: number, ppeId: string, ppeName: string) => {
    setItemRows(prev => prev.map((r, i) => i === index ? { ...r, ppeId, ppeName } : r));
  };
  const updateRowQty = (index: number, qty: number) => {
    setItemRows(prev => prev.map((r, i) => i === index ? { ...r, quantityIssued: qty } : r));
  };
  const updateRowSize = (index: number, size: string) => {
    setItemRows(prev => prev.map((r, i) => i === index ? { ...r, size } : r));
  };
  const updateRowFlag = (index: number, key: 'isFirstIssue' | 'issueAgainstDue', value: boolean) => {
    setItemRows(prev => prev.map((r, i) => i === index ? { ...r, [key]: value } as ItemRow : r));
  };
  const addRow = () => {
    setItemRows(prev => [...prev, { ppeId: '', ppeName: '', quantityIssued: 1, size: '', isFirstIssue: true, issueAgainstDue: true }]);
  };
  const removeRow = (index: number) => {
    setItemRows(prev => prev.length <= 1 ? prev : prev.filter((_, i) => i !== index));
  };

  // Table columns
  const columns = [
    { key: 'dateOfIssue', label: 'Issue Date' },
    { key: 'userEmpNumber', label: 'Emp Number' },
    { key: 'userEmpName', label: 'Employee Name' },
    { key: 'ppeName', label: 'PPE Name' },
    { key: 'quantityIssued', label: 'Quantity' },
    { key: 'additionalDetails', label: 'Additional Details' },
    { key: 'isFirstIssue', label: 'First Issue' },
    { key: 'issueAgainstDue', label: 'Issue Type' },
    { key: 'issuedByName', label: 'Issued By' },
    { key: 'actions', label: 'Actions' }
  ];

  const tableData = issueRecords.map(record => {
    // Create combined additional details with colored field names
    const additionalDetails = [];
    
    const reservationNumber = (record as any).reservationNumber;
    if (reservationNumber) {
      additionalDetails.push(
        <span key="reservation">
          <span className={`${backgroundStyles.detailLabel} font-medium`}>Reservation:</span> <span className={backgroundStyles.detailValue}>{reservationNumber}</span>
        </span>
      );
    }
    
    const fileReferenceNumber = (record as any).fileReferenceNumber;
    if (fileReferenceNumber) {
      additionalDetails.push(
        <span key="fileref">
          <span className={`${backgroundStyles.detailLabel} font-medium`}>File Ref:</span> <span className={backgroundStyles.detailValue}>{fileReferenceNumber}</span>
        </span>
      );
    }
    
    const size = (record as any).size;
    if (size) {
      additionalDetails.push(
        <span key="size">
          <span className={`${backgroundStyles.detailLabel} font-medium`}>Size:</span> <span className={backgroundStyles.detailValue}>{size}</span>
        </span>
      );
    }
    
    const remarks = record.remarks;
    if (remarks) {
      additionalDetails.push(
        <span key="remarks">
          <span className={`${backgroundStyles.detailLabel} font-medium`}>Remarks:</span> <span className={backgroundStyles.detailValue}>{remarks}</span>
        </span>
      );
    }
    
    const additionalDetailsElement = additionalDetails.length > 0 
      ? <div className="space-y-1">{additionalDetails.map((item, index) => (
          <div key={index} className="text-xs">
            {item}
          </div>
        ))}</div>
      : <span className={backgroundStyles.emptyText}>-</span>;

    return {
      ...record,
      dateOfIssue: new Date(record.dateOfIssue).toLocaleDateString(),
      additionalDetails: additionalDetailsElement,
      isFirstIssue: record.isFirstIssue ? 'Yes' : 'No',
      issueAgainstDue: record.issueAgainstDue ? 'Due' : 'Damage',
      actions: (
        <div className="flex gap-2">
          <button
            onClick={() => handleEdit(record)}
            className={`px-4 py-2 ${backgroundStyles.buttonSecondary} rounded-lg transition-all duration-300 text-sm font-medium`}
          >
            Edit
          </button>
          <button
            onClick={() => handleDelete(record)}
            disabled={deleteLoadingId === record._id}
            className={`px-4 py-2 ${backgroundStyles.buttonDelete} rounded-lg transition-all duration-300 text-sm font-medium ${backgroundStyles.buttonDisabled}`}
          >
            {deleteLoadingId === record._id ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      )
    };
  });

  return (
    <div className={backgroundStyles.container}>
      {/* Animated background canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 z-10" />
      
      {/* Main content */}
      <div className="relative z-20 pt-8 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="mb-8">
            <div className={`${backgroundStyles.headerBg} rounded-3xl p-8 ${backgroundStyles.headerHover} transition-all duration-300`}>
              <h1 className={`text-2xl md:text-3xl font-bold mb-4 ${backgroundStyles.headerTitle}`}>
                PPE Issue Records
              </h1>
              <p className={`${backgroundStyles.headerSubtitle} text-lg`}>Manage Personal Protective Equipment issue records</p>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className={`${backgroundStyles.tabsBg} rounded-xl p-1 shadow-lg mb-6`}>
              <TabsTrigger 
                className={`${backgroundStyles.tabsTrigger} transition-all duration-300`}
                value="list"
              >
                Issue Records
              </TabsTrigger>
              <TabsTrigger 
                className={`${backgroundStyles.tabsTrigger} transition-all duration-300`}
                value="form"
              >
                Issue New PPE
              </TabsTrigger>
            </TabsList>

            <TabsContent value="list">
              <div className={`${backgroundStyles.cardBg} rounded-3xl shadow-2xl overflow-hidden ${backgroundStyles.cardHover} transition-all duration-300`}>
                <div className={`p-6 lg:p-8 border-b ${theme === 'light' ? 'border-blue-200' : theme === 'glassmorphic' ? 'border-white/10' : 'border-slate-700'}`}>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <h2 className={`text-2xl font-bold ${backgroundStyles.cardTitle}`}>PPE Issue Records</h2>
                    <div className="flex gap-4">
                      <input
                        type="text"
                        placeholder="Search issue records..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={`px-4 py-2 ${backgroundStyles.inputBg} rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all text-sm`}
                      />
                      <button
                        onClick={() => setActiveTab('form')}
                        className={`px-6 py-2 ${backgroundStyles.buttonPrimary} rounded-xl font-semibold transition-all duration-300 text-sm`}
                      >
                        Issue New PPE
                      </button>
                    </div>
                  </div>
                </div>
                <div className="p-6 lg:p-8">
                  {loading ? (
                    <div className="flex justify-center items-center py-12">
                      <div className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${backgroundStyles.spinnerColor}`}></div>
                      <p className={`${backgroundStyles.loadingText} ml-4`}>Loading...</p>
                    </div>
                  ) : (
                    <ResponsiveTable columns={columns} data={tableData} variant={theme === 'light' ? 'light' : 'glassmorphic'} />
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="form">
              {editingRecordId && (
                <div className={`mb-6 p-4 ${backgroundStyles.editBannerBg} rounded-xl`}>
                  <p className={`text-sm ${backgroundStyles.editBannerText}`}>
                    <strong>Edit Mode:</strong> You are editing an existing PPE issue record. The date field is locked and cannot be changed.
                  </p>
                </div>
              )}
              <div className={`${backgroundStyles.cardBg} rounded-3xl shadow-2xl overflow-hidden ${backgroundStyles.cardHover} transition-all duration-300`}>
                <div className={`p-6 lg:p-8 border-b ${theme === 'light' ? 'border-blue-200' : theme === 'glassmorphic' ? 'border-white/10' : 'border-slate-700'}`}>
                  <h2 className={`text-2xl font-bold ${backgroundStyles.cardTitle}`}>
                    {editingRecordId ? 'Edit PPE Issue Record' : 'Issue PPE to Employee'}
                  </h2>
                </div>
                <div className="p-6 lg:p-8">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${backgroundStyles.labelText}`}>
                          Employee *
                        </label>
                    <SearchableEmployeeSelect
                      value={formData.userEmpNumber}
                      onChange={(empNumber, empName) => {
                        setFormData({
                          ...formData,
                          userEmpNumber: empNumber,
                          userEmpName: empName
                        });
                      }}
                      placeholder="Search employee by name or number..."
                      required
                    />
                        {editingRecordId && formData.userEmpName && (
                          <p className={`text-xs ${backgroundStyles.errorText} mt-2`}>
                            Existing: {formData.userEmpName} ({formData.userEmpNumber})
                          </p>
                        )}
                      </div>
                      
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${backgroundStyles.labelText}`}>Issue Date *</label>
                        <input
                          type="date"
                          value={formData.dateOfIssue}
                          onChange={(e) => setFormData({ ...formData, dateOfIssue: e.target.value })}
                          required
                          disabled={!!editingRecordId}
                          className={`w-full px-4 py-2 ${backgroundStyles.inputBg} rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all ${backgroundStyles.inputDisabled}`}
                        />
                        {editingRecordId && (
                          <p className={`text-xs ${backgroundStyles.labelTextSecondary} mt-2`}>Date cannot be changed when editing</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${backgroundStyles.labelText}`}>
                          Reservation Number
                        </label>
                        <input
                          type="text"
                          value={formData.reservationNumber}
                          onChange={(e) => setFormData({ ...formData, reservationNumber: e.target.value })}
                          placeholder="Enter reservation number..."
                          className={`w-full px-4 py-2 ${backgroundStyles.inputBg} rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all`}
                        />
                      </div>
                      
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${backgroundStyles.labelText}`}>
                          File Reference Number
                        </label>
                        <input
                          type="text"
                          value={formData.fileReferenceNumber}
                          onChange={(e) => setFormData({ ...formData, fileReferenceNumber: e.target.value })}
                          placeholder="Enter file reference number..."
                          className={`w-full px-4 py-2 ${backgroundStyles.inputBg} rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all`}
                        />
                      </div>
                    </div>
                
                    <div className="mt-4">
                      <div className={`overflow-auto rounded-xl ${backgroundStyles.tableBg} shadow-lg`}>
                        <table className="w-full text-sm">
                          <thead>
                            <tr className={`${backgroundStyles.tableHeaderBg} ${backgroundStyles.tableRowBorder}`}>
                              <th className={`text-left p-3 ${backgroundStyles.tableHeaderText} font-semibold`}>PPE Item</th>
                              <th className={`text-left p-3 ${backgroundStyles.tableHeaderText} font-semibold`}>Quantity</th>
                              <th className={`text-left p-3 ${backgroundStyles.tableHeaderText} font-semibold`}>Size</th>
                              <th className={`text-left p-3 ${backgroundStyles.tableHeaderText} font-semibold`}>First Issue</th>
                              <th className={`text-left p-3 ${backgroundStyles.tableHeaderText} font-semibold`}>Issue Against Due</th>
                              <th className={`text-left p-3 ${backgroundStyles.tableHeaderText} font-semibold`}>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {itemRows.map((row, idx) => (
                              <tr key={idx} className={`${backgroundStyles.tableRowBorder} ${backgroundStyles.tableRowHover} transition-colors`}>
                                <td className="p-3 min-w-[260px]">
                                  <SearchablePPESelect
                                    value={row.ppeId}
                                    onChange={(id, name) => updateRowPPE(idx, id, name)}
                                    placeholder="Search PPE by name or ID..."
                                    required
                                  />
                                  {editingRecordId && row.ppeName && (
                                    <p className={`text-xs ${backgroundStyles.errorText} mt-2`}>
                                      Existing: {row.ppeName} ({row.ppeId})
                                    </p>
                                  )}
                                </td>
                                <td className="p-3 w-[140px]">
                                  <input
                                    className={`w-full px-3 py-2 ${backgroundStyles.inputBg} rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all`}
                                    type="number"
                                    min="1"
                                    value={row.quantityIssued}
                                    onChange={(e) => updateRowQty(idx, parseInt(e.target.value || '0'))}
                                  />
                                </td>
                                <td className="p-3 w-[120px]">
                                  <input
                                    className={`w-full px-3 py-2 ${backgroundStyles.inputBg} rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all`}
                                    type="text"
                                    value={row.size}
                                    onChange={(e) => updateRowSize(idx, e.target.value)}
                                    placeholder="Size..."
                                  />
                                </td>
                                <td className="p-3 w-[160px]">
                                  <label className={`inline-flex items-center gap-2 ${backgroundStyles.labelText}`}>
                                    <input
                                      type="checkbox"
                                      className={`rounded w-4 h-4 ${backgroundStyles.checkboxAccent}`}
                                      checked={row.isFirstIssue}
                                      onChange={(e) => updateRowFlag(idx, 'isFirstIssue', e.target.checked)}
                                    />
                                    <span>Yes</span>
                                  </label>
                                </td>
                                <td className="p-3 w-[220px]">
                                  <label className={`inline-flex items-center gap-2 ${backgroundStyles.labelText}`}>
                                    <input
                                      type="checkbox"
                                      className={`rounded w-4 h-4 ${backgroundStyles.checkboxAccent}`}
                                      checked={row.issueAgainstDue}
                                      onChange={(e) => updateRowFlag(idx, 'issueAgainstDue', e.target.checked)}
                                    />
                                    <span>Due (uncheck for damage)</span>
                                  </label>
                                </td>
                                <td className="p-3 w-[140px]">
                                  <button
                                    type="button"
                                    onClick={() => removeRow(idx)}
                                    disabled={itemRows.length <= 1}
                                    className={`px-4 py-2 ${backgroundStyles.buttonSecondary} rounded-lg transition-all duration-300 text-sm font-medium ${backgroundStyles.buttonDisabled}`}
                                  >
                                    Remove
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="mt-4">
                        <button
                          type="button"
                          onClick={addRow}
                          className={`px-4 py-2 ${backgroundStyles.buttonSecondary} rounded-lg transition-all duration-300 text-sm font-medium`}
                        >
                          + Add row
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${backgroundStyles.labelTextSecondary}`}>
                        Remarks
                      </label>
                      <textarea
                        value={formData.remarks}
                        onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                        className={`w-full p-4 ${backgroundStyles.inputBg} rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all`}
                        rows={3}
                        placeholder="Enter any remarks or notes..."
                      />
                    </div>
                    
                    <div className="flex gap-4">
                      <button
                        type="submit"
                        disabled={submitLoading}
                        className={`px-6 py-3 ${backgroundStyles.buttonPrimary} rounded-xl font-semibold transition-all duration-300 ${backgroundStyles.buttonDisabled}`}
                      >
                        {submitLoading ? (editingRecordId ? 'Updating...' : 'Submitting...') : (editingRecordId ? 'Update Issue' : 'Issue PPE')}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('list');
                          setEditingRecordId(null);
                          setFormData({
                            userEmpNumber: '',
                            userEmpName: '',
                            dateOfIssue: new Date().toISOString().split('T')[0],
                            reservationNumber: '',
                            fileReferenceNumber: '',
                            remarks: ''
                          });
                          setItemRows([
                            { ppeId: '', ppeName: '', quantityIssued: 1, size: '', isFirstIssue: true, issueAgainstDue: true },
                            { ppeId: '', ppeName: '', quantityIssued: 1, size: '', isFirstIssue: true, issueAgainstDue: true },
                            { ppeId: '', ppeName: '', quantityIssued: 1, size: '', isFirstIssue: true, issueAgainstDue: true },
                          ]);
                        }}
                        className={`px-6 py-3 ${backgroundStyles.buttonSecondary} rounded-xl transition-all duration-300 font-medium`}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
