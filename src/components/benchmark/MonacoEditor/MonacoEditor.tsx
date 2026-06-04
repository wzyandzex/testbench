/**
 * Monaco Editor 封装组件
 */

import { memo, useRef, useCallback, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { useTranslation } from 'react-i18next';
import type { MonacoEditorProps } from './types';

const MonacoEditorComponent = memo(function MonacoEditor({
  language,
  value,
  onChange,
  readOnly = false,
  height = '100%',
  width = '100%',
  theme = 'vs',
  fontSize = 14,
  wordWrap = 'off',
  formatOnPaste = true,
  formatOnType = false,
  minimap = true,
  lineNumbers = 'on',
  scrollBeyondLastLine = false,
  automaticLayout = true,
  options,
}: MonacoEditorProps) {
  const { t } = useTranslation('benchmarks');
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  // 默认编辑器选项
  const defaultOptions: editor.IStandaloneEditorConstructionOptions = {
    readOnly,
    fontSize,
    wordWrap,
    formatOnPaste,
    formatOnType,
    minimap: { enabled: minimap },
    lineNumbers,
    scrollBeyondLastLine,
    automaticLayout,
    folding: true,
    lineDecorationsWidth: 10,
    lineNumbersMinChars: 3,
    renderLineHighlight: 'all',
    scrollbar: {
      useShadows: false,
      verticalScrollbarSize: 10,
      horizontalScrollbarSize: 10,
    },
    cursorBlinking: 'smooth',
    cursorSmoothCaretAnimation: 'on',
    smoothScrolling: true,
    tabSize: 2,
    insertSpaces: true,
    detectIndentation: true,
    trimAutoWhitespace: true,
    suggestOnTriggerCharacters: true,
    quickSuggestions: {
      other: true,
      comments: false,
      strings: false,
    },
    acceptSuggestionOnCommitCharacter: true,
    acceptSuggestionOnEnter: 'on',
    accessibilitySupport: 'auto',
    ...options,
  };

  // 编辑器挂载回调
  const handleEditorDidMount = useCallback((
    editor: editor.IStandaloneCodeEditor,
    monaco: typeof import('monaco-editor')
  ) => {
    editorRef.current = editor;

    // 设置键盘快捷键
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      // 保存快捷键（由父组件处理）
      editor.trigger('', 'save', null);
    });

    // 格式化文档快捷键
    editor.addCommand(monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.KeyF, () => {
      editor.getAction('editor.action.formatDocument')?.run();
    });

    // 查找快捷键
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyF, () => {
      editor.getAction('actions.find')?.run();
    });

    // 添加自定义右键菜单项
    editor.addAction({
      id: 'copy-all',
      label: t('components.editor.main.copyAll'),
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyC],
      run: (ed) => {
        const content = ed.getValue();
        void navigator.clipboard.writeText(content);
      },
    });
  }, [t]);

  // 值变化处理
  const handleValueChange = useCallback(
    (newValue: string | undefined) => {
      onChange?.(newValue);
    },
    [onChange]
  );

  // 清理
  useEffect(() => {
    return () => {
      editorRef.current?.dispose();
    };
  }, []);

  return (
    <Editor
      height={height}
      width={width}
      language={language}
      value={value}
      theme={theme}
      options={defaultOptions}
      onMount={handleEditorDidMount}
      onChange={handleValueChange}
      loading={
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          fontSize: 13,
          color: '#999',
        }}>
          {t('components.editor.main.loading')}
        </div>
      }
    />
  );
});

export default MonacoEditorComponent;
