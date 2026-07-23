'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import ResponsiveTable from '@/components/ui/responsive-table';
import SearchablePPESelect from '@/components/SearchablePPESelect';
import { PPEReceipt } from '@/types/ppe';
import { useAppTheme } from '@/app/contexts/ThemeContext';

interface PPEReceiptFormData {
  ppeId: string;
  ppeName: string;
  dateOfReceipt: string;
  quantityReceived: number;
  remarks: string;
}

export default function PPEReceiptsPage() {
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

  const [receiptRecords, setReceiptRecords] = useState<PPEReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('list');
  const [formData, setFormData] = useState<PPEReceiptFormData>({
    ppeId: '',
    ppeName: '',
    dateOfReceipt: new Date().toISOString().split('T')[0],
    quantityReceived: 1,
    remarks: ''
  });
  const [currentStock, setCurrentStock] = useState<number | null>(null);
  const [stockLoading, setStockLoading] = useState(false);

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

  const getBackgroundStyles = () => {
    switch (theme) {
      case 'glassmorphic':
        return {
          container: 'relative min-h-screen overflow-hidden bg-gradient-to-br from-[#1a2332] via-[#2d3748] to-[#1a2332]',
          headerTitle: 'bg-gradient-to-r from-white to-teal-400 bg-clip-text text-transparent',
          headerSubtitle: 'text-white/80',
          panelBg: 'border border-white/20 bg-white/10 backdrop-blur-lg shadow-xl',
          panelTitle: 'text-white',
          panelMuted: 'text-white/70',
          searchBg: 'bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-4 shadow-lg',
          inputBg: 'bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-white/70 focus:ring-2 focus:ring-teal-400 focus:border-transparent',
          textareaBg: 'w-full bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-white/70 focus:ring-2 focus:ring-teal-400 rounded-xl px-3 py-2 outline-none',
          label: 'text-white/90',
          loadingText: 'text-white/70',
          tabsList: 'grid w-full grid-cols-2 h-auto gap-1 p-1 rounded-xl bg-white/10 backdrop-blur-md border border-white/20',
          tabsTrigger: 'rounded-lg py-2.5 text-white/75 data-[state=active]:bg-white/15 data-[state=active]:text-white data-[state=active]:shadow-sm border border-transparent data-[state=active]:border-white/20',
          stockBox: 'mt-2 p-3 rounded-xl bg-teal-500/15 border border-teal-400/30',
          stockStrong: 'text-teal-100',
          stockMuted: 'text-teal-200/90',
          btnPrimary: 'flex-1 bg-teal-500/25 border border-teal-400/40 text-teal-100 hover:bg-teal-500/35',
          btnOutline: 'border-white/25 bg-white/10 text-white hover:bg-white/15'
        };
      case 'light':
        return {
          container: 'relative min-h-screen overflow-hidden bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100',
          headerTitle: 'bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent',
          headerSubtitle: 'text-gray-700',
          panelBg: 'border-2 border-blue-200 bg-white shadow-md',
          panelTitle: 'text-gray-900',
          panelMuted: 'text-gray-600',
          searchBg: 'bg-white border-2 border-blue-200 rounded-xl p-4 shadow-md',
          inputBg: 'bg-white border-2 border-blue-300 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
          textareaBg: 'w-full bg-white border-2 border-blue-300 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 rounded-xl px-3 py-2',
          label: 'text-gray-800',
          loadingText: 'text-gray-600',
          tabsList: 'grid w-full grid-cols-2 h-auto gap-1 p-1 rounded-xl bg-blue-100/80 border-2 border-blue-200',
          tabsTrigger: 'rounded-lg py-2.5 text-gray-600 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm border border-transparent data-[state=active]:border-blue-200',
          stockBox: 'mt-2 p-3 rounded-xl bg-green-50 border border-green-200',
          stockStrong: 'text-green-900',
          stockMuted: 'text-green-700',
          btnPrimary: 'flex-1 bg-blue-600 hover:bg-blue-700 text-white border-2 border-blue-500',
          btnOutline: 'border-2 border-gray-300 bg-white text-gray-800 hover:bg-gray-50'
        };
      default:
        return {
          container: 'relative min-h-screen overflow-hidden bg-gradient-to-br from-[#1a2332] via-[#2d3748] to-[#1a2332]',
          headerTitle: 'bg-gradient-to-r from-white to-teal-400 bg-clip-text text-transparent',
          headerSubtitle: 'text-white/80',
          panelBg: 'border border-white/20 bg-white/10 backdrop-blur-lg shadow-xl',
          panelTitle: 'text-white',
          panelMuted: 'text-white/70',
          searchBg: 'bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-4 shadow-lg',
          inputBg: 'bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-white/70 focus:ring-2 focus:ring-teal-400 focus:border-transparent',
          textareaBg: 'w-full bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-white/70 focus:ring-2 focus:ring-teal-400 rounded-xl px-3 py-2 outline-none',
          label: 'text-white/90',
          loadingText: 'text-white/70',
          tabsList: 'grid w-full grid-cols-2 h-auto gap-1 p-1 rounded-xl bg-white/10 backdrop-blur-md border border-white/20',
          tabsTrigger: 'rounded-lg py-2.5 text-white/75 data-[state=active]:bg-white/15 data-[state=active]:text-white data-[state=active]:shadow-sm border border-transparent data-[state=active]:border-white/20',
          stockBox: 'mt-2 p-3 rounded-xl bg-teal-500/15 border border-teal-400/30',
          stockStrong: 'text-teal-100',
          stockMuted: 'text-teal-200/90',
          btnPrimary: 'flex-1 bg-teal-500/25 border border-teal-400/40 text-teal-100 hover:bg-teal-500/35',
          btnOutline: 'border-white/25 bg-white/10 text-white hover:bg-white/15'
        };
    }
  };

  const s = getBackgroundStyles();

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/ppe-receipts');
      const result = await response.json();

      if (result.success) {
        setReceiptRecords(result.data);
      } else {
        console.error('Error fetching receipts:', result.error);
      }
    } catch (error) {
      console.error('Error fetching receipts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentStock = async (ppeId: string) => {
    if (!ppeId) return;

    try {
      setStockLoading(true);
      const response = await fetch(`/api/ppe-current-stock/${ppeId}`);
      const result = await response.json();

      if (result.success) {
        setCurrentStock(result.data.currentStock);
      } else {
        setCurrentStock(null);
      }
    } catch (error) {
      console.error('Error fetching current stock:', error);
      setCurrentStock(null);
    } finally {
      setStockLoading(false);
    }
  };

  const handlePPESelection = (ppeId: string, ppeName: string) => {
    setFormData({ ...formData, ppeId, ppeName });
    fetchCurrentStock(ppeId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/ppe-receipts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        setActiveTab('list');
        setFormData({
          ppeId: '',
          ppeName: '',
          dateOfReceipt: new Date().toISOString().split('T')[0],
          quantityReceived: 1,
          remarks: ''
        });
        setCurrentStock(null);
        fetchData();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error creating receipt:', error);
      alert('Error creating receipt');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredReceipts = receiptRecords.filter(receipt =>
    receipt.ppeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    receipt.ppeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    receipt.receivedByName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const receiptColumns = [
    { key: 'ppeId', label: 'PPE ID' },
    { key: 'ppeName', label: 'PPE Name' },
    { key: 'dateOfReceipt', label: 'Date of Receipt' },
    { key: 'quantityReceived', label: 'Quantity Received' },
    { key: 'receivedByName', label: 'Received By' },
    { key: 'remarks', label: 'Remarks' }
  ];

  const tableVariant = theme === 'light'
    ? 'light'
    : theme === 'glassmorphic'
      ? 'glassmorphic'
      : 'default';

  return (
    <div className={s.container}>
      {theme === 'glassmorphic' && (
        <canvas ref={canvasRef} className="absolute inset-0 z-10" />
      )}

      <div className={cn(
        'relative flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6 min-h-screen max-w-7xl mx-auto w-full',
        theme === 'glassmorphic' ? 'z-20' : 'z-10'
      )}>
        <div className="mb-2">
          <h1 className={cn('text-2xl md:text-3xl font-bold mb-2', s.headerTitle)}>
            PPE Receipts
          </h1>
          <p className={cn('text-lg', s.headerSubtitle)}>
            Manage PPE receipt records when new stock arrives
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className={s.tabsList}>
            <TabsTrigger value="list" className={s.tabsTrigger}>
              Receipt Records
            </TabsTrigger>
            <TabsTrigger value="new" className={s.tabsTrigger}>
              New Receipt
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-4 mt-6">
            <Card className={cn('rounded-xl border-0 shadow-none', s.panelBg)}>
              <CardHeader>
                <CardTitle className={s.panelTitle}>Receipt Records</CardTitle>
                <div className={cn('flex gap-4 mt-4', s.searchBg)}>
                  <Input
                    placeholder="Search receipts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={cn(
                      'max-w-sm border-0 shadow-none bg-transparent focus-visible:ring-2',
                      theme === 'light'
                        ? 'text-gray-900 placeholder:text-gray-500 focus-visible:ring-blue-500'
                        : 'text-white placeholder:text-white/60 focus-visible:ring-teal-400'
                    )}
                  />
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className={cn('text-center py-8', s.loadingText)}>Loading receipts...</div>
                ) : (
                  <div className={theme === 'default' ? 'dark' : undefined}>
                    <ResponsiveTable
                      data={filteredReceipts}
                      columns={receiptColumns}
                      variant={tableVariant}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="new" className="space-y-4 mt-6">
            <Card className={cn('rounded-xl border-0 shadow-none', s.panelBg)}>
              <CardHeader>
                <CardTitle className={s.panelTitle}>New PPE Receipt</CardTitle>
                <p className={cn('text-sm', s.panelMuted)}>Record receipt of new PPE stock</p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className={cn('block text-sm font-medium mb-1', s.label)}>
                      PPE Item *
                    </label>
                    <SearchablePPESelect
                      value={formData.ppeId}
                      onChange={handlePPESelection}
                      placeholder="Search PPE by name or ID..."
                      required
                    />
                    {currentStock !== null && (
                      <div className={s.stockBox}>
                        <p className={cn('text-sm', s.stockStrong)}>
                          <strong>Current Stock:</strong> {stockLoading ? 'Loading...' : currentStock} units
                        </p>
                        <p className={cn('text-sm mt-1', s.stockMuted)}>
                          After receipt: {currentStock + formData.quantityReceived} units
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className={cn('block text-sm font-medium mb-1', s.label)}>
                      Date of Receipt *
                    </label>
                    <Input
                      type="date"
                      value={formData.dateOfReceipt}
                      onChange={(e) => setFormData({ ...formData, dateOfReceipt: e.target.value })}
                      required
                      className={s.inputBg}
                    />
                  </div>

                  <div>
                    <label className={cn('block text-sm font-medium mb-1', s.label)}>
                      Quantity Received *
                    </label>
                    <Input
                      type="number"
                      value={formData.quantityReceived}
                      onChange={(e) => setFormData({ ...formData, quantityReceived: parseInt(e.target.value, 10) || 0 })}
                      required
                      min={1}
                      placeholder="Enter quantity received"
                      className={s.inputBg}
                    />
                  </div>

                  <div>
                    <label className={cn('block text-sm font-medium mb-1', s.label)}>
                      Remarks
                    </label>
                    <textarea
                      value={formData.remarks}
                      onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                      className={s.textareaBg}
                      rows={3}
                      placeholder="Enter any remarks about this receipt..."
                    />
                  </div>

                  <div className="flex gap-4 pt-4">
                    <Button type="submit" className={s.btnPrimary}>
                      Record Receipt
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className={s.btnOutline}
                      onClick={() => {
                        setActiveTab('list');
                        setFormData({
                          ppeId: '',
                          ppeName: '',
                          dateOfReceipt: new Date().toISOString().split('T')[0],
                          quantityReceived: 1,
                          remarks: ''
                        });
                        setCurrentStock(null);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
