/**
 * SWE Task Create Page - "Debug task command console"
 *
 * Dark mode: cyber-tech aesthetic - code rain background, neon borders, terminal style
 * Light mode: IDE light theme - clean, focused, code-friendly
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Space,
  message,
  Breadcrumb,
  Typography,
  Spin,
} from 'antd';
import {
  HomeOutlined,
  ArrowLeftOutlined,
  BugOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useSWEStore } from '@/stores';
import { agentService } from '@/services';
import { useIsDark } from '@/theme';
import { getSWETheme, getGlobalStyles } from './theme';
import {
  useSWECreatePageStyle,
  useSWEPageHeaderStyle,
  useSWETitleStyle,
  useSWESubtitleStyle,
  useSWEContentStyle,
  useSWEAlertStyle,
} from './style';
import { CodeBackground } from './components/CodeBackground';
import { SWECreateForm } from './components/SWECreateForm';
import type { CreateSWETaskRequest } from '@/types';
import type { Agent } from '@/types';

const { Text, Paragraph } = Typography;

export default function SWETaskCreatePage() {
  const { t } = useTranslation('swe');
  const navigate = useNavigate();
  const isDark = useIsDark();
  const theme = getSWETheme(isDark);
  const createTask = useSWEStore((state) => state.createTask);

  // Styles
  const pageStyle = useSWECreatePageStyle();
  const pageHeaderStyle = useSWEPageHeaderStyle();
  const titleStyle = useSWETitleStyle();
  const subtitleStyle = useSWESubtitleStyle();
  const contentStyle = useSWEContentStyle();
  const alertStyle = useSWEAlertStyle();

  // State
  const [loading, setLoading] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);

  // Load agents
  useEffect(() => {
    const fetchAgents = async () => {
      setLoading(true);
      try {
        const response = await agentService.list({ page: 1, page_size: 100 });
        setAgents(response.data || []);
      } catch (error) {
        message.error(t('createPage.loadAgentsFailed'));
      } finally {
        setLoading(false);
      }
    };
    fetchAgents();
  }, [t]);

  // Handle back
  const handleBack = useCallback(() => {
    navigate('/swe');
  }, [navigate]);

  // Handle submit
  const handleSubmit = useCallback(
    async (data: CreateSWETaskRequest) => {
      try {
        const task = await createTask(data);
        message.success(t('createPage.createSuccess'));
        navigate(`/swe/${task.id}`);
      } catch (error) {
        if (error instanceof Error) {
          message.error(error.message);
        }
      }
    },
    [createTask, navigate, t]
  );

  // Alert description style
  const alertDescStyle = useMemo(() => {
    const baseStyle = { margin: 0 };
    if (isDark) {
      return {
        ...baseStyle,
        color: theme.textSecondary,
      };
    }
    return baseStyle;
  }, [isDark, theme]);

  // Tip card style
  const tipCardStyle = useMemo(() => {
    const baseStyle = {
      padding: isDark ? '16px 20px' : '12px 16px',
      marginTop: '20px',
      borderRadius: isDark ? '12px' : '8px',
    };

    if (isDark) {
      return {
        ...baseStyle,
        background: `${theme.syntaxComment}15`,
        border: `1px solid ${theme.syntaxComment}30`,
      };
    }

    return {
      ...baseStyle,
      background: '#fafafa',
      border: '1px solid #e8e8e8',
    };
  }, [isDark, theme]);

  if (loading) {
    return (
      <div style={{ ...pageStyle, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Spin size="large" tip={t('createPage.loadingAgents')} />
      </div>
    );
  }

  return (
    <>
      {/* Global styles for animations */}
      <style>{getGlobalStyles(isDark)}</style>

      {/* Code rain background for dark mode */}
      <CodeBackground density={25} minSpeed={1} maxSpeed={2} />

      <div style={pageStyle}>
        {/* Breadcrumb */}
        <Breadcrumb
          style={{
            marginBottom: '24px',
            position: 'relative',
            zIndex: 1,
          }}
          items={[
            { title: <HomeOutlined />, href: '/dashboard' },
            { title: <span>{t('list.breadcrumbTasks')}</span>, href: '/swe' },
            { title: <span>{t('createPage.breadcrumbCreate')}</span> },
          ]}
        />

        {/* Page Header */}
        <div style={pageHeaderStyle}>
          <div>
            <div style={titleStyle}>
              <BugOutlined style={{ marginRight: 12, color: isDark ? theme.syntaxFunction : undefined }} />
              {t('createPage.title')}
            </div>
            <div style={subtitleStyle}>
              {t('createPage.subtitle')}
            </div>
          </div>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={handleBack}
            style={{
              height: isDark ? '42px' : '38px',
              borderRadius: isDark ? '11px' : '9px',
              borderColor: isDark ? theme.border : undefined,
            }}
          >
            {t('createPage.back')}
          </Button>
        </div>

        {/* Content */}
        <div style={contentStyle}>
          {/* Info Alert */}
          <div style={alertStyle}>
            <Space direction="vertical" size={4}>
              <div style={{ fontWeight: 600, color: isDark ? theme.textPrimary : undefined }}>
                {t('createPage.alertTitle')}
              </div>
              <Paragraph style={alertDescStyle}>
                {t('createPage.alertDescOne')}
              </Paragraph>
              <Paragraph style={{ ...alertDescStyle, marginBottom: 0 }}>
                {t('createPage.alertDescTwo')}
              </Paragraph>
            </Space>
          </div>

          {/* Form Container */}
          <div
            style={{
              background: isDark ? theme.cardBg : '#ffffff',
              border: isDark ? `1px solid ${theme.cardBorder}` : undefined,
              borderRadius: isDark ? '20px' : '16px',
              padding: isDark ? '40px' : '32px',
              boxShadow: isDark ? theme.cardShadow : '0 4px 20px rgba(0,0,0,0.06)',
            }}
          >
            <SWECreateForm
              onSubmit={handleSubmit}
              agents={agents}
              loading={loading}
            />

            {/* Tips */}
            <div style={tipCardStyle}>
              <Space direction="vertical" size={6} style={{ width: '100%' }}>
                <Text style={{ fontSize: '12px', fontWeight: 500, color: isDark ? theme.textPrimary : undefined }}>
                  {t('createPage.tipsTitle')}
                </Text>
                <Text style={{ fontSize: '12px', color: isDark ? theme.textSecondary : undefined }}>
                  {t('createPage.tipCache')}
                </Text>
                <Text style={{ fontSize: '12px', color: isDark ? theme.textSecondary : undefined }}>
                  {t('createPage.tipSmartTest')}
                </Text>
                <Text style={{ fontSize: '12px', color: isDark ? theme.textSecondary : undefined }}>
                  {t('createPage.tipAutoFix')}
                </Text>
              </Space>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
