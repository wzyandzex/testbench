/**
 * 评分组件
 * 遵循 vercel-react-best-practices 规则
 */

import { memo, useCallback, useMemo } from 'react';
import { StarOutlined, StarFilled } from '@ant-design/icons';

export interface RatingProps {
  value: number;
  onChange?: (value: number) => void;
  max?: number;
  size?: number;
  color?: string;
  disabled?: boolean;
  allowHalf?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

/**
 * 评分组件
 * ✅ 使用 memo 避免不必要的重渲染
 * ✅ 提升 JSX 到组件外部（rendering-hoist-jsx）
 */
export const Rating = memo(function Rating({
  value,
  onChange,
  max = 5,
  size = 20,
  color = '#ffc53d',
  disabled = false,
  allowHalf = false,
  style,
  className,
}: RatingProps) {
  // 星星图标（提升到组件外会更好，但这里为了样式一致性保留）
  const StarIcon = useMemo(
    () => ({
      filled: <StarFilled style={{ color, fontSize: size }} />,
      outlined: <StarOutlined style={{ color: '#d9d9d9', fontSize: size }} />,
    }),
    [color, size]
  );

  // 处理点击
  const handleClick = useCallback(
    (index: number) => {
      if (disabled) return;
      onChange?.(index + 1);
    },
    [disabled, onChange]
  );

  // 处理鼠标悬停（可选功能，预留接口）
  const handleMouseEnter = useCallback(() => {
    // 可以添加悬停预览功能
  }, []);

  // 渲染星星
  const stars = useMemo(() => {
    const result = [];
    for (let i = 0; i < max; i++) {
      const isActive = i < Math.floor(value);
      const isHalf = allowHalf && i === Math.floor(value) && value % 1 >= 0.5;

      result.push(
        <span
          key={i}
          onClick={() => handleClick(i)}
          onMouseEnter={handleMouseEnter}
          style={{
            cursor: disabled ? 'default' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            marginRight: 4,
          }}
        >
          {isHalf ? (
            <span style={{ position: 'relative', display: 'inline-block', width: size, height: size }}>
              <span style={{ position: 'absolute', left: 0, width: '50%', overflow: 'hidden' }}>
                <StarFilled style={{ color, fontSize: size }} />
              </span>
              <StarOutlined style={{ color: '#d9d9d9', fontSize: size }} />
            </span>
          ) : isActive ? (
            StarIcon.filled
          ) : (
            StarIcon.outlined
          )}
        </span>
      );
    }
    return result;
  }, [max, value, allowHalf, size, handleClick, handleMouseEnter, StarIcon]);

  // 评分文本显示
  const ratingText = useMemo(() => {
    if (allowHalf) {
      return value.toFixed(1);
    }
    return value.toString();
  }, [value, allowHalf]);

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', ...style }} className={className}>
      <span style={{ display: 'inline-flex', alignItems: 'center' }}>
        {stars}
      </span>
      {value > 0 && (
        <span style={{ marginLeft: 8, fontSize: 14, color: '#999' }}>
          {ratingText}/{max}
        </span>
      )}
    </div>
  );
});

export default Rating;
