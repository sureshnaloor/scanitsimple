'use client';

import { useState, useEffect } from 'react';
import { PPEStockSummary } from '@/types/ppe';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import ResponsiveTable from '@/components/ui/responsive-table';

interface PPEStockDisplayProps {
  showLowStock?: boolean;
  lowStockThreshold?: number;
}

export default function PPEStockDisplay({ 
  showLowStock = false, 
  lowStockThreshold = 10 
}: PPEStockDisplayProps) {
  const [stockData, setStockData] = useState<PPEStockSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredData, setFilteredData] = useState<PPEStockSummary[]>([]);

  // Fetch stock data
  const fetchStockData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/ppe-stock-summary');
      const result = await response.json();
      
      if (result.success) {
        let data = result.data;
        
        // Filter for low stock if requested
        if (showLowStock) {
          data = data.filter((item: PPEStockSummary) => item.currentStock <= lowStockThreshold);
        }
        
        setStockData(data);
        setFilteredData(data);
      } else {
        console.error('Failed to fetch stock data:', result.error);
      }
    } catch (error) {
      console.error('Error fetching stock data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStockData();
  }, [showLowStock, lowStockThreshold]);

  // Filter data based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredData(stockData);
    } else {
      const filtered = stockData.filter(item =>
        item.ppeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.ppeId.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredData(filtered);
    }
  }, [searchTerm, stockData]);

  // Table columns
  const columns = [
    { key: 'ppeId', label: 'PPE ID' },
    { key: 'ppeName', label: 'PPE Name' },
    { key: 'currentStock', label: 'Current Stock' },
    { key: 'initialStock', label: 'Initial Stock' },
    { key: 'totalIssued', label: 'Total Issued' },
    { key: 'lastTransactionDate', label: 'Last Transaction' },
    { key: 'stockStatus', label: 'Status' }
  ];

  const tableData = filteredData.map(item => ({
    ...item,
    currentStock: item.currentStock,
    initialStock: item.initialStock,
    totalIssued: item.totalIssued,
    lastTransactionDate: new Date(item.lastTransactionDate).toLocaleDateString(),
    stockStatus: item.currentStock <= lowStockThreshold ? 'Low Stock' : 'In Stock'
  }));

  // Calculate summary statistics
  const totalItems = stockData.length;
  const lowStockItems = stockData.filter(item => item.currentStock <= lowStockThreshold).length;
  const outOfStockItems = stockData.filter(item => item.currentStock === 0).length;
  const totalCurrentStock = stockData.reduce((sum, item) => sum + item.currentStock, 0);
  const totalInitialStock = stockData.reduce((sum, item) => sum + item.initialStock, 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total PPE Items</CardTitle>
            <div className="h-4 w-4 text-blue-600">📦</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
            <p className="text-xs text-muted-foreground">
              Active PPE items
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <div className="h-4 w-4 text-orange-600">⚠️</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowStockItems}</div>
            <p className="text-xs text-muted-foreground">
              ≤ {lowStockThreshold} units
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <div className="h-4 w-4 text-red-600">🚫</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{outOfStockItems}</div>
            <p className="text-xs text-muted-foreground">
              0 units available
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Current Stock</CardTitle>
            <div className="h-4 w-4 text-green-600">📊</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCurrentStock}</div>
            <p className="text-xs text-muted-foreground">
              {totalInitialStock} initial units
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Stock Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {showLowStock ? 'Low Stock PPE Items' : 'PPE Stock Summary'}
          </CardTitle>
          <div className="flex gap-4">
            <Input
              placeholder="Search PPE items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Button onClick={fetchStockData}>
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading stock data...</div>
          ) : (
            <>
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  Showing {filteredData.length} PPE items
                  {showLowStock && ` with stock ≤ ${lowStockThreshold}`}
                </p>
              </div>
              <ResponsiveTable columns={columns} data={tableData} />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
