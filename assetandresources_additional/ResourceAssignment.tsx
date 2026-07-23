import React, { useState, useEffect } from 'react';
import { Calendar, User, Target, Clock, DollarSign, AlertCircle } from 'lucide-react';

// Local types – no external stores required
interface Resource {
  id: string;
  name: string;
  category: string;
  type: string;
  utilization: number;
  hourlyRate: number;
  currentProject?: string;
}

interface Project {
  id: string;
  name: string;
  status: 'active' | 'planning' | 'completed' | string;
  description: string;
  manager: string;
  progress: number;
  budget: number;
  requiredSkills: string[];
}

interface ResourceAssignmentProps {
  selectedResource: Resource | null;
  projects: Project[];
  onProjectSelect: (projectId: string) => void;
}

const ResourceAssignment: React.FC<ResourceAssignmentProps> = ({
  selectedResource,
  projects,
  onProjectSelect,
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [assignmentDetails, setAssignmentDetails] = useState({
    startDate: '',
    endDate: '',
    allocation: 100,
    role: '',
    hourlyRate: selectedResource?.hourlyRate || 0,
  });
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);

  useEffect(() => {
    if (selectedResource) {
      setAssignmentDetails(prev => ({
        ...prev,
        hourlyRate: selectedResource.hourlyRate,
      }));
    }
  }, [selectedResource]);

  const handleProjectSelect = (projectId: string) => {
    setSelectedProjectId(projectId);
    onProjectSelect(projectId);
    setShowAssignmentForm(true);
  };

  const handleAssignmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle assignment submission
    console.log('Assignment submitted:', {
      resource: selectedResource?.name,
      project: selectedProjectId,
      ...assignmentDetails,
    });
  };

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  if (!selectedResource) {
    return (
      <div className="text-center py-8">
        <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Resource Selected</h3>
        <p className="text-gray-600">Select a resource to view assignment options</p>
      </div>
    );
  }

  return (
    <div className="resource-assignment">
      {/* Resource Info */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
            {selectedResource.name.charAt(0)}
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">{selectedResource.name}</h4>
            <p className="text-sm text-gray-600">
              {selectedResource.category} • {selectedResource.type}
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">Utilization:</span>
            <span className={`font-medium ${
              selectedResource.utilization >= 80 ? 'text-green-600' :
              selectedResource.utilization >= 60 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {selectedResource.utilization}%
            </span>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">Rate:</span>
            <span className="font-medium text-gray-900">
              ${selectedResource.hourlyRate}/hr
            </span>
          </div>
        </div>
      </div>

      {/* Current Assignment */}
      {selectedResource.currentProject && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5 text-blue-600" />
            <h5 className="font-semibold text-blue-900">Currently Assigned</h5>
          </div>
          <p className="text-sm text-blue-800">
            This resource is currently assigned to project: {selectedResource.currentProject}
          </p>
        </div>
      )}

      {/* Project Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Project
        </label>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {projects.map((project) => (
            <div
              key={project.id}
              onClick={() => handleProjectSelect(project.id)}
              className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                selectedProjectId === project.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <h5 className="font-medium text-gray-900">{project.name}</h5>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  project.status === 'active' ? 'bg-green-100 text-green-800' :
                  project.status === 'planning' ? 'bg-blue-100 text-blue-800' :
                  project.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {project.status}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-2">{project.description}</p>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>Manager: {project.manager}</span>
                <span>Progress: {project.progress}%</span>
                <span>Budget: ${(project.budget / 1000).toFixed(0)}K</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {project.requiredSkills.slice(0, 3).map((skill, index) => (
                  <span key={index} className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Assignment Form */}
      {showAssignmentForm && selectedProject && (
        <div className="assignment-form">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-blue-600" />
            <h4 className="font-semibold text-gray-900">Assignment Details</h4>
          </div>

          <form onSubmit={handleAssignmentSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={assignmentDetails.startDate}
                  onChange={(e) => setAssignmentDetails(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={assignmentDetails.endDate}
                  onChange={(e) => setAssignmentDetails(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Allocation (%)
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={assignmentDetails.allocation}
                  onChange={(e) => setAssignmentDetails(prev => ({ ...prev, allocation: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={assignmentDetails.role}
                  onChange={(e) => setAssignmentDetails(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Role</option>
                  <option value="Lead">Lead</option>
                  <option value="Support">Support</option>
                  <option value="Consultant">Consultant</option>
                  <option value="Technical Expert">Technical Expert</option>
                  <option value="Coordinator">Coordinator</option>
                  <option value="Analyst">Analyst</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hourly Rate ($)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={assignmentDetails.hourlyRate}
                onChange={(e) => setAssignmentDetails(prev => ({ ...prev, hourlyRate: parseFloat(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Assign Resource
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAssignmentForm(false);
                  setSelectedProjectId('');
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>

          {/* Assignment Summary */}
          {assignmentDetails.startDate && assignmentDetails.endDate && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h5 className="font-medium text-gray-900 mb-3">Assignment Summary</h5>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Resource:</span>
                  <span className="font-medium">{selectedResource.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Project:</span>
                  <span className="font-medium">{selectedProject.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-medium">
                    {new Date(assignmentDetails.startDate).toLocaleDateString()} - 
                    {new Date(assignmentDetails.endDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Allocation:</span>
                  <span className="font-medium">{assignmentDetails.allocation}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Role:</span>
                  <span className="font-medium">{assignmentDetails.role || 'TBD'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Hourly Rate:</span>
                  <span className="font-medium">${assignmentDetails.hourlyRate}/hr</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* No Project Selected */}
      {!selectedProjectId && (
        <div className="text-center py-8">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-semibold text-gray-900 mb-2">Select a Project</h4>
          <p className="text-gray-600">Choose a project from the list above to assign this resource</p>
        </div>
      )}
    </div>
  );
};

export default ResourceAssignment;