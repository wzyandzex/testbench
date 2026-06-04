/**
 * CreateTaskModal Style Constants
 * "Chronos Command Interface" - 时空命令接口样式常量
 */

import type { CSSProperties } from 'react';
import { getSchedulerTheme } from '../../theme';

// ==================== 主题颜色获取 ====================
export const getModalTheme = (isDark: boolean, token: any = {}) => {
  const baseTheme = getSchedulerTheme(isDark);

  return {
    ...baseTheme,
    // 模态框专用颜色
    modalBackground: isDark
      ? 'linear-gradient(180deg, #0a0e27 0%, #1a1f3a 100%)'
      : token.colorBgContainer || '#ffffff',
    modalContentBg: isDark
      ? 'rgba(15, 23, 42, 0.95)'
      : token.colorBgLayout || '#f8fafc',
    panelBg: isDark
      ? 'rgba(26, 31, 58, 0.6)'
      : token.colorBgContainer || '#ffffff',
    inputBg: isDark
      ? 'rgba(15, 23, 42, 0.8)'
      : '#ffffff',
    inputBorder: isDark
      ? 'rgba(99, 102, 241, 0.3)'
      : '#e2e8f0',
    inputBorderHover: isDark
      ? 'rgba(0, 245, 255, 0.5)'
      : '#cbd5e1',
    cardBg: isDark
      ? 'rgba(30, 41, 59, 0.5)'
      : '#f1f5f9',
    cardSelectedBg: isDark
      ? 'rgba(0, 245, 255, 0.15)'
      : 'rgba(8, 145, 178, 0.1)',
    cardSelectedBorder: isDark
      ? 'rgba(0, 245, 255, 0.5)'
      : '#0891b2',
  };
};

// ==================== 主容器样式 ====================
export const getModalContainerStyle = (_isDark: boolean): CSSProperties => ({
  display: 'flex',
  gap: '24px',
  minHeight: '500px',
});

// ==================== 左侧面板样式 ====================
export const getLeftPanelStyle = (_isDark: boolean): CSSProperties => ({
  flex: '0 0 340px',
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
});

// ==================== 右侧面板样式 ====================
export const getRightPanelStyle = (_isDark: boolean): CSSProperties => ({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
});

// ==================== 命令指令面板样式 ====================
export const getCommandPanelStyle = (isDark: boolean) => {
  const theme = getModalTheme(isDark);

  return {
    container: {
      borderRadius: isDark ? '16px' : '12px',
      padding: isDark ? '24px' : '20px',
      background: theme.panelBg,
      border: isDark ? `1px solid ${theme.cardBorder}` : `1px solid ${theme.inputBorder}`,
      position: 'relative' as const,
      overflow: 'hidden' as const,
    } as CSSProperties,

    header: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      marginBottom: '20px',
      fontSize: '15px',
      fontWeight: 600,
      color: theme.textPrimary,
      letterSpacing: '0.5px',
      textTransform: 'uppercase' as const,
    } as CSSProperties,

    headerIcon: {
      fontSize: '18px',
      color: theme.accentCyan,
    } as CSSProperties,

    input: {
      background: theme.inputBg,
      border: `1px solid ${theme.inputBorder}`,
      borderRadius: isDark ? '10px' : '8px',
      padding: '12px 16px',
      fontSize: '14px',
      color: theme.textPrimary,
      transition: 'all 0.3s ease',
    } as CSSProperties,

    inputFocus: {
      borderColor: theme.accentCyan,
      boxShadow: isDark ? `0 0 0 2px ${theme.statusActiveBg}` : `0 0 0 2px ${theme.statusActiveBg}`,
    } as CSSProperties,

    textarea: {
      background: theme.inputBg,
      border: `1px solid ${theme.inputBorder}`,
      borderRadius: isDark ? '10px' : '8px',
      padding: '12px 16px',
      fontSize: '14px',
      color: theme.textPrimary,
      resize: 'none' as const,
      transition: 'all 0.3s ease',
    } as CSSProperties,

    label: {
      fontSize: '13px',
      fontWeight: 500,
      color: theme.textSecondary,
      marginBottom: '8px',
      display: 'block' as const,
    } as CSSProperties,
  };
};

// ==================== 时间轮面板样式 ====================
export const getTimeWheelPanelStyle = (isDark: boolean) => {
  const theme = getModalTheme(isDark);

  return {
    container: {
      borderRadius: isDark ? '16px' : '12px',
      padding: isDark ? '24px' : '20px',
      background: theme.panelBg,
      border: isDark ? `1px solid ${theme.cardBorder}` : `1px solid ${theme.inputBorder}`,
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
    } as CSSProperties,

    header: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      marginBottom: '16px',
      fontSize: '15px',
      fontWeight: 600,
      color: theme.textPrimary,
      letterSpacing: '0.5px',
      textTransform: 'uppercase' as const,
    } as CSSProperties,

    wheelContainer: {
      position: 'relative' as const,
      width: '280px',
      height: '280px',
    } as CSSProperties,

    svg: {
      width: '100%',
      height: '100%',
      filter: isDark ? 'drop-shadow(0 0 20px rgba(0, 245, 255, 0.2))' : 'none',
    } as CSSProperties,
  };
};

