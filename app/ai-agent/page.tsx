'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/toaster';
import { useAppTheme } from '@/app/contexts/ThemeContext';
import {
  SparklesIcon,
  TableCellsIcon,
  ChartBarIcon,
  DocumentTextIcon,
  CommandLineIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  LightBulbIcon,
  PaperAirplaneIcon,
  ArrowDownTrayIcon,
  ClockIcon,
  ShieldCheckIcon,
  InformationCircleIcon,
  XMarkIcon,
  XCircleIcon,
  PrinterIcon,
  TrashIcon,
  CpuChipIcon,
  AcademicCapIcon,
  PlusIcon,
  BookmarkIcon,
} from '@heroicons/react/24/outline';

const CHART_COLORS = [
  '#2dd4bf', // Teal
  '#38bdf8', // Sky
  '#a78bfa', // Violet
  '#f472b6', // Pink
  '#fbbf24', // Amber
  '#34d399', // Emerald
  '#fb923c', // Orange
  '#818cf8', // Indigo
  '#f87171', // Red
  '#a3e635', // Lime
];

const STARTER_PROMPTS = [
  {
    title: 'Assets by Category',
    prompt: 'Show total count of assets by category as a bar chart',
    icon: ChartBarIcon,
  },
  {
    title: 'Expired Calibrations',
    prompt: 'List all assets with expired calibration along with custodian name and project in a table',
    icon: ExclamationTriangleIcon,
  },
  {
    title: 'Warehouse Equipment',
    prompt: 'Show warehouse equipment count by city breakdown in a pie chart',
    icon: ChartBarIcon,
  },
  {
    title: 'PPE Distribution',
    prompt: 'Show PPE issues distribution by PPE item name as a bar chart',
    icon: ShieldCheckIcon,
  },
  {
    title: 'Top 10 High Value Assets',
    prompt: 'List the top 10 highest value assets with manufacturer, serial number, and current custodian',
    icon: TableCellsIcon,
  },
  {
    title: 'Unassigned Equipment',
    prompt: 'List all MME equipment without a custodian currently in warehouses',
    icon: InformationCircleIcon,
  },
];

interface QueryResult {
  prompt: string;
  timestamp: string;
  step1: {
    explanation: string;
    plan: any;
    recordsCount: number;
  };
  step2: {
    validationReview: {
      isAccurate: boolean;
      confidence: string;
      notes: string;
    };
    summaryMarkdown: string;
    table: {
      columns: { key: string; label: string }[];
      rows: Record<string, any>[];
    } | null;
    chart: {
      type: 'bar' | 'pie' | 'line' | 'area';
      title: string;
      xAxisKey: string;
      dataKeys: string[];
      data: Record<string, any>[];
    } | null;
    suggestedFollowUps: string[];
  };
  rawResults: any[];
}

export interface MemoryRuleItem {
  _id: string;
  topic: string;
  rule: string;
  promptContext?: string;
  createdAt: string;
  createdBy?: string;
}

