/**
 * TagSelector - 标签选择器组件
 * 用于在创建/编辑评测任务时选择标签
 */

import { useState, useEffect, useCallback } from 'react';
import { Select, Tag, Space, Tooltip } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { Tag as TagType } from '@/types';

const { Option } = Select;

interface TagSelectorProps {
  /** 当前选中的标签名称数组 */
  value?: string[];
  /** 值变化回调 */
  onChange?: (tags: string[]) => void;
  /** 是否允许多选 */
  multiple?: boolean;
  /** 是否允许创建新标签 */
  allowCreate?: boolean;
  /** 占位符文本 */
  placeholder?: string;
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** 禁用状态 */
  disabled?: boolean;
  /** 最大标签数量 */
  maxTagCount?: number;
}

// 预定义颜色池（用于新创建的标签）
const COLOR_POOL = [
  '#1677ff', // blue
  '#10b981', // green
  '#f59e0b', // orange
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
];

/**
 * 获取标签显示颜色
 */
function getTagColor(tag: TagType | string): string {
  if (typeof tag === 'string') {
    // 根据字符串生成固定颜色
    let hash = 0;
    for (let i = 0; i < tag.length; i++) {
      hash = tag.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % COLOR_POOL.length;
    return COLOR_POOL[index];
  }
  return tag.color || COLOR_POOL[0];
}

/**
 * TagSelector 组件
 *
 * 功能：
 * - 从后端获取可用标签列表
 * - 支持多选标签
 * - 支持创建新标签（可选）
 * - 标签颜色显示
 */
export const TagSelector = function TagSelector({
  value = [],
  onChange,
  multiple = true,
  allowCreate = false,
  placeholder,
  style,
  disabled = false,
  maxTagCount,
}: TagSelectorProps) {
  const { t } = useTranslation('benchmarks');
  const [tags, setTags] = useState<TagType[]>([]);
  const [loading, setLoading] = useState(false);

  const resolvedPlaceholder = placeholder ?? t('components.tagSelector.placeholder');

  // 获取标签列表
  useEffect(() => {
    const fetchTags = async () => {
      setLoading(true);
      try {
        const { benchmarkService } = await import('@/services/benchmark');
        const result = await benchmarkService.getTags() as unknown as TagType[];
        setTags(result || []);
      } catch (err) {
        console.error(t('components.tagSelector.loadFailed'), err);
      } finally {
        setLoading(false);
      }
    };
    fetchTags();
  }, [t]);

  // 标签选项下拉渲染
  const tagOptions = tags.map((tag) => (
    <Option key={tag.name} value={tag.name} label={tag.name}>
      <Space>
        <span
          style={{
            display: 'inline-block',
            width: 12,
            height: 12,
            borderRadius: 2,
            backgroundColor: tag.color,
          }}
        />
        <span>{tag.name}</span>
        {tag.usage_count !== undefined && (
          <span style={{ color: '#999', fontSize: 12 }}>
            ({tag.usage_count})
          </span>
        )}
      </Space>
    </Option>
  ));

  // 已选标签渲染
  const tagRender = (props: any) => {
    const { label, closable, onClose } = props;
    const color = getTagColor(label);

    return (
      <Tag
        color={color}
        closable={closable}
        onClose={onClose}
        style={{ marginRight: 4, marginBottom: 4 }}
      >
        {label}
      </Tag>
    );
  };

  const handleChange = useCallback(
    (selectedTags: string[]) => {
      onChange?.(selectedTags);
    },
    [onChange]
  );

  const handleSearch = useCallback(
    (searchValue: string) => {
      if (!allowCreate || !searchValue) {
        return undefined;
      }

      // 检查是否为新标签
      const exists = tags.some((tag) =>
        tag.name.toLowerCase() === searchValue.toLowerCase()
      );

      if (!exists) {
        return [
          {
            value: searchValue,
            label: (
              <Space>
                <PlusOutlined />
                <span>{t('components.tagSelector.createTag', { value: searchValue })}</span>
              </Space>
            ),
          },
        ];
      }

      return undefined;
    },
    [allowCreate, tags, t]
  );

  return (
    <Select
      mode={multiple ? 'multiple' : undefined}
      value={value}
      onChange={handleChange}
      placeholder={resolvedPlaceholder}
      loading={loading}
      disabled={disabled}
      tagRender={tagRender}
      maxTagCount={maxTagCount}
      filterOption={(input, option) => {
        const label = option?.label as string;
        return label?.toLowerCase().includes(input.toLowerCase());
      }}
      onSearch={handleSearch}
      notFoundContent={loading ? t('components.tagSelector.loading') : t('components.tagSelector.emptyTags')}
      allowClear
      showSearch
      style={{ width: '100%', ...style }}
    >
      {tagOptions}
    </Select>
  );
};

/**
 * TagList - 标签列表展示组件
 */
interface TagListProps {
  /** 标签名称数组 */
  tags: string[];
  /** 是否可关闭 */
  closable?: boolean;
  /** 关闭回调 */
  onClose?: (tag: string) => void;
  /** 最大显示数量 */
  maxCount?: number;
  /** 自定义样式 */
  style?: React.CSSProperties;
}

export const TagList = function TagList({
  tags,
  closable = false,
  onClose,
  maxCount,
  style,
}: TagListProps) {
  const displayTags = maxCount ? tags.slice(0, maxCount) : tags;
  const remainingCount = maxCount ? tags.length - maxCount : 0;

  return (
    <Space size={4} wrap style={style}>
      {displayTags.map((tag) => (
        <Tag
          key={tag}
          color={getTagColor(tag)}
          closable={closable}
          onClose={() => onClose?.(tag)}
        >
          {tag}
        </Tag>
      ))}
      {remainingCount > 0 && (
        <Tooltip title={tags.slice(maxCount).join(', ')}>
          <Tag>+{remainingCount}</Tag>
        </Tooltip>
      )}
    </Space>
  );
};

export default TagSelector;
