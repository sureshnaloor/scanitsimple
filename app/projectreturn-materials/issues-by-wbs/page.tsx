'use client';
import { useState, useEffect } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, ChevronDown, ChevronRight } from 'lucide-react';
import ResponsiveTanStackTable from '@/components/ui/responsive-tanstack-table';

interface IssueWithMaterialDetails {
  _id?: string;
  materialid: string;
  materialCode: string;
  materialDescription: string;
  projectName: string;
  budgetedWBS?: string;
  requestor?: string;
  requestorEmpNumber?: string;
  requestorName?: string;
  qtyRequested: number;
  issuerName: string;
  issueQuantity: number;
  remarks?: string;
  issueDate: Date | string;
  requestId?: string;
  createdBy?: string;
  createdAt?: Date | string;
  sourceUnitRate: number;
  originalValue: number;
  unitRateAtIssue: number;
  valueAtIssue: number;
}

interface GroupedByWBS {
  wbs: string;
  issues: IssueWithMaterialDetails[];
  totalOriginalValue: number;
  totalValueAtIssue: number;
  totalQuantity: number;
}

interface GroupedByMonth {
  month: string;
  year: number;
  monthYear: string;
  issues: IssueWithMaterialDetails[];
  totalOriginalValue: number;
  totalValueAtIssue: number;
  totalQuantity: number;
}

