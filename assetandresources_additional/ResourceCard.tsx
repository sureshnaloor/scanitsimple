import React from 'react';
import { User, Settings, MapPin, Clock, Award, DollarSign } from 'lucide-react';

// Local Resource type - no external stores required
interface Resource {
  id: string;
  name: string;
  status: 'available' | 'assigned' | 'maintenance' | 'offline';
  category: string;
  type: 'equipment' | 'manpower';
  location?: string;
  utilization: number;
  hourlyRate: number;
  skills: string[];
  image?: string;
  experience?: number;
}

interface ResourceCardProps {
  resource: Resource;
  type: 'equipment' | 'manpower';
  viewMode: 'grid' | 'list';
  onSelect: (resource: Resource) => void;
  onAssign: (resource: Resource) => void;
}

const ResourceCard: React.FC<ResourceCardProps> = ({
  resource,
  type,
  viewMode,
  onSelect,
  onAssign,
}) => {
  const getStatusColor = (status: Resource['status']) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'assigned':
        return 'bg-blue-100 text-blue-800';
      case 'maintenance':
        return 'bg-orange-100 text-orange-800';
      case 'offline':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getUtilizationColor = (utilization: number) => {
    if (utilization >= 80) return 'text-green-600';
    if (utilization >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (viewMode === 'list') {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
           onClick={() => onSelect(resource)}>
        <div className="flex items-center gap-4">
          {/* Resource Image/Icon */}
          <div className="flex-shrink-0">
            {resource.image ? (
              <img
                src={resource.image}
                alt={resource.name}
                className="w-16 h-16 rounded-lg object-cover"
              />
            ) : (
              <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                {type === 'manpower' ? (
                  <User className="w-8 h-8 text-gray-400" />
                ) : (
                  <Settings className="w-8 h-8 text-gray-400" />
                )}
              </div>
            )}
          </div>

          {/* Resource Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-semibold text-gray-900 truncate">{resource.name}</h3>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(resource.status)}`}>
                {resource.status}
              </span>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
              <span className="flex items-center gap-1">
                {type === 'manpower' ? <User className="w-4 h-4" /> : <Settings className="w-4 h-4" />}
                {resource.category}
              </span>
              {resource.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {resource.location}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span className={getUtilizationColor(resource.utilization)}>
                  {resource.utilization}% utilized
                </span>
              </span>
            </div>

            {/* Skills */}
            <div className="flex flex-wrap gap-1">
              {resource.skills.slice(0, 3).map((skill, index) => (
                <span
                  key={index}
                  className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                >
                  {skill}
                </span>
              ))}
              {resource.skills.length > 3 && (
                <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                  +{resource.skills.length - 3} more
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAssign(resource);
              }}
              className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              disabled={resource.status === 'assigned'}
            >
              {resource.status === 'assigned' ? 'Assigned' : 'Assign'}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelect(resource);
              }}
              className="px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Details
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all cursor-pointer"
         onClick={() => onSelect(resource)}>
      {/* Resource Image */}
      <div className="mb-4">
        {resource.image ? (
          <img
            src={resource.image}
            alt={resource.name}
            className="w-full h-32 rounded-lg object-cover"
          />
        ) : (
          <div className="w-full h-32 bg-gray-200 rounded-lg flex items-center justify-center">
            {type === 'manpower' ? (
              <User className="w-12 h-12 text-gray-400" />
            ) : (
              <Settings className="w-12 h-12 text-gray-400" />
            )}
          </div>
        )}
      </div>

      {/* Resource Info */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900 truncate">{resource.name}</h3>
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(resource.status)}`}>
            {resource.status}
          </span>
        </div>

        <div className="space-y-2 text-sm text-gray-600 mb-3">
          <div className="flex items-center gap-2">
            {type === 'manpower' ? <User className="w-4 h-4" /> : <Settings className="w-4 h-4" />}
            <span>{resource.category}</span>
          </div>
          
          {resource.location && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span>{resource.location}</span>
            </div>
          )}
          
          {resource.experience && (
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4" />
              <span>{resource.experience} years experience</span>
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span className={getUtilizationColor(resource.utilization)}>
              {resource.utilization}% utilized
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            <span>${resource.hourlyRate}/hour</span>
          </div>
        </div>

        {/* Skills */}
        <div className="flex flex-wrap gap-1 mb-4">
          {resource.skills.slice(0, 4).map((skill, index) => (
            <span
              key={index}
              className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
            >
              {skill}
            </span>
          ))}
          {resource.skills.length > 4 && (
            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
              +{resource.skills.length - 4} more
            </span>
          )}
        </div>
      </div>

      {/* Progress Bar for Utilization */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Utilization</span>
          <span className="text-sm text-gray-600">{resource.utilization}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full ${
              resource.utilization >= 80 ? 'bg-green-600' :
              resource.utilization >= 60 ? 'bg-yellow-600' : 'bg-red-600'
            }`}
            style={{ width: `${resource.utilization}%` }}
          ></div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAssign(resource);
          }}
          className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          disabled={resource.status === 'assigned'}
        >
          {resource.status === 'assigned' ? 'Assigned' : 'Assign'}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelect(resource);
          }}
          className="px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Details
        </button>
      </div>
    </div>
  );
};

export default ResourceCard;