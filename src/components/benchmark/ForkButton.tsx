/**
 * ForkButton - Fork 题目按钮组件
 * 用于从现有评测任务创建副本
 */

import { memo, useCallback, useState } from 'react';
import { Button, message, Modal } from 'antd';
import { BranchesOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useBenchmarkStore } from '@/pages/benchmarks/store';
import { logger } from '@/utils';

interface ForkButtonProps {
  /** Benchmark ID */
  benchmarkId: string;
  /** Benchmark 名称（用于确认提示） */
  benchmarkName?: string;
  /** 按钮类型 */
  type?: 'default' | 'primary' | 'text' | 'link';
  /** 按钮大小 */
  size?: 'small' | 'middle' | 'large';
  /** 是否显示图标 */
  showIcon?: boolean;
  /** 自定义按钮文本 */
  children?: string;
  /** Fork 成功后的回调 */
  onForked?: (newBenchmarkId: string) => void;
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** 自定义类名 */
  className?: string;
}

/**
 * ForkButton 组件
 *
 * 功能：
 * - 点击 Fork 按钮创建题目副本
 * - 处理重复 Fork 错误（错误码 200005）
 * - Fork 成功后跳转到编辑页
 */
export const ForkButton = memo(function ForkButton({
  benchmarkId,
  benchmarkName,
  type = 'default',
  size = 'middle',
  showIcon = true,
  children,
  onForked,
  style,
  className,
}: ForkButtonProps) {
  const navigate = useNavigate();
  const { t } = useTranslation('benchmarks');
  const [loading, setLoading] = useState(false);
  const forkBenchmark = useBenchmarkStore((s) => s.forkBenchmark);

  const handleFork = useCallback(async () => {
    // 确认提示
    Modal.confirm({
      title: t('components.fork.button.modalTitle'),
      content: benchmarkName
        ? t('components.fork.button.confirmWithName', { name: benchmarkName })
        : t('components.fork.button.confirmDefault'),
      okText: t('components.fork.button.okText'),
      cancelText: t('components.fork.button.cancelText'),
      onOk: async () => {
        setLoading(true);
        try {
          logger.userAction('fork_benchmark', { benchmarkId });
          const result = await forkBenchmark(benchmarkId);

          const newBenchmarkId = result.id;
          message.success(t('components.fork.button.success'));

          // 触发回调
          onForked?.(newBenchmarkId);

          // 跳转到编辑页
          setTimeout(() => {
            navigate(`/benchmarks/${newBenchmarkId}/edit`);
          }, 500);
        } catch (err: any) {
          // 检查错误码
          const errorCode = (err as any)?.code;
          const errorMessage = err?.response?.data?.message || err?.message || t('components.fork.button.fallbackError');

          if (errorCode === 200005) {
            message.warning(t('components.fork.button.duplicateForkWarn'));
          } else if (errorCode === 404001) {
            message.error(t('components.fork.button.notFound'));
          } else {
            message.error(errorMessage);
          }
          logger.error('Fork benchmark failed', { benchmarkId, error: err });
        } finally {
          setLoading(false);
        }
      },
    });
  }, [benchmarkId, benchmarkName, forkBenchmark, onForked, navigate, t]);

  return (
    <Button
      type={type}
      size={size}
      icon={showIcon ? <BranchesOutlined /> : undefined}
      loading={loading}
      onClick={handleFork}
      style={style}
      className={className}
    >
      {children ?? t('components.fork.button.default')}
    </Button>
  );
});

export default ForkButton;
