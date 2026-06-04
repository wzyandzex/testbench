/**
 * UsersPage 样式常量
 */

import { CSSProperties } from 'react';

export const usersPageStyle: Record<string, CSSProperties> = {
  container: {
    padding: '24px',
    minHeight: '100%',
    background: 'transparent',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  title: {
    margin: 0,
    fontSize: 24,
    fontWeight: 600,
    color: 'rgba(255, 255, 255, 0.95)',
  },
  description: {
    margin: '4px 0 0',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.45)',
  },
  filterCard: {
    marginBottom: 16,
    background: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
  },
  tableCard: {
    background: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
  },
};

export default usersPageStyle;
