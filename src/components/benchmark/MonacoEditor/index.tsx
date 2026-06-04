/**
 * Monaco Editor 组件导出入口
 */

export { default as MonacoEditor } from './MonacoEditor';
export { default as SplitPane } from './SplitPane';
export { default as EditorTabs } from './EditorTabs';
export { default as FileTree } from './FileTree';
export { default as CollapsibleFileTree } from './CollapsibleFileTree';
export { default as EditorToolbar } from './EditorToolbar';
export { useMonacoEditorStore, useActiveFile, useFileContent, initializeFiles, exportFiles } from './store';

// 类型导出
export type {
  CodeFile,
  MonacoEditorProps,
  SplitPaneProps,
  EditorTabProps,
  FileTreeProps,
  EditorToolbarProps,
  LanguageConfig,
  EditorState,
} from './types';

// 常量导出
export {
  LANGUAGE_CONFIG,
  IDE_STYLES,
  IDE_SPACING,
  IDE_TYPOGRAPHY,
  getLanguageFromFileName,
  getMonacoLanguage,
} from './types';
