'use client';
import { useState, useEffect, FormEvent, useRef } from 'react';
import { 
  ColumnDef,
  SortingState,
  ColumnFiltersState
} from '@tanstack/react-table';
import { ArrowUpDown, Plus, Edit, Trash2, Upload, Download, Package, Send, ClipboardList, AlertTriangle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import ResponsiveTanStackTable from '@/components/ui/responsive-tanstack-table';
import { ProjectReturnMaterialData } from '@/types/projectreturnmaterials';
import AssetQRCode from '@/components/AssetQRCode';
import ProjectReturnMaterialRequestForm from '@/components/ProjectReturnMaterialRequestForm';
import ProjectReturnMaterialIssueForm from '@/components/ProjectReturnMaterialIssueForm';
import { useAppTheme } from '@/app/contexts/ThemeContext';

export default function ProjectReturnMaterialsPage() {
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

  const [data, setData] = useState<ProjectReturnMaterialData[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [materialCodeFilter, setMaterialCodeFilter] = useState('');
  const [materialDescriptionFilter, setMaterialDescriptionFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<ProjectReturnMaterialData | null>(null);
  const [showImportForm, setShowImportForm] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<ProjectReturnMaterialData | null>(null);
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [showDisposeModal, setShowDisposeModal] = useState(false);
  const [materialToDispose, setMaterialToDispose] = useState<ProjectReturnMaterialData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    fetchMaterials();
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
          actionCardBg: 'bg-white/10 backdrop-blur-lg border border-white/20',
          actionIconBg: 'bg-purple-500/80 backdrop-blur-md text-white border-white/20',
          actionIconHover: 'hover:bg-purple-500',
          actionIconText: 'text-white/80',
          filterCardBg: 'bg-white/10 backdrop-blur-lg border border-white/20',
          labelText: 'text-white',
          inputBg: 'bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-white/70 focus:ring-teal-400',
          selectBg: 'bg-white/10 backdrop-blur-md border border-white/20 text-white',
          selectOption: 'bg-[#1a2332]',
          tableBg: 'bg-white/10 backdrop-blur-lg border border-white/20',
          spinnerColor: 'border-teal-400',
          loadingBg: 'bg-gradient-to-br from-[#1a2332] via-[#2d3748] to-[#1a2332]',
          linkColor: 'text-teal-400 hover:text-teal-300',
          cellText: 'text-white',
          cellSubtext: 'text-white/80',
          badgePending: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
          badgeDefault: 'bg-white/10 text-white/80 border-white/20',
          actionButtonRequest: 'text-orange-400 hover:text-orange-300 hover:bg-white/10',
          actionButtonIssue: 'text-green-400 hover:text-green-300 hover:bg-white/10',
          actionButtonEdit: 'text-teal-400 hover:text-teal-300 hover:bg-white/10',
          actionButtonDispose: 'text-purple-400 hover:text-purple-300 hover:bg-white/10',
          actionButtonDelete: 'text-red-400 hover:text-red-300 hover:bg-white/10',
          modalOverlay: 'bg-black/60 backdrop-blur-sm',
          modalBg: 'bg-white/10 backdrop-blur-lg border border-white/20',
          modalTitle: 'text-white',
          modalInput: 'bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-white/70 focus:ring-teal-400',
          modalInputDisabled: 'bg-white/5 backdrop-blur-md border border-white/10 text-white/50',
          modalTextarea: 'bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-white/70 focus:ring-teal-400',
          modalButtonCancel: 'bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white',
          modalButtonSubmit: 'bg-teal-500 hover:bg-teal-600 text-white',
          modalButtonImport: 'bg-green-500 hover:bg-green-600 text-white',
          modalButtonDisabled: 'disabled:opacity-50 disabled:cursor-not-allowed',
          infoBoxBg: 'bg-blue-50 dark:bg-blue-900/20',
          infoBoxText: 'text-white',
          warningBoxBg: 'bg-yellow-500/20 backdrop-blur-md border-yellow-500/30',
          warningBoxTitle: 'text-yellow-300',
          warningBoxText: 'text-yellow-200/90',
          disposeWarningBg: 'bg-red-500/20 backdrop-blur-md border-red-500/30',
          disposeWarningText: 'text-red-300'
        };
      case 'light':
        return {
          container: 'relative min-h-screen overflow-hidden bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100',
          headerBg: 'bg-white border-2 border-blue-200 shadow-lg',
          headerTitle: 'bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent',
          headerSubtitle: 'text-gray-700',
          actionCardBg: 'bg-white border-2 border-blue-200 shadow-md',
          actionIconBg: 'bg-purple-600 text-white border-2 border-purple-500',
          actionIconHover: 'hover:bg-purple-700',
          actionIconText: 'text-gray-700',
          filterCardBg: 'bg-white border-2 border-blue-200 shadow-md',
          labelText: 'text-gray-900',
          inputBg: 'bg-white border-2 border-blue-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500',
          selectBg: 'bg-white border-2 border-blue-300 text-gray-900',
          selectOption: 'bg-white',
          tableBg: 'bg-white border-2 border-blue-200 shadow-md',
          spinnerColor: 'border-blue-500',
          loadingBg: 'bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100',
          linkColor: 'text-blue-600 hover:text-blue-700',
          cellText: 'text-gray-900',
          cellSubtext: 'text-gray-600',
          badgePending: 'bg-orange-100 text-orange-800 border-2 border-orange-300',
          badgeDefault: 'bg-gray-100 text-gray-800 border-2 border-gray-300',
          actionButtonRequest: 'text-orange-600 hover:text-orange-700 hover:bg-orange-50',
          actionButtonIssue: 'text-green-600 hover:text-green-700 hover:bg-green-50',
          actionButtonEdit: 'text-blue-600 hover:text-blue-700 hover:bg-blue-50',
          actionButtonDispose: 'text-purple-600 hover:text-purple-700 hover:bg-purple-50',
          actionButtonDelete: 'text-red-600 hover:text-red-700 hover:bg-red-50',
          modalOverlay: 'bg-black/40 backdrop-blur-sm',
          modalBg: 'bg-white border-2 border-blue-200 shadow-xl',
          modalTitle: 'text-gray-900',
          modalInput: 'bg-white border-2 border-blue-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500',
          modalInputDisabled: 'bg-gray-100 border-2 border-gray-300 text-gray-500',
          modalTextarea: 'bg-white border-2 border-blue-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500',
          modalButtonCancel: 'bg-gray-100 border-2 border-gray-300 text-gray-700 hover:bg-gray-200',
          modalButtonSubmit: 'bg-blue-600 hover:bg-blue-700 text-white border-2 border-blue-500',
          modalButtonImport: 'bg-green-600 hover:bg-green-700 text-white border-2 border-green-500',
          modalButtonDisabled: 'disabled:opacity-50 disabled:cursor-not-allowed',
          infoBoxBg: 'bg-blue-100 border-2 border-blue-300',
          infoBoxText: 'text-gray-900',
          warningBoxBg: 'bg-yellow-100 border-2 border-yellow-300',
          warningBoxTitle: 'text-yellow-800',
          warningBoxText: 'text-yellow-700',
          disposeWarningBg: 'bg-red-100 border-2 border-red-300',
          disposeWarningText: 'text-red-800'
        };
      default: // dark theme
        return {
          container: 'relative min-h-screen overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a]',
          headerBg: 'bg-slate-800/90 border border-slate-700 shadow-xl',
          headerTitle: 'bg-gradient-to-r from-slate-100 to-teal-400 bg-clip-text text-transparent',
          headerSubtitle: 'text-slate-300',
          actionCardBg: 'bg-slate-800/90 border border-slate-700 shadow-xl',
          actionIconBg: 'bg-purple-600 text-white border border-purple-500',
          actionIconHover: 'hover:bg-purple-700',
          actionIconText: 'text-slate-300',
          filterCardBg: 'bg-slate-800/90 border border-slate-700 shadow-xl',
          labelText: 'text-slate-200',
          inputBg: 'bg-slate-800/90 border border-slate-600 text-slate-100 placeholder-slate-400 focus:ring-teal-400 focus:border-teal-400',
          selectBg: 'bg-slate-800/90 border border-slate-600 text-slate-100',
          selectOption: 'bg-slate-800',
          tableBg: 'bg-slate-800/90 border border-slate-700 shadow-xl',
          spinnerColor: 'border-teal-400',
          loadingBg: 'bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a]',
          linkColor: 'text-teal-400 hover:text-teal-300',
          cellText: 'text-slate-200',
          cellSubtext: 'text-slate-400',
          badgePending: 'bg-orange-900/50 text-orange-300 border border-orange-700',
          badgeDefault: 'bg-slate-700/50 text-slate-300 border border-slate-600',
          actionButtonRequest: 'text-orange-400 hover:text-orange-300 hover:bg-slate-800',
          actionButtonIssue: 'text-green-400 hover:text-green-300 hover:bg-slate-800',
          actionButtonEdit: 'text-teal-400 hover:text-teal-300 hover:bg-slate-800',
          actionButtonDispose: 'text-purple-400 hover:text-purple-300 hover:bg-slate-800',
          actionButtonDelete: 'text-red-400 hover:text-red-300 hover:bg-slate-800',
          modalOverlay: 'bg-black/70 backdrop-blur-sm',
          modalBg: 'bg-slate-800/95 border border-slate-700 shadow-xl',
          modalTitle: 'text-slate-100',
          modalInput: 'bg-slate-800/90 border border-slate-600 text-slate-100 placeholder-slate-400 focus:ring-teal-400 focus:border-teal-400',
          modalInputDisabled: 'bg-slate-700/30 border border-slate-600/50 text-slate-500',
          modalTextarea: 'bg-slate-800/90 border border-slate-600 text-slate-100 placeholder-slate-400 focus:ring-teal-400',
          modalButtonCancel: 'bg-slate-700/50 border border-slate-600 text-slate-200 hover:bg-slate-600',
          modalButtonSubmit: 'bg-teal-600 hover:bg-teal-700 text-white border border-teal-500',
          modalButtonImport: 'bg-green-600 hover:bg-green-700 text-white border border-green-500',
          modalButtonDisabled: 'disabled:opacity-50 disabled:cursor-not-allowed',
          infoBoxBg: 'bg-blue-900/50 border border-blue-700',
          infoBoxText: 'text-slate-200',
          warningBoxBg: 'bg-yellow-900/50 border border-yellow-700',
          warningBoxTitle: 'text-yellow-300',
          warningBoxText: 'text-yellow-200',
          disposeWarningBg: 'bg-red-900/50 border border-red-700',
          disposeWarningText: 'text-red-300'
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

  const fetchMaterials = async () => {
    try {
      const response = await fetch('/api/projectreturn-materials');
      if (!response.ok) throw new Error('Failed to fetch materials');
      const data = await response.json();
      setData(data);
    } catch (error) {
      console.error('Error fetching materials:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get unique warehouse locations for filter dropdown
  const uniqueLocations = Array.from(new Set(data.map(material => material.warehouseLocation).filter(Boolean)));

  // Filter data based on location filter, material code, and material description
  const filteredData = data.filter(material => {
    // Location filter
    if (locationFilter !== 'all' && material.warehouseLocation !== locationFilter) {
      return false;
    }
    // Material code filter
    if (materialCodeFilter && !material.materialCode?.toLowerCase().includes(materialCodeFilter.toLowerCase())) {
      return false;
    }
    // Material description filter
    if (materialDescriptionFilter && !material.materialDescription?.toLowerCase().includes(materialDescriptionFilter.toLowerCase())) {
      return false;
    }
    return true;
  });

  const handleAddMaterial = async (materialData: Partial<ProjectReturnMaterialData>) => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/projectreturn-materials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(materialData),
      });

      if (!response.ok) throw new Error('Failed to add material');
      
      await fetchMaterials();
      setShowAddForm(false);
      alert('Material added successfully');
    } catch (error) {
      console.error('Error adding material:', error);
      alert('Failed to add material');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateMaterial = async (materialData: Partial<ProjectReturnMaterialData>) => {
    if (!editingMaterial) return;
    
    setIsSaving(true);
    try {
      const response = await fetch(`/api/projectreturn-materials/${editingMaterial.materialid}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(materialData),
      });

      if (!response.ok) throw new Error('Failed to update material');
      
      await fetchMaterials();
      setEditingMaterial(null);
      alert('Material updated successfully');
    } catch (error) {
      console.error('Error updating material:', error);
      alert('Failed to update material');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteMaterial = async (materialId: string) => {
    if (!confirm('Are you sure you want to delete this material?')) return;
    
    try {
      const response = await fetch(`/api/projectreturn-materials/${materialId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete material');
      
      await fetchMaterials();
      alert('Material deleted successfully');
    } catch (error) {
      console.error('Error deleting material:', error);
      alert('Failed to delete material');
    }
  };

  const handleRequestMaterial = (material: ProjectReturnMaterialData) => {
    setSelectedMaterial(material);
    setShowRequestForm(true);
  };

  const handleIssueMaterial = (material: ProjectReturnMaterialData) => {
    setSelectedMaterial(material);
    setShowIssueForm(true);
  };

  const handleSubmitRequest = async (requestData: any) => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/projectreturn-materials/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) throw new Error('Failed to submit request');
      
      await fetchMaterials();
      setShowRequestForm(false);
      alert('Request submitted successfully');
    } catch (error) {
      console.error('Error submitting request:', error);
      alert('Failed to submit request');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmitIssue = async (issueData: any) => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/projectreturn-materials/issues', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(issueData),
      });

      if (!response.ok) throw new Error('Failed to issue material');
      
      await fetchMaterials();
      setShowIssueForm(false);
      alert('Material issued successfully');
    } catch (error) {
      console.error('Error issuing material:', error);
      alert('Failed to issue material');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDisposeMaterial = (material: ProjectReturnMaterialData) => {
    setMaterialToDispose(material);
    setShowDisposeModal(true);
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch('/api/projectreturn-materials/template');
      if (!response.ok) throw new Error('Failed to download template');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'project_return_materials_template.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading template:', error);
      alert('Failed to download template');
    }
  };

  const handleImportCSV = async (file: File) => {
    setIsImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/projectreturn-materials/import', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        let errorMessage = errorData.error || 'Failed to import materials';
        
        if (errorData.errors && errorData.errors.length > 0) {
          errorMessage += `\n\nErrors:\n${errorData.errors.slice(0, 20).join('\n')}`;
          if (errorData.errors.length > 20) {
            errorMessage += `\n... and ${errorData.errors.length - 20} more errors`;
          }
        }
        
        if (errorData.debug) {
          errorMessage += `\n\nDebug Info:\nHeaders found: ${errorData.debug.headersFound?.join(', ') || 'None'}\nTotal rows: ${errorData.debug.totalRows || 0}`;
        }
        
        alert(errorMessage);
        throw new Error(errorMessage);
      }
      
      const result = await response.json();
      if (result.errors && result.errors.length > 0) {
        alert(`Import completed with ${result.imported} materials. Errors: ${result.errors.join(', ')}`);
      } else {
        alert(`Successfully imported ${result.imported} materials`);
      }
      
      await fetchMaterials();
      setShowImportForm(false);
    } catch (error: any) {
      console.error('Error importing materials:', error);
      if (!error.message || !error.message.includes('Failed to import materials')) {
        // Error already shown in alert above
      } else {
        alert('Failed to import materials');
      }
    } finally {
      setIsImporting(false);
    }
  };

  const handleConfirmDispose = async () => {
    if (!materialToDispose) return;
    
    setIsSaving(true);
    try {
      const response = await fetch(`/api/projectreturn-materials/${materialToDispose.materialid}/dispose`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to dispose material');
      
      await fetchMaterials();
      setShowDisposeModal(false);
      setMaterialToDispose(null);
      alert('Material disposed successfully and moved to scrap');
    } catch (error) {
      console.error('Error disposing material:', error);
      alert('Failed to dispose material');
    } finally {
      setIsSaving(false);
    }
  };

  const columns: ColumnDef<ProjectReturnMaterialData>[] = [
    {
      accessorKey: 'materialid',
      header: ({ column }) => {
        return (
          <button
            className="flex items-center gap-2 text-white hover:text-teal-400"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Material ID
            <ArrowUpDown className="h-4 w-4" />
          </button>
        );
      },
      cell: ({ row }) => (
        <Link 
          href={`/projectreturn-materials/${row.getValue('materialid')}`}
          className={`${backgroundStyles.linkColor} font-medium transition-colors`}
        >
          {row.getValue('materialid')}
        </Link>
      ),
    },
    {
      accessorKey: 'materialCode',
      header: 'Material Info',
      cell: ({ row }) => {
        const materialCode = row.getValue('materialCode') as string;
        const materialDescription = row.original.materialDescription;
        return (
          <div className="space-y-1">
            <div className={`font-semibold ${backgroundStyles.cellText} text-sm`}>
              {materialCode}
            </div>
            <div className={`${backgroundStyles.cellSubtext} text-xs max-w-xs truncate`} title={materialDescription}>
              {materialDescription}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'uom',
      header: 'UOM',
    },
    {
      accessorKey: 'quantity',
      header: 'Stock Info',
      cell: ({ row }) => {
        const quantity = row.getValue('quantity') as number;
        const pendingRequests = row.original.pendingRequests;
        return (
          <div className="space-y-1">
            <div className={`font-semibold ${backgroundStyles.cellText} text-sm`}>
              Qty: {quantity.toLocaleString()}
            </div>
            <div className={backgroundStyles.cellSubtext + ' text-xs'}>
              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                pendingRequests > 0 
                  ? backgroundStyles.badgePending
                  : backgroundStyles.badgeDefault
              }`}>
                Pending: {pendingRequests.toLocaleString()}
              </span>
            </div>
          </div>
        );
      }
    },
    {
      accessorKey: 'sourceProject',
      header: 'Source Info',
      cell: ({ row }) => {
        const sourceProject = row.getValue('sourceProject') as string;
        const sourcePONumber = row.original.sourcePONumber;
        const sourceIssueNumber = row.original.sourceIssueNumber;
        return (
          <div className="space-y-1">
            <div className={`font-semibold ${backgroundStyles.cellText} text-sm`}>
              {sourceProject}
            </div>
            <div className={`${backgroundStyles.cellSubtext} text-xs space-y-0.5`}>
              {sourcePONumber && <div>PO: {sourcePONumber}</div>}
              {sourceIssueNumber && <div>Issue: {sourceIssueNumber}</div>}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'sourceUnitRate',
      header: 'Unit Rate',
      cell: ({ row }) => {
        const value = row.getValue('sourceUnitRate') as number;
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'SAR'
        }).format(value);
      }
    },
    {
      accessorKey: 'warehouseLocation',
      header: 'Location Info',
      cell: ({ row }) => {
        const warehouseLocation = row.getValue('warehouseLocation') as string;
        const yardRoomRackBin = row.original.yardRoomRackBin;
        return (
          <div className="space-y-1">
            <div className={`font-semibold ${backgroundStyles.cellText} text-sm max-w-xs truncate`} title={warehouseLocation}>
              {warehouseLocation}
            </div>
            <div className={`${backgroundStyles.cellSubtext} text-xs max-w-xs truncate`} title={yardRoomRackBin}>
              {yardRoomRackBin}
            </div>
          </div>
        );
      }
    },
    {
      accessorKey: 'receivedInWarehouseDate',
      header: 'Receipt Info',
      cell: ({ row }) => {
        const receivedDate = row.getValue('receivedInWarehouseDate') as Date;
        const consignmentNote = row.original.consignmentNoteNumber;
        return (
          <div className="space-y-1">
            <div className={`font-semibold ${backgroundStyles.cellText} text-sm`}>
              {receivedDate ? new Date(receivedDate).toLocaleDateString() : 'Not received'}
            </div>
            <div className={backgroundStyles.cellSubtext + ' text-xs'}>
              {consignmentNote ? `Note: ${consignmentNote}` : 'No note'}
            </div>
          </div>
        );
      }
    },
    {
      header: 'QR Code',
      cell: ({ row }) => (
        <AssetQRCode 
          assetNumber={row.original.materialid} 
          assetDescription={row.original.materialDescription}
          assetType="Project Return Material" 
        />
      )
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleRequestMaterial(row.original)}
            className={`p-1 ${backgroundStyles.actionButtonRequest} rounded transition-colors`}
            title="Request Material"
          >
            <Send className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleIssueMaterial(row.original)}
            className={`p-1 ${backgroundStyles.actionButtonIssue} rounded transition-colors`}
            title="Issue Material"
          >
            <Package className="h-4 w-4" />
          </button>
          <button
            onClick={() => setEditingMaterial(row.original)}
            className={`p-1 ${backgroundStyles.actionButtonEdit} rounded transition-colors`}
            title="Edit Material"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDisposeMaterial(row.original)}
            className={`p-1 ${backgroundStyles.actionButtonDispose} rounded transition-colors`}
            title="Dispose Material"
          >
            <AlertTriangle className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDeleteMaterial(row.original.materialid)}
            className={`p-1 ${backgroundStyles.actionButtonDelete} rounded transition-colors`}
            title="Delete Material"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${backgroundStyles.loadingBg}`}>
        <div className={`animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 ${backgroundStyles.spinnerColor}`}></div>
      </div>
    );
  }

  return (
    <div className={backgroundStyles.container}>
      {/* Animated background canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 z-10" />
      
      {/* Main content */}
      <div className="relative z-20 container mx-auto p-4 min-h-screen">
        <div className="mb-6">
          {/* Title */}
          <div className={`mb-4 ${backgroundStyles.headerBg} rounded-2xl p-6 shadow-xl`}>
            <h1 className={`text-2xl font-bold ${backgroundStyles.headerTitle} mb-2`}>
              Project Return Materials Management
            </h1>
            <p className={`${backgroundStyles.headerSubtitle} text-lg`}>Manage project return materials inventory</p>
          </div>
        
          {/* Action Icons */}
          <div className={`flex flex-wrap gap-4 ${backgroundStyles.actionCardBg} rounded-2xl p-4 shadow-xl`}>
            <Link
              href="/projectreturn-materials/requests"
              className="flex flex-col items-center gap-1 group"
              title="Requests Pending"
            >
              <div className={`flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 ${backgroundStyles.actionIconBg} rounded-xl ${backgroundStyles.actionIconHover} transition-colors`}>
                <ClipboardList className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <span className={`text-xs ${backgroundStyles.actionIconText} text-center whitespace-nowrap`}>
                Requests Pending
              </span>
            </Link>
            <Link
              href="/disposed-materials"
              className="flex flex-col items-center gap-1 group"
              title="Disposed Materials"
            >
              <div className={`flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 ${theme === 'light' ? 'bg-red-600 border-2 border-red-500' : theme === 'glassmorphic' ? 'bg-red-500/80 backdrop-blur-md border border-white/20' : 'bg-red-600 border border-red-500'} text-white rounded-xl ${theme === 'light' ? 'hover:bg-red-700' : 'hover:bg-red-500'} transition-colors`}>
                <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <span className={`text-xs ${backgroundStyles.actionIconText} text-center whitespace-nowrap`}>
                Disposed Materials
              </span>
            </Link>
            <button
              onClick={() => setShowImportForm(true)}
              className="flex flex-col items-center gap-1 group"
              title="Import CSV"
            >
              <div className={`flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 ${theme === 'light' ? 'bg-green-600 border-2 border-green-500' : theme === 'glassmorphic' ? 'bg-green-500/80 backdrop-blur-md border border-white/20' : 'bg-green-600 border border-green-500'} text-white rounded-xl ${theme === 'light' ? 'hover:bg-green-700' : 'hover:bg-green-500'} transition-colors`}>
                <Upload className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <span className={`text-xs ${backgroundStyles.actionIconText} text-center whitespace-nowrap`}>
                Import CSV
              </span>
            </button>
            <button
              onClick={() => setShowAddForm(true)}
              className="flex flex-col items-center gap-1 group"
              title="Add Material"
            >
              <div className={`flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 ${theme === 'light' ? 'bg-blue-600 border-2 border-blue-500' : theme === 'glassmorphic' ? 'bg-teal-500/80 backdrop-blur-md border border-white/20' : 'bg-teal-600 border border-teal-500'} text-white rounded-xl ${theme === 'light' ? 'hover:bg-blue-700' : theme === 'glassmorphic' ? 'hover:bg-teal-500' : 'hover:bg-teal-700'} transition-colors`}>
                <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <span className={`text-xs ${backgroundStyles.actionIconText} text-center whitespace-nowrap`}>
                Add Material
              </span>
            </button>
          </div>
        </div>

        <div className="mb-4 space-y-4">
          {/* Location Filter */}
          <div className={`flex flex-col sm:flex-row gap-4 ${backgroundStyles.filterCardBg} rounded-2xl p-4 shadow-xl`}>
            <div className="flex-1">
              <label className={`block text-sm font-medium ${backgroundStyles.labelText} mb-2`}>
                Filter by Warehouse Location
              </label>
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className={`w-full px-4 py-2 ${backgroundStyles.selectBg} rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all`}
              >
                <option value="all" className={backgroundStyles.selectOption}>All Locations ({data.length})</option>
                {uniqueLocations.map((location) => (
                  <option key={location} value={location} className={backgroundStyles.selectOption}>
                    {location} ({data.filter(m => m.warehouseLocation === location).length})
                  </option>
                ))}
              </select>
            </div>
          </div>
          {/* Search Boxes */}
          <div className={`flex flex-col sm:flex-row gap-4 ${backgroundStyles.filterCardBg} rounded-2xl p-4 shadow-xl`}>
            <div className="flex-1">
              <label className={`block text-sm font-medium ${backgroundStyles.labelText} mb-2`}>
                Search by Material Code
              </label>
              <input
                type="text"
                value={materialCodeFilter}
                onChange={(e) => setMaterialCodeFilter(e.target.value)}
                placeholder="Search by material code..."
                className={`w-full px-4 py-2 ${backgroundStyles.inputBg} rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all`}
              />
            </div>
            <div className="flex-1">
              <label className={`block text-sm font-medium ${backgroundStyles.labelText} mb-2`}>
                Search by Material Description
              </label>
              <input
                type="text"
                value={materialDescriptionFilter}
                onChange={(e) => setMaterialDescriptionFilter(e.target.value)}
                placeholder="Search by material description..."
                className={`w-full px-4 py-2 ${backgroundStyles.inputBg} rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all`}
              />
            </div>
          </div>
        </div>

        <div className={`${backgroundStyles.tableBg} rounded-xl shadow-xl`}>
          <ResponsiveTanStackTable
            data={filteredData}
            columns={columns}
            sorting={sorting}
            setSorting={setSorting}
            columnFilters={columnFilters}
            setColumnFilters={setColumnFilters}
            globalFilter={globalFilter}
            setGlobalFilter={setGlobalFilter}
            variant={theme === 'light' ? 'light' : 'glassmorphic'}
          />
        </div>

        {/* Add Material Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`${backgroundStyles.modalBg} rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto`}>
            <h2 className={`text-2xl font-bold ${backgroundStyles.modalTitle} mb-4`}>Add Project Return Material</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const materialData = {
                materialCode: formData.get('materialCode') as string,
                materialDescription: formData.get('materialDescription') as string,
                uom: formData.get('uom') as string,
                quantity: parseFloat(formData.get('quantity') as string) || 0,
                sourceProject: formData.get('sourceProject') as string,
                sourcePONumber: formData.get('sourcePONumber') as string,
                sourceIssueNumber: formData.get('sourceIssueNumber') as string,
                sourceUnitRate: parseFloat(formData.get('sourceUnitRate') as string) || 0,
                warehouseLocation: formData.get('warehouseLocation') as string,
                yardRoomRackBin: formData.get('yardRoomRackBin') as string,
                receivedInWarehouseDate: formData.get('receivedInWarehouseDate') ? new Date(formData.get('receivedInWarehouseDate') as string) : undefined,
                consignmentNoteNumber: formData.get('consignmentNoteNumber') as string,
                remarks: formData.get('remarks') as string,
              };
              handleAddMaterial(materialData);
            }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium ${backgroundStyles.modalTitle} mb-1`}>
                    Material Code *
                  </label>
                  <input
                    type="text"
                    name="materialCode"
                    required
                    className={`w-full px-4 py-2 ${backgroundStyles.modalInput} rounded-xl transition-all`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${backgroundStyles.modalTitle} mb-1`}>
                    UOM *
                  </label>
                  <input
                    type="text"
                    name="uom"
                    required
                    className={`w-full px-4 py-2 ${backgroundStyles.modalInput} rounded-xl transition-all`}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className={`block text-sm font-medium ${backgroundStyles.modalTitle} mb-1`}>
                    Material Description *
                  </label>
                  <input
                    type="text"
                    name="materialDescription"
                    required
                    className={`w-full px-4 py-2 ${backgroundStyles.modalInput} rounded-xl transition-all`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${backgroundStyles.modalTitle} mb-1`}>
                    Quantity *
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    min="0"
                    step="0.01"
                    required
                    className={`w-full px-4 py-2 ${backgroundStyles.modalInput} rounded-xl transition-all`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${backgroundStyles.modalTitle} mb-1`}>
                    Source Project *
                  </label>
                  <input
                    type="text"
                    name="sourceProject"
                    required
                    className={`w-full px-4 py-2 ${backgroundStyles.modalInput} rounded-xl transition-all`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${backgroundStyles.modalTitle} mb-1`}>
                    Source PO Number
                  </label>
                  <input
                    type="text"
                    name="sourcePONumber"
                    className={`w-full px-4 py-2 ${backgroundStyles.modalInput} rounded-xl transition-all`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${backgroundStyles.modalTitle} mb-1`}>
                    Source Issue Number
                  </label>
                  <input
                    type="text"
                    name="sourceIssueNumber"
                    className={`w-full px-4 py-2 ${backgroundStyles.modalInput} rounded-xl transition-all`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${backgroundStyles.modalTitle} mb-1`}>
                    Source Unit Rate
                  </label>
                  <input
                    type="number"
                    name="sourceUnitRate"
                    min="0"
                    step="0.01"
                    className={`w-full px-4 py-2 ${backgroundStyles.modalInput} rounded-xl transition-all`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${backgroundStyles.modalTitle} mb-1`}>
                    Warehouse Location *
                  </label>
                  <input
                    type="text"
                    name="warehouseLocation"
                    required
                    className={`w-full px-4 py-2 ${backgroundStyles.modalInput} rounded-xl transition-all`}
                    placeholder="Enter warehouse location"
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${backgroundStyles.modalTitle} mb-1`}>
                    Yard/Room/Rack-Bin *
                  </label>
                  <input
                    type="text"
                    name="yardRoomRackBin"
                    required
                    className={`w-full px-4 py-2 ${backgroundStyles.modalInput} rounded-xl transition-all`}
                    placeholder="Enter yard/room/rack-bin"
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${backgroundStyles.modalTitle} mb-1`}>
                    Received in Warehouse Date
                  </label>
                  <input
                    type="date"
                    name="receivedInWarehouseDate"
                    className={`w-full px-4 py-2 ${backgroundStyles.modalInput} rounded-xl transition-all`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${backgroundStyles.modalTitle} mb-1`}>
                    Consignment Note Number
                  </label>
                  <input
                    type="text"
                    name="consignmentNoteNumber"
                    className={`w-full px-4 py-2 ${backgroundStyles.modalInput} rounded-xl transition-all`}
                    placeholder="Enter consignment note number"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className={`block text-sm font-medium ${backgroundStyles.modalTitle} mb-1`}>
                    Remarks
                  </label>
                  <textarea
                    name="remarks"
                    rows={3}
                    className={`w-full px-4 py-2 ${backgroundStyles.modalInput} rounded-xl transition-all`}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className={`px-4 py-2 ${backgroundStyles.modalButtonCancel} rounded-xl transition-colors`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className={`px-4 py-2 ${backgroundStyles.modalButtonSubmit} rounded-xl transition-colors ${backgroundStyles.modalButtonDisabled} flex items-center gap-2`}
                >
                  {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isSaving ? 'Saving...' : 'Add Material'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Request Form Modal */}
      {showRequestForm && selectedMaterial && (
        <ProjectReturnMaterialRequestForm
          materialId={selectedMaterial.materialid}
          materialDescription={selectedMaterial.materialDescription}
          availableQuantity={selectedMaterial.quantity}
          onClose={() => setShowRequestForm(false)}
          onSubmit={handleSubmitRequest}
          isSaving={isSaving}
        />
      )}

      {/* Issue Form Modal */}
      {showIssueForm && selectedMaterial && (
        <ProjectReturnMaterialIssueForm
          materialId={selectedMaterial.materialid}
          materialDescription={selectedMaterial.materialDescription}
          availableQuantity={selectedMaterial.quantity}
          onClose={() => setShowIssueForm(false)}
          onSubmit={handleSubmitIssue}
          isSaving={isSaving}
        />
      )}

      {/* Import CSV Form Modal */}
      {showImportForm && (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <h2 className={`text-2xl font-bold mb-4 ${backgroundStyles.modalTitle}`}>Import Project Return Materials from Excel/CSV</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const fileInput = e.currentTarget.querySelector('input[type="file"]') as HTMLInputElement;
              if (fileInput?.files?.[0]) {
                handleImportCSV(fileInput.files[0]);
              }
            }} className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${backgroundStyles.modalTitle} mb-1`}>
                  Excel/CSV File *
                </label>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  required
                  className={`w-full px-4 py-2 ${backgroundStyles.modalInput} rounded-xl transition-all`}
                />
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                <p className={`font-medium mb-2 ${backgroundStyles.modalTitle}`}>Expected columns:</p>
                <p className={`text-xs ${backgroundStyles.cellSubtext}`}>Material Code*, Material Description*, UOM*, Quantity*, Source Project*, Warehouse Location*, Yard/Room/Rack-Bin*, Source PO Number, Source Issue Number, Source Unit Rate, Received in Warehouse Date, Consignment Note Number, Remarks</p>
                <p className={`text-xs ${backgroundStyles.cellSubtext}`}>* Required fields</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className={`px-4 py-2 ${backgroundStyles.modalButtonSubmit} rounded-xl transition-colors text-sm`}
                >
                  <Download className="h-4 w-4 inline mr-2" />
                  Download Template
                </button>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowImportForm(false)}
                  className={`px-4 py-2 ${backgroundStyles.modalButtonCancel} rounded-xl transition-colors`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isImporting}
                  className={`px-4 py-2 ${backgroundStyles.modalButtonImport} rounded-xl transition-colors ${backgroundStyles.modalButtonDisabled} flex items-center gap-2`}
                >
                  {isImporting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isImporting ? 'Importing...' : 'Import'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

        {/* Edit Material Form Modal */}
        {editingMaterial && (
          <EditMaterialForm
            material={editingMaterial}
            onClose={() => setEditingMaterial(null)}
            onSubmit={handleUpdateMaterial}
            isSaving={isSaving}
            backgroundStyles={backgroundStyles}
          />
        )}

        {/* Dispose Material Modal */}
      {showDisposeModal && materialToDispose && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-red-400" />
              <h2 className="text-2xl font-bold text-white">Dispose Material</h2>
            </div>
            
            <div className={`${backgroundStyles.disposeWarningBg} rounded-xl p-4 mb-6`}>
              <p className={`${backgroundStyles.disposeWarningText} font-medium`}>
                ⚠️ This action is irreversible and will move the material to scrap status.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className={`text-lg font-medium ${backgroundStyles.modalTitle}`}>Material Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium ${backgroundStyles.modalTitle} mb-1`}>
                    Material ID
                  </label>
                  <p className={`px-3 py-2 ${backgroundStyles.modalInput} rounded-xl`}>
                    {materialToDispose.materialid}
                  </p>
                </div>
                <div>
                  <label className={`block text-sm font-medium ${backgroundStyles.modalTitle} mb-1`}>
                    Material Code
                  </label>
                  <p className={`px-3 py-2 ${backgroundStyles.modalInput} rounded-xl`}>
                    {materialToDispose.materialCode}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <label className={`block text-sm font-medium ${backgroundStyles.modalTitle} mb-1`}>
                    Description
                  </label>
                  <p className={`px-3 py-2 ${backgroundStyles.modalInput} rounded-xl`}>
                    {materialToDispose.materialDescription}
                  </p>
                </div>
                <div>
                  <label className={`block text-sm font-medium ${backgroundStyles.modalTitle} mb-1`}>
                    Unit of Measure
                  </label>
                  <p className={`px-3 py-2 ${backgroundStyles.modalInput} rounded-xl`}>
                    {materialToDispose.uom}
                  </p>
                </div>
                <div>
                  <label className={`block text-sm font-medium ${backgroundStyles.modalTitle} mb-1`}>
                    Current Quantity
                  </label>
                  <p className={`px-3 py-2 ${backgroundStyles.modalInput} rounded-xl`}>
                    {materialToDispose.quantity.toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className={`block text-sm font-medium ${backgroundStyles.modalTitle} mb-1`}>
                    Unit Rate
                  </label>
                  <p className={`px-3 py-2 ${backgroundStyles.modalInput} rounded-xl`}>
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'SAR'
                    }).format(materialToDispose.sourceUnitRate)}
                  </p>
                </div>
                <div>
                  <label className={`block text-sm font-medium ${backgroundStyles.modalTitle} mb-1`}>
                    Current Value
                  </label>
                  <p className={`px-3 py-2 ${backgroundStyles.modalInput} rounded-lg font-semibold`}>
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'SAR'
                    }).format((materialToDispose.quantity || 0) * (materialToDispose.sourceUnitRate || 0))}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowDisposeModal(false)}
                className="px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDispose}
                disabled={isSaving}
                className={`px-4 py-2 ${theme === 'light' ? 'bg-red-600 hover:bg-red-700 border-2 border-red-500' : 'bg-red-500 hover:bg-red-600'} text-white rounded-xl transition-colors flex items-center gap-2 ${backgroundStyles.modalButtonDisabled}`}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Disposing...
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4" />
                    Dispose Material
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

