'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  AlertTriangle, 
  Calendar, 
  User, 
  Package, 
  Building, 
  MapPin, 
  FileText,
  ArrowLeft,
  QrCode,
  Trash2,
  DollarSign
} from 'lucide-react';
import Link from 'next/link';
import { DisposedMaterial } from '@/types/projectreturnmaterials';

export default function DisposedMaterialDetailPage() {
  const params = useParams();
  const router = useRouter();
  const materialId = params?.materialId as string;
  
  const [material, setMaterial] = useState<DisposedMaterial | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (materialId) {
      fetchDisposedMaterial();
    }
  }, [materialId]);

  const fetchDisposedMaterial = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/disposed-materials/${materialId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Disposed material not found');
        } else {
          throw new Error('Failed to fetch disposed material');
        }
        return;
      }
      
      const data = await response.json();
      setMaterial(data);
    } catch (error) {
      console.error('Error fetching disposed material:', error);
      setError('Failed to load disposed material');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500 dark:text-gray-400">Loading disposed material...</div>
        </div>
      </div>
    );
  }

  if (error || !material) {
    return (
      <div className="container mx-auto p-4 min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {error || 'Disposed Material Not Found'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {error || 'The disposed material you are looking for does not exist.'}
            </p>
            <Link
              href="/disposed-materials"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Disposed Materials
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Link
            href="/disposed-materials"
            className="flex items-center gap-2 px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Disposed Materials
          </Link>
        </div>
        
        <div className="flex items-center gap-3 mb-2">
          <AlertTriangle className="h-8 w-8 text-red-500" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Disposed Material Details
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Material ID: <span className="font-mono text-blue-600 dark:text-blue-400">{material.materialid}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Material Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <Package className="h-6 w-6 text-blue-500" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Material Information
                </h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Material ID
                  </label>
                  <p className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white font-mono">
                    {material.materialid}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Material Code
                  </label>
                  <p className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">
                    {material.materialCode}
                  </p>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <p className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">
                    {material.materialDescription}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Unit of Measure
                  </label>
                  <p className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">
                    {material.uom}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Disposed Quantity
                  </label>
                  <p className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white font-semibold">
                    {material.disposedQuantity.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Financial Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <DollarSign className="h-6 w-6 text-green-500" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Financial Information
                </h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Unit Rate
                  </label>
                  <p className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'SAR'
                    }).format(material.sourceUnitRate)}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Disposed Value
                  </label>
                  <p className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg font-semibold text-red-600 dark:text-red-400">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'SAR'
                    }).format(material.disposedValue)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Project Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <Building className="h-6 w-6 text-purple-500" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Project Information
                </h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Source Project
                  </label>
                  <p className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">
                    {material.sourceProject}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Source WBS
                  </label>
                  <p className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">
                    {material.sourceWBS}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Source PO Number
                  </label>
                  <p className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">
                    {material.sourcePONumber}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Source Issue Number
                  </label>
                  <p className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">
                    {material.sourceIssueNumber}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Location Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <MapPin className="h-6 w-6 text-orange-500" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Location Information
                </h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Warehouse Location
                  </label>
                  <p className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">
                    {material.warehouseLocation}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Yard/Room/Rack/Bin
                  </label>
                  <p className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">
                    {material.yardRoomRackBin}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="h-6 w-6 text-red-500" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Status
                </h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Current Status
                  </label>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {material.status.toUpperCase()}
                  </span>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Disposed By
                  </label>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-900 dark:text-white">
                      {material.disposedBy}
                    </span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Disposed Date
                  </label>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-900 dark:text-white">
                      {new Date(material.disposedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* QR Code Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <QrCode className="h-6 w-6 text-blue-500" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  QR Code
                </h3>
              </div>
              
              <div className="text-center">
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 mb-4">
                  <div className="w-32 h-32 mx-auto bg-white dark:bg-gray-600 rounded flex items-center justify-center">
                    <QrCode className="h-16 w-16 text-gray-400" />
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Scan to view material details
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 font-mono">
                  ID: {material.materialid}
                </p>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          {material.remarks && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <FileText className="h-6 w-6 text-gray-500" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Remarks
                  </h3>
                </div>
                
                <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                  {material.remarks}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
