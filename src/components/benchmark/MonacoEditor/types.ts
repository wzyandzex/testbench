/**
 * Monaco Editor 类型定义
 */

import type { editor } from 'monaco-editor';

/**
 * 代码文件类型
 */
export interface CodeFile {
  id: string;
  name: string;
  path: string;
  language: string;
  content: string;
  isModified: boolean;
  isReadOnly: boolean;
  createdAt?: number;
  updatedAt?: number;
}

/**
 * 编辑器选项
 */
export interface MonacoEditorProps {
  language: string;
  value: string;
  onChange?: (value: string | undefined) => void;
  readOnly?: boolean;
  height?: string | number;
  width?: string | number;
  theme?: 'vs' | 'vs-dark' | 'hc-black';
  options?: editor.IStandaloneEditorConstructionOptions;
  fontSize?: number;
  wordWrap?: 'on' | 'off';
  formatOnPaste?: boolean;
  formatOnType?: boolean;
  minimap?: boolean;
  lineNumbers?: 'on' | 'off' | 'relative' | 'interval';
  scrollBeyondLastLine?: boolean;
  automaticLayout?: boolean;
}

/**
 * 分屏方向
 */
export type SplitDirection = 'horizontal' | 'vertical';

/**
 * 分屏容器属性
 */
export interface SplitPaneProps {
  direction: SplitDirection;
  defaultRatio: number;
  minSize?: number;
  maxSize?: number;
  children: [React.ReactNode, React.ReactNode];
  ratioPresets?: number[];
  onRatioChange?: (ratio: number) => void;
  className?: string;
  style?: React.CSSProperties;
  firstPaneClassName?: string;
  secondPaneClassName?: string;
  disabled?: boolean;
}

/**
 * 编辑器标签属性
 */
export interface EditorTabProps {
  files: CodeFile[];
  activeFileId: string | null;
  onTabClick: (fileId: string) => void;
  onTabClose: (fileId: string, e: React.MouseEvent) => void;
  onTabDragStart?: (fileId: string, e: React.DragEvent) => void;
  onTabDragOver?: (e: React.DragEvent) => void;
  onTabDrop?: (targetFileId: string, e: React.DragEvent) => void;
  className?: string;
}

/**
 * 文件树属性
 */
export interface FileTreeProps {
  files: CodeFile[];
  activeFileId: string | null;
  onFileSelect: (fileId: string) => void;
  onFileAdd?: () => void;
  onFileRename?: (fileId: string, newName: string) => void;
  onFileDelete?: (fileId: string) => void;
  className?: string;
  showActions?: boolean;
}

/**
 * 编辑器工具栏属性
 */
export interface EditorToolbarProps {
  activeFile: CodeFile | null;
  onFormat?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onFind?: () => void;
  onCommand?: () => void;
  onSettings?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  className?: string;
}

/**
 * 语言配置
 */
export interface LanguageConfig {
  monaco: string;
  extensions: string[];
  icon: string;
  displayName: string;
}

/**
 * 语言配置映射
 */
export const LANGUAGE_CONFIG: Record<string, LanguageConfig> = {
  python: { monaco: 'python', extensions: ['.py'], icon: '🐍', displayName: 'Python' },
  javascript: { monaco: 'javascript', extensions: ['.js', '.jsx'], icon: '📜', displayName: 'JavaScript' },
  typescript: { monaco: 'typescript', extensions: ['.ts', '.tsx'], icon: '📘', displayName: 'TypeScript' },
  java: { monaco: 'java', extensions: ['.java'], icon: '☕', displayName: 'Java' },
  go: { monaco: 'go', extensions: ['.go'], icon: '🐹', displayName: 'Go' },
  rust: { monaco: 'rust', extensions: ['.rs'], icon: '🦀', displayName: 'Rust' },
  cpp: { monaco: 'cpp', extensions: ['.cpp', '.cc', '.cxx'], icon: '⚙️', displayName: 'C++' },
  c: { monaco: 'c', extensions: ['.c'], icon: '⚙️', displayName: 'C' },
  ruby: { monaco: 'ruby', extensions: ['.rb'], icon: '💎', displayName: 'Ruby' },
  php: { monaco: 'php', extensions: ['.php'], icon: '🐘', displayName: 'PHP' },
  shell: { monaco: 'shell', extensions: ['.sh', '.bash'], icon: '🐚', displayName: 'Shell' },
  sql: { monaco: 'sql', extensions: ['.sql'], icon: '🗃️', displayName: 'SQL' },
  json: { monaco: 'json', extensions: ['.json'], icon: '📋', displayName: 'JSON' },
  yaml: { monaco: 'yaml', extensions: ['.yaml', '.yml'], icon: '📝', displayName: 'YAML' },
  markdown: { monaco: 'markdown', extensions: ['.md'], icon: '📄', displayName: 'Markdown' },
  html: { monaco: 'html', extensions: ['.html', '.htm'], icon: '🌐', displayName: 'HTML' },
  css: { monaco: 'css', extensions: ['.css'], icon: '🎨', displayName: 'CSS' },
  xml: { monaco: 'xml', extensions: ['.xml'], icon: '📄', displayName: 'XML' },
};

