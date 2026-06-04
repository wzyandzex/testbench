/**
 * 3D 倾斜卡片组件
 * 鼠标移动时产生跟随式的 3D 透视效果
 */

import { useState, useRef, ReactNode } from 'react';
import { useIsDark } from '@/theme';

export interface TiltCardProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  intensity?: number; // 倾斜强度，默认 10
  glow?: boolean; // 是否启用边缘光晕效果
}

export const TiltCard = ({
  children,
  onClick,
  className = '',
  intensity = 10,
  glow = true,
}: TiltCardProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState('');
  const [glowStyle, setGlowStyle] = useState({});
  const isDark = useIsDark();

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = (y - centerY) / intensity;
    const rotateY = (centerX - x) / intensity;

    setTransform(
      `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`
    );

    // 计算光晕位置
    if (glow && isDark) {
      const percentX = (x / rect.width) * 100;
      const percentY = (y / rect.height) * 100;
      setGlowStyle({
        background: `radial-gradient(circle at ${percentX}% ${percentY}%, rgba(0, 212, 255, 0.15), transparent 50%)`,
      });
    }
  };

  const handleMouseLeave = () => {
    setTransform('');
    setGlowStyle({});
  };

  return (
    <div
      ref={ref}
      onClick={onClick}
      className={`tilt-card ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform,
        transition: 'transform 0.15s ease-out',
        position: 'relative',
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      {/* 光晕层 - 仅深色模式 */}
      {isDark && glow && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            borderRadius: 'inherit',
            ...glowStyle,
            transition: 'background 0.3s ease-out',
          }}
        />
      )}

      {children}
    </div>
  );
};

/**
 * 可拖拽的倾斜卡片组件
 * 结合 dnd-kit 使用
 */
export const DraggableTiltCard = ({
  children,
  isDragging,
  className = '',
}: {
  children: ReactNode;
  isDragging?: boolean;
  className?: string;
}) => {
  return (
    <div
      className={`draggable-tilt-card ${className}`}
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor: isDragging ? 'grabbing' : 'grab',
        transition: 'opacity 0.2s, transform 0.2s',
        transform: isDragging ? 'scale(1.05)' : 'scale(1)',
      }}
    >
      <TiltCard intensity={8} glow={!isDragging}>
        {children}
      </TiltCard>
    </div>
  );
};
