'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PPEIssueRecord, Employee } from '@/types/ppe';
import { useAppTheme } from '@/app/contexts/ThemeContext';

interface PPEIssuesByEmployeeProps {
  onEmployeeSelect?: (employee: Employee) => void;
  showSearch?: boolean;
  preSelectedEmployee?: Employee | null;
}

interface EmployeeSearchResult {
  records: Employee[];
  total: number;
}

interface PPEIssuesResult {
  records: PPEIssueRecord[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export default function PPEIssuesByEmployee({ 
  onEmployeeSelect, 
  showSearch = true,
  preSelectedEmployee = null
}: PPEIssuesByEmployeeProps) {
  const { theme } = useAppTheme();
  const getStyles = () => {
    if (theme === 'light') {
      return {
        cardBg: 'p-6 bg-white border border-blue-200 rounded-2xl shadow-xl',
        innerCardBg: 'bg-blue-50/50 p-3 rounded-lg shadow-sm border border-blue-100',
        titleText: 'text-lg font-semibold mb-4 text-gray-900',
        labelText: 'text-xs font-medium text-gray-600 uppercase tracking-wider',
        valueText: 'text-sm font-semibold text-gray-900 mt-1',
        inputText: 'w-full bg-white border border-blue-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all',
        tableBorder: 'border border-blue-200 rounded-lg overflow-hidden shadow-md',
        tableHeaderBg: 'bg-blue-100/60 border-blue-200',
        tableHeaderCell: 'border border-blue-200 px-3 py-2 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider',
        tableHeaderCellCenter: 'border border-blue-200 px-3 py-2 text-center text-xs font-semibold text-gray-900 uppercase tracking-wider',
        tableBodyRow: 'hover:bg-blue-50/80 transition-all duration-200 border-b border-blue-100',
        tableBodyCell: 'border border-blue-200 px-3 py-2 text-xs text-gray-700',
        tableBodyCellCenter: 'border border-blue-200 px-3 py-2 text-center text-xs text-gray-700',
        textColorMuted: 'text-gray-600 text-sm',
        textColorMutedCenter: 'text-center py-8 text-gray-600',
        searchItem: 'p-3 hover:bg-blue-50 cursor-pointer border-b border-blue-100 last:border-b-0 transition-colors duration-200',
        searchItemName: 'font-medium text-sm text-gray-900',
        searchItemSub: 'text-xs text-gray-600',
        searchResultsContainer: 'border border-blue-200 rounded-lg max-h-60 overflow-y-auto bg-white shadow-md',
        badgeDefault: 'bg-gray-100 text-gray-800 border border-gray-300',
        quantityText: 'border border-blue-200 px-3 py-2 text-center text-xs font-medium text-blue-600',
      };
    }
    return {
      cardBg: 'p-6 bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl',
      innerCardBg: 'bg-white/5 backdrop-blur-sm p-3 rounded-lg shadow-sm border border-white/10',
      titleText: 'text-lg font-semibold mb-4 text-white',
      labelText: 'text-xs font-medium text-white/70 uppercase tracking-wider',
      valueText: 'text-sm font-semibold text-white mt-1',
      inputText: 'w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all',
      tableBorder: 'border border-white/20 rounded-lg overflow-hidden shadow-md',
      tableHeaderBg: 'bg-white/10 backdrop-blur-md border-white/20',
      tableHeaderCell: 'border border-white/20 px-3 py-2 text-left text-xs font-semibold text-white uppercase tracking-wider',
      tableHeaderCellCenter: 'border border-white/20 px-3 py-2 text-center text-xs font-semibold text-white uppercase tracking-wider',
      tableBodyRow: 'hover:bg-white/10 hover:backdrop-blur-sm transition-all duration-200 border-b border-white/10',
      tableBodyCell: 'border border-white/20 px-3 py-2 text-xs text-white',
      tableBodyCellCenter: 'border border-white/20 px-3 py-2 text-center text-xs text-white',
      textColorMuted: 'text-white/80 text-sm',
      textColorMutedCenter: 'text-center py-8 text-white/80',
      searchItem: 'p-3 hover:bg-white/20 cursor-pointer border-b border-white/10 last:border-b-0 transition-colors duration-200',
      searchItemName: 'font-medium text-sm text-white',
      searchItemSub: 'text-xs text-white/80',
      searchResultsContainer: 'border border-white/20 rounded-lg max-h-60 overflow-y-auto bg-white/10 backdrop-blur-lg shadow-md',
      badgeDefault: 'bg-white/10 text-white/70 border border-white/20',
      quantityText: 'border border-white/20 px-3 py-2 text-center text-xs font-medium text-teal-300',
    };
  };
  const s = getStyles();

  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(preSelectedEmployee);
  const [ppeIssues, setPpeIssues] = useState<PPEIssueRecord[]>([]);
  const [newPpeIssues, setNewPpeIssues] = useState<PPEIssueRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [newIssuesLoading, setNewIssuesLoading] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Effect to handle pre-selected employee
  useEffect(() => {
    if (preSelectedEmployee) {
      setSelectedEmployee(preSelectedEmployee);
      fetchPPEIssues(preSelectedEmployee.empno);
      fetchNewPPEIssues(preSelectedEmployee.empno);
    }
  }, [preSelectedEmployee]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Search employees
  const searchEmployees = async (term: string) => {
    if (!term || (term.length < 5 && !/^\d+$/.test(term))) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/employees/search?search=${encodeURIComponent(term)}`);
      const data = await response.json();
      
      if (data.success) {
        setSearchResults(data.data.records);
        setShowSearchResults(true);
        setError(null);
      } else {
        setError(data.error || 'Failed to search employees');
        setSearchResults([]);
        setShowSearchResults(false);
      }
    } catch (err) {
      setError('Failed to search employees');
      setSearchResults([]);
      setShowSearchResults(false);
    } finally {
      setLoading(false);
    }
  };

  // Fetch PPE issues for selected employee
  const fetchPPEIssues = async (empNumber: string) => {
    console.log('Fetching PPE issues for employee:', empNumber);
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/ppe-issues-by-employee?userEmpNumber=${empNumber}&limit=100`);
      const data = await response.json();
      
      console.log('PPE API response:', data);
      
      if (data.success) {
        // Convert any MongoDB objects to proper JavaScript types
        const processedRecords = data.data.records.map((record: any) => {
          const processedRecord = { ...record };
          
          // Handle MongoDB Decimal objects
          if (typeof processedRecord.quantityIssued === 'object' && processedRecord.quantityIssued.$numberDecimal) {
            processedRecord.quantityIssued = parseFloat(processedRecord.quantityIssued.$numberDecimal);
          }
          
          // Handle MongoDB Date objects
          if (processedRecord.dateOfIssue && typeof processedRecord.dateOfIssue === 'object') {
            processedRecord.dateOfIssue = new Date(processedRecord.dateOfIssue);
          }
          
          // Ensure all string fields are properly converted
          Object.keys(processedRecord).forEach(key => {
            if (typeof processedRecord[key] === 'object' && processedRecord[key] !== null) {
              // Convert any remaining MongoDB objects to strings
              if (processedRecord[key].$numberDecimal) {
                processedRecord[key] = parseFloat(processedRecord[key].$numberDecimal);
              } else if (processedRecord[key].$date) {
                processedRecord[key] = new Date(processedRecord[key].$date);
              } else {
                processedRecord[key] = String(processedRecord[key]);
              }
            }
          });
          
          return processedRecord;
        });
        
        setPpeIssues(processedRecords);
        setError(null);
        console.log('PPE issues loaded:', processedRecords.length, 'records');
      } else {
        console.error('PPE API error:', data.error);
        setError(data.error || 'Failed to fetch PPE issues');
        setPpeIssues([]);
      }
    } catch (err) {
      console.error('PPE fetch error:', err);
      setError('Failed to fetch PPE issues');
      setPpeIssues([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch new PPE issues for selected employee from ppe-records collection
  const fetchNewPPEIssues = async (empNumber: string) => {
    console.log('Fetching new PPE issues for employee:', empNumber);
    setNewIssuesLoading(true);
    try {
      const response = await fetch(`/api/ppe-records?userEmpNumber=${empNumber}&limit=100`);
      const data = await response.json();
      
      console.log('New PPE API response:', data);
      
      if (data.success) {
        // Convert any MongoDB objects to proper JavaScript types
        const processedRecords = data.data.records.map((record: any) => {
          const processedRecord = { ...record };
          
          // Handle MongoDB Decimal objects
          if (typeof processedRecord.quantityIssued === 'object' && processedRecord.quantityIssued.$numberDecimal) {
            processedRecord.quantityIssued = parseFloat(processedRecord.quantityIssued.$numberDecimal);
          }
          
          // Handle MongoDB Date objects
          if (processedRecord.dateOfIssue && typeof processedRecord.dateOfIssue === 'object') {
            processedRecord.dateOfIssue = new Date(processedRecord.dateOfIssue);
          }
          
          // Ensure all string fields are properly converted
          Object.keys(processedRecord).forEach(key => {
            if (typeof processedRecord[key] === 'object' && processedRecord[key] !== null) {
              // Convert any remaining MongoDB objects to strings
              if (processedRecord[key].$numberDecimal) {
                processedRecord[key] = parseFloat(processedRecord[key].$numberDecimal);
              } else if (processedRecord[key].$date) {
                processedRecord[key] = new Date(processedRecord[key].$date);
              } else {
                processedRecord[key] = String(processedRecord[key]);
              }
            }
          });
          
          return processedRecord;
        });
        
        setNewPpeIssues(processedRecords);
        console.log('New PPE issues loaded:', processedRecords.length, 'records');
      } else {
        console.error('New PPE API error:', data.error);
        setNewPpeIssues([]);
      }
    } catch (err) {
      console.error('New PPE fetch error:', err);
      setNewPpeIssues([]);
    } finally {
      setNewIssuesLoading(false);
    }
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Debounce search with 500ms delay
    searchTimeoutRef.current = setTimeout(() => {
      searchEmployees(value);
    }, 500);
  };

  // Handle employee selection
  const handleEmployeeSelect = (employee: Employee) => {
    setSelectedEmployee(employee);
    setSearchTerm(`${employee.empname} (${employee.empno})`);
    setShowSearchResults(false);
    setSearchResults([]);
    fetchPPEIssues(employee.empno);
    fetchNewPPEIssues(employee.empno);
    
    if (onEmployeeSelect) {
      onEmployeeSelect(employee);
    }
  };

  // Handle direct employee number entry
  const handleDirectSearch = () => {
    if (searchTerm && /^\d+$/.test(searchTerm)) {
      // Direct employee number search
      const mockEmployee: Employee = {
        empno: searchTerm,
        empname: 'Unknown Employee',
        active: 'Y',
        createdAt: new Date(),
        createdBy: 'system'
      };
      handleEmployeeSelect(mockEmployee);
    }
  };

  // Format date for display
  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  return (
    <div className="space-y-6 text-left">
      {showSearch && (
        <div className={s.cardBg}>
          <h3 className={s.titleText}>Search Employee</h3>
          <div className="space-y-4">
            <div className="relative">
              <Input
                type="text"
                placeholder="Enter employee number or name (min 5 characters for name)"
                value={searchTerm}
                onChange={handleSearchChange}
                className={s.inputText}
              />
              {/^\d+$/.test(searchTerm) && (
                <Button 
                  onClick={handleDirectSearch}
                  className={`absolute right-2 top-1/2 transform -translate-y-1/2 ${theme === 'light' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-teal-500 hover:bg-teal-600'} text-white`}
                  size="sm"
                >
                  Search
                </Button>
              )}
            </div>

            {/* Search Results */}
            {showSearchResults && searchResults.length > 0 && (
              <div className={s.searchResultsContainer}>
                {searchResults.map((employee) => (
                  <div
                    key={employee.empno}
                    className={s.searchItem}
                    onClick={() => handleEmployeeSelect(employee)}
                  >
                    <div className={s.searchItemName}>{employee.empname}</div>
                    <div className={s.searchItemSub}>
                      {employee.empno} • {employee.department || 'No Department'}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {error && (
              <div className={`${theme === 'light' ? 'text-red-600' : 'text-red-300'} text-sm`}>{error}</div>
            )}
          </div>
        </div>
      )}

      {/* Selected Employee Info */}
      {selectedEmployee && (
        <div className={s.cardBg}>
          <h3 className={s.titleText}>Selected Employee</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={s.innerCardBg}>
              <label className={s.labelText}>Name</label>
              <p className={s.valueText}>{selectedEmployee.empname}</p>
            </div>
            <div className={s.innerCardBg}>
              <label className={s.labelText}>Employee Number</label>
              <p className={s.valueText}>{selectedEmployee.empno}</p>
            </div>
            {selectedEmployee.department && (
              <div className={s.innerCardBg}>
                <label className={s.labelText}>Department</label>
                <p className={s.valueText}>{selectedEmployee.department}</p>
              </div>
            )}
            {selectedEmployee.designation && (
              <div className={s.innerCardBg}>
                <label className={s.labelText}>Designation</label>
                <p className={s.valueText}>{selectedEmployee.designation}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Past PPE Issues Table */}
      {selectedEmployee && (
        <div className={s.cardBg}>
          <h3 className={s.titleText}>Past PPE Issues (Historical Data)</h3>
          
          {loading ? (
            <div className="text-center py-8">
              <div className={`inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 ${theme === 'light' ? 'border-blue-500' : 'border-teal-400'}`}></div>
              <p className={s.textColorMuted}>Loading historical PPE issues...</p>
            </div>
          ) : ppeIssues.length > 0 ? (
            <div className="overflow-x-auto">
              <div className={s.tableBorder}>
                <table className="w-full border-collapse rounded-lg overflow-hidden">
                  <thead>
                    <tr className={s.tableHeaderBg}>
                      <th className={s.tableHeaderCell}>Date of Issue</th>
                      <th className={s.tableHeaderCell}>PPE Name</th>
                      <th className={s.tableHeaderCellCenter}>Quantity</th>
                      <th className={s.tableHeaderCellCenter}>Size</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ppeIssues.map((issue, index) => (
                      <tr key={issue._id || index} className={s.tableBodyRow}>
                        <td className={s.tableBodyCell}>
                          {formatDate(issue.dateOfIssue)}
                        </td>
                        <td className={s.tableBodyCell}>
                          {String(issue.ppeName || '')}
                        </td>
                        <td className={s.quantityText}>
                          {typeof issue.quantityIssued === 'number' ? issue.quantityIssued : String(issue.quantityIssued || 0)}
                        </td>
                        <td className={s.quantityText}>
                          {String(issue.size || '-')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className={s.textColorMutedCenter}>
              <p className="text-sm">No historical PPE issues found for this employee.</p>
            </div>
          )}
        </div>
      )}

      {/* New PPE Issues Table */}
      {selectedEmployee && (
        <div className={s.cardBg}>
          <h3 className={s.titleText}>New PPE Issues (Current System)</h3>
          
          {newIssuesLoading ? (
            <div className="text-center py-8">
              <div className={`inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 ${theme === 'light' ? 'border-blue-500' : 'border-teal-400'}`}></div>
              <p className={s.textColorMuted}>Loading current PPE issues...</p>
            </div>
          ) : newPpeIssues.length > 0 ? (
            <div className="overflow-x-auto">
              <div className={s.tableBorder}>
                <table className="w-full border-collapse rounded-lg overflow-hidden">
                  <thead>
                    <tr className={s.tableHeaderBg}>
                      <th className={s.tableHeaderCell}>Date of Issue</th>
                      <th className={s.tableHeaderCell}>PPE Name</th>
                      <th className={s.tableHeaderCellCenter}>Quantity</th>
                      <th className={s.tableHeaderCellCenter}>Size</th>
                      <th className={s.tableHeaderCellCenter}>First Issue</th>
                      <th className={s.tableHeaderCellCenter}>Issue Type</th>
                      <th className={s.tableHeaderCell}>Issued By</th>
                      <th className={s.tableHeaderCell}>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {newPpeIssues.map((issue, index) => (
                      <tr key={issue._id || index} className={s.tableBodyRow}>
                        <td className={s.tableBodyCell}>
                          {formatDate(issue.dateOfIssue)}
                        </td>
                        <td className={s.tableBodyCell}>
                          {String(issue.ppeName || '')}
                        </td>
                        <td className={s.quantityText}>
                          {typeof issue.quantityIssued === 'number' ? issue.quantityIssued : String(issue.quantityIssued || 0)}
                        </td>
                        <td className={s.quantityText}>
                          {String(issue.size || '-')}
                        </td>
                        <td className={s.tableBodyCellCenter}>
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            issue.isFirstIssue 
                              ? 'bg-green-500/20 text-green-300 border border-green-400/30' 
                              : s.badgeDefault
                          }`}>
                            {String(issue.isFirstIssue ? 'Yes' : 'No')}
                          </span>
                        </td>
                        <td className={s.tableBodyCellCenter}>
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            issue.issueAgainstDue 
                              ? 'bg-teal-500/20 text-teal-300 border border-teal-400/30' 
                              : 'bg-red-500/20 text-red-300 border border-red-400/30'
                          }`}>
                            {String(issue.issueAgainstDue ? 'Due' : 'Damage')}
                          </span>
                        </td>
                        <td className={s.tableBodyCell}>
                          {String(issue.issuedByName || '')}
                        </td>
                        <td className={s.tableBodyCell}>
                          {String(issue.remarks || '-')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className={s.textColorMutedCenter}>
              <p className="text-sm">No current PPE issues found for this employee.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
