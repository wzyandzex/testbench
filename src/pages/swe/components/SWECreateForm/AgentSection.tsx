/**
 * Agent Selection Section
 * Card-based agent picker with TiltCard 3D effect
 */

import { memo, useMemo, useState } from 'react';
import { Typography, Empty, Input } from 'antd';
import { RobotOutlined, SearchOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useIsDark } from '@/theme';
import { getSWETheme } from '../../theme';
import { TiltCard } from '@/components/agent/TiltCard';
import { useSWEFormContext } from './index';
import type { Agent } from '@/types';

const { Text } = Typography;

export const AgentSection = memo(function AgentSection() {
  const { t } = useTranslation('swe');
  const isDark = useIsDark();
  const theme = getSWETheme(isDark);
  const { state, agents, updateField } = useSWEFormContext();

  const [searchQuery, setSearchQuery] = useState('');

  // Filter agents by search
  const filteredAgents = useMemo(() => {
    if (!searchQuery) return agents;
    const query = searchQuery.toLowerCase();
    return agents.filter(
      (agent) =>
        agent.name.toLowerCase().includes(query) ||
        agent.type?.toLowerCase().includes(query) ||
        agent.description?.toLowerCase().includes(query)
    );
  }, [agents, searchQuery]);

  const handleSelectAgent = (agentId: string) => {
    updateField('agentId', agentId);
  };

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

  // Header style
  const headerStyle = useMemo(
    () => ({
      marginBottom: '24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap' as const,
      gap: '16px',
    }),
    []
  );

  // Title style
  const titleStyle = useMemo(
    () => ({
      fontSize: isDark ? '16px' : '16px',
      fontWeight: 600,
      color: theme.textPrimary,
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    }),
    [isDark, theme]
  );

  // Grid style
  const gridStyle = useMemo(
    () => ({
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
      gap: isDark ? '20px' : '16px',
    }),
    [isDark]
  );

  // Search input style
  const searchStyle = useMemo(
    () => ({
      width: '100%',
      maxWidth: '300px',
      background: isDark ? '#0d1117' : '#f5f5f5',
      border: isDark ? `1px solid ${theme.cardBorder}` : '1px solid #d9d9d9',
      borderRadius: isDark ? '10px' : '8px',
    }),
    [isDark, theme]
  );

  return (
    <div style={sectionStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <div style={titleStyle}>
          <RobotOutlined style={{ color: theme.syntaxFunction }} />
          <span>{t('createForm.agent.title')}</span>
        </div>

        {/* Search */}
        <Input
          placeholder={t('createForm.agent.searchPlaceholder')}
          prefix={<SearchOutlined />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={searchStyle}
          allowClear
        />
      </div>

      {/* Error message */}
      {state.errors.agentId && (
        <Text type="danger" style={{ marginBottom: '16px', display: 'block' }}>
          {state.errors.agentId}
        </Text>
      )}

      {/* Agents Grid */}
      {filteredAgents.length === 0 ? (
        <Empty
          description={
            searchQuery ? t('createForm.agent.noMatch') : t('createForm.agent.noAgents')
          }
          style={{ padding: '40px 0' }}
        />
      ) : (
        <div style={gridStyle}>
          {filteredAgents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              isSelected={state.agentId === agent.id}
              onSelect={handleSelectAgent}
            />
          ))}
        </div>
      )}
    </div>
  );
});

interface AgentCardProps {
  agent: Agent;
  isSelected: boolean;
  onSelect: (agentId: string) => void;
}

const AgentCard = memo(function AgentCard({ agent, isSelected, onSelect }: AgentCardProps) {
  const isDark = useIsDark();
  const theme = getSWETheme(isDark);

  const cardStyle = useMemo(() => {
    const baseStyle: React.CSSProperties = {
      borderRadius: isDark ? '14px' : '10px',
      padding: isDark ? '20px' : '18px',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      position: 'relative',
      overflow: 'hidden',
    };

    if (isDark) {
      if (isSelected) {
        return {
          ...baseStyle,
          background: `${theme.accent}15`,
          border: `1px solid ${theme.accent}`,
          boxShadow: theme.glow,
        };
      }
      return {
        ...baseStyle,
        background: theme.cardBg,
        border: `1px solid ${theme.cardBorder}`,
      };
    }

    if (isSelected) {
      return {
        ...baseStyle,
        background: `${theme.accent}10`,
        border: `1px solid ${theme.accent}`,
      };
    }
    return {
      ...baseStyle,
      background: '#ffffff',
      border: `1px solid #e8e8e8`,
    };
  }, [isDark, isSelected, theme]);

  // Type badge color
  const getTypeColor = () => {
    const type = agent.type?.toLowerCase();
    if (type === 'openai' || type === 'llm') return theme.syntaxFunction; // Green
    if (type === 'anthropic') return theme.syntaxKeyword; // Pink
    if (type === 'google' || type === 'gemini') return theme.syntaxNumber; // Purple
    return theme.syntaxVariable; // Cyan
  };

  return (
    <TiltCard onClick={() => onSelect(agent.id)} intensity={12} glow={isSelected && isDark}>
      <div style={cardStyle}>
        {/* Selection indicator */}
        {isSelected && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: isDark ? '3px' : '2px',
              background: theme.gradientPrimary,
              borderRadius: `${isDark ? '14px' : '10px'} ${isDark ? '14px' : '10px'} 0 0`,
            }}
          />
        )}

        {/* Agent icon */}
        <div
          style={{
            width: isDark ? '48px' : '44px',
            height: isDark ? '48px' : '44px',
            borderRadius: isDark ? '12px' : '10px',
            background: isDark
              ? `${getTypeColor()}20`
              : `${getTypeColor()}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '14px',
          }}
        >
          <RobotOutlined
            style={{
              fontSize: isDark ? '22px' : '20px',
              color: getTypeColor(),
            }}
          />
        </div>

        {/* Agent name */}
        <div
          style={{
            fontSize: isDark ? '15px' : '14px',
            fontWeight: 600,
            color: theme.textPrimary,
            marginBottom: '6px',
          }}
        >
          {agent.name}
        </div>

        {/* Type badge */}
        <div
          style={{
            display: 'inline-block',
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: 500,
            background: isDark
              ? `${getTypeColor()}15`
              : `${getTypeColor()}10`,
            color: getTypeColor(),
            marginBottom: '10px',
            fontFamily: 'monospace',
          }}
        >
          {agent.type || 'unknown'}
        </div>

        {/* Description */}
        {agent.description && (
          <div
            style={{
              fontSize: '12px',
              color: theme.textSecondary,
              lineHeight: 1.5,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {agent.description}
          </div>
        )}

        {/* Selection checkmark */}
        {isSelected && (
          <div
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              background: theme.statusCompleted,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: isDark ? `0 0 10px ${theme.statusCompleted}` : undefined,
            }}
          >
            <span style={{ color: '#0d1117', fontSize: '12px', fontWeight: 'bold' }}>✓</span>
          </div>
        )}
      </div>
    </TiltCard>
  );
});
