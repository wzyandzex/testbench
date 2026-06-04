/**
 * 多维性能雷达图组件
 * 展示 Agent 在多个维度上的性能对比
 */

import { memo, useMemo, useCallback, useState } from 'react';
import * as echarts from 'echarts';
import ReactECharts from 'echarts-for-react';
import { Card, Select, Space, Button, Radio } from 'antd';
import type { EChartsOption } from 'echarts';
import { DownloadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useEchartsTheme, useThemeTokens, useToolbarStyle } from '@/theme';

// 性能维度
export const PERFORMANCE_DIMENSIONS = [
  { name: 'accuracy', key: 'accuracy', max: 100 },
  { name: 'speed', key: 'speed', max: 100 },
  { name: 'efficiency', key: 'efficiency', max: 100 },
  { name: 'robustness', key: 'robustness', max: 100 },
  { name: 'resource', key: 'resource', max: 100 },
  { name: 'cost', key: 'cost', max: 100 },
] as const;

const DIMENSION_LABEL_KEYS: Record<string, string> = {
  accuracy: 'components.viz.radar.dimAccuracy',
  speed: 'components.viz.radar.dimSpeed',
  efficiency: 'components.viz.radar.dimEfficiency',
  robustness: 'components.viz.radar.dimRobustness',
  resource: 'components.viz.radar.dimResource',
  cost: 'components.viz.radar.dimCost',
};

type DimensionKey = typeof PERFORMANCE_DIMENSIONS[number]['key'];

interface AgentPerformance {
  agentId: string;
  agentName: string;
  color: string;
  metrics: Record<DimensionKey, number>;
}

interface PerformanceRadarProps {
  data: AgentPerformance[];
  dimensions?: typeof PERFORMANCE_DIMENSIONS;
  height?: number | string;
  title?: string;
  showControls?: boolean;
  className?: string;
}

const PerformanceRadar = memo(function PerformanceRadar({
  data,
  dimensions = PERFORMANCE_DIMENSIONS,
  height = 400,
  title,
  showControls = true,
  className = '',
}: PerformanceRadarProps) {
  const { t } = useTranslation('benchmarks');
  const [selectedAgents, setSelectedAgents] = useState<string[]>(
    data.slice(0, 3).map((d) => d.agentId)
  );
  const [viewMode, setViewMode] = useState<'radar' | 'parallel'>('radar');

  const resolvedTitle = title ?? t('components.viz.radar.title');
  const translateDim = useCallback(
    (dimName: string) => {
      const key = DIMENSION_LABEL_KEYS[dimName];
      return key ? t(key) : dimName;
    },
    [t],
  );

  // 主题
  const tokens = useThemeTokens();
  const echartsTheme = useEchartsTheme();
  const toolbarStyle = useToolbarStyle();

  // 处理 Agent 选择
  const handleAgentChange = useCallback((values: string[]) => {
    setSelectedAgents(values.slice(0, 5)); // 最多选择5个
  }, []);

  // ECharts 配置
  const chartOption = useMemo<EChartsOption>(() => {
    const selectedData = data.filter((d) => selectedAgents.includes(d.agentId));

    if (viewMode === 'radar') {
      return {
        title: {
          text: resolvedTitle,
          left: 12,
          top: 12,
          textStyle: { fontSize: 14, fontWeight: 600, ...echartsTheme.title?.textStyle },
        },
        tooltip: {
          backgroundColor: echartsTheme.tooltip?.backgroundColor,
          borderColor: echartsTheme.tooltip?.borderColor,
          borderWidth: 1,
          textStyle: { ...echartsTheme.tooltip?.textStyle },
          formatter: (params: any) => {
            if (!params || params.length === 0) return '';
            const agent = params[0];
            return `
              <div style="padding: 8px 0;">
                <div style="font-weight: 600; margin-bottom: 8px; color: ${agent.color};">
                  ${agent.name}
                </div>
                ${dimensions.map((dim, i) => `
                  <div style="display: flex; justify-content: space-between; margin: 4px 0; min-width: 150px;">
                    <span style="color: #666;">${translateDim(dim.name)}</span>
                    <span style="font-weight: 600;">${agent.value[i]?.toFixed(1)}</span>
                  </div>
                `).join('')}
              </div>
            `;
          },
        },
        legend: {
          bottom: 8,
          left: 'center',
          itemWidth: 12,
          itemHeight: 12,
          textStyle: { fontSize: 12, ...echartsTheme.legend?.textStyle },
          data: selectedData.map((d) => d.agentName),
        },
        radar: {
          indicator: dimensions.map((d) => ({ name: translateDim(d.name), max: d.max })),
          shape: 'polygon',
          splitNumber: 5,
          axisName: {
            color: echartsTheme.valueAxis?.axisLabel?.color || '#666',
            fontSize: 12,
            fontWeight: 500,
          },
          splitLine: {
            lineStyle: { color: echartsTheme.valueAxis?.splitLine?.lineStyle?.color || '#f0f0f0' },
          },
          splitArea: {
            show: true,
            areaStyle: { color: ['rgba(22, 119, 255, 0.02)', 'rgba(22, 119, 255, 0.05)'] },
          },
          axisLine: {
            lineStyle: { color: echartsTheme.categoryAxis?.axisLine?.lineStyle?.color || '#e8e8e8' },
          },
        },
        series: [
          {
            type: 'radar',
            data: selectedData.map((agent) => ({
              value: dimensions.map((dim) => agent.metrics[dim.key] || 0),
              name: agent.agentName,
              itemStyle: { color: agent.color },
              areaStyle: {
                color: agent.color,
                opacity: 0.15,
              },
              lineStyle: { width: 2 },
              symbol: 'circle',
              symbolSize: 5,
            })),
          } as any,
        ],
      };
    }

    // 平行坐标图模式
    return {
      title: {
        text: resolvedTitle,
        left: 12,
        top: 12,
        textStyle: { fontSize: 14, fontWeight: 600, color: '#333' },
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#e8e8e8',
        borderWidth: 1,
        textStyle: { color: '#333' },
      },
      legend: {
        bottom: 8,
        left: 'center',
        itemWidth: 12,
        itemHeight: 12,
        textStyle: { fontSize: 12 },
        data: selectedData.map((d) => d.agentName),
      },
      parallelAxis: dimensions.map((dim) => ({
        dim: dimensions.indexOf(dim),
        name: translateDim(dim.name),
        max: dim.max,
        min: 0,
        nameLocation: 'end',
        nameGap: 10,
        nameTextStyle: { fontSize: 12, color: echartsTheme.valueAxis?.axisLabel?.color || '#666' },
        axisLine: { lineStyle: { color: (echartsTheme.categoryAxis as any)?.axisLine?.lineStyle?.color || '#e8e8e8' } },
        axisLabel: { fontSize: 11, color: echartsTheme.valueAxis?.axisLabel?.color || '#666' },
        splitLine: { show: false },
      })),
      parallel: {
        left: 48,
        right: 24,
        top: 48,
        bottom: 48,
        parallelAxisDefault: {
          type: 'value',
          nameLocation: 'end',
          nameGap: 12,
        },
      },
      series: [
        {
          type: 'parallel',
          lineStyle: { width: 2 },
          data: selectedData.map((agent) => dimensions.map((dim) => agent.metrics[dim.key] || 0)),
        } as any,
      ],
    };
  }, [data, selectedAgents, dimensions, resolvedTitle, viewMode, translateDim, echartsTheme]);

  // 导出图片
  const handleExportImage = useCallback(() => {
    const chart = document.querySelector('.performance-radar-chart');
    // @ts-ignore
    const instance = echarts.getInstanceByDom(chart);
    if (instance) {
      const url = instance.getDataURL({
        type: 'png',
        backgroundColor: tokens.bg.primary,
        pixelRatio: 2,
      });
      const link = document.createElement('a');
      link.download = `performance-radar-${Date.now()}.png`;
      link.href = url;
      link.click();
    }
  }, [tokens.bg.primary]);

  return (
    <Card
      className={`performance-radar ${className}`}
      style={{ borderRadius: 8 }}
      styles={{ body: { padding: 0 } }}
    >
      {/* 工具栏 */}
      {showControls && (
        <div style={toolbarStyle}>
          <Space size={12}>
            <Select
              mode="multiple"
              value={selectedAgents}
              onChange={handleAgentChange}
              options={data.map((a) => ({ label: a.agentName, value: a.agentId }))}
              placeholder={t('components.viz.radar.agentPlaceholder')}
              size="small"
              style={{ minWidth: 200 }}
              maxTagCount={2}
            />

            <Radio.Group
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
              size="small"
            >
              <Radio.Button value="radar">{t('components.viz.radar.viewRadar')}</Radio.Button>
              <Radio.Button value="parallel">{t('components.viz.radar.viewParallel')}</Radio.Button>
            </Radio.Group>
          </Space>

          <Button
            size="small"
            icon={<DownloadOutlined />}
            onClick={handleExportImage}
          >
            {t('components.viz.radar.export')}
          </Button>
        </div>
      )}

      {/* 图表 */}
      <div className="performance-radar-chart">
        <ReactECharts
          option={chartOption}
          style={{ height }}
          notMerge={true}
          lazyUpdate={true}
        />
      </div>
    </Card>
  );
});

export default PerformanceRadar;
