'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import PPEStockDisplay from '@/components/PPEStockDisplay';
import { useAppTheme } from '@/app/contexts/ThemeContext';

interface PPEDashboardStats {
  totalPPEItems: number;
  totalIssueRecords: number;
  totalBulkIssues: number;
  totalEmployees: number;
  overdueItems: number;
  todaysIssues: number;
}

export default function PPEDashboardPage() {
  const { theme } = useAppTheme();
  const [stats, setStats] = useState<PPEDashboardStats>({
    totalPPEItems: 0,
    totalIssueRecords: 0,
    totalBulkIssues: 0,
    totalEmployees: 0,
    overdueItems: 0,
    todaysIssues: 0
  });
  const [loading, setLoading] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
  }>>([]);
  const animationFrameRef = useRef<number>();

  // Theme-based styling function
  const getThemeStyles = () => {
    switch (theme) {
      case 'glassmorphic':
        return {
          container: 'relative min-h-screen overflow-hidden bg-gradient-to-br from-[#1a2332] via-[#2d3748] to-[#1a2332]',
          card: 'bg-white/10 backdrop-blur-lg border border-white/20',
          cardHover: 'hover:bg-white/15',
          text: 'text-white',
          textMuted: 'text-white/80',
          title: 'bg-gradient-to-r from-white to-teal-400 bg-clip-text text-transparent',
          accent: 'text-teal-400',
          accentRed: 'text-red-400',
          particleColor: 'rgba(45, 212, 191, 0.4)',
          particleLine: 'rgba(45, 212, 191, 0.2)',
        };
      case 'light':
        return {
          container: 'relative min-h-screen overflow-hidden bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100',
          card: 'bg-white border-2 border-blue-200 shadow-md',
          cardHover: 'hover:bg-blue-50',
          text: 'text-gray-900',
          textMuted: 'text-gray-600',
          title: 'bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent',
          accent: 'text-blue-600',
          accentRed: 'text-red-600',
          particleColor: 'rgba(37, 99, 235, 0.3)',
          particleLine: 'rgba(37, 99, 235, 0.15)',
        };
      default: // dark
        return {
          container: 'relative min-h-screen overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a]',
          card: 'bg-slate-800/50 border border-slate-700',
          cardHover: 'hover:bg-slate-800',
          text: 'text-slate-100',
          textMuted: 'text-slate-400',
          title: 'bg-gradient-to-r from-slate-100 to-teal-400 bg-clip-text text-transparent',
          accent: 'text-teal-400',
          accentRed: 'text-red-400',
          particleColor: 'rgba(45, 212, 191, 0.3)',
          particleLine: 'rgba(45, 212, 191, 0.15)',
        };
    }
  };

  const styles = getThemeStyles();

  // Fetch dashboard statistics
  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // Get today's date range (start and end of today)
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Start of today
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999); // End of today
      
      const todayDateFrom = today.toISOString();
      const todayDateTo = todayEnd.toISOString();
      
      // Fetch all statistics in parallel with high limits to get full data
      const [
        ppeResponse,
        issueResponse,
        bulkResponse,
        empResponse,
        overdueResponse,
        todaysIssuesResponse
      ] = await Promise.all([
        fetch('/api/ppe-master?limit=10000'),
        fetch('/api/ppe-records?limit=10000'),
        fetch('/api/ppe-bulk-issues?limit=10000'),
        fetch('/api/employees?limit=10000&active=true'),
        fetch('/api/ppe-due-for-reissue?daysOverdue=0'),
        fetch(`/api/ppe-records?dateFrom=${todayDateFrom}&dateTo=${todayDateTo}&limit=10000`)
      ]);

      const [
        ppeResult,
        issueResult,
        bulkResult,
        empResult,
        overdueResult,
        todaysIssuesResult
      ] = await Promise.all([
        ppeResponse.json(),
        issueResponse.json(),
        bulkResponse.json(),
        empResponse.json(),
        overdueResponse.json(),
        todaysIssuesResponse.json()
      ]);

      setStats({
        totalPPEItems: ppeResult.success ? (ppeResult.data.pagination?.total || ppeResult.data.records.length) : 0,
        totalIssueRecords: issueResult.success ? (issueResult.data.pagination?.total || issueResult.data.records.length) : 0,
        totalBulkIssues: bulkResult.success ? (bulkResult.data.pagination?.total || bulkResult.data.records.length) : 0,
        totalEmployees: empResult.success ? (empResult.data.pagination?.total || empResult.data.records.length) : 0,
        overdueItems: overdueResult.success ? overdueResult.data.length : 0,
        todaysIssues: todaysIssuesResult.success ? (todaysIssuesResult.data.pagination?.total || todaysIssuesResult.data.records.length) : 0
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

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

    // Get particle colors based on theme
    const getParticleColors = () => {
      switch (theme) {
        case 'glassmorphic':
          return { particle: 'rgba(45, 212, 191, 0.4)', line: 'rgba(45, 212, 191, 0.2)' };
        case 'light':
          return { particle: 'rgba(37, 99, 235, 0.3)', line: 'rgba(37, 99, 235, 0.15)' };
        default: // dark
          return { particle: 'rgba(45, 212, 191, 0.3)', line: 'rgba(45, 212, 191, 0.15)' };
      }
    };

    const colors = getParticleColors();

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

        // Draw particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = colors.particle;
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
              const alpha = parseFloat(colors.line.split(',')[3]?.replace(')', '') || '0.2');
              ctx.strokeStyle = colors.line.replace(/[\d.]+\)$/, `${alpha * (1 - distance / 120)})`);
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
    fetchStats();
  }, []);

  const quickActions = [
    {
      title: 'PPE Master',
      description: 'Manage PPE master data',
      href: '/ppe-master',
      color: 'bg-blue-500'
    },
    {
      title: 'Issue PPE',
      description: 'Issue PPE to employees',
      href: '/ppe-issue-records',
      color: 'bg-green-500'
    },
    {
      title: 'Bulk Issues',
      description: 'Create bulk PPE issues',
      href: '/ppe-bulk-issues',
      color: 'bg-purple-500'
    },
    {
      title: 'Employee Management',
      description: 'Manage employee records',
      href: '/employee-management',
      color: 'bg-orange-500'
    },
    {
      title: 'Due for Reissue',
      description: 'View PPE due for reissue',
      href: '/ppe-due-for-reissue',
      color: 'bg-red-500'
    }
  ];

  return (
    <div className={styles.container}>
      {/* Animated background canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 z-10" />
      
      {/* Main content */}
      <div className="relative z-20 pt-8 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="mb-8">
            <div className={`${styles.card} ${styles.cardHover} rounded-3xl p-8 transition-all duration-300`}>
              <h1 className={`text-2xl md:text-3xl font-bold mb-4 ${styles.title}`}>
                PPE Management Dashboard
              </h1>
              <p className={`${styles.text} text-lg`}>Overview of Personal Protective Equipment management system</p>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className={`${styles.card} ${styles.cardHover} rounded-3xl p-6 transition-all duration-300`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-sm font-semibold ${styles.text} uppercase tracking-wider`}>Total PPE Items</h3>
                <div className="text-2xl">🛡️</div>
              </div>
              <div className={`text-3xl font-bold ${styles.accent} mb-2`}>{loading ? '...' : stats.totalPPEItems}</div>
              <p className={`text-xs ${styles.textMuted}`}>
                Active PPE items in master
              </p>
            </div>

            <div className={`${styles.card} ${styles.cardHover} rounded-3xl p-6 transition-all duration-300`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-sm font-semibold ${styles.text} uppercase tracking-wider`}>Total Issue Records</h3>
                <div className="text-2xl">📋</div>
              </div>
              <div className={`text-3xl font-bold ${styles.accent} mb-2`}>{loading ? '...' : stats.totalIssueRecords}</div>
              <p className={`text-xs ${styles.textMuted}`}>
                Individual PPE issues
              </p>
            </div>

            <div className={`${styles.card} ${styles.cardHover} rounded-3xl p-6 transition-all duration-300`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-sm font-semibold ${styles.text} uppercase tracking-wider`}>Bulk Issues</h3>
                <div className="text-2xl">📦</div>
              </div>
              <div className={`text-3xl font-bold ${styles.accent} mb-2`}>{loading ? '...' : stats.totalBulkIssues}</div>
              <p className={`text-xs ${styles.textMuted}`}>
                Bulk PPE issues to departments
              </p>
            </div>

            <div className={`${styles.card} ${styles.cardHover} rounded-3xl p-6 transition-all duration-300`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-sm font-semibold ${styles.text} uppercase tracking-wider`}>Active Employees</h3>
                <div className="text-2xl">👥</div>
              </div>
              <div className={`text-3xl font-bold ${styles.accent} mb-2`}>{loading ? '...' : stats.totalEmployees}</div>
              <p className={`text-xs ${styles.textMuted}`}>
                Active employees in system
              </p>
            </div>

            <div className={`${styles.card} ${styles.cardHover} rounded-3xl p-6 transition-all duration-300`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-sm font-semibold ${styles.text} uppercase tracking-wider`}>Overdue Items</h3>
                <div className="text-2xl">⚠️</div>
              </div>
              <div className={`text-3xl font-bold ${styles.accentRed} mb-2`}>{loading ? '...' : stats.overdueItems}</div>
              <p className={`text-xs ${styles.textMuted}`}>
                PPE items due for reissue
              </p>
            </div>

            <div className={`${styles.card} ${styles.cardHover} rounded-3xl p-6 transition-all duration-300`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-sm font-semibold ${styles.text} uppercase tracking-wider`}>Today's Issues</h3>
                <div className="text-2xl">🕒</div>
              </div>
              <div className={`text-3xl font-bold ${styles.accent} mb-2`}>{loading ? '...' : stats.todaysIssues}</div>
              <p className={`text-xs ${styles.textMuted}`}>
                PPE issues issued today
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <h2 className={`text-3xl font-bold mb-6 ${styles.text}`}>Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {quickActions.map((action, index) => (
                <Link key={index} href={action.href}>
                  <div className={`${styles.card} ${styles.cardHover} rounded-3xl p-6 hover:-translate-y-1 transition-all duration-300 cursor-pointer`}>
                    <div className="flex items-center space-x-4">
                      <div className={`w-14 h-14 ${action.color} rounded-xl flex items-center justify-center text-white text-2xl shadow-lg`}>
                        {action.title === 'PPE Master' && '🛡️'}
                        {action.title === 'Issue PPE' && '📋'}
                        {action.title === 'Bulk Issues' && '📦'}
                        {action.title === 'Employee Management' && '👥'}
                        {action.title === 'Due for Reissue' && '⚠️'}
                      </div>
                      <div>
                        <h3 className={`font-semibold ${styles.text} text-lg`}>{action.title}</h3>
                        <p className={`text-sm ${styles.textMuted}`}>{action.description}</p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* System Information */}
          <div className={`${styles.card} ${styles.cardHover} rounded-3xl shadow-2xl overflow-hidden transition-all duration-300 mb-8`}>
            <div className={`p-6 lg:p-8 border-b ${theme === 'light' ? 'border-blue-200' : theme === 'glassmorphic' ? 'border-white/10' : 'border-slate-700'}`}>
              <h2 className={`text-2xl font-bold ${styles.text}`}>System Information</h2>
            </div>
            <div className="p-6 lg:p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h4 className={`font-semibold mb-4 ${styles.text} text-lg`}>PPE Management Features</h4>
                  <ul className={`text-sm ${styles.textMuted} space-y-2`}>
                    <li>• PPE Master Data Management</li>
                    <li>• Individual PPE Issue Tracking</li>
                    <li>• Bulk PPE Issue Management</li>
                    <li>• Employee Management</li>
                    <li>• Due Date Tracking & Alerts</li>
                    <li>• Issue History & Reports</li>
                  </ul>
                </div>
                <div>
                  <h4 className={`font-semibold mb-4 ${styles.text} text-lg`}>Key Benefits</h4>
                  <ul className={`text-sm ${styles.textMuted} space-y-2`}>
                    <li>• Automated due date calculations</li>
                    <li>• Comprehensive issue tracking</li>
                    <li>• Bulk issue management for departments</li>
                    <li>• Employee status management</li>
                    <li>• Safety compliance tracking</li>
                    <li>• Real-time dashboard monitoring</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Stock Overview Section */}
          <div className={`${styles.card} ${styles.cardHover} rounded-3xl shadow-2xl overflow-hidden transition-all duration-300`}>
            <div className={`p-6 lg:p-8 border-b ${theme === 'light' ? 'border-blue-200' : theme === 'glassmorphic' ? 'border-white/10' : 'border-slate-700'}`}>
              <h2 className={`text-2xl font-bold ${styles.text} mb-2`}>Stock Overview</h2>
              <p className={`${styles.textMuted} text-sm`}>Current PPE inventory levels</p>
            </div>
            <div className="p-6 lg:p-8">
              <PPEStockDisplay showLowStock={false} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
