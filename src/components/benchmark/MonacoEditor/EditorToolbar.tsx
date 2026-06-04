/**
 * 编辑器工具栏组件
 */

import { memo, useCallback } from 'react';
import {
  UndoOutlined,
  RedoOutlined,
  FormatPainterOutlined,
  SearchOutlined,
  SettingOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons';
import { Button, Space, Tooltip } from 'antd';
import { useTranslation } from 'react-i18next';
import type { EditorToolbarProps } from './types';

const EditorToolbar = memo(function EditorToolbar({
  activeFile,
  onFormat,
  onUndo,
  onRedo,
  onFind,
  onCommand,
  onSettings,
  canUndo = true,
  canRedo = true,
  className = '',
}: EditorToolbarProps) {
  const { t } = useTranslation('benchmarks');
  const handleFormat = useCallback(() => {
    onFormat?.();
  }, [onFormat]);

  const handleUndo = useCallback(() => {
    onUndo?.();
  }, [onUndo]);

  const handleRedo = useCallback(() => {
    onRedo?.();
  }, [onRedo]);

  const handleFind = useCallback(() => {
    onFind?.();
  }, [onFind]);

  const handleCommand = useCallback(() => {
    onCommand?.();
  }, [onCommand]);

  const handleSettings = useCallback(() => {
    onSettings?.();
  }, [onSettings]);

  return (
    <div className={`editor-toolbar ${className}`} style={toolbarStyle}>
      <Space size={4}>
        {/* 文件信息 */}
        {activeFile && (
          <span style={fileInfoStyle}>
            {activeFile.name}
            {activeFile.isModified && <span style={modifiedStyle}> ●</span>}
          </span>
        )}
      </Space>

      <Space size={4}>
        {/* 撤销/重做 */}
        <Tooltip title={t('components.editor.toolbar.tooltipUndo')}>
          <Button
            type="text"
            icon={<UndoOutlined />}
            disabled={!canUndo}
            onClick={handleUndo}
            style={toolbarButtonStyle}
          />
        </Tooltip>
        <Tooltip title={t('components.editor.toolbar.tooltipRedo')}>
          <Button
            type="text"
            icon={<RedoOutlined />}
            disabled={!canRedo}
            onClick={handleRedo}
            style={toolbarButtonStyle}
          />
        </Tooltip>

        {/* 分隔线 */}
        <span style={dividerStyle} />

        {/* 查找 */}
        <Tooltip title={t('components.editor.toolbar.tooltipFind')}>
          <Button
            type="text"
            icon={<SearchOutlined />}
            onClick={handleFind}
            style={toolbarButtonStyle}
          />
        </Tooltip>

        {/* 格式化 */}
        <Tooltip title={t('components.editor.toolbar.tooltipFormat')}>
          <Button
            type="text"
            icon={<FormatPainterOutlined />}
            onClick={handleFormat}
            style={toolbarButtonStyle}
          />
        </Tooltip>

        {/* 命令面板 */}
        <Tooltip title={t('components.editor.toolbar.tooltipCommand')}>
          <Button
            type="text"
            icon={<PlayCircleOutlined />}
            onClick={handleCommand}
            style={toolbarButtonStyle}
          />
        </Tooltip>

        {/* 分隔线 */}
        <span style={dividerStyle} />

        {/* 设置 */}
        <Tooltip title={t('components.editor.toolbar.tooltipSettings')}>
          <Button
            type="text"
            icon={<SettingOutlined />}
            onClick={handleSettings}
            style={toolbarButtonStyle}
          />
        </Tooltip>
      </Space>
    </div>
  );
});

// 样式常量
const toolbarStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  height: 36,
  padding: '0 12px',
  backgroundColor: '#fff',
  borderBottom: '1px solid #e8e8e8',
};

const toolbarButtonStyle: React.CSSProperties = {
  width: 32,
  height: 28,
  fontSize: 14,
};

const fileInfoStyle: React.CSSProperties = {
  fontSize: 13,
  color: '#666',
  marginRight: 12,
};

const modifiedStyle: React.CSSProperties = {
  color: '#1677ff',
};

const dividerStyle: React.CSSProperties = {
  display: 'inline-block',
  width: 1,
  height: 16,
  backgroundColor: '#e8e8e8',
  margin: '0 4px',
};

export default EditorToolbar;