// Edit Material Form Component
function EditMaterialForm({ material, onClose, onSubmit, isSaving, backgroundStyles }: { material: ProjectReturnMaterialData; onClose: () => void; onSubmit: (data: Partial<ProjectReturnMaterialData>) => void; isSaving?: boolean; backgroundStyles: Record<string, string> }) {
  const [formData, setFormData] = useState<Partial<ProjectReturnMaterialData>>(material);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto shadow-2xl">
        <h2 className="text-2xl font-bold text-white mb-4">Edit Project Return Material</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-1">
                Material ID
              </label>
              <input
                type="text"
                value={formData.materialid}
                disabled
                className="w-full px-4 py-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl text-white/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-1">
                Material Code *
              </label>
              <input
                type="text"
                required
                value={formData.materialCode || ''}
                onChange={(e) => setFormData({ ...formData, materialCode: e.target.value })}
                className={`w-full px-4 py-2 ${backgroundStyles.modalInput} rounded-xl transition-all`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-1">
                UOM *
              </label>
              <input
                type="text"
                required
                value={formData.uom || ''}
                onChange={(e) => setFormData({ ...formData, uom: e.target.value })}
                className={`w-full px-4 py-2 ${backgroundStyles.modalInput} rounded-xl transition-all`}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-white mb-1">
                Material Description *
              </label>
              <input
                type="text"
                required
                value={formData.materialDescription || ''}
                onChange={(e) => setFormData({ ...formData, materialDescription: e.target.value })}
                className={`w-full px-4 py-2 ${backgroundStyles.modalInput} rounded-xl transition-all`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-1">
                Quantity *
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.quantity || 0}
                onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
                className={`w-full px-4 py-2 ${backgroundStyles.modalInput} rounded-xl transition-all`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-1">
                Source Project *
              </label>
              <input
                type="text"
                required
                value={formData.sourceProject || ''}
                onChange={(e) => setFormData({ ...formData, sourceProject: e.target.value })}
                className={`w-full px-4 py-2 ${backgroundStyles.modalInput} rounded-xl transition-all`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-1">
                Source PO Number
              </label>
              <input
                type="text"
                value={formData.sourcePONumber || ''}
                onChange={(e) => setFormData({ ...formData, sourcePONumber: e.target.value })}
                className={`w-full px-4 py-2 ${backgroundStyles.modalInput} rounded-xl transition-all`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-1">
                Source Issue Number
              </label>
              <input
                type="text"
                value={formData.sourceIssueNumber || ''}
                onChange={(e) => setFormData({ ...formData, sourceIssueNumber: e.target.value })}
                className={`w-full px-4 py-2 ${backgroundStyles.modalInput} rounded-xl transition-all`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-1">
                Source Unit Rate
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.sourceUnitRate || 0}
                onChange={(e) => setFormData({ ...formData, sourceUnitRate: parseFloat(e.target.value) || 0 })}
                className={`w-full px-4 py-2 ${backgroundStyles.modalInput} rounded-xl transition-all`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-1">
                Warehouse Location *
              </label>
              <input
                type="text"
                required
                value={formData.warehouseLocation || ''}
                onChange={(e) => setFormData({ ...formData, warehouseLocation: e.target.value })}
                className={`w-full px-4 py-2 ${backgroundStyles.modalInput} rounded-xl transition-all`}
                placeholder="Enter warehouse location"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-1">
                Yard/Room/Rack-Bin *
              </label>
              <input
                type="text"
                required
                value={formData.yardRoomRackBin || ''}
                onChange={(e) => setFormData({ ...formData, yardRoomRackBin: e.target.value })}
                className={`w-full px-4 py-2 ${backgroundStyles.modalInput} rounded-xl transition-all`}
                placeholder="Enter yard/room/rack-bin"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-1">
                Received in Warehouse Date
              </label>
              <input
                type="date"
                value={formData.receivedInWarehouseDate ? new Date(formData.receivedInWarehouseDate).toISOString().split('T')[0] : ''}
                onChange={(e) => setFormData({ ...formData, receivedInWarehouseDate: e.target.value ? new Date(e.target.value) : undefined })}
                className={`w-full px-4 py-2 ${backgroundStyles.modalInput} rounded-xl transition-all`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-1">
                Consignment Note Number
              </label>
              <input
                type="text"
                value={formData.consignmentNoteNumber || ''}
                onChange={(e) => setFormData({ ...formData, consignmentNoteNumber: e.target.value })}
                className={`w-full px-4 py-2 ${backgroundStyles.modalInput} rounded-xl transition-all`}
                placeholder="Enter consignment note number"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-white mb-1">
                Remarks
              </label>
              <textarea
                value={formData.remarks || ''}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                rows={3}
                className={`w-full px-4 py-2 ${backgroundStyles.modalInput} rounded-xl transition-all`}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 ${backgroundStyles.modalButtonCancel}`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className={`px-4 py-2 ${backgroundStyles.modalButtonSubmit} rounded-lg transition-colors ${backgroundStyles.modalButtonDisabled} flex items-center gap-2`}
            >
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSaving ? 'Updating...' : 'Update Material'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

