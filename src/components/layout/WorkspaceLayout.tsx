/**
 * 工作区布局包装器
 * 当 orgId 变化时整个工作区 remount，确保所有子组件重新加载数据
 */

import { ProtectedLayout } from './ProtectedLayout';
import { useWorkspaceStore } from '@/stores/workspaceStore';

export default function WorkspaceLayout() {
  const currentOrg = useWorkspaceStore((s) => s.currentOrg);
  return (
    <div key={currentOrg?.org_id}>
      <ProtectedLayout />
    </div>
  );
}
