/**
 * 虚拟列表组件
 * 用于优化长列表渲染性能
 */

import { useRef } from 'react';
import { useVirtualScroll } from '@/utils/performance';

export interface VirtualListProps<T> {
  // 数据列表
  items: T[];
  // 每项高度（固定）
  itemHeight: number;
  // 容器高度
  height: number;
  // 渲染函数
  renderItem: (item: T, index: number) => React.ReactNode;
  // 额外渲染的项数（避免滚动时出现空白）
  overscan?: number;
  // 样式
  style?: React.CSSProperties;
  className?: string;
}

/**
 * 虚拟列表组件
 * 仅渲染可见区域内的列表项，大幅提升长列表性能
 */
export function VirtualList<T>({
  items,
  itemHeight,
  height,
  renderItem,
  overscan = 3,
  style,
  className,
}: VirtualListProps<T>) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const { visibleItems, totalHeight, handleScroll } = useVirtualScroll({
    itemCount: items.length,
    itemHeight,
    containerHeight: height,
    overscan,
  });

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className={className}
      style={{
        height,
        overflow: 'auto',
        ...style,
      }}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems.map((item) => (
          <div
            key={item.index}
            style={{
              position: 'absolute',
              top: item.offset,
              left: 0,
              right: 0,
              height: itemHeight,
            }}
          >
            {renderItem(items[item.index], item.index)}
          </div>
        ))}
      </div>
    </div>
  );
}

export default VirtualList;
