import { Spin } from 'antd';

interface LoadingProps {
  size?: 'small' | 'default' | 'large';
  tip?: string;
  spinning?: boolean;
  children?: React.ReactNode;
}

export function Loading({ size = 'default', tip, spinning = true, children }: LoadingProps) {
  if (children) {
    return (
      <Spin size={size} tip={tip} spinning={spinning}>
        {children}
      </Spin>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 200,
      }}
    >
      <Spin size={size} tip={tip} />
    </div>
  );
}
