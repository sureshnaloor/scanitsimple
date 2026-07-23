'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ToolData, ToolCustody } from '@/types/tools';
import ToolDetails from '@/app/components/ToolDetails';
import ToolCustodyDetails from '@/app/components/ToolCustodyDetails';
import CollapsibleSection from '@/app/components/CollapsibleSection';

export default function ToolDetailPage() {
  const params = useParams();
  const toolId = params?.toolId as string;
  
  const [tool, setTool] = useState<ToolData | null>(null);
  const [custodyRecords, setCustodyRecords] = useState<ToolCustody[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (toolId) {
      fetchData();
    }
  }, [toolId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [toolData, custodyData] = await Promise.all([
        fetch(`/api/tools/${toolId}`).then(res => res.json()),
        fetch(`/api/tools-custody?assetNumber=${toolId}`).then(res => res.json())
      ]);

      setTool(toolData);
      setCustodyRecords(custodyData);

    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load tool data');
    } finally {
      setLoading(false);
    }
  };

  const handleToolUpdate = async (updatedTool: Partial<ToolData>) => {
    try {
      console.log('Updating tool:', toolId);

      const updatePayload = {
        toolDescription: updatedTool.toolDescription,
        serialNumber: updatedTool.serialNumber,
        manufacturer: updatedTool.manufacturer,
        modelNumber: updatedTool.modelNumber,
        toolCost: updatedTool.toolCost,
        purchasedDate: updatedTool.purchasedDate,
        purchasePONumber: updatedTool.purchasePONumber,
        purchaseSupplier: updatedTool.purchaseSupplier,
        toolCategory: updatedTool.toolCategory,
        toolSubcategory: updatedTool.toolSubcategory,
        toolStatus: updatedTool.toolStatus,
        toolLocation: updatedTool.toolLocation,
        toolCondition: updatedTool.toolCondition,
        accessories: updatedTool.accessories,
        toolNotes: updatedTool.toolNotes,
      };

      const res = await fetch(`/api/tools/${toolId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(updatePayload),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error('Update failed:', {
          status: res.status,
          statusText: res.statusText,
          data
        });
        throw new Error(data.error || `Failed to update tool: ${res.status}`);
      }

      // Update local state with new data
      setTool(prevTool => {
        if (!prevTool) return data;
        return { 
          ...prevTool, 
          ...updatePayload
        };
      });

      console.log('Tool updated successfully');

    } catch (error) {
      console.error('Error updating tool:', error);
      throw error;
    }
  };

  const handleCustodyUpdate = async (updatedCustody: ToolCustody | null) => {
    try {
      if (updatedCustody) {
        // Check if this is an edit (has _id) or new record
        if (updatedCustody._id) {
          // Update existing record
          const response = await fetch(`/api/tools-custody/${toolId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(updatedCustody),
          });

          if (!response.ok) throw new Error('Failed to update custody record');
        } else {
          // Create new record
          const response = await fetch('/api/tools-custody', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ ...updatedCustody, assetnumber: toolId }),
          });

          if (!response.ok) throw new Error('Failed to save custody record');
        }
      }

      // Refresh the custody records
      const refreshResponse = await fetch(`/api/tools-custody?assetNumber=${toolId}`);
      if (!refreshResponse.ok) throw new Error('Failed to fetch custody records');
      const updatedRecords = await refreshResponse.json();
      
      setCustodyRecords(updatedRecords);
    } catch (error) {
      console.error('Error updating custody records:', error);
      throw error; // Re-throw to show error in UI
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !tool) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500 text-lg">{error || 'Tool not found'}</div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col min-h-screen text-zinc-100">
      <div className="fixed inset-0 z-0 bg-[conic-gradient(at_top_right,_#111111,_#1e40af,_#eeef46)] opacity-50" />
      
      <div className="relative z-10 flex flex-col min-h-screen">
        
        <main className="flex-1 flex flex-col items-center justify-center p-2 gap-4">
          <CollapsibleSection title="Tool Details">
            <ToolDetails 
              tool={tool} 
              onUpdate={handleToolUpdate}
            />
          </CollapsibleSection>

          <CollapsibleSection title="Custody Details">
            <ToolCustodyDetails 
              currentCustody={custodyRecords.length > 0 ? custodyRecords[0] : null}
              custodyHistory={custodyRecords.length > 1 ? custodyRecords.slice(1) : []}
              onUpdate={handleCustodyUpdate}
              assetnumber={toolId}
            />
          </CollapsibleSection>
        </main>
        
      </div>
    </div>
  );
}

