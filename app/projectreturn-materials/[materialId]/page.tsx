'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ProjectReturnMaterialData, ProjReturnMaterialRequest, ProjReturnMaterialIssue } from '@/types/projectreturnmaterials';
import AssetQRCode from '@/components/AssetQRCode';
import { Edit, Trash2, Download, Upload, FileText, Package, Send, ClipboardList, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import ProjectReturnMaterialRequestForm from '@/components/ProjectReturnMaterialRequestForm';
import ProjectReturnMaterialIssueForm from '@/components/ProjectReturnMaterialIssueForm';

export default function ProjectReturnMaterialDetailPage() {
  const params = useParams();
  const router = useRouter();
  const materialId = params?.materialId as string;
  
  const [material, setMaterial] = useState<ProjectReturnMaterialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<ProjectReturnMaterialData>>({});
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [showDisposeModal, setShowDisposeModal] = useState(false);
  const [showRequests, setShowRequests] = useState(false);
  const [showIssues, setShowIssues] = useState(false);
  const [requests, setRequests] = useState<ProjReturnMaterialRequest[]>([]);
  const [issues, setIssues] = useState<ProjReturnMaterialIssue[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [loadingIssues, setLoadingIssues] = useState(false);

  useEffect(() => {
    if (materialId) {
      fetchMaterial();
    }
  }, [materialId]);

  // Early return if no materialId
  if (!materialId) {
    return (
      <div className="container mx-auto p-4 min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Invalid Material ID</h1>
          <p className="text-gray-600 dark:text-gray-400">The material ID is missing or invalid.</p>
        </div>
      </div>
    );
  }

  const fetchMaterial = async () => {
    try {
      const response = await fetch(`/api/projectreturn-materials/${materialId}`);
      if (!response.ok) throw new Error('Failed to fetch material');
      const data = await response.json();
      setMaterial(data);
      setFormData(data);
    } catch (error) {
      console.error('Error fetching material:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      const response = await fetch(`/api/projectreturn-materials/${materialId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to update material');
      
      // Redirect back to the main list page after successful update
      router.push('/projectreturn-materials');
    } catch (error) {
      console.error('Error updating material:', error);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this material?')) return;
    
    try {
      const response = await fetch(`/api/projectreturn-materials/${materialId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete material');
      
      window.location.href = '/projectreturn-materials';
    } catch (error) {
      console.error('Error deleting material:', error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const formData = new FormData();
    formData.append('file', file);

    try {
      // Here you would typically upload to a file storage service
      // For now, we'll just add the filename to the testDocs array
      const newTestDocs = [...(material?.testDocs || []), file.name];
      
      const response = await fetch(`/api/projectreturn-materials/${materialId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ testDocs: newTestDocs }),
      });

      if (!response.ok) throw new Error('Failed to upload file');
      
      await fetchMaterial();
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  const handleSubmitRequest = async (requestData: any) => {
    try {
      const response = await fetch('/api/projectreturn-materials/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) throw new Error('Failed to submit request');
      
      await fetchMaterial();
      setShowRequestForm(false);
      alert('Request submitted successfully');
    } catch (error) {
      console.error('Error submitting request:', error);
      alert('Failed to submit request');
    }
  };

  const handleSubmitIssue = async (issueData: any) => {
    try {
      const response = await fetch('/api/projectreturn-materials/issues', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(issueData),
      });

      if (!response.ok) throw new Error('Failed to issue material');
      
      await fetchMaterial();
      setShowIssueForm(false);
      alert('Material issued successfully');
    } catch (error) {
      console.error('Error issuing material:', error);
      alert('Failed to issue material');
    }
  };

  const handleDisposeMaterial = () => {
    setShowDisposeModal(true);
  };

  const handleConfirmDispose = async () => {
    if (!material) return;
    
    try {
      const response = await fetch(`/api/projectreturn-materials/${material.materialid}/dispose`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to dispose material');
      
      alert('Material disposed successfully and moved to scrap');
      // Redirect back to the main list page after successful disposal
      router.push('/projectreturn-materials');
    } catch (error) {
      console.error('Error disposing material:', error);
      alert('Failed to dispose material');
    }
  };

  const fetchRequests = async () => {
    if (!materialId) return;
    
    setLoadingRequests(true);
    try {
      const response = await fetch(`/api/projectreturn-materials/requests?materialId=${materialId}`);
      if (!response.ok) throw new Error('Failed to fetch requests');
      const data = await response.json();
      setRequests(data);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoadingRequests(false);
    }
  };

  const fetchIssues = async () => {
    if (!materialId) return;
    
    setLoadingIssues(true);
    try {
      const response = await fetch(`/api/projectreturn-materials/issues?materialId=${materialId}`);
      if (!response.ok) throw new Error('Failed to fetch issues');
      const data = await response.json();
      setIssues(data);
    } catch (error) {
      console.error('Error fetching issues:', error);
    } finally {
      setLoadingIssues(false);
    }
  };

  const handleToggleRequests = () => {
    if (!showRequests && requests.length === 0) {
      fetchRequests();
    }
    setShowRequests(!showRequests);
  };

  const handleToggleIssues = () => {
    if (!showIssues && issues.length === 0) {
      fetchIssues();
    }
    setShowIssues(!showIssues);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!material) {
    return (
      <div className="container mx-auto p-4 min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Material Not Found</h1>
          <p className="text-gray-600 dark:text-gray-400">The requested project return material could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          {/* Title and Description */}
          <div className="mb-4">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1">
              Project Return Material: {material.materialid}
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              {material.materialDescription}
            </p>
          </div>
          
          {/* Action Icons */}
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <Link
              href="/projectreturn-materials/requests"
              className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors group relative"
              title="Requests Pending"
            >
              <ClipboardList className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs sm:text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                Requests Pending
              </span>
            </Link>
            <button
              onClick={() => setShowRequestForm(true)}
              className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors group relative"
              title="Request Material"
            >
              <Send className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs sm:text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                Request
              </span>
            </button>
            <button
              onClick={() => setShowIssueForm(true)}
              className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors group relative"
              title="Issue Material"
            >
              <Package className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs sm:text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                Issue
              </span>
            </button>
            <button
              onClick={() => setEditing(!editing)}
              className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors group relative"
              title={editing ? 'Cancel Edit' : 'Edit Material'}
            >
              <Edit className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs sm:text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                {editing ? 'Cancel' : 'Edit'}
              </span>
            </button>
            <button
              onClick={handleDelete}
              className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors group relative"
              title="Delete Material"
            >
              <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs sm:text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                Delete
              </span>
            </button>
            {material && (() => {
              const balanceQuantity = material.quantity - (material.pendingRequests || 0);
              return balanceQuantity > 0 && (
                <button
                  onClick={handleDisposeMaterial}
                  className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors group relative"
                  title="Dispose Material"
                >
                  <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs sm:text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    Dispose
                  </span>
                </button>
              );
            })()}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Basic Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Material ID
                  </label>
                  <input
                    type="text"
                    value={material.materialid}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Material Code
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      value={formData.materialCode || ''}
                      onChange={(e) => setFormData({ ...formData, materialCode: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  ) : (
                    <p className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">
                      {material.materialCode}
                    </p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Material Description
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      value={formData.materialDescription || ''}
                      onChange={(e) => setFormData({ ...formData, materialDescription: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  ) : (
                    <p className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">
                      {material.materialDescription}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    UOM
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      value={formData.uom || ''}
                      onChange={(e) => setFormData({ ...formData, uom: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  ) : (
                    <p className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">
                      {material.uom}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Available Quantity
                  </label>
                  {editing ? (
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.quantity || 0}
                      onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  ) : (
                    <p className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">
                      {material.quantity.toLocaleString()}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Pending Requests
                  </label>
                  <p className="px-3 py-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-orange-800 dark:text-orange-200">
                    {(material.pendingRequests || 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Source Information */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Source Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Source Project
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      value={formData.sourceProject || ''}
                      onChange={(e) => setFormData({ ...formData, sourceProject: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  ) : (
                    <p className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">
                      {material.sourceProject}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Source PO Number
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      value={formData.sourcePONumber || ''}
                      onChange={(e) => setFormData({ ...formData, sourcePONumber: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  ) : (
                    <p className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">
                      {material.sourcePONumber}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Source Issue Number
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      value={formData.sourceIssueNumber || ''}
                      onChange={(e) => setFormData({ ...formData, sourceIssueNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  ) : (
                    <p className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">
                      {material.sourceIssueNumber}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Source Unit Rate
                  </label>
                  {editing ? (
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.sourceUnitRate || 0}
                      onChange={(e) => setFormData({ ...formData, sourceUnitRate: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  ) : (
                    <p className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'SAR'
                      }).format(material.sourceUnitRate)}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Warehouse Information */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Warehouse Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Warehouse Location
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      value={formData.warehouseLocation || ''}
                      onChange={(e) => setFormData({ ...formData, warehouseLocation: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  ) : (
                    <p className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">
                      {material.warehouseLocation || 'Not specified'}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Yard/Room/Rack-Bin
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      value={formData.yardRoomRackBin || ''}
                      onChange={(e) => setFormData({ ...formData, yardRoomRackBin: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  ) : (
                    <p className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">
                      {material.yardRoomRackBin || 'Not specified'}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Received in Warehouse Date
                  </label>
                  {editing ? (
                    <input
                      type="date"
                      value={formData.receivedInWarehouseDate ? new Date(formData.receivedInWarehouseDate).toISOString().split('T')[0] : ''}
                      onChange={(e) => setFormData({ ...formData, receivedInWarehouseDate: e.target.value ? new Date(e.target.value) : undefined })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  ) : (
                    <p className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">
                      {material.receivedInWarehouseDate ? new Date(material.receivedInWarehouseDate).toLocaleDateString() : 'Not specified'}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Consignment Note Number
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      value={formData.consignmentNoteNumber || ''}
                      onChange={(e) => setFormData({ ...formData, consignmentNoteNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  ) : (
                    <p className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">
                      {material.consignmentNoteNumber || 'Not specified'}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Test Documents */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Test Documents</h2>
                <label className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer">
                  <Upload className="h-4 w-4" />
                  Upload Document
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
              {material.testDocs && material.testDocs.length > 0 ? (
                <div className="space-y-2">
                  {material.testDocs.map((doc, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-900 dark:text-white">{doc}</span>
                      </div>
                      <button className="text-blue-600 hover:text-blue-800">
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">No test documents uploaded</p>
              )}
            </div>

            {/* Remarks */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Remarks</h2>
              {editing ? (
                <textarea
                  value={formData.remarks || ''}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              ) : (
                <p className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white min-h-[100px]">
                  {material.remarks || 'No remarks'}
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Material History</h2>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleToggleRequests}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  {showRequests ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {showRequests ? 'Hide Requests' : 'View Requests'}
                  {requests.length > 0 && (
                    <span className="bg-purple-500 text-white text-xs px-2 py-1 rounded-full">
                      {requests.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={handleToggleIssues}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  {showIssues ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {showIssues ? 'Hide Issues' : 'View Issues'}
                  {issues.length > 0 && (
                    <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                      {issues.length}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Requests Section */}
            {showRequests && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Material Requests</h2>
                {loadingRequests ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
                  </div>
                ) : requests.length > 0 ? (
                  <div className="space-y-4">
                    {requests.map((request) => (
                      <div key={request._id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Project Name
                            </label>
                            <p className="text-sm text-gray-900 dark:text-white">{request.projectName}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Requestor
                            </label>
                            <p className="text-sm text-gray-900 dark:text-white">{request.requestor}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Quantity Requested
                            </label>
                            <p className="text-sm text-gray-900 dark:text-white">{request.qtyRequested}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Status
                            </label>
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              request.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300' :
                              request.status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' :
                              request.status === 'issued' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300' :
                              'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                            }`}>
                              {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                            </span>
                          </div>
                          <div className="md:col-span-2 lg:col-span-3">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Request Date
                            </label>
                            <p className="text-sm text-gray-900 dark:text-white">
                              {new Date(request.requestDate).toLocaleString()}
                            </p>
                          </div>
                          {request.remarks && (
                            <div className="md:col-span-2 lg:col-span-3">
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Remarks
                              </label>
                              <p className="text-sm text-gray-900 dark:text-white">{request.remarks}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">No requests found for this material</p>
                )}
              </div>
            )}

            {/* Issues Section */}
            {showIssues && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Material Issues</h2>
                {loadingIssues ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
                  </div>
                ) : issues.length > 0 ? (
                  <div className="space-y-4">
                    {issues.map((issue) => (
                      <div key={issue._id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Project Name
                            </label>
                            <p className="text-sm text-gray-900 dark:text-white">{issue.projectName}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Requestor
                            </label>
                            <p className="text-sm text-gray-900 dark:text-white">{issue.requestor}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Issuer
                            </label>
                            <p className="text-sm text-gray-900 dark:text-white">{issue.issuerName}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Quantity Issued
                            </label>
                            <p className="text-sm text-gray-900 dark:text-white">{issue.issueQuantity}</p>
                          </div>
                          <div className="md:col-span-2 lg:col-span-3">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Issue Date
                            </label>
                            <p className="text-sm text-gray-900 dark:text-white">
                              {new Date(issue.issueDate).toLocaleString()}
                            </p>
                          </div>
                          {issue.remarks && (
                            <div className="md:col-span-2 lg:col-span-3">
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Remarks
                              </label>
                              <p className="text-sm text-gray-900 dark:text-white">{issue.remarks}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">No issues found for this material</p>
                )}
              </div>
            )}

            {/* Save Button */}
            {editing && (
              <div className="flex justify-end">
                <button
                  onClick={handleUpdate}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* QR Code */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">QR Code</h2>
              <div className="flex justify-center">
                <AssetQRCode 
                  assetNumber={material.materialid} 
                  assetDescription={material.materialDescription}
                  assetType="Project Return Material" 
                />
              </div>
            </div>

            {/* Metadata */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Metadata</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Created At
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {material.createdAt ? new Date(material.createdAt).toLocaleString() : 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Updated At
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {material.updatedAt ? new Date(material.updatedAt).toLocaleString() : 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Created By
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {material.createdBy || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Request Form Modal */}
      {showRequestForm && material && (
        <ProjectReturnMaterialRequestForm
          materialId={material.materialid}
          materialDescription={material.materialDescription}
          availableQuantity={material.quantity}
          onClose={() => setShowRequestForm(false)}
          onSubmit={handleSubmitRequest}
        />
      )}

      {/* Issue Form Modal */}
      {showIssueForm && material && (
        <ProjectReturnMaterialIssueForm
          materialId={material.materialid}
          materialDescription={material.materialDescription}
          availableQuantity={material.quantity}
          onClose={() => setShowIssueForm(false)}
          onSubmit={handleSubmitIssue}
        />
      )}

      {/* Dispose Material Modal */}
      {showDisposeModal && material && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-red-500" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Dispose Material</h2>
            </div>
            
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
              <p className="text-red-800 dark:text-red-200 font-medium">
                ⚠️ This action is irreversible and will move the material to scrap status.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Material Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Material ID
                  </label>
                  <p className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">
                    {material.materialid}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Material Code
                  </label>
                  <p className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">
                    {material.materialCode}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <p className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">
                    {material.materialDescription}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Unit of Measure
                  </label>
                  <p className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">
                    {material.uom}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Current Quantity
                  </label>
                  <p className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">
                    {material.quantity.toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Current Value
                  </label>
                  <p className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white font-semibold">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'SAR'
                    }).format((material.quantity || 0) * (material.sourceUnitRate || 0))}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowDisposeModal(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDispose}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
              >
                <AlertTriangle className="h-4 w-4" />
                Dispose Material
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

