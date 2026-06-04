/**
 * Radar chart component
 */

import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { CHART_COLORS } from './ChartConfig';
import { Empty, Spin } from 'antd';

export interface RadarIndicator {
  name: string;
  max: number;
  min?: number;
}

export interface RadarChartProps {
  data: Array<{
    name: string;
    value: number[];
    color?: string;
  }>;
  indicators: RadarIndicator[];
  title?: string;
  height?: number;
  width?: string | number;
  loading?: boolean;
  showArea?: boolean;
  color?: string[];
  style?: React.CSSProperties;
  className?: string;
}

/**
 * Radar chart component
 */
export const RadarChart = memo(function RadarChart({
  data,
  indicators,
  title,
  height = 400,
  width = '100%',
  loading = false,
  showArea = true,
  color = CHART_COLORS,
  style,
  className,
}: RadarChartProps) {
  const { t } = useTranslation('common');
  const option: EChartsOption = useMemo(() => {
    const seriesConfig = data.map((d, index) => ({
      name: d.name,
      type: 'radar' as const,
      data: d.value,
      symbol: 'circle' as const,
      symbolSize: 6,
      itemStyle: { color: d.color || color[index % color.length] },
      areaStyle: showArea ? {
        color: {
          type: 'linear' as const,
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: `${d.color || color[index % color.length]}40` },
            { offset: 1, color: `${d.color || color[index % color.length]}10` },
          ],
        } as any,
      } : undefined,
    } as any));

    return {
      title: title ? { text: title, left: 'center' } : undefined,
      tooltip: {},
      legend: { bottom: 0, data: data.map((d) => d.name) },
      color,
      radar: {
        indicator: indicators,
        axisName: { color: '#666' },
        splitArea: { show: false },
        axisLine: { lineStyle: { color: '#ddd' } },
        splitLine: { lineStyle: { color: '#f0f0f0', type: 'dashed' } },
      },
      series: seriesConfig,
    };
  }, [data, indicators, title, showArea, color]);

  if (!loading && (!data || data.length === 0)) {
    return <Empty description={t('components.charts.empty')} style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }} />;
  }

  return (
    <div style={{ position: 'relative', height, width, ...style }}>
      {loading && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
          <Spin size="large" />
        </div>
      )}
      <ReactECharts
        option={option}
        style={{ height: '100%', width: '100%' }}
        className={className}
        lazyUpdate={true}
        notMerge={true}
      />
    </div>
  );
});

export default RadarChart;
