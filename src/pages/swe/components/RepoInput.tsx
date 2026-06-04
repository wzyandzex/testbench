/**
 * Repository URL input
 * Supports GitHub URL parsing + validation
 */

import { Input, Space, Typography, message } from 'antd';
import { GithubOutlined, LinkOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const { Text } = Typography;

interface RepoInputProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
}

// GitHub URL parsing regex
const GITHUB_REPO_REGEX = /^https?:\/\/(?:www\.)?github\.com\/([^/]+)\/([^/]+?)(?:\.git)?$/;

export const RepoInput = ({
  value,
  onChange,
  placeholder = 'https://github.com/owner/repo',
  disabled,
  style,
}: RepoInputProps) => {
  const { t } = useTranslation('swe');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value.trim();
    onChange?.(url);
  };

  const handleBlur = () => {
    if (value && !GITHUB_REPO_REGEX.test(value)) {
      message.warning(t('form.repoUrlInvalid'));
    }
  };

  // Parse repo info
  const parseRepoInfo = (url: string) => {
    const match = url.match(GITHUB_REPO_REGEX);
    if (match) {
      return {
        owner: match[1],
        name: match[2],
        fullName: `${match[1]}/${match[2]}`,
      };
    }
    return null;
  };

  const repoInfo = value ? parseRepoInfo(value) : null;

  return (
    <Space direction="vertical" style={{ width: '100%', ...style }} size={4}>
      <Input
        prefix={<GithubOutlined />}
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        disabled={disabled}
        suffix={<LinkOutlined style={{ color: '#bfbfbf' }} />}
        allowClear
      />

      {repoInfo && (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {t('task.repo')}: {repoInfo.fullName}
        </Text>
      )}
    </Space>
  );
};

export default RepoInput;
