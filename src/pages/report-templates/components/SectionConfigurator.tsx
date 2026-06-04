import { Card, Input, Space, Switch, Typography } from 'antd';
import { HolderOutlined } from '@ant-design/icons';

import type { SectionConfig, SectionKey } from '../service';
import { SECTION_LABELS } from '../service';

const { Text } = Typography;
const { TextArea } = Input;

interface SectionConfiguratorProps {
  sections: SectionConfig[];
  onChange: (sections: SectionConfig[]) => void;
}

export function SectionConfigurator({ sections, onChange }: SectionConfiguratorProps) {
  const handleToggle = (key: SectionKey, enabled: boolean) => {
    const updated = sections.map((s) => (s.key === key ? { ...s, enabled } : s));
    onChange(updated);
  };

  const handleTitleChange = (key: SectionKey, title: string) => {
    const updated = sections.map((s) => (s.key === key ? { ...s, title } : s));
    onChange(updated);
  };

  const handleContentChange = (key: SectionKey, content: string) => {
    const updated = sections.map((s) => (s.key === key ? { ...s, content } : s));
    onChange(updated);
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= sections.length) return;
    const updated = [...sections];
    [updated[index], updated[target]] = [updated[target], updated[index]];
    onChange(updated.map((s, i) => ({ ...s, order: i + 1 })));
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="small">
      {sections.map((section, index) => {
        const meta = SECTION_LABELS[section.key];
        return (
          <Card
            key={section.key}
            size="small"
            style={{
              opacity: section.enabled ? 1 : 0.5,
              borderLeft: section.enabled ? '3px solid #1890ff' : '3px solid #d9d9d9',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <HolderOutlined
                style={{ cursor: 'grab', color: '#999' }}
                onClick={(e) => {
                  e.preventDefault();
                  if (index > 0) moveSection(index, 'up');
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  if (index < sections.length - 1) moveSection(index, 'down');
                }}
              />
              <Switch
                size="small"
                checked={section.enabled}
                onChange={(checked) => handleToggle(section.key, checked)}
              />
              <div style={{ flex: 1 }}>
                <Input
                  size="small"
                  value={section.title}
                  onChange={(e) => handleTitleChange(section.key, e.target.value)}
                  style={{ width: 200, marginBottom: 2 }}
                  bordered={false}
                />
                <br />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {meta?.description}
                </Text>
              </div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                #{index + 1}
              </Text>
            </div>

            {section.key === 'custom_notes' && section.enabled && (
              <div style={{ marginTop: 8 }}>
                <TextArea
                  rows={3}
                  placeholder="输入自定义 Markdown 内容..."
                  value={section.content || ''}
                  onChange={(e) => handleContentChange(section.key, e.target.value)}
                />
              </div>
            )}
          </Card>
        );
      })}
    </Space>
  );
}
