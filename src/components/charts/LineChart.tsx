/**
 * Line chart component
 */

import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { CHART_COLORS, lineChartConfig } from './ChartConfig';
import { Empty, Spin } from 'antd';

export interface LineChartProps {
  data: Array<{ name: string; value: number }> | number[];
  series?: Array<{ name: string; data: number[]; color?: string }>;
  title?: string;
  height?: number;
  width?: string | number;
  loading?: boolean;
  smooth?: boolean;
  showArea?: boolean;
  showDataZoom?: boolean;
  xAxisData?: string[];
  yAxisName?: string;
  color?: string[];
  style?: React.CSSProperties;
  className?: string;
}

/**
 * 折线图组件
 * ✅ 使用 memo 避免不必要的重渲染
 */
export const LineChart = memo(function LineChart({
  data,
  series,
  title,
  height = 400,
  width = '100%',
  loading = false,
  smooth = true,
  showArea = false,
  showDataZoom = false,
  xAxisData,
  yAxisName,
  color = CHART_COLORS,
  style,
  className,
}: LineChartProps) {
  const { t } = useTranslation('common');
  const option: EChartsOption = useMemo(() => {
    if (!series && Array.isArray(data)) {
      const values = data.map((d) => typeof d === 'object' ? d.value : d);
      series = [{
        name: title || t('components.charts.valueLabel'),
        data: values,
      }];
    }

    // 处理多系列数据
    const seriesConfig = series?.map((s, index) => ({
      name: s.name,
      type: 'line' as const,
      data: s.data,
      smooth,
      symbol: 'circle' as const,
      symbolSize: 6,
      lineStyle: { width: 2 },
      itemStyle: { color: s.color || color[index % color.length] },
      areaStyle: showArea ? {
        color: {
          type: 'linear' as const,
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: `${s.color || color[index % color.length]}80` },
            { offset: 1, color: `${s.color || color[index % color.length]}10` },
          ],
        },
      } : undefined,
    })) || [];

    // X轴数据
    let xData = xAxisData;
    if (!xData && Array.isArray(data) && typeof data[0] === 'object') {
      xData = data.map((d: any) => d.name);
    }

    return {
      ...lineChartConfig,
      title: title ? { text: title, left: 'center', textStyle: { fontSize: 16, fontWeight: 600 } } : undefined,
      color,
      xAxis: {
        ...lineChartConfig.xAxis,
        data: xData,
      },
      yAxis: {
        ...lineChartConfig.yAxis,
        name: yAxisName,
      },
      series: seriesConfig,
      dataZoom: showDataZoom ? [
        { type: 'inside', start: 0, end: 100 },
        { type: 'slider', start: 0, end: 100, height: 20, bottom: 30 },
      ] : undefined,
    };
  }, [data, series, title, smooth, showArea, showDataZoom, xAxisData, yAxisName, color]);

  // 空数据状态
  if (!loading && (!series || series.length === 0) && (!data || data.length === 0)) {
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

export default LineChart;
