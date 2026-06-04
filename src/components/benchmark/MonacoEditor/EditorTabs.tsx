/**
 * 文件标签栏组件（VSCode 风格）
 */

import { memo, useCallback, MouseEvent, useRef, useMemo } from 'react';
import { CloseOutlined } from '@ant-design/icons';
import type { EditorTabProps } from './types';
import { LANGUAGE_CONFIG } from './types';
import { IDE_STYLES } from './types';
import { useTranslation } from 'react-i18next';
import { useIsDark } from '@/theme';

const EditorTabs = memo(function EditorTabs({
  files,
  activeFileId,
  onTabClick,
  onTabClose,
  onTabDragStart,
  onTabDragOver,
  onTabDrop,
  className = '',
}: EditorTabProps) {
  const { t } = useTranslation('benchmarks');
  const isDark = useIsDark();
  const styles = isDark ? IDE_STYLES.dark : IDE_STYLES.light;

  const dragSourceIdRef = useRef<string | null>(null);

  // 动态计算样式常量
  const tabsContainerStyle = useMemo<React.CSSProperties>(() => ({
    display: 'flex',
    alignItems: 'center',
    height: 35,
    backgroundColor: styles.bgTertiary,
    borderBottom: `1px solid ${styles.borderColor}`,
    overflowX: 'auto',
    overflowY: 'hidden',
    scrollbarWidth: 'thin',
  }), [styles]);

  const emptyTabsStyle = useMemo<React.CSSProperties>(() => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: 35,
    backgroundColor: styles.bgTertiary,
    borderBottom: `1px solid ${styles.borderColor}`,
  }), [styles]);

  const tabStyle = useMemo<React.CSSProperties>(() => ({
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '0 12px',
    height: '100%',
    minWidth: 80,
    maxWidth: 200,
    fontSize: 13,
    borderRight: `1px solid ${styles.borderColor}`,
    cursor: 'pointer',
    userSelect: 'none',
    transition: 'background-color 0.15s',
    position: 'relative',
  }), [styles]);

  const activeTabStyle = useMemo<React.CSSProperties>(() => ({
    backgroundColor: styles.tabActive,
    borderBottom: '2px solid transparent',
    marginBottom: -1,
  }), [styles]);

  const inactiveTabStyle = useMemo<React.CSSProperties>(() => ({
    backgroundColor: styles.tabInactive,
  }), [styles]);

  const handleDragStart = useCallback(
    (fileId: string, e: React.DragEvent) => {
      dragSourceIdRef.current = fileId;
      onTabDragStart?.(fileId, e);
      e.dataTransfer.effectAllowed = 'move';
    },
    [onTabDragStart]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      onTabDragOver?.(e);
    },
    [onTabDragOver]
  );

  const handleDrop = useCallback(
    (targetFileId: string, e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (dragSourceIdRef.current && dragSourceIdRef.current !== targetFileId) {
        onTabDrop?.(targetFileId, e);
      }
      dragSourceIdRef.current = null;
    },
    [onTabDrop]
  );

  const handleClose = useCallback(
    (fileId: string, e: MouseEvent) => {
      e.stopPropagation();
      onTabClose(fileId, e);
    },
    [onTabClose]
  );

  if (files.length === 0) {
    return (
      <div className={`editor-tabs-empty ${className}`} style={emptyTabsStyle}>
        <span style={{ color: '#999', fontSize: 12 }}>{t('components.editor.tabs.empty')}</span>
      </div>
    );
  }

  return (
    <div
      className={`editor-tabs ${className}`}
      style={tabsContainerStyle}
      onDragOver={handleDragOver}
    >
      {files.map((file) => {
        const isActive = file.id === activeFileId;
        const langConfig = LANGUAGE_CONFIG[file.language];

        return (
          <div
            key={file.id}
            className={`editor-tab ${isActive ? 'active' : ''}`}
            style={{
              ...tabStyle,
              ...(isActive ? activeTabStyle : inactiveTabStyle),
            }}
            onClick={() => onTabClick(file.id)}
            draggable
            onDragStart={(e) => handleDragStart(file.id, e)}
            onDrop={(e) => handleDrop(file.id, e)}
          >
            {/* 文件图标 */}
            <span className="tab-icon" style={tabIconStyle}>
              {langConfig?.icon || '📄'}
            </span>

            {/* 文件名 */}
            <span className="tab-name" style={tabNameStyle}>
              {file.name}
            </span>

            {/* 修改指示器 */}
            {file.isModified && (
              <span className="tab-modified" style={modifiedIndicatorStyle} />
            )}

            {/* 关闭按钮 */}
            <button
              type="button"
              className="tab-close"
              style={closeButtonStyle}
              onClick={(e) => handleClose(file.id, e)}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <CloseOutlined style={{ fontSize: 10 }} />
            </button>
          </div>
        );
      })}
    </div>
  );
});

// 静态样式常量（不依赖主题）
const tabIconStyle: React.CSSProperties = {
  fontSize: 14,
  flexShrink: 0,
};

const tabNameStyle: React.CSSProperties = {
  flex: 1,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const modifiedIndicatorStyle: React.CSSProperties = {
  width: 6,
  height: 6,
  borderRadius: '50%',
  backgroundColor: '#1677ff',
  flexShrink: 0,
};

const closeButtonStyle: React.CSSProperties = {
  display: 'none',
  alignItems: 'center',
  justifyContent: 'center',
  width: 18,
  height: 18,
  borderRadius: 3,
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  padding: 0,
  color: '#666',
  flexShrink: 0,
};

// 添加悬停效果（通过 CSS-in-JS）
if (typeof document !== 'undefined') {
  const sheet = document.createElement('style');
  sheet.textContent = `
    .editor-tab:hover .tab-close {
      display: flex;
    }
    .editor-tab.active .tab-close {
      display: flex;
    }
    .tab-close:hover {
      background-color: rgba(0, 0, 0, 0.08) !important;
    }
    .editor-tabs::-webkit-scrollbar {
      height: 3px;
    }
    .editor-tabs::-webkit-scrollbar-thumb {
      background-color: #d9d9d9;
      border-radius: 3px;
    }
  `;
  document.head.appendChild(sheet);
}

export default EditorTabs;
