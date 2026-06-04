/**
 * Monaco Editor 状态管理
 */

import { create } from 'zustand';
import type { CodeFile, EditorState } from './types';

interface MonacoEditorState extends EditorState {
  // 内部状态
  draggedFileId: string | null;

  // 文件操作内部方法
  _setDraggedFileId: (fileId: string | null) => void;
}

/**
 * 生成唯一文件 ID
 */
function generateFileId(): string {
  return `file_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * 创建默认文件
 */
function createDefaultFile(name: string, language: string, content: string = ''): Omit<CodeFile, 'id'> {
  return {
    name,
    path: `/${name}`,
    language,
    content,
    isModified: false,
    isReadOnly: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export const useMonacoEditorStore = create<MonacoEditorState>((set) => ({
  // 初始状态
  files: [],
  activeFileId: null,
  fileOrder: [],
  sidebarVisible: true,
  sidebarWidth: 240,
  splitRatio: 0.4,
  theme: 'light',
  draggedFileId: null,

  // 添加文件
  addFile: (fileData) => {
    const id = generateFileId();
    const newFile: CodeFile = {
      ...fileData,
      id,
      createdAt: fileData.createdAt ?? Date.now(),
      updatedAt: fileData.updatedAt ?? Date.now(),
    };

    set((state) => ({
      files: [...state.files, newFile],
      fileOrder: [...state.fileOrder, id],
      activeFileId: state.activeFileId || id,
    }));

    return id;
  },

  // 更新文件内容
  updateFile: (id, content) => {
    set((state) => ({
      files: state.files.map((file) =>
        file.id === id
          ? { ...file, content, isModified: true, updatedAt: Date.now() }
          : file
      ),
    }));
  },

  // 删除文件
  deleteFile: (id) => {
    set((state) => {
      const newFiles = state.files.filter((f) => f.id !== id);
      const newFileOrder = state.fileOrder.filter((fid) => fid !== id);

      // 如果删除的是当前激活的文件，需要切换到另一个文件
      let newActiveFileId = state.activeFileId;
      if (state.activeFileId === id) {
        const index = state.fileOrder.indexOf(id);
        newActiveFileId =
          newFileOrder.length > 0
            ? newFileOrder[Math.min(index, newFileOrder.length - 1)]
            : null;
      }

      return {
        files: newFiles,
        fileOrder: newFileOrder,
        activeFileId: newActiveFileId,
      };
    });
  },

  // 重命名文件
  renameFile: (id, newName) => {
    set((state) => ({
      files: state.files.map((file) =>
        file.id === id
          ? { ...file, name: newName, path: `/${newName}`, updatedAt: Date.now() }
          : file
      ),
    }));
  },

  // 设置激活文件
  setActiveFile: (id) => {
    set({ activeFileId: id });
  },

  // 重排文件
  reorderFiles: (sourceId, targetId) => {
    set((state) => {
      const newOrder = [...state.fileOrder];
      const sourceIndex = newOrder.indexOf(sourceId);
      const targetIndex = newOrder.indexOf(targetId);

      if (sourceIndex !== -1 && targetIndex !== -1) {
        newOrder.splice(sourceIndex, 1);
        newOrder.splice(targetIndex, 0, sourceId);
      }

      return { fileOrder: newOrder };
    });
  },

  // 切换侧边栏
  toggleSidebar: () => {
    set((state) => ({ sidebarVisible: !state.sidebarVisible }));
  },

  // 设置侧边栏宽度
  setSidebarWidth: (width) => {
    set({ sidebarWidth: Math.max(180, Math.min(400, width)) });
  },

  // 设置分屏比例
  setSplitRatio: (ratio) => {
    set({ splitRatio: Math.max(0.2, Math.min(0.8, ratio)) });
  },

  // 设置主题
  setTheme: (theme) => {
    set({ theme });
  },

  // 清空所有文件
  clearFiles: () => {
    set({
      files: [],
      fileOrder: [],
      activeFileId: null,
    });
  },

  // 设置拖拽的文件 ID
  _setDraggedFileId: (fileId) => {
    set({ draggedFileId: fileId });
  },
}));

/**
 * 便捷 hook: 获取当前激活的文件
 */
export const useActiveFile = () => {
  return useMonacoEditorStore((state) => {
    if (!state.activeFileId) return null;
    return state.files.find((f) => f.id === state.activeFileId) || null;
  });
};

/**
 * 便捷 hook: 获取文件的当前内容
 */
export const useFileContent = (fileId: string | null) => {
  return useMonacoEditorStore((state) => {
    if (!fileId) return '';
    return state.files.find((f) => f.id === fileId)?.content || '';
  });
};

/**
 * 初始化编辑器文件（用于编辑模式）
 */
export const initializeFiles = (
  files: Array<{ name: string; language: string; content: string }>
) => {
  const store = useMonacoEditorStore.getState();
  store.clearFiles();

  files.forEach((file, index) => {
    const id = store.addFile(createDefaultFile(file.name, file.language, file.content));
    if (index === 0) {
      store.setActiveFile(id);
    }
  });
};

/**
 * 导出当前所有文件（用于保存）
 */
export const exportFiles = (): Array<{ name: string; language: string; content: string }> => {
  const files = useMonacoEditorStore.getState().files;
  return files.map((file) => ({
    name: file.name,
    language: file.language,
    content: file.content,
  }));
};
