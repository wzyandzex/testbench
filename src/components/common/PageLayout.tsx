import { ReactNode } from 'react';
import { Row, Col } from 'antd';

export interface PageLayoutProps {
  children: ReactNode;
  maxWidth?: number;
  padding?: string | number;
  className?: string;
}

/**
 * 页面容器组件
 * 统一页面布局和样式
 */
export function PageLayout({
  children,
  maxWidth = 1600,
  padding = '32px 48px',
  className,
}: PageLayoutProps) {
  return (
    <div
      className={className}
      style={{
        padding,
        maxWidth,
        margin: '0 auto',
      }}
    >
      {children}
    </div>
  );
}

export interface PageSectionProps {
  children: ReactNode;
  gutter?: [number, number];
  marginBottom?: number;
}

/**
 * 页面区块组件
 * 用于分隔页面内容区域
 */
export function PageSection({
  children,
  gutter = [24, 24],
  marginBottom = 24,
}: PageSectionProps) {
  return (
    <Row gutter={gutter} style={{ marginBottom }}>
      {children}
    </Row>
  );
}

export interface PageCardProps {
  children: ReactNode;
  xs?: number;
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
  xxl?: number;
}

/**
 * 页面卡片容器组件
 * 包装 Col 组件，简化响应式布局
 */
export function PageCard({ children, xs = 24, sm, md, lg, xl, xxl }: PageCardProps) {
  return (
    <Col xs={xs} sm={sm} md={md} lg={lg} xl={xl} xxl={xxl}>
      {children}
    </Col>
  );
}
