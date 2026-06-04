/**
 * 多文件配置表单部分
 * 集成 Monaco 编辑器，支持多文件编辑、文件树、标签栏
 */

import { memo, useCallback, useEffect, useState } from 'react';
import { Form, Input, Modal, Select, Button, Space, Typography, message } from 'antd';
import { FileAddOutlined } from '@ant-design/icons';
import {
  MonacoEditor,
  EditorTabs,
  useMonacoEditorStore,
  getMonacoLanguage,
} from '../MonacoEditor';
import { CollapsibleFileTree } from '../MonacoEditor/CollapsibleFileTree';
import { LANGUAGE_CONFIG } from '../MonacoEditor/types';
import type { FormInstance } from 'antd/es/form';
import { useIsDark } from '@/theme';
import { useTranslation } from 'react-i18next';

const { Text } = Typography;

interface FormSectionFilesProps {
  form: FormInstance;
  disabled?: boolean;
  onFilesChange?: (files: Array<{ name: string; language: string; content: string }>) => void;
}

const LANGUAGE_OPTIONS = Object.entries(LANGUAGE_CONFIG).map(([key, config]) => ({
  label: config.displayName,
  value: key,
}));

// 预设文件模板
const FILE_TEMPLATES: Record<string, string> = {
  python: `# Python 文件模板
def solution():
    """实现你的解决方案"""
    pass

if __name__ == "__main__":
    solution()
`,
  javascript: `// JavaScript 文件模板
function solution() {
    // 实现你的解决方案
}

module.exports = { solution };
`,
  typescript: `// TypeScript 文件模板
interface Solution {
    // 定义你的接口
}

export function solution(): void {
    // 实现你的解决方案
}
`,
  java: `// Java 文件模板
public class Solution {
    public void solve() {
        // 实现你的解决方案
    }
}
`,
  go: `// Go 文件模板
package main

func solution() {
    // 实现你的解决方案
}

func main() {
    solution()
}
`,
  rust: `// Rust 文件模板
fn solution() {
    // 实现你的解决方案
}

fn main() {
    solution();
}
`,
  cpp: `// C++ 文件模板
#include <iostream>

void solution() {
    // 实现你的解决方案
}

int main() {
    solution();
    return 0;
}
`,
  test_py: `import pytest

def test_example():
    """示例测试用例"""
    assert True

def test_solution():
    """测试你的解决方案"""
    # 在这里添加你的测试逻辑
    pass
`,
};

