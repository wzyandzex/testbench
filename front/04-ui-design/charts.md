# 图表规范

## ECharts 配置规范

### 基础配置

```typescript
// src/utils/chart.ts
export const baseChartOptions: EChartsOption = {
  // 动画
  animation: true,
  animationDuration: 300,
  animationEasing: 'cubicOut',

  // 颜色
  color: [
    '#5470c6', '#91cc75', '#fac858', '#ee6666',
    '#73c0de', '#3ba272', '#fc8452', '#9a60b4',
    '#ea7ccc',
  ],

  // 网格
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    top: '10%',
    containLabel: true,
  },

  // 提示框
  tooltip: {
    trigger: 'axis',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    borderColor: 'transparent',
    textStyle: {
      color: '#fff',
      fontSize: 12,
    },
    padding: [8, 12],
    axisPointer: {
      type: 'line',
      lineStyle: {
        color: 'rgba(0, 0, 0, 0.2)',
        type: 'dashed',
      },
    },
  },

  // 图例
  legend: {
    type: 'scroll',
    icon: 'circle',
    itemWidth: 10,
    itemHeight: 10,
    itemGap: 16,
    textStyle: {
      fontSize: 12,
      color: 'rgba(0, 0, 0, 0.65)',
    },
  },
};
```

---

## 折线图

### 趋势图

```typescript
// src/components/chart/LineChart.tsx
import ReactECharts from 'echarts-for-react';

interface LineChartProps {
  data: Array<{ name: string; value: number; date: string }[]>;
  title?: string;
  height?: number;
}

export function LineChart({ data, title, height = 300 }: LineChartProps) {
  const options: EChartsOption = {
    ...baseChartOptions,
    title: title ? { text: title, left: 'center' } : undefined,
    xAxis: {
      type: 'category',
      data: data[0]?.map((d) => d.date) || [],
      boundaryGap: false,
      axisLine: { lineStyle: { color: '#d9d9d9' } },
      axisLabel: { color: 'rgba(0, 0, 0, 0.65)' },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#f0f0f0', type: 'dashed' } },
      axisLabel: { color: 'rgba(0, 0, 0, 0.65)' },
    },
    series: data.map((series) => ({
      name: series[0]?.name || '',
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      data: series.map((d) => d.value),
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(24, 144, 255, 0.3)' },
            { offset: 1, color: 'rgba(24, 144, 255, 0.05)' },
          ],
        },
      },
      lineStyle: { width: 2 },
      emphasis: { focus: 'series' },
    })),
  };

  return <ReactECharts option={options} style={{ height }} />;
}
```

---

## 柱状图

### 对比图

```typescript
// src/components/chart/BarChart.tsx
import ReactECharts from 'echarts-for-react';

interface BarChartProps {
  data: { name: string; value: number }[];
  title?: string;
  horizontal?: boolean;
  height?: number;
}

export function BarChart({ data, title, horizontal = false, height = 300 }: BarChartProps) {
  const options: EChartsOption = {
    ...baseChartOptions,
    title: title ? { text: title, left: 'center' } : undefined,
    xAxis: horizontal
      ? { type: 'value', splitLine: { lineStyle: { color: '#f0f0f0' } } }
      : { type: 'category', data: data.map((d) => d.name) },
    yAxis: horizontal
      ? { type: 'category', data: data.map((d) => d.name) }
      : { type: 'value', splitLine: { lineStyle: { color: '#f0f0f0', type: 'dashed' } } },
    series: [
      {
        type: 'bar',
        data: data.map((d) => d.value),
        itemStyle: {
          borderRadius: [4, 4, 0, 0],
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#4096ff' },
              { offset: 1, color: '#1677ff' },
            ],
          },
        },
        emphasis: {
          itemStyle: { color: '#69b1ff' },
        },
        barWidth: '60%',
      },
    ],
  };

  return <ReactECharts option={options} style={{ height }} />;
}
```

### 分组柱状图

```typescript
export function GroupedBarChart({ data, categories, series, title }: GroupedBarChartProps) {
  const options: EChartsOption = {
    ...baseChartOptions,
    title: title ? { text: title, left: 'center' } : undefined,
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
    },
    legend: { bottom: 0 },
    xAxis: {
      type: 'category',
      data: categories,
    },
    yAxis: {
      type: 'value',
    },
    series: series.map((s) => ({
      name: s.name,
      type: 'bar',
      data: s.data,
      itemStyle: { borderRadius: [4, 4, 0, 0] },
    })),
  };

  return <ReactECharts option={options} style={{ height: 300 }} />;
}
```

---

## 饼图

### 环形图

```typescript
// src/components/chart/PieChart.tsx
import ReactECharts from 'echarts-for-react';

interface PieChartProps {
  data: Array<{ name: string; value: number }>;
  title?: string;
  height?: number;
  innerRadius?: string;
}

export function PieChart({
  data,
  title,
  height = 300,
  innerRadius = '40%'
}: PieChartProps) {
  const options: EChartsOption = {
    ...baseChartOptions,
    title: title ? { text: title, left: 'center', top: 'center' } : undefined,
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)',
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center',
    },
    series: [
      {
        name: title || '统计',
        type: 'pie',
        radius: [innerRadius, '70%'],
        center: ['40%', '50%'],
        data: data.sort((a, b) => b.value - a.value),
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
        label: {
          formatter: '{d}%',
          color: 'rgba(0, 0, 0, 0.65)',
        },
        labelLine: {
          lineStyle: { color: 'rgba(0, 0, 0, 0.2)' },
        },
      },
    ],
  };

  return <ReactECharts option={options} style={{ height }} />;
}
```

