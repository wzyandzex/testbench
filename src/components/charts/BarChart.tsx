/**
 * Bar chart component
 */

import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { barChartConfig, CHART_COLORS } from './ChartConfig';
import { Empty, Spin } from 'antd';

export interface BarChartProps {
  data: Array<{ name: string; value: number }> | number[];
  series?: Array<{ name: string; data: number[]; color?: string }>;
  title?: string;
  height?: number;
  width?: string | number;
  loading?: boolean;
  horizontal?: boolean;
  showDataZoom?: boolean;
  xAxisData?: string[];
  yAxisName?: string;
  color?: string[];
  style?: React.CSSProperties;
  className?: string;
}

/**
 * 柱状图组件
 */
export const BarChart = memo(function BarChart({
  data,
  series,
  title,
  height = 400,
  width = '100%',
  loading = false,
  horizontal = false,
  showDataZoom = false,
  xAxisData,
  yAxisName,
  color = CHART_COLORS,
  style,
  className,
}: BarChartProps) {
  const { t } = useTranslation('common');
  const option: EChartsOption = useMemo(() => {
    if (!series && Array.isArray(data)) {
      const values = data.map((d) => typeof d === 'object' ? d.value : d);
      series = [{
        name: title || t('components.charts.valueLabel'),
        data: values,
      }];
    }

    // 构建系列配置
    const seriesConfig = series?.map((s, index) => ({
      name: s.name,
      type: 'bar' as const,
      data: s.data,
      barMaxWidth: 40,
      itemStyle: {
        color: {
          type: 'linear' as const,
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: s.color || color[index % color.length] },
            { offset: 1, color: `${s.color || color[index % color.length]}80` },
          ],
        },
        borderRadius: horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0],
      },
    })) || [];

    // X轴数据
    let xData = xAxisData;
    if (!xData && Array.isArray(data) && typeof data[0] === 'object') {
      xData = data.map((d: any) => d.name);
    }

    return {
      ...barChartConfig,
      title: title ? { text: title, left: 'center', textStyle: { fontSize: 16, fontWeight: 600 } } : undefined,
      color,
      // 横向柱状图交换轴
      xAxis: horizontal
        ? { type: 'value' as const, name: undefined }
        : { type: 'category' as const, data: xData },
      yAxis: horizontal
        ? { type: 'category' as const, data: xData, name: yAxisName }
        : { type: 'value' as const, name: yAxisName },
      series: horizontal
        ? seriesConfig.map((s) => ({ ...s, yAxisIndex: 0, xAxisIndex: 0 }))
        : seriesConfig,
      dataZoom: showDataZoom ? [
        { type: 'inside', start: 0, end: 100 },
        { type: 'slider', start: 0, end: 100, height: 20, bottom: 30 },
      ] : undefined,
    };
  }, [data, series, title, horizontal, showDataZoom, xAxisData, yAxisName, color]);

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

export default BarChart;
