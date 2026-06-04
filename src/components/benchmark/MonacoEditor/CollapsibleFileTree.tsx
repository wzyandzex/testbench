/**
 * 可收起的文件树侧边栏（VSCode 风格）
 * 收起后显示迷你图标栏
 */

import { memo, useState, useCallback, useEffect, useMemo } from 'react';
import { FileOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons';
import type { CodeFile } from './types';
import { LANGUAGE_CONFIG, IDE_STYLES } from './types';
import { Tooltip } from 'antd';
import { useTranslation } from 'react-i18next';
import { useIsDark } from '@/theme';

interface CollapsibleFileTreeProps {
  files: CodeFile[];
  activeFileId: string | null;
  onFileSelect: (fileId: string) => void;
  className?: string;
  defaultWidth?: number;
  miniWidth?: number;
}

export const CollapsibleFileTree = memo(function CollapsibleFileTree({
  files,
  activeFileId,
  onFileSelect,
  className = '',
  defaultWidth = 240,
  miniWidth = 48,
}: CollapsibleFileTreeProps) {
  const { t } = useTranslation('benchmarks');
  const isDark = useIsDark();
  const styles = isDark ? IDE_STYLES.dark : IDE_STYLES.light;
  const textColor = isDark ? '#cccccc' : '#666666';
  const emptyColor = isDark ? '#858585' : '#999999';
  const emptyIconColor = isDark ? '#4d4d4d' : '#d9d9d9';

  const [isCollapsed, setIsCollapsed] = useState(false);

  // 动态计算样式常量
  const containerStyle = useMemo<React.CSSProperties>(() => ({
    display: 'flex',
    alignItems: 'stretch',
    height: '100%',
    flexShrink: 0,
    backgroundColor: styles.sidebar,
    borderRight: `1px solid ${styles.borderColor}`,
  }), [styles]);

  const headerStyle = useMemo<React.CSSProperties>(() => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 12px',
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase',
    color: textColor,
    borderBottom: `1px solid ${styles.borderColor}`,
    height: 35,
    boxSizing: 'border-box',
  }), [styles, textColor]);

  const titleStyle = useMemo<React.CSSProperties>(() => ({
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase',
    color: textColor,
  }), [textColor]);

  const collapseButtonStyle = useMemo<React.CSSProperties>(() => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 24,
    height: 24,
    borderRadius: 4,
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    color: textColor,
    transition: 'all 0.2s',
  }), [textColor]);

  const emptyStateStyle = useMemo<React.CSSProperties>(() => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    color: emptyColor,
  }), [emptyColor]);

  const fileItemActiveStyle = useMemo<React.CSSProperties>(() => ({
    backgroundColor: styles.hover,
  }), [styles]);

  const modifiedDotStyle = useMemo<React.CSSProperties>(() => ({
    width: 8,
    height: 8,
    borderRadius: '50%',
    backgroundColor: styles.accent,
    flexShrink: 0,
  }), [styles]);

  const miniItemActiveStyle = useMemo<React.CSSProperties>(() => ({
    backgroundColor: styles.hover,
  }), [styles]);

  const activeIndicatorStyle = useMemo<React.CSSProperties>(() => ({
    position: 'absolute',
    left: 4,
    width: 3,
    height: 20,
    borderRadius: 2,
    backgroundColor: styles.accent,
  }), [styles]);

  const dividerStyle = useMemo<React.CSSProperties>(() => ({
    width: 1,
    backgroundColor: styles.borderColor,
  }), [styles]);

  const handleToggle = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  const handleFileSelect = useCallback(
    (fileId: string) => {
      onFileSelect(fileId);
      if (isCollapsed) {
        setIsCollapsed(false);
      }
    },
    [onFileSelect, isCollapsed]
  );

  // 快捷键 Ctrl+B 切换文件树
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        handleToggle();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleToggle]);

  return (
    <div
      className={`collapsible-file-tree ${isCollapsed ? 'collapsed' : ''} ${className}`}
      style={containerStyle}
    >
      {/* 文件树主体 */}
      <div
        className="file-tree-panel"
        style={{
          ...fileTreePanelStyle,
          width: isCollapsed ? miniWidth : defaultWidth,
        }}
      >
        {/* 头部 */}
        <div style={headerStyle}>
          {!isCollapsed ? (
            <>
              <span style={titleStyle}>{t('components.editor.collapsibleTree.title')}</span>
              <button
                type="button"
                onClick={handleToggle}
                style={collapseButtonStyle}
                title={t('components.editor.collapsibleTree.collapse')}
              >
                <LeftOutlined style={{ fontSize: 12 }} />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleToggle}
              style={expandButtonStyle}
              title={t('components.editor.collapsibleTree.expand')}
            >
              <RightOutlined style={{ fontSize: 12 }} />
            </button>
          )}
        </div>

        {/* 文件列表 */}
        {!isCollapsed ? (
          <div style={fileListStyle}>
            {files.length === 0 ? (
              <div style={emptyStateStyle}>
                <FileOutlined style={{ fontSize: 24, color: emptyIconColor, marginBottom: 8 }} />
                <span style={{ fontSize: 12, color: emptyColor }}>{t('components.editor.collapsibleTree.empty')}</span>
              </div>
            ) : (
              files.map((file) => {
                const langConfig = LANGUAGE_CONFIG[file.language];
                const isActive = file.id === activeFileId;

                return (
                  <div
                    key={file.id}
                    className={`file-item ${isActive ? 'active' : ''}`}
                    style={{
                      ...fileItemStyle,
                      ...(isActive ? fileItemActiveStyle : {}),
                    }}
                    onClick={() => handleFileSelect(file.id)}
                  >
                    <span className="file-icon" style={fileIconStyle}>
                      {langConfig?.icon || '📄'}
                    </span>
                    <span className="file-name" style={fileNameStyle}>
                      {file.name}
                    </span>
                    {file.isModified && <span style={modifiedDotStyle} />}
                  </div>
                );
              })
            )}
          </div>
        ) : (
          /* 迷你图标栏 */
          <div style={miniIconsStyle}>
            {files.map((file) => {
              const langConfig = LANGUAGE_CONFIG[file.language];
              const isActive = file.id === activeFileId;

              return (
                <Tooltip key={file.id} title={file.name} placement="right">
                  <div
                    className={`mini-file-item ${isActive ? 'active' : ''}`}
                    style={{
                      ...miniItemStyle,
                      ...(isActive ? miniItemActiveStyle : {}),
                    }}
                    onClick={() => handleFileSelect(file.id)}
                  >
                    <span style={{ fontSize: 18 }}>
                      {langConfig?.icon || '📄'}
                    </span>
                    {isActive && <span style={activeIndicatorStyle} />}
                  </div>
                </Tooltip>
              );
            })}
          </div>
        )}
      </div>

      {/* 分隔线 */}
      <div style={dividerStyle} />
    </div>
  );
});

// 静态样式常量（不依赖主题）
const fileTreePanelStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  overflow: 'hidden',
  transition: 'width 0.2s ease',
};

const expandButtonStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 24,
  height: 24,
  borderRadius: 4,
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  transition: 'all 0.2s',
  margin: '0 auto',
};

const fileListStyle: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: '4px 0',
};

const fileItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '4px 12px',
  fontSize: 13,
  cursor: 'pointer',
  userSelect: 'none',
  transition: 'background-color 0.1s',
};

const fileIconStyle: React.CSSProperties = {
  fontSize: 16,
  flexShrink: 0,
  width: 16,
  textAlign: 'center',
};

const fileNameStyle: React.CSSProperties = {
  flex: 1,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

// 迷你图标栏样式
const miniIconsStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '8px 0',
  gap: 4,
  overflowY: 'auto',
};

const miniItemStyle: React.CSSProperties = {
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 36,
  height: 36,
  borderRadius: 6,
  cursor: 'pointer',
  transition: 'background-color 0.15s',
};

export default CollapsibleFileTree;
