'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import ResponsiveTable from '@/components/ui/responsive-table';
import { useToast } from '@/components/ui/toaster';

type IssueRow = {
  type: 'Individual' | 'Bulk';
  date: string;
  ppeId: string;
  ppeName: string;
  quantity: number;
  employeeOrReceiver: string;
  issuer: string;
};

export default function PPEIssuesDateRangePage() {
  const { show } = useToast();
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<IssueRow[]>([]);

  const columns = useMemo(() => ([
    { key: 'type', label: 'Type' },
    { key: 'date', label: 'Date' },
    { key: 'ppeId', label: 'PPE ID' },
    { key: 'ppeName', label: 'PPE Name' },
    { key: 'quantity', label: 'Quantity' },
    { key: 'employeeOrReceiver', label: 'Employee/Receiver' },
    { key: 'issuer', label: 'Issued By' },
  ]), []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);

      const [indRes, bulkRes] = await Promise.all([
        fetch(`/api/ppe-records?${params.toString()}`),
        fetch(`/api/ppe-bulk-issues?${params.toString()}`),
      ]);
      const [indJson, bulkJson] = await Promise.all([indRes.json(), bulkRes.json()]);

      if (!indJson.success) throw new Error(indJson.error || 'Failed to fetch individual issues');
      if (!bulkJson.success) throw new Error(bulkJson.error || 'Failed to fetch bulk issues');

      const indRows: IssueRow[] = (indJson.data.records || []).map((r: any) => ({
        type: 'Individual',
        date: new Date(r.dateOfIssue).toLocaleDateString(),
        ppeId: r.ppeId,
        ppeName: r.ppeName,
        quantity: r.quantityIssued,
        employeeOrReceiver: `${r.userEmpName} (${r.userEmpNumber})`,
        issuer: r.issuedByName,
      }));

      const bulkRows: IssueRow[] = (bulkJson.data.records || []).map((r: any) => ({
        type: 'Bulk',
        date: new Date(r.issueDate).toLocaleDateString(),
        ppeId: r.ppeId,
        ppeName: r.ppeName,
        quantity: r.quantityIssued,
        employeeOrReceiver: `${r.departmentOrProjectName} @ ${r.location}`,
        issuer: r.issuedByName,
      }));

      const merged = [...indRows, ...bulkRows].sort((a, b) => {
        // Sort by date desc
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
        <h1 className="text-2xl font-bold">PPE Issues (Date Range)</h1>
        <p className="text-gray-600">View both individual and bulk issues between dates</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div>
              <label className="block text-sm font-medium mb-1">From</label>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">To</label>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
            <Button onClick={fetchAll} disabled={loading}>
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