export default function AIAgentPage() {
  const { data: session } = useSession();
  const { theme } = useAppTheme();
  const { show } = useToast();

  const [promptInput, setPromptInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<1 | 2 | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'table' | 'chart' | 'audit'>('summary');
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [history, setHistory] = useState<QueryResult[]>([]);
  const [tableSearch, setTableSearch] = useState('');
  const [tablePage, setTablePage] = useState(1);
  const tablePageSize = 15;

  // Agent Memory & Feedback States (restricted to AI Admins)
  const [isAiAdmin, setIsAiAdmin] = useState(false);
  const [memoryModalOpen, setMemoryModalOpen] = useState(false);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [memoryRules, setMemoryRules] = useState<MemoryRuleItem[]>([]);
  const [loadingMemory, setLoadingMemory] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [savingFeedback, setSavingFeedback] = useState(false);
  const [newTopic, setNewTopic] = useState('');
  const [newRule, setNewRule] = useState('');
  const [savingRule, setSavingRule] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Array<{ x: number; y: number; vx: number; vy: number; radius: number }>>([]);
  const animationFrameRef = useRef<number>();

  // Fetch memory rules and admin status
  const fetchMemoryRules = async () => {
    try {
      setLoadingMemory(true);
      const res = await fetch('/api/ai-agent/memory');
      const json = await res.json();
      if (json.success && json.data) {
        if (json.data.rules) setMemoryRules(json.data.rules);
        setIsAiAdmin(Boolean(json.data.isAiAdmin));
      }
    } catch (err: any) {
      console.warn('Failed to load memory rules:', err);
    } finally {
      setLoadingMemory(false);
    }
  };

  useEffect(() => {
    fetchMemoryRules();
  }, [session?.user?.email]);

  // Submit User Correction / Feedback on Active Query
  const handleSaveFeedback = async () => {
    if (!feedbackText.trim() || !queryResult) return;

    try {
      setSavingFeedback(true);
      const res = await fetch('/api/ai-agent/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'learn_feedback',
          userPrompt: queryResult.prompt,
          userCorrection: feedbackText.trim(),
          queryPlan: queryResult.step1.plan,
        }),
      });

      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || 'Failed to save feedback');
      }

      show({
        title: 'Correction Learned!',
        description: `Agent saved rule: [${json.data.topic}] "${json.data.rule}"`,
        variant: 'success',
      });

      setFeedbackText('');
      setFeedbackModalOpen(false);
      fetchMemoryRules();
    } catch (err: any) {
      show({
        title: 'Failed to Save Correction',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setSavingFeedback(false);
    }
  };

  // Add Manual Memory Rule
  const handleAddManualRule = async () => {
    if (!newRule.trim()) return;

    try {
      setSavingRule(true);
      const res = await fetch('/api/ai-agent/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: newTopic.trim() || 'Custom Rule',
          rule: newRule.trim(),
        }),
      });

      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || 'Failed to add rule');
      }

      show({
        title: 'Memory Rule Added',
        description: 'New knowledge rule saved to database',
        variant: 'success',
      });

      setNewTopic('');
      setNewRule('');
      fetchMemoryRules();
    } catch (err: any) {
      show({
        title: 'Failed to Add Rule',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setSavingRule(false);
    }
  };

  // Delete Memory Rule
  const handleDeleteRule = async (id: string) => {
    try {
      const res = await fetch(`/api/ai-agent/memory?id=${id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || 'Failed to delete rule');
      }

      show({
        title: 'Rule Deleted',
        description: 'Memory rule removed from agent knowledge',
        variant: 'success',
      });

      setMemoryRules((prev) => prev.filter((r) => r._id !== id));
    } catch (err: any) {
      show({
        title: 'Failed to Delete Rule',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  const handleClearQuery = () => {
    setQueryResult(null);
    setErrorMessage(null);
    setTableSearch('');
    setTablePage(1);
  };

  const handleRunQuery = async (queryText: string) => {
    const text = queryText.trim();
    if (!text) {
      show({ title: 'Input Required', description: 'Please enter a question or prompt', variant: 'destructive' });
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);
      setCurrentStep(1);

      // Step 1 Simulation progress state
      const stepTimer = setTimeout(() => {
        setCurrentStep(2);
      }, 2500);

      const res = await fetch('/api/ai-agent/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: text }),
      });

      clearTimeout(stepTimer);

      if (!res.ok) {
        const rawText = await res.text();
        if (
          res.status === 504 ||
          rawText.includes('FUNCTION_INVOCATION_TIMEOUT') ||
          rawText.includes('504 Gateway Time-out') ||
          rawText.includes('timeout')
        ) {
          throw new Error('Query timed out on the server (Vercel timeout). Please try a more specific question or retry.');
        }
        try {
          const errJson = JSON.parse(rawText);
          throw new Error(errJson.error || `Server error (${res.status})`);
        } catch (e: any) {
          if (e.message && !e.message.startsWith('Unexpected') && !e.message.startsWith('JSON') && !e.message.includes('pattern')) {
            throw e;
          }
          throw new Error(`Server returned an error (${res.status}). Please retry.`);
        }
      }

      let json: any;
      try {
        json = await res.json();
      } catch (jsonErr) {
        throw new Error('Could not parse response from server. Please retry.');
      }

      if (!json.success || !json.data) {
        throw new Error(json.error || 'Failed to process AI query');
      }

      const result: QueryResult = {
        ...json.data,
        timestamp: new Date().toLocaleTimeString(),
      };

      setQueryResult(result);
      setHistory((prev) => [result, ...prev.slice(0, 9)]);
      setPromptInput('');
      setTablePage(1);
      setTableSearch('');

      // Auto-switch to chart tab if chart was specifically requested/generated, else summary
      if (result.step2.chart && (text.toLowerCase().includes('chart') || text.toLowerCase().includes('graph') || text.toLowerCase().includes('plot'))) {
        setActiveTab('chart');
      } else if (result.step2.table && text.toLowerCase().includes('table')) {
        setActiveTab('table');
      } else {
        setActiveTab('summary');
      }

      show({
        title: 'Query Completed',
        description: `Verified with 2-step validation. Found ${result.step1.recordsCount} records.`,
        variant: 'success',
      });
    } catch (err: any) {
      console.error('AI Query Error:', err);
      const cleanMsg = err.message || 'Could not execute AI query';
      setErrorMessage(cleanMsg);
      show({
        title: 'Query Failed',
        description: cleanMsg.length > 180 ? `${cleanMsg.slice(0, 180)}...` : cleanMsg,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setCurrentStep(null);
    }
  };

  // Export Table to Excel
  const handleExportExcel = () => {
    if (!queryResult?.step2.table?.rows?.length) {
      show({ title: 'No Data', description: 'No table rows to export', variant: 'destructive' });
      return;
    }

    try {
      const { columns, rows } = queryResult.step2.table;
      const headers = columns.map((c) => c.label);
      const dataRows = rows.map((r) => columns.map((c) => r[c.key] ?? ''));

      const metadata = [
        ['SMARTTAGS AI AGENT QUERY REPORT'],
        ['User Prompt', queryResult.prompt],
        ['Execution Date', new Date().toLocaleString()],
        ['Validation Confidence', queryResult.step2.validationReview.confidence],
        ['Total Records', rows.length],
        [],
      ];

      const worksheet = XLSX.utils.aoa_to_sheet([...metadata, headers, ...dataRows]);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'AI Query Results');

      const filename = `AI_Query_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, filename);

      show({ title: 'Excel Exported', description: `Saved ${rows.length} rows to ${filename}`, variant: 'success' });
    } catch (err: any) {
      show({ title: 'Export Failed', description: err.message, variant: 'destructive' });
    }
  };

  // Export Summary, Chart & Full Table to PDF
  const handleExportPDF = () => {
    if (!queryResult) {
      show({ title: 'No Data', description: 'No query result available to export', variant: 'destructive' });
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
      doc.text('SMARTTAGS AI AGENT QUERY REPORT', 15, y + 8);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(148, 163, 184); // Slate-400
      const promptSnippet = queryResult.prompt.length > 115 ? `${queryResult.prompt.slice(0, 115)}...` : queryResult.prompt;
      doc.text(`Prompt: "${promptSnippet}"`, 15, y + 14);
      doc.text(
        `Generated: ${new Date().toLocaleString()} | Total Records: ${queryResult.step1.recordsCount} | Confidence: ${queryResult.step2.validationReview.confidence}`,
        15,
        y + 19
      );

      y += 28;

      // Section 1: Executive Summary & Insights
      doc.setFillColor(30, 41, 59); // Slate-800
      doc.rect(10, y, pageWidth - 20, 7, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      doc.text('EXECUTIVE SUMMARY & KEY INSIGHTS', 15, y + 5);
      y += 11;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(30, 41, 59);

      // Clean markdown tags for PDF rendering
      const cleanSummary = queryResult.step2.summaryMarkdown
        .replace(/#{1,6}\s?/g, '')
        .replace(/\*\*/g, '')
        .replace(/\*/g, '')
        .replace(/`/g, '');

      const splitSummary = doc.splitTextToSize(cleanSummary, pageWidth - 30);
      splitSummary.slice(0, 16).forEach((line: string) => {
        if (y > pageHeight - 15) {
          doc.addPage();
          y = 15;
        }
        doc.text(line, 15, y);
        y += 4.5;
      });

      y += 4;

      // Section 2: Chart Breakdown (if chart present)
      if (queryResult.step2.chart) {
        if (y > pageHeight - 35) {
          doc.addPage();
          y = 15;
        }

        doc.setFillColor(30, 41, 59);
        doc.rect(10, y, pageWidth - 20, 7, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(255, 255, 255);
        doc.text(
          `DATA VISUALIZATION: ${queryResult.step2.chart.title || 'Chart Aggregates'} (${queryResult.step2.chart.type.toUpperCase()})`,
          15,
          y + 5
        );
        y += 11;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(51, 65, 85);

        const dataPoints = (queryResult.step2.chart.data || [])
          .slice(0, 10)
          .map((d: any) => `${d[queryResult.step2.chart!.xAxisKey] || 'Item'}: ${d[queryResult.step2.chart!.dataKeys?.[0] || 'count'] ?? d.value ?? ''}`)
          .join('   |   ');

        doc.text(dataPoints || 'Chart distribution plotted.', 15, y);
        y += 7;
      }

      // Section 3: Data Table
      if (queryResult.step2.table && queryResult.step2.table.columns.length > 0) {
        if (y > pageHeight - 40) {
          doc.addPage();
          y = 15;
        }

        const tableCols = queryResult.step2.table.columns.slice(0, 8); // Top 8 columns
        const colWidth = Math.floor((pageWidth - 20) / tableCols.length);

        const drawTableHeader = (currY: number) => {
          doc.setFillColor(30, 41, 59);
          doc.rect(10, currY, pageWidth - 20, 7, 'F');
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8);
          doc.setTextColor(255, 255, 255);

          tableCols.forEach((col, idx) => {
            doc.text(col.label.slice(0, 18), 12 + idx * colWidth, currY + 5);
          });
          return currY + 7;
        };

        y = drawTableHeader(y);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);

        const exportRows = queryResult.step2.table.rows;
        exportRows.forEach((row, rowIndex) => {
          if (y > pageHeight - 15) {
            doc.setFontSize(7);
            doc.setTextColor(100, 116, 139);
            doc.text(`Page ${doc.getNumberOfPages()} | SmartTags Enterprise Asset Management`, pageWidth / 2, pageHeight - 6, { align: 'center' });
            doc.addPage();
            y = 15;
            y = drawTableHeader(y);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7.5);
          }

          if (rowIndex % 2 === 0) {
            doc.setFillColor(248, 250, 252);
            doc.rect(10, y, pageWidth - 20, 6, 'F');
          }

          doc.setTextColor(15, 23, 42);
          tableCols.forEach((col, idx) => {
            const val = String(row[col.key] ?? '').replace(/[\r\n]+/g, ' ');
            doc.text(val.slice(0, 24), 12 + idx * colWidth, y + 4.2);
          });

          y += 6;
        });
      }

      // Page footer
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(`Page ${doc.getNumberOfPages()} | SmartTags Enterprise Asset Management`, pageWidth / 2, pageHeight - 6, { align: 'center' });

      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `SmartTags_AI_Report_${dateStr}.pdf`;
      doc.save(filename);

      show({
        title: 'PDF Export Complete',
        description: `Downloaded AI report to ${filename}`,
        variant: 'success',
      });
    } catch (pdfErr: any) {
      console.error('PDF export error:', pdfErr);
      show({
        title: 'PDF Export Failed',
        description: pdfErr.message || 'Could not generate PDF report',
        variant: 'destructive',
      });
    }
  };

  // Filtered table rows
  const filteredTableRows = useMemo(() => {
    if (!queryResult?.step2.table) return [];
    const { columns, rows } = queryResult.step2.table;
    if (!tableSearch.trim()) return rows;
    const q = tableSearch.toLowerCase().trim();
    return rows.filter((row) =>
      columns.some((col) => String(row[col.key] || '').toLowerCase().includes(q))
    );
  }, [queryResult, tableSearch]);

  const totalTablePages = Math.ceil(filteredTableRows.length / tablePageSize) || 1;
  const paginatedTableRows = useMemo(() => {
    const start = (tablePage - 1) * tablePageSize;
    return filteredTableRows.slice(start, start + tablePageSize);
  }, [filteredTableRows, tablePage]);

  // Canvas particle animation
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
          badgeSuccess: 'bg-teal-500/20 text-teal-300 border border-teal-400/30',
          badgeWarning: 'bg-amber-500/20 text-amber-300 border border-amber-400/30',
          badgeMuted: 'bg-white/10 text-white/80 border border-white/20',
          buttonPrimary: 'bg-teal-500/30 hover:bg-teal-500/40 text-teal-200 border border-teal-400/40',
          buttonSecondary: 'bg-white/10 hover:bg-white/20 text-white border border-white/20',
          tabActive: 'bg-teal-500 text-white shadow-md',
          tabInactive: 'text-white/70 hover:text-white hover:bg-white/10',
          textHeading: 'text-white',
          textBody: 'text-slate-200',
          subtext: 'text-white/70',
          prose: 'prose prose-invert max-w-none text-sm leading-relaxed text-slate-200 whitespace-pre-wrap font-sans',
          auditorBox: 'bg-white/5 border border-white/10 text-slate-300',
          auditorLabel: 'text-teal-300',
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
          badgeSuccess: 'bg-emerald-100 text-emerald-900 border border-emerald-300 font-semibold',
          badgeWarning: 'bg-amber-100 text-amber-900 border border-amber-300 font-semibold',
          badgeMuted: 'bg-slate-100 text-slate-800 border border-slate-300 font-medium',
          buttonPrimary: 'bg-blue-600 hover:bg-blue-700 text-white border border-blue-700 shadow-sm',
          buttonSecondary: 'bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300',
          tabActive: 'bg-blue-600 text-white shadow-md font-semibold',
          tabInactive: 'text-slate-600 hover:text-slate-900 hover:bg-blue-50 font-medium',
          textHeading: 'text-slate-900',
          textBody: 'text-slate-800',
          subtext: 'text-gray-600',
          prose: 'prose max-w-none text-sm leading-relaxed text-slate-800 whitespace-pre-wrap font-sans font-normal',
          auditorBox: 'bg-blue-50/80 border border-blue-200 text-slate-800 shadow-sm',
          auditorLabel: 'text-blue-700 font-semibold',
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
          badgeSuccess: 'bg-teal-900/40 text-teal-300 border border-teal-500/40',
          badgeWarning: 'bg-amber-900/40 text-amber-300 border border-amber-500/40',
          badgeMuted: 'bg-slate-700/60 text-slate-200 border border-slate-600',
          buttonPrimary: 'bg-teal-600 hover:bg-teal-500 text-white border border-teal-500 shadow-md',
          buttonSecondary: 'bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600',
          tabActive: 'bg-teal-500 text-white shadow-md',
          tabInactive: 'text-slate-400 hover:text-slate-100 hover:bg-slate-700/50',
          textHeading: 'text-white',
          textBody: 'text-slate-200',
          subtext: 'text-slate-400',
          prose: 'prose prose-invert max-w-none text-sm leading-relaxed text-slate-200 whitespace-pre-wrap font-sans',
          auditorBox: 'bg-slate-900/60 border border-slate-700 text-slate-300',
          auditorLabel: 'text-teal-300',
        };
    }
  };

  const styles = getStyles();

  return (
    <div className={styles.container}>
      <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none" />

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-7xl">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-teal-500/20 border border-teal-400/40 text-teal-300">
                <SparklesIcon className="w-7 h-7" />
              </div>
              <div>
                <h1 className={`text-2xl sm:text-3xl font-bold tracking-tight ${styles.title}`}>
                  AI Natural Language Query Agent
                </h1>
                <p className={`text-sm mt-1 ${styles.subtext}`}>
                  Ask questions in plain English to analyze <span className="text-teal-300 font-semibold">MME</span>,{' '}
                  <span className="text-blue-300 font-semibold">Fixed Assets</span>,{' '}
                  <span className="text-purple-300 font-semibold">Custody</span>, and{' '}
                  <span className="text-amber-300 font-semibold">PPE</span> with verified Table & Chart outputs
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isAiAdmin && (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    fetchMemoryRules();
                    setMemoryModalOpen(true);
                  }}
                  className={`h-8 px-3 text-xs flex items-center gap-1.5 rounded-xl ${styles.buttonSecondary}`}
                  title="View and manage learned memory rules (AI Admin only)"
                >
                  <CpuChipIcon className="w-4 h-4 text-teal-400" />
                  <span>Agent Memory ({memoryRules.length})</span>
                </Button>
              )}
              <Badge variant="default" className={styles.badgeSuccess}>
                <ShieldCheckIcon className="w-3.5 h-3.5 mr-1" />
                Read-Only 2-Step Verified
              </Badge>
            </div>
          </div>
        </div>

        {/* Error Alert Notice */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-red-500/15 border border-red-500/40 text-red-100 flex items-start justify-between gap-4 backdrop-blur-md shadow-lg">
            <div className="flex items-start gap-3">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-red-300">Notice on Query Execution</h4>
                <p className="text-xs text-red-200 mt-1 leading-relaxed">{errorMessage}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  setErrorMessage(null);
                  if (promptInput.trim()) handleRunQuery(promptInput);
                }}
                className="h-7 px-3 text-xs bg-red-600 hover:bg-red-500 text-white rounded-xl shadow-sm"
              >
                Retry
              </Button>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="text-red-300 hover:text-white p-1 rounded-lg transition-colors"
                title="Dismiss notice"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Query Input Studio */}
        <Card className={`mb-6 ${styles.card}`}>
          <CardContent className="p-5">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleRunQuery(promptInput);
              }}
              className="space-y-4"
            >
              <div className="relative">
                <Input
                  type="text"
                  value={promptInput}
                  onChange={(e) => setPromptInput(e.target.value)}
                  placeholder="Ask any question, e.g. 'Show total assets by category in a bar chart' or 'List uncalibrated MME'..."
                  disabled={loading}
                  className={`pr-36 py-6 text-sm rounded-2xl ${styles.input}`}
                />
                {promptInput && !loading && (
                  <button
                    type="button"
                    onClick={() => setPromptInput('')}
                    className="absolute right-32 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 rounded-full transition-colors"
                    title="Clear input"
                  >
                    <XCircleIcon className="w-4 h-4" />
                  </button>
                )}
                <Button
                  type="submit"
                  disabled={loading || !promptInput.trim()}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2 rounded-xl text-xs font-semibold ${styles.buttonPrimary}`}
                >
                  {loading ? (
                    <span className="flex items-center gap-1.5">
                      <ArrowPathIcon className="w-4 h-4 animate-spin" />
                      Analyzing...
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <PaperAirplaneIcon className="w-4 h-4" />
                      Ask Agent
                    </span>
                  )}
                </Button>
              </div>

              {/* Starter Prompt Chips */}
              <div>
                <p className={`text-xs font-medium mb-2 flex items-center gap-1.5 ${styles.subtext}`}>
                  <LightBulbIcon className="w-4 h-4 text-amber-400" />
                  Try asking one of these:
                </p>
                <div className="flex flex-wrap gap-2">
                  {STARTER_PROMPTS.map((starter, idx) => {
                    const Icon = starter.icon;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setPromptInput(starter.prompt);
                          handleRunQuery(starter.prompt);
                        }}
                        disabled={loading}
                        className={`text-xs px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 ${
                          theme === 'light'
                            ? 'bg-blue-50/70 border-blue-200 text-blue-900 hover:bg-blue-100'
                            : 'bg-slate-900/60 border-slate-700/80 text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                        <span>{starter.title}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </form>

            {/* Live 2-Step Progress Indicator */}
            {loading && (
              <div className="mt-6 pt-4 border-t border-white/10">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-semibold text-teal-300 flex items-center gap-2">
                    <ArrowPathIcon className="w-4 h-4 animate-spin" />
                    {currentStep === 1
                      ? 'Step 1: Formulating MongoDB Query Plan & Executing...'
                      : 'Step 2: Reviewing data integrity, verifying accuracy & rendering visualizations...'}
                  </span>
                  <span className={styles.subtext}>Step {currentStep || 1} of 2</span>
                </div>
                <div className="w-full bg-slate-700/50 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-teal-400 to-blue-500 h-1.5 rounded-full transition-all duration-500"
                    style={{ width: currentStep === 2 ? '90%' : '45%' }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Query Results Studio */}
        {queryResult && (
          <div className="space-y-6">
            {/* Query Header & Validation Card */}
            <Card className={styles.card}>
              <CardContent className="p-5">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <span className={`text-xs uppercase tracking-wider font-semibold ${styles.subtext}`}>
                      User Request ({queryResult.timestamp})
                    </span>
                    <h2 className={`text-lg font-bold mt-0.5 ${styles.textHeading}`}>"{queryResult.prompt}"</h2>
                  </div>

                  {/* 2-Step Validation Badges and Actions */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="default" className={styles.badgeSuccess}>
                      <CheckCircleIcon className="w-3.5 h-3.5 mr-1" />
                      Confidence: {queryResult.step2.validationReview.confidence}
                    </Badge>
                    <Badge variant="default" className={styles.badgeMuted}>
                      {queryResult.step1.recordsCount} Records Retrieved
                    </Badge>
                    {isAiAdmin && (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => setFeedbackModalOpen(true)}
                        className="h-7 px-2.5 text-xs flex items-center gap-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/40 rounded-lg"
                        title="Teach the AI agent or provide corrections on this query (AI Admin only)"
                      >
                        <AcademicCapIcon className="w-3.5 h-3.5" />
                        Teach / Correct
                      </Button>
                    )}
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleClearQuery}
                      className={`h-7 px-2.5 text-xs flex items-center gap-1 ${styles.buttonSecondary}`}
                      title="Clear results and start fresh"
                    >
                      <XMarkIcon className="w-3.5 h-3.5" />
                      Close / Reset
                    </Button>
                  </div>
                </div>

                {/* Validation Note */}
                {queryResult.step2.validationReview.notes && (
                  <div className={`mt-3 p-2.5 rounded-xl text-xs flex items-start gap-2 ${styles.auditorBox}`}>
                    <CheckCircleIcon className={`w-4 h-4 shrink-0 mt-0.5 ${theme === 'light' ? 'text-blue-600' : 'text-teal-400'}`} />
                    <span>
                      <strong className={styles.auditorLabel}>Auditor Note:</strong>{' '}
                      {queryResult.step2.validationReview.notes}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Multi-Tab Results Display */}
            <Card className={styles.card}>
              <CardHeader className={`pb-3 ${styles.cardHeader}`}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setActiveTab('summary')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                        activeTab === 'summary' ? styles.tabActive : styles.tabInactive
                      }`}
                    >
                      <DocumentTextIcon className="w-4 h-4" />
                      Insights & Summary
                    </button>

                    {queryResult.step2.chart && (
                      <button
                        type="button"
                        onClick={() => setActiveTab('chart')}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                          activeTab === 'chart' ? styles.tabActive : styles.tabInactive
                        }`}
                      >
                        <ChartBarIcon className="w-4 h-4" />
                        Visualization ({queryResult.step2.chart.type.toUpperCase()})
                      </button>
                    )}

                    {queryResult.step2.table && (
                      <button
                        type="button"
                        onClick={() => setActiveTab('table')}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                          activeTab === 'table' ? styles.tabActive : styles.tabInactive
                        }`}
                      >
                        <TableCellsIcon className="w-4 h-4" />
                        Data Table ({queryResult.step2.table.rows.length})
                      </button>
                    )}

                    {isAiAdmin && (
                      <button
                        type="button"
                        onClick={() => setActiveTab('audit')}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                          activeTab === 'audit' ? styles.tabActive : styles.tabInactive
                        }`}
                      >
                        <CommandLineIcon className="w-4 h-4" />
                        Query Audit Trail
                      </button>
                    )}
                  </div>

                  {/* Export Action Buttons (PDF + Excel) */}
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleExportPDF}
                      className={`h-8 px-3 text-xs flex items-center gap-1.5 ${styles.buttonPrimary}`}
                      title="Download complete PDF Report with Summary, Charts, and Data Tables"
                    >
                      <PrinterIcon className="w-3.5 h-3.5" />
                      <span>Print / PDF</span>
                    </Button>

                    {queryResult.step2.table && (
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleExportExcel}
                        className={`h-8 px-3 text-xs flex items-center gap-1.5 ${styles.buttonSecondary}`}
                        title="Download raw and formatted data rows to Excel"
                      >
                        <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                        <span>Excel (.xlsx)</span>
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-5">
                {/* TAB 1: Summary Insights */}
                {activeTab === 'summary' && (
                  <div className="space-y-4">
                    <div className={styles.prose}>
                      {queryResult.step2.summaryMarkdown}
                    </div>

                    {/* Follow-up Prompts */}
                    {queryResult.step2.suggestedFollowUps?.length > 0 && (
                      <div className="pt-4 mt-6 border-t border-white/10">
                        <p className={`text-xs font-medium mb-2 flex items-center gap-1.5 ${styles.subtext}`}>
                          <LightBulbIcon className="w-4 h-4 text-amber-400" />
                          Suggested Follow-Up Questions:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {queryResult.step2.suggestedFollowUps.map((followUp, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                setPromptInput(followUp);
                                handleRunQuery(followUp);
                              }}
                              className={`text-xs px-3 py-1.5 rounded-xl border transition-all text-left ${
                                theme === 'light'
                                  ? 'bg-blue-50/70 border-blue-200 text-blue-900 hover:bg-blue-100'
                                  : 'bg-slate-900/60 border-slate-700/80 text-teal-300 hover:bg-slate-800'
                              }`}
                            >
                              → {followUp}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: Dynamic Recharts Visualizations */}
                {activeTab === 'chart' && queryResult.step2.chart && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className={`text-base font-bold flex items-center gap-2 ${styles.textHeading}`}>
                        <ChartBarIcon className="w-5 h-5 text-teal-400" />
                        {queryResult.step2.chart.title || 'Data Visualization'}
                      </h3>
                      <Badge variant="default" className={styles.badgeSuccess}>
                        Type: {queryResult.step2.chart.type.toUpperCase()}
                      </Badge>
                    </div>

                    <div className="h-[400px] w-full pt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        {queryResult.step2.chart.type === 'pie' ? (
                          <PieChart>
                            <Tooltip
                              contentStyle={{
                                backgroundColor: '#0f172a',
                                borderColor: '#334155',
                                borderRadius: '0.75rem',
                                color: '#fff',
                              }}
                            />
                            <Legend />
                            <Pie
                              data={queryResult.step2.chart.data}
                              dataKey={queryResult.step2.chart.dataKeys[0] || 'count'}
                              nameKey={queryResult.step2.chart.xAxisKey || 'name'}
                              cx="50%"
                              cy="50%"
                              outerRadius={130}
                              innerRadius={50}
                              paddingAngle={3}
                              label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                            >
                              {queryResult.step2.chart.data.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                              ))}
                            </Pie>
                          </PieChart>
                        ) : queryResult.step2.chart.type === 'line' ? (
                          <LineChart data={queryResult.step2.chart.data} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                            <XAxis dataKey={queryResult.step2.chart.xAxisKey} stroke="#94a3b8" angle={-25} textAnchor="end" height={60} />
                            <YAxis stroke="#94a3b8" />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: '#0f172a',
                                borderColor: '#334155',
                                borderRadius: '0.75rem',
                                color: '#fff',
                              }}
                            />
                            <Legend />
                            {queryResult.step2.chart.dataKeys.map((key, i) => (
                              <Line
                                key={key}
                                type="monotone"
                                dataKey={key}
                                stroke={CHART_COLORS[i % CHART_COLORS.length]}
                                strokeWidth={3}
                                dot={{ r: 5 }}
                              />
                            ))}
                          </LineChart>
                        ) : queryResult.step2.chart.type === 'area' ? (
                          <AreaChart data={queryResult.step2.chart.data} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                            <XAxis dataKey={queryResult.step2.chart.xAxisKey} stroke="#94a3b8" angle={-25} textAnchor="end" height={60} />
                            <YAxis stroke="#94a3b8" />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: '#0f172a',
                                borderColor: '#334155',
                                borderRadius: '0.75rem',
                                color: '#fff',
                              }}
                            />
                            <Legend />
                            {queryResult.step2.chart.dataKeys.map((key, i) => (
                              <Area
                                key={key}
                                type="monotone"
                                dataKey={key}
                                stroke={CHART_COLORS[i % CHART_COLORS.length]}
                                fill={CHART_COLORS[i % CHART_COLORS.length]}
                                fillOpacity={0.3}
                              />
                            ))}
                          </AreaChart>
                        ) : (
                          /* Default: Bar Chart */
                          <BarChart data={queryResult.step2.chart.data} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                            <XAxis dataKey={queryResult.step2.chart.xAxisKey} stroke="#94a3b8" angle={-25} textAnchor="end" height={60} />
                            <YAxis stroke="#94a3b8" />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: '#0f172a',
                                borderColor: '#334155',
                                borderRadius: '0.75rem',
                                color: '#fff',
                              }}
                            />
                            <Legend />
                            {queryResult.step2.chart.dataKeys.map((key, i) => (
                              <Bar
                                key={key}
                                dataKey={key}
                                fill={CHART_COLORS[i % CHART_COLORS.length]}
                                radius={[6, 6, 0, 0]}
                              />
                            ))}
                          </BarChart>
                        )}
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* TAB 3: Data Table View */}
                {activeTab === 'table' && queryResult.step2.table && (
                  <div className="space-y-4">
                    {/* Search inside table */}
                    <div className="flex items-center justify-between gap-4">
                      <Input
                        type="text"
                        value={tableSearch}
                        onChange={(e) => {
                          setTableSearch(e.target.value);
                          setTablePage(1);
                        }}
                        placeholder="Search within table results..."
                        className={`h-8 max-w-xs text-xs ${styles.input}`}
                      />
                      <span className={`text-xs ${styles.subtext}`}>
                        Total: {filteredTableRows.length} rows
                      </span>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-white/10">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className={styles.tableHeader}>
                            <th className="py-3 px-3">#</th>
                            {queryResult.step2.table.columns.map((col) => (
                              <th key={col.key} className="py-3 px-3">
                                {col.label}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedTableRows.map((row, rIdx) => {
                            const itemNum = (tablePage - 1) * tablePageSize + rIdx + 1;
                            return (
                              <tr key={rIdx} className={styles.tableRow}>
                                <td className="py-2.5 px-3 font-mono text-slate-400">{itemNum}</td>
                                {queryResult.step2.table!.columns.map((col) => (
                                  <td key={col.key} className="py-2.5 px-3 whitespace-nowrap">
                                    {String(row[col.key] ?? '-')}
                                  </td>
                                ))}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    {totalTablePages > 1 && (
                      <div className="flex items-center justify-between text-xs pt-2">
                        <span className={styles.subtext}>
                          Page {tablePage} of {totalTablePages}
                        </span>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setTablePage((p) => Math.max(1, p - 1))}
                            disabled={tablePage === 1}
                            className={`h-7 px-2.5 text-xs ${styles.buttonSecondary}`}
                          >
                            Previous
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setTablePage((p) => Math.min(totalTablePages, p + 1))}
                            disabled={tablePage >= totalTablePages}
                            className={`h-7 px-2.5 text-xs ${styles.buttonSecondary}`}
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 4: Query Audit Trail (AI Admin Only) */}
                {activeTab === 'audit' && isAiAdmin && (
                  <div className="space-y-4 text-xs font-mono">
                    <div>
                      <h4 className="font-semibold text-teal-300 mb-1 font-sans">Step 1: Generated Query Plan</h4>
                      <p className="text-slate-300 font-sans mb-2">{queryResult.step1.explanation}</p>
                      <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-teal-300 overflow-x-auto">
                        {JSON.stringify(queryResult.step1.plan, null, 2)}
                      </pre>
                    </div>

                    <div className="pt-4 border-t border-white/10">
                      <h4 className="font-semibold text-amber-300 mb-1 font-sans">Step 2: Auditor Verification Report</h4>
                      <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-amber-300 overflow-x-auto">
                        {JSON.stringify(queryResult.step2.validationReview, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* History of Past Queries in this Session */}
        {history.length > 1 && (
          <div className="mt-8">
            <h3 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${styles.textHeading}`}>
              <ClockIcon className="w-4 h-4 text-teal-400" />
              Recent Queries in this Session ({history.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {history.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => setQueryResult(item)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    queryResult?.timestamp === item.timestamp
                      ? 'bg-teal-500/10 border-teal-400/50'
                      : theme === 'light'
                      ? 'bg-white border-blue-200 hover:bg-blue-50'
                      : 'bg-slate-900/50 border-slate-700/60 hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                    <span>{item.timestamp}</span>
                    <Badge variant="default" className="text-[10px] bg-slate-800 text-teal-300">
                      {item.step1.recordsCount} records
                    </Badge>
                  </div>
                  <p className={`text-xs font-semibold line-clamp-2 ${styles.textHeading}`}>"{item.prompt}"</p>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Feedback / Teach Agent Modal */}
        {feedbackModalOpen && queryResult && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div className={`w-full max-w-lg rounded-2xl p-6 shadow-2xl ${styles.card}`}>
              <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
                <div className="flex items-center gap-2 text-amber-500 dark:text-amber-300">
                  <AcademicCapIcon className="w-5 h-5" />
                  <h3 className={`font-bold text-base ${styles.textHeading}`}>Teach Agent / Correct Query</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setFeedbackModalOpen(false)}
                  className="text-slate-400 hover:text-slate-200 p-1 rounded-lg"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div className={`p-3 rounded-xl ${styles.auditorBox}`}>
                  <span className={`${styles.subtext} font-medium block mb-1`}>Original Query:</span>
                  <p className={`font-semibold ${styles.textHeading}`}>"{queryResult.prompt}"</p>
                  <span className={`${styles.subtext} font-medium block mt-2 mb-0.5`}>Executed Collection:</span>
                  <span className={`${theme === 'light' ? 'text-blue-700' : 'text-teal-300'} font-mono`}>{queryResult.step1.plan.collection}</span>
                </div>

                <div>
                  <label className={`block font-semibold mb-1.5 ${styles.textHeading}`}>
                    What was incorrect or how should the query behave?
                  </label>
                  <textarea
                    rows={4}
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="e.g. 'For FRC coveralls, search for Fire Retardant in ppeName instead of ppeId', or 'When checking active custody, filter by custodyto is null'..."
                    disabled={savingFeedback}
                    className={`w-full p-3 rounded-xl text-xs ${styles.input} focus:outline-none focus:ring-2 focus:ring-teal-400`}
                  />
                  <p className={`text-[11px] ${styles.subtext} mt-1`}>
                    The agent will distill this into a concise rule and remember it for all future sessions.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setFeedbackModalOpen(false)}
                    disabled={savingFeedback}
                    className={`h-8 px-3 text-xs ${styles.buttonSecondary}`}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSaveFeedback}
                    disabled={savingFeedback || !feedbackText.trim()}
                    className={`h-8 px-4 text-xs bg-amber-600 hover:bg-amber-500 text-white rounded-xl shadow-md`}
                  >
                    {savingFeedback ? (
                      <span className="flex items-center gap-1.5">
                        <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />
                        Learning...
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5">
                        <BookmarkIcon className="w-3.5 h-3.5" />
                        Save Correction & Learn
                      </span>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Agent Memory & Knowledge Base Modal */}
        {memoryModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div className={`w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden ${styles.card}`}>
              {/* Modal Header */}
              <div className="flex items-center justify-between p-5 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl ${theme === 'light' ? 'bg-blue-100 text-blue-700' : 'bg-teal-500/20 text-teal-300'}`}>
                    <CpuChipIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className={`font-bold text-base ${styles.textHeading}`}>Agent Memory & Learned Rules</h3>
                    <p className={`text-xs ${styles.subtext}`}>
                      Persistent knowledge injected into every query session for high precision
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMemoryModalOpen(false)}
                  className="text-slate-400 hover:text-slate-200 p-1 rounded-lg"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5 overflow-y-auto space-y-5 flex-1 text-xs">
                {/* Add Manual Rule Form */}
                <div className={`p-4 rounded-xl space-y-3 ${styles.auditorBox}`}>
                  <h4 className={`font-semibold flex items-center gap-1.5 ${theme === 'light' ? 'text-blue-800' : 'text-teal-300'}`}>
                    <PlusIcon className="w-4 h-4" />
                    Add Manual Knowledge Rule
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <Input
                      type="text"
                      placeholder="Topic (e.g. PPE Sizing)"
                      value={newTopic}
                      onChange={(e) => setNewTopic(e.target.value)}
                      disabled={savingRule}
                      className={`text-xs py-1.5 ${styles.input}`}
                    />
                    <Input
                      type="text"
                      placeholder="Rule instruction for MongoDB queries..."
                      value={newRule}
                      onChange={(e) => setNewRule(e.target.value)}
                      disabled={savingRule}
                      className={`sm:col-span-2 text-xs py-1.5 ${styles.input}`}
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddManualRule}
                      disabled={savingRule || !newRule.trim()}
                      className={`h-7 px-3 text-xs ${styles.buttonPrimary}`}
                    >
                      {savingRule ? 'Saving...' : 'Add Rule'}
                    </Button>
                  </div>
                </div>

                {/* Rules List */}
                <div>
                  <h4 className={`font-semibold mb-2.5 flex items-center justify-between ${styles.textHeading}`}>
                    <span>Active Learned Rules ({memoryRules.length})</span>
                    {loadingMemory && <ArrowPathIcon className="w-3.5 h-3.5 animate-spin text-teal-400" />}
                  </h4>

                  {memoryRules.length === 0 ? (
                    <p className="text-slate-500 py-6 text-center italic">No memory rules saved yet.</p>
                  ) : (
                    <div className="space-y-2.5">
                      {memoryRules.map((r) => (
                        <div
                          key={r._id}
                          className={`p-3.5 rounded-xl border flex items-start justify-between gap-3 transition-all ${
                            theme === 'light'
                              ? 'bg-white border-blue-200 hover:border-blue-300 shadow-sm'
                              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="default" className={styles.badgeSuccess}>
                                {r.topic}
                              </Badge>
                              <span className={`text-[10px] ${styles.subtext}`}>
                                {new Date(r.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className={`leading-relaxed font-sans ${styles.textBody}`}>{r.rule}</p>
                            {r.promptContext && (
                              <p className={`text-[10px] italic ${styles.subtext}`}>
                                Learned from query: "{r.promptContext}"
                              </p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteRule(r._id)}
                            className="text-slate-400 hover:text-red-500 p-1 rounded-lg transition-colors shrink-0"
                            title="Delete this rule"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-white/10 flex justify-end">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setMemoryModalOpen(false)}
                  className={`h-8 px-4 text-xs ${styles.buttonSecondary}`}
                >
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

