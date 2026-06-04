/**
 * 文件资源树组件
 */

import { memo, useCallback, useState } from 'react';
import { FileOutlined, PlusOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import type { FileTreeProps } from './types';
import { LANGUAGE_CONFIG, IDE_STYLES } from './types';
import { Modal, Input } from 'antd';
import { useTranslation } from 'react-i18next';

const FileTree = memo(function FileTree({
  files,
  activeFileId,
  onFileSelect,
  onFileAdd,
  onFileRename,
  onFileDelete,
  className = '',
  showActions = true,
}: FileTreeProps) {
  const { t } = useTranslation('benchmarks');
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    fileId: string | null;
  }>({ visible: false, x: 0, y: 0, fileId: null });

  const [renameModal, setRenameModal] = useState<{
    visible: boolean;
    fileId: string | null;
    newName: string;
  }>({ visible: false, fileId: null, newName: '' });

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, fileId: string) => {
      e.preventDefault();
      e.stopPropagation();
      setContextMenu({
        visible: true,
        x: e.clientX,
        y: e.clientY,
        fileId,
      });
    },
    []
  );

  const handleContextMenuClose = useCallback(() => {
    setContextMenu({ visible: false, x: 0, y: 0, fileId: null });
  }, []);

  const handleRename = useCallback((fileId: string) => {
    const file = files.find((f) => f.id === fileId);
    if (file) {
      setRenameModal({ visible: true, fileId, newName: file.name });
    }
    handleContextMenuClose();
  }, [files, handleContextMenuClose]);

  const handleRenameConfirm = useCallback(() => {
    if (renameModal.fileId && renameModal.newName.trim()) {
      onFileRename?.(renameModal.fileId, renameModal.newName.trim());
    }
    setRenameModal({ visible: false, fileId: null, newName: '' });
  }, [renameModal, onFileRename]);

  const handleDelete = useCallback((fileId: string) => {
    Modal.confirm({
      title: t('components.editor.tree.deleteTitle'),
      content: t('components.editor.tree.deleteContent'),
      okText: t('components.editor.tree.deleteOk'),
      okButtonProps: { danger: true },
      cancelText: t('components.editor.tree.cancel'),
      onOk: () => {
        onFileDelete?.(fileId);
      },
    });
    handleContextMenuClose();
  }, [onFileDelete, handleContextMenuClose, t]);

  return (
    <>
      <div
        className={`file-tree ${className}`}
        style={fileTreeStyle}
        onClick={handleContextMenuClose}
      >
        {/* 文件树头部 */}
        {showActions && (
          <div style={fileTreeHeaderStyle}>
            <span style={fileTreeTitleStyle}>{t('components.editor.tree.title')}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onFileAdd?.();
              }}
              style={addButtonStyle}
              title={t('components.editor.tree.newFileTitle')}
            >
              <PlusOutlined style={{ fontSize: 12 }} />
            </button>
          </div>
        )}

        {/* 文件列表 */}
        <div style={fileListStyle}>
          {files.length === 0 ? (
            <div style={emptyStateStyle}>
              <FileOutlined style={{ fontSize: 24, color: '#d9d9d9', marginBottom: 8 }} />
              <span style={{ fontSize: 12, color: '#999' }}>{t('components.editor.tree.empty')}</span>
            </div>
          ) : (
            files.map((file) => {
              const langConfig = LANGUAGE_CONFIG[file.language];
              const isActive = file.id === activeFileId;

              return (
                <div
                  key={file.id}
                  className={`file-tree-item ${isActive ? 'active' : ''}`}
                  style={{
                    ...fileItemStyle,
                    ...(isActive ? fileItemActiveStyle : {}),
                  }}
                  onClick={() => onFileSelect(file.id)}
                  onContextMenu={(e) => handleContextMenu(e, file.id)}
                >
                  <span className="file-icon" style={fileIconStyle}>
                    {langConfig?.icon || <FileOutlined />}
                  </span>
                  <span className="file-name" style={fileNameStyle}>
                    {file.name}
                  </span>
                  {file.isModified && (
                    <span style={modifiedDotStyle} />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 右键菜单 */}
      {contextMenu.visible && (
        <div
          style={{
            ...contextMenuStyle,
            left: contextMenu.x,
            top: contextMenu.y,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="context-menu-item"
            style={contextMenuItemStyle}
            onClick={() => contextMenu.fileId && handleRename(contextMenu.fileId)}
          >
            <EditOutlined style={{ fontSize: 12, marginRight: 8 }} />
            {t('components.editor.tree.contextRename')}
          </div>
          <div
            className="context-menu-item"
            style={{ ...contextMenuItemStyle, color: '#ff4d4f' }}
            onClick={() => contextMenu.fileId && handleDelete(contextMenu.fileId)}
          >
            <DeleteOutlined style={{ fontSize: 12, marginRight: 8 }} />
            {t('components.editor.tree.contextDelete')}
          </div>
        </div>
      )}

      {/* 重命名弹窗 */}
      <Modal
        title={t('components.editor.tree.renameTitle')}
        open={renameModal.visible}
        onOk={handleRenameConfirm}
        onCancel={() => setRenameModal({ visible: false, fileId: null, newName: '' })}
        okText={t('components.editor.tree.renameOk')}
        cancelText={t('components.editor.tree.cancel')}
      >
        <Input
          value={renameModal.newName}
          onChange={(e) =>
            setRenameModal((prev) => ({ ...prev, newName: e.target.value }))
          }
          onPressEnter={handleRenameConfirm}
          placeholder={t('components.editor.tree.renamePlaceholder')}
          autoFocus
        />
      </Modal>
    </>
  );
});

// 样式常量
const fileTreeStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  backgroundColor: IDE_STYLES.light.sidebar,
  borderRight: `1px solid ${IDE_STYLES.light.borderColor}`,
};

const fileTreeHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '8px 12px',
  fontSize: 11,
  fontWeight: 600,
  textTransform: 'uppercase',
  color: '#666',
  borderBottom: `1px solid ${IDE_STYLES.light.borderColor}`,
};

const fileTreeTitleStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  textTransform: 'uppercase',
  color: '#666',
};

const addButtonStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 24,
  height: 24,
  borderRadius: 3,
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  color: '#666',
  transition: 'all 0.2s',
};

const fileListStyle: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: '4px 0',
};

const emptyStateStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 40,
  color: '#999',
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

const fileItemActiveStyle: React.CSSProperties = {
  backgroundColor: IDE_STYLES.light.hover,
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

const modifiedDotStyle: React.CSSProperties = {
  width: 8,
  height: 8,
  borderRadius: '50%',
  backgroundColor: '#1677ff',
  flexShrink: 0,
};

const contextMenuStyle: React.CSSProperties = {
  position: 'fixed',
  backgroundColor: '#fff',
  border: '1px solid #e8e8e8',
  borderRadius: 4,
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
  padding: '4px 0',
  minWidth: 120,
  zIndex: 1000,
};

const contextMenuItemStyle: React.CSSProperties = {
  padding: '6px 12px',
  fontSize: 13,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
};

export default FileTree;
