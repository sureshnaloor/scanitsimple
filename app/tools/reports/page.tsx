'use client';
import { useState, useEffect, useRef } from 'react';
import { ToolData } from '@/types/tools';
import { 
  ChartBarIcon, 
  DocumentTextIcon, 
  PrinterIcon,
  ArrowDownTrayIcon 
} from '@heroicons/react/24/outline';
import { useAppTheme } from '@/app/contexts/ThemeContext';

export default function ToolsReportsPage() {
  const { theme } = useAppTheme();
  const [tools, setTools] = useState<ToolData[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState('all');
  const [filteredTools, setFilteredTools] = useState<ToolData[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
  }>>([]);
  const animationFrameRef = useRef<number>();

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

  // Theme-based styling function
  const getBackgroundStyles = () => {
    switch (theme) {
      case 'glassmorphic':
        return {
          container: 'relative min-h-screen overflow-hidden bg-gradient-to-br from-[#1a2332] via-[#2d3748] to-[#1a2332]',
          textColor: 'text-white',
          headerBg: 'bg-white/10 backdrop-blur-lg border border-white/20',
          headerHover: 'hover:bg-white/15',
          headerTitle: 'bg-gradient-to-r from-white to-teal-400 bg-clip-text text-transparent',
          headerSubtitle: 'text-white',
          buttonExport: 'bg-green-500/20 backdrop-blur-md border border-green-400/30 text-green-300 hover:bg-green-500/30 hover:border-green-400/50',
          buttonPrint: 'bg-blue-500/20 backdrop-blur-md border border-blue-400/30 text-blue-300 hover:bg-blue-500/30 hover:border-blue-400/50',
          filterBg: 'bg-white/10 backdrop-blur-lg border border-white/20',
          filterHover: 'hover:bg-white/15',
          filterActive: 'bg-teal-500/30 border border-teal-400/50 text-teal-300',
          filterInactive: 'bg-white/10 border border-white/20 text-white hover:bg-white/20',
          cardBg: 'bg-white/10 backdrop-blur-lg border border-white/20',
          cardHover: 'hover:bg-white/15',
          cardTitle: 'text-white/80',
          cardValue: 'text-teal-400',
          cardIcon: 'text-teal-400',
          tableBg: 'bg-white/10 backdrop-blur-lg border border-white/20',
          tableHover: 'hover:bg-white/15',
          tableHeaderBg: 'bg-white/5 backdrop-blur-md border-white/10',
          tableHeaderText: 'text-white/90',
          tableRowBorder: 'border-white/5',
          tableRowHover: 'hover:bg-white/10',
          tableCellText: 'text-white',
          tableCellTextSecondary: 'text-white/90',
          summaryBg: 'bg-white/10 backdrop-blur-lg border border-white/20',
          summaryHover: 'hover:bg-white/15',
          summaryTitle: 'text-white',
          summaryLabel: 'text-white/80',
          summaryValue: 'text-teal-400',
          statusBadgeAvailable: 'bg-green-500/20 text-green-300 border border-green-400/30',
          statusBadgeInUse: 'bg-blue-500/20 text-blue-300 border border-blue-400/30',
          statusBadgeMaintenance: 'bg-yellow-500/20 text-yellow-300 border border-yellow-400/30',
          statusBadgeRetired: 'bg-red-500/20 text-red-300 border border-red-400/30',
          spinnerColor: 'border-teal-400'
        };
      case 'light':
        return {
          container: 'relative min-h-screen overflow-hidden bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100',
          textColor: 'text-gray-900',
          headerBg: 'bg-white border-2 border-blue-200 shadow-lg',
          headerHover: 'hover:bg-blue-50',
          headerTitle: 'bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent',
          headerSubtitle: 'text-gray-700',
          buttonExport: 'bg-green-100 border-2 border-green-300 text-green-700 hover:bg-green-200 hover:border-green-400',
          buttonPrint: 'bg-blue-100 border-2 border-blue-300 text-blue-700 hover:bg-blue-200 hover:border-blue-400',
          filterBg: 'bg-white border-2 border-blue-200 shadow-md',
          filterHover: 'hover:bg-blue-50',
          filterActive: 'bg-blue-100 border-2 border-blue-400 text-blue-700',
          filterInactive: 'bg-white border-2 border-blue-200 text-gray-700 hover:bg-blue-50',
          cardBg: 'bg-white border-2 border-blue-200 shadow-md',
          cardHover: 'hover:bg-blue-50',
          cardTitle: 'text-gray-600',
          cardValue: 'text-blue-600',
          cardIcon: 'text-blue-600',
          tableBg: 'bg-white border-2 border-blue-200 shadow-md',
          tableHover: 'hover:bg-blue-50',
          tableHeaderBg: 'bg-blue-50 border-blue-200',
          tableHeaderText: 'text-gray-800',
          tableRowBorder: 'border-gray-200',
          tableRowHover: 'hover:bg-blue-50',
          tableCellText: 'text-gray-900',
          tableCellTextSecondary: 'text-gray-700',
          summaryBg: 'bg-white border-2 border-blue-200 shadow-md',
          summaryHover: 'hover:bg-blue-50',
          summaryTitle: 'text-gray-900',
          summaryLabel: 'text-gray-600',
          summaryValue: 'text-blue-600',
          statusBadgeAvailable: 'bg-green-100 text-green-800 border border-green-300',
          statusBadgeInUse: 'bg-blue-100 text-blue-800 border border-blue-300',
          statusBadgeMaintenance: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
          statusBadgeRetired: 'bg-red-100 text-red-800 border border-red-300',
          spinnerColor: 'border-blue-500'
        };
      default: // dark theme
        return {
          container: 'relative min-h-screen overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a]',
          textColor: 'text-slate-100',
          headerBg: 'bg-slate-800/90 border border-slate-700 shadow-xl',
          headerHover: 'hover:bg-slate-700/90',
          headerTitle: 'bg-gradient-to-r from-slate-100 to-teal-400 bg-clip-text text-transparent',
          headerSubtitle: 'text-slate-300',
          buttonExport: 'bg-green-900/40 border border-green-700/50 text-green-300 hover:bg-green-900/60 hover:border-green-600',
          buttonPrint: 'bg-blue-900/40 border border-blue-700/50 text-blue-300 hover:bg-blue-900/60 hover:border-blue-600',
          filterBg: 'bg-slate-800/90 border border-slate-700 shadow-xl',
          filterHover: 'hover:bg-slate-700/90',
          filterActive: 'bg-teal-900/40 border border-teal-700/50 text-teal-300',
          filterInactive: 'bg-slate-700/50 border border-slate-600 text-slate-300 hover:bg-slate-600',
          cardBg: 'bg-slate-800/90 border border-slate-700 shadow-xl',
          cardHover: 'hover:bg-slate-700/90',
          cardTitle: 'text-slate-400',
          cardValue: 'text-teal-400',
          cardIcon: 'text-teal-400',
          tableBg: 'bg-slate-800/90 border border-slate-700 shadow-xl',
          tableHover: 'hover:bg-slate-700/90',
          tableHeaderBg: 'bg-slate-700/50 border-slate-600',
          tableHeaderText: 'text-slate-200',
          tableRowBorder: 'border-slate-700',
          tableRowHover: 'hover:bg-slate-700/50',
          tableCellText: 'text-slate-100',
          tableCellTextSecondary: 'text-slate-300',
          summaryBg: 'bg-slate-800/90 border border-slate-700 shadow-xl',
          summaryHover: 'hover:bg-slate-700/90',
          summaryTitle: 'text-slate-100',
          summaryLabel: 'text-slate-400',
          summaryValue: 'text-teal-400',
          statusBadgeAvailable: 'bg-green-900/40 text-green-300 border border-green-700/50',
          statusBadgeInUse: 'bg-blue-900/40 text-blue-300 border border-blue-700/50',
          statusBadgeMaintenance: 'bg-yellow-900/40 text-yellow-300 border border-yellow-700/50',
          statusBadgeRetired: 'bg-red-900/40 text-red-300 border border-red-700/50',
          spinnerColor: 'border-teal-400'
        };
    }
  };

  const backgroundStyles = getBackgroundStyles();

  useEffect(() => {
    fetchTools();
  }, []);

  useEffect(() => {
    filterTools();
  }, [tools, reportType]);

  const fetchTools = async () => {
    try {
      const response = await fetch('/api/tools');
      if (!response.ok) throw new Error('Failed to fetch tools');
      const data = await response.json();
      setTools(data);
    } catch (error) {
      console.error('Error fetching tools:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterTools = () => {
    let filtered = [...tools];
    
    switch (reportType) {
      case 'available':
        filtered = tools.filter(tool => tool.toolStatus === 'Available');
        break;
      case 'in-use':
        filtered = tools.filter(tool => tool.toolStatus === 'In Use');
        break;
      case 'maintenance':
        filtered = tools.filter(tool => tool.toolStatus === 'Maintenance');
        break;
      case 'retired':
        filtered = tools.filter(tool => tool.toolStatus === 'Retired');
        break;
      case 'warehouse':
        filtered = tools.filter(tool => tool.toolLocation === 'Warehouse');
        break;
      case 'project':
        filtered = tools.filter(tool => tool.toolLocation === 'Project Site');
        break;
      default:
        filtered = tools;
    }
    
    setFilteredTools(filtered);
  };

  const generateReport = () => {
    const reportData = {
      reportType,
      generatedAt: new Date().toISOString(),
      totalTools: filteredTools.length,
      tools: filteredTools
    };
    
    const dataStr = JSON.stringify(reportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tools-report-${reportType}-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const printReport = () => {
    window.print();
  };

  const getStatusStats = () => {
    const stats = {
      total: tools.length,
      available: tools.filter(t => t.toolStatus === 'Available').length,
      inUse: tools.filter(t => t.toolStatus === 'In Use').length,
      maintenance: tools.filter(t => t.toolStatus === 'Maintenance').length,
      retired: tools.filter(t => t.toolStatus === 'Retired').length,
    };
    return stats;
  };

  const getLocationStats = () => {
    const stats = {
      warehouse: tools.filter(t => t.toolLocation === 'Warehouse').length,
      projectSite: tools.filter(t => t.toolLocation === 'Project Site').length,
      maintenance: tools.filter(t => t.toolLocation === 'Maintenance').length,
    };
    return stats;
  };

  const getTotalValue = () => {
    return tools.reduce((sum, tool) => sum + (tool.toolCost || 0), 0);
  };

  if (loading) {
    return (
      <div className={`${backgroundStyles.container} flex items-center justify-center`}>
        <div className={`animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 ${backgroundStyles.spinnerColor}`}></div>
        <p className={`${backgroundStyles.textColor} ml-4`}>Loading...</p>
      </div>
    );
  }

  const statusStats = getStatusStats();
  const locationStats = getLocationStats();
  const totalValue = getTotalValue();

  const getFilterButtonStyles = (filterType: string) => {
    const isActive = reportType === filterType;
    if (theme === 'light') {
      const activeColors: { [key: string]: string } = {
        all: 'bg-blue-100 border-2 border-blue-400 text-blue-700',
        available: 'bg-green-100 border-2 border-green-400 text-green-700',
        'in-use': 'bg-blue-100 border-2 border-blue-400 text-blue-700',
        maintenance: 'bg-yellow-100 border-2 border-yellow-400 text-yellow-700',
        retired: 'bg-red-100 border-2 border-red-400 text-red-700',
        warehouse: 'bg-purple-100 border-2 border-purple-400 text-purple-700',
        project: 'bg-indigo-100 border-2 border-indigo-400 text-indigo-700'
      };
      return isActive 
        ? activeColors[filterType] || backgroundStyles.filterActive
        : backgroundStyles.filterInactive;
    } else if (theme === 'glassmorphic') {
      const activeColors: { [key: string]: string } = {
        all: 'bg-teal-500/30 border border-teal-400/50 text-teal-300',
        available: 'bg-green-500/30 border border-green-400/50 text-green-300',
        'in-use': 'bg-blue-500/30 border border-blue-400/50 text-blue-300',
        maintenance: 'bg-yellow-500/30 border border-yellow-400/50 text-yellow-300',
        retired: 'bg-red-500/30 border border-red-400/50 text-red-300',
        warehouse: 'bg-purple-500/30 border border-purple-400/50 text-purple-300',
        project: 'bg-indigo-500/30 border border-indigo-400/50 text-indigo-300'
      };
      return isActive 
        ? activeColors[filterType] || backgroundStyles.filterActive
        : backgroundStyles.filterInactive;
    } else {
      const activeColors: { [key: string]: string } = {
        all: 'bg-teal-900/40 border border-teal-700/50 text-teal-300',
        available: 'bg-green-900/40 border border-green-700/50 text-green-300',
        'in-use': 'bg-blue-900/40 border border-blue-700/50 text-blue-300',
        maintenance: 'bg-yellow-900/40 border border-yellow-700/50 text-yellow-300',
        retired: 'bg-red-900/40 border border-red-700/50 text-red-300',
        warehouse: 'bg-purple-900/40 border border-purple-700/50 text-purple-300',
        project: 'bg-indigo-900/40 border border-indigo-700/50 text-indigo-300'
      };
      return isActive 
        ? activeColors[filterType] || backgroundStyles.filterActive
        : backgroundStyles.filterInactive;
    }
  };

  const getStatusBadgeStyles = (status: string | undefined) => {
    switch (status) {
      case 'Available':
        return backgroundStyles.statusBadgeAvailable;
      case 'In Use':
        return backgroundStyles.statusBadgeInUse;
      case 'Maintenance':
        return backgroundStyles.statusBadgeMaintenance;
      default:
        return backgroundStyles.statusBadgeRetired;
    }
  };

  return (
    <div className={backgroundStyles.container}>
      {/* Animated background canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 z-10" />
      
      {/* Main content */}
      <div className="relative z-20 pt-8 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="mb-8">
            <div className={`${backgroundStyles.headerBg} ${backgroundStyles.headerHover} rounded-3xl p-8 transition-all duration-300`}>
              <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                  <h1 className={`text-2xl md:text-3xl font-bold mb-4 ${backgroundStyles.headerTitle}`}>
                    Tools Reports
                  </h1>
                  <p className={`${backgroundStyles.headerSubtitle} text-lg`}>Comprehensive tools inventory reports and analytics</p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={generateReport}
                    className={`flex items-center gap-2 px-6 py-3 ${backgroundStyles.buttonExport} rounded-xl font-semibold transition-all duration-300`}
                  >
                    <ArrowDownTrayIcon className="h-5 w-5" />
                    Export Report
                  </button>
                  <button
                    onClick={printReport}
                    className={`flex items-center gap-2 px-6 py-3 ${backgroundStyles.buttonPrint} rounded-xl font-semibold transition-all duration-300`}
                  >
                    <PrinterIcon className="h-5 w-5" />
                    Print Report
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Report Filters */}
          <div className={`${backgroundStyles.filterBg} ${backgroundStyles.filterHover} rounded-3xl p-6 lg:p-8 shadow-2xl mb-6 transition-all duration-300`}>
            <h2 className={`text-2xl font-bold ${backgroundStyles.textColor} mb-6`}>Report Filters</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            <button
              onClick={() => setReportType('all')}
              className={`px-4 py-3 rounded-xl transition-all duration-300 font-medium ${getFilterButtonStyles('all')}`}
            >
              All Tools
            </button>
            <button
              onClick={() => setReportType('available')}
              className={`px-4 py-3 rounded-xl transition-all duration-300 font-medium ${getFilterButtonStyles('available')}`}
            >
              Available
            </button>
            <button
              onClick={() => setReportType('in-use')}
              className={`px-4 py-3 rounded-xl transition-all duration-300 font-medium ${getFilterButtonStyles('in-use')}`}
            >
              In Use
            </button>
            <button
              onClick={() => setReportType('maintenance')}
              className={`px-4 py-3 rounded-xl transition-all duration-300 font-medium ${getFilterButtonStyles('maintenance')}`}
            >
              Maintenance
            </button>
            <button
              onClick={() => setReportType('retired')}
              className={`px-4 py-3 rounded-xl transition-all duration-300 font-medium ${getFilterButtonStyles('retired')}`}
            >
              Retired
            </button>
            <button
              onClick={() => setReportType('warehouse')}
              className={`px-4 py-3 rounded-xl transition-all duration-300 font-medium ${getFilterButtonStyles('warehouse')}`}
            >
              Warehouse
            </button>
            <button
              onClick={() => setReportType('project')}
              className={`px-4 py-3 rounded-xl transition-all duration-300 font-medium ${getFilterButtonStyles('project')}`}
            >
              Project Site
            </button>
          </div>
        </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className={`${backgroundStyles.cardBg} ${backgroundStyles.cardHover} rounded-3xl p-6 transition-all duration-300`}>
              <div className="flex items-center">
                <ChartBarIcon className={`h-8 w-8 ${backgroundStyles.cardIcon}`} />
                <div className="ml-4">
                  <p className={`text-sm font-medium ${backgroundStyles.cardTitle} uppercase tracking-wider`}>Total Tools</p>
                  <p className={`text-3xl font-bold ${backgroundStyles.cardValue}`}>{statusStats.total}</p>
                </div>
              </div>
            </div>
            
            <div className={`${backgroundStyles.cardBg} ${backgroundStyles.cardHover} rounded-3xl p-6 transition-all duration-300`}>
              <div className="flex items-center">
                <div className={`h-10 w-10 ${theme === 'light' ? 'bg-green-100 rounded-full flex items-center justify-center border-2 border-green-300' : theme === 'glassmorphic' ? 'bg-green-500/20 rounded-full flex items-center justify-center border border-green-400/30' : 'bg-green-900/40 rounded-full flex items-center justify-center border border-green-700/50'}`}>
                  <div className={`h-5 w-5 ${theme === 'light' ? 'bg-green-600 rounded-full' : theme === 'glassmorphic' ? 'bg-green-400 rounded-full' : 'bg-green-400 rounded-full'}`}></div>
                </div>
                <div className="ml-4">
                  <p className={`text-sm font-medium ${backgroundStyles.cardTitle} uppercase tracking-wider`}>Available</p>
                  <p className={`text-3xl font-bold ${theme === 'light' ? 'text-green-700' : theme === 'glassmorphic' ? 'text-green-400' : 'text-green-400'}`}>{statusStats.available}</p>
                </div>
              </div>
            </div>
            
            <div className={`${backgroundStyles.cardBg} ${backgroundStyles.cardHover} rounded-3xl p-6 transition-all duration-300`}>
              <div className="flex items-center">
                <div className={`h-10 w-10 ${theme === 'light' ? 'bg-blue-100 rounded-full flex items-center justify-center border-2 border-blue-300' : theme === 'glassmorphic' ? 'bg-blue-500/20 rounded-full flex items-center justify-center border border-blue-400/30' : 'bg-blue-900/40 rounded-full flex items-center justify-center border border-blue-700/50'}`}>
                  <div className={`h-5 w-5 ${theme === 'light' ? 'bg-blue-600 rounded-full' : theme === 'glassmorphic' ? 'bg-blue-400 rounded-full' : 'bg-blue-400 rounded-full'}`}></div>
                </div>
                <div className="ml-4">
                  <p className={`text-sm font-medium ${backgroundStyles.cardTitle} uppercase tracking-wider`}>In Use</p>
                  <p className={`text-3xl font-bold ${theme === 'light' ? 'text-blue-700' : theme === 'glassmorphic' ? 'text-blue-400' : 'text-blue-400'}`}>{statusStats.inUse}</p>
                </div>
              </div>
            </div>
            
            <div className={`${backgroundStyles.cardBg} ${backgroundStyles.cardHover} rounded-3xl p-6 transition-all duration-300`}>
              <div className="flex items-center">
                <div className={`h-10 w-10 ${theme === 'light' ? 'bg-yellow-100 rounded-full flex items-center justify-center border-2 border-yellow-300' : theme === 'glassmorphic' ? 'bg-yellow-500/20 rounded-full flex items-center justify-center border border-yellow-400/30' : 'bg-yellow-900/40 rounded-full flex items-center justify-center border border-yellow-700/50'}`}>
                  <div className={`h-5 w-5 ${theme === 'light' ? 'bg-yellow-600 rounded-full' : theme === 'glassmorphic' ? 'bg-yellow-400 rounded-full' : 'bg-yellow-400 rounded-full'}`}></div>
                </div>
                <div className="ml-4">
                  <p className={`text-sm font-medium ${backgroundStyles.cardTitle} uppercase tracking-wider`}>Maintenance</p>
                  <p className={`text-3xl font-bold ${theme === 'light' ? 'text-yellow-700' : theme === 'glassmorphic' ? 'text-yellow-400' : 'text-yellow-400'}`}>{statusStats.maintenance}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tools List */}
          <div className={`${backgroundStyles.tableBg} ${backgroundStyles.tableHover} rounded-3xl shadow-2xl overflow-hidden transition-all duration-300 mb-6`}>
            <div className={`px-6 lg:px-8 py-6 border-b ${theme === 'light' ? 'border-blue-200' : theme === 'glassmorphic' ? 'border-white/10' : 'border-slate-700'}`}>
              <h2 className={`text-2xl font-bold ${backgroundStyles.textColor}`}>
                {reportType === 'all' ? 'All Tools' : 
                 reportType === 'available' ? 'Available Tools' :
                 reportType === 'in-use' ? 'Tools In Use' :
                 reportType === 'maintenance' ? 'Tools Under Maintenance' :
                 reportType === 'retired' ? 'Retired Tools' :
                 reportType === 'warehouse' ? 'Tools in Warehouse' :
                 'Tools at Project Sites'} ({filteredTools.length})
              </h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y">
                <thead className={`${backgroundStyles.tableHeaderBg} border-b ${theme === 'light' ? 'border-blue-200' : theme === 'glassmorphic' ? 'border-white/10' : 'border-slate-700'}`}>
                  <tr>
                    <th className={`px-6 py-4 text-left text-xs font-semibold ${backgroundStyles.tableHeaderText} uppercase tracking-wider`}>
                      Asset Number
                    </th>
                    <th className={`px-6 py-4 text-left text-xs font-semibold ${backgroundStyles.tableHeaderText} uppercase tracking-wider`}>
                      Description
                    </th>
                    <th className={`px-6 py-4 text-left text-xs font-semibold ${backgroundStyles.tableHeaderText} uppercase tracking-wider`}>
                      Status
                    </th>
                    <th className={`px-6 py-4 text-left text-xs font-semibold ${backgroundStyles.tableHeaderText} uppercase tracking-wider`}>
                      Location
                    </th>
                    <th className={`px-6 py-4 text-left text-xs font-semibold ${backgroundStyles.tableHeaderText} uppercase tracking-wider`}>
                      Cost
                    </th>
                    <th className={`px-6 py-4 text-left text-xs font-semibold ${backgroundStyles.tableHeaderText} uppercase tracking-wider`}>
                      Purchase Date
                    </th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${backgroundStyles.tableRowBorder}`}>
                  {filteredTools.map((tool, index) => (
                    <tr key={tool._id} className={`${backgroundStyles.tableRowHover} transition-colors ${index % 2 === 0 ? (theme === 'light' ? 'bg-blue-50/30' : theme === 'glassmorphic' ? 'bg-white/5' : 'bg-slate-800/50') : (theme === 'light' ? 'bg-white' : theme === 'glassmorphic' ? 'bg-white/10' : 'bg-slate-800/70')}`}>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${backgroundStyles.tableCellText}`}>
                        {tool.assetnumber}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${backgroundStyles.tableCellTextSecondary}`}>
                        {tool.toolDescription}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadgeStyles(tool.toolStatus)}`}>
                          {tool.toolStatus}
                        </span>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${backgroundStyles.tableCellTextSecondary}`}>
                        {tool.toolLocation}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${backgroundStyles.tableCellTextSecondary}`}>
                        {tool.toolCost ? new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'SAR'
                        }).format(tool.toolCost) : 'N/A'}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${backgroundStyles.tableCellTextSecondary}`}>
                        {tool.purchasedDate ? new Date(tool.purchasedDate).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary */}
          <div className={`${backgroundStyles.summaryBg} ${backgroundStyles.summaryHover} rounded-3xl p-6 lg:p-8 shadow-2xl transition-all duration-300`}>
            <h2 className={`text-2xl font-bold ${backgroundStyles.summaryTitle} mb-6`}>Report Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <h3 className={`text-lg font-semibold ${backgroundStyles.summaryTitle} mb-4`}>Status Distribution</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className={`text-sm ${backgroundStyles.summaryLabel}`}>Available:</span>
                    <span className={`text-sm font-semibold ${theme === 'light' ? 'text-green-700' : theme === 'glassmorphic' ? 'text-green-400' : 'text-green-400'}`}>{statusStats.available}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`text-sm ${backgroundStyles.summaryLabel}`}>In Use:</span>
                    <span className={`text-sm font-semibold ${theme === 'light' ? 'text-blue-700' : theme === 'glassmorphic' ? 'text-blue-400' : 'text-blue-400'}`}>{statusStats.inUse}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`text-sm ${backgroundStyles.summaryLabel}`}>Maintenance:</span>
                    <span className={`text-sm font-semibold ${theme === 'light' ? 'text-yellow-700' : theme === 'glassmorphic' ? 'text-yellow-400' : 'text-yellow-400'}`}>{statusStats.maintenance}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`text-sm ${backgroundStyles.summaryLabel}`}>Retired:</span>
                    <span className={`text-sm font-semibold ${theme === 'light' ? 'text-red-700' : theme === 'glassmorphic' ? 'text-red-400' : 'text-red-400'}`}>{statusStats.retired}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className={`text-lg font-semibold ${backgroundStyles.summaryTitle} mb-4`}>Location Distribution</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className={`text-sm ${backgroundStyles.summaryLabel}`}>Warehouse:</span>
                    <span className={`text-sm font-semibold ${backgroundStyles.summaryValue}`}>{locationStats.warehouse}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`text-sm ${backgroundStyles.summaryLabel}`}>Project Site:</span>
                    <span className={`text-sm font-semibold ${backgroundStyles.summaryValue}`}>{locationStats.projectSite}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`text-sm ${backgroundStyles.summaryLabel}`}>Maintenance:</span>
                    <span className={`text-sm font-semibold ${backgroundStyles.summaryValue}`}>{locationStats.maintenance}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className={`text-lg font-semibold ${backgroundStyles.summaryTitle} mb-4`}>Financial Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className={`text-sm ${backgroundStyles.summaryLabel}`}>Total Value:</span>
                    <span className={`text-sm font-semibold ${backgroundStyles.summaryValue}`}>
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'SAR'
                      }).format(totalValue)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`text-sm ${backgroundStyles.summaryLabel}`}>Average Cost:</span>
                    <span className={`text-sm font-semibold ${backgroundStyles.summaryValue}`}>
                      {tools.length > 0 ? new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'SAR'
                      }).format(totalValue / tools.length) : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