/**
 * 根据文件名获取语言
 */
export function getLanguageFromFileName(fileName: string): string {
  const ext = fileName.includes('.')
    ? fileName.substring(fileName.lastIndexOf('.'))
    : fileName;

  for (const [lang, config] of Object.entries(LANGUAGE_CONFIG)) {
    if (config.extensions.includes(ext) || fileName.endsWith(ext)) {
      return lang;
    }
  }

  // 默认返回 plaintext
  return 'plaintext';
}

/**
 * 获取 Monaco 语言标识符
 */
export function getMonacoLanguage(language: string): string {
  return LANGUAGE_CONFIG[language]?.monaco || 'plaintext';
}

/**
 * IDE 样式变量
 */
export const IDE_STYLES = {
  // 浅色模式
  light: {
    bgPrimary: '#ffffff',
    bgSecondary: '#f8f9fa',
    bgTertiary: '#f0f0f0',
    borderColor: '#e8e8e8',
    accent: '#1677ff',
    textPrimary: '#000000d9',
    textSecondary: '#666666',
    tabActive: '#ffffff',
    tabInactive: '#f0f0f0',
    sidebar: '#f8f9fa',
    hover: '#f5f5f5',
    resizeHandle: '#d9d9d9',
    resizeHandleHover: '#1677ff',
  },
  // 深色模式
  dark: {
    bgPrimary: '#1e1e1e',
    bgSecondary: '#252526',
    bgTertiary: '#2d2d2d',
    borderColor: '#3e3e42',
    accent: '#007acc',
    textPrimary: '#cccccc',
    textSecondary: '#858585',
    tabActive: '#1e1e1e',
    tabInactive: '#2d2d2d',
    sidebar: '#252526',
    hover: '#2a2d2e',
    resizeHandle: '#3e3e42',
    resizeHandleHover: '#007acc',
  },
} as const;

/**
 * IDE 间距常量
 */
export const IDE_SPACING = {
  panelPadding: 16,
  tabHeight: 35,
  sidebarWidth: 240,
  minSidebarWidth: 180,
  maxSidebarWidth: 400,
  resizeHandle: 4,
  visibleResizeHandle: 8,
  toolbarHeight: 40,
  fileTreeIndent: 16,
  statusBarHeight: 22,
} as const;

/**
 * IDE 字体配置
 */
export const IDE_TYPOGRAPHY = {
  editorFont: 'Consolas, "Courier New", "Menlo", monospace',
  uiFont: '-apple-system, Inter, "Segoe UI", system-ui, sans-serif',
  editorFontSize: 14,
  uiFontSize: 13,
  uiFontSizeSmall: 11,
  lineHeight: 1.6,
} as const;

/**
 * 编辑器状态接口
 */
export interface EditorState {
  // 文件
  files: CodeFile[];
  activeFileId: string | null;
  fileOrder: string[];

  // UI 状态
  sidebarVisible: boolean;
  sidebarWidth: number;
  splitRatio: number;
  theme: 'light' | 'dark';

  // 操作
  addFile: (file: Omit<CodeFile, 'id'>) => string;
  updateFile: (id: string, content: string) => void;
  deleteFile: (id: string) => void;
  renameFile: (id: string, newName: string) => void;
  setActiveFile: (id: string) => void;
  reorderFiles: (sourceId: string, targetId: string) => void;
  toggleSidebar: () => void;
  setSidebarWidth: (width: number) => void;
  setSplitRatio: (ratio: number) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  clearFiles: () => void;
}
