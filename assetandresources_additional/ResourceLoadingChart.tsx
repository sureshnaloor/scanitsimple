import React, { useEffect, useRef } from 'react';

// Local Resource type - no external stores required
interface Resource {
  id: string;
  name: string;
  utilization: number;
}

interface DateRange {
  start: Date;
  end: Date;
}

interface ResourceLoadingChartProps {
  resources: Resource[];
  timeRange: DateRange;
  height?: number;
  showCapacity?: boolean;
  showLoading?: boolean;
  showAvailability?: boolean;
}

const ResourceLoadingChart: React.FC<ResourceLoadingChartProps> = ({
  resources,
  timeRange,
  height = 300,
  showCapacity = true,
  showLoading = true,
  showAvailability = true,
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<any | null>(null);

  useEffect(() => {
    if (!chartRef.current || resources.length === 0) return;

    // Use globally available echarts (e.g., from CDN) instead of module import
    const echartsLib = (typeof window !== 'undefined' ? (window as any).echarts : null);
    if (!echartsLib) return;

    // Initialize chart
    chartInstance.current = echartsLib.init(chartRef.current);

    // Generate date range
    const dates = generateDateRange(timeRange.start, timeRange.end);
    
    // Generate loading data
    const loadingData = generateLoadingData(resources, dates);
    
    // Configure chart options
    const options = getChartOptions(dates, loadingData, resources);
    
    // Set options and render
    chartInstance.current.setOption(options);

    // Handle resize
    const handleResize = () => {
      chartInstance.current?.resize();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chartInstance.current?.dispose();
    };
  }, [resources, timeRange, showCapacity, showLoading, showAvailability]);

  const generateDateRange = (start: Date, end: Date): string[] => {
    const dates: string[] = [];
    const current = new Date(start);
    
    while (current <= end) {
      dates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }
    
    return dates;
  };

  const generateLoadingData = (resources: Resource[], dates: string[]): any[] => {
    return resources.map(resource => {
      const loadingData = dates.map(date => {
        // Simulate loading based on resource utilization and random factors
        const baseLoading = resource.utilization / 100;
        const dayOfWeek = new Date(date).getDay();
        const weekendFactor = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.3 : 1;
        const randomFactor = 0.8 + Math.random() * 0.4; // 0.8 to 1.2
        
        return Math.min(1, baseLoading * weekendFactor * randomFactor);
      });
      
      return {
        name: resource.name,
        data: loadingData,
        type: 'line',
        smooth: true,
        itemStyle: { color: getResourceColor(resource) },
        areaStyle: { 
          color: `rgba(${getResourceColor(resource).replace('#', '').match(/.{2}/g)?.map((hex: string) => parseInt(hex, 16)).join(',')}, 0.1)` 
        },
      };
    });
  };

  const getResourceColor = (resource: Resource): string => {
    const colors = [
      '#2dd4bf', '#14b8a6', '#059669', '#047857', '#065f46',
      '#f59e0b', '#d97706', '#b45309', '#92400e', '#78350f',
      '#1a2332', '#374151', '#4b5563', '#6b7280', '#9ca3af',
    ];
    
    // Generate consistent color based on resource ID
    let hash = 0;
    for (let i = 0; i < resource.id.length; i++) {
      hash = resource.id.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  };

  const getChartOptions = (dates: string[], loadingData: any[], resources: Resource[]) => {
    return {
      title: {
        text: 'Resource Loading Analysis',
        left: 'center',
        textStyle: { fontSize: 16, fontWeight: 'bold' },
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' },
        formatter: (params: any) => {
          let result = `<strong>${params[0].axisValue}</strong><br/>`;
          params.forEach((param: any) => {
            const percentage = (param.value * 100).toFixed(1);
            result += `${param.seriesName}: ${percentage}%<br/>`;
          });
          return result;
        },
      },
      legend: {
        show: resources.length <= 5, // Only show legend for small number of resources
        bottom: 0,
        type: 'scroll',
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: resources.length <= 5 ? '15%' : '10%',
        top: '15%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: dates,
        axisLabel: {
          formatter: (value: string) => {
            const date = new Date(value);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          },
          rotate: 45,
        },
      },
      yAxis: {
        type: 'value',
        name: 'Loading',
        min: 0,
        max: 1,
        axisLabel: {
          formatter: (value: number) => `${(value * 100).toFixed(0)}%`,
        },
      },
      series: loadingData,
      dataZoom: [
        {
          type: 'inside',
          start: 0,
          end: 100,
        },
        {
          start: 0,
          end: 100,
          height: 20,
          bottom: 20,
        },
      ],
    };
  };

  // Generate capacity analysis chart
  const generateCapacityChart = () => {
    if (!chartRef.current || resources.length === 0) return;

    // Use globally available echarts (e.g., from CDN) instead of module import
    const echartsLib = (typeof window !== 'undefined' ? (window as any).echarts : null);
    if (!echartsLib) return;

    const chart = echartsLib.init(chartRef.current);
    const dates = generateDateRange(timeRange.start, timeRange.end);
    
    // Calculate capacity and loading
    const capacityData = dates.map(date => resources.length); // Total capacity
    const loadingData = dates.map(date => {
      return resources.reduce((sum, resource) => {
        const baseLoading = resource.utilization / 100;
        const dayOfWeek = new Date(date).getDay();
        const weekendFactor = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.3 : 1;
        return sum + Math.min(1, baseLoading * weekendFactor);
      }, 0);
    });
    
    const availabilityData = dates.map((date, index) => 
      Math.max(0, capacityData[index] - loadingData[index])
    );

    const options = {
      title: {
        text: 'Resource Capacity Analysis',
        left: 'center',
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' },
      },
      legend: {
        data: ['Capacity', 'Loading', 'Availability'],
        bottom: 0,
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: dates,
        axisLabel: {
          formatter: (value: string) => {
            const date = new Date(value);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          },
        },
      },
      yAxis: {
        type: 'value',
        name: 'Resources',
      },
      series: [
        {
          name: 'Capacity',
          type: 'bar',
          stack: 'total',
          data: capacityData,
          itemStyle: { color: '#e5e7eb' },
        },
        {
          name: 'Loading',
          type: 'bar',
          stack: 'total',
          data: loadingData,
          itemStyle: { color: '#2dd4bf' },
        },
        {
          name: 'Availability',
          type: 'bar',
          stack: 'total',
          data: availabilityData,
          itemStyle: { color: '#f59e0b' },
        },
      ],
    };

    chart.setOption(options);
  };

  if (resources.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-500 mb-2">No resources to display</p>
          <p className="text-sm text-gray-400">Add resources to see loading analysis</p>
        </div>
      </div>
    );
  }

  return (
    <div className="resource-loading-chart">
      <div
        ref={chartRef}
        style={{ width: '100%', height: `${height}px` }}
        className="chart-container"
      />
      
      {/* Chart Type Selector */}
      {resources.length > 0 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            onClick={() => generateCapacityChart()}
            className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
          >
            Capacity View
          </button>
        </div>
      )}
    </div>
  );
};

export default ResourceLoadingChart;