---

## 仪表盘

```typescript
// src/components/chart/GaugeChart.tsx
import ReactECharts from 'echarts-for-react';

interface GaugeChartProps {
  value: number;
  min?: number;
  max?: number;
  title?: string;
  unit?: string;
  height?: number;
}

export function GaugeChart({
  value,
  min = 0,
  max = 100,
  title,
  unit = '%',
  height = 200
}: GaugeChartProps) {
  const options: EChartsOption = {
    ...baseChartOptions,
    series: [
      {
        type: 'gauge',
        min,
        max,
        startAngle: 200,
        endAngle: -20,
        radius: '80%',
        center: ['50%', '60%'],
        progress: {
          show: true,
          width: 12,
          itemStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 1, y2: 0,
              colorStops: [
                { offset: 0, color: '#52c41a' },
                { offset: 0.5, color: '#faad14' },
                { offset: 1, color: '#ff4d4f' },
              ],
            },
          },
        },
        axisLine: {
          lineStyle: {
            width: 12,
            color: [[1, '#f0f0f0']],
          },
        },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        pointer: { show: false },
        detail: {
          valueAnimation: true,
          formatter: `{value}${unit}`,
          fontSize: 24,
          fontWeight: 500,
          color: 'rgba(0, 0, 0, 0.85)',
          offsetCenter: [0, '10%'],
        },
        title: {
          show: !!title,
          offsetCenter: [0, '30%'],
          fontSize: 14,
          color: 'rgba(0, 0, 0, 0.45)',
        },
        data: [{ value, name: title || '' }],
      },
    ],
  };

  return <ReactECharts option={options} style={{ height }} />;
}
```

---

## 热力图

```typescript
// src/components/chart/HeatmapChart.tsx
import ReactECharts from 'echarts-for-react';

interface HeatmapChartProps {
  data: Array<[number, number, number]>;
  xAxis: string[];
  yAxis: string[];
  title?: string;
  height?: number;
}

export function HeatmapChart({
  data,
  xAxis,
  yAxis,
  title,
  height = 400
}: HeatmapChartProps) {
  const options: EChartsOption = {
    ...baseChartOptions,
    title: title ? { text: title, left: 'center' } : undefined,
    tooltip: {
      position: 'top',
      formatter: (params: any) => {
        return `${params.data[0]} - ${params.data[1]}: ${params.data[2]}`;
      },
    },
    grid: {
      height: '70%',
      top: '15%',
    },
    xAxis: {
      type: 'category',
      data: xAxis,
      splitArea: { show: true },
    },
    yAxis: {
      type: 'category',
      data: yAxis,
      splitArea: { show: true },
    },
    visualMap: {
      min: Math.min(...data.map((d) => d[2])),
      max: Math.max(...data.map((d) => d[2])),
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: '5%',
      inRange: {
        color: ['#50a3ba', '#eac736', '#d94e5d'],
      },
    },
    series: [
      {
        type: 'heatmap',
        data: data,
        label: {
          show: false,
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
      },
    ],
  };

  return <ReactECharts option={options} style={{ height }} />;
}
```

---

## 图表 Hook

```typescript
// src/hooks/useChart.ts
import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

export function useChart(options: EChartsOption, deps: any[] = []) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (chartRef.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }

    return () => {
      chartInstance.current?.dispose();
    };
  }, []);

  useEffect(() => {
    if (chartInstance.current) {
      chartInstance.current.setOption(options);
    }
  }, deps);

  // 响应式
  useEffect(() => {
    const handleResize = () => {
      chartInstance.current?.resize();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return { chartRef, chartInstance };
}
```

---

## 仪表盘布局示例

```tsx
// src/pages/dashboard/DashboardCharts.tsx
import { Card, Row, Col } from 'antd';
import { LineChart, BarChart, PieChart, GaugeChart } from '@/components/chart';

export function DashboardCharts() {
  return (
    <Row gutter={[16, 16]}>
      {/* 趋势图 */}
      <Col span={24}>
        <Card title="执行趋势">
          <LineChart
            data={[
              [{ name: '成功', value: 120, date: '2026-01-01' }],
              [{ name: '失败', value: 10, date: '2026-01-01' }],
            ]}
            height={300}
          />
        </Card>
      </Col>

      {/* 统计卡片 */}
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <GaugeChart value={85} title="成功率" />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <GaugeChart value={70} title="资源使用率" />
        </Card>
      </Col>

      {/* 对比图 */}
      <Col xs={24} lg={12}>
        <Card title="Agent 执行对比">
          <BarChart
            data={[
              { name: 'Agent 1', value: 120 },
              { name: 'Agent 2', value: 200 },
              { name: 'Agent 3', value: 150 },
            ]}
            height={250}
          />
        </Card>
      </Col>

      {/* 分布图 */}
      <Col xs={24} lg={12}>
        <Card title="任务状态分布">
          <PieChart
            data={[
              { name: '成功', value: 800 },
              { name: '失败', value: 50 },
              { name: '运行中', value: 30 },
              { name: '等待中', value: 20 },
            ]}
            height={250}
          />
        </Card>
      </Col>
    </Row>
  );
}
```
