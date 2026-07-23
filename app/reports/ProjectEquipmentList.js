'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAppTheme } from '@/app/contexts/ThemeContext';

const ProjectEquipmentList = () => {
  const { theme } = useAppTheme();
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [equipmentList, setEquipmentList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const animationFrameRef = useRef();
  const dropdownRef = useRef(null);

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

  // Fetch projects for dropdown
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch('/api/projects');
        const projects = await response.json();
        console.log('Fetched projects:', projects);
        setProjects(projects);
      } catch (error) {
        console.error('Error fetching projects:', error);
      }
    };
    fetchProjects();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch equipment list when selectedProject changes
  useEffect(() => {
    console.log('selectedProject changed:', selectedProject);
    if (selectedProject) {
      fetchEquipmentList();
    }
  }, [selectedProject]);

  // Fetch equipment list when project is selected
  const fetchEquipmentList = async () => {
    if (!selectedProject) {
      console.log('No project selected, returning');
      return;
    }

    console.log('fetchEquipmentList executing for project:', selectedProject);
    const fullProjectIdentifier = `${selectedProject.wbs} - ${selectedProject.projectname}`;
    console.log('Full project identifier being sent:', fullProjectIdentifier);

    setLoading(true);
    try {
      const response = await fetch('/api/equipment/project', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: fullProjectIdentifier,
        }),
      });
      const data = await response.json();
      console.log('API Response:', data);
      setEquipmentList(data.equipment);
    } catch (error) {
      console.error('Error fetching equipment list:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle project selection
  const handleProjectChange = (project) => {
    console.log('handleProjectChange called with:', project);
    setSelectedProject(project);
    setIsDropdownOpen(false);
    setSearchQuery('');
  };

  // Filter projects based on search query
  const filteredProjects = projects.filter(project => {
    const searchText = searchQuery.toLowerCase();
    const projectText = `${project.wbs} - ${project.projectname}`.toLowerCase();
    return projectText.includes(searchText);
  });

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
          inputBg: 'bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-white/70 focus:ring-teal-400',
          dropdownBg: 'bg-white/10 backdrop-blur-lg border border-white/20',
          dropdownItem: 'text-white hover:bg-white/10 border-white/5',
          dropdownItemText: 'text-white/80',
          loadingBg: 'bg-white/10 backdrop-blur-lg border border-white/20',
          spinnerColor: 'border-teal-400',
          emptyBg: 'bg-white/10 backdrop-blur-lg border border-white/20',
          emptyText: 'text-white',
          tableBg: 'bg-white/10 backdrop-blur-lg border border-white/20',
          tableHover: 'hover:bg-white/15',
          tableHeaderBg: 'bg-white/5 backdrop-blur-sm border-white/10',
          tableHeaderText: 'text-white/90',
          tableRowBorder: 'border-white/5',
          tableRowHover: 'hover:bg-white/10',
          tableCellText: 'text-white',
          linkColor: 'text-teal-400 hover:text-teal-300',
          buttonUndertaking: 'bg-green-500/20 backdrop-blur-md border border-green-400/30 text-green-300 hover:bg-green-500/30 hover:border-green-400/50',
          buttonExport: 'bg-teal-500/20 backdrop-blur-md border border-teal-400/30 text-teal-300 hover:bg-teal-500/30 hover:border-teal-400/50',
          tableBorder: 'border-white/10'
        };
      case 'light':
        return {
          container: 'relative min-h-screen overflow-hidden bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100',
          textColor: 'text-gray-900',
          headerBg: 'bg-white border-2 border-blue-200 shadow-lg',
          headerHover: 'hover:bg-blue-50',
          headerTitle: 'bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent',
          headerSubtitle: 'text-gray-700',
          inputBg: 'bg-white border-2 border-blue-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500',
          dropdownBg: 'bg-white border-2 border-blue-200 shadow-md',
          dropdownItem: 'text-gray-900 hover:bg-blue-50 border-gray-200',
          dropdownItemText: 'text-gray-600',
          loadingBg: 'bg-white border-2 border-blue-200 shadow-md',
          spinnerColor: 'border-blue-500',
          emptyBg: 'bg-white border-2 border-blue-200 shadow-md',
          emptyText: 'text-gray-900',
          tableBg: 'bg-white border-2 border-blue-200 shadow-md',
          tableHover: 'hover:bg-blue-50',
          tableHeaderBg: 'bg-blue-50 border-blue-200',
          tableHeaderText: 'text-gray-800',
          tableRowBorder: 'border-gray-200',
          tableRowHover: 'hover:bg-blue-50',
          tableCellText: 'text-gray-900',
          linkColor: 'text-blue-600 hover:text-blue-700',
          buttonUndertaking: 'bg-green-100 border-2 border-green-300 text-green-700 hover:bg-green-200 hover:border-green-400',
          buttonExport: 'bg-blue-100 border-2 border-blue-300 text-blue-700 hover:bg-blue-200 hover:border-blue-400',
          tableBorder: 'border-blue-200'
        };
      default: // dark theme
        return {
          container: 'relative min-h-screen overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a]',
          textColor: 'text-slate-100',
          headerBg: 'bg-slate-800/90 border border-slate-700 shadow-xl',
          headerHover: 'hover:bg-slate-700/90',
          headerTitle: 'bg-gradient-to-r from-slate-100 to-teal-400 bg-clip-text text-transparent',
          headerSubtitle: 'text-slate-300',
          inputBg: 'bg-slate-800/90 border border-slate-600 text-slate-100 placeholder-slate-400 focus:ring-teal-400 focus:border-teal-400',
          dropdownBg: 'bg-slate-800/90 border border-slate-700 shadow-xl',
          dropdownItem: 'text-slate-100 hover:bg-slate-700/90 border-slate-700',
          dropdownItemText: 'text-slate-400',
          loadingBg: 'bg-slate-800/90 border border-slate-700 shadow-xl',
          spinnerColor: 'border-teal-400',
          emptyBg: 'bg-slate-800/90 border border-slate-700 shadow-xl',
          emptyText: 'text-slate-100',
          tableBg: 'bg-slate-800/90 border border-slate-700 shadow-xl',
          tableHover: 'hover:bg-slate-700/90',
          tableHeaderBg: 'bg-slate-700/50 border-slate-600',
          tableHeaderText: 'text-slate-200',
          tableRowBorder: 'border-slate-700',
          tableRowHover: 'hover:bg-slate-700/50',
          tableCellText: 'text-slate-100',
          linkColor: 'text-teal-400 hover:text-teal-300',
          buttonUndertaking: 'bg-green-900/40 border border-green-700/50 text-green-300 hover:bg-green-900/60 hover:border-green-600',
          buttonExport: 'bg-teal-900/40 border border-teal-700/50 text-teal-300 hover:bg-teal-900/60 hover:border-teal-600',
          tableBorder: 'border-slate-700'
        };
    }
  };

  const backgroundStyles = getBackgroundStyles();

  // Handle export to Excel
  const handleExport = () => {
    if (equipmentList.length === 0) return;

    const csvContent = [
      ['Asset Number', 'Employee Number', 'Employee Name', 'Custody From'],
      ...equipmentList.map(item => [
        item.assetnumber,
        item.employeenumber,
        item.employeename,
        new Date(item.custodyfrom).toLocaleDateString()
      ])
    ];

    const csv = csvContent.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `project_equipment_${selectedProject.projectname}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadConsolidatedUndertaking = async () => {
    if (!selectedProject) return;
    
    try {
      const fullProjectIdentifier = `${selectedProject.wbs} - ${selectedProject.projectname}`;
      const response = await fetch(`/api/undertaking-letter-project?projectId=${encodeURIComponent(fullProjectIdentifier)}`);
      if (!response.ok) {
        throw new Error('Failed to generate consolidated project undertaking letter');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Consolidated_Project_Undertaking_Letter_${selectedProject.projectname}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading consolidated project undertaking letter:', error);
      alert('Failed to download consolidated project undertaking letter. Please try again.');
    }
  };

  // Helper function to determine asset route based on first digit
  const getAssetRoute = (assetnumber) => {
    if (!assetnumber) return '/asset/';
    
    const assetStr = String(assetnumber);
    const firstDigit = assetStr.charAt(0);
    
    // Determine collection based on first digit
    // First digit 5 or 9: equipmentandtools -> /asset/
    // First digit 6, 7, or any other number: fixedassets -> /fixedasset/
    if (firstDigit === '5' || firstDigit === '9') {
      return `/asset/${assetnumber}`;
    } else {
      return `/fixedasset/${assetnumber}`;
    }
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
              Project Equipment List
            </h1>
            <p className={`${backgroundStyles.headerSubtitle} text-lg mb-6`}>
              Select a project to view its equipment list and manage project assets
            </p>
            
            {/* Project Selector */}
            <div className="relative" ref={dropdownRef}>
              <label className={`block text-sm font-medium ${backgroundStyles.textColor} mb-2`}>
                Select Project
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={selectedProject ? `${selectedProject.wbs} - ${selectedProject.projectname}` : searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsDropdownOpen(true);
                    if (!e.target.value) {
                      setSelectedProject(null);
                    }
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  placeholder="Search for a project..."
                  className={`w-full px-4 py-3 ${backgroundStyles.inputBg} rounded-xl focus:outline-none focus:ring-2 transition-all`}
                />
                {selectedProject && (
                  <button
                    onClick={() => {
                      setSelectedProject(null);
                      setSearchQuery('');
                    }}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 ${theme === 'light' ? 'text-gray-400 hover:text-gray-600' : 'text-slate-400 hover:text-white'} transition-colors`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              
              {/* Dropdown */}
              {isDropdownOpen && filteredProjects.length > 0 && (
                <div className={`absolute z-50 w-full mt-2 ${backgroundStyles.dropdownBg} rounded-xl shadow-2xl max-h-64 overflow-y-auto`}>
                  {filteredProjects.map((project) => (
                    <button
                      key={project._id || `${project.wbs}-${project.projectname}`}
                      onClick={() => handleProjectChange(project)}
                      className={`w-full px-4 py-3 text-left ${backgroundStyles.dropdownItem} transition-colors border-b ${backgroundStyles.tableRowBorder} last:border-b-0`}
                    >
                      <div className="font-medium">{project.projectname}</div>
                      <div className={`text-sm ${backgroundStyles.dropdownItemText}`}>WBS: {project.wbs}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Equipment List Section */}
        {loading && (
          <div className="max-w-7xl mx-auto">
            <div className={`${backgroundStyles.loadingBg} rounded-3xl p-12`}>
              <div className="flex justify-center items-center">
                <div className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${backgroundStyles.spinnerColor}`}></div>
                <p className={`${backgroundStyles.textColor} ml-4`}>Loading equipment...</p>
              </div>
            </div>
          </div>
        )}

        {!loading && selectedProject && equipmentList.length === 0 && (
          <div className="max-w-7xl mx-auto">
            <div className={`${backgroundStyles.emptyBg} rounded-3xl p-12 text-center`}>
              <div className="text-6xl mb-4">📦</div>
              <p className={`${backgroundStyles.emptyText} text-lg`}>No equipment found for this project.</p>
            </div>
          </div>
        )}

        {equipmentList.length > 0 && (
          <div className="max-w-7xl mx-auto">
            <div className={`${backgroundStyles.tableBg} ${backgroundStyles.tableHover} rounded-3xl shadow-2xl overflow-hidden transition-all duration-300`}>
              {/* Header with Actions */}
              <div className={`p-6 lg:p-8 border-b ${backgroundStyles.tableBorder}`}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h2 className={`text-2xl font-bold ${backgroundStyles.textColor} mb-2`}>
                      Equipment List for {selectedProject?.projectname}
                    </h2>
                    <p className={`${backgroundStyles.headerSubtitle} text-sm`}>
                      WBS: {selectedProject?.wbs} • {equipmentList.length} equipment item{equipmentList.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={handleDownloadConsolidatedUndertaking}
                      className={`px-6 py-3 ${backgroundStyles.buttonUndertaking} rounded-xl font-semibold transition-all duration-300 flex items-center gap-2`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Download Undertaking
                    </button>
                    <button
                      onClick={handleExport}
                      className={`px-6 py-3 ${backgroundStyles.buttonExport} rounded-xl font-semibold transition-all duration-300 flex items-center gap-2`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Export to Excel
                    </button>
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className={`border-b ${backgroundStyles.tableBorder} ${backgroundStyles.tableHeaderBg}`}>
                      <th className={`px-6 py-4 text-left text-xs font-semibold ${backgroundStyles.tableHeaderText} uppercase tracking-wider`}>Asset Number</th>
                      <th className={`px-6 py-4 text-left text-xs font-semibold ${backgroundStyles.tableHeaderText} uppercase tracking-wider`}>Asset Description</th>
                      <th className={`px-6 py-4 text-left text-xs font-semibold ${backgroundStyles.tableHeaderText} uppercase tracking-wider`}>Employee Number</th>
                      <th className={`px-6 py-4 text-left text-xs font-semibold ${backgroundStyles.tableHeaderText} uppercase tracking-wider`}>Employee Name</th>
                      <th className={`px-6 py-4 text-left text-xs font-semibold ${backgroundStyles.tableHeaderText} uppercase tracking-wider`}>Custody From</th>
                    </tr>
                  </thead>
                  <tbody>
                    {equipmentList.map((item, index) => (
                      <tr
                        key={item._id || index}
                        className={`border-b ${backgroundStyles.tableRowBorder} ${backgroundStyles.tableRowHover} transition-colors`}
                      >
                        <td className="px-6 py-4">
                          <Link
                            href={getAssetRoute(item.assetnumber)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`${backgroundStyles.linkColor} font-medium transition-colors`}
                          >
                            {item.assetnumber}
                          </Link>
                        </td>
                        <td className={`px-6 py-4 ${backgroundStyles.tableCellText}`}>{item.assetdescription || '-'}</td>
                        <td className={`px-6 py-4 ${backgroundStyles.tableCellText}`}>{item.employeenumber || '-'}</td>
                        <td className={`px-6 py-4 ${backgroundStyles.tableCellText}`}>{item.employeename || '-'}</td>
                        <td className={`px-6 py-4 ${backgroundStyles.tableCellText}`}>
                          {new Date(item.custodyfrom).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectEquipmentList; 