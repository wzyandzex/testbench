/**
 * 动画配置
 * 统一管理页面中的动画效果
 */

import { CSSProperties } from 'react';

/**
 * 淡入向上动画
 */
export const fadeInUp = {
  initial: { opacity: 0, transform: 'translateY(20px)' },
  animate: { opacity: 1, transform: 'translateY(0)' },
  transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
};

/**
 * 淡入动画
 */
export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.3, ease: 'easeOut' },
};

/**
 * 缩放淡入动画
 */
export const scaleIn = {
  initial: { opacity: 0, transform: 'scale(0.95)' },
  animate: { opacity: 1, transform: 'scale(1)' },
  transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
};

/**
 * 滑入动画（从左侧）
 */
export const slideInLeft = {
  initial: { opacity: 0, transform: 'translateX(-20px)' },
  animate: { opacity: 1, transform: 'translateX(0)' },
  transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
};

/**
 * 滑入动画（从右侧）
 */
export const slideInRight = {
  initial: { opacity: 0, transform: 'translateX(20px)' },
  animate: { opacity: 1, transform: 'translateX(0)' },
  transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
};

/**
 * 交错子元素动画配置
 */
export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.05,
    },
  },
};

/**
 * 卡片进入动画样式
 */
export const useCardEnterAnimation = (delay: number = 0): CSSProperties => ({
  opacity: 0,
  transform: 'translateY(20px)',
  animation: `cardEnter 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms forwards`,
});

/**
 * 闪烁动画样式
 */
export const useShimmerAnimation = (): CSSProperties => ({
  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
  backgroundSize: '200% 100%',
  animation: 'shimmer 1.5s infinite',
});

/**
 * 脉冲动画样式
 */
export const usePulseAnimation = (color?: string): CSSProperties => ({
  animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
  boxShadow: color ? `0 0 0 0 ${color}40` : undefined,
});

/**
 * 旋转动画样式
 */
export const useSpinAnimation = (): CSSProperties => ({
  animation: 'spin 1s linear infinite',
});

/**
 * 弹跳动画样式
 */
export const useBounceAnimation = (): CSSProperties => ({
  animation: 'bounce 1s infinite',
});

/**
 * 悬停缩放动画
 */
export const hoverScale = {
  transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
  '&:hover': {
    transform: 'scale(1.02)',
  },
};

/**
 * 悬停升起动画
 */
export const hoverLift = {
  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
  },
};

/**
 * 关键帧动画定义
 * 需要在全局 CSS 中注入或在组件的 style 标签中使用
 */
export const keyframes = `
@keyframes cardEnter {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
    animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
  }
  50% {
    transform: translateY(-25%);
    animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
  }
}

@keyframes glow-pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

@keyframes breathe-glow {
  0%, 100% {
    box-shadow: 0 0 20px var(--glow-color, rgba(102, 126, 234, 0.25));
  }
  50% {
    box-shadow: 0 0 40px var(--glow-color, rgba(102, 126, 234, 0.4));
  }
}

@keyframes fadeSlideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes ripple {
  to {
    transform: scale(4);
    opacity: 0;
  }
}
`;

/**
 * 骨架屏动画样式
 */
export const skeletonStyle: CSSProperties = {
  background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
  backgroundSize: '200% 100%',
  animation: 'shimmer 1.5s infinite',
  borderRadius: 4,
};

/**
 * 深色模式骨架屏样式
 */
export const skeletonDarkStyle: CSSProperties = {
  background: 'linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 75%)',
  backgroundSize: '200% 100%',
  animation: 'shimmer 1.5s infinite',
  borderRadius: 4,
};

/**
 * 获取骨架屏样式
 */
export const useSkeletonStyle = (isDark: boolean): CSSProperties => {
  return isDark ? skeletonDarkStyle : skeletonStyle;
};

/**
 * 过渡配置
 */
export const transitions = {
  fast: 'all 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
  normal: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
  slow: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
  bounce: 'all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
};

/**
 * 缓动函数
 */
export const easings = {
  ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
  easeIn: [0.42, 0, 1, 1] as [number, number, number, number],
  easeOut: [0, 0, 0.58, 1] as [number, number, number, number],
  easeInOut: [0.42, 0, 0.58, 1] as [number, number, number, number],
};
