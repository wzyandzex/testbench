/**
 * CollapseSection Component
 * 区块折叠动画组件
 *
 * 特性:
 * - max-height 过渡动画
 * - 支持展开/折叠状态
 * - 自动计算内容高度
 */

import { useState, useRef, useEffect, memo } from 'react';
import type { CollapseSectionProps } from '../../types';

export const CollapseSection = memo(function CollapseSection({
  isOpen,
  children,
  duration = 300,
  className = '',
}: CollapseSectionProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number>(0);

  useEffect(() => {
    if (contentRef.current) {
      if (isOpen) {
        setHeight(contentRef.current.scrollHeight);
      } else {
        setHeight(0);
      }
    }
  }, [isOpen, children]);

  return (
    <div
      className={`collapse-section-wrapper ${className}`}
      style={{
        overflow: 'hidden',
        transition: `height ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`,
        height: `${height}px`,
      }}
    >
      <div ref={contentRef}>
        {children}
      </div>
    </div>
  );
});

export default CollapseSection;
