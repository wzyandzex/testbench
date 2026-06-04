/**
 * 执行热力图组件
 * 展示星期 vs 小时的执行热力图，支持 Agent 筛选和下钻
 */

import { memo, useMemo, useCallback, useState } from 'react';
import * as echarts from 'echarts';
import ReactECharts from 'echarts-for-react';
import { Card, Select, Space, Button, Tag } from 'antd';
import type { EChartsOption } from 'echarts';
import { DownloadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useEchartsTheme, useThemeTokens, useToolbarStyle } from '@/theme';

// 小时标签 (0-23)
const HOURS = Array.from({ length: 24 }, (_, i) => `${i}:00`);

interface HeatmapDataPoint {
  day: number; // 0-6 (周一到周日)
  hour: number; // 0-23
  value: number; // 执行次数或成功率
  successRate?: number; // 可选的成功率
}

interface AgentHeatmapData {
  agentId: string;
  agentName: string;
  data: HeatmapDataPoint[];
}

interface HeatmapViewProps {
  data: AgentHeatmapData[];
  height?: number | string;
  title?: string;
  valueType?: 'count' | 'successRate';
  showControls?: boolean;
  onDataPointClick?: (day: number, hour: number, agentId: string) => void;
  className?: string;
}

const HeatmapView = memo(function HeatmapView({
  data,
  height = 400,
  title,
  valueType = 'count',
  showControls = true,
  onDataPointClick,
  className = '',
}: HeatmapViewProps) {
  const { t } = useTranslation('benchmarks');
  const [selectedAgentId, setSelectedAgentId] = useState<string | 'all'>('all');

  const resolvedTitle = title ?? t('components.viz.heatmap.title');
  const WEEK_DAYS = useMemo(
    () => [
      t('components.viz.heatmap.weekMon'),
      t('components.viz.heatmap.weekTue'),
      t('components.viz.heatmap.weekWed'),
      t('components.viz.heatmap.weekThu'),
      t('components.viz.heatmap.weekFri'),
      t('components.viz.heatmap.weekSat'),
      t('components.viz.heatmap.weekSun'),
    ],
    [t],
  );

  // 主题
  const tokens = useThemeTokens();
  const echartsTheme = useEchartsTheme();
  const toolbarStyle = useToolbarStyle();

  // 获取选中的数据
  const selectedData = useMemo(() => {
    if (selectedAgentId === 'all') {
      // 聚合所有 Agent 的数据
      const aggregated: HeatmapDataPoint[] = [];
      for (let day = 0; day < 7; day++) {
        for (let hour = 0; hour < 24; hour++) {
          let value = 0;
          let successCount = 0;
          let totalCount = 0;

          data.forEach((agent) => {
            const point = agent.data.find((d) => d.day === day && d.hour === hour);
            if (point) {
              if (valueType === 'count') {
                value += point.value;
              } else {
                value += point.successRate || point.value;
                totalCount++;
                if (point.successRate !== undefined) {
                  successCount += point.successRate;
                }
              }
            }
          });

          if (value > 0) {
            aggregated.push({
              day,
              hour,
              value: valueType === 'count' ? value : (totalCount > 0 ? value / totalCount : 0),
            });
          }
        }
      }
      return aggregated;
    }

    const agent = data.find((d) => d.agentId === selectedAgentId);
    return agent?.data || [];
  }, [data, selectedAgentId, valueType]);

  // 计算数据范围
  const { minValue, maxValue } = useMemo(() => {
    if (selectedData.length === 0) return { minValue: 0, maxValue: 100 };
    const values = selectedData.map((d) => d.value);
    return {
      minValue: Math.min(...values),
      maxValue: Math.max(...values),
    };
  }, [selectedData]);

  // 转换为 ECharts 格式
  const chartData = useMemo(() => {
    return selectedData.map((d) => [d.day, d.hour, d.value]);
  }, [selectedData]);

  // ECharts 配置
  const chartOption = useMemo<EChartsOption>(() => {
    // 根据值类型选择颜色方案
    const colorStart = valueType === 'successRate' ? '#52c41a' : '#1677ff';
    const colorEnd = valueType === 'successRate' ? '#faad14' : '#722ed1';

    return {
      title: {
        text: resolvedTitle,
        left: 12,
        top: 12,
        textStyle: { fontSize: 14, fontWeight: 600, ...echartsTheme.title?.textStyle },
      },
      tooltip: {
        position: 'top',
        backgroundColor: echartsTheme.tooltip?.backgroundColor,
        borderColor: echartsTheme.tooltip?.borderColor,
        borderWidth: 1,
        textStyle: { ...echartsTheme.tooltip?.textStyle },
        formatter: (params: any) => {
          if (!params || !params.data) return '';
          const [day, hour, value] = params.data;
          const dayLabel = WEEK_DAYS[day];
          const valueLabel = valueType === 'count'
            ? t('components.viz.heatmap.tooltipCount', { value })
            : t('components.viz.heatmap.tooltipSuccess', { value: (value * 100).toFixed(1) });

          return `
            <div style="padding: 8px 0;">
              <div style="font-weight: 600; margin-bottom: 4px;">${dayLabel} ${hour}:00</div>
              <div style="color: ${params.color};">${valueLabel}</div>
            </div>
          `;
        },
      },
      grid: {
        height: '70%',
        top: '15%',
        left: '10%',
        right: '5%',
        bottom: '15%',
      },
      xAxis: {
        type: 'category',
        data: HOURS,
        splitArea: { show: true },
        axisLabel: { fontSize: 10, color: echartsTheme.categoryAxis?.axisLabel?.color || '#666', rotate: 45 },
        axisLine: { lineStyle: { color: echartsTheme.categoryAxis?.axisLine?.lineStyle?.color || '#e8e8e8' } },
      },
      yAxis: {
        type: 'category',
        data: WEEK_DAYS,
        splitArea: { show: true },
        axisLabel: { fontSize: 11, color: echartsTheme.valueAxis?.axisLabel?.color || '#666' },
        axisLine: { lineStyle: { color: (echartsTheme.categoryAxis as any)?.axisLine?.lineStyle?.color || '#e8e8e8' } },
      },
      visualMap: {
        min: minValue,
        max: maxValue,
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: '2%',
        textStyle: { fontSize: 11, color: echartsTheme.valueAxis?.axisLabel?.color || '#666' },
        inRange: {
          color: [colorStart, colorEnd],
        },
      },
      series: [
        {
          name: valueType === 'count'
            ? t('components.viz.heatmap.valueCount')
            : t('components.viz.heatmap.valueSuccess'),
          type: 'heatmap',
          data: chartData,
          label: {
            show: false,
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(0, 0, 0, 0.5)',
            },
          },
        } as any,
      ],
    };
  }, [chartData, minValue, maxValue, valueType, resolvedTitle, WEEK_DAYS, t]);

  // 处理图表点击事件
  const handleChartClick = useCallback(
    (params: any) => {
      if (params.componentType === 'series' && params.data) {
        const [day, hour] = params.data;
        onDataPointClick?.(day, hour, selectedAgentId === 'all' ? '' : selectedAgentId);
      }
    },
    [onDataPointClick, selectedAgentId]
  );

  // 导出图片
  const handleExportImage = useCallback(() => {
    const chart = document.querySelector('.heatmap-chart');
    // @ts-ignore
    const instance = echarts.getInstanceByDom(chart);
    if (instance) {
      const url = instance.getDataURL({
        type: 'png',
        backgroundColor: tokens.bg.primary,
        pixelRatio: 2,
      });
      const link = document.createElement('a');
      link.download = `heatmap-${Date.now()}.png`;
      link.href = url;
      link.click();
    }
  }, [tokens.bg.primary]);

  const agentOptions = useMemo(() => {
    return [
      { label: t('components.viz.heatmap.allAgents'), value: 'all' },
      ...data.map((a) => ({ label: a.agentName, value: a.agentId })),
    ];
  }, [data, t]);

  return (
    <Card
      className={`heatmap-view ${className}`}
      style={{ borderRadius: 8 }}
      styles={{ body: { padding: 0 } }}
    >
      {/* 工具栏 */}
      {showControls && (
        <div style={toolbarStyle}>
          <Space size={12}>
            <Select
              value={selectedAgentId}
              onChange={setSelectedAgentId}
              options={agentOptions}
              size="small"
              style={{ minWidth: 150 }}
            />

            <Tag color={valueType === 'count' ? 'blue' : 'green'}>
              {valueType === 'count'
                ? t('components.viz.heatmap.valueCount')
                : t('components.viz.heatmap.valueSuccess')}
            </Tag>
          </Space>

          <Button
            size="small"
            icon={<DownloadOutlined />}
            onClick={handleExportImage}
          >
            {t('components.viz.heatmap.export')}
          </Button>
        </div>
      )}

      {/* 图表 */}
      <div className="heatmap-chart">
        <ReactECharts
          option={chartOption}
          style={{ height }}
          notMerge={true}
          lazyUpdate={true}
          onEvents={{ click: handleChartClick }}
        />
      </div>
    </Card>
  );
});

export default HeatmapView;