export default function IssuesByWBSPage() {
  const [issues, setIssues] = useState<IssueWithMaterialDetails[]>([]);
  const [groupedByWBS, setGroupedByWBS] = useState<GroupedByWBS[]>([]);
  const [groupedByMonth, setGroupedByMonth] = useState<GroupedByMonth[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'wbs' | 'month'>('wbs');
  const [expandedWBS, setExpandedWBS] = useState<Set<string>>(new Set());
  const [expandedMonth, setExpandedMonth] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchIssues();
  }, []);

  useEffect(() => {
    if (issues.length > 0) {
      groupIssues();
    }
  }, [issues, viewMode]);

  const fetchIssues = async () => {
    try {
      const response = await fetch('/api/projectreturn-materials/issues/by-wbs');
      if (!response.ok) throw new Error('Failed to fetch issues');
      const data: IssueWithMaterialDetails[] = await response.json();
      setIssues(data);
    } catch (error) {
      console.error('Error fetching issues:', error);
    } finally {
      setLoading(false);
    }
  };

  const groupIssues = () => {
    if (viewMode === 'wbs') {
      // Group by WBS
      const wbsMap = new Map<string, IssueWithMaterialDetails[]>();
      
      issues.forEach((issue) => {
        const wbs = issue.budgetedWBS || 'No WBS';
        if (!wbsMap.has(wbs)) {
          wbsMap.set(wbs, []);
        }
        wbsMap.get(wbs)!.push(issue);
      });

      const grouped: GroupedByWBS[] = Array.from(wbsMap.entries()).map(([wbs, issueList]) => {
        const totalOriginalValue = issueList.reduce((sum, issue) => sum + issue.originalValue, 0);
        const totalValueAtIssue = issueList.reduce((sum, issue) => sum + issue.valueAtIssue, 0);
        const totalQuantity = issueList.reduce((sum, issue) => sum + issue.issueQuantity, 0);
        
        return {
          wbs,
          issues: issueList.sort((a, b) => {
            const dateA = new Date(a.issueDate).getTime();
            const dateB = new Date(b.issueDate).getTime();
            return dateB - dateA; // Sort by date descending
          }),
          totalOriginalValue,
          totalValueAtIssue,
          totalQuantity,
        };
      });

      // Sort by WBS code
      grouped.sort((a, b) => a.wbs.localeCompare(b.wbs));
      setGroupedByWBS(grouped);
    } else {
      // Group by month
      const monthMap = new Map<string, IssueWithMaterialDetails[]>();
      
      issues.forEach((issue) => {
        const issueDate = new Date(issue.issueDate);
        const year = issueDate.getFullYear();
        const month = issueDate.getMonth() + 1;
        const monthYear = `${year}-${month.toString().padStart(2, '0')}`;
        const monthName = issueDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        
        if (!monthMap.has(monthYear)) {
          monthMap.set(monthYear, []);
        }
        monthMap.get(monthYear)!.push(issue);
      });

      const grouped: GroupedByMonth[] = Array.from(monthMap.entries()).map(([monthYear, issueList]) => {
        const [year, month] = monthYear.split('-').map(Number);
        const issueDate = new Date(year, month - 1);
        const monthName = issueDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        
        const totalOriginalValue = issueList.reduce((sum, issue) => sum + issue.originalValue, 0);
        const totalValueAtIssue = issueList.reduce((sum, issue) => sum + issue.valueAtIssue, 0);
        const totalQuantity = issueList.reduce((sum, issue) => sum + issue.issueQuantity, 0);
        
        return {
          month: monthName,
          year,
          monthYear,
          issues: issueList.sort((a, b) => {
            const dateA = new Date(a.issueDate).getTime();
            const dateB = new Date(b.issueDate).getTime();
            return dateB - dateA; // Sort by date descending
          }),
          totalOriginalValue,
          totalValueAtIssue,
          totalQuantity,
        };
      });

      // Sort by month descending (most recent first)
      grouped.sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.monthYear.localeCompare(a.monthYear);
      });
      setGroupedByMonth(grouped);
    }
  };

  const toggleWBS = (wbs: string) => {
    const newExpanded = new Set(expandedWBS);
    if (newExpanded.has(wbs)) {
      newExpanded.delete(wbs);
    } else {
      newExpanded.add(wbs);
    }
    setExpandedWBS(newExpanded);
  };

  const toggleMonth = (monthYear: string) => {
    const newExpanded = new Set(expandedMonth);
    if (newExpanded.has(monthYear)) {
      newExpanded.delete(monthYear);
    } else {
      newExpanded.add(monthYear);
    }
    setExpandedMonth(newExpanded);
  };

  const columns: ColumnDef<IssueWithMaterialDetails>[] = [
    {
      accessorKey: 'materialCode',
      header: 'Material Code',
      cell: ({ row }) => (
        <div className="font-semibold text-gray-900 dark:text-white">
          {row.getValue('materialCode')}
        </div>
      ),
    },
    {
      accessorKey: 'materialDescription',
      header: 'Material Description',
      cell: ({ row }) => (
        <div className="text-gray-700 dark:text-gray-300 max-w-xs">
          {row.getValue('materialDescription')}
        </div>
      ),
    },
    {
      accessorKey: 'projectName',
      header: 'Project Name',
      cell: ({ row }) => (
        <div className="text-gray-700 dark:text-gray-300">
          {row.getValue('projectName')}
        </div>
      ),
    },
    {
      accessorKey: 'issueQuantity',
      header: 'Issue Quantity',
      cell: ({ row }) => {
        const quantity = row.getValue('issueQuantity') as number;
        return (
          <div className="text-gray-900 dark:text-white font-medium">
            {quantity.toLocaleString()}
          </div>
        );
      },
    },
    {
      accessorKey: 'issueDate',
      header: 'Issue Date',
      cell: ({ row }) => {
        const date = row.getValue('issueDate') as Date | string;
        return (
          <div className="text-gray-700 dark:text-gray-300">
            {new Date(date).toLocaleDateString()}
          </div>
        );
      },
    },
    {
      accessorKey: 'issuerName',
      header: 'Issuer',
      cell: ({ row }) => (
        <div className="text-gray-700 dark:text-gray-300">
          {row.getValue('issuerName')}
        </div>
      ),
    },
    {
      accessorKey: 'originalValue',
      header: 'Original Value',
      cell: ({ row }) => {
        const value = row.getValue('originalValue') as number;
        return (
          <div className="text-gray-900 dark:text-white font-medium">
            {new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'SAR'
            }).format(value)}
          </div>
        );
      },
    },
    {
      accessorKey: 'valueAtIssue',
      header: 'Value at Issue',
      cell: ({ row }) => {
        const value = row.getValue('valueAtIssue') as number;
        return (
          <div className="text-green-700 dark:text-green-400 font-semibold">
            {new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'SAR'
            }).format(value)}
          </div>
        );
      },
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Project Return Materials Issued to WBS
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          View materials issued to WBS, grouped by WBS or by month.
        </p>

        {/* View Mode Toggle */}
        <div className="mb-4 flex gap-4">
          <button
            onClick={() => setViewMode('wbs')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'wbs'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Group by WBS
          </button>
          <button
            onClick={() => setViewMode('month')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'month'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Group by Month
          </button>
        </div>
      </div>

      {/* WBS View */}
      {viewMode === 'wbs' && (
        <div className="space-y-4">
          {groupedByWBS.length === 0 ? (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 text-center">
              <p className="text-yellow-900 dark:text-yellow-200">
                No issues found.
              </p>
            </div>
          ) : (
            groupedByWBS.map((group) => (
              <div
                key={group.wbs}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden"
              >
                <button
                  onClick={() => toggleWBS(group.wbs)}
                  className="w-full px-6 py-4 flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {expandedWBS.has(group.wbs) ? (
                      <ChevronDown className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    )}
                    <div className="text-left">
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                        WBS: {group.wbs}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {group.issues.length} issue(s) • Total Quantity: {group.totalQuantity.toLocaleString()} • 
                        Original Value: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'SAR' }).format(group.totalOriginalValue)} • 
                        Value at Issue: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'SAR' }).format(group.totalValueAtIssue)}
                      </p>
                    </div>
                  </div>
                </button>
                {expandedWBS.has(group.wbs) && (
                  <div className="p-4">
                    <ResponsiveTanStackTable
                      data={group.issues}
                      columns={columns}
                      sorting={[]}
                      setSorting={() => {}}
                      columnFilters={[]}
                      setColumnFilters={() => {}}
                      globalFilter=""
                      setGlobalFilter={() => {}}
                    />
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Month View */}
      {viewMode === 'month' && (
        <div className="space-y-4">
          {groupedByMonth.length === 0 ? (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 text-center">
              <p className="text-yellow-900 dark:text-yellow-200">
                No issues found.
              </p>
            </div>
          ) : (
            groupedByMonth.map((group) => (
              <div
                key={group.monthYear}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden"
              >
                <button
                  onClick={() => toggleMonth(group.monthYear)}
                  className="w-full px-6 py-4 flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {expandedMonth.has(group.monthYear) ? (
                      <ChevronDown className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    )}
                    <div className="text-left">
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                        {group.month}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {group.issues.length} issue(s) • Total Quantity: {group.totalQuantity.toLocaleString()} • 
                        Original Value: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'SAR' }).format(group.totalOriginalValue)} • 
                        Value at Issue: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'SAR' }).format(group.totalValueAtIssue)}
                      </p>
                    </div>
                  </div>
                </button>
                {expandedMonth.has(group.monthYear) && (
                  <div className="p-4">
                    <ResponsiveTanStackTable
                      data={group.issues}
                      columns={columns}
                      sorting={[]}
                      setSorting={() => {}}
                      columnFilters={[]}
                      setColumnFilters={() => {}}
                      globalFilter=""
                      setGlobalFilter={() => {}}
                    />
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Summary */}
      {issues.length > 0 && (
        <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">
            Overall Summary:
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-blue-800 dark:text-blue-300">
            <div>
              <span className="font-semibold">Total Issues:</span> {issues.length}
            </div>
            <div>
              <span className="font-semibold">Total Quantity:</span>{' '}
              {issues.reduce((sum, issue) => sum + issue.issueQuantity, 0).toLocaleString()}
            </div>
            <div>
              <span className="font-semibold">Total Original Value:</span>{' '}
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'SAR'
              }).format(issues.reduce((sum, issue) => sum + issue.originalValue, 0))}
            </div>
            <div>
              <span className="font-semibold">Total Value at Issue:</span>{' '}
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'SAR'
              }).format(issues.reduce((sum, issue) => sum + issue.valueAtIssue, 0))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


