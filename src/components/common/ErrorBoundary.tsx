import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Result, Button, Space, Typography } from 'antd';
import i18next from 'i18next';

interface Props {
  children: ReactNode;
  fallbackLevel?: 'page' | 'app';
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const isApp = this.props.fallbackLevel === 'app';

    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: isApp ? '100vh' : '60vh', padding: 24 }}>
        <Result
          status="error"
          title={i18next.t('common:components.errorBoundary.title')}
          subTitle={i18next.t('common:components.errorBoundary.subTitle')}
          extra={
            <Space>
              <Button type="primary" onClick={this.reset}>{i18next.t('common:components.errorBoundary.retry')}</Button>
              <Button href="/">{i18next.t('common:components.errorBoundary.backHome')}</Button>
            </Space>
          }
        >
          {import.meta.env.DEV && this.state.error && (
            <Typography.Paragraph type="secondary" code style={{ maxHeight: 200, overflow: 'auto', whiteSpace: 'pre-wrap', fontSize: 12 }}>
              {this.state.error.message}
            </Typography.Paragraph>
          )}
        </Result>
      </div>
    );
  }
}
