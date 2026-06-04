import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import dayjs from 'dayjs';

import type { DimensionKey, Milestone, TrendPoint } from '../service';
import { CATEGORY_LABELS, DIMENSION_LABELS } from '../service';

interface TrendChartProps {
  points: TrendPoint[];
  milestones?: Milestone[];
  dimension: DimensionKey;
  loading?: boolean;
  height?: number;
  onPointClick?: (point: TrendPoint) => void;
  // 对比模式：多 Agent 多条线
  comparisonSeries?: Array<{
    agentId: string;
    agentName: string;
    points: TrendPoint[];
    color: string;
  }>;
}

export function TrendChart({
  points,
  milestones = [],
  dimension,
  loading,
  height = 380,
  onPointClick,
  comparisonSeries,
}: TrendChartProps) {
  const option = useMemo(() => {
    const dimensionMeta = DIMENSION_LABELS[dimension];

    // 单 Agent 模式：主线 + 异常点标记 + 里程碑垂直线
    if (!comparisonSeries) {
      const dates = points.map((p) => dayjs(p.date).format('MM-DD'));
      const values = points.map((p) => Number(p[dimension] ?? 0).toFixed(4));

      // 异常点 markPoint
      const anomalyMarkPoints = points
        .map((p, idx) => p.is_anomaly ? {
          xAxis: dates[idx],
          yAxis: Number(p[dimension] ?? 0),
          value: '异常',
          itemStyle: { color: '#fa541c' },
          label: { color: '#fff', fontSize: 10 },
          tooltipData: p,
        } : null)
        .filter(Boolean);

      // 里程碑 markLine（垂直线）
      const milestoneMarkLines = milestones.map((m) => {
        const matched = dates.find((d) =>
          dayjs(m.occurred_at).format('MM-DD') === d
        );
        const categoryMeta = CATEGORY_LABELS[m.category];
        return {
          xAxis: matched || dayjs(m.occurred_at).format('MM-DD'),
          name: m.label,
          lineStyle: {
            color: m.color || categoryMeta.color,
            type: 'dashed',
            width: 2,
          },
          label: {
            formatter: m.label,
            position: 'insideEndTop',
            color: m.color || categoryMeta.color,
            fontSize: 11,
          },
        };
      });

      return {
        animation: true,
        animationDuration: 400,
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'cross' },
          formatter: (params: any) => {
            const idx = params[0]?.dataIndex;
            if (idx === undefined) return '';
            const point = points[idx];
            if (!point) return '';
            const lines = [
              `<b>${dayjs(point.date).format('YYYY-MM-DD')}</b>`,
              `合成分: <b>${point.composite_score.toFixed(3)}</b>`,
              `功能: ${point.func_score.toFixed(3)} · 质量: ${point.qual_score.toFixed(3)}`,
              `稳定: ${point.stab_score.toFixed(3)} · 推理: ${point.reas_score.toFixed(3)} · 效率: ${point.eff_score.toFixed(3)}`,
              `执行数: ${point.execution_count}`,
            ];
            if (point.is_anomaly) {
              lines.push(`<span style="color:#fa541c">⚠ ${point.anomaly_reason || '异常'}</span>`);
            }
            return lines.join('<br/>');
          },
        },
        grid: { left: 50, right: 30, top: 40, bottom: 50 },
        xAxis: {
          type: 'category',
          data: dates,
          boundaryGap: false,
          axisLabel: { fontSize: 11 },
        },
        yAxis: {
          type: 'value',
          min: 0,
          max: 1,
          axisLabel: { formatter: (v: number) => v.toFixed(1) },
        },
        series: [
          {
            name: dimensionMeta.label,
            type: 'line',
            smooth: true,
            symbol: 'circle',
            symbolSize: 6,
            data: values,
            lineStyle: { width: 2, color: dimensionMeta.color },
            itemStyle: { color: dimensionMeta.color },
            areaStyle: {
              color: {
                type: 'linear',
                x: 0, y: 0, x2: 0, y2: 1,
                colorStops: [
                  { offset: 0, color: `${dimensionMeta.color}66` },
                  { offset: 1, color: `${dimensionMeta.color}05` },
                ],
              },
            },
            markPoint: anomalyMarkPoints.length > 0 ? {
              symbol: 'pin',
              symbolSize: 32,
              data: anomalyMarkPoints,
            } : undefined,
            markLine: milestoneMarkLines.length > 0 ? {
              silent: false,
              symbol: ['none', 'none'],
              data: milestoneMarkLines,
            } : undefined,
          },
        ],
      };
    }

    // 对比模式：每个 agent 一条线
    const allDates = new Set<string>();
    comparisonSeries.forEach((s) => {
      s.points.forEach((p) => allDates.add(dayjs(p.date).format('MM-DD')));
    });
    const sortedDates = Array.from(allDates).sort();

    const series = comparisonSeries.map((s) => {
      const dateToValue = new Map<string, number>();
      s.points.forEach((p) => {
        dateToValue.set(dayjs(p.date).format('MM-DD'), Number(p[dimension] ?? 0));
      });
      const data = sortedDates.map((d) => dateToValue.get(d) ?? null);
      return {
        name: s.agentName,
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 5,
        connectNulls: true,
        data,
        lineStyle: { width: 2, color: s.color },
        itemStyle: { color: s.color },
      };
    });

    return {
      animation: true,
      tooltip: { trigger: 'axis' },
      legend: { type: 'scroll', top: 0 },
      grid: { left: 50, right: 30, top: 40, bottom: 50 },
      xAxis: { type: 'category', data: sortedDates, boundaryGap: false },
      yAxis: { type: 'value', min: 0, max: 1 },
      series,
    };
  }, [points, milestones, dimension, comparisonSeries]);

  const onEvents = useMemo(
    () => ({
      click: (params: any) => {
        if (comparisonSeries) return;
        if (params.componentType === 'series' && params.dataIndex !== undefined) {
          onPointClick?.(points[params.dataIndex]);
        }
      },
    }),
    [comparisonSeries, points, onPointClick]
  );

  return (
    <ReactECharts
      option={option}
      style={{ height }}
      showLoading={loading}
      loadingOption={{ text: '加载中...' }}
      onEvents={onEvents}
      notMerge
    />
  );
}
