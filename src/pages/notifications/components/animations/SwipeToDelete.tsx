/**
 * SwipeToDelete Component
 * 扫除删除动画包装器
 *
 * 特性:
 * - 向右滑动 + 旋转淡出动画
 * - 支持删除前回调
 * - 支持自定义动画时长
 */

import { memo } from 'react';
import type { SwipeToDeleteProps } from '../../types';

export const SwipeToDelete = memo(function SwipeToDelete({
  children,
  isDeleting = false,
  className = '',
}: SwipeToDeleteProps) {
  if (isDeleting) return null;

  return (
    <div
      className={`swipe-to-delete-wrapper ${className} ${isDeleting ? 'removing' : ''}`}
    >
      {children}
    </div>
  );
});

export default SwipeToDelete;
