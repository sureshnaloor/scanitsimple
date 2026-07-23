import React, { useEffect, useRef } from 'react';

interface ChartData {
  name?: string;
  value?: number;
  month?: string;
  utilization?: number;
  equipment?: number;
  manpower?: number;
  project?: string;
  budget?: number;
  actual?: number;
  variance?: number;
  resource?: string;
  hours?: number;
  efficiency?: string;
}

interface ResourceAnalyticsChartProps {
  data: ChartData[];
  type: 'line' | 'bar' | 'pie' | 'scatter';
  metric?: string;
  height?: number;
  title?: string;
  onFilterChange?: (filter: any) => void;
}

const ResourceAnalyticsChart: React.FC<ResourceAnalyticsChartProps> = ({
  data,
  type,
  metric,
  height = 400,
  title,
  onFilterChange,
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<any | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    // Use globally available echarts (e.g., from CDN) instead of module import
    const echartsLib = (typeof window !== 'undefined' ? (window as any).echarts : null);
    if (!echartsLib) return;

    // Initialize chart
    chartInstance.current = echartsLib.init(chartRef.current);

    // Configure chart options based on type
    const options = getChartOptions(type, data, metric, title);
    
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
  }, [data, type, metric, title]);

  const getChartOptions = (type: string, data: ChartData[], metric?: string, title?: string) => {
    const baseOptions = {
      title: title ? { text: title, left: 'center' } : undefined,
      tooltip: {
        trigger: type === 'pie' ? 'item' : 'axis',
        axisPointer: { type: 'cross' },
      },
      legend: {
        show: type !== 'pie',
        bottom: 0,
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: type === 'pie' ? '3%' : '15%',
        containLabel: true,
      },
    };

    switch (type) {
      case 'line':
        return {
          ...baseOptions,
          xAxis: {
            type: 'category',
            data: data.map(d => d.month || d.name || ''),
          },
          yAxis: {
            type: 'value',
            name: metric || 'Value',
          },
          series: [
            {
              name: 'Utilization Rate',
              type: 'line',
              data: data.map(d => d.utilization || d.value || 0),
              smooth: true,
              itemStyle: { color: '#2dd4bf' },
              areaStyle: { color: 'rgba(45, 212, 191, 0.1)' },
            },
            {
              name: 'Equipment',
              type: 'line',
              data: data.map(d => d.equipment || 0),
              smooth: true,
              itemStyle: { color: '#f59e0b' },
            },
            {
              name: 'Manpower',
              type: 'line',
              data: data.map(d => d.manpower || 0),
              smooth: true,
              itemStyle: { color: '#1a2332' },
            },
          ],
        };

      case 'bar':
        if (metric === 'cost') {
          return {
            ...baseOptions,
            xAxis: {
              type: 'category',
              data: data.map(d => d.project || d.name || ''),
              axisLabel: { rotate: 45 },
            },
            yAxis: {
              type: 'value',
              name: 'Cost ($)',
            },
            series: [
              {
                name: 'Budget',
                type: 'bar',
                data: data.map(d => (d.budget || 0) / 1000),
                itemStyle: { color: '#2dd4bf' },
              },
              {
                name: 'Actual',
                type: 'bar',
                data: data.map(d => (d.actual || 0) / 1000),
                itemStyle: { color: '#f59e0b' },
              },
            ],
          };
        }
        
        return {
          ...baseOptions,
          xAxis: {
            type: 'category',
            data: data.map(d => d.name || d.project || ''),
          },
          yAxis: {
            type: 'value',
          },
          series: [{
            name: 'Value',
            type: 'bar',
            data: data.map(d => d.value || 0),
            itemStyle: {
              color: (params: any) => {
                const colors = ['#2dd4bf', '#14b8a6', '#059669', '#f59e0b', '#ea580c'];
                return colors[params.dataIndex % colors.length];
              },
            },
          }],
        };

      case 'pie':
        return {
          ...baseOptions,
          series: [{
            name: 'Distribution',
            type: 'pie',
            radius: ['40%', '70%'],
            data: data.map((d, index) => ({
              name: d.name || `Item ${index + 1}`,
              value: d.value || 0,
            })),
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.5)',
              },
            },
            itemStyle: {
              color: (params: any) => {
                const colors = ['#2dd4bf', '#14b8a6', '#059669', '#f59e0b', '#ea580c'];
                return colors[params.dataIndex % colors.length];
              },
            },
          }],
        };

      case 'scatter':
        return {
          ...baseOptions,
          xAxis: {
            type: 'value',
            name: 'Utilization (%)',
          },
          yAxis: {
            type: 'value',
            name: 'Value ($K)',
          },
          series: [{
            name: 'Performance',
            type: 'scatter',
            data: data.map(d => [d.utilization || 0, (d.value || 0) / 1000]),
            itemStyle: { color: '#2dd4bf' },
            symbolSize: 8,
          }],
        };

      default:
        return baseOptions;
    }
  };

  return (
    <div className="resource-analytics-chart">
      <div
        ref={chartRef}
        style={{ width: '100%', height: `${height}px` }}
        className="chart-container"
      />
    </div>
  );
};

export default ResourceAnalyticsChart;