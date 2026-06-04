/**
 * 可调整大小的分屏容器组件
 */

import { memo, useState, useRef, useCallback, useEffect, useMemo } from 'react';
import type { SplitPaneProps } from './types';
import { IDE_STYLES, IDE_SPACING } from './types';
import { useIsDark } from '@/theme';

// 默认预设比例
const DEFAULT_PRESETS = [0.3, 0.4, 0.5, 0.6, 0.7];

const SplitPane = memo(function SplitPane({
  direction,
  defaultRatio = 0.4,
  minSize = 0.2,
  maxSize = 0.8,
  children,
  ratioPresets = DEFAULT_PRESETS,
  onRatioChange,
  className = '',
  style,
  firstPaneClassName = '',
  secondPaneClassName = '',
  disabled = false,
}: SplitPaneProps) {
  const isDark = useIsDark();
  const styles = isDark ? IDE_STYLES.dark : IDE_STYLES.light;

  const [ratio, setRatio] = useState(defaultRatio);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startPosRef = useRef(0);
  const startRatioRef = useRef(0);

  // 处理比例变化
  const handleRatioChange = useCallback(
    (newRatio: number) => {
      const clampedRatio = Math.max(minSize, Math.min(maxSize, newRatio));
      setRatio(clampedRatio);
      onRatioChange?.(clampedRatio);
    },
    [minSize, maxSize, onRatioChange]
  );

  // 开始拖拽
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (disabled) return;

      e.preventDefault();
      setIsResizing(true);
      startPosRef.current = direction === 'horizontal' ? e.clientX : e.clientY;
      startRatioRef.current = ratio;

      // 添加事件监听
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      // 禁止文本选择
      document.body.style.userSelect = 'none';
    },
    [disabled, direction, ratio]
  );

  // 鼠标移动
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing || !containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const containerSize =
        direction === 'horizontal'
          ? containerRect.width
          : containerRect.height;

      const delta =
        direction === 'horizontal'
          ? e.clientX - startPosRef.current
          : e.clientY - startPosRef.current;

      const deltaRatio = delta / containerSize;
      const newRatio = startRatioRef.current + deltaRatio;

      handleRatioChange(newRatio);
    },
    [isResizing, direction, handleRatioChange]
  );

  // 鼠标释放
  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.body.style.userSelect = '';
  }, [handleMouseMove]);

  // 清理事件监听
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
    };
  }, [handleMouseMove, handleMouseUp]);

  // 预设比例按钮
  const presetButtons = useMemo(() => {
    return ratioPresets.map((preset) => {
      const percentage = Math.round(preset * 100);
      const isActive = Math.abs(ratio - preset) < 0.05;

      return (
        <button
          key={preset}
          type="button"
          onClick={() => handleRatioChange(preset)}
          style={{
            ...presetButtonStyle,
            ...(isActive ? presetButtonActiveStyle : {}),
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {100 - percentage}:{percentage}
        </button>
      );
    });
  }, [ratioPresets, ratio, handleRatioChange]);

  // 计算面板尺寸
  const firstPaneStyle = useMemo(() => {
    if (direction === 'horizontal') {
      return { width: `${ratio * 100}%`, height: '100%' };
    }
    return { height: `${ratio * 100}%`, width: '100%' };
  }, [direction, ratio]);

  const secondPaneStyle = useMemo(() => {
    if (direction === 'horizontal') {
      return { width: `${(1 - ratio) * 100}%`, height: '100%' };
    }
    return { height: `${(1 - ratio) * 100}%`, width: '100%' };
  }, [direction, ratio]);

  // 拖拽手柄样式
  const resizerStyle = useMemo(() => {
    const base: React.CSSProperties = {
      position: 'absolute',
      zIndex: 10,
      transition: isResizing ? 'none' : 'background-color 0.2s',
      cursor: disabled ? 'default' : direction === 'horizontal' ? 'col-resize' : 'row-resize',
    };

    if (direction === 'horizontal') {
      return {
        ...base,
        left: `${ratio * 100}%`,
        top: 0,
        bottom: 0,
        width: IDE_SPACING.visibleResizeHandle,
        transform: 'translateX(-50%)',
      };
    }

    return {
      ...base,
      top: `${ratio * 100}%`,
      left: 0,
      right: 0,
      height: IDE_SPACING.visibleResizeHandle,
      transform: 'translateY(-50%)',
    };
  }, [direction, ratio, isResizing, disabled]);

  return (
    <div
      ref={containerRef}
      className={`split-pane-container ${className}`}
      style={{
        ...containerStyle,
        ...style,
        flexDirection: direction === 'horizontal' ? 'row' : 'column',
      }}
    >
      {/* 第一个面板 */}
      <div
        className={`split-pane-first ${firstPaneClassName}`}
        style={{ ...paneStyle, ...firstPaneStyle }}
      >
        {children[0]}
      </div>

      {/* 拖拽手柄 */}
      {!disabled && (
        <div
          className="split-pane-resizer"
          style={{
            ...resizerStyle,
            backgroundColor: isResizing
              ? styles.resizeHandleHover
              : styles.resizeHandle,
          }}
          onMouseDown={handleMouseDown}
        />
      )}

      {/* 第二个面板 */}
      <div
        className={`split-pane-second ${secondPaneClassName}`}
        style={{ ...paneStyle, ...secondPaneStyle }}
      >
        {children[1]}
      </div>

      {/* 预设比例工具栏 */}
      {!disabled && (
        <div className="split-pane-presets" style={presetsToolbarStyle}>
          {presetButtons}
        </div>
      )}
    </div>
  );
});

// 样式常量
const containerStyle: React.CSSProperties = {
  display: 'flex',
  position: 'relative',
  overflow: 'hidden',
  width: '100%',
  height: '100%',
};

const paneStyle: React.CSSProperties = {
  overflow: 'hidden',
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
};

const presetsToolbarStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: 8,
  left: '50%',
  transform: 'translateX(-50%)',
  display: 'flex',
  gap: 4,
  padding: '4px 8px',
  backgroundColor: 'rgba(255, 255, 255, 0.95)',
  borderRadius: 6,
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  zIndex: 20,
  fontSize: 11,
};

const presetButtonStyle: React.CSSProperties = {
  padding: '2px 6px',
  border: '1px solid #d9d9d9',
  borderRadius: 3,
  backgroundColor: '#fff',
  cursor: 'pointer',
  fontSize: 11,
  color: '#666',
  transition: 'all 0.2s',
};

const presetButtonActiveStyle: React.CSSProperties = {
  borderColor: '#1677ff',
  color: '#1677ff',
  backgroundColor: '#e6f4ff',
};

export default SplitPane;
