'use client';
import { useState, useEffect } from 'react';
import { 
  ColumnDef,
  SortingState,
  ColumnFiltersState
} from '@tanstack/react-table';
import { ArrowUpDown, Package, Eye, CheckCircle, XCircle } from 'lucide-react';
import ResponsiveTanStackTable from '@/components/ui/responsive-tanstack-table';
import { MaterialRequest } from '@/types/projectissuedmaterials';
import MaterialIssueForm from '@/components/MaterialIssueForm';

export default function MaterialRequestsPage() {
  const [data, setData] = useState<MaterialRequest[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<MaterialRequest | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await fetch('/api/projectissued-materials/requests');
      if (!response.ok) throw new Error('Failed to fetch requests');
      const data = await response.json();
      setData(data);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleIssueFromRequest = (request: MaterialRequest) => {
    setSelectedRequest(request);
    setShowIssueForm(true);
  };

  const handleSubmitIssue = async (issueData: any) => {
    try {
      const response = await fetch('/api/projectissued-materials/issues', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...issueData,
          requestId: selectedRequest?._id
        }),
      });

      if (!response.ok) throw new Error('Failed to issue material');
      
      await fetchRequests();
      setShowIssueForm(false);
      setSelectedRequest(null);
      alert('Material issued successfully');
    } catch (error) {
      console.error('Error issuing material:', error);
      alert('Failed to issue material');
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    try {
      const response = await fetch(`/api/projectissued-materials/requests/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'approved' }),
      });

      if (!response.ok) throw new Error('Failed to approve request');
      
      await fetchRequests();
      alert('Request approved successfully');
    } catch (error) {
      console.error('Error approving request:', error);
      alert('Failed to approve request');
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      const response = await fetch(`/api/projectissued-materials/requests/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'rejected' }),
      });

      if (!response.ok) throw new Error('Failed to reject request');
      
      await fetchRequests();
      alert('Request rejected successfully');
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('Failed to reject request');
    }
  };

  const columns: ColumnDef<MaterialRequest>[] = [
    {
      accessorKey: 'materialid',
      header: ({ column }) => (
        <button
          className="flex items-center gap-1"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Material ID
          <ArrowUpDown className="h-4 w-4" />
        </button>
      ),
    },
    {
      accessorKey: 'drawingNumber',
      header: 'Drawing Number',
    },
    {
      accessorKey: 'equipment',
      header: 'Equipment',
    },
    {
      accessorKey: 'room',
      header: 'Room',
    },
    {
      accessorKey: 'requestorName',
      header: 'Requestor',
    },
    {
      accessorKey: 'qtyRequested',
      header: ({ column }) => (
        <button
          className="flex items-center gap-1"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Qty Requested
          <ArrowUpDown className="h-4 w-4" />
        </button>
      ),
      cell: ({ row }) => {
        const value = row.getValue('qtyRequested') as number;
        return value.toLocaleString();
      }
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status') as string;
        const statusColors = {
          pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200',
          approved: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200',
          rejected: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200',
          issued: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200'
        };
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}`}>
            {status.toUpperCase()}
          </span>
        );
      }
    },
    {
      accessorKey: 'requestDate',
      header: ({ column }) => (
        <button
          className="flex items-center gap-1"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Request Date
          <ArrowUpDown className="h-4 w-4" />
        </button>
      ),
      cell: ({ row }) => {
        const date = row.getValue('requestDate') as Date;
        return new Date(date).toLocaleDateString();
      }
    },
    {
      accessorKey: 'remarks',
      header: 'Remarks',
      cell: ({ row }) => {
        const remarks = row.getValue('remarks') as string;
        return remarks ? (
          <div className="max-w-[200px] truncate" title={remarks}>
            {remarks}
          </div>
        ) : '-';
      }
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const request = row.original;
        const isPending = request.status === 'pending';
        const isApproved = request.status === 'approved';
        
        return (
          <div className="flex items-center gap-2">
            {isPending && (
              <>
                <button
                  onClick={() => handleApproveRequest(request._id!)}
                  className="text-green-400 hover:text-green-300"
                  title="Approve Request"
                >
                  <CheckCircle className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleRejectRequest(request._id!)}
                  className="text-red-400 hover:text-red-300"
                  title="Reject Request"
                >
                  <XCircle className="h-4 w-4" />
                </button>
              </>
            )}
            {(isPending || isApproved) && (
              <button
                onClick={() => handleIssueFromRequest(request)}
                className="text-blue-400 hover:text-blue-300"
                title="Issue Material"
              >
                <Package className="h-4 w-4" />
              </button>
            )}
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
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Material Requests</h1>
      </div>

      <div className="mb-4">
        <input
          type="text"
          value={globalFilter ?? ''}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder="Search requests..."
          className="w-full max-w-sm px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800">
        <ResponsiveTanStackTable
          data={data}
          columns={columns}
          sorting={sorting}
          setSorting={setSorting}
          columnFilters={columnFilters}
          setColumnFilters={setColumnFilters}
          globalFilter={globalFilter}
          setGlobalFilter={setGlobalFilter}
          getRowId={(row) => row._id || row.materialid}
        />
      </div>

      {/* Issue Form Modal */}
      {showIssueForm && selectedRequest && (
        <MaterialIssueForm
          materialId={selectedRequest.materialid}
          materialDescription={`Material ${selectedRequest.materialid}`}
          availableQuantity={selectedRequest.qtyRequested}
          requestData={selectedRequest}
          onClose={() => {
            setShowIssueForm(false);
            setSelectedRequest(null);
          }}
          onSubmit={handleSubmitIssue}
        />
      )}
    </div>
  );
}
