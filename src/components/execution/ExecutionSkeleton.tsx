/**
 * 执行记录页面骨架屏组件
 * 提供加载状态的视觉反馈
 */

import { Card, Row, Col, Skeleton } from 'antd';
import { useCardStyle, useThemeTokens } from '@/theme';

/**
 * 统计卡片骨架屏
 */
export function StatCardSkeleton() {
  const cardStyle = useCardStyle();

  return (
    <div style={{ ...cardStyle, padding: '20px', textAlign: 'center' }}>
      <Skeleton.Button active size="small" style={{ width: 80, marginBottom: 8 }} />
      <Skeleton.Button active size="large" style={{ width: 100, height: 32 }} />
    </div>
  );
}

/**
 * 表格骨架屏
 */
export function TableSkeleton({ rows = 8 }: { rows?: number }) {
  const cardStyle = useCardStyle();
  const tokens = useThemeTokens();

  return (
    <div style={{ ...cardStyle, padding: 0 }}>
      <div style={{ padding: '16px 24px' }}>
        <Skeleton.Input active size="small" style={{ width: 200 }} />
      </div>
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          style={{
            padding: '12px 24px',
            borderBottom: `1px solid ${tokens.border.default}`,
          }}
        >
          <Skeleton.Input active size="small" style={{ width: '100%' }} />
        </div>
      ))}
    </div>
  );
}

/**
 * 详情页骨架屏
 */
export function DetailSkeleton() {
  return (
    <div>
      {/* 头部骨架 */}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
        <Skeleton.Button active size="small" />
        <Skeleton.Input active size="large" style={{ width: 300 }} />
        <Skeleton.Button active size="small" />
      </div>

      {/* 进度骨架 */}
      <Card style={{ marginBottom: 16 }}>
        <Skeleton active paragraph={{ rows: 1 }} />
      </Card>

      {/* 概览骨架 */}
      <Card style={{ marginBottom: 16 }}>
        <Skeleton active paragraph={{ rows: 4 }} />
      </Card>

      {/* 日志骨架 */}
      <Card>
        <Skeleton active paragraph={{ rows: 6 }} />
      </Card>
    </div>
  );
}

/**
 * 筛选栏骨架屏
 */
export function FiltersSkeleton() {
  const cardStyle = useCardStyle();

  return (
    <div style={{ ...cardStyle, padding: 20 }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Skeleton.Input active style={{ width: '100%' }} />
        </Col>
        <Col xs={24} sm={12} md={4}>
          <Skeleton.Input active style={{ width: '100%' }} />
        </Col>
        <Col xs={24} sm={12} md={4}>
          <Skeleton.Input active style={{ width: '100%' }} />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Skeleton.Input active style={{ width: '100%' }} />
        </Col>
        <Col xs={24} sm={12} md={4}>
          <Skeleton.Button active />
        </Col>
      </Row>
    </div>
  );
}

/**
 * 完整页面骨架屏（包含统计卡片和表格）
 */
export function ExecutionListSkeleton() {
  return (
    <div>
      {/* 统计卡片骨架 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        {Array.from({ length: 4 }).map((_, index) => (
          <Col xs={12} sm={6} key={index}>
            <StatCardSkeleton />
          </Col>
        ))}
      </Row>

      {/* 筛选栏骨架 */}
      <FiltersSkeleton />

      {/* 表格骨架 */}
      <div style={{ marginTop: 20 }}>
        <TableSkeleton rows={8} />
      </div>
    </div>
  );
}

export default ExecutionListSkeleton;