// ==================== 调度预览面板样式 ====================
export const getSchedulePreviewStyle = (isDark: boolean) => {
  const theme = getModalTheme(isDark);

  return {
    container: {
      borderRadius: isDark ? '12px' : '10px',
      padding: isDark ? '16px 20px' : '14px 16px',
      background: isDark ? 'rgba(0, 245, 255, 0.05)' : 'rgba(8, 145, 178, 0.05)',
      border: isDark ? `1px solid ${theme.statusActiveBg}` : `1px solid ${theme.statusActiveBg}`,
      marginTop: '16px',
      width: '100%',
    } as CSSProperties,

    cronDisplay: {
      fontFamily: 'monospace',
      fontSize: isDark ? '13px' : '12px',
      padding: '8px 12px',
      background: isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.05)',
      borderRadius: '8px',
      marginBottom: '8px',
      display: 'inline-block' as const,
    } as CSSProperties,

    cronCode: {
      color: theme.accentCyan,
      fontSize: '14px',
      fontWeight: 600,
    } as CSSProperties,

    humanReadable: {
      fontSize: '14px',
      color: theme.textPrimary,
      marginBottom: '6px',
      fontWeight: 500,
    } as CSSProperties,

    nextRun: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '13px',
      color: theme.textSecondary,
    } as CSSProperties,

    nextRunIcon: {
      color: theme.accentMagenta,
    } as CSSProperties,
  };
};

// ==================== 资源部署面板样式 ====================
export const getAssetDeploymentStyle = (isDark: boolean) => {
  const theme = getModalTheme(isDark);

  return {
    container: {
      borderRadius: isDark ? '16px' : '12px',
      padding: isDark ? '24px' : '20px',
      background: theme.panelBg,
      border: isDark ? `1px solid ${theme.cardBorder}` : `1px solid ${theme.inputBorder}`,
      marginTop: '20px',
    } as CSSProperties,

    header: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      marginBottom: '20px',
      fontSize: '15px',
      fontWeight: 600,
      color: theme.textPrimary,
      letterSpacing: '0.5px',
      textTransform: 'uppercase' as const,
    } as CSSProperties,

    section: {
      marginBottom: '20px',
    } as CSSProperties,

    sectionTitle: {
      fontSize: '14px',
      fontWeight: 500,
      color: theme.textSecondary,
      marginBottom: '12px',
    } as CSSProperties,

    cardGrid: {
      display: 'grid' as const,
      gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
      gap: '12px',
    } as CSSProperties,

    card: (selected: boolean): CSSProperties => ({
      borderRadius: isDark ? '12px' : '10px',
      padding: isDark ? '16px' : '14px',
      background: selected ? theme.cardSelectedBg : theme.cardBg,
      border: `1px solid ${selected ? theme.cardSelectedBorder : 'transparent'}`,
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      textAlign: 'center' as const,
      position: 'relative' as const,
      overflow: 'hidden' as const,
    }),

    cardIcon: {
      fontSize: '28px',
      marginBottom: '8px',
      display: 'block' as const,
    } as CSSProperties,

    cardLabel: {
      fontSize: '13px',
      fontWeight: 500,
      color: theme.textPrimary,
    } as CSSProperties,

    checkbox: {
      position: 'absolute' as const,
      top: '8px',
      right: '8px',
    } as CSSProperties,
  };
};

// ==================== 执行参数面板样式 ====================
export const getExecutionParamsStyle = (isDark: boolean) => {
  const theme = getModalTheme(isDark);

  return {
    container: {
      borderRadius: isDark ? '16px' : '12px',
      padding: isDark ? '24px' : '20px',
      background: theme.panelBg,
      border: isDark ? `1px solid ${theme.cardBorder}` : `1px solid ${theme.inputBorder}`,
      marginTop: '20px',
    } as CSSProperties,

    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '16px',
    } as CSSProperties,

    headerLeft: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      fontSize: '15px',
      fontWeight: 600,
      color: theme.textPrimary,
      letterSpacing: '0.5px',
      textTransform: 'uppercase' as const,
    } as CSSProperties,

    paramRow: {
      display: 'flex' as const,
      gap: '16px',
      flexWrap: 'wrap' as const,
    } as CSSProperties,

    paramItem: {
      flex: '1 1 140px',
      minWidth: '140px',
    } as CSSProperties,
  };
};

