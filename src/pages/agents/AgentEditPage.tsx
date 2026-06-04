import { useEffect } from 'react';
import { Alert, Result, Skeleton, message } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AgentForm, { type AgentFormValues } from './AgentForm';
import { buildAgentUpdatePayload, stringifyJSON } from './helpers';
import { useAgentPageStore } from './store';

export function AgentEditPage() {
  const { t } = useTranslation('agents');
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const currentAgent = useAgentPageStore((state) => state.currentAgent);
  const detailLoading = useAgentPageStore((state) => state.detailLoading);
  const error = useAgentPageStore((state) => state.error);
  const fetchAgentDetail = useAgentPageStore((state) => state.fetchAgentDetail);
  const updateAgent = useAgentPageStore((state) => state.updateAgent);

  useEffect(() => {
    if (id && currentAgent?.id !== id) {
      void fetchAgentDetail(id);
    }
  }, [currentAgent?.id, fetchAgentDetail, id]);

  async function handleSubmit(values: AgentFormValues) {
    if (!id) return;
    try {
      await updateAgent(id, buildAgentUpdatePayload(values));
      message.success(t('actions.updated'));
      navigate(`/agents/${id}`);
    } catch (error) {
      const reason = error instanceof Error ? error.message : t('actions.updateFailed');
      message.error(reason);
    }
  }

  if (!id) {
    return <Result status="404" title={t('detail.missingEditId')} subTitle={t('detail.missingEditIdSub')} />;
  }

  if (detailLoading && currentAgent?.id !== id) {
    return <Skeleton active paragraph={{ rows: 12 }} style={{ padding: 24 }} />;
  }

  if (error && currentAgent?.id !== id) {
    return (
      <div style={{ padding: 24 }}>
        <Alert type="error" showIcon message={t('detail.loadFailed')} description={error} />
      </div>
    );
  }

  if (!currentAgent || currentAgent.id !== id) {
    return <Result status="404" title={t('detail.notFound')} subTitle={t('detail.notFoundSub')} />;
  }

  return (
    <AgentForm
      title={`${t('form.editTitle')}: ${currentAgent.display_name || currentAgent.name}`}
      subtitle={t('form.editSubtitle')}
      submitLabel={t('form.saveChanges')}
      initialValues={{
        name: currentAgent.name,
        display_name: currentAgent.display_name,
        description: currentAgent.description,
        type: currentAgent.type,
        endpoint: currentAgent.endpoint,
        status: currentAgent.status,
        version: currentAgent.version,
        capabilities: currentAgent.capabilities,
        provider: currentAgent.model_config?.provider,
        model_name: currentAgent.model_config?.model_name,
        base_url: currentAgent.model_config?.base_url,
        runtime_mode: currentAgent.model_config?.runtime_mode,
        tool_profile: currentAgent.model_config?.tool_profile,
        temperature: currentAgent.model_config?.temperature,
        max_tokens: currentAgent.model_config?.max_tokens,
        top_p: currentAgent.model_config?.top_p,
        top_k: currentAgent.model_config?.top_k,
        model_params_json: stringifyJSON(currentAgent.model_config?.params),
        tools_json: stringifyJSON(currentAgent.tools),
        metadata_json: stringifyJSON(currentAgent.metadata),
      }}
      apiKeyHelp={currentAgent.has_api_key ? t('form.apiKeyHasKey') : t('form.apiKeyNoKey')}
      onSubmit={handleSubmit}
      onCancel={() => navigate(`/agents/${id}`)}
    />
  );
}

export default AgentEditPage;
