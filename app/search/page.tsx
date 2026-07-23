'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowUpDown, Search, X, MapPin, User, AlertTriangle, Wrench, Building, ChevronDown } from 'lucide-react';
import Loading from '@/app/components/Loading';
import ResponsiveTable from '@/components/ui/responsive-table';
import Link from 'next/link';
import { useAppTheme } from '@/app/contexts/ThemeContext';

interface SearchResult {
    assetnumber: string;
    assetdescription: string;
    assetstatus: string;
    assetmodel: string;
    assetmanufacturer: string;
    assetserialnumber: string;
    acquireddate: string;
    acquiredvalue: number;
    assetcategory: string;
    assetsubcategory: string;
    assetnotes: string;
    accessories: string;
    location: string;
    custodyDetails?: any;
}

type SortField = 'assetnumber' | 'assetdescription' | 'acquireddate' | 'acquiredvalue';
type SortOrder = 'asc' | 'desc';
type SearchType = 'dammam' | 'jubail' | 'with_users' | 'not_traced' | 'mme' | 'fixed_assets';
type AssetType = 'mme' | 'fixed_assets';

const searchOptions = [
    { value: 'dammam', label: 'Lying in Dammam Warehouse', icon: MapPin, color: 'text-blue-600' },
    { value: 'jubail', label: 'Lying in Jubail Warehouse', icon: MapPin, color: 'text-green-600' },
    { value: 'with_users', label: 'Equipment with Users\' Custody', icon: User, color: 'text-purple-600' },
    { value: 'not_traced', label: 'Equipment Not Yet Traced (No Custody)', icon: AlertTriangle, color: 'text-red-600' },
    { value: 'mme', label: 'MME (Measuring & Monitoring Equipment)', icon: Wrench, color: 'text-orange-600' },
    { value: 'fixed_assets', label: 'Fixed Assets', icon: Building, color: 'text-indigo-600' },
];

