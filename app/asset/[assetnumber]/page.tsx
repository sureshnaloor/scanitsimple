'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

import AssetDetails from '@/app/components/AssetDetails';
import CalibrationDetails from '@/app/components/CalibrationDetails';
import CustodyDetails from '@/app/components/CustodyDetails';
import CustomDetailsSection from '@/app/components/CustomDetailsSection';


import { AssetData, Calibration } from '@/types/asset';
import { Custody } from '@/types/custody';

import CollapsibleSection from '@/app/components/CollapsibleSection';
import type { Theme } from '@/app/components/AssetDetails';

export default function AssetPage({ params }: { params: { assetnumber: string } }) {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
  }>>([]);
  const animationFrameRef = useRef<number>();

  const [asset, setAsset] = useState<AssetData | null>(null);
  const [calibrations, setCalibrations] = useState<Calibration[]>([]);
  const [custodyRecords, setCustodyRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<Theme>('default');

  useEffect(() => {
    fetchData();
  }, [params.assetnumber]);

  useEffect(() => {
    if (loading) return;
    const hash = window.location.hash.replace('#', '');
    if (hash === 'calibration' || hash === 'custody') {
      const el = document.getElementById(hash);
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [loading]);

  // Animated particle background for glassmorphic theme
  useEffect(() => {
    if (theme !== 'glassmorphic') {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

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
      if (!ctx || !canvas || theme !== 'glassmorphic') return;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach((particle, i) => {
        particle.x += particle.vx;
        particle.y += particle.vy;

        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(45, 212, 191, 0.6)';
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
              ctx.strokeStyle = `rgba(45, 212, 191, ${0.3 * (1 - distance / 100)})`;
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

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [assetData, calibrationData, custodyData] = await Promise.all([
        fetch(`/api/assets/${params.assetnumber}`).then(res => res.json()),
        fetch(`/api/calibrations/${params.assetnumber}`).then(res => res.json()),
        fetch(`/api/custody/${params.assetnumber}`).then(res => res.json())
      ]);

      setAsset(assetData);
      setCalibrations(calibrationData);
      setCustodyRecords(custodyData);

        // for testing only, will be removed later in production
      console.log('Calibrations:', calibrations);
      console.log('Custody Records:', custodyRecords);
      console.log('Asset:', asset);

    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load asset data');
    } finally {
      setLoading(false);
    }
  };

  const handleAssetUpdate = async (updatedAsset: Partial<AssetData>) => {
    try {
      console.log('Updating asset:', params.assetnumber);

      // Updated payload to include new fields
      const updatePayload = {
        assetcategory: updatedAsset.assetcategory,
        assetsubcategory: updatedAsset.assetsubcategory,
        assetstatus: updatedAsset.assetstatus,
        assetnotes: updatedAsset.assetnotes,
        
        assetmodel: updatedAsset.assetmodel,
        assetmanufacturer: updatedAsset.assetmanufacturer,
        assetserialnumber: updatedAsset.assetserialnumber,
        accessories: updatedAsset.accessories,
        legacyassetnumber: updatedAsset.legacyassetnumber,
        anyotheridentifier: updatedAsset.anyotheridentifier,
      };

      const res = await fetch(`/api/assets/${params.assetnumber}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(updatePayload),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error('Update failed:', {
          status: res.status,
          statusText: res.statusText,
          data
        });
        throw new Error(data.error || `Failed to update asset: ${res.status}`);
      }

      // Update local state with new data
      setAsset(prevAsset => {
        if (!prevAsset) return data;
        return { 
          ...prevAsset, 
          ...updatePayload
        };
      });

      console.log('Asset updated successfully');
      // for testing only, will be removed later in production
      console.log('Updated Asset:', asset);

    } catch (error) {
      console.error('Error updating asset:', error);
      throw error;
    }
  };

  const handleCalibrationUpdate = async (calibration: Calibration | null) => {
    try {
      if (!calibration) return;
      const response = await fetch(`/api/calibrations/${params.assetnumber}`);
      if (!response.ok) throw new Error('Failed to fetch updated calibrations');
      const newCalibrationData = await response.json();
      setCalibrations(newCalibrationData);
    } catch (error) {
      console.error('Error updating calibrations:', error);
    }
  };

  const handleCustodyUpdate = async (custody: Custody | null) => {
    try {
      // Refresh the custody records
      const response = await fetch(`/api/custody/${params.assetnumber}`);
      if (!response.ok) throw new Error('Failed to fetch custody records');
      const updatedRecords = await response.json();
      
      setCustodyRecords(updatedRecords);
    } catch (error) {
      console.error('Error updating custody records:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500 text-lg">{error || 'Asset not found'}</div>
      </div>
    );
  }

  const handleLogLocation = () => {
    router.push(`/loglocation?asset=${params.assetnumber}&source=asset`);
  };

  // Theme-based background and container styles
  const getBackgroundStyles = () => {
    switch (theme) {
      case 'glassmorphic':
        return {
          container: 'relative min-h-screen overflow-hidden bg-gradient-to-br from-[#1a2332] via-[#2d3748] to-[#1a2332]',
          overlay: null,
          textColor: 'text-white'
        };
      case 'light':
        return {
          container: 'relative flex flex-col min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100',
          overlay: null,
          textColor: 'text-gray-900'
        };
      default:
        return {
          container: 'relative flex flex-col min-h-screen text-zinc-100',
          overlay: 'fixed inset-0 z-0 bg-[conic-gradient(at_top_right,_#111111,_#1e40af,_#eeef46)] opacity-50',
          textColor: 'text-zinc-100'
        };
    }
  };

  const backgroundStyles = getBackgroundStyles();

  return (
    <div className={backgroundStyles.container}>
      {/* Animated background canvas for glassmorphic theme */}
      {theme === 'glassmorphic' && (
        <canvas ref={canvasRef} className="absolute inset-0 z-10" />
      )}
      
      {/* Default theme overlay */}
      {theme === 'default' && backgroundStyles.overlay && (
        <div className={backgroundStyles.overlay} />
      )}
      
      <div className={`relative ${theme === 'glassmorphic' ? 'z-20' : 'z-10'} flex flex-col min-h-screen`}>
        <main className={`flex-1 flex flex-col items-center justify-center p-2 gap-4 ${backgroundStyles.textColor}`}>
          <CollapsibleSection 
            title="Asset Details" 
            theme={theme}
            onThemeChange={setTheme}
            showThemeSwitcher={true}
          >
            <AssetDetails 
              asset={asset} 
              onUpdate={handleAssetUpdate}
              theme={theme}
            />
          </CollapsibleSection>

          <CollapsibleSection 
            title="Calibration Details"
            theme={theme}
            sectionId="calibration"
          >
            <CalibrationDetails 
              currentCalibration={Array.isArray(calibrations) && calibrations.length > 0 ? calibrations[0] : null}
              calibrationHistory={Array.isArray(calibrations) && calibrations.length > 1 ? calibrations.slice(1) : []}
              onUpdate={handleCalibrationUpdate}
              assetnumber={params.assetnumber}
              theme={theme}
            />
          </CollapsibleSection>

          <CollapsibleSection 
            title="Custody Details"
            theme={theme}
            sectionId="custody"
          >
            <CustodyDetails 
              currentCustody={custodyRecords.length > 0 ? custodyRecords[0] : null}
              custodyHistory={custodyRecords.length > 1 ? custodyRecords.slice(1) : []}
              onUpdate={handleCustodyUpdate}
              assetnumber={params.assetnumber}
              theme={theme}
              custodyNewHref={`/asset/${params.assetnumber}/custody/new`}
            />
          </CollapsibleSection>

          <CustomDetailsSection assetType="mme" assetnumber={params.assetnumber} />

          <button
            onClick={handleLogLocation}
            className={`py-2 px-6 rounded-lg shadow-lg transition-colors duration-200 flex items-center gap-2 mt-4 ${
              theme === 'glassmorphic'
                ? 'bg-teal-500 hover:bg-teal-600 text-white'
                : theme === 'light'
                ? 'bg-blue-500 hover:bg-blue-600 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            Log Location
          </button>
        </main>
      </div>
    </div>
  );
}