export const FormSectionFiles = memo(function FormSectionFiles({
  form,
  disabled = false,
  onFilesChange,
}: FormSectionFilesProps) {
  const { t } = useTranslation('benchmarks');
  const isDark = useIsDark();
  const editorTheme = isDark ? 'vs-dark' : 'vs';

  const [newFileModal, setNewFileModal] = useState<{
    visible: boolean;
    name: string;
    language: string;
  }>({ visible: false, name: '', language: 'python' });

  const {
    files,
    activeFileId,
    updateFile,
    addFile,
    deleteFile,
    setActiveFile,
  } = useMonacoEditorStore();

  const activeFile = files.find((f) => f.id === activeFileId) || null;

  // 初始化文件
  useEffect(() => {
    const initialValues = form.getFieldsValue();
    const initialFiles = initialValues.config?.initial_state?.files;

    if (initialFiles && Object.keys(initialFiles).length > 0 && files.length === 0) {
      Object.entries(initialFiles).forEach(([name, content]) => {
        const language = getLanguageFromFileName(name);
        addFile({
          name,
          path: `/${name}`,
          language,
          content: content as string,
          isModified: false,
          isReadOnly: disabled,
        });
      });
    } else if (files.length === 0) {
      // 添加默认文件
      const language = initialValues.language || 'python';
      const content = FILE_TEMPLATES[language] || FILE_TEMPLATES.python;
      const fileId = addFile({
        name: `main.${getFileExtension(language)}`,
        path: `/main.${getFileExtension(language)}`,
        language,
        content,
        isModified: false,
        isReadOnly: disabled,
      });
      setActiveFile(fileId);
    }
  }, []);

  // 同步文件内容到表单
  useEffect(() => {
    if (files.length > 0) {
      const filesObj: Record<string, string> = {};
      files.forEach((file) => {
        filesObj[file.name] = file.content;
      });

      form.setFieldsValue({
        config: {
          ...form.getFieldsValue().config,
          initial_state: {
            ...form.getFieldsValue().config?.initial_state,
            files: filesObj,
          },
        },
      });

      onFilesChange?.(
        files.map((f) => ({
          name: f.name,
          language: f.language,
          content: f.content,
        }))
      );
    }
  }, [files]);

  // 处理编辑器内容变化
  const handleEditorChange = useCallback(
    (value: string | undefined) => {
      if (activeFile && value !== undefined) {
        updateFile(activeFile.id, value);
      }
    },
    [activeFile, updateFile]
  );

  // 处理新建文件
  const handleNewFile = useCallback(() => {
    setNewFileModal({ visible: true, name: '', language: 'python' });
  }, []);

  const handleNewFileConfirm = useCallback(() => {
    const { name, language } = newFileModal;

    if (!name.trim()) {
      message.warning(t('components.formEnhanced.files.fileNameRequired'));
      return;
    }

    // 检查文件名是否已存在
    if (files.some((f) => f.name === name)) {
      message.error(t('components.formEnhanced.files.fileNameExists'));
      return;
    }

    const content = FILE_TEMPLATES[language] || '';
    const fileId = addFile({
      name,
      path: `/${name}`,
      language,
      content,
      isModified: false,
      isReadOnly: disabled,
    });

    setActiveFile(fileId);
    setNewFileModal({ visible: false, name: '', language: 'python' });
  }, [newFileModal, files, addFile, setActiveFile, disabled, t]);

  // 处理关闭标签
  const handleTabClose = useCallback(
    (fileId: string) => {
      if (files.length === 1) {
        message.warning(t('components.formEnhanced.files.keepOneFile'));
        return;
      }
      deleteFile(fileId);
    },
    [files.length, deleteFile, t]
  );

  // 获取文件扩展名
  function getFileExtension(language: string): string {
    const extensions: Record<string, string> = {
      python: 'py',
      javascript: 'js',
      typescript: 'ts',
      java: 'java',
      go: 'go',
      rust: 'rs',
      cpp: 'cpp',
      c: 'c',
      ruby: 'rb',
      php: 'php',
    };
    return extensions[language] || 'txt';
  }

  // 根据文件名获取语言
  function getLanguageFromFileName(fileName: string): string {
    const ext = fileName.includes('.')
      ? fileName.substring(fileName.lastIndexOf('.') + 1)
      : '';

    const languageMap: Record<string, string> = {
      py: 'python',
      js: 'javascript',
      jsx: 'javascript',
      ts: 'typescript',
      tsx: 'typescript',
      java: 'java',
      go: 'go',
      rs: 'rust',
      cpp: 'cpp',
      c: 'c',
      rb: 'ruby',
      php: 'php',
    };

    return languageMap[ext] || 'plaintext';
  }

  return (
    <div style={sectionStyle}>
      {/* 头部工具栏 */}
      <div style={headerStyle}>
        <Space>
          <Text strong>{t('components.formEnhanced.files.header')}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {t('components.formEnhanced.files.fileCount', { count: files.length })}
          </Text>
        </Space>
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<FileAddOutlined />}
            onClick={handleNewFile}
            disabled={disabled}
          >
            {t('components.formEnhanced.files.newFile')}
          </Button>
        </Space>
      </div>

      {/* 编辑器区域 */}
      <div style={editorAreaStyle}>
        {/* 左侧：可收起文件树 */}
        <CollapsibleFileTree
          files={files}
          activeFileId={activeFileId}
          onFileSelect={setActiveFile}
          defaultWidth={200}
          miniWidth={44}
        />

        {/* 右侧：编辑器 */}
        <div style={editorPanelStyle}>
          {/* 标签栏 */}
          <EditorTabs
            files={files}
            activeFileId={activeFileId}
            onTabClick={setActiveFile}
            onTabClose={handleTabClose}
          />

          {/* Monaco 编辑器 */}
          <div style={editorContainerStyle}>
            {activeFile ? (
              <MonacoEditor
                language={getMonacoLanguage(activeFile.language)}
                value={activeFile.content}
                onChange={handleEditorChange}
                readOnly={disabled}
                height="100%"
                theme={editorTheme}
                fontSize={14}
                wordWrap="off"
                minimap={true}
              />
            ) : (
              <div style={emptyStateStyle}>
                <Text type="secondary">{t('components.formEnhanced.files.emptyState')}</Text>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 新建文件弹窗 */}
      <Modal
        title={t('components.formEnhanced.files.modalTitle')}
        open={newFileModal.visible}
        onOk={handleNewFileConfirm}
        onCancel={() => setNewFileModal({ visible: false, name: '', language: 'python' })}
        okText={t('components.formEnhanced.files.okText')}
        cancelText={t('components.formEnhanced.files.cancelText')}
      >
        <Form layout="vertical">
          <Form.Item label={t('components.formEnhanced.files.fileNameLabel')} required>
            <Input
              placeholder="main.py"
              value={newFileModal.name}
              onChange={(e) =>
                setNewFileModal((prev) => ({ ...prev, name: e.target.value }))
              }
              onPressEnter={handleNewFileConfirm}
            />
          </Form.Item>
          <Form.Item label={t('components.formEnhanced.files.languageLabel')} required>
            <Select
              value={newFileModal.language}
              onChange={(lang) =>
                setNewFileModal((prev) => ({ ...prev, language: lang }))
              }
              options={LANGUAGE_OPTIONS}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
});

const sectionStyle: React.CSSProperties = {
  padding: 0,
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '8px 12px',
  borderBottom: '1px solid #f0f0f0',
  flexShrink: 0,
};

const editorAreaStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  overflow: 'hidden',
  alignItems: 'stretch',
};

const editorPanelStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  minWidth: 0,
  height: '100%',
};

const editorContainerStyle: React.CSSProperties = {
  flex: 1,
  overflow: 'hidden',
  minWidth: 0,
};

const emptyStateStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  backgroundColor: '#f5f5f5',
};

export default FormSectionFiles;
