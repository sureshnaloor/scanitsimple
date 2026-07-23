import React from 'react';
import { Filter, Search, Users, Settings } from 'lucide-react';

// Local Filters type - no external stores required
interface Filters {
  type: string;
  status: string;
  availability: string;
  department?: string;
  location?: string;
  skills?: string[];
}

interface ResourceFiltersProps {
  filters: Filters;
  onFilterChange: (filters: Partial<Filters>) => void;
}

const ResourceFilters: React.FC<ResourceFiltersProps> = ({
  filters,
  onFilterChange,
}) => {
  const resourceTypes = ['all', 'equipment', 'manpower'];
  const resourceStatuses = ['all', 'available', 'assigned', 'maintenance', 'offline'];
  const departments = ['all', 'Engineering', 'Operations', 'Management', 'Quality', 'Support'];
  const locations = ['all', 'Site A', 'Site B', 'Warehouse', 'Maintenance Bay', 'Headquarters'];

  const skillOptions = [
    'Project Management',
    'Technical Skills',
    'Quality Assurance',
    'Team Leadership',
    'Software Development',
    'System Administration',
    'Cybersecurity',
    'Cloud Computing',
    'Safety Protocols',
    'Equipment Operation',
    'Data Analysis',
    'Process Optimization',
  ];

  return (
    <div className="resource-filters space-y-4">
      {/* Resource Type Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Resource Type
        </label>
        <select
          value={filters.type}
          onChange={(e) => onFilterChange({ type: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {resourceTypes.map((type) => (
            <option key={type} value={type}>
              {type === 'all' ? 'All Types' : type.charAt(0).toUpperCase() + type.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Status Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Status
        </label>
        <select
          value={filters.status}
          onChange={(e) => onFilterChange({ status: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {resourceStatuses.map((status) => (
            <option key={status} value={status}>
              {status === 'all' ? 'All Statuses' : status.charAt(0).toUpperCase() + status.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Availability Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Availability
        </label>
        <select
          value={filters.availability}
          onChange={(e) => onFilterChange({ availability: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Resources</option>
          <option value="available">Available Only</option>
          <option value="assigned">Assigned Only</option>
        </select>
      </div>

      {/* Department Filter (for manpower) */}
      {filters.type === 'manpower' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Department
          </label>
          <select
            value={filters.department || 'all'}
            onChange={(e) => onFilterChange({ department: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept === 'all' ? 'All Departments' : dept}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Location Filter (for equipment) */}
      {filters.type === 'equipment' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Location
          </label>
          <select
            value={filters.location || 'all'}
            onChange={(e) => onFilterChange({ location: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {locations.map((location) => (
              <option key={location} value={location}>
                {location === 'all' ? 'All Locations' : location}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Skills Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Skills
        </label>
        <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-2">
          {skillOptions.map((skill) => (
            <label key={skill} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.skills?.includes(skill) || false}
                onChange={(e) => {
                  const currentSkills = filters.skills || [];
                  const newSkills = e.target.checked
                    ? [...currentSkills, skill]
                    : currentSkills.filter((s) => s !== skill);
                  onFilterChange({ skills: newSkills });
                }}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{skill}</span>
            </label>
          ))}
        </div>
        {filters.skills && filters.skills.length > 0 && (
          <div className="mt-2">
            <button
              onClick={() => onFilterChange({ skills: [] })}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Clear all skills
            </button>
          </div>
        )}
      </div>

      {/* Clear Filters */}
      <div className="pt-4 border-t border-gray-200">
        <button
          onClick={() => {
            onFilterChange({
              type: 'all',
              status: 'all',
              availability: 'all',
              department: 'all',
              location: 'all',
              skills: [],
            });
          }}
          className="w-full px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Clear All Filters
        </button>
      </div>
    </div>
  );
};

export default ResourceFilters;