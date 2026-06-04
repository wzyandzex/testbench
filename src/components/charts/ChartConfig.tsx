/**
 * 图表配置
 * 提供统一的 ECharts 配置和主题
 */

import type { EChartsOption } from 'echarts';

/**
 * 默认颜色主题
 */
export const CHART_COLORS = [
  '#1677ff', // 蓝色
  '#10b981', // 绿色
  '#ffc53d', // 黄色
  '#ef4444', // 红色
  '#8b5cf6', // 紫色
  '#f59e0b', // 橙色
  '#ec4899', // 粉色
  '#06b6d4', // 青色
];

/**
 * 通用图表配置
 */
export const baseChartConfig: EChartsOption = {
  grid: {
    top: 40,
    right: 20,
    bottom: 40,
    left: 50,
    containLabel: true,
  },
  tooltip: {
    trigger: 'axis',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    borderColor: '#333',
    borderWidth: 0,
    textStyle: {
      color: '#fff',
      fontSize: 12,
    },
    axisPointer: {
      type: 'cross',
      crossStyle: { color: '#999' },
    },
  },
  legend: {
    bottom: 0,
    textStyle: { color: '#666' },
  },
};

/**
 * 折线图特定配置
 */
export const lineChartConfig: EChartsOption = {
  ...baseChartConfig,
  xAxis: {
    type: 'category',
    boundaryGap: false,
    axisLine: { lineStyle: { color: '#ddd' } },
    axisLabel: { color: '#666' },
  },
  yAxis: {
    type: 'value',
    axisLine: { show: false },
    splitLine: { lineStyle: { color: '#f0f0f0', type: 'dashed' } },
    axisLabel: { color: '#666' },
  },
};

/**
 * 柱状图特定配置
 */
export const barChartConfig: EChartsOption = {
  ...baseChartConfig,
  xAxis: {
    type: 'category',
    axisLine: { lineStyle: { color: '#ddd' } },
    axisLabel: { color: '#666' },
  },
  yAxis: {
    type: 'value',
    axisLine: { show: false },
    splitLine: { lineStyle: { color: '#f0f0f0', type: 'dashed' } },
    axisLabel: { color: '#666' },
  },
};

/**
 * 饼图特定配置
 */
export const pieChartConfig: EChartsOption = {
  tooltip: {
    trigger: 'item',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    borderColor: '#333',
    borderWidth: 0,
    textStyle: { color: '#fff' },
    formatter: '{a} <br/>{b}: {c} ({d}%)',
  },
  legend: {
    bottom: 0,
    textStyle: { color: '#666' },
  },
};

/**
 * 雷达图特定配置
 */
export const radarChartConfig: EChartsOption = {
  radar: {
    indicator: [],
    shape: 'polygon',
    axisName: { color: '#666' },
    splitArea: { show: false },
    axisLine: { lineStyle: { color: '#ddd' } },
    splitLine: { lineStyle: { color: '#f0f0f0', type: 'dashed' } },
  },
  tooltip: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    borderColor: '#333',
    borderWidth: 0,
    textStyle: { color: '#fff' },
  },
  legend: {
    bottom: 0,
    textStyle: { color: '#666' },
  },
};

/**
 * 创建折线图系列配置
 */
export function createLineSeries(name: string, data: number[], smooth = true): EChartsOption {
  return {
    name,
    type: 'line',
    data,
    smooth,
    symbol: 'circle',
    symbolSize: 6,
    lineStyle: { width: 2 },
    emphasis: { focus: 'series' },
  };
}

/**
 * 创建柱状图系列配置
 */
export function createBarSeries(name: string, data: number[]): EChartsOption {
  return {
    name,
    type: 'bar',
    data,
    barMaxWidth: 40,
    emphasis: { focus: 'series' },
  };
}

/**
 * 创建饼图系列配置
 */
export function createPieSeries(name: string, data: Array<{ name: string; value: number }>): EChartsOption {
  return {
    name,
    type: 'pie',
    radius: ['40%', '70%'],
    center: ['50%', '50%'],
    data,
    emphasis: {
      itemStyle: {
        shadowBlur: 10,
        shadowOffsetX: 0,
        shadowColor: 'rgba(0, 0, 0, 0.5)',
      },
    },
  };
}

/**
 * 创建雷达图系列配置
 */
export function createRadarSeries(name: string, data: number[]): EChartsOption {
  return {
    name,
    type: 'radar',
    data,
    symbol: 'circle',
    symbolSize: 6,
    areaStyle: {},
    lineStyle: { width: 2 },
    emphasis: { focus: 'series' },
  };
}