export default function AssetSearchPage() {
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

    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sortField, setSortField] = useState<SortField>('assetnumber');
    const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
    
    // Filter states
    const [minValue, setMinValue] = useState(0);
    const [maxValue, setMaxValue] = useState(1000000);
    const [minDate, setMinDate] = useState('');
    const [maxDate, setMaxDate] = useState('');
    const [searchType, setSearchType] = useState<SearchType>('mme');
    const [assetType, setAssetType] = useState<AssetType>('mme');
    const [hasSearched, setHasSearched] = useState(false);
    const [isComboBoxOpen, setIsComboBoxOpen] = useState(false);
    const [isDragging, setIsDragging] = useState<'min' | 'max' | null>(null);

    const searchAssets = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const params = new URLSearchParams({
                sortField,
                sortOrder,
                searchType,
                assetType,
            });

            if (minValue > 0) params.append('minValue', minValue.toString());
            if (maxValue < 1000000) params.append('maxValue', maxValue.toString());
            if (minDate) params.append('minDate', minDate);
            if (maxDate) params.append('maxDate', maxDate);

            const response = await fetch(`/api/search/assets?${params}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to search assets');
            }
            
            const result = await response.json();
            setResults(result.data);
            setHasSearched(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to search assets');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const clearFilters = () => {
        setMinValue(0);
        setMaxValue(1000000);
        setMinDate('');
        setMaxDate('');
        setSearchType('mme');
        setAssetType('mme');
        setResults([]);
        setHasSearched(false);
        setError(null);
    };

    const toggleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('asc');
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString();
    };

    const formatCurrency = (value: number) => {
        if (!value) return 'N/A';
        return new Intl.NumberFormat('en-SA', {
            style: 'currency',
            currency: 'SAR'
        }).format(value);
    };

    const getSelectedOption = () => {
        return searchOptions.find(option => option.value === searchType);
    };

    // Mouse event handlers for slider dragging
    const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging) return;
        
        const sliderContainer = document.querySelector('.slider-container') as HTMLElement;
        if (!sliderContainer) return;
        
        const rect = sliderContainer.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percentage = Math.max(0, Math.min(1, clickX / rect.width));
        const newValue = Math.round(percentage * 1000000 / 10000) * 10000;
        
        if (isDragging === 'min' && newValue <= maxValue) {
            setMinValue(newValue);
        } else if (isDragging === 'max' && newValue >= minValue) {
            setMaxValue(newValue);
        }
    };

    const handleMouseUp = () => {
        setIsDragging(null);
    };

    // Add event listeners for mouse events
    React.useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }
        
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, minValue, maxValue]);

    // Theme-based styling function
    const getBackgroundStyles = () => {
        switch (theme) {
            case 'glassmorphic':
                return {
                    container: 'relative min-h-screen overflow-hidden bg-gradient-to-br from-[#1a2332] via-[#2d3748] to-[#1a2332]',
                    headerBg: 'bg-white/10 backdrop-blur-lg border border-white/20',
                    headerTitle: 'bg-gradient-to-r from-white to-teal-400 bg-clip-text text-transparent',
                    headerSubtitle: 'text-white/80',
                    searchBg: 'bg-white/10 backdrop-blur-lg border border-white/20',
                    inputBg: 'bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-white/70 focus:ring-teal-400',
                    buttonPrimary: 'bg-teal-500 hover:bg-teal-600 text-white',
                    buttonSecondary: 'bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20',
                    sliderTrack: 'bg-white/20',
                    sliderActive: 'bg-teal-500',
                    sliderThumb: 'bg-teal-500 border-white hover:bg-teal-600',
                    comboBoxBg: 'bg-white/10 backdrop-blur-lg border border-white/20',
                    comboBoxItem: 'hover:bg-white/20',
                    comboBoxItemActive: 'bg-white/20',
                    comboBoxIcon: 'text-teal-400',
                    comboBoxText: 'text-white',
                    assetTypeActive: 'border-teal-500 bg-teal-500/20 text-white',
                    assetTypeInactive: 'border-white/20 bg-white/10 text-white/70 hover:bg-white/20 hover:text-white',
                    resultsBg: 'border border-white/20 bg-white/10 backdrop-blur-lg',
                    resultsTitle: 'text-white',
                    resultsCount: 'text-white/80',
                    spinnerColor: 'border-teal-400',
                    errorBg: 'bg-red-500/20 border border-red-400/30',
                    errorText: 'text-red-300',
                    emptyText: 'text-white/80',
                    linkColor: 'text-teal-400 hover:text-teal-300',
                    statusActive: 'bg-green-500/20 text-green-300 border border-green-400/30',
                    statusInactive: 'bg-red-500/20 text-red-300 border border-red-400/30',
                    statusDefault: 'bg-white/10 text-white/70 border border-white/20',
                    locationDammam: 'bg-blue-500/20 text-blue-300 border border-blue-400/30',
                    locationJubail: 'bg-green-500/20 text-green-300 border border-green-400/30',
                    locationUsers: 'bg-purple-500/20 text-purple-300 border border-purple-400/30',
                    locationNotTraced: 'bg-red-500/20 text-red-300 border border-red-400/30',
                    locationDefault: 'bg-white/10 text-white/70 border border-white/20',
                    labelText: 'text-white',
                    categoryText: 'text-white',
                    categorySubtext: 'text-white/70'
                };
            case 'light':
                return {
                    container: 'relative min-h-screen overflow-hidden bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100',
                    headerBg: 'bg-white border-2 border-blue-200 shadow-lg',
                    headerTitle: 'bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent',
                    headerSubtitle: 'text-gray-700',
                    searchBg: 'bg-white border-2 border-blue-200 shadow-md',
                    inputBg: 'bg-white border-2 border-blue-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500',
                    buttonPrimary: 'bg-blue-600 hover:bg-blue-700 text-white border-2 border-blue-500',
                    buttonSecondary: 'bg-gray-100 border-2 border-gray-300 text-gray-700 hover:bg-gray-200',
                    sliderTrack: 'bg-gray-300',
                    sliderActive: 'bg-blue-600',
                    sliderThumb: 'bg-blue-600 border-white hover:bg-blue-700',
                    comboBoxBg: 'bg-white border-2 border-blue-200 shadow-md',
                    comboBoxItem: 'hover:bg-blue-50',
                    comboBoxItemActive: 'bg-blue-100',
                    comboBoxIcon: 'text-blue-600',
                    comboBoxText: 'text-gray-900',
                    assetTypeActive: 'border-blue-600 bg-blue-100 text-blue-900',
                    assetTypeInactive: 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
                    resultsBg: 'border-2 border-blue-200 bg-white shadow-md',
                    resultsTitle: 'text-gray-900',
                    resultsCount: 'text-gray-700',
                    spinnerColor: 'border-blue-500',
                    errorBg: 'bg-red-100 border-2 border-red-300',
                    errorText: 'text-red-700',
                    emptyText: 'text-gray-600',
                    linkColor: 'text-blue-600 hover:text-blue-700',
                    statusActive: 'bg-green-100 text-green-800 border-2 border-green-300',
                    statusInactive: 'bg-red-100 text-red-800 border-2 border-red-300',
                    statusDefault: 'bg-gray-100 text-gray-800 border-2 border-gray-300',
                    locationDammam: 'bg-blue-100 text-blue-800 border-2 border-blue-300',
                    locationJubail: 'bg-green-100 text-green-800 border-2 border-green-300',
                    locationUsers: 'bg-purple-100 text-purple-800 border-2 border-purple-300',
                    locationNotTraced: 'bg-red-100 text-red-800 border-2 border-red-300',
                    locationDefault: 'bg-gray-100 text-gray-800 border-2 border-gray-300',
                    labelText: 'text-gray-900',
                    categoryText: 'text-gray-900',
                    categorySubtext: 'text-gray-600'
                };
            default: // dark theme
                return {
                    container: 'relative min-h-screen overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a]',
                    headerBg: 'bg-slate-800/90 border border-slate-700 shadow-xl',
                    headerTitle: 'bg-gradient-to-r from-slate-100 to-teal-400 bg-clip-text text-transparent',
                    headerSubtitle: 'text-slate-300',
                    searchBg: 'bg-slate-800/90 border border-slate-700 shadow-xl',
                    inputBg: 'bg-slate-800/90 border border-slate-600 text-slate-100 placeholder-slate-400 focus:ring-teal-400 focus:border-teal-400',
                    buttonPrimary: 'bg-teal-600 hover:bg-teal-700 text-white border border-teal-500',
                    buttonSecondary: 'bg-slate-700/50 border border-slate-600 text-slate-200 hover:bg-slate-600',
                    sliderTrack: 'bg-slate-600',
                    sliderActive: 'bg-teal-600',
                    sliderThumb: 'bg-teal-600 border-slate-300 hover:bg-teal-700',
                    comboBoxBg: 'bg-slate-800/95 border border-slate-700 shadow-xl',
                    comboBoxItem: 'hover:bg-slate-700/50',
                    comboBoxItemActive: 'bg-slate-700/70',
                    comboBoxIcon: 'text-teal-400',
                    comboBoxText: 'text-slate-200',
                    assetTypeActive: 'border-teal-500 bg-teal-500/20 text-slate-100',
                    assetTypeInactive: 'border-slate-600 bg-slate-700/50 text-slate-400 hover:bg-slate-600 hover:text-slate-200',
                    resultsBg: 'border border-slate-700 bg-slate-800/90 shadow-xl',
                    resultsTitle: 'text-slate-100',
                    resultsCount: 'text-slate-300',
                    spinnerColor: 'border-teal-400',
                    errorBg: 'bg-red-900/50 border border-red-700',
                    errorText: 'text-red-400',
                    emptyText: 'text-slate-400',
                    linkColor: 'text-teal-400 hover:text-teal-300',
                    statusActive: 'bg-green-900/50 text-green-300 border border-green-700',
                    statusInactive: 'bg-red-900/50 text-red-300 border border-red-700',
                    statusDefault: 'bg-slate-700/50 text-slate-300 border border-slate-600',
                    locationDammam: 'bg-blue-900/50 text-blue-300 border border-blue-700',
                    locationJubail: 'bg-green-900/50 text-green-300 border border-green-700',
                    locationUsers: 'bg-purple-900/50 text-purple-300 border border-purple-700',
                    locationNotTraced: 'bg-red-900/50 text-red-300 border border-red-700',
                    locationDefault: 'bg-slate-700/50 text-slate-300 border border-slate-600',
                    labelText: 'text-slate-200',
                    categoryText: 'text-slate-200',
                    categorySubtext: 'text-slate-400'
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

    return (
        <div className={backgroundStyles.container}>
            {/* Animated background canvas */}
            <canvas ref={canvasRef} className="absolute inset-0 z-10" />
            
            {/* Main content */}
            <div className="relative z-20 flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6 min-h-screen">
                {/* Header Section */}
                <div className={`${backgroundStyles.headerBg} rounded-2xl p-6 shadow-xl`}>
                    <h1 className={`text-2xl font-bold ${backgroundStyles.headerTitle} mb-2`}>
                        Asset Search & Filter
                    </h1>
                    <p className={`${backgroundStyles.headerSubtitle} text-lg`}>Search and filter assets by various criteria</p>
                </div>
            
                {/* Compact Search Section */}
                <div className={`p-6 ${backgroundStyles.searchBg} rounded-2xl shadow-xl`}>
                <div className="space-y-4">
                    {/* Value Range Slider */}
                    <div>
                        <label className={`block text-sm font-medium mb-3 ${backgroundStyles.labelText}`}>
                            Acquisition Value Range: {minValue.toLocaleString()} - {maxValue.toLocaleString()} SAR
                        </label>
                        <div className="relative h-8 slider-container">
                            {/* Background track */}
                            <div className={`absolute top-4 left-0 right-0 h-2 ${backgroundStyles.sliderTrack} rounded-lg`}></div>
                            
                            {/* Active range track */}
                            <div 
                                className={`absolute top-4 h-2 ${backgroundStyles.sliderActive} rounded-lg`}
                                style={{
                                    left: `${(minValue / 1000000) * 100}%`,
                                    width: `${((maxValue - minValue) / 1000000) * 100}%`
                                }}
                            ></div>
                            
                            {/* Track click handler */}
                            <div 
                                className="absolute top-0 left-0 right-0 h-8 cursor-pointer"
                                onClick={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    const clickX = e.clientX - rect.left;
                                    const percentage = clickX / rect.width;
                                    const newValue = Math.round(percentage * 1000000 / 10000) * 10000;
                                    
                                    // Determine which thumb to move based on which is closer
                                    const minDistance = Math.abs(newValue - minValue);
                                    const maxDistance = Math.abs(newValue - maxValue);
                                    
                                    if (minDistance < maxDistance) {
                                        if (newValue <= maxValue) {
                                            setMinValue(newValue);
                                        }
                                    } else {
                                        if (newValue >= minValue) {
                                            setMaxValue(newValue);
                                        }
                                    }
                                }}
                            ></div>
                            
                            {/* Min value thumb */}
                            <div 
                                className={`absolute top-2 w-4 h-4 ${backgroundStyles.sliderThumb} rounded-full border-2 shadow-lg cursor-pointer transition-colors z-10`}
                                style={{ left: `calc(${(minValue / 1000000) * 100}% - 8px)` }}
                                onMouseDown={() => setIsDragging('min')}
                            ></div>
                            
                            {/* Max value thumb */}
                            <div 
                                className={`absolute top-2 w-4 h-4 ${backgroundStyles.sliderThumb} rounded-full border-2 shadow-lg cursor-pointer transition-colors z-10`}
                                style={{ left: `calc(${(maxValue / 1000000) * 100}% - 8px)` }}
                                onMouseDown={() => setIsDragging('max')}
                            ></div>
                        </div>
                        <div className={`flex justify-between text-xs ${theme === 'light' ? 'text-gray-600' : theme === 'glassmorphic' ? 'text-white/70' : 'text-slate-400'} mt-1`}>
                            <span>0 SAR</span>
                            <span>1,000,000 SAR</span>
                        </div>
                    </div>

                    {/* Date Range and Search Type */}
                    <div className="flex gap-4 items-end">
                        <div className="flex-1 max-w-[200px]">
                            <label className={`block text-sm font-medium mb-2 ${backgroundStyles.labelText}`}>
                                From Date
                            </label>
                            <Input
                                type="date"
                                value={minDate}
                                onChange={(e) => setMinDate(e.target.value)}
                                className={`w-full rounded-xl ${backgroundStyles.inputBg} focus:outline-none focus:ring-2 focus:border-transparent transition-all`}
                            />
                        </div>
                        <div className="flex-1 max-w-[200px]">
                            <label className={`block text-sm font-medium mb-2 ${backgroundStyles.labelText}`}>
                                To Date
                            </label>
                            <Input
                                type="date"
                                value={maxDate}
                                onChange={(e) => setMaxDate(e.target.value)}
                                className={`w-full rounded-xl ${backgroundStyles.inputBg} focus:outline-none focus:ring-2 focus:border-transparent transition-all`}
                            />
                        </div>
                        <div className="flex-1 max-w-[500px]">
                            <label className={`block text-sm font-medium mb-2 ${backgroundStyles.labelText}`}>
                                Search Type
                            </label>
                            <div className="relative">
                                <button
                                    onClick={() => setIsComboBoxOpen(!isComboBoxOpen)}
                                    className={`w-full flex items-center justify-between p-3 rounded-xl ${backgroundStyles.inputBg} hover:bg-opacity-80 focus:outline-none focus:ring-2 transition-all duration-200`}
                                >
                                    <div className="flex items-center gap-2 min-w-0">
                                        {(() => {
                                            const selectedOption = getSelectedOption();
                                            const IconComponent = selectedOption?.icon;
                                            return (
                                                <>
                                                    {IconComponent && <IconComponent className={`h-4 w-4 ${backgroundStyles.comboBoxIcon} flex-shrink-0`} />}
                                                    <span className={`text-sm truncate ${backgroundStyles.comboBoxText}`}>{selectedOption?.label}</span>
                                                </>
                                            );
                                        })()}
                                    </div>
                                    <ChevronDown className={`h-4 w-4 ${theme === 'light' ? 'text-gray-600' : theme === 'glassmorphic' ? 'text-white/70' : 'text-slate-400'} transition-transform duration-200 flex-shrink-0 ${isComboBoxOpen ? 'rotate-180' : ''}`} />
                                </button>
                                
                                {isComboBoxOpen && (
                                    <div className={`absolute z-[9999] w-full mt-1 ${backgroundStyles.comboBoxBg} rounded-xl shadow-xl max-h-60 overflow-y-auto`}>
                                        {searchOptions.map((option) => {
                                            const IconComponent = option.icon;
                                            return (
                                                <button
                                                    key={option.value}
                                                    onClick={() => {
                                                        setSearchType(option.value as SearchType);
                                                        if (option.value === 'fixed_assets') {
                                                            setAssetType('fixed_assets');
                                                        } else if (option.value === 'mme') {
                                                            setAssetType('mme');
                                                        }
                                                        setIsComboBoxOpen(false);
                                                    }}
                                                    className={`w-full flex items-center gap-2 p-3 text-left ${backgroundStyles.comboBoxItem} transition-colors ${
                                                        searchType === option.value ? backgroundStyles.comboBoxItemActive : ''
                                                    }`}
                                                >
                                                    <IconComponent className={`h-4 w-4 ${backgroundStyles.comboBoxIcon} flex-shrink-0`} />
                                                    <span className={`text-sm ${backgroundStyles.comboBoxText} truncate`}>{option.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Asset Type Selection (only show for MME/Fixed Assets) */}
                    {(searchType === 'mme' || searchType === 'fixed_assets') && (
                        <div className="flex gap-3">
                            <button
                                onClick={() => setAssetType('mme')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all ${
                                    assetType === 'mme'
                                        ? backgroundStyles.assetTypeActive
                                        : backgroundStyles.assetTypeInactive
                                }`}
                            >
                                <Wrench className="h-5 w-5" />
                                <span className="text-sm font-medium">MME</span>
                            </button>
                            <button
                                onClick={() => setAssetType('fixed_assets')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all ${
                                    assetType === 'fixed_assets'
                                        ? backgroundStyles.assetTypeActive
                                        : backgroundStyles.assetTypeInactive
                                }`}
                            >
                                <Building className="h-5 w-5" />
                                <span className="text-sm font-medium">Fixed Assets</span>
                            </button>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center gap-4">
                        <Button 
                            onClick={searchAssets} 
                            className={`flex items-center gap-2 rounded-xl ${backgroundStyles.buttonPrimary}`}
                            disabled={loading}
                        >
                            <Search className="h-4 w-4" />
                            {loading ? 'Searching...' : 'Search Assets'}
                        </Button>
                        <Button 
                            variant="outline" 
                            onClick={clearFilters} 
                            className={`flex items-center gap-2 rounded-xl ${backgroundStyles.buttonSecondary}`}
                        >
                            <X className="h-4 w-4" />
                            Clear All
                        </Button>
                    </div>
                </div>
            </div>

            {/* Results Section with Gradient Background */}
            {hasSearched && (
                <div className={`rounded-xl ${backgroundStyles.resultsBg} shadow-xl`}>
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                {getSelectedOption() && (
                                    <>
                                        {(() => {
                                            const IconComponent = getSelectedOption()!.icon;
                                            return <IconComponent className={`h-5 w-5 ${backgroundStyles.comboBoxIcon}`} />;
                                        })()}
                                        <span className={`font-medium ${backgroundStyles.resultsTitle}`}>
                                            {getSelectedOption()!.label}
                                        </span>
                                    </>
                                )}
                            </div>
                            <div className={`text-sm ${backgroundStyles.resultsCount}`}>
                                Total Results: <span className={`font-semibold ${backgroundStyles.resultsTitle}`}>{results.length}</span>
                            </div>
                        </div>

                        {loading ? (
                            <div className="flex justify-center items-center h-32">
                                <div className={`animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 ${backgroundStyles.spinnerColor}`}></div>
                            </div>
                        ) : error ? (
                            <div className={`${backgroundStyles.errorText} text-center p-4 ${backgroundStyles.errorBg} rounded-lg`}>
                                Error: {error}
                            </div>
                        ) : results.length === 0 ? (
                            <div className={`text-center py-8 ${backgroundStyles.emptyText}`}>
                                No assets found matching your criteria
                            </div>
                        ) : (
                            <ResponsiveTable
                                columns={[
                                    { key: 'assetnumber', label: 'Asset Number', sortable: true },
                                    { key: 'assetdescription', label: 'Description', sortable: true },
                                    { key: 'assetstatus', label: 'Status' },
                                    { key: 'assetcategory', label: 'Category' },
                                    { key: 'assetmodel', label: 'Model' },
                                    { key: 'assetmanufacturer', label: 'Manufacturer' },
                                    { key: 'assetserialnumber', label: 'Serial Number' },
                                    { key: 'location', label: 'Location' },
                                    { key: 'acquireddate', label: 'Acquired Date', sortable: true },
                                    { key: 'acquiredvalue', label: 'Acquired Value', sortable: true },
                                ]}
                                data={results.map(asset => ({
                                    ...asset,
                                    assetnumber: (
                                        <Link 
                                            href={`/asset/${asset.assetnumber}`}
                                            className={`${backgroundStyles.linkColor} font-medium transition-colors`}
                                        >
                                            {asset.assetnumber}
                                        </Link>
                                    ),
                                    assetstatus: (
                                        <span className={`px-2 py-1 rounded-full text-xs ${
                                            asset.assetstatus === 'Active' 
                                                ? backgroundStyles.statusActive
                                                : asset.assetstatus === 'Inactive'
                                                ? backgroundStyles.statusInactive
                                                : backgroundStyles.statusDefault
                                        }`}>
                                            {asset.assetstatus}
                                        </span>
                                    ),
                                    assetcategory: (
                                        <div className="text-sm">
                                            <div className={`font-medium ${backgroundStyles.categoryText}`}>{asset.assetcategory}</div>
                                            {asset.assetsubcategory && (
                                                <div className={backgroundStyles.categorySubtext}>{asset.assetsubcategory}</div>
                                            )}
                                        </div>
                                    ),
                                    assetmodel: asset.assetmodel || 'N/A',
                                    assetmanufacturer: asset.assetmanufacturer || 'N/A',
                                    assetserialnumber: asset.assetserialnumber || 'N/A',
                                    location: (
                                        <span className={`px-2 py-1 rounded-full text-xs ${
                                            asset.location === 'Dammam Warehouse' ? backgroundStyles.locationDammam :
                                            asset.location === 'Jubail Warehouse' ? backgroundStyles.locationJubail :
                                            asset.location === 'With Users' ? backgroundStyles.locationUsers :
                                            asset.location === 'Not Traced' ? backgroundStyles.locationNotTraced :
                                            backgroundStyles.locationDefault
                                        }`}>
                                            {asset.location}
                                        </span>
                                    ),
                                    acquireddate: formatDate(asset.acquireddate),
                                    acquiredvalue: formatCurrency(asset.acquiredvalue),
                                }))}
                                sortField={sortField}
                                sortOrder={sortOrder}
                                onSort={toggleSort}
                                variant={theme === 'light' ? 'light' : 'glassmorphic'}
                            />
                        )}
                    </div>
                </div>
            )}
            </div>
        </div>
    );
}
