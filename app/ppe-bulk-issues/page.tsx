'use client';

import { useState, useEffect } from 'react';
import { PPEBulkIssue, PPEMaster, Employee } from '@/types/ppe';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ResponsiveTable from '@/components/ui/responsive-table';
import SearchableEmployeeSelect from '@/components/SearchableEmployeeSelect';
import SearchablePPESelect from '@/components/SearchablePPESelect';

interface PPEBulkFormData {
  departmentOrProjectName: string;
  location: string;
  ppeId: string;
  ppeName: string;
  quantityIssued: number;
  receiverUserEmpNumber: string;
  issueDate: string;
  remarks: string;
}

export default function PPEBulkIssuesPage() {
  const [bulkIssueRecords, setBulkIssueRecords] = useState<PPEBulkIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('list');
  const [formData, setFormData] = useState<PPEBulkFormData>({
    departmentOrProjectName: '',
    location: '',
    ppeId: '',
    ppeName: '',
    quantityIssued: 1,
    receiverUserEmpNumber: '',
    issueDate: new Date().toISOString().split('T')[0],
    remarks: ''
  });
  const [currentStock, setCurrentStock] = useState<number | null>(null);
  const [stockLoading, setStockLoading] = useState(false);

  // Fetch data
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch bulk issue records
      const bulkResponse = await fetch(`/api/ppe-bulk-issues?search=${searchTerm}`);
      const bulkResult = await bulkResponse.json();
      
      if (bulkResult.success) {
        setBulkIssueRecords(bulkResult.data.records);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [searchTerm]);

  // Fetch current stock for selected PPE
  const fetchCurrentStock = async (ppeId: string) => {
    if (!ppeId) {
      setCurrentStock(null);
      return;
    }
    
    try {
      setStockLoading(true);
      const response = await fetch(`/api/ppe-current-stock/${ppeId}`);
      const result = await response.json();
      
      if (result.success) {
        setCurrentStock(result.data.currentStock);
      } else {
        setCurrentStock(0);
      }
    } catch (error) {
      console.error('Error fetching current stock:', error);
      setCurrentStock(0);
    } finally {
      setStockLoading(false);
    }
  };

  // Handle PPE selection change
  const handlePPESelection = (ppeId: string, ppeName: string) => {
    setFormData({ ...formData, ppeId, ppeName });
    fetchCurrentStock(ppeId);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check stock availability
    if (currentStock !== null && formData.quantityIssued > currentStock) {
      alert(`Insufficient stock! Available: ${currentStock}, Requested: ${formData.quantityIssued}`);
      return;
    }
    
    try {
      const response = await fetch('/api/ppe-bulk-issues', {
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
          departmentOrProjectName: '',
          location: '',
          ppeId: '',
          ppeName: '',
          quantityIssued: 1,
          receiverUserEmpNumber: '',
          issueDate: new Date().toISOString().split('T')[0],
          remarks: ''
        });
        setCurrentStock(null);
        fetchData();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error creating bulk PPE issue record:', error);
      alert('Failed to create bulk PPE issue record');
    }
  };

  // Table columns
  const columns = [
    { key: 'issueDate', label: 'Issue Date' },
    { key: 'departmentOrProjectName', label: 'Department/Project' },
    { key: 'location', label: 'Location' },
    { key: 'ppeName', label: 'PPE Name' },
    { key: 'quantityIssued', label: 'Quantity' },
    { key: 'receiverUserEmpName', label: 'Receiver' },
    { key: 'issuedByName', label: 'Issued By' }
  ];

  const tableData = bulkIssueRecords.map(record => ({
    ...record,
    issueDate: new Date(record.issueDate).toLocaleDateString()
  }));

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Bulk PPE Issues</h1>
        <p className="text-gray-600">Manage bulk PPE issues to departments and projects</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="list">Bulk Issue Records</TabsTrigger>
          <TabsTrigger value="form">Create Bulk Issue</TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <Card>
            <CardHeader>
              <CardTitle>Bulk PPE Issue Records</CardTitle>
              <div className="flex gap-4">
                <Input
                  placeholder="Search bulk issue records..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
                <Button onClick={() => setActiveTab('form')}>
                  Create Bulk Issue
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : (
                <ResponsiveTable columns={columns} data={tableData} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="form">
          <Card>
            <CardHeader>
              <CardTitle>Create Bulk PPE Issue</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Department/Project Name *
                    </label>
                    <Input
                      value={formData.departmentOrProjectName}
                      onChange={(e) => setFormData({ ...formData, departmentOrProjectName: e.target.value })}
                      required
                      placeholder="e.g., Safety Department, Project Alpha"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Location *
                    </label>
                    <Input
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      required
                      placeholder="e.g., Site A, Building 1, Floor 2"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      PPE Item *
                    </label>
                    <SearchablePPESelect
                      value={formData.ppeId}
                      onChange={handlePPESelection}
                      placeholder="Search PPE by name or ID..."
                      required
                    />
                    {currentStock !== null && (
                      <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                        <p className="text-sm text-blue-800">
                          <strong>Current Stock:</strong> {stockLoading ? 'Loading...' : currentStock} units
                        </p>
                        {currentStock === 0 && (
                          <p className="text-sm text-red-600 mt-1">
                            ⚠️ This PPE item is out of stock!
                          </p>
                        )}
                        {currentStock > 0 && currentStock <= 10 && (
                          <p className="text-sm text-orange-600 mt-1">
                            ⚠️ Low stock warning (≤10 units)
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Quantity *
                    </label>
                    <Input
                      type="number"
                      value={formData.quantityIssued}
                      onChange={(e) => setFormData({ ...formData, quantityIssued: parseInt(e.target.value) })}
                      required
                      min="1"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Receiver Employee *
                    </label>
                    <SearchableEmployeeSelect
                      value={formData.receiverUserEmpNumber}
                      onChange={(empNumber, empName) => {
                        setFormData({
                          ...formData,
                          receiverUserEmpNumber: empNumber
                        });
                      }}
                      placeholder="Search receiver employee by name or number..."
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Issue Date *
                    </label>
                    <Input
                      type="date"
                      value={formData.issueDate}
                      onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Remarks
                  </label>
                  <textarea
                    value={formData.remarks}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    rows={3}
                    placeholder="Enter any remarks or notes about this bulk issue..."
                  />
                </div>
                
                <div className="flex gap-4">
                  <Button type="submit">
                    Create Bulk Issue
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setActiveTab('list');
                      setFormData({
                        departmentOrProjectName: '',
                        location: '',
                        ppeId: '',
                        ppeName: '',
                        quantityIssued: 1,
                        receiverUserEmpNumber: '',
                        issueDate: new Date().toISOString().split('T')[0],
                        remarks: ''
                      });
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
  );
}
