import React, { useState, useMemo } from 'react';
import { AlertCircle, TrendingUp, Users, Target, Activity } from 'lucide-react';

interface GapData {
  skill: string;
  demand: number;
  supply: number;
  gap: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  affectedProjects: number;
  recommendedActions: string[];
}

interface ResourceGapAnalysisProps {
  gaps: GapData[];
}

const ResourceGapAnalysis: React.FC<ResourceGapAnalysisProps> = ({ gaps }) => {
  const [selectedGap, setSelectedGap] = useState<GapData | null>(null);
  const [viewMode, setViewMode] = useState<'overview' | 'detailed' | 'recommendations'>('overview');

  const severityColors = {
    low: 'bg-green-100 text-green-800 border-green-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    high: 'bg-orange-100 text-orange-800 border-orange-200',
    critical: 'bg-red-100 text-red-800 border-red-200',
  };

  const severityIcons = {
    low: Activity,
    medium: TrendingUp,
    high: AlertCircle,
    critical: AlertCircle,
  };

  const getSeverityColor = (severity: string) => {
    return severityColors[severity as keyof typeof severityColors] || severityColors.medium;
  };

  const getSeverityIcon = (severity: string) => {
    return severityIcons[severity as keyof typeof severityIcons] || AlertCircle;
  };

  const sortedGaps = useMemo(() => {
    return [...gaps].sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }, [gaps]);

  const renderOverview = () => (
    <div className="gap-overview">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Total Gaps</h3>
            <AlertCircle className="w-5 h-5 text-red-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{gaps.length}</p>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Critical</h3>
            <AlertCircle className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-2xl font-bold text-red-600">
            {gaps.filter(g => g.severity === 'critical').length}
          </p>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">High Priority</h3>
            <AlertCircle className="w-5 h-5 text-orange-500" />
          </div>
          <p className="text-2xl font-bold text-orange-600">
            {gaps.filter(g => g.severity === 'high').length}
          </p>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Projects Affected</h3>
            <Target className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-blue-600">
            {gaps.reduce((sum, gap) => sum + gap.affectedProjects, 0)}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {sortedGaps.slice(0, 6).map((gap, index) => {
          const IconComponent = getSeverityIcon(gap.severity);
          return (
            <div
              key={index}
              className="bg-white rounded-lg border border-gray-200 p-4 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedGap(gap)}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <IconComponent className={`w-5 h-5 ${
                    gap.severity === 'critical' ? 'text-red-500' :
                    gap.severity === 'high' ? 'text-orange-500' :
                    gap.severity === 'medium' ? 'text-yellow-500' : 'text-green-500'
                  }`} />
                  <h4 className="font-semibold text-gray-900">{gap.skill}</h4>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(gap.severity)}`}>
                  {gap.severity.toUpperCase()}
                </span>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mb-3">
                <div>
                  <div className="text-lg font-bold text-gray-900">{gap.demand}</div>
                  <div className="text-xs text-gray-600">Demand</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-gray-900">{gap.supply}</div>
                  <div className="text-xs text-gray-600">Supply</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-red-600">{gap.gap}</div>
                  <div className="text-xs text-gray-600">Gap</div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  Affects {gap.affectedProjects} projects
                </span>
                <span className="text-sm text-blue-600 hover:text-blue-800">
                  View Details →
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderDetailed = () => (
    <div className="gap-detailed">
      {sortedGaps.map((gap, index) => {
        const IconComponent = getSeverityIcon(gap.severity);
        return (
          <div key={index} className="bg-white rounded-lg border border-gray-200 p-6 mb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <IconComponent className={`w-6 h-6 ${
                  gap.severity === 'critical' ? 'text-red-500' :
                  gap.severity === 'high' ? 'text-orange-500' :
                  gap.severity === 'medium' ? 'text-yellow-500' : 'text-green-500'
                }`} />
                <h3 className="text-lg font-semibold text-gray-900">{gap.skill}</h3>
              </div>
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${getSeverityColor(gap.severity)}`}>
                {gap.severity.toUpperCase()}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{gap.demand}</div>
                <div className="text-sm text-gray-600">Demand</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{gap.supply}</div>
                <div className="text-sm text-gray-600">Supply</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{gap.gap}</div>
                <div className="text-sm text-gray-600">Gap</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{gap.affectedProjects}</div>
                <div className="text-sm text-gray-600">Projects</div>
              </div>
            </div>

            <div className="mb-4">
              <h4 className="font-medium text-gray-900 mb-2">Gap Analysis</h4>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                <div 
                  className={`h-3 rounded-full ${
                    gap.severity === 'critical' ? 'bg-red-600' :
                    gap.severity === 'high' ? 'bg-orange-600' :
                    gap.severity === 'medium' ? 'bg-yellow-600' : 'bg-green-600'
                  }`}
                  style={{ width: `${Math.min((gap.gap / gap.demand) * 100, 100)}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Supply: {gap.supply}</span>
                <span>Demand: {gap.demand}</span>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">Recommended Actions</h4>
              <div className="space-y-2">
                {gap.recommendedActions.map((action, actionIndex) => (
                  <div key={actionIndex} className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span className="text-sm text-gray-700">{action}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderRecommendations = () => (
    <div className="gap-recommendations">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Strategic Recommendations</h3>
        <p className="text-gray-600">
          Based on the identified skill gaps, here are our recommended actions to optimize your resource pool.
        </p>
      </div>

      <div className="space-y-6">
        {/* Immediate Actions */}
        <div className="bg-red-50 rounded-lg p-6 border border-red-200">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-6 h-6 text-red-600" />
            <h4 className="text-lg font-semibold text-red-900">Immediate Actions Required</h4>
          </div>
          <div className="space-y-3">
            {gaps
              .filter(g => g.severity === 'critical')
              .map((gap, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-red-600 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium text-red-900">{gap.skill}</p>
                    <p className="text-sm text-red-700">
                      Critical shortage affecting {gap.affectedProjects} projects. 
                      Consider immediate hiring or contractor engagement.
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Medium-term Actions */}
        <div className="bg-orange-50 rounded-lg p-6 border border-orange-200">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-6 h-6 text-orange-600" />
            <h4 className="text-lg font-semibold text-orange-900">Medium-term Planning</h4>
          </div>
          <div className="space-y-3">
            {gaps
              .filter(g => g.severity === 'high')
              .map((gap, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-orange-600 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium text-orange-900">{gap.skill}</p>
                    <p className="text-sm text-orange-700">
                      High demand with insufficient supply. 
                      Plan training programs or strategic hiring within 3-6 months.
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Training Programs */}
        <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-6 h-6 text-blue-600" />
            <h4 className="text-lg font-semibold text-blue-900">Training & Development</h4>
          </div>
          <div className="space-y-3">
            <p className="text-sm text-blue-800">
              Implement cross-training programs to develop internal talent and reduce dependency on external hiring.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-4">
                <h5 className="font-medium text-blue-900 mb-2">Internal Training</h5>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Mentorship programs</li>
                  <li>• Skill certification courses</li>
                  <li>• Cross-functional training</li>
                  <li>• Knowledge sharing sessions</li>
                </ul>
              </div>
              <div className="bg-white rounded-lg p-4">
                <h5 className="font-medium text-blue-900 mb-2">External Training</h5>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Professional certifications</li>
                  <li>• Industry conferences</li>
                  <li>• Online learning platforms</li>
                  <li>• Vendor-specific training</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Resource Optimization */}
        <div className="bg-green-50 rounded-lg p-6 border border-green-200">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-6 h-6 text-green-600" />
            <h4 className="text-lg font-semibold text-green-900">Resource Optimization</h4>
          </div>
          <div className="space-y-3">
            <p className="text-sm text-green-800">
              Optimize current resource allocation to maximize efficiency and reduce skill gaps.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-4">
                <h5 className="font-medium text-green-900 mb-2">Reallocation</h5>
                <p className="text-sm text-green-700">
                  Redistribute resources based on project priorities and skill requirements.
                </p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <h5 className="font-medium text-green-900 mb-2">Utilization</h5>
                <p className="text-sm text-green-700">
                  Improve resource utilization through better planning and scheduling.
                </p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <h5 className="font-medium text-green-900 mb-2">Efficiency</h5>
                <p className="text-sm text-green-700">
                  Implement process improvements to increase individual productivity.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Plan */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">30-60-90 Day Action Plan</h4>
          <div className="space-y-4">
            <div>
              <h5 className="font-medium text-gray-900 mb-2">Next 30 Days</h5>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Assess current resource allocation</li>
                <li>• Identify immediate reallocation opportunities</li>
                <li>• Initiate hiring process for critical skills</li>
                <li>• Begin training program development</li>
              </ul>
            </div>
            <div>
              <h5 className="font-medium text-gray-900 mb-2">Next 60 Days</h5>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Launch internal training programs</li>
                <li>• Complete first round of hiring</li>
                <li>• Implement resource optimization tools</li>
                <li>• Establish skill tracking system</li>
              </ul>
            </div>
            <div>
              <h5 className="font-medium text-gray-900 mb-2">Next 90 Days</h5>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Evaluate training program effectiveness</li>
                <li>• Complete major hiring initiatives</li>
                <li>• Optimize resource allocation strategies</li>
                <li>• Plan for future skill requirements</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="resource-gap-analysis">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Resource Gap Analysis</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('overview')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                viewMode === 'overview'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setViewMode('detailed')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                viewMode === 'detailed'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Detailed
            </button>
            <button
              onClick={() => setViewMode('recommendations')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                viewMode === 'recommendations'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Recommendations
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="gap-content">
        {viewMode === 'overview' && renderOverview()}
        {viewMode === 'detailed' && renderDetailed()}
        {viewMode === 'recommendations' && renderRecommendations()}
      </div>

      {/* Selected Gap Modal */}
      {selectedGap && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-90vw max-h-90vh overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">{selectedGap.skill} Gap Details</h3>
              <button
                onClick={() => setSelectedGap(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{selectedGap.demand}</div>
                  <div className="text-sm text-gray-600">Total Demand</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{selectedGap.supply}</div>
                  <div className="text-sm text-gray-600">Current Supply</div>
                </div>
              </div>
              
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <h4 className="font-semibold text-red-900 mb-2">Impact</h4>
                <p className="text-sm text-red-800">
                  This skill gap affects {selectedGap.affectedProjects} active projects and represents 
                  a {((selectedGap.gap / selectedGap.demand) * 100).toFixed(1)}% shortfall in required capacity.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Recommended Actions</h4>
                <div className="space-y-2">
                  {selectedGap.recommendedActions.map((action, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                      <span className="text-gray-700">{action}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResourceGapAnalysis;