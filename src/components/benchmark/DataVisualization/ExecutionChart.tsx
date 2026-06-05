/**
 * 增强的执行趋势图组件
 * 支持多 Agent 对比、时间范围选择、缩放平移、悬停详情、异常检测高亮
 */

import { memo, useState, useCallback, useMemo, useRef } from 'react';
import ReactECharts from 'echarts-for-react';
import { DatePicker, Select, Button, Card, Radio, Grid } from 'antd';
import type { RadioChangeEvent } from 'antd';
import type { EChartsOption } from 'echarts';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { useEchartsTheme, useThemeTokens, useToolbarStyle } from '@/theme';

const { RangePicker } = DatePicker;

type ChartType = 'line' | 'area' | 'bar';

interface ExecutionDataPoint {
  timestamp: number;
  value: number;
  agentId: string;
  agentName: string;
  isAnomaly?: boolean;
  confidence?: [number, number]; // 置信区间
}

interface ExecutionChartProps {
  data: ExecutionDataPoint[];
  agents: Array<{ id: string; name: string; color: string }>;
  height?: number | string;
  showTimeRange?: boolean;
  showAgents?: boolean;
  title?: string;
  onTimeRangeChange?: (start: number, end: number) => void;
  className?: string;
}

const ExecutionChart = memo(function ExecutionChart({
  data,
  agents,
  height = 400,
  showTimeRange = true,
  showAgents = true,
  title,
  onTimeRangeChange,
  className = '',
}: ExecutionChartProps) {
  const { t } = useTranslation('benchmarks');
  const [timeRange, setTimeRange] = useState('1m');
  const [selectedAgents, setSelectedAgents] = useState<string[]>(agents.map((a) => a.id));
  const [chartType, setChartType] = useState<ChartType>('line');
  const chartRef = useRef<ReactECharts>(null);
  const screens = Grid.useBreakpoint();
  const isCompact = !screens.md;

  const resolvedTitle = title ?? t('components.viz.chart.title');
  const TIME_RANGES = useMemo(
    () => [
      { label: t('components.viz.chart.range1d'), value: '1d' },
      { label: t('components.viz.chart.range1w'), value: '1w' },
      { label: t('components.viz.chart.range1m'), value: '1m' },
      { label: t('components.viz.chart.rangeAll'), value: 'all' },
    ],
    [t],
  );

  // 主题
  const tokens = useThemeTokens();
  const echartsTheme = useEchartsTheme();
  const toolbarStyle = useToolbarStyle();
  const responsiveToolbarStyle: React.CSSProperties = {
    ...toolbarStyle,
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 12,
  };
  const filterControlsStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    flex: '1 1 560px',
    flexWrap: 'wrap',
    gap: 12,
    minWidth: 0,
    maxWidth: '100%',
  };
  const controlGroupStyle: React.CSSProperties = {
    flex: '0 0 auto',
    maxWidth: '100%',
    whiteSpace: 'nowrap',
  };
  const fluidControlStyle: React.CSSProperties = {
    flex: isCompact ? '1 1 100%' : '0 1 auto',
    minWidth: isCompact ? 0 : 180,
    maxWidth: '100%',
  };
  const rangePickerStyle: React.CSSProperties = {
    width: isCompact ? '100%' : 280,
    maxWidth: '100%',
  };
  const agentSelectStyle: React.CSSProperties = {
    width: isCompact ? '100%' : 190,
    minWidth: isCompact ? 0 : 150,
    maxWidth: '100%',
  };
  const radioGroupStyle: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    maxWidth: '100%',
  };
  const exportButtonStyle: React.CSSProperties = {
    flex: '0 0 auto',
    whiteSpace: 'nowrap',
  };

  // 处理时间范围变化
  const handleTimeRangeChange = useCallback(
    (range: string) => {
      setTimeRange(range);
      const now = Date.now();
      let start: number;

      switch (range) {
        case '1d':
          start = now - 24 * 60 * 60 * 1000;
          break;
        case '1w':
          start = now - 7 * 24 * 60 * 60 * 1000;
          break;
        case '1m':
          start = now - 30 * 24 * 60 * 60 * 1000;
          break;
        default:
          start = 0;
      }

      onTimeRangeChange?.(start, now);
    },
    [onTimeRangeChange]
  );

  // 处理 Agent 选择
  const handleAgentChange = useCallback((values: string[]) => {
    setSelectedAgents(values);
  }, []);

  // 处理日期范围选择
  const handleDatePickerChange = useCallback((dates: any) => {
    if (dates && dates[0] && dates[1]) {
      const start = dates[0].valueOf();
      const end = dates[1].valueOf();
      onTimeRangeChange?.(start, end);
    }
  }, [onTimeRangeChange]);

  const handleChartTypeChange = useCallback((event: RadioChangeEvent) => {
    setChartType(event.target.value as ChartType);
  }, []);

  // 过滤数据
  const filteredData = useMemo(() => {
    return data.filter((d) => selectedAgents.includes(d.agentId));
  }, [data, selectedAgents]);

  // ECharts 配置
  const chartOption = useMemo<EChartsOption>(() => {
    const series = agents
      .filter((agent) => selectedAgents.includes(agent.id))
      .map((agent) => {
        const agentData = filteredData.filter((d) => d.agentId === agent.id);
        const values = agentData.map((d) => [d.timestamp, d.value]);
        const confidenceData = agentData.map((d) => d.confidence || [d.value, d.value]);
        const anomalies = agentData
          .filter((d) => d.isAnomaly)
          .map((d) => ({
            name: t('components.viz.chart.anomaly'),
            coord: [d.timestamp, d.value],
            itemStyle: { color: '#ff4d4f' },
          }));

        const isBarChart = chartType === 'bar';
        const isAreaChart = chartType === 'area';

        return {
          name: agent.name,
          type: isBarChart ? 'bar' : 'line',
          smooth: !isBarChart,
          symbol: isBarChart ? 'none' : 'circle',
          symbolSize: isBarChart ? 0 : 6,
          barMaxWidth: isBarChart ? 22 : undefined,
          barGap: isBarChart ? '20%' : undefined,
          data: values,
          itemStyle: { color: agent.color },
          lineStyle: isBarChart ? undefined : { width: 2 },
          areaStyle: isAreaChart
            ? {
                color: agent.color,
                opacity: 0.18,
              }
            : undefined,
          markPoint: {
            data: anomalies,
            symbol: 'pin',
            symbolSize: 40,
          },
          markArea: {
            silent: true,
            itemStyle: {
              color: agent.color,
              opacity: 0.05,
            },
            data: confidenceData.length > 0
              ? [[
                  { name: t('components.viz.chart.confidenceInterval'), coord: confidenceData[0] },
                  { coord: confidenceData[confidenceData.length - 1] },
                ]]
              : [],
          },
        } as any;
      });

    return {
      title: {
        text: resolvedTitle,
        left: 12,
        top: 12,
        textStyle: { fontSize: 14, fontWeight: 600, ...echartsTheme.textStyle },
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: echartsTheme.tooltip?.backgroundColor,
        borderColor: echartsTheme.tooltip?.borderColor,
        borderWidth: 1,
        textStyle: { ...echartsTheme.tooltip?.textStyle },
        formatter: (params: any) => {
          if (!params || params.length === 0) return '';
          const timestamp = params[0].coord?.[0] || params[0].data?.[0];
          const date = dayjs(timestamp).format('YYYY-MM-DD HH:mm');

          let html = `<div style="padding: 4px 0;">
            <div style="font-weight: 600; margin-bottom: 6px;">${date}</div>`;

          params.forEach((param: any) => {
            const value = param.data?.[1] || param.value;
            const confidence = filteredData.find(
              (d) => d.timestamp === timestamp && d.agentId === param.seriesName
            )?.confidence;

            html += `
              <div style="display: flex; align-items: center; margin: 4px 0;">
                <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: ${param.color}; margin-right: 8px;"></span>
                <span style="flex: 1;">${param.seriesName}</span>
                <span style="font-weight: 600; margin-left: 12px;">${value?.toFixed(2) || '-'}</span>
              </div>
            `;

            if (confidence) {
              html += `<div style="font-size: 11px; color: #999; margin-left: 18px;">
                ${t('components.viz.chart.confidenceInterval')}: [${confidence[0].toFixed(2)}, ${confidence[1].toFixed(2)}]
              </div>`;
            }
          });

          html += '</div>';
          return html;
        },
      },
      legend: {
        bottom: 8,
        left: 'center',
        itemWidth: 12,
        itemHeight: 12,
        textStyle: { fontSize: 12, ...echartsTheme.legend?.textStyle },
      },
      grid: {
        left: 48,
        right: 24,
        top: 48,
        bottom: showTimeRange ? 60 : 48,
        containLabel: false,
      },
      xAxis: {
        type: 'time',
        boundaryGap: chartType === 'bar',
        axisLine: { lineStyle: { color: echartsTheme.categoryAxis?.axisLine?.lineStyle?.color || '#e8e8e8' } },
        axisLabel: { color: echartsTheme.categoryAxis?.axisLabel?.color || '#666', fontSize: 11 },
        splitLine: { show: false },
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        axisLabel: { color: echartsTheme.valueAxis?.axisLabel?.color || '#666', fontSize: 11 },
        splitLine: { lineStyle: { color: echartsTheme.valueAxis?.splitLine?.lineStyle?.color || '#f0f0f0', type: 'dashed' } },
      },
      dataZoom: [
        {
          type: 'inside',
          start: 0,
          end: 100,
        },
        {
          type: 'slider',
          start: 0,
          end: 100,
          height: 20,
          bottom: showTimeRange ? 10 : 0,
          handleSize: '80%',
          borderColor: 'transparent',
          fillerColor: 'rgba(22, 119, 255, 0.1)',
          handleStyle: {
            color: '#1677ff',
          },
        },
      ],
      series,
    };
  }, [agents, selectedAgents, filteredData, chartType, resolvedTitle, showTimeRange, t, echartsTheme]);

  // 导出图片
  const handleExportImage = useCallback(() => {
    const chart = chartRef.current?.getEchartsInstance();
    if (chart) {
      const url = chart.getDataURL({
        type: 'png',
        backgroundColor: tokens.bg.primary,
        pixelRatio: 2,
      });
      const link = document.createElement('a');
      link.download = `execution-chart-${Date.now()}.png`;
      link.href = url;
      link.click();
    }
  }, [tokens.bg.primary]);

  return (
    <Card
      className={`execution-chart ${className}`}
      style={{ borderRadius: 8 }}
      styles={{ body: { padding: 0 } }}
    >
      {/* 工具栏 */}
      <div style={responsiveToolbarStyle}>
        <div style={filterControlsStyle}>
          {showTimeRange && (
            <Radio.Group
              value={timeRange}
              onChange={(e) => handleTimeRangeChange(e.target.value)}
              optionType="button"
              buttonStyle="solid"
              size="small"
              style={{ ...controlGroupStyle, ...radioGroupStyle }}
            >
              {TIME_RANGES.map((range) => (
                <Radio.Button key={range.value} value={range.value}>
                  {range.label}
                </Radio.Button>
              ))}
            </Radio.Group>
          )}

          {showTimeRange && (
            <div style={fluidControlStyle}>
              <RangePicker
                size="small"
                showTime
                onChange={handleDatePickerChange}
                style={rangePickerStyle}
              />
            </div>
          )}

          {showAgents && (
            <div style={fluidControlStyle}>
              <Select
                mode="multiple"
                value={selectedAgents}
                onChange={handleAgentChange}
                options={agents.map((a) => ({ label: a.name, value: a.id }))}
                placeholder={t('components.viz.chart.agentPlaceholder')}
                size="small"
                style={agentSelectStyle}
                maxTagCount={isCompact ? 1 : 2}
              />
            </div>
          )}

          <Radio.Group
            value={chartType}
            onChange={handleChartTypeChange}
            size="small"
            style={{ ...controlGroupStyle, ...radioGroupStyle }}
          >
            <Radio.Button value="line">{t('components.viz.chart.chartLine')}</Radio.Button>
            <Radio.Button value="area">{t('components.viz.chart.chartArea')}</Radio.Button>
            <Radio.Button value="bar">{t('components.viz.chart.chartBar')}</Radio.Button>
          </Radio.Group>
        </div>

        <Button size="small" onClick={handleExportImage} style={exportButtonStyle}>
          {t('components.viz.chart.exportImage')}
        </Button>
      </div>

      {/* 图表 */}
      <ReactECharts
        key={chartType}
        ref={chartRef}
        option={chartOption}
        style={{ height }}
        notMerge={true}
        lazyUpdate={true}
      />
    </Card>
  );
});

export default ExecutionChart;
