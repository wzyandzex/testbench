import { message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AgentForm, { type AgentFormValues } from './AgentForm';
import { buildAgentPayload } from './helpers';
import { useAgentPageStore } from './store';

export function AgentCreatePage() {
  const { t } = useTranslation('agents');
  const navigate = useNavigate();
  const createAgent = useAgentPageStore((state) => state.createAgent);

  async function handleSubmit(values: AgentFormValues) {
    try {
      const created = await createAgent(buildAgentPayload(values));
      message.success(t('actions.created'));
      navigate(`/agents/${created.id}`);
    } catch (error) {
      const reason = error instanceof Error ? error.message : t('actions.createFailed');
      message.error(reason);
    }
  }

  return (
    <AgentForm
      title={t('form.title')}
      subtitle={t('form.createSubtitle')}
      submitLabel={t('form.createSubmitLabel')}
      initialValues={{
        type: 'hybrid',
        status: 'active',
      }}
      apiKeyHelp={t('form.apiKeyCreateHelp')}
      onSubmit={handleSubmit}
      onCancel={() => navigate('/agents')}
    />
  );
}

export default AgentCreatePage;
