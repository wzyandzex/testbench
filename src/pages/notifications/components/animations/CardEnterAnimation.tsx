/**
 * CardEnterAnimation Component
 * 卡片入场动画包装器
 *
 * 特性:
 * - Staggered 淡入动画
 * - 每个延迟递增（通过 index 计算）
 * - 支持 translateY + scale 组合动画
 */

import { memo } from 'react';
import type { CardEnterAnimationProps } from '../../types';

export const CardEnterAnimation = memo(function CardEnterAnimation({
  children,
  index = 0,
  delay = 50,
  duration = 400,
  className = '',
}: CardEnterAnimationProps) {
  const animationDelay = `${index * delay}ms`;
  const animationDuration = `${duration}ms`;

  return (
    <div
      className={`card-enter-wrapper ${className}`}
      style={{
        opacity: 0,
        animation: `notificationCardEnter ${animationDuration}ms ease-out forwards`,
        animationDelay,
      } as React.CSSProperties}
    >
      {children}
    </div>
  );
});

export default CardEnterAnimation;
