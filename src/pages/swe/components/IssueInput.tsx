/**
 * Issue input
 * Supports GitHub issue number input + auto-fetch
 */

import { InputNumber, Space, Typography, Button, Card } from 'antd';
import { GithubOutlined, LinkOutlined, NumberOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const { Text, Paragraph } = Typography;

interface IssueInputProps {
  value?: number;
  onChange?: (value: number) => void;
  repoUrl?: string;
  issueTitle?: string;
  issueBody?: string;
  onFetchIssue?: () => void;
  disabled?: boolean;
  style?: React.CSSProperties;
}

export const IssueInput = ({
  value,
  onChange,
  repoUrl,
  issueTitle,
  issueBody,
  onFetchIssue,
  disabled,
  style,
}: IssueInputProps) => {
  const { t } = useTranslation('swe');
  const hasRepo = repoUrl && repoUrl.includes('github.com');

  return (
    <Space direction="vertical" style={{ width: '100%', ...style }} size={8}>
      <Space>
        <InputNumber
          prefix={<NumberOutlined />}
          placeholder={t('issueInput.placeholder')}
          value={value}
          onChange={(val) => onChange?.(val || 0)}
          disabled={disabled}
          min={1}
          style={{ width: 200 }}
        />
        {hasRepo && onFetchIssue && (
          <Button
            icon={<GithubOutlined />}
            onClick={onFetchIssue}
            disabled={!value || disabled}
          >
            {t('issueInput.fetchInfo')}
          </Button>
        )}
      </Space>

      {/* Issue preview */}
      {(issueTitle || issueBody) && (
        <Card
          size="small"
          style={{
            background: '#f5f5f5',
            border: '1px dashed #d9d9d9',
          }}
        >
          <Space direction="vertical" size={4}>
            {issueTitle && (
              <Text strong style={{ fontSize: 13 }}>
                {issueTitle}
              </Text>
            )}
            {issueBody && (
              <Paragraph
                ellipsis={{ rows: 2 }}
                style={{
                  fontSize: 12,
                  color: '#8c8c8c',
                  margin: 0,
                }}
              >
                {issueBody}
              </Paragraph>
            )}
            {repoUrl && value && (
              <a
                href={`${repoUrl.replace(/\.git$/, '')}/issues/${value}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: 12 }}
              >
                <LinkOutlined /> {t('issueInput.viewOnGitHub')}
              </a>
            )}
          </Space>
        </Card>
      )}
    </Space>
  );
};

export default IssueInput;
