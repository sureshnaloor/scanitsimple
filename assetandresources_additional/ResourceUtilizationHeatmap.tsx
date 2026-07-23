import React, { useState } from 'react';
import { Calendar, Clock, Users, TrendingUp } from 'lucide-react';

// Local Resource type - no external stores required
interface Resource {
  id: string;
  name: string;
  category: string;
  utilization: number;
  hourlyRate: number;
  skills: string[];
}

interface DateRange {
  start: Date;
  end: Date;
}

interface ResourceUtilizationHeatmapProps {
  resources: Resource[];
  timeRange: DateRange;
}

function ResourceUtilizationHeatmap({
  resources,
  timeRange,
}: ResourceUtilizationHeatmapProps) {
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [viewMode, setViewMode] = useState<'heatmap' | 'timeline' | 'summary'>('heatmap');
  const [hoveredCell, setHoveredCell] = useState<{ resource: string; date: string; utilization: number } | null>(null);

  // Generate date range for the heatmap
  const generateDateRange = () => {
    const dates: Date[] = [];
    const current = new Date(timeRange.start);
    
    while (current <= timeRange.end) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return dates;
  };

  const dates = generateDateRange();
  const maxUtilization = 100;

  // Generate utilization data for each resource and date
  const generateUtilizationData = (resource: Resource, date: Date) => {
    // Base utilization from resource
    let baseUtilization = resource.utilization;
    
    // Add randomness to simulate daily variations
    const randomFactor = 0.8 + Math.random() * 0.4; // 0.8 to 1.2
    
    // Weekend factor (lower utilization on weekends)
    const dayOfWeek = date.getDay();
    const weekendFactor = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.3 : 1;
    
    // Calculate final utilization
    const utilization = Math.min(100, baseUtilization * randomFactor * weekendFactor);
    
    return Math.round(utilization);
  };

  const getUtilizationColor = (utilization: number) => {
    if (utilization >= 90) return 'bg-red-600';
    if (utilization >= 80) return 'bg-orange-600';
    if (utilization >= 70) return 'bg-yellow-600';
    if (utilization >= 60) return 'bg-green-600';
    if (utilization >= 40) return 'bg-blue-600';
    if (utilization >= 20) return 'bg-indigo-600';
    return 'bg-gray-400';
  };

  const getUtilizationTextColor = (utilization: number) => {
    return utilization > 50 ? 'text-white' : 'text-gray-800';
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatDateFull = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const renderHeatmap = () => (
    <div className="utilization-heatmap">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Resource Utilization Heatmap</h3>
        <p className="text-sm text-gray-600">
          Visual representation of resource utilization over time. Darker colors indicate higher utilization.
        </p>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700">Utilization:</span>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-gray-400 rounded"></div>
              <span className="text-xs text-gray-600">0-20%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-indigo-600 rounded"></div>
              <span className="text-xs text-gray-600">20-40%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-blue-600 rounded"></div>
              <span className="text-xs text-gray-600">40-60%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-green-600 rounded"></div>
              <span className="text-xs text-gray-600">60-70%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-yellow-600 rounded"></div>
              <span className="text-xs text-gray-600">70-80%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-orange-600 rounded"></div>
              <span className="text-xs text-gray-600">80-90%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-red-600 rounded"></div>
              <span className="text-xs text-gray-600">90-100%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* Date Headers */}
          <div className="flex">
            <div className="w-32 h-8 bg-gray-100 border border-gray-200 flex items-center justify-center text-xs font-medium text-gray-700">
              Resource
            </div>
            {dates.map((date, index) => (
              <div
                key={index}
                className="w-12 h-8 bg-gray-100 border border-gray-200 flex items-center justify-center text-xs font-medium text-gray-700"
                title={formatDateFull(date)}
              >
                {formatDate(date)}
              </div>
            ))}
          </div>

          {/* Resource Rows */}
          {resources.slice(0, 20).map((resource, resourceIndex) => (
            <div key={resourceIndex} className="flex">
              <div 
                className="w-32 h-8 bg-white border border-gray-200 flex items-center px-2 text-xs font-medium text-gray-900 cursor-pointer hover:bg-gray-50"
                onClick={() => setSelectedResource(resource)}
                title={resource.name}
              >
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-semibold mr-2">
                  {resource.name.charAt(0)}
                </div>
                <span className="truncate">{resource.name}</span>
              </div>
              {dates.map((date, dateIndex) => {
                const utilization = generateUtilizationData(resource, date);
                return (
                  <div
                    key={dateIndex}
                    className={`w-12 h-8 border border-gray-200 flex items-center justify-center text-xs font-medium cursor-pointer transition-all hover:scale-110 ${
                      getUtilizationColor(utilization)
                    } ${getUtilizationTextColor(utilization)}`}
                    onMouseEnter={() => setHoveredCell({
                      resource: resource.name,
                      date: formatDateFull(date),
                      utilization
                    })}
                    onMouseLeave={() => setHoveredCell(null)}
                    onClick={() => setSelectedResource(resource)}
                    title={`${resource.name} - ${formatDateFull(date)}: ${utilization}% utilization`}
                  >
                    {utilization}%
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Tooltip */}
      {hoveredCell && (
        <div className="fixed z-10 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm pointer-events-none"
          style={{
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)'
          }}
        >
          <div className="font-medium">{hoveredCell.resource}</div>
          <div className="text-gray-300">{hoveredCell.date}</div>
          <div className="text-lg font-bold">{hoveredCell.utilization}%</div>
        </div>
      )}
    </div>
  );

  const renderTimeline = () => (
    <div className="utilization-timeline">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Utilization Timeline</h3>
        <p className="text-sm text-gray-600">
          Timeline view showing resource utilization patterns over the selected period.
        </p>
      </div>

      <div className="space-y-4">
        {resources.slice(0, 10).map((resource, index) => {
          const utilizationData = dates.map(date => ({
            date,
            utilization: generateUtilizationData(resource, date)
          }));

          return (
            <div key={index} className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                    {resource.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{resource.name}</h4>
                    <p className="text-sm text-gray-600">{resource.category}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900">{resource.utilization}%</div>
                  <div className="text-sm text-gray-600">Avg Utilization</div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {utilizationData.map((data, dataIndex) => (
                  <div
                    key={dataIndex}
                    className={`flex-1 h-6 rounded flex items-center justify-center text-xs font-medium ${
                      getUtilizationColor(data.utilization)
                    } ${getUtilizationTextColor(data.utilization)}`}
                    title={`${formatDate(data.date)}: ${data.utilization}%`}
                  >
                    {data.utilization}%
                  </div>
                ))}
              </div>

              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>{formatDate(dates[0])}</span>
                <span>{formatDate(dates[dates.length - 1])}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderSummary = () => {
    const totalUtilization = resources.reduce((sum, resource) => sum + resource.utilization, 0);
    const avgUtilization = totalUtilization / resources.length;
    const highUtilization = resources.filter(r => r.utilization >= 80).length;
    const lowUtilization = resources.filter(r => r.utilization <= 40).length;

    return (
      <div className="utilization-summary">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Utilization Summary</h3>
          <p className="text-sm text-gray-600">
            Key metrics and insights from resource utilization analysis.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{avgUtilization.toFixed(1)}%</div>
            <div className="text-sm text-gray-600">Average Utilization</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{highUtilization}</div>
            <div className="text-sm text-gray-600">High Utilization</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{lowUtilization}</div>
            <div className="text-sm text-gray-600">Low Utilization</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{resources.length}</div>
            <div className="text-sm text-gray-600">Total Resources</div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h4 className="font-semibold text-gray-900 mb-4">Resource Utilization Distribution</h4>
          <div className="space-y-3">
            {resources
              .sort((a, b) => b.utilization - a.utilization)
              .slice(0, 10)
              .map((resource, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                      {resource.name.charAt(0)}
                    </div>
                    <span className="font-medium text-gray-900">{resource.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${getUtilizationColor(resource.utilization)}`}
                        style={{ width: `${resource.utilization}%` }}
                      ></div>
                    </div>
                    <span className={`font-medium ${
                      resource.utilization >= 80 ? 'text-red-600' :
                      resource.utilization >= 60 ? 'text-orange-600' :
                      resource.utilization >= 40 ? 'text-green-600' : 'text-gray-600'
                    }`}>
                      {resource.utilization}%
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h4 className="font-semibold text-gray-900 mb-4">Optimization Opportunities</h4>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium text-gray-900">High Performers</p>
                  <p className="text-sm text-gray-600">
                    {highUtilization} resources with excellent utilization rates.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-orange-600 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium text-gray-900">Underutilized Resources</p>
                  <p className="text-sm text-gray-600">
                    {lowUtilization} resources with potential for increased allocation.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium text-gray-900">Balanced Portfolio</p>
                  <p className="text-sm text-gray-600">
                    Good distribution of utilization across the resource pool.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h4 className="font-semibold text-gray-900 mb-4">Recommendations</h4>
            <div className="space-y-3">
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="font-medium text-green-900 text-sm">Optimize High Performers</p>
                <p className="text-xs text-green-700">
                  Consider these resources for mentoring roles or complex projects.
                </p>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                <p className="font-medium text-orange-900 text-sm">Increase Low Utilization</p>
                <p className="text-xs text-orange-700">
                  Reallocate or provide additional training to improve efficiency.
                </p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="font-medium text-blue-900 text-sm">Monitor Trends</p>
                <p className="text-xs text-blue-700">
                  Track utilization patterns to predict future resource needs.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (resources.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Resources Available</h3>
          <p className="text-gray-600">Add resources to view utilization analysis</p>
        </div>
      </div>
    );
  }

  return (
    <div className="resource-utilization-heatmap">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Resource Utilization Analysis</h1>
            <p className="text-gray-600 mt-1">
              {timeRange.start.toLocaleDateString()} - {timeRange.end.toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('heatmap')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                viewMode === 'heatmap'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Heatmap
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                viewMode === 'timeline'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Timeline
            </button>
            <button
              onClick={() => setViewMode('summary')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                viewMode === 'summary'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Summary
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="utilization-content">
        {viewMode === 'heatmap' && renderHeatmap()}
        {viewMode === 'timeline' && renderTimeline()}
        {viewMode === 'summary' && renderSummary()}
      </div>

      {/* Selected Resource Modal */}
      {selectedResource && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-90vw max-h-90vh overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">{selectedResource.name}</h3>
              <button
                onClick={() => setSelectedResource(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{selectedResource.utilization}%</div>
                  <div className="text-sm text-gray-600">Current Utilization</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">${selectedResource.hourlyRate}</div>
                  <div className="text-sm text-gray-600">Hourly Rate</div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedResource.skills.map((skill, index) => (
                    <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Utilization Trend</h4>
                <div className="flex items-center gap-1">
                  {dates.slice(0, 14).map((date, index) => {
                    const utilization = generateUtilizationData(selectedResource, date);
                    return (
                      <div
                        key={index}
                        className={`flex-1 h-8 rounded flex items-center justify-center text-xs font-medium ${
                          getUtilizationColor(utilization)
                        } ${getUtilizationTextColor(utilization)}`}
                      >
                        {utilization}%
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ResourceUtilizationHeatmap;