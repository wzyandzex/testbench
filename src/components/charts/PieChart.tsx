/**
 * Pie chart component
 */

import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { CHART_COLORS } from './ChartConfig';
import { Empty, Spin } from 'antd';

export interface PieChartProps {
  data: Array<{ name: string; value: number }>;
  title?: string;
  height?: number;
  width?: string | number;
  loading?: boolean;
  roseType?: boolean | 'radius' | 'area';
  showLabel?: boolean;
  labelPosition?: 'inside' | 'outside' | 'center';
  radius?: [string, string];
  color?: string[];
  style?: React.CSSProperties;
  className?: string;
}

/**
 * 饼图组件
 */
export const PieChart = memo(function PieChart({
  data,
  title,
  height = 400,
  width = '100%',
  loading = false,
  roseType = false,
  showLabel = true,
  labelPosition = 'outside',
  radius = ['40%', '70%'],
  color = CHART_COLORS,
  style,
  className,
}: PieChartProps) {
  const { t } = useTranslation('common');
  const option: EChartsOption = useMemo(() => {
    const seriesConfig = {
      name: title || t('components.charts.dataLabel'),
      type: 'pie' as const,
      data,
      radius,
      roseType: roseType === false ? undefined : roseType === true ? 'area' : roseType,
      label: {
        show: showLabel,
        position: labelPosition,
        formatter: labelPosition === 'center'
          ? '{b}: {d}%\n{c}'
          : labelPosition === 'inside'
          ? '{d}%'
          : '{b}: {d}%',
      },
      emphasis: {
        label: { show: true, fontSize: 14, fontWeight: 600 as const },
      },
    };

    return {
      title: title ? { text: title, left: 'center' } : undefined,
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} ({d}%)',
      },
      legend: { bottom: 0 },
      color,
      series: [seriesConfig],
    };
  }, [data, title, roseType, showLabel, labelPosition, radius, color]);

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

export default PieChart;
