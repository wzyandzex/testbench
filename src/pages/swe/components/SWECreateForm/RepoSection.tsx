/**
 * Repository Configuration Section
 * Terminal CLI-style repository config input
 */

import { memo, useMemo, useCallback, useState, useEffect } from 'react';
import { Input, InputNumber, Space, Typography } from 'antd';
import { GithubOutlined, LinkOutlined, CheckCircleFilled } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useIsDark } from '@/theme';
import { getSWETheme } from '../../theme';
import { useSWEFormContext } from './index';
import type { RepoInfo } from './types';

const { Text } = Typography;

export const RepoSection = memo(function RepoSection() {
  const { t } = useTranslation('swe');
  const isDark = useIsDark();
  const theme = getSWETheme(isDark);
  const { state, updateField } = useSWEFormContext();

  // Parse repo info from URL
  const [repoInfo, setRepoInfo] = useState<RepoInfo | null>(null);

  useEffect(() => {
    const parseRepoInfo = (url: string): RepoInfo | null => {
      const match = url.match(/^https?:\/\/(?:www\.)?github\.com\/([^/]+)\/([^/]+?)(?:\.git)?$/);
      if (match) {
        return {
          owner: match[1],
          name: match[2],
          fullName: `${match[1]}/${match[2]}`,
          url,
        };
      }
      return null;
    };

    if (state.repoUrl) {
      setRepoInfo(parseRepoInfo(state.repoUrl));
    } else {
      setRepoInfo(null);
    }
  }, [state.repoUrl]);

  const handleUrlChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateField('repoUrl', e.target.value);
    },
    [updateField]
  );

  const handleIssueNumberChange = useCallback(
    (value: number | null) => {
      updateField('issueNumber', value);
    },
    [updateField]
  );

  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateField('issueTitle', e.target.value);
    },
    [updateField]
  );

  const handleBodyChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      updateField('issueBody', e.target.value);
    },
    [updateField]
  );

  // Section style
  const sectionStyle = useMemo(() => {
    const baseStyle: React.CSSProperties = {
      borderRadius: isDark ? '16px' : '12px',
      padding: isDark ? '32px' : '24px',
      transition: 'all 0.3s ease',
    };

    if (isDark) {
      return {
        ...baseStyle,
        background: theme.cardBg,
        border: `1px solid ${theme.cardBorder}`,
        boxShadow: theme.cardShadow,
      };
    }

    return {
      ...baseStyle,
      background: '#ffffff',
      border: `1px solid ${theme.borderLight}`,
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    };
  }, [isDark, theme]);

  // Terminal input style
  const terminalInputStyle = useMemo(
    () => ({
      background: isDark ? '#0d1117' : '#f5f5f5',
      border: isDark ? `1px solid ${theme.cardBorder}` : '1px solid #d9d9d9',
      borderRadius: isDark ? '10px' : '8px',
      padding: isDark ? '14px 18px' : '10px 14px',
      fontSize: isDark ? '14px' : '14px',
      fontFamily: '"Fira Code", "Monaco", "Courier New", monospace',
      transition: 'all 0.3s ease',
      '&:hover': {
        borderColor: isDark ? theme.accent : '#40a9ff',
      },
      '&:focus': {
        borderColor: theme.accent,
        boxShadow: isDark ? theme.glow : '0 0 0 2px rgba(24, 144, 255, 0.2)',
      },
    }),
    [isDark, theme]
  );

  // Label style
  const labelStyle = useMemo(
    () => ({
      fontSize: isDark ? '14px' : '14px',
      fontWeight: 500,
      color: theme.textPrimary,
      marginBottom: isDark ? '10px' : '8px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    }),
    [isDark, theme]
  );

  // Error style
  const errorStyle = useMemo(
    () => ({
      color: theme.statusFailed,
      fontSize: '12px',
      marginTop: '4px',
    }),
    [theme.statusFailed]
  );

  // Helper style
  const helperStyle = useMemo(
    () => ({
      fontSize: '12px',
      color: theme.textTertiary,
      marginTop: '6px',
    }),
    [theme]
  );

  // Syntax colors
  const syntaxVariable = theme.syntaxVariable;
  const syntaxFunction = theme.syntaxFunction;
  const syntaxString = theme.syntaxString;
  const syntaxComment = theme.syntaxComment;

  return (
    <div style={sectionStyle}>
      <Space direction="vertical" size={isDark ? 24 : 20} style={{ width: '100%' }}>
        {/* Repository URL Input */}
        <div>
          <div style={labelStyle}>
            <GithubOutlined style={{ color: syntaxVariable }} />
            <span>{t('createForm.repo.urlLabel')}</span>
            {repoInfo && (
              <CheckCircleFilled
                style={{
                  color: theme.statusCompleted,
                  fontSize: '14px',
                  marginLeft: 'auto',
                }}
              />
            )}
          </div>
          <Input
            placeholder="https://github.com/owner/repo"
            value={state.repoUrl}
            onChange={handleUrlChange}
            prefix={
              <span style={{ color: syntaxComment, fontFamily: 'monospace' }}>$ git clone</span>
            }
            suffix={<LinkOutlined style={{ color: theme.textTertiary }} />}
            style={{
              ...terminalInputStyle,
              borderColor: state.errors.repoUrl ? theme.statusFailed : undefined,
            }}
            allowClear
          />
          {state.errors.repoUrl && <div style={errorStyle}>{state.errors.repoUrl}</div>}
          {repoInfo && (
            <div style={helperStyle}>
              <Text style={{ color: syntaxString, fontSize: '12px' }}>
                {repoInfo.owner}/{repoInfo.name}
              </Text>
            </div>
          )}
        </div>

        {/* Issue Number Input */}
        <div>
          <div style={labelStyle}>
            <span style={{ color: syntaxFunction }}>#</span>
            <span>{t('createForm.repo.issueNumberLabel')}</span>
            {state.issueNumber && (
              <CheckCircleFilled
                style={{
                  color: theme.statusCompleted,
                  fontSize: '14px',
                  marginLeft: 'auto',
                }}
              />
            )}
          </div>
          <InputNumber
            placeholder={t('createForm.repo.issueNumberPlaceholder')}
            min={1}
            value={state.issueNumber}
            onChange={handleIssueNumberChange}
            style={{
              ...terminalInputStyle,
              width: '100%',
              borderColor: state.errors.issueNumber ? theme.statusFailed : undefined,
            }}
          />
          {state.errors.issueNumber && <div style={errorStyle}>{state.errors.issueNumber}</div>}
        </div>

        {/* Issue Title (Optional) */}
        <div>
          <div style={labelStyle}>
            <span style={{ color: syntaxString }}>&quot;</span>
            <span>{t('createForm.repo.issueTitleLabel')}</span>
            <span style={{ color: syntaxString }}>&quot;</span>
            <span style={{ color: syntaxComment, marginLeft: 'auto', fontSize: '12px' }}>
              {t('createForm.repo.issueTitleOptional')}
            </span>
          </div>
          <Input
            placeholder={t('createForm.repo.issueTitlePlaceholder')}
            value={state.issueTitle}
            onChange={handleTitleChange}
            maxLength={200}
            style={terminalInputStyle}
          />
          <div style={helperStyle}>
            <Text style={{ color: syntaxComment, fontSize: '12px' }}>{t('createForm.repo.issueTitleHint')}</Text>
          </div>
        </div>

        {/* Issue Description (Optional) */}
        <div>
          <div style={labelStyle}>
            <span style={{ color: syntaxComment }}>{'/*'}</span>
            <span>{t('createForm.repo.issueDescLabel')}</span>
            <span style={{ color: syntaxComment }}>{'*/'}</span>
          </div>
          <Input.TextArea
            placeholder={t('createForm.repo.issueDescPlaceholder')}
            value={state.issueBody}
            onChange={handleBodyChange}
            rows={4}
            maxLength={2000}
            showCount
            style={{
              ...terminalInputStyle,
              resize: 'vertical' as const,
            }}
          />
        </div>
      </Space>
    </div>
  );
});
