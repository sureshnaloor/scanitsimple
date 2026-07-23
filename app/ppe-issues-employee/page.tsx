'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import ResponsiveTable from '@/components/ui/responsive-table';
import { useToast } from '@/components/ui/toaster';
import SearchableEmployeeSelect from '@/components/SearchableEmployeeSelect';

type EmployeeIssueRow = {
  type: 'Individual' | 'Bulk';
  date: string;
  ppeId: string;
  ppeName: string;
  quantity: number;
  details: string;
  issuer: string;
};

export default function PPEIssuesEmployeePage() {
  const { show } = useToast();
  const [selectedEmpNumber, setSelectedEmpNumber] = useState<string>('');
  const [selectedEmpName, setSelectedEmpName] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<EmployeeIssueRow[]>([]);

  const columns = [
    { key: 'type', label: 'Type' },
    { key: 'date', label: 'Date' },
    { key: 'ppeId', label: 'PPE ID' },
    { key: 'ppeName', label: 'PPE Name' },
    { key: 'quantity', label: 'Quantity' },
    { key: 'details', label: 'Details' },
    { key: 'issuer', label: 'Issued By' },
  ];

  const fetchByEmployee = async (empNumber?: string, empName?: string) => {
    const number = (empNumber ?? selectedEmpNumber).trim();
    const name = (empName ?? selectedEmpName).trim();
    if (!number && !name) {
      show({ title: 'Employee required', description: 'Please select an employee', variant: 'destructive' });
      return;
    }
    try {
      setLoading(true);
      // Use specific param for individual issues; use search for bulk
      const indParams = new URLSearchParams();
      if (number) indParams.set('userEmpNumber', number);
      else if (name) indParams.set('search', name);

      const bulkParams = new URLSearchParams();
      const searchForBulk = number || name;
      if (searchForBulk) bulkParams.set('search', searchForBulk);

      const [indRes, bulkRes] = await Promise.all([
        fetch(`/api/ppe-records?${indParams.toString()}`),
        fetch(`/api/ppe-bulk-issues?${bulkParams.toString()}`),
      ]);
      const [indJson, bulkJson] = await Promise.all([indRes.json(), bulkRes.json()]);

      if (!indJson.success) throw new Error(indJson.error || 'Failed to fetch individual issues');
      if (!bulkJson.success) throw new Error(bulkJson.error || 'Failed to fetch bulk issues');

      const indRows: EmployeeIssueRow[] = (indJson.data.records || [])
        .map((r: any) => ({
          type: 'Individual',
          date: new Date(r.dateOfIssue).toLocaleDateString(),
          ppeId: r.ppeId,
          ppeName: r.ppeName,
          quantity: r.quantityIssued,
          details: `${r.userEmpName} (${r.userEmpNumber})`,
          issuer: r.issuedByName,
        }));

      const bulkRows: EmployeeIssueRow[] = (bulkJson.data.records || [])
        .map((r: any) => ({
          type: 'Bulk',
          date: new Date(r.issueDate).toLocaleDateString(),
          ppeId: r.ppeId,
          ppeName: r.ppeName,
          quantity: r.quantityIssued,
          details: `${r.receiverUserEmpName} (${r.receiverUserEmpNumber})`,
          issuer: r.issuedByName,
        }));

      const merged = [...indRows, ...bulkRows].sort((a, b) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
      setRows(merged);
    } catch (e: any) {
      show({ title: 'Fetch failed', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">PPE Issues by Employee</h1>
        <p className="text-gray-600">Enter employee name or number to view issues</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Employee</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="w-full md:w-96">
              <label className="block text-sm font-medium mb-1">Search employee</label>
              <SearchableEmployeeSelect
                value={selectedEmpNumber}
                onChange={(empNumber, empName) => {
                  setSelectedEmpNumber(empNumber);
                  setSelectedEmpName(empName);
                  fetchByEmployee(empNumber, empName);
                }}
                placeholder="Search employee by name or number..."
                required
              />
            </div>
            <Button onClick={() => fetchByEmployee()} disabled={loading || (!selectedEmpNumber && !selectedEmpName)}>
              {loading ? 'Loading...' : 'Fetch'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6">
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <ResponsiveTable columns={columns as any} data={rows as any} />
        )}
      </div>
    </div>
  );
}


