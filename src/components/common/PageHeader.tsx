import { Space, Typography, Breadcrumb } from 'antd';
import type { BreadcrumbProps } from 'antd';
import { useThemeTokens } from '@/theme';

const { Title, Text } = Typography;

export interface PageHeaderProps {
  title: string;
  description?: string;
  extra?: React.ReactNode;
  breadcrumb?: BreadcrumbProps['items'];
  onBack?: () => void;
  actions?: React.ReactNode;
}

/**
 * 页面头部组件
 * 统一页面标题区域的样式和布局
 */
export function PageHeader({
  title,
  description,
  extra,
  breadcrumb,
  actions,
}: PageHeaderProps) {
  const tokens = useThemeTokens();

  return (
    <div style={{ marginBottom: 24 }}>
      {/* 面包屑 */}
      {breadcrumb && (
        <Breadcrumb style={{ marginBottom: 16 }} items={breadcrumb} />
      )}

      {/* 标题区 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
          minWidth: 0,
        }}
      >
        <div style={{ flex: '1 1 280px', minWidth: 0, maxWidth: '100%' }}>
          <Title
            level={2}
            style={{
              margin: 0,
              fontSize: 28,
              fontWeight: 700,
              color: tokens.text.primary,
              lineHeight: 1.2,
              overflowWrap: 'normal',
              wordBreak: 'normal',
            }}
          >
            {title}
          </Title>
          {description && (
            <Text
              type="secondary"
              style={{
                display: 'block',
                maxWidth: 720,
                marginTop: 8,
                fontSize: 14,
                lineHeight: 1.55,
                overflowWrap: 'break-word',
                whiteSpace: 'normal',
              }}
            >
              {description}
            </Text>
          )}
        </div>
        {extra && (
          <Space
            wrap
            style={{
              flex: '0 1 auto',
              maxWidth: '100%',
              minWidth: 0,
              justifyContent: 'flex-end',
            }}
          >
            {extra}
          </Space>
        )}
      </div>

      {/* 操作区 */}
      {actions && <div style={{ marginTop: 16 }}>{actions}</div>}
    </div>
  );
}
