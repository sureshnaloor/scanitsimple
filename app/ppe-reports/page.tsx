'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toaster';
import SearchableEmployeeSelect from '@/components/SearchableEmployeeSelect';
import SearchablePPESelect from '@/components/SearchablePPESelect';
import { useAppTheme } from '@/app/contexts/ThemeContext';
import {
  DocumentArrowDownIcon,
  TableCellsIcon,
  DocumentTextIcon,
  FunnelIcon,
  ArrowPathIcon,
  CalendarDaysIcon,
  UserIcon,
  ShieldCheckIcon,
  ArchiveBoxIcon,
  UsersIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

interface ReportRow {
  slNo: number;
  id: string;
  type: 'Individual' | 'Bulk';
  date: string;
  rawDate: string;
  empNumber: string;
  empName: string;
  ppeId: string;
  ppeName: string;
  quantity: number;
  size: string;
  reservationNumber: string;
  fileReferenceNumber: string;
  remarks: string;
  issuedBy: string;
}

export default function PPEReportsPage() {
  const { theme } = useAppTheme();
  const { show } = useToast();

  // Filter States
  const [selectedEmpNumber, setSelectedEmpNumber] = useState('');
  const [selectedEmpName, setSelectedEmpName] = useState('');
  const [selectedPpeId, setSelectedPpeId] = useState('');
  const [selectedPpeName, setSelectedPpeName] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [issueType, setIssueType] = useState<'all' | 'individual' | 'bulk'>('all');
  const [tableSearch, setTableSearch] = useState('');

  // Data & UI States
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Background Canvas animation
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Array<{ x: number; y: number; vx: number; vy: number; radius: number }>>([]);
  const animationFrameRef = useRef<number>();

  // Fetch Report Data
  const fetchReportData = async () => {
    try {
      setLoading(true);

      const indParams = new URLSearchParams();
      if (selectedEmpNumber) indParams.set('userEmpNumber', selectedEmpNumber);
      else if (selectedEmpName) indParams.set('search', selectedEmpName);
      if (selectedPpeId) indParams.set('ppeId', selectedPpeId);
      if (dateFrom) indParams.set('dateFrom', `${dateFrom}T00:00:00.000Z`);
      if (dateTo) indParams.set('dateTo', `${dateTo}T23:59:59.999Z`);
      indParams.set('limit', '5000');

      const bulkParams = new URLSearchParams();
      const bulkSearch = selectedEmpNumber || selectedEmpName;
      if (bulkSearch) bulkParams.set('search', bulkSearch);
      if (selectedPpeId) bulkParams.set('ppeId', selectedPpeId);
      if (dateFrom) bulkParams.set('dateFrom', dateFrom);
      if (dateTo) bulkParams.set('dateTo', dateTo);
      bulkParams.set('limit', '5000');

      const promises = [];
      if (issueType === 'all' || issueType === 'individual') {
        promises.push(fetch(`/api/ppe-records?${indParams.toString()}`).then((r) => r.json()));
      } else {
        promises.push(Promise.resolve({ success: true, data: { records: [] } }));
      }

      if (issueType === 'all' || issueType === 'bulk') {
        promises.push(fetch(`/api/ppe-bulk-issues?${bulkParams.toString()}`).then((r) => r.json()));
      } else {
        promises.push(Promise.resolve({ success: true, data: { records: [] } }));
      }

      const [indResult, bulkResult] = await Promise.all(promises);

      let indRows: ReportRow[] = [];
      if (indResult?.success && indResult?.data?.records) {
        indRows = indResult.data.records.map((r: any) => ({
          slNo: 0,
          id: r._id || Math.random().toString(),
          type: 'Individual',
          date: new Date(r.dateOfIssue).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          }),
          rawDate: r.dateOfIssue,
          empNumber: r.userEmpNumber || '-',
          empName: r.userEmpName || '-',
          ppeId: r.ppeId || '-',
          ppeName: r.ppeName || '-',
          quantity: Number(r.quantityIssued) || 0,
          size: r.size || '-',
          reservationNumber: r.reservationNumber || '-',
          fileReferenceNumber: r.fileReferenceNumber || '-',
          remarks: r.remarks || '',
          issuedBy: r.issuedByName || r.issuedBy || '-',
        }));
      }

      let bulkRows: ReportRow[] = [];
      if (bulkResult?.success && bulkResult?.data?.records) {
        bulkRows = bulkResult.data.records.map((r: any) => ({
          slNo: 0,
          id: r._id || Math.random().toString(),
          type: 'Bulk',
          date: new Date(r.issueDate).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          }),
          rawDate: r.issueDate,
          empNumber: r.receiverUserEmpNumber || r.departmentOrProjectName || '-',
          empName: r.receiverUserEmpName ? `${r.receiverUserEmpName} (${r.location || 'Bulk'})` : r.departmentOrProjectName || '-',
          ppeId: r.ppeId || '-',
          ppeName: r.ppeName || '-',
          quantity: Number(r.quantityIssued) || 0,
          size: '-',
          reservationNumber: '-',
          fileReferenceNumber: '-',
          remarks: r.remarks || '',
          issuedBy: r.issuedByName || r.issuedBy || '-',
        }));
      }

      const combined = [...indRows, ...bulkRows].sort(
        (a, b) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime()
      );

      // Assign sequence numbers
      const numbered = combined.map((item, index) => ({
        ...item,
        slNo: index + 1,
      }));

      setRows(numbered);
      setCurrentPage(1);
    } catch (err: any) {
      console.error('Error loading PPE report data:', err);
      show({
        title: 'Error loading data',
        description: err.message || 'Could not fetch records',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, []);

  // Quick preset handlers
  const handlePreset = (preset: 'all' | 'hist' | 'year' | '90days' | '30days') => {
    const today = new Date();
    const formatDate = (d: Date) => d.toISOString().split('T')[0];

    switch (preset) {
      case 'all':
        setDateFrom('');
        setDateTo('');
        break;
      case 'hist':
        setDateFrom('2025-04-01');
        setDateTo('2026-06-30');
        break;
      case 'year':
        setDateFrom('2026-01-01');
        setDateTo('2026-12-31');
        break;
      case '90days': {
        const d = new Date();
        d.setDate(d.getDate() - 90);
        setDateFrom(formatDate(d));
        setDateTo(formatDate(today));
        break;
      }
      case '30days': {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        setDateFrom(formatDate(d));
        setDateTo(formatDate(today));
        break;
      }
    }
  };

  const handleResetFilters = () => {
    setSelectedEmpNumber('');
    setSelectedEmpName('');
    setSelectedPpeId('');
    setSelectedPpeName('');
    setDateFrom('');
    setDateTo('');
    setIssueType('all');
    setTableSearch('');
  };

  // Filtered rows for display and export
  const filteredRows = useMemo(() => {
    if (!tableSearch.trim()) return rows;
    const q = tableSearch.toLowerCase().trim();
    return rows.filter(
      (r) =>
        r.empNumber.toLowerCase().includes(q) ||
        r.empName.toLowerCase().includes(q) ||
        r.ppeId.toLowerCase().includes(q) ||
        r.ppeName.toLowerCase().includes(q) ||
        r.date.toLowerCase().includes(q) ||
        r.reservationNumber.toLowerCase().includes(q) ||
        r.fileReferenceNumber.toLowerCase().includes(q) ||
        r.remarks.toLowerCase().includes(q) ||
        r.issuedBy.toLowerCase().includes(q)
    );
  }, [rows, tableSearch]);

  // KPI Calculations
  const totalQuantity = useMemo(() => {
    return filteredRows.reduce((sum, r) => sum + r.quantity, 0);
  }, [filteredRows]);

  const uniqueEmployeesCount = useMemo(() => {
    const set = new Set(filteredRows.map((r) => r.empNumber).filter((n) => n !== '-'));
    return set.size;
  }, [filteredRows]);

  const uniquePPECount = useMemo(() => {
    const set = new Set(filteredRows.map((r) => r.ppeId).filter((id) => id !== '-'));
    return set.size;
  }, [filteredRows]);

  // Pagination
  const totalPages = Math.ceil(filteredRows.length / pageSize) || 1;
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, currentPage]);

  // Export to Excel
  const handleExportExcel = () => {
    if (filteredRows.length === 0) {
      show({ title: 'No Data', description: 'No records available to export', variant: 'destructive' });
      return;
    }

    try {
      const metadata = [
        ['PPE ISSUES REPORT'],
        ['Generated On', new Date().toLocaleString()],
        ['Filter - Employee', selectedEmpName ? `${selectedEmpNumber} - ${selectedEmpName}` : 'All Employees'],
        ['Filter - PPE Item', selectedPpeName ? `${selectedPpeId} - ${selectedPpeName}` : 'All PPE Items'],
        ['Filter - Date Range', `${dateFrom || 'Earliest'} to ${dateTo || 'Latest'}`],
        ['Filter - Issue Type', issueType.toUpperCase()],
        ['Total Records', filteredRows.length],
        ['Total Quantity Issued', totalQuantity],
        [], // Empty row before data table
      ];

      const headers = [
        'Sl No',
        'Type',
        'Date of Issue',
        'Emp Number',
        'Employee / Receiver Name',
        'PPE ID',
        'PPE Name',
        'Qty Issued',
        'Size',
        'Reservation No',
        'File Ref No',
        'Issued By',
        'Remarks',
      ];

      const dataRows = filteredRows.map((r, i) => [
        i + 1,
        r.type,
        r.date,
        r.empNumber,
        r.empName,
        r.ppeId,
        r.ppeName,
        r.quantity,
        r.size,
        r.reservationNumber,
        r.fileReferenceNumber,
        r.issuedBy,
        r.remarks,
      ]);

      const worksheet = XLSX.utils.aoa_to_sheet([...metadata, headers, ...dataRows]);

      // Set column widths
      worksheet['!cols'] = [
        { wch: 8 },  // Sl No
        { wch: 12 }, // Type
        { wch: 15 }, // Date
        { wch: 15 }, // Emp No
        { wch: 28 }, // Emp Name
        { wch: 15 }, // PPE ID
        { wch: 25 }, // PPE Name
        { wch: 12 }, // Qty
        { wch: 10 }, // Size
        { wch: 18 }, // Res No
        { wch: 18 }, // File Ref
        { wch: 20 }, // Issued By
        { wch: 30 }, // Remarks
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'PPE Issues');

      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `PPE_Issues_Report_${dateStr}.xlsx`;
      XLSX.writeFile(workbook, filename);

      show({
        title: 'Excel Export Complete',
        description: `Exported ${filteredRows.length} records to ${filename}`,
        variant: 'success',
      });
    } catch (err: any) {
      console.error('Error generating Excel file:', err);
      show({
        title: 'Export Failed',
        description: err.message || 'Could not create Excel file',
        variant: 'destructive',
      });
    }
  };

  // Export to PDF
  const handleExportPDF = () => {
    if (filteredRows.length === 0) {
      show({ title: 'No Data', description: 'No records available to export', variant: 'destructive' });
      return;
    }

    try {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let y = 14;

      // Header Banner
      doc.setFillColor(15, 23, 42); // Slate-900
      doc.rect(10, y, pageWidth - 20, 22, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(255, 255, 255);
      doc.text('PPE ISSUES & DISTRIBUTION REPORT', 15, y + 8);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(148, 163, 184); // Slate-400
      const filterSummaryText = `Employee: ${selectedEmpName || 'All'} | PPE: ${selectedPpeName || 'All'} | Period: ${
        dateFrom || 'Start'
      } to ${dateTo || 'End'} | Type: ${issueType.toUpperCase()}`;
      doc.text(filterSummaryText, 15, y + 14);
      doc.text(`Generated: ${new Date().toLocaleString()} | Total Records: ${filteredRows.length} | Total Qty: ${totalQuantity}`, 15, y + 19);

      y += 26;

      // Table Setup
      const columns = [
        { header: '#', width: 10, align: 'center' as const },
        { header: 'Type', width: 18, align: 'left' as const },
        { header: 'Date', width: 22, align: 'left' as const },
        { header: 'Emp #', width: 20, align: 'left' as const },
        { header: 'Employee Name', width: 48, align: 'left' as const },
        { header: 'PPE Name', width: 50, align: 'left' as const },
        { header: 'Qty', width: 14, align: 'center' as const },
        { header: 'Size', width: 14, align: 'center' as const },
        { header: 'Res / Ref #', width: 34, align: 'left' as const },
        { header: 'Issued By', width: 36, align: 'left' as const },
      ];

      const drawTableHeader = (currentY: number) => {
        doc.setFillColor(30, 41, 59); // Slate-800
        doc.rect(10, currentY, pageWidth - 20, 7, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(255, 255, 255);

        let curX = 10;
        columns.forEach((col) => {
          if (col.align === 'center') {
            doc.text(col.header, curX + col.width / 2, currentY + 5, { align: 'center' });
          } else {
            doc.text(col.header, curX + 2, currentY + 5);
          }
          curX += col.width;
        });

        return currentY + 7;
      };

      y = drawTableHeader(y);

      // Data Rows
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);

      filteredRows.forEach((row, index) => {
        // Page overflow check
        if (y > pageHeight - 15) {
          // Footer for previous page
          doc.setFontSize(7);
          doc.setTextColor(100, 116, 139);
          doc.text(`Page ${doc.getNumberOfPages()}`, pageWidth / 2, pageHeight - 6, { align: 'center' });

          doc.addPage();
          y = 12;
          y = drawTableHeader(y);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7.5);
        }

        // Alternating row background
        if (index % 2 === 0) {
          doc.setFillColor(248, 250, 252); // Slate-50
          doc.rect(10, y, pageWidth - 20, 6, 'F');
        }

        doc.setTextColor(30, 41, 59); // Dark slate
        let curX = 10;

        // Sl No
        doc.text(String(index + 1), curX + columns[0].width / 2, y + 4.2, { align: 'center' });
        curX += columns[0].width;

        // Type
        doc.text(row.type, curX + 2, y + 4.2);
        curX += columns[1].width;

        // Date
        doc.text(row.date, curX + 2, y + 4.2);
        curX += columns[2].width;

        // Emp Number
        doc.text(row.empNumber.substring(0, 12), curX + 2, y + 4.2);
        curX += columns[3].width;

        // Emp Name
        doc.text(row.empName.substring(0, 28), curX + 2, y + 4.2);
        curX += columns[4].width;

        // PPE Name
        doc.text(row.ppeName.substring(0, 30), curX + 2, y + 4.2);
        curX += columns[5].width;

        // Quantity
        doc.text(String(row.quantity), curX + columns[6].width / 2, y + 4.2, { align: 'center' });
        curX += columns[6].width;

        // Size
        doc.text(row.size.substring(0, 8), curX + columns[7].width / 2, y + 4.2, { align: 'center' });
        curX += columns[7].width;

        // Res / Ref #
        const refStr = row.reservationNumber !== '-' ? row.reservationNumber : row.fileReferenceNumber;
        doc.text(refStr.substring(0, 20), curX + 2, y + 4.2);
        curX += columns[8].width;

        // Issued By
        doc.text(row.issuedBy.substring(0, 20), curX + 2, y + 4.2);

        y += 6;
      });

      // Final Page Footer
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      const totalPagesCount = doc.getNumberOfPages();
      for (let p = 1; p <= totalPagesCount; p++) {
        doc.setPage(p);
        doc.text(`Page ${p} of ${totalPagesCount} | ScanItSimple PPE Management System`, pageWidth / 2, pageHeight - 6, {
          align: 'center',
        });
      }

      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `PPE_Issues_Report_${dateStr}.pdf`;
      doc.save(filename);

      show({
        title: 'PDF Export Complete',
        description: `Exported ${filteredRows.length} records to ${filename}`,
        variant: 'success',
      });
    } catch (err: any) {
      console.error('Error generating PDF:', err);
      show({
        title: 'PDF Export Failed',
        description: err.message || 'Could not create PDF file',
        variant: 'destructive',
      });
    }
  };

  // Theme-based dynamic styles
  const getStyles = () => {
    switch (theme) {
      case 'glassmorphic':
        return {
          container: 'relative min-h-screen overflow-hidden bg-gradient-to-br from-[#1a2332] via-[#2d3748] to-[#1a2332]',
          card: 'bg-white/10 backdrop-blur-lg border border-white/20 text-white shadow-2xl',
          cardHeader: 'border-b border-white/10',
          title: 'bg-gradient-to-r from-teal-300 via-white to-teal-400 bg-clip-text text-transparent',
          label: 'text-teal-200 text-xs font-semibold uppercase tracking-wider',
          input: 'bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-white/50 focus:ring-teal-400',
          tableHeader: 'bg-white/5 text-teal-300 border-b border-white/10 text-xs font-semibold uppercase',
          tableRow: 'border-b border-white/5 hover:bg-white/10 text-white/90',
          badgeNeutral: 'bg-white/10 text-teal-300 border border-white/20',
          badgeSuccess: 'bg-teal-500/20 text-teal-300 border border-teal-400/30',
          buttonPrimary: 'bg-teal-500/30 hover:bg-teal-500/40 text-teal-200 border border-teal-400/40',
          buttonExcel: 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-400/40',
          buttonPDF: 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-400/40',
          buttonSecondary: 'bg-white/10 hover:bg-white/20 text-white border border-white/20',
          subtext: 'text-white/70',
        };
      case 'light':
        return {
          container: 'relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-gray-100',
          card: 'bg-white border-2 border-blue-200 text-gray-900 shadow-xl',
          cardHeader: 'border-b border-blue-100 bg-blue-50/50',
          title: 'bg-gradient-to-r from-blue-700 to-teal-600 bg-clip-text text-transparent',
          label: 'text-blue-900 text-xs font-semibold uppercase tracking-wider',
          input: 'bg-white border-2 border-blue-200 text-gray-900 placeholder-gray-400 focus:ring-blue-500',
          tableHeader: 'bg-blue-50 text-blue-900 border-b border-blue-200 text-xs font-semibold uppercase',
          tableRow: 'border-b border-gray-200 hover:bg-blue-50/50 text-gray-800',
          badgeNeutral: 'bg-blue-100 text-blue-900 border border-blue-200',
          badgeSuccess: 'bg-emerald-100 text-emerald-900 border border-emerald-300',
          buttonPrimary: 'bg-blue-600 hover:bg-blue-700 text-white border border-blue-700 shadow-sm',
          buttonExcel: 'bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-700 shadow-sm',
          buttonPDF: 'bg-rose-600 hover:bg-rose-700 text-white border border-rose-700 shadow-sm',
          buttonSecondary: 'bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300',
          subtext: 'text-gray-600',
        };
      default: // dark theme
        return {
          container: 'relative min-h-screen overflow-hidden bg-gradient-to-br from-[#0b1120] via-[#151f32] to-[#0b1120]',
          card: 'bg-slate-800/90 border border-slate-700 text-slate-100 shadow-2xl backdrop-blur-md',
          cardHeader: 'border-b border-slate-700 bg-slate-800/50',
          title: 'bg-gradient-to-r from-slate-100 via-teal-300 to-teal-400 bg-clip-text text-transparent',
          label: 'text-teal-300 text-xs font-semibold uppercase tracking-wider',
          input: 'bg-slate-900/80 border border-slate-700 text-slate-100 placeholder-slate-500 focus:ring-teal-400',
          tableHeader: 'bg-slate-900/60 text-teal-300 border-b border-slate-700 text-xs font-semibold uppercase',
          tableRow: 'border-b border-slate-800 hover:bg-slate-700/40 text-slate-200',
          badgeNeutral: 'bg-slate-700 text-teal-300 border border-slate-600',
          badgeSuccess: 'bg-teal-900/40 text-teal-300 border border-teal-500/40',
          buttonPrimary: 'bg-teal-600 hover:bg-teal-500 text-white border border-teal-500 shadow-md',
          buttonExcel: 'bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500 shadow-md',
          buttonPDF: 'bg-rose-600 hover:bg-rose-500 text-white border border-rose-500 shadow-md',
          buttonSecondary: 'bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600',
          subtext: 'text-slate-400',
        };
    }
  };

  const styles = getStyles();

  // Particle background animation
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
    for (let i = 0; i < 35; i++) {
      particlesRef.current.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        radius: Math.random() * 2 + 1,
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

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        if (theme === 'light') {
          ctx.fillStyle = 'rgba(59, 130, 246, 0.25)';
        } else {
          ctx.fillStyle = 'rgba(45, 212, 191, 0.35)';
        }
        ctx.fill();

        particlesRef.current.forEach((otherParticle, j) => {
          if (i !== j) {
            const dx = particle.x - otherParticle.x;
            const dy = particle.y - otherParticle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 110) {
              ctx.beginPath();
              ctx.moveTo(particle.x, particle.y);
              ctx.lineTo(otherParticle.x, otherParticle.y);
              if (theme === 'light') {
                ctx.strokeStyle = `rgba(59, 130, 246, ${0.12 * (1 - distance / 110)})`;
              } else {
                ctx.strokeStyle = `rgba(45, 212, 191, ${0.16 * (1 - distance / 110)})`;
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

    const handleResize = () => resizeCanvas();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [theme]);

  return (
    <div className={styles.container}>
      <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none" />

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-7xl">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300">
                <DocumentArrowDownIcon className="w-7 h-7" />
              </div>
              <div>
                <h1 className={`text-2xl sm:text-3xl font-bold tracking-tight ${styles.title}`}>
                  PPE Reports & Export
                </h1>
                <p className={`text-sm mt-1 ${styles.subtext}`}>
                  Generate, filter, and export PPE issuance records to <span className="font-semibold text-emerald-400">Excel</span> or <span className="font-semibold text-rose-400">PDF</span>
                </p>
              </div>
            </div>

            {/* Quick Export Actions */}
            <div className="flex items-center gap-3">
              <Button
                onClick={handleExportExcel}
                disabled={loading || filteredRows.length === 0}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl ${styles.buttonExcel}`}
              >
                <TableCellsIcon className="w-4 h-4" />
                Download Excel (.xlsx)
              </Button>
              <Button
                onClick={handleExportPDF}
                disabled={loading || filteredRows.length === 0}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl ${styles.buttonPDF}`}
              >
                <DocumentTextIcon className="w-4 h-4" />
                Download PDF (.pdf)
              </Button>
            </div>
          </div>
        </div>

        {/* Filter Card */}
        <Card className={`mb-6 ${styles.card}`}>
          <CardHeader className={`pb-3 ${styles.cardHeader}`}>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FunnelIcon className="w-4 h-4 text-teal-400" />
                Report Filters
              </CardTitle>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className={`text-xs h-7 px-2.5 ${styles.subtext}`}
              >
                <XMarkIcon className="w-3.5 h-3.5 mr-1" />
                Reset Filters
              </Button>
            </div>
          </CardHeader>

          <CardContent className="pt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Employee Filter */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className={styles.label}>By Employee</label>
                  {selectedEmpNumber && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedEmpNumber('');
                        setSelectedEmpName('');
                      }}
                      className="text-[11px] text-red-400 hover:underline"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <SearchableEmployeeSelect
                  value={selectedEmpNumber}
                  initialEmpName={selectedEmpName}
                  onChange={(empNo, empName) => {
                    setSelectedEmpNumber(empNo);
                    setSelectedEmpName(empName);
                  }}
                  placeholder="All employees (or search...)"
                />
              </div>

              {/* PPE Item Filter */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className={styles.label}>By PPE Item</label>
                  {selectedPpeId && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPpeId('');
                        setSelectedPpeName('');
                      }}
                      className="text-[11px] text-red-400 hover:underline"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <SearchablePPESelect
                  value={selectedPpeId}
                  onChange={(id, name) => {
                    setSelectedPpeId(id);
                    setSelectedPpeName(name);
                  }}
                  placeholder="All PPE (e.g. FRC, Boots...)"
                />
              </div>

              {/* Date From */}
              <div>
                <label className={`block mb-1.5 ${styles.label}`}>Date From</label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className={styles.input}
                />
              </div>

              {/* Date To */}
              <div>
                <label className={`block mb-1.5 ${styles.label}`}>Date To</label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className={styles.input}
                />
              </div>
            </div>

            {/* Quick Period Presets & Issue Type Selector */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2 border-t border-white/5">
              {/* Presets */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className={`mr-1 ${styles.subtext}`}>Presets:</span>
                <button
                  type="button"
                  onClick={() => handlePreset('all')}
                  className={`px-2.5 py-1 rounded-lg transition-colors ${
                    !dateFrom && !dateTo
                      ? 'bg-teal-500/20 text-teal-300 font-medium border border-teal-500/40'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  All Time
                </button>
                <button
                  type="button"
                  onClick={() => handlePreset('hist')}
                  className={`px-2.5 py-1 rounded-lg transition-colors ${
                    dateFrom === '2025-04-01' && dateTo === '2026-06-30'
                      ? 'bg-amber-500/20 text-amber-300 font-medium border border-amber-500/40'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  2025-2026 Historical
                </button>
                <button
                  type="button"
                  onClick={() => handlePreset('year')}
                  className={`px-2.5 py-1 rounded-lg transition-colors ${
                    dateFrom === '2026-01-01' && dateTo === '2026-12-31'
                      ? 'bg-teal-500/20 text-teal-300 font-medium border border-teal-500/40'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  This Year (2026)
                </button>
                <button
                  type="button"
                  onClick={() => handlePreset('90days')}
                  className="px-2.5 py-1 rounded-lg bg-white/5 text-slate-300 hover:bg-white/10 transition-colors"
                >
                  Last 90 Days
                </button>
                <button
                  type="button"
                  onClick={() => handlePreset('30days')}
                  className="px-2.5 py-1 rounded-lg bg-white/5 text-slate-300 hover:bg-white/10 transition-colors"
                >
                  Last 30 Days
                </button>
              </div>

              {/* Type and Fetch button */}
              <div className="flex items-center gap-3">
                <select
                  value={issueType}
                  onChange={(e) => setIssueType(e.target.value as any)}
                  className={`text-xs px-3 py-1.5 rounded-lg border focus:outline-none ${styles.input}`}
                >
                  <option value="all">All Issue Types</option>
                  <option value="individual">Individual Issues Only</option>
                  <option value="bulk">Bulk Issues Only</option>
                </select>

                <Button
                  type="button"
                  onClick={fetchReportData}
                  disabled={loading}
                  className={`px-4 py-1.5 text-xs font-semibold rounded-lg ${styles.buttonPrimary}`}
                >
                  <ArrowPathIcon className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
                  {loading ? 'Fetching...' : 'Apply Filters'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className={styles.card}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-3 rounded-xl bg-teal-500/20 text-teal-300">
                <DocumentTextIcon className="w-5 h-5" />
              </div>
              <div>
                <p className={`text-xs ${styles.subtext}`}>Total Records</p>
                <h3 className="text-xl font-bold tracking-tight text-white">{filteredRows.length}</h3>
              </div>
            </CardContent>
          </Card>

          <Card className={styles.card}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-300">
                <ArchiveBoxIcon className="w-5 h-5" />
              </div>
              <div>
                <p className={`text-xs ${styles.subtext}`}>Total Qty Issued</p>
                <h3 className="text-xl font-bold tracking-tight text-white">{totalQuantity}</h3>
              </div>
            </CardContent>
          </Card>

          <Card className={styles.card}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-3 rounded-xl bg-blue-500/20 text-blue-300">
                <UsersIcon className="w-5 h-5" />
              </div>
              <div>
                <p className={`text-xs ${styles.subtext}`}>Unique Employees</p>
                <h3 className="text-xl font-bold tracking-tight text-white">{uniqueEmployeesCount}</h3>
              </div>
            </CardContent>
          </Card>

          <Card className={styles.card}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-3 rounded-xl bg-amber-500/20 text-amber-300">
                <ShieldCheckIcon className="w-5 h-5" />
              </div>
              <div>
                <p className={`text-xs ${styles.subtext}`}>PPE Item Types</p>
                <h3 className="text-xl font-bold tracking-tight text-white">{uniquePPECount}</h3>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Data Table Card */}
        <Card className={styles.card}>
          <CardHeader className={`pb-3 ${styles.cardHeader}`}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <TableCellsIcon className="w-5 h-5 text-teal-400" />
                Report Records ({filteredRows.length})
              </CardTitle>

              {/* Table search filter */}
              <div className="w-full sm:w-64">
                <Input
                  type="text"
                  value={tableSearch}
                  onChange={(e) => {
                    setTableSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search in table..."
                  className={`h-8 text-xs ${styles.input}`}
                />
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {loading ? (
              <div className="py-16 text-center">
                <ArrowPathIcon className="w-8 h-8 mx-auto animate-spin text-teal-400 mb-3" />
                <p className="text-sm font-medium">Loading report records...</p>
              </div>
            ) : filteredRows.length === 0 ? (
              <div className="py-16 text-center">
                <ArchiveBoxIcon className="w-10 h-10 mx-auto text-slate-500 mb-2" />
                <h4 className="text-sm font-semibold">No records found</h4>
                <p className={`text-xs max-w-sm mx-auto mt-1 ${styles.subtext}`}>
                  Try adjusting the employee, PPE item, or date range filters to view records.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className={styles.tableHeader}>
                      <th className="py-3 px-3">#</th>
                      <th className="py-3 px-3">Type</th>
                      <th className="py-3 px-3">Date</th>
                      <th className="py-3 px-3">Employee / Receiver</th>
                      <th className="py-3 px-3">PPE ID & Name</th>
                      <th className="py-3 px-3 text-center">Qty</th>
                      <th className="py-3 px-3">Size</th>
                      <th className="py-3 px-3">Ref / Res #</th>
                      <th className="py-3 px-3">Issued By</th>
                      <th className="py-3 px-3">Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRows.map((row) => (
                      <tr key={row.id} className={styles.tableRow}>
                        <td className="py-2.5 px-3 font-mono text-slate-400">{row.slNo}</td>
                        <td className="py-2.5 px-3">
                          <Badge
                            variant="default"
                            className={
                              row.type === 'Individual'
                                ? 'bg-teal-500/20 text-teal-300 border border-teal-400/30'
                                : 'bg-purple-500/20 text-purple-300 border border-purple-400/30'
                            }
                          >
                            {row.type}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-3 font-medium whitespace-nowrap text-amber-300">
                          {row.date}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-medium text-white">{row.empName}</div>
                          {row.empNumber !== '-' && (
                            <div className="text-[11px] text-slate-400 font-mono">{row.empNumber}</div>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-teal-300">{row.ppeName}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{row.ppeId}</div>
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-white">
                          {row.quantity}
                        </td>
                        <td className="py-2.5 px-3">{row.size}</td>
                        <td className="py-2.5 px-3">
                          {row.reservationNumber !== '-' && (
                            <div className="text-[11px]">Res: {row.reservationNumber}</div>
                          )}
                          {row.fileReferenceNumber !== '-' && (
                            <div className="text-[11px] text-slate-400">Ref: {row.fileReferenceNumber}</div>
                          )}
                          {row.reservationNumber === '-' && row.fileReferenceNumber === '-' && '-'}
                        </td>
                        <td className="py-2.5 px-3 text-slate-300">{row.issuedBy}</td>
                        <td className="py-2.5 px-3 italic text-slate-400 max-w-xs truncate">
                          {row.remarks || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {filteredRows.length > pageSize && (
              <div className="p-4 border-t border-white/10 flex items-center justify-between text-xs">
                <span className={styles.subtext}>
                  Showing {(currentPage - 1) * pageSize + 1} to{' '}
                  {Math.min(currentPage * pageSize, filteredRows.length)} of {filteredRows.length} records
                </span>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className={`h-7 px-2.5 text-xs ${styles.buttonSecondary}`}
                  >
                    <ChevronLeftIcon className="w-3.5 h-3.5 mr-1" />
                    Previous
                  </Button>
                  <span className="font-mono text-teal-300 px-2">
                    {currentPage} / {totalPages}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
                    className={`h-7 px-2.5 text-xs ${styles.buttonSecondary}`}
                  >
                    Next
                    <ChevronRightIcon className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
