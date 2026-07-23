'use client';

import { useEffect, useState, useRef } from 'react';
import ResponsiveTable from '@/components/ui/responsive-table';
import Link from 'next/link';
import { Download } from 'lucide-react';
import { useAppTheme } from '@/app/contexts/ThemeContext';

interface WarehouseEquipment {
    assetnumber: string;
    assetdescription: string;
    assetstatus: string;
    assetmodel: string;
    assetmanufacturer: string;
    assetserialnumber: string;
    warehouseCity: string;
}

type SortField = 'assetnumber' | 'assetdescription' | 'assetstatus' | 'warehouseCity';
type SortOrder = 'asc' | 'desc';

export default function WarehouseEquipmentReport() {
    const { theme } = useAppTheme();
    const [equipment, setEquipment] = useState<WarehouseEquipment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sortField, setSortField] = useState<SortField>('assetnumber');
    const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particlesRef = useRef<Array<{
        x: number;
        y: number;
        vx: number;
        vy: number;
        radius: number;
    }>>([]);
    const animationFrameRef = useRef<number>();

    const fetchWarehouseEquipment = async () => {
        try {
            const response = await fetch(`/api/reports/warehouse-equipment?sortField=${sortField}&sortOrder=${sortOrder}`);
            if (!response.ok) throw new Error('Failed to fetch data');
            
            const result = await response.json();
            setEquipment(result.data);
        } catch (err) {
            setError('Failed to load warehouse equipment data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWarehouseEquipment();
    }, [sortField, sortOrder]);

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

    const toggleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('asc');
        }
    };

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
                    statBg: 'bg-white/10 backdrop-blur-md border border-white/20',
                    statValue: 'text-teal-400',
                    statLabel: 'text-white',
                    tableBg: 'bg-white/10 backdrop-blur-lg border border-white/20',
                    tableHover: 'hover:bg-white/15',
                    spinnerColor: 'border-teal-400',
                    linkColor: 'text-teal-400 hover:text-teal-300',
                    errorBg: 'bg-red-500/20 backdrop-blur-lg border border-red-400/30',
                    errorText: 'text-red-300',
                    actionButton: 'text-teal-400 hover:text-teal-300 hover:bg-white/10'
                };
            case 'light':
                return {
                    container: 'relative min-h-screen overflow-hidden bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100',
                    textColor: 'text-gray-900',
                    headerBg: 'bg-white border-2 border-blue-200 shadow-lg',
                    headerHover: 'hover:bg-blue-50',
                    headerTitle: 'bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent',
                    headerSubtitle: 'text-gray-700',
                    statBg: 'bg-white border-2 border-blue-200 shadow-md',
                    statValue: 'text-blue-600',
                    statLabel: 'text-gray-700',
                    tableBg: 'bg-white border-2 border-blue-200 shadow-md',
                    tableHover: 'hover:bg-blue-50',
                    spinnerColor: 'border-blue-500',
                    linkColor: 'text-blue-600 hover:text-blue-700',
                    errorBg: 'bg-red-100 border-2 border-red-300 shadow-md',
                    errorText: 'text-red-700',
                    actionButton: 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'
                };
            default: // dark theme
                return {
                    container: 'relative min-h-screen overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a]',
                    textColor: 'text-slate-100',
                    headerBg: 'bg-slate-800/90 border border-slate-700 shadow-xl',
                    headerHover: 'hover:bg-slate-700/90',
                    headerTitle: 'bg-gradient-to-r from-slate-100 to-teal-400 bg-clip-text text-transparent',
                    headerSubtitle: 'text-slate-300',
                    statBg: 'bg-slate-800/90 border border-slate-700 shadow-lg',
                    statValue: 'text-teal-400',
                    statLabel: 'text-slate-300',
                    tableBg: 'bg-slate-800/90 border border-slate-700 shadow-xl',
                    tableHover: 'hover:bg-slate-700/90',
                    spinnerColor: 'border-teal-400',
                    linkColor: 'text-teal-400 hover:text-teal-300',
                    errorBg: 'bg-red-900/30 border border-red-700/50 shadow-lg',
                    errorText: 'text-red-300',
                    actionButton: 'text-teal-400 hover:text-teal-300 hover:bg-slate-700/50'
                };
        }
    };

    const backgroundStyles = getBackgroundStyles();

    const handleDownloadUndertaking = async (assetNumber: string) => {
        try {
            const response = await fetch(`/api/undertaking-letter?assetNumber=${assetNumber}&type=warehouse`);
            if (!response.ok) {
                throw new Error('Failed to generate undertaking letter');
            }
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Undertaking_Letter_${assetNumber}_warehouse.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading undertaking letter:', error);
            alert('Failed to download undertaking letter. Please try again.');
        }
    };

    if (loading) {
        const styles = getBackgroundStyles();
        return (
            <div className={styles.container}>
                <canvas ref={canvasRef} className="absolute inset-0 z-10" />
                <div className="relative z-20 flex justify-center items-center min-h-screen">
                    <div className={`${styles.headerBg} rounded-2xl p-8`}>
                        <div className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${styles.spinnerColor} mx-auto`}></div>
                        <p className={`${styles.textColor} mt-4 text-center`}>Loading warehouse equipment...</p>
                    </div>
                </div>
            </div>
        );
    }
    
    if (error) {
        const styles = getBackgroundStyles();
        return (
            <div className={styles.container}>
                <canvas ref={canvasRef} className="absolute inset-0 z-10" />
                <div className="relative z-20 flex justify-center items-center min-h-screen px-4">
                    <div className={`${styles.errorBg} rounded-2xl p-8 max-w-md`}>
                        <p className={`${styles.errorText} text-center font-medium`}>Error: {error}</p>
                    </div>
                </div>
            </div>
        );
    }

    const columns = [
        { key: 'assetnumber', label: 'Asset Number', sortable: true },
        { key: 'assetdescription', label: 'Description', sortable: true },
        { key: 'assetstatus', label: 'Status', sortable: true },
        { key: 'assetmodel', label: 'Model' },
        { key: 'assetmanufacturer', label: 'Manufacturer' },
        { key: 'assetserialnumber', label: 'Serial Number' },
        { key: 'warehouseCity', label: 'Warehouse', sortable: true },
        { key: 'actions', label: 'Actions' },
    ];

    const getStatusBadgeStyles = (status: string) => {
        if (theme === 'light') {
            switch (status) {
                case 'Active':
                    return 'bg-green-100 text-green-800 border border-green-300';
                case 'Under Repair':
                    return 'bg-amber-100 text-amber-800 border border-amber-300';
                case 'Retired':
                    return 'bg-red-100 text-red-800 border border-red-300';
                case 'In Calibration':
                    return 'bg-teal-100 text-teal-800 border border-teal-300';
                default:
                    return 'bg-gray-100 text-gray-800 border border-gray-300';
            }
        } else if (theme === 'glassmorphic') {
            switch (status) {
                case 'Active':
                    return 'bg-green-500/20 text-green-300 border border-green-400/30';
                case 'Under Repair':
                    return 'bg-amber-500/20 text-amber-300 border border-amber-400/30';
                case 'Retired':
                    return 'bg-red-500/20 text-red-300 border border-red-400/30';
                case 'In Calibration':
                    return 'bg-teal-500/20 text-teal-300 border border-teal-400/30';
                default:
                    return 'bg-white/10 text-slate-300 border border-white/20';
            }
        } else { // dark
            switch (status) {
                case 'Active':
                    return 'bg-green-900/40 text-green-300 border border-green-700/50';
                case 'Under Repair':
                    return 'bg-amber-900/40 text-amber-300 border border-amber-700/50';
                case 'Retired':
                    return 'bg-red-900/40 text-red-300 border border-red-700/50';
                case 'In Calibration':
                    return 'bg-teal-900/40 text-teal-300 border border-teal-700/50';
                default:
                    return 'bg-slate-700/50 text-slate-300 border border-slate-600/50';
            }
        }
    };

    const formattedData = equipment.map(item => ({
        ...item,
        assetnumber: (
            <Link 
                href={`/asset/${item.assetnumber}`}
                className={`${backgroundStyles.linkColor} font-medium transition-colors`}
            >
                {item.assetnumber}
            </Link>
        ),
        assetmanufacturer: (
            <span className={`${theme === 'light' ? 'text-blue-700' : theme === 'glassmorphic' ? 'text-teal-300' : 'text-teal-400'} font-medium`}>
                {item.assetmanufacturer}
            </span>
        ),
        assetstatus: (
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeStyles(item.assetstatus)}`}>
                {item.assetstatus}
            </span>
        ),
        actions: (
            <button
                onClick={() => handleDownloadUndertaking(item.assetnumber)}
                className={`inline-flex items-center justify-center p-2 ${backgroundStyles.actionButton} rounded-lg transition-all duration-300`}
                title="Download Undertaking Letter"
            >
                <Download className="h-4 w-4" />
            </button>
        ),
    }));

    // Map theme to ResponsiveTable variant
    const getTableVariant = () => {
        if (theme === 'glassmorphic') return 'glassmorphic';
        if (theme === 'light') return 'light';
        return 'default'; // dark theme
    };

    return (
        <div className={backgroundStyles.container}>
            {/* Animated background canvas */}
            <canvas ref={canvasRef} className="absolute inset-0 z-10" />
            
            {/* Main content */}
            <div className="relative z-20 pt-8 pb-12 px-4 sm:px-6 lg:px-8">
                {/* Header Section */}
                <div className="max-w-7xl mx-auto mb-8">
                    <div className={`${backgroundStyles.headerBg} ${backgroundStyles.headerHover} rounded-3xl p-8 transition-all duration-300`}>
                        <h1 className={`text-2xl md:text-3xl font-bold mb-4 ${backgroundStyles.headerTitle}`}>
                            Warehouse Equipment Report
                        </h1>
                        <p className={`${backgroundStyles.headerSubtitle} text-lg`}>
                            View all equipment currently stored in warehouses across different locations.
                        </p>
                        <div className="mt-6 flex flex-wrap gap-4">
                            <div className={`${backgroundStyles.statBg} rounded-xl px-6 py-3`}>
                                <div className={`text-2xl font-bold ${backgroundStyles.statValue}`}>{equipment.length}</div>
                                <div className={`${backgroundStyles.statLabel} text-sm uppercase tracking-wider`}>Warehouse Items</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Table Section */}
                <div className="max-w-7xl mx-auto">
                    <div className={`${backgroundStyles.tableBg} ${backgroundStyles.tableHover} rounded-3xl shadow-2xl overflow-hidden transition-all duration-300`}>
                        <div className="p-6 lg:p-8">
                            <ResponsiveTable
                                columns={columns}
                                data={formattedData}
                                sortField={sortField}
                                sortOrder={sortOrder}
                                onSort={toggleSort}
                                variant={getTableVariant()}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 