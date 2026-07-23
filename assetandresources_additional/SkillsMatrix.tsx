import React, { useState, useMemo } from 'react';
import { Search, Filter, Award, TrendingUp, AlertCircle, Users } from 'lucide-react';

// Local Resource type - no external stores required
interface Resource {
  id: string;
  name: string;
  type: 'equipment' | 'manpower';
  utilization: number;
  skills: string[];
}

interface SkillsMatrixProps {
  resources: Resource[];
}

const SkillsMatrix: React.FC<SkillsMatrixProps> = ({ resources }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'matrix' | 'gaps' | 'demand'>('matrix');

  // Extract all unique skills
  const allSkills = useMemo(() => {
    const skillSet = new Set<string>();
    resources.forEach(resource => {
      resource.skills.forEach(skill => skillSet.add(skill));
    });
    return Array.from(skillSet).sort();
  }, [resources]);

  // Filter skills based on search
  const filteredSkills = useMemo(() => {
    if (!searchQuery) return allSkills;
    return allSkills.filter(skill => 
      skill.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [allSkills, searchQuery]);

  // Calculate skill distribution
  const skillDistribution = useMemo(() => {
    const distribution: Record<string, { count: number; resources: string[] }> = {};
    
    allSkills.forEach(skill => {
      const skillResources = resources.filter(r => r.skills.includes(skill));
      distribution[skill] = {
        count: skillResources.length,
        resources: skillResources.map(r => r.name),
      };
    });
    
    return distribution;
  }, [resources, allSkills]);

  // Calculate skill gaps (skills with low coverage)
  const skillGaps = useMemo(() => {
    const minCoverage = Math.ceil(resources.length * 0.1); // At least 10% coverage
    return allSkills.filter(skill => skillDistribution[skill].count < minCoverage);
  }, [allSkills, skillDistribution, resources.length]);

  // Calculate skill demand (based on resource utilization)
  const skillDemand = useMemo(() => {
    const demand: Record<string, number> = {};
    
    resources.forEach(resource => {
      resource.skills.forEach(skill => {
        demand[skill] = (demand[skill] || 0) + (resource.utilization / 100);
      });
    });
    
    return Object.entries(demand)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);
  }, [resources]);

  // Generate matrix data
  const matrixData = useMemo(() => {
    return resources.map(resource => ({
      resource: resource.name,
      type: resource.type,
      skills: allSkills.map(skill => ({
        skill,
        hasSkill: resource.skills.includes(skill),
        level: resource.skills.includes(skill) ? 'Expert' : 'None',
      })),
    }));
  }, [resources, allSkills]);

  const getSkillLevelColor = (hasSkill: boolean, level: string) => {
    if (!hasSkill) return 'bg-gray-100';
    switch (level) {
      case 'Expert':
        return 'bg-green-500';
      case 'Advanced':
        return 'bg-blue-500';
      case 'Intermediate':
        return 'bg-yellow-500';
      case 'Beginner':
        return 'bg-orange-500';
      default:
        return 'bg-green-300';
    }
  };

  const getSkillLevelTextColor = (hasSkill: boolean) => {
    return hasSkill ? 'text-white' : 'text-gray-400';
  };

  const renderMatrixView = () => (
    <div className="skills-matrix">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Skills Matrix</h3>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search skills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <Filter className="w-5 h-5 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span className="text-sm text-gray-600">Expert</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span className="text-sm text-gray-600">Advanced</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-500 rounded"></div>
            <span className="text-sm text-gray-600">Intermediate</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-500 rounded"></div>
            <span className="text-sm text-gray-600">Beginner</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-100 rounded"></div>
            <span className="text-sm text-gray-600">No Skill</span>
          </div>
        </div>
      </div>

      {/* Skills Matrix Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 border-b">
                Resource
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 border-b">
                Type
              </th>
              {filteredSkills.map((skill) => (
                <th
                  key={skill}
                  className="px-3 py-3 text-center text-xs font-medium text-gray-900 border-b min-w-24 cursor-pointer hover:bg-gray-100"
                  onClick={() => setSelectedSkill(skill)}
                  title={skill}
                >
                  {skill.length > 15 ? `${skill.substring(0, 12)}...` : skill}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {matrixData.map((row, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                  {row.resource}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    row.type === 'manpower' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {row.type}
                  </span>
                </td>
                {row.skills
                  .filter(skill => filteredSkills.includes(skill.skill))
                  .map((skill, skillIndex) => (
                    <td
                      key={skillIndex}
                      className={`px-3 py-3 text-center text-xs font-medium ${getSkillLevelColor(skill.hasSkill, skill.level)} ${getSkillLevelTextColor(skill.hasSkill)}`}
                    >
                      {skill.hasSkill ? '●' : '○'}
                    </td>
                  ))
                }
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Selected Skill Details */}
      {selectedSkill && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-blue-900">Skill: {selectedSkill}</h4>
            <button
              onClick={() => setSelectedSkill(null)}
              className="text-blue-600 hover:text-blue-800"
            >
              ×
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-900">
                {skillDistribution[selectedSkill]?.count || 0}
              </div>
              <div className="text-sm text-blue-700">Resources with this skill</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-900">
                {((skillDistribution[selectedSkill]?.count || 0) / resources.length * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-blue-700">Coverage</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-900">
                {skillDemand.find(([skill]) => skill === selectedSkill)?.[1]?.toFixed(1) || 0}
              </div>
              <div className="text-sm text-blue-700">Demand Score</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderGapsView = () => (
    <div className="skills-gaps">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Skill Gap Analysis</h3>
        <p className="text-gray-600 mb-4">
          Identified {skillGaps.length} skills with insufficient coverage across your resource pool.
        </p>
      </div>

      {skillGaps.length === 0 ? (
        <div className="text-center py-8">
          <Award className="w-12 h-12 text-green-600 mx-auto mb-4" />
          <h4 className="text-lg font-semibold text-gray-900 mb-2">No Critical Skill Gaps</h4>
          <p className="text-gray-600">Your resource pool has good coverage across all skills.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {skillGaps.map((skill) => {
            const distribution = skillDistribution[skill];
            const coverage = (distribution.count / resources.length) * 100;
            
            return (
              <div key={skill} className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900">{skill}</h4>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <span className="text-sm font-medium text-red-600">Critical Gap</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{distribution.count}</div>
                    <div className="text-sm text-gray-600">Resources with skill</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">{coverage.toFixed(1)}%</div>
                    <div className="text-sm text-gray-600">Coverage</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {skillDemand.find(([s]) => s === skill)?.[1]?.toFixed(1) || 0}
                    </div>
                    <div className="text-sm text-gray-600">Demand Score</div>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">Coverage</span>
                    <span className="text-sm text-gray-600">{coverage.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-red-600 h-2 rounded-full" 
                      style={{ width: `${Math.min(coverage, 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Resources with this skill:</h5>
                  <div className="flex flex-wrap gap-1">
                    {distribution.resources.slice(0, 5).map((resource, index) => (
                      <span key={index} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                        {resource}
                      </span>
                    ))}
                    {distribution.resources.length > 5 && (
                      <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                        +{distribution.resources.length - 5} more
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Recommendations */}
      {skillGaps.length > 0 && (
        <div className="mt-8 p-6 bg-blue-50 rounded-lg">
          <h4 className="text-lg font-semibold text-blue-900 mb-4">Recommendations</h4>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-blue-900">Training Program</p>
                <p className="text-sm text-blue-700">Develop training programs for critical skill gaps</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Award className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-blue-900">Hiring Strategy</p>
                <p className="text-sm text-blue-700">Consider hiring resources with critical skills</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-blue-900">Cross-training</p>
                <p className="text-sm text-blue-700">Cross-train existing resources to fill skill gaps</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderDemandView = () => (
    <div className="skills-demand">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Skill Demand Analysis</h3>
        <p className="text-gray-600 mb-4">
          Top 10 most in-demand skills based on resource utilization and project requirements.
        </p>
      </div>

      <div className="space-y-4">
        {skillDemand.map(([skill, demand], index) => {
          const distribution = skillDistribution[skill];
          const maxDemand = skillDemand[0][1];
          
          return (
            <div key={skill} className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 font-bold rounded-full">
                    {index + 1}
                  </div>
                  <h4 className="font-semibold text-gray-900">{skill}</h4>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-blue-600">{demand.toFixed(1)}</div>
                  <div className="text-sm text-gray-600">Demand Score</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <div className="text-xl font-bold text-gray-900">{distribution.count}</div>
                  <div className="text-sm text-gray-600">Resources</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-green-600">
                    {((distribution.count / resources.length) * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">Coverage</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-purple-600">
                    {Math.floor(demand / 10)}
                  </div>
                  <div className="text-sm text-gray-600">Projects Need</div>
                </div>
              </div>

              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">Demand Level</span>
                  <span className="text-sm text-gray-600">{((demand / maxDemand) * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${(demand / maxDemand) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Resources:</span>
                {distribution.resources.slice(0, 3).map((resource, idx) => (
                  <span key={idx} className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                    {resource}
                  </span>
                ))}
                {distribution.resources.length > 3 && (
                  <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                    +{distribution.resources.length - 3} more
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Items */}
      <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Priority Actions</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-lg">
            <h5 className="font-medium text-gray-900 mb-2">High Demand Skills</h5>
            <p className="text-sm text-gray-600 mb-3">
              Focus on {skillDemand.slice(0, 3).map(([skill]) => skill).join(', ')} - these have the highest demand.
            </p>
            <button className="text-sm text-blue-600 font-medium hover:text-blue-800">
              View Training Plan →
            </button>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <h5 className="font-medium text-gray-900 mb-2">Resource Planning</h5>
            <p className="text-sm text-gray-600 mb-3">
              Consider hiring resources with top demand skills to meet project needs.
            </p>
            <button className="text-sm text-blue-600 font-medium hover:text-blue-800">
              Create Hiring Plan →
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="skills-matrix-container">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Skills Management</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('matrix')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                viewMode === 'matrix'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Matrix
            </button>
            <button
              onClick={() => setViewMode('gaps')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                viewMode === 'gaps'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Gaps
            </button>
            <button
              onClick={() => setViewMode('demand')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                viewMode === 'demand'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Demand
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="skills-content">
        {viewMode === 'matrix' && renderMatrixView()}
        {viewMode === 'gaps' && renderGapsView()}
        {viewMode === 'demand' && renderDemandView()}
      </div>
    </div>
  );
};

export default SkillsMatrix;