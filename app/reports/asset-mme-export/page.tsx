'use client';

import { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toaster';
import SearchableEmployeeSelect from '@/components/SearchableEmployeeSelect';
import { useAppTheme } from '@/app/contexts/ThemeContext';
import {
  DocumentArrowDownIcon,
  TableCellsIcon,
  DocumentTextIcon,
  FunnelIcon,
  ArrowPathIcon,
  BuildingOfficeIcon,
  BeakerIcon,
  ArchiveBoxIcon,
  BuildingLibraryIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeIcon,
  ClockIcon,
  MapPinIcon,
  UserIcon,
} from '@heroicons/react/24/outline';

interface CustodyItem {
  _id: string;
  employeenumber: string;
  employeename: string;
  locationType: string;
  city: string;
  project: string;
  custodyfrom: string | null;
  custodyto: string | null;
  documentnumber: string;
  remarks: string;
}

interface CalibrationItem {
  _id: string;
  calibrationRequired: string;
  calibratedby: string;
  calibrationdate: string | null;
  calibrationtodate: string | null;
  calibrationpo: string;
  calibcertificate: string;
}

interface ComprehensiveAssetRow {
  _id: string;
  assetnumber: string;
  scope: 'MME' | 'Fixed Asset';
  assetdescription: string;
  assetcategory: string;
  assetsubcategory: string;
  assetstatus: string;
  assetmanufacturer: string;
  assetmodel: string;
  assetserialnumber: string;
  acquireddate: string | null;
  acquiredvalue: number;
  legacyassetnumber: string;
  accessories: string;
  assetnotes: string;
  anyotheridentifier: string;

  hasCustodian: boolean;
  currentCustodian: {
    employeenumber: string;
    employeename: string;
    locationType: string;
    city: string;
    project: string;
    premises: string;
    details: string;
    custodyfrom: string | null;
    documentnumber: string;
    remarks: string;
  } | null;

  custodyCount: number;
  custodyHistory: CustodyItem[];

  calibrationStatus: 'Active' | 'Expired' | 'Not Required' | 'In Idle Period' | 'Uncalibrated';
  latestCalibration: {
    _id: string;
    calibrationRequired: string;
    calibratedby: string;
    calibrationdate: string | null;
    calibrationtodate: string | null;
    calibrationpo: string;
    calibcertificate: string;
    idlePeriodFrom: string | null;
    idlePeriodTo: string | null;
  } | null;

  calibrationCount: number;
  calibrationHistory: CalibrationItem[];
}

function ComprehensiveAssetExportContent() {
  const { theme } = useAppTheme();
  const { show } = useToast();
  const searchParams = useSearchParams();

  // Filter States
  const [scope, setScope] = useState<'all' | 'mme' | 'fixedasset'>('all');
  const [search, setSearch] = useState('');
  const [locationType, setLocationType] = useState('');
  const [city, setCity] = useState('');
  const [project, setProject] = useState('');
  const [selectedEmpNumber, setSelectedEmpNumber] = useState('');
  const [selectedEmpName, setSelectedEmpName] = useState('');
  const [calibrationStatus, setCalibrationStatus] = useState('');
  const [dateType, setDateType] = useState<'acquired' | 'custody' | 'calibration' | 'any'>('acquired');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Data & Table States
  const [records, setRecords] = useState<ComprehensiveAssetRow[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [summary, setSummary] = useState({
    totalAssets: 0,
    mmeCount: 0,
    fixedAssetCount: 0,
    warehouseCount: 0,
    projectCount: 0,
    calibratedCount: 0,
    expiredCalibCount: 0,
  });

  // Modal inspection state
  const [inspectRecord, setInspectRecord] = useState<ComprehensiveAssetRow | null>(null);

  const pageSize = 25;

  // Canvas particle animation
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Array<{ x: number; y: number; vx: number; vy: number; radius: number }>>([]);
  const animationFrameRef = useRef<number>();

  // Initialize scope from URL parameter if passed (e.g. ?scope=mme)
  useEffect(() => {
    const scopeParam = searchParams?.get('scope');
    if (scopeParam === 'mme' || scopeParam === 'fixedasset') {
      setScope(scopeParam);
    }
  }, [searchParams]);

  // Fetch data
  const fetchData = async (pageToFetch = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('scope', scope);
      if (search) params.set('search', search);
      if (locationType) params.set('locationType', locationType);
      if (city) params.set('city', city);
      if (project) params.set('project', project);
      if (selectedEmpNumber) params.set('employee', selectedEmpNumber);
      else if (selectedEmpName) params.set('employee', selectedEmpName);
      if (calibrationStatus) params.set('calibrationStatus', calibrationStatus);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      params.set('dateType', dateType);
      params.set('page', String(pageToFetch));
      params.set('limit', String(pageSize));

      const res = await fetch(`/api/reports/asset-mme-comprehensive?${params.toString()}`);
      const json = await res.json();

      if (json.success && json.data) {
        setRecords(json.data.records);
        setTotalRecords(json.data.total);
        setCurrentPage(json.data.page);
        if (json.data.summary) {
          setSummary(json.data.summary);
        }
      } else {
        throw new Error(json.error || 'Failed to load records');
      }
    } catch (err: any) {
      console.error('Error loading comprehensive report data:', err);
      show({
        title: 'Error loading data',
        description: err.message || 'Could not fetch asset records',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(1);
  }, [scope, locationType, calibrationStatus]);

  // Reset Filters
  const handleResetFilters = () => {
    setScope('all');
    setSearch('');
    setLocationType('');
    setCity('');
    setProject('');
    setSelectedEmpNumber('');
    setSelectedEmpName('');
    setCalibrationStatus('');
    setDateType('acquired');
    setDateFrom('');
    setDateTo('');
    setCurrentPage(1);
  };

  // Quick Date Presets
  const handleDatePreset = (preset: 'all' | 'hist' | 'year' | '90days' | '30days') => {
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

  // Fetch all filtered records for export
  const fetchAllForExport = async (): Promise<ComprehensiveAssetRow[]> => {
    const params = new URLSearchParams();
    params.set('scope', scope);
    if (search) params.set('search', search);
    if (locationType) params.set('locationType', locationType);
    if (city) params.set('city', city);
    if (project) params.set('project', project);
    if (selectedEmpNumber) params.set('employee', selectedEmpNumber);
    else if (selectedEmpName) params.set('employee', selectedEmpName);
    if (calibrationStatus) params.set('calibrationStatus', calibrationStatus);
    if (dateFrom) params.set('dateFrom', dateFrom);
    if (dateTo) params.set('dateTo', dateTo);
    params.set('dateType', dateType);
    params.set('exportAll', 'true');

    const res = await fetch(`/api/reports/asset-mme-comprehensive?${params.toString()}`);
    const json = await res.json();
    if (!json.success || !json.data?.records) {
      throw new Error(json.error || 'Failed to export records');
    }
    return json.data.records;
  };

  // Helper date formatter
  const formatDateStr = (dStr: string | null | undefined) => {
    if (!dStr) return '-';
    const d = new Date(dStr);
    if (Number.isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // Multi-Sheet Excel Export
  const handleExportExcel = async () => {
    try {
      setExportLoading(true);
      const allRows = await fetchAllForExport();

      if (allRows.length === 0) {
        show({ title: 'No Data', description: 'No records available to export', variant: 'destructive' });
        return;
      }

      const workbook = XLSX.utils.book_new();

      // ================= SHEET 1: Master Summary =================
      const summaryMetadata = [
        ['COMPREHENSIVE ASSET & MME CONSOLIDATED REPORT'],
        ['Generated On', new Date().toLocaleString()],
        ['Scope Filter', scope.toUpperCase()],
        ['Location Type', locationType ? locationType.toUpperCase() : 'ALL LOCATIONS'],
        ['City / Warehouse', city || 'ALL'],
        ['Project', project || 'ALL'],
        ['Custodian Filter', selectedEmpName ? `${selectedEmpNumber} - ${selectedEmpName}` : 'ALL'],
        ['Calibration Status', calibrationStatus ? calibrationStatus.toUpperCase() : 'ALL'],
        ['Date Range', `${dateFrom || 'Start'} to ${dateTo || 'End'} (Filter: ${dateType.toUpperCase()})`],
        ['Total Assets Exported', allRows.length],
        [],
      ];

      const summaryHeaders = [
        'Sl No',
        'Asset Number',
        'Scope',
        'Description',
        'Category',
        'Subcategory',
        'Status',
        'Manufacturer',
        'Model',
        'Serial Number',
        'Acquired Date',
        'Acquired Value',
        'Custodian Emp No',
        'Custodian Name',
        'Location Type',
        'City / Warehouse',
        'Project Name',
        'Premises / Shed / Room / Rack',
        'Custody From Date',
        'Gatepass / Doc No',
        'Calibration Status',
        'Calibrated By',
        'Calibration Date',
        'Valid Till Date',
        'Calibration PO',
        'Total Custody Transfers',
        'Total Calibrations Count',
        'Asset Notes',
        'Remarks',
      ];

      const summaryDataRows = allRows.map((r, i) => [
        i + 1,
        r.assetnumber,
        r.scope,
        r.assetdescription,
        r.assetcategory,
        r.assetsubcategory,
        r.assetstatus,
        r.assetmanufacturer,
        r.assetmodel,
        r.assetserialnumber,
        formatDateStr(r.acquireddate),
        r.acquiredvalue || '',
        r.currentCustodian?.employeenumber || 'Without Custodian',
        r.currentCustodian?.employeename || 'Without Custodian',
        r.currentCustodian?.locationType || '-',
        r.currentCustodian?.city || '-',
        r.currentCustodian?.project || '-',
        [r.currentCustodian?.premises, r.currentCustodian?.details].filter(Boolean).join(' | ') || '-',
        formatDateStr(r.currentCustodian?.custodyfrom),
        r.currentCustodian?.documentnumber || '-',
        r.calibrationStatus,
        r.latestCalibration?.calibratedby || '-',
        formatDateStr(r.latestCalibration?.calibrationdate),
        formatDateStr(r.latestCalibration?.calibrationtodate),
        r.latestCalibration?.calibrationpo || '-',
        r.custodyCount,
        r.calibrationCount,
        r.assetnotes || '-',
        r.currentCustodian?.remarks || '-',
      ]);

      const wsSummary = XLSX.utils.aoa_to_sheet([...summaryMetadata, summaryHeaders, ...summaryDataRows]);
      wsSummary['!cols'] = [
        { wch: 8 },  // Sl No
        { wch: 16 }, // Asset No
        { wch: 14 }, // Scope
        { wch: 32 }, // Description
        { wch: 18 }, // Category
        { wch: 18 }, // Subcategory
        { wch: 14 }, // Status
        { wch: 18 }, // Manufacturer
        { wch: 18 }, // Model
        { wch: 18 }, // Serial No
        { wch: 14 }, // Acq Date
        { wch: 14 }, // Acq Value
        { wch: 18 }, // Custodian No
        { wch: 28 }, // Custodian Name
        { wch: 16 }, // Location Type
        { wch: 18 }, // City / Warehouse
        { wch: 24 }, // Project
        { wch: 28 }, // Premises / Details
        { wch: 16 }, // Custody From
        { wch: 18 }, // Gatepass
        { wch: 16 }, // Calib Status
        { wch: 22 }, // Calibrated By
        { wch: 14 }, // Calib Date
        { wch: 14 }, // Valid Till
        { wch: 16 }, // Calib PO
        { wch: 12 }, // Transfers Count
        { wch: 12 }, // Calibrations Count
        { wch: 24 }, // Notes
        { wch: 24 }, // Remarks
      ];
      XLSX.utils.book_append_sheet(workbook, wsSummary, 'Master Summary');

      // ================= SHEET 2: Custody History =================
      const custodyHeaders = [
        'Sl No',
        'Asset Number',
        'Scope',
        'Asset Description',
        'Record Status',
        'Custodian Emp No',
        'Custodian Name',
        'Location Type',
        'City / Warehouse',
        'Project Name',
        'Custody From Date',
        'Custody To Date',
        'Gatepass / Doc No',
        'Remarks / Details',
      ];

      const custodyRows: any[][] = [];
      let custodyIndex = 1;

      allRows.forEach((r) => {
        // Current Custody
        if (r.currentCustodian) {
          custodyRows.push([
            custodyIndex++,
            r.assetnumber,
            r.scope,
            r.assetdescription,
            'CURRENT (OPEN)',
            r.currentCustodian.employeenumber,
            r.currentCustodian.employeename,
            r.currentCustodian.locationType,
            r.currentCustodian.city,
            r.currentCustodian.project,
            formatDateStr(r.currentCustodian.custodyfrom),
            'Present',
            r.currentCustodian.documentnumber || '-',
            [r.currentCustodian.premises, r.currentCustodian.details, r.currentCustodian.remarks].filter(Boolean).join(' - '),
          ]);
        }

        // History Custodies
        r.custodyHistory.forEach((c) => {
          custodyRows.push([
            custodyIndex++,
            r.assetnumber,
            r.scope,
            r.assetdescription,
            'PREVIOUS (CLOSED)',
            c.employeenumber,
            c.employeename,
            c.locationType,
            c.city,
            c.project,
            formatDateStr(c.custodyfrom),
            formatDateStr(c.custodyto),
            c.documentnumber || '-',
            c.remarks || '-',
          ]);
        });
      });

      const wsCustody = XLSX.utils.aoa_to_sheet([
        ['COMPLETE CUSTODY AUDIT TRAIL (CURRENT & HISTORICAL)'],
        [`Generated: ${new Date().toLocaleString()} | Total Custody Records: ${custodyRows.length}`],
        [],
        custodyHeaders,
        ...custodyRows,
      ]);
      wsCustody['!cols'] = [
        { wch: 8 },  // Sl No
        { wch: 16 }, // Asset No
        { wch: 14 }, // Scope
        { wch: 28 }, // Description
        { wch: 20 }, // Record Status
        { wch: 18 }, // Custodian No
        { wch: 26 }, // Custodian Name
        { wch: 16 }, // Location Type
        { wch: 18 }, // City
        { wch: 24 }, // Project
        { wch: 16 }, // Custody From
        { wch: 16 }, // Custody To
        { wch: 18 }, // Doc No
        { wch: 32 }, // Remarks
      ];
      XLSX.utils.book_append_sheet(workbook, wsCustody, 'Custody History');

      // ================= SHEET 3: Calibration History =================
      const calibHeaders = [
        'Sl No',
        'Asset Number',
        'Scope',
        'Asset Description',
        'Certificate Status',
        'Calibration Required',
        'Calibrated By (Company)',
        'Calibration Date',
        'Valid Till Date',
        'PO Number',
        'Certificate Reference',
      ];

      const calibRows: any[][] = [];
      let calibIndex = 1;

      allRows.forEach((r) => {
        // Latest Calibration
        if (r.latestCalibration) {
          calibRows.push([
            calibIndex++,
            r.assetnumber,
            r.scope,
            r.assetdescription,
            r.calibrationStatus.toUpperCase(),
            r.latestCalibration.calibrationRequired,
            r.latestCalibration.calibratedby || '-',
            formatDateStr(r.latestCalibration.calibrationdate),
            formatDateStr(r.latestCalibration.calibrationtodate),
            r.latestCalibration.calibrationpo || '-',
            r.latestCalibration.calibcertificate || '-',
          ]);
        }

        // History Calibrations
        r.calibrationHistory.forEach((c) => {
          calibRows.push([
            calibIndex++,
            r.assetnumber,
            r.scope,
            r.assetdescription,
            'EXPIRED / HISTORICAL',
            c.calibrationRequired,
            c.calibratedby || '-',
            formatDateStr(c.calibrationdate),
            formatDateStr(c.calibrationtodate),
            c.calibrationpo || '-',
            c.calibcertificate || '-',
          ]);
        });
      });

      const wsCalib = XLSX.utils.aoa_to_sheet([
        ['COMPLETE CALIBRATION RECORDS & CERTIFICATE HISTORY'],
        [`Generated: ${new Date().toLocaleString()} | Total Calibration Records: ${calibRows.length}`],
        [],
        calibHeaders,
        ...calibRows,
      ]);
      wsCalib['!cols'] = [
        { wch: 8 },  // Sl No
        { wch: 16 }, // Asset No
        { wch: 14 }, // Scope
        { wch: 28 }, // Description
        { wch: 22 }, // Cert Status
        { wch: 18 }, // Required
        { wch: 26 }, // Calibrated By
        { wch: 16 }, // Calib Date
        { wch: 16 }, // Valid Till
        { wch: 18 }, // PO No
        { wch: 24 }, // Cert Ref
      ];
      XLSX.utils.book_append_sheet(workbook, wsCalib, 'Calibration History');

      // Write & download file
      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `Asset_MME_Comprehensive_Report_${dateStr}.xlsx`;
      XLSX.writeFile(workbook, filename);

      show({
        title: 'Excel Export Succeeded',
        description: `Exported 3-sheet report with ${allRows.length} assets to ${filename}`,
        variant: 'success',
      });
    } catch (err: any) {
      console.error('Error during Excel export:', err);
      show({
        title: 'Export Failed',
        description: err.message || 'Could not export Excel file',
        variant: 'destructive',
      });
    } finally {
      setExportLoading(false);
    }
  };

  // PDF Export
  const handleExportPDF = async () => {
    try {
      setExportLoading(true);
      const allRows = await fetchAllForExport();

      if (allRows.length === 0) {
        show({ title: 'No Data', description: 'No records available to export', variant: 'destructive' });
        return;
      }

      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let y = 12;

      // Header Banner
      doc.setFillColor(15, 23, 42); // Slate-900
      doc.rect(10, y, pageWidth - 20, 22, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(255, 255, 255);
      doc.text('COMPREHENSIVE ASSET & MME INVENTORY & CUSTODY REPORT', 15, y + 8);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(148, 163, 184); // Slate-400
      const filterSummaryText = `Scope: ${scope.toUpperCase()} | Location: ${locationType || 'All'} | City: ${
        city || 'All'
      } | Project: ${project || 'All'} | Custodian: ${selectedEmpName || 'All'} | Calib: ${
        calibrationStatus || 'All'
      }`;
      doc.text(filterSummaryText, 15, y + 14);
      doc.text(
        `Generated: ${new Date().toLocaleString()} | Total Assets: ${allRows.length} | MME: ${
          summary.mmeCount
        } | Fixed Assets: ${summary.fixedAssetCount}`,
        15,
        y + 19
      );

      y += 26;

      const columns = [
        { header: '#', width: 10, align: 'center' as const },
        { header: 'Asset #', width: 20, align: 'left' as const },
        { header: 'Type', width: 18, align: 'left' as const },
        { header: 'Description', width: 44, align: 'left' as const },
        { header: 'Current Custodian', width: 42, align: 'left' as const },
        { header: 'Location / Project', width: 44, align: 'left' as const },
        { header: 'Custody Date', width: 22, align: 'left' as const },
        { header: 'Calib Status', width: 24, align: 'center' as const },
        { header: 'Valid Till', width: 22, align: 'left' as const },
        { header: 'Transfers', width: 16, align: 'center' as const },
        { header: 'Calibs', width: 15, align: 'center' as const },
      ];

      const drawTableHeader = (currentY: number) => {
        doc.setFillColor(30, 41, 59); // Slate-800
        doc.rect(10, currentY, pageWidth - 20, 7, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
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

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);

      allRows.forEach((row, index) => {
        if (y > pageHeight - 15) {
          doc.setFontSize(7);
          doc.setTextColor(100, 116, 139);
          doc.text(`Page ${doc.getNumberOfPages()}`, pageWidth / 2, pageHeight - 6, { align: 'center' });

          doc.addPage();
          y = 12;
          y = drawTableHeader(y);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7);
        }

        if (index % 2 === 0) {
          doc.setFillColor(248, 250, 252);
          doc.rect(10, y, pageWidth - 20, 6, 'F');
        }

        doc.setTextColor(30, 41, 59);
        let curX = 10;

        // Sl No
        doc.text(String(index + 1), curX + columns[0].width / 2, y + 4.2, { align: 'center' });
        curX += columns[0].width;

        // Asset No
        doc.setFont('helvetica', 'bold');
        doc.text(row.assetnumber, curX + 2, y + 4.2);
        doc.setFont('helvetica', 'normal');
        curX += columns[1].width;

        // Scope
        doc.text(row.scope, curX + 2, y + 4.2);
        curX += columns[2].width;

        // Description
        doc.text(row.assetdescription.substring(0, 26), curX + 2, y + 4.2);
        curX += columns[3].width;

        // Custodian
        const custText = row.currentCustodian
          ? `${row.currentCustodian.employeename.substring(0, 18)} (${row.currentCustodian.employeenumber})`
          : 'Without Custodian';
        doc.text(custText, curX + 2, y + 4.2);
        curX += columns[4].width;

        // Location / Project
        const locText = row.currentCustodian?.project
          ? `Proj: ${row.currentCustodian.project.substring(0, 16)}`
          : row.currentCustodian?.city
          ? `WH: ${row.currentCustodian.city.substring(0, 16)}`
          : '-';
        doc.text(locText, curX + 2, y + 4.2);
        curX += columns[5].width;

        // Custody Date
        doc.text(formatDateStr(row.currentCustodian?.custodyfrom), curX + 2, y + 4.2);
        curX += columns[6].width;

        // Calib Status
        doc.text(row.calibrationStatus, curX + columns[7].width / 2, y + 4.2, { align: 'center' });
        curX += columns[7].width;

        // Valid Till
        doc.text(formatDateStr(row.latestCalibration?.calibrationtodate), curX + 2, y + 4.2);
        curX += columns[8].width;

        // Transfers Count
        doc.text(String(row.custodyCount), curX + columns[9].width / 2, y + 4.2, { align: 'center' });
        curX += columns[9].width;

        // Calibs Count
        doc.text(String(row.calibrationCount), curX + columns[10].width / 2, y + 4.2, { align: 'center' });

        y += 6;
      });

      const totalPagesCount = doc.getNumberOfPages();
      for (let p = 1; p <= totalPagesCount; p++) {
        doc.setPage(p);
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        doc.text(`Page ${p} of ${totalPagesCount} | ScanItSimple Asset & MME Management System`, pageWidth / 2, pageHeight - 6, {
          align: 'center',
        });
      }

      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `Asset_MME_Report_${dateStr}.pdf`;
      doc.save(filename);

      show({
        title: 'PDF Export Complete',
        description: `Exported ${allRows.length} assets to ${filename}`,
        variant: 'success',
      });
    } catch (err: any) {
      console.error('Error during PDF export:', err);
      show({
        title: 'PDF Export Failed',
        description: err.message || 'Could not generate PDF file',
        variant: 'destructive',
      });
    } finally {
      setExportLoading(false);
    }
  };

  // Theme styling
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
          badgeWarning: 'bg-amber-500/20 text-amber-300 border border-amber-400/30',
          badgeError: 'bg-red-500/20 text-red-300 border border-red-400/30',
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
          badgeWarning: 'bg-amber-100 text-amber-900 border border-amber-300',
          badgeError: 'bg-red-100 text-red-900 border border-red-300',
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
          badgeWarning: 'bg-amber-900/40 text-amber-300 border border-amber-500/40',
          badgeError: 'bg-red-900/40 text-red-300 border border-red-500/40',
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

  const totalPages = Math.ceil(totalRecords / pageSize) || 1;

  return (
    <div className={styles.container}>
      <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none" />

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-7xl">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-teal-500/20 border border-teal-400/40 text-teal-300">
                <DocumentArrowDownIcon className="w-7 h-7" />
              </div>
              <div>
                <h1 className={`text-2xl sm:text-3xl font-bold tracking-tight ${styles.title}`}>
                  Comprehensive Asset & MME Report
                </h1>
                <p className={`text-sm mt-1 ${styles.subtext}`}>
                  Unified query & export engine for <span className="font-semibold text-teal-300">MME</span> and{' '}
                  <span className="font-semibold text-blue-300">Fixed Assets</span> with complete custody & calibration history
                </p>
              </div>
            </div>

            {/* Quick Export Actions */}
            <div className="flex items-center gap-3">
              <Button
                onClick={handleExportExcel}
                disabled={loading || exportLoading || totalRecords === 0}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl ${styles.buttonExcel}`}
              >
                {exportLoading ? (
                  <ArrowPathIcon className="w-4 h-4 animate-spin" />
                ) : (
                  <TableCellsIcon className="w-4 h-4" />
                )}
                Download 3-Sheet Excel (.xlsx)
              </Button>
              <Button
                onClick={handleExportPDF}
                disabled={loading || exportLoading || totalRecords === 0}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl ${styles.buttonPDF}`}
              >
                {exportLoading ? (
                  <ArrowPathIcon className="w-4 h-4 animate-spin" />
                ) : (
                  <DocumentTextIcon className="w-4 h-4" />
                )}
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
                Report & Search Filters
              </CardTitle>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className={`text-xs h-7 px-2.5 ${styles.subtext}`}
              >
                <XMarkIcon className="w-3.5 h-3.5 mr-1" />
                Reset All Filters
              </Button>
            </div>
          </CardHeader>

          <CardContent className="pt-4 space-y-4">
            {/* Scope Toggle & General Search */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              {/* Scope Selector */}
              <div>
                <label className={`block mb-1.5 ${styles.label}`}>Asset Scope</label>
                <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-900/60 border border-slate-700/80">
                  <button
                    type="button"
                    onClick={() => setScope('all')}
                    className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      scope === 'all'
                        ? 'bg-teal-500 text-white shadow-md'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    Both (MME & FA)
                  </button>
                  <button
                    type="button"
                    onClick={() => setScope('mme')}
                    className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      scope === 'mme'
                        ? 'bg-teal-500 text-white shadow-md'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    MME Only (5/9)
                  </button>
                  <button
                    type="button"
                    onClick={() => setScope('fixedasset')}
                    className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      scope === 'fixedasset'
                        ? 'bg-teal-500 text-white shadow-md'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    Fixed Assets
                  </button>
                </div>
              </div>

              {/* Text Search */}
              <div className="md:col-span-2">
                <label className={`block mb-1.5 ${styles.label}`}>Keyword Search</label>
                <Input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by Asset #, Description, Manufacturer, Model, Serial #, Custodian..."
                  className={styles.input}
                />
              </div>
            </div>

            {/* Location, City, Project & Custodian */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Location Type */}
              <div>
                <label className={`block mb-1.5 ${styles.label}`}>Location Type</label>
                <select
                  value={locationType}
                  onChange={(e) => setLocationType(e.target.value)}
                  className={`w-full text-xs px-3 py-2 rounded-xl border focus:outline-none ${styles.input}`}
                >
                  <option value="">All Location Types</option>
                  <option value="warehouse">Warehouse</option>
                  <option value="project_site">Project Site</option>
                  <option value="camp/office">Camp / Office</option>
                  <option value="department">Department</option>
                  <option value="without_custodian">Without Custodian</option>
                </select>
              </div>

              {/* Warehouse / City */}
              <div>
                <label className={`block mb-1.5 ${styles.label}`}>Warehouse / City</label>
                <Input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Dammam, Riyadh, Al-Khobar..."
                  className={styles.input}
                />
              </div>

              {/* Project */}
              <div>
                <label className={`block mb-1.5 ${styles.label}`}>Project / WBS</label>
                <Input
                  type="text"
                  value={project}
                  onChange={(e) => setProject(e.target.value)}
                  placeholder="e.g. Plant Expansion, Pipeline..."
                  className={styles.input}
                />
              </div>

              {/* Custodian Employee */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className={styles.label}>Custodian</label>
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
                  placeholder="Search custodian employee..."
                />
              </div>
            </div>

            {/* Calibration Status & Date Range Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end pt-2 border-t border-white/5">
              {/* Calibration Status */}
              <div>
                <label className={`block mb-1.5 ${styles.label}`}>Calibration Status</label>
                <select
                  value={calibrationStatus}
                  onChange={(e) => setCalibrationStatus(e.target.value)}
                  className={`w-full text-xs px-3 py-2 rounded-xl border focus:outline-none ${styles.input}`}
                >
                  <option value="">All Calibration Statuses</option>
                  <option value="active">Active / Calibrated</option>
                  <option value="expired">Expired Calibration</option>
                  <option value="not_required">Not Required</option>
                  <option value="idle">In Idle Period</option>
                  <option value="uncalibrated">Uncalibrated</option>
                </select>
              </div>

              {/* Date Field Type */}
              <div>
                <label className={`block mb-1.5 ${styles.label}`}>Date Field to Filter</label>
                <select
                  value={dateType}
                  onChange={(e) => setDateType(e.target.value as any)}
                  className={`w-full text-xs px-3 py-2 rounded-xl border focus:outline-none ${styles.input}`}
                >
                  <option value="acquired">Acquisition Date</option>
                  <option value="custody">Custody From Date</option>
                  <option value="calibration">Calibration Expiry Date</option>
                  <option value="any">Any of the Above Dates</option>
                </select>
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

            {/* Quick Presets & Submit Action */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className={`mr-1 ${styles.subtext}`}>Quick Dates:</span>
                <button
                  type="button"
                  onClick={() => handleDatePreset('all')}
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
                  onClick={() => handleDatePreset('hist')}
                  className={`px-2.5 py-1 rounded-lg transition-colors ${
                    dateFrom === '2025-04-01' && dateTo === '2026-06-30'
                      ? 'bg-amber-500/20 text-amber-300 font-medium border border-amber-500/40'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  2025–2026 Period
                </button>
                <button
                  type="button"
                  onClick={() => handleDatePreset('year')}
                  className="px-2.5 py-1 rounded-lg bg-white/5 text-slate-300 hover:bg-white/10 transition-colors"
                >
                  This Year (2026)
                </button>
                <button
                  type="button"
                  onClick={() => handleDatePreset('90days')}
                  className="px-2.5 py-1 rounded-lg bg-white/5 text-slate-300 hover:bg-white/10 transition-colors"
                >
                  Last 90 Days
                </button>
                <button
                  type="button"
                  onClick={() => handleDatePreset('30days')}
                  className="px-2.5 py-1 rounded-lg bg-white/5 text-slate-300 hover:bg-white/10 transition-colors"
                >
                  Last 30 Days
                </button>
              </div>

              <Button
                type="button"
                onClick={() => fetchData(1)}
                disabled={loading}
                className={`px-6 py-2 text-xs font-semibold rounded-xl ${styles.buttonPrimary}`}
              >
                <ArrowPathIcon className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Searching...' : 'Apply Filters'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* KPI Summaries */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
          <Card className={styles.card}>
            <CardContent className="p-3">
              <p className={`text-[11px] ${styles.subtext}`}>Total Assets</p>
              <h3 className="text-lg font-bold text-white mt-0.5">{summary.totalAssets}</h3>
            </CardContent>
          </Card>

          <Card className={styles.card}>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <p className={`text-[11px] ${styles.subtext}`}>MME</p>
                <BeakerIcon className="w-4 h-4 text-teal-400" />
              </div>
              <h3 className="text-lg font-bold text-teal-300 mt-0.5">{summary.mmeCount}</h3>
            </CardContent>
          </Card>

          <Card className={styles.card}>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <p className={`text-[11px] ${styles.subtext}`}>Fixed Assets</p>
                <BuildingOfficeIcon className="w-4 h-4 text-blue-400" />
              </div>
              <h3 className="text-lg font-bold text-blue-300 mt-0.5">{summary.fixedAssetCount}</h3>
            </CardContent>
          </Card>

          <Card className={styles.card}>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <p className={`text-[11px] ${styles.subtext}`}>In Warehouse</p>
                <ArchiveBoxIcon className="w-4 h-4 text-amber-400" />
              </div>
              <h3 className="text-lg font-bold text-amber-300 mt-0.5">{summary.warehouseCount}</h3>
            </CardContent>
          </Card>

          <Card className={styles.card}>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <p className={`text-[11px] ${styles.subtext}`}>In Projects</p>
                <BuildingLibraryIcon className="w-4 h-4 text-purple-400" />
              </div>
              <h3 className="text-lg font-bold text-purple-300 mt-0.5">{summary.projectCount}</h3>
            </CardContent>
          </Card>

          <Card className={styles.card}>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <p className={`text-[11px] ${styles.subtext}`}>Calibrated</p>
                <CheckCircleIcon className="w-4 h-4 text-emerald-400" />
              </div>
              <h3 className="text-lg font-bold text-emerald-300 mt-0.5">{summary.calibratedCount}</h3>
            </CardContent>
          </Card>

          <Card className={styles.card}>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <p className={`text-[11px] ${styles.subtext}`}>Expired Calib</p>
                <ExclamationTriangleIcon className="w-4 h-4 text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-red-300 mt-0.5">{summary.expiredCalibCount}</h3>
            </CardContent>
          </Card>
        </div>

        {/* Master Consolidated Table */}
        <Card className={styles.card}>
          <CardHeader className={`pb-3 ${styles.cardHeader}`}>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <TableCellsIcon className="w-5 h-5 text-teal-400" />
                Asset & MME Records ({totalRecords})
              </CardTitle>
              <span className={`text-xs ${styles.subtext}`}>
                Showing page {currentPage} of {totalPages}
              </span>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {loading ? (
              <div className="py-20 text-center">
                <ArrowPathIcon className="w-8 h-8 mx-auto animate-spin text-teal-400 mb-3" />
                <p className="text-sm font-medium">Querying assets, custody, and calibration history...</p>
              </div>
            ) : records.length === 0 ? (
              <div className="py-20 text-center">
                <ArchiveBoxIcon className="w-10 h-10 mx-auto text-slate-500 mb-2" />
                <h4 className="text-sm font-semibold">No assets found</h4>
                <p className={`text-xs max-w-sm mx-auto mt-1 ${styles.subtext}`}>
                  Try clearing or adjusting filters to find assets.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className={styles.tableHeader}>
                      <th className="py-3 px-3">#</th>
                      <th className="py-3 px-3">Asset Number</th>
                      <th className="py-3 px-3">Scope</th>
                      <th className="py-3 px-3">Description / Model</th>
                      <th className="py-3 px-3">Current Custodian</th>
                      <th className="py-3 px-3">Location / Project</th>
                      <th className="py-3 px-3 text-center">Calibration</th>
                      <th className="py-3 px-3 text-center">History</th>
                      <th className="py-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((row, idx) => {
                      const itemNumber = (currentPage - 1) * pageSize + idx + 1;
                      const detailHref = row.scope === 'MME' ? `/asset/${row.assetnumber}` : `/fixedasset/${row.assetnumber}`;

                      return (
                        <tr key={row._id} className={styles.tableRow}>
                          <td className="py-3 px-3 font-mono text-slate-400">{itemNumber}</td>

                          {/* Asset Number with Link */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <Link
                              href={detailHref}
                              target="_blank"
                              className="font-bold font-mono text-teal-300 hover:text-teal-200 hover:underline flex items-center gap-1"
                            >
                              {row.assetnumber}
                            </Link>
                            {row.assetserialnumber && (
                              <div className="text-[10px] text-slate-400 font-mono">SN: {row.assetserialnumber}</div>
                            )}
                          </td>

                          {/* Scope Badge */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <Badge
                              variant="default"
                              className={
                                row.scope === 'MME'
                                  ? 'bg-teal-500/20 text-teal-300 border border-teal-400/30'
                                  : 'bg-blue-500/20 text-blue-300 border border-blue-400/30'
                              }
                            >
                              {row.scope}
                            </Badge>
                          </td>

                          {/* Description & Manufacturer/Model */}
                          <td className="py-3 px-3 max-w-xs">
                            <div className="font-semibold text-white truncate">{row.assetdescription || '-'}</div>
                            <div className="text-[11px] text-slate-400">
                              {[row.assetmanufacturer, row.assetmodel].filter(Boolean).join(' • ') || row.assetcategory || '-'}
                            </div>
                          </td>

                          {/* Custodian */}
                          <td className="py-3 px-3 max-w-[200px]">
                            {row.currentCustodian ? (
                              <div>
                                <div className="font-medium text-white truncate">{row.currentCustodian.employeename}</div>
                                <div className="text-[11px] text-slate-400 font-mono">
                                  {row.currentCustodian.employeenumber} • From: {formatDateStr(row.currentCustodian.custodyfrom)}
                                </div>
                              </div>
                            ) : (
                              <span className="text-amber-400 font-medium">Without Custodian</span>
                            )}
                          </td>

                          {/* Location & Project */}
                          <td className="py-3 px-3 max-w-[220px]">
                            {row.currentCustodian ? (
                              <div>
                                <div className="font-medium text-teal-200 truncate">
                                  {row.currentCustodian.project
                                    ? `Proj: ${row.currentCustodian.project}`
                                    : row.currentCustodian.city
                                    ? `City: ${row.currentCustodian.city}`
                                    : row.currentCustodian.locationType}
                                </div>
                                <div className="text-[11px] text-slate-400 truncate">
                                  {[row.currentCustodian.locationType, row.currentCustodian.premises, row.currentCustodian.details]
                                    .filter(Boolean)
                                    .join(' - ')}
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-500">-</span>
                            )}
                          </td>

                          {/* Calibration Status Badge */}
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <Badge
                              variant="default"
                              className={
                                row.calibrationStatus === 'Active'
                                  ? styles.badgeSuccess
                                  : row.calibrationStatus === 'Expired'
                                  ? styles.badgeError
                                  : row.calibrationStatus === 'In Idle Period'
                                  ? styles.badgeWarning
                                  : styles.badgeNeutral
                              }
                            >
                              {row.calibrationStatus}
                            </Badge>
                            {row.latestCalibration?.calibrationtodate && row.calibrationStatus !== 'Not Required' && (
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                Valid: {formatDateStr(row.latestCalibration.calibrationtodate)}
                              </div>
                            )}
                          </td>

                          {/* Historical Counts */}
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              <span
                                className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[11px] font-mono text-teal-300"
                                title="Past Custody Transfers"
                              >
                                {row.custodyCount} Cust
                              </span>
                              <span
                                className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[11px] font-mono text-purple-300"
                                title="Past Calibration Cycles"
                              >
                                {row.calibrationCount} Cal
                              </span>
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-3 text-right whitespace-nowrap">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => setInspectRecord(row)}
                              className={`h-7 px-2.5 text-xs flex items-center gap-1 ${styles.buttonSecondary}`}
                            >
                              <EyeIcon className="w-3.5 h-3.5" />
                              View History
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {totalRecords > pageSize && (
              <div className="p-4 border-t border-white/10 flex items-center justify-between text-xs">
                <span className={styles.subtext}>
                  Showing {(currentPage - 1) * pageSize + 1} to{' '}
                  {Math.min(currentPage * pageSize, totalRecords)} of {totalRecords} records
                </span>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => fetchData(currentPage - 1)}
                    disabled={currentPage === 1 || loading}
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
                    onClick={() => fetchData(currentPage + 1)}
                    disabled={currentPage >= totalPages || loading}
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

      {/* DETAILED INSPECTION MODAL */}
      {inspectRecord && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className={`w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border p-6 shadow-2xl ${styles.card}`}>
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-white/10 mb-6">
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold font-mono text-teal-300">{inspectRecord.assetnumber}</span>
                  <Badge
                    variant="default"
                    className={
                      inspectRecord.scope === 'MME'
                        ? 'bg-teal-500/20 text-teal-300 border border-teal-400/30'
                        : 'bg-blue-500/20 text-blue-300 border border-blue-400/30'
                    }
                  >
                    {inspectRecord.scope}
                  </Badge>
                  <Badge variant="default" className={styles.badgeNeutral}>
                    {inspectRecord.assetstatus}
                  </Badge>
                </div>
                <h3 className="text-base font-semibold text-white mt-1">{inspectRecord.assetdescription}</h3>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setInspectRecord(null)}
                className="h-8 w-8 p-0 rounded-full text-slate-400 hover:text-white"
              >
                <XMarkIcon className="w-5 h-5" />
              </Button>
            </div>

            {/* Master Specifications */}
            <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-white/5 border border-white/10 text-xs">
              <div>
                <span className={styles.subtext}>Manufacturer:</span>
                <p className="font-semibold text-white mt-0.5">{inspectRecord.assetmanufacturer || '-'}</p>
              </div>
              <div>
                <span className={styles.subtext}>Model:</span>
                <p className="font-semibold text-white mt-0.5">{inspectRecord.assetmodel || '-'}</p>
              </div>
              <div>
                <span className={styles.subtext}>Serial Number:</span>
                <p className="font-semibold font-mono text-white mt-0.5">{inspectRecord.assetserialnumber || '-'}</p>
              </div>
              <div>
                <span className={styles.subtext}>Acquisition Date:</span>
                <p className="font-semibold text-white mt-0.5">{formatDateStr(inspectRecord.acquireddate)}</p>
              </div>
              <div>
                <span className={styles.subtext}>Category:</span>
                <p className="font-semibold text-white mt-0.5">{inspectRecord.assetcategory || '-'}</p>
              </div>
              <div>
                <span className={styles.subtext}>Subcategory:</span>
                <p className="font-semibold text-white mt-0.5">{inspectRecord.assetsubcategory || '-'}</p>
              </div>
              <div>
                <span className={styles.subtext}>Acquired Value:</span>
                <p className="font-semibold text-white mt-0.5">
                  {inspectRecord.acquiredvalue ? `SAR ${inspectRecord.acquiredvalue.toLocaleString()}` : '-'}
                </p>
              </div>
              <div>
                <span className={styles.subtext}>Legacy Asset #:</span>
                <p className="font-semibold text-white mt-0.5">{inspectRecord.legacyassetnumber || '-'}</p>
              </div>
            </div>

            {/* Current Custody Card */}
            <div className="mb-6 p-4 rounded-xl bg-teal-500/10 border border-teal-500/30">
              <h4 className="text-sm font-semibold text-teal-300 mb-2 flex items-center gap-2">
                <UserIcon className="w-4 h-4" />
                Active / Current Custody
              </h4>
              {inspectRecord.currentCustodian ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className={styles.subtext}>Custodian:</span>
                    <p className="font-semibold text-white mt-0.5">
                      {inspectRecord.currentCustodian.employeename} ({inspectRecord.currentCustodian.employeenumber})
                    </p>
                  </div>
                  <div>
                    <span className={styles.subtext}>Location Type:</span>
                    <p className="font-semibold text-white mt-0.5">{inspectRecord.currentCustodian.locationType}</p>
                  </div>
                  <div>
                    <span className={styles.subtext}>Project / City:</span>
                    <p className="font-semibold text-white mt-0.5">
                      {inspectRecord.currentCustodian.project || inspectRecord.currentCustodian.city || '-'}
                    </p>
                  </div>
                  <div>
                    <span className={styles.subtext}>Custody From:</span>
                    <p className="font-semibold text-white mt-0.5">
                      {formatDateStr(inspectRecord.currentCustodian.custodyfrom)}
                    </p>
                  </div>
                  {inspectRecord.currentCustodian.documentnumber && (
                    <div>
                      <span className={styles.subtext}>Gatepass / Doc #:</span>
                      <p className="font-semibold text-white mt-0.5">{inspectRecord.currentCustodian.documentnumber}</p>
                    </div>
                  )}
                  {inspectRecord.currentCustodian.details && (
                    <div className="col-span-3">
                      <span className={styles.subtext}>Premises / Rack / Bin:</span>
                      <p className="font-semibold text-white mt-0.5">{inspectRecord.currentCustodian.details}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-amber-400 font-medium">This asset is currently without a custodian.</p>
              )}
            </div>

            {/* Previous Custody History Table */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                <ClockIcon className="w-4 h-4 text-purple-400" />
                Previous Custody History ({inspectRecord.custodyHistory.length})
              </h4>
              {inspectRecord.custodyHistory.length === 0 ? (
                <p className={`text-xs p-3 rounded-lg bg-white/5 ${styles.subtext}`}>No previous custody transfers recorded.</p>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-white/10">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-white/5 text-slate-300">
                      <tr>
                        <th className="p-2.5">Custodian</th>
                        <th className="p-2.5">Type</th>
                        <th className="p-2.5">Location / Project</th>
                        <th className="p-2.5">From Date</th>
                        <th className="p-2.5">To Date</th>
                        <th className="p-2.5">Doc #</th>
                        <th className="p-2.5">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {inspectRecord.custodyHistory.map((h) => (
                        <tr key={h._id} className="hover:bg-white/5">
                          <td className="p-2.5 font-medium text-white">
                            {h.employeename} ({h.employeenumber})
                          </td>
                          <td className="p-2.5">{h.locationType}</td>
                          <td className="p-2.5">{h.project || h.city || '-'}</td>
                          <td className="p-2.5">{formatDateStr(h.custodyfrom)}</td>
                          <td className="p-2.5">{formatDateStr(h.custodyto)}</td>
                          <td className="p-2.5">{h.documentnumber || '-'}</td>
                          <td className="p-2.5 italic text-slate-400 max-w-xs truncate">{h.remarks || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Calibration Records History Table */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                <CheckCircleIcon className="w-4 h-4 text-emerald-400" />
                Calibration Records History ({inspectRecord.calibrationCount})
              </h4>
              {inspectRecord.calibrationCount === 0 ? (
                <p className={`text-xs p-3 rounded-lg bg-white/5 ${styles.subtext}`}>No calibration certificates on file.</p>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-white/10">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-white/5 text-slate-300">
                      <tr>
                        <th className="p-2.5">Status</th>
                        <th className="p-2.5">Calibrated By</th>
                        <th className="p-2.5">Calibration Date</th>
                        <th className="p-2.5">Valid Till Date</th>
                        <th className="p-2.5">PO Number</th>
                        <th className="p-2.5">Certificate Ref</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {inspectRecord.latestCalibration && (
                        <tr className="bg-emerald-500/10 font-medium">
                          <td className="p-2.5">
                            <Badge variant="default" className={styles.badgeSuccess}>
                              CURRENT: {inspectRecord.calibrationStatus}
                            </Badge>
                          </td>
                          <td className="p-2.5 text-white">{inspectRecord.latestCalibration.calibratedby || '-'}</td>
                          <td className="p-2.5">{formatDateStr(inspectRecord.latestCalibration.calibrationdate)}</td>
                          <td className="p-2.5 text-emerald-300 font-bold">
                            {formatDateStr(inspectRecord.latestCalibration.calibrationtodate)}
                          </td>
                          <td className="p-2.5">{inspectRecord.latestCalibration.calibrationpo || '-'}</td>
                          <td className="p-2.5">{inspectRecord.latestCalibration.calibcertificate || '-'}</td>
                        </tr>
                      )}
                      {inspectRecord.calibrationHistory.map((cal) => (
                        <tr key={cal._id} className="hover:bg-white/5 text-slate-300">
                          <td className="p-2.5">
                            <span className="text-slate-400">EXPIRED</span>
                          </td>
                          <td className="p-2.5">{cal.calibratedby || '-'}</td>
                          <td className="p-2.5">{formatDateStr(cal.calibrationdate)}</td>
                          <td className="p-2.5">{formatDateStr(cal.calibrationtodate)}</td>
                          <td className="p-2.5">{cal.calibrationpo || '-'}</td>
                          <td className="p-2.5">{cal.calibcertificate || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-6 mt-6 border-t border-white/10 flex items-center justify-between">
              <Link
                href={inspectRecord.scope === 'MME' ? `/asset/${inspectRecord.assetnumber}` : `/fixedasset/${inspectRecord.assetnumber}`}
                target="_blank"
                className={`px-4 py-2 text-xs font-semibold rounded-xl ${styles.buttonPrimary}`}
              >
                Open Full Asset Record Page →
              </Link>

              <Button
                type="button"
                onClick={() => setInspectRecord(null)}
                className={`px-5 py-2 text-xs font-semibold rounded-xl ${styles.buttonSecondary}`}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ComprehensiveAssetExportPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Loading Asset Reports...</div>}>
      <ComprehensiveAssetExportContent />
    </Suspense>
  );
}
