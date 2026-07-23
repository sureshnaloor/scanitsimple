'use client';

import { useState, useEffect } from 'react';
import { PPEDueForReissue } from '@/types/ppe';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ResponsiveTable from '@/components/ui/responsive-table';

export default function PPEDueForReissuePage() {
  const [dueRecords, setDueRecords] = useState<PPEDueForReissue[]>([]);
  const [loading, setLoading] = useState(true);
  const [daysOverdue, setDaysOverdue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch PPE due for reissue
  const fetchDueRecords = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/ppe-due-for-reissue?daysOverdue=${daysOverdue}`);
      const result = await response.json();
      
      if (result.success) {
        let filteredRecords = result.data;
        
        // Apply search filter
        if (searchTerm) {
          filteredRecords = filteredRecords.filter((record: PPEDueForReissue) =>
            record.userEmpName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            record.userEmpNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            record.ppeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            record.ppeId.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }
        
        setDueRecords(filteredRecords);
      } else {
        console.error('Failed to fetch PPE due records:', result.error);
      }
    } catch (error) {
      console.error('Error fetching PPE due records:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDueRecords();
  }, [daysOverdue, searchTerm]);

  // Table columns
  const columns = [
    { key: 'userEmpNumber', label: 'Emp Number' },
    { key: 'userEmpName', label: 'Employee Name' },
    { key: 'ppeName', label: 'PPE Name' },
    { key: 'lastIssueDate', label: 'Last Issue Date' },
    { key: 'dueDate', label: 'Due Date' },
    { key: 'daysOverdue', label: 'Days Overdue' },
    { key: 'quantity', label: 'Quantity' }
  ];

  const tableData = dueRecords.map(record => ({
    ...record,
    lastIssueDate: new Date(record.lastIssueDate).toLocaleDateString(),
    dueDate: new Date(record.dueDate).toLocaleDateString(),
    daysOverdue: record.daysOverdue > 0 ? `${record.daysOverdue} days` : 'Due today'
  }));

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">PPE Due for Reissue</h1>
        <p className="text-gray-600">Track PPE items that are due or overdue for reissue</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>PPE Due for Reissue</CardTitle>
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Show items overdue by:</label>
              <select
                value={daysOverdue}
                onChange={(e) => setDaysOverdue(parseInt(e.target.value))}
                className="p-2 border border-gray-300 rounded-md"
              >
                <option value={0}>All due items (0+ days)</option>
                <option value={1}>1+ days overdue</option>
                <option value={7}>7+ days overdue</option>
                <option value={30}>30+ days overdue</option>
                <option value={90}>90+ days overdue</option>
              </select>
            </div>
            <Input
              placeholder="Search records..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Button onClick={fetchDueRecords}>
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <>
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  Showing {dueRecords.length} PPE items that are due or overdue for reissue
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
