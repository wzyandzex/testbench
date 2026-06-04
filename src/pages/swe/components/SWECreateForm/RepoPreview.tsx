/**
 * Repository Preview Card
 * Holographic-style repository preview with stats
 */

import { memo, useMemo, useState, useEffect, useCallback } from 'react';
import { Typography, Spin, Space } from 'antd';
import {
  StarFilled,
  GitlabFilled,
  IssuesCloseOutlined,
  DatabaseOutlined,
} from '@ant-design/icons';
import { useIsDark } from '@/theme';
import { getSWETheme } from '../../theme';
import { useSWEFormContext } from './index';
import type { RepoPreviewData } from './types';
import { sweService } from '@/services';

const { Text } = Typography;

export const RepoPreview = memo(function RepoPreview() {
  const isDark = useIsDark();
  const theme = getSWETheme(isDark);
  const { state } = useSWEFormContext();

  const [previewData, setPreviewData] = useState<RepoPreviewData | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch repo info when URL changes
  useEffect(() => {
    const fetchRepoInfo = async () => {
      const match = state.repoUrl?.match(
        /^https?:\/\/(?:www\.)?github\.com\/([^/]+)\/([^/]+?)(?:\.git)?$/
      );
      if (!match) {
        setPreviewData(null);
        return;
      }

      const [, owner, name] = match;
      setLoading(true);

      try {
        // Check if repo is cached
        const cacheResponse = await sweService.getCache();
        const cacheData = cacheResponse.data as any;
        const cachedRepo = cacheData?.repos?.find(
          (r: any) => r.name === `${owner}/${name}`
        );

        if (cachedRepo) {
          setPreviewData({
            isCached: true,
            stars: cachedRepo.stars || 0,
            forks: cachedRepo.forks || 0,
            issues: cachedRepo.openIssues || 0,
            language: cachedRepo.language,
            languageColor: getLanguageColor(cachedRepo.language),
            description: cachedRepo.description,
            updatedAt: cachedRepo.updatedAt,
          });
        } else {
          // Mock data for preview when not cached
          setPreviewData({
            isCached: false,
            stars: 0,
            forks: 0,
            issues: 0,
          });
        }
      } catch (error) {
        // Set minimal preview data on error
        setPreviewData({
          isCached: false,
          stars: 0,
          forks: 0,
          issues: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchRepoInfo, 500);
    return () => clearTimeout(timer);
  }, [state.repoUrl]);

  const getLanguageColor = useCallback((language?: string): string => {
    const colors: Record<string, string> = {
      Python: '#3572A5',
      JavaScript: '#f1e05a',
      TypeScript: '#2b7489',
      Java: '#b07219',
      'C++': '#f34b7d',
      Go: '#00ADD8',
      Rust: '#dea584',
      Ruby: '#701516',
      PHP: '#4F5D95',
    };
    return colors[language || ''] || '#8be9fd';
  }, []);

  // Don't show if no URL
  if (!state.repoUrl || !previewData) {
    return null;
  }

  // Parse repo info
  const match = state.repoUrl.match(/^https?:\/\/(?:www\.)?github\.com\/([^/]+)\/([^/]+?)(?:\.git)?$/);
  if (!match) return null;

  const [, owner, name] = match;
  const fullName = `${owner}/${name}`;

  // Card style
  const cardStyle = useMemo(() => {
    const baseStyle: React.CSSProperties = {
      borderRadius: isDark ? '16px' : '12px',
      padding: isDark ? '24px' : '20px',
      marginTop: isDark ? '24px' : '20px',
      transition: 'all 0.3s ease',
      position: 'relative',
      overflow: 'hidden',
    };

    if (isDark) {
      return {
        ...baseStyle,
        background: `${theme.cardBg}e6`,
        border: `1px solid ${theme.cardBorder}`,
        backdropFilter: 'blur(10px)',
        boxShadow: theme.cardShadow,
      };
    }

    return {
      ...baseStyle,
      background: '#fafafa',
      border: `1px solid ${theme.borderLight}`,
    };
  }, [isDark, theme]);

  // Header style
  const headerStyle = useMemo(
    () => ({
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: isDark ? '20px' : '16px',
    }),
    [isDark]
  );

  // Title style
  const titleStyle = useMemo(
    () => ({
      fontSize: isDark ? '15px' : '14px',
      fontWeight: 600,
      color: theme.textPrimary,
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    }),
    [isDark, theme]
  );

  // Stats grid style
  const statsGridStyle = useMemo(
    () => ({
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: isDark ? '16px' : '12px',
    }),
    [isDark]
  );

  // Stat card style
  const statCardStyle = useMemo(
    () => ({
      padding: isDark ? '16px' : '14px',
      background: isDark ? `${theme.accent}08` : 'rgba(0,0,0,0.02)',
      border: isDark ? `1px solid ${theme.cardBorder}` : '1px solid #e8e8e8',
      borderRadius: isDark ? '12px' : '8px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    }),
    [isDark, theme]
  );

  // Stat icon style
  const getStatIconStyle = (color: string) => ({
    fontSize: isDark ? '20px' : '18px',
    color,
  });

  // Stat value style
  const statValueStyle = useMemo(
    () => ({
      fontSize: isDark ? '20px' : '18px',
      fontWeight: 700,
      color: theme.textPrimary,
      lineHeight: 1,
    }),
    [isDark, theme]
  );

  // Stat label style
  const statLabelStyle = useMemo(
    () => ({
      fontSize: '11px',
      color: theme.textTertiary,
      textTransform: 'uppercase' as const,
      letterSpacing: '0.5px',
      marginTop: '2px',
    }),
    [theme]
  );

  // Format number
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return String(num);
  };

  // Syntax colors
  const syntaxVariable = theme.syntaxVariable;
  const syntaxFunction = theme.syntaxFunction;
  const syntaxString = theme.syntaxString;

  return (
    <div style={cardStyle}>
      {/* Scanline effect for dark mode */}
      {isDark && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '100%',
            background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(139, 233, 253, 0.03) 2px, rgba(139, 233, 253, 0.03) 4px)',
            pointerEvents: 'none',
          }}
        />
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Spin size="small" />
        </div>
      ) : (
        <>
          {/* Header */}
          <div style={headerStyle}>
            <div style={titleStyle}>
              <span style={{ color: syntaxVariable }}>{'<'}</span>
              <span style={{ color: syntaxFunction }}>Repo</span>
              <span style={{ color: syntaxVariable }}>{'> "'}</span>
              <span style={{ color: syntaxString }}>{fullName}</span>
              <span style={{ color: syntaxVariable }}>{'" />'}</span>
            </div>

            {/* Cache indicator */}
            {previewData.isCached ? (
              <Space size={6}>
                <DatabaseOutlined
                  style={{
                    color: theme.statusCompleted,
                    fontSize: '14px',
                  }}
                />
                <Text
                  style={{
                    fontSize: '12px',
                    color: theme.statusCompleted,
                    fontWeight: 500,
                  }}
                >
                  Cached
                </Text>
              </Space>
            ) : (
              <Text style={{ fontSize: '12px', color: theme.textTertiary }}>
                Not cached
              </Text>
            )}
          </div>

          {/* Language badge */}
          {previewData.language && (
            <div
              style={{
                marginBottom: '18px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 12px',
                background: isDark
                  ? `${previewData.languageColor}15`
                  : `${previewData.languageColor}10`,
                border: `1px solid ${previewData.languageColor}40`,
                borderRadius: '20px',
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: previewData.languageColor,
                }}
              />
              <Text
                style={{
                  fontSize: '12px',
                  color: previewData.languageColor,
                  fontWeight: 500,
                }}
              >
                {previewData.language}
              </Text>
            </div>
          )}

          {/* Stats Grid */}
          <div style={statsGridStyle}>
            {/* Stars */}
            <div style={statCardStyle}>
              <StarFilled style={getStatIconStyle('#f1e05a')} />
              <div>
                <div style={statValueStyle}>{formatNumber(previewData.stars || 0)}</div>
                <div style={statLabelStyle}>Stars</div>
              </div>
            </div>

            {/* Forks */}
            <div style={statCardStyle}>
              <GitlabFilled style={getStatIconStyle('#8be9fd')} />
              <div>
                <div style={statValueStyle}>{formatNumber(previewData.forks || 0)}</div>
                <div style={statLabelStyle}>Forks</div>
              </div>
            </div>

            {/* Issues */}
            <div style={statCardStyle}>
              <IssuesCloseOutlined style={getStatIconStyle('#50fa7b')} />
              <div>
                <div style={statValueStyle}>{formatNumber(previewData.issues || 0)}</div>
                <div style={statLabelStyle}>Issues</div>
              </div>
            </div>
          </div>

          {/* Corner decorations for dark mode */}
          {isDark && (
            <>
              <div
                style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  width: '20px',
                  height: '20px',
                  borderRight: `2px solid ${theme.accent}`,
                  borderTop: `2px solid ${theme.accent}`,
                  borderRadius: '0 12px 0 0',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: '8px',
                  left: '8px',
                  width: '20px',
                  height: '20px',
                  borderLeft: `2px solid ${theme.accent}`,
                  borderBottom: `2px solid ${theme.accent}`,
                  borderRadius: '0 0 0 12px',
                }}
              />
            </>
          )}
        </>
      )}
    </div>
  );
});