// ==================== 底部操作栏样式 ====================
export const getModalActionsStyle = (isDark: boolean) => {
  const theme = getModalTheme(isDark);

  return {
    container: {
      display: 'flex',
      justifyContent: 'flex-end',
      alignItems: 'center',
      gap: '12px',
      marginTop: '24px',
      paddingTop: '20px',
      borderTop: isDark ? `1px solid ${theme.cardBorder}` : `1px solid ${theme.inputBorder}`,
    } as CSSProperties,

    cancelButton: {
      borderRadius: isDark ? '10px' : '8px',
      height: '42px',
      padding: '0 24px',
      fontWeight: 500,
    } as CSSProperties,

    submitButton: {
      borderRadius: isDark ? '10px' : '8px',
      height: '42px',
      padding: '0 32px',
      fontWeight: 600,
      background: theme.gradientPrimary,
      border: 'none',
      ...(isDark && {
        boxShadow: theme.neonGlow,
      }),
    } as CSSProperties,
  };
};

// ==================== 时间轮组件样式 ====================
export const getTimeWheelSegmentStyle = (
  isDark: boolean,
  selected: boolean,
  _index: number,
  _total: number
) => {
  const theme = getModalTheme(isDark);

  return {
    path: {
      fill: selected
        ? (isDark ? 'rgba(0, 245, 255, 0.3)' : 'rgba(8, 145, 178, 0.3)')
        : (isDark ? 'rgba(148, 163, 184, 0.1)' : 'rgba(148, 163, 184, 0.1)'),
      stroke: selected
        ? theme.accentCyan
        : (isDark ? 'rgba(148, 163, 184, 0.3)' : 'rgba(148, 163, 184, 0.3)'),
      strokeWidth: selected ? 2 : 1,
      transition: 'all 0.3s ease',
      cursor: 'pointer',
    } as CSSProperties,

    text: {
      fill: selected ? theme.accentCyan : theme.textSecondary,
      fontSize: '12px',
      fontWeight: selected ? 600 : 400,
      textAnchor: 'middle' as const,
      dominantBaseline: 'middle' as const,
      pointerEvents: 'none' as const,
    } as CSSProperties,

    hoverGlow: isDark ? `filter: drop-shadow(0 0 8px ${theme.accentCyan})` : '',
  };
};

// ==================== 时间环样式 ====================
export const getTimeRingStyle = (isDark: boolean, ringIndex: 0 | 1 | 2) => {
  const radius = [120, 90, 60][ringIndex];
  const strokeWidth = [20, 24, 28][ringIndex];

  return {
    circle: {
      fill: 'none',
      stroke: isDark ? 'rgba(148, 163, 184, 0.1)' : 'rgba(148, 163, 184, 0.2)',
      strokeWidth,
      r: radius,
    } as CSSProperties,

    activeSegment: (color: string): CSSProperties => ({
      fill: 'none',
      stroke: color,
      strokeWidth,
      strokeLinecap: 'round' as const,
      opacity: 0.8,
    }),
  };
};

// ==================== 中心显示样式 ====================
export const getCenterDisplayStyle = (isDark: boolean) => {
  const theme = getModalTheme(isDark);

  return {
    container: {
      position: 'absolute' as const,
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      textAlign: 'center' as const,
    } as CSSProperties,

    time: {
      fontSize: isDark ? '28px' : '24px',
      fontWeight: 700,
      color: theme.textPrimary,
      fontFamily: 'monospace',
    } as CSSProperties,

    label: {
      fontSize: '11px',
      color: theme.textSecondary,
      textTransform: 'uppercase' as const,
      marginTop: '4px',
    } as CSSProperties,
  };
};

// ==================== 动画样式 ====================
export const getAnimationStyles = (isDark: boolean): string => {
  if (!isDark) return '';

  return `
    @keyframes wheel-enter {
      from {
        opacity: 0;
        transform: rotate(-180deg) scale(0.5);
      }
      to {
        opacity: 1;
        transform: rotate(0) scale(1);
      }
    }

    @keyframes segment-pulse {
      0%, 100% {
        filter: drop-shadow(0 0 4px rgba(0, 245, 255, 0.3));
      }
      50% {
        filter: drop-shadow(0 0 12px rgba(0, 245, 255, 0.6));
      }
    }

    @keyframes ripple {
      0% {
        transform: scale(0);
        opacity: 0.8;
      }
      100% {
        transform: scale(2);
        opacity: 0;
      }
    }

    .wheel-enter {
      animation: wheel-enter 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    }

    .segment-pulse {
      animation: segment-pulse 2s ease-in-out infinite;
    }

    .ripple-effect {
      animation: ripple 0.6s ease-out forwards;
    }
  `;
};

// ==================== 优先级选项 ====================
export const PRIORITY_OPTIONS = [
  { label: 'P1 (高)', value: 'p1', color: '#ef4444' },
  { label: 'P2 (中)', value: 'p2', color: '#f59e0b' },
  { label: 'P3 (低)', value: 'p3', color: '#64748b' },
] as const;
