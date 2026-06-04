/**
 * SWE task phase steps indicator
 */

import { Steps, Space, Typography } from 'antd';
import {
  CheckCircleOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import i18next from 'i18next';
import { useTranslation } from 'react-i18next';
import type { SWETaskPhase } from '@/types';

const { Text } = Typography;

interface SWETaskPhasesProps {
  currentPhase: SWETaskPhase;
  style?: React.CSSProperties;
}

// Phase definitions — title/description resolved at runtime via i18next
const PHASES = [
  {
    key: 'idle',
    get title() { return i18next.t('swe:phases.idle'); },
    get description() { return i18next.t('swe:phases.idleDesc'); },
  },
  {
    key: 'cloning',
    get title() { return i18next.t('swe:phases.cloning'); },
    get description() { return i18next.t('swe:phases.cloningDesc'); },
  },
  {
    key: 'setup',
    get title() { return i18next.t('swe:phases.setup'); },
    get description() { return i18next.t('swe:phases.setupDesc'); },
  },
  {
    key: 'analyzing',
    get title() { return i18next.t('swe:phases.analyzing'); },
    get description() { return i18next.t('swe:phases.analyzingDesc'); },
  },
  {
    key: 'fixing',
    get title() { return i18next.t('swe:phases.fixing'); },
    get description() { return i18next.t('swe:phases.fixingDesc'); },
  },
  {
    key: 'testing',
    get title() { return i18next.t('swe:phases.testing'); },
    get description() { return i18next.t('swe:phases.testingDesc'); },
  },
  {
    key: 'verifying',
    get title() { return i18next.t('swe:phases.verifying'); },
    get description() { return i18next.t('swe:phases.verifyingDesc'); },
  },
  {
    key: 'completed',
    get title() { return i18next.t('swe:phases.completed'); },
    get description() { return i18next.t('swe:phases.completedDesc'); },
  },
] as const;

// Phase order map
const PHASE_ORDER: Record<SWETaskPhase, number> = {
  idle: 0,
  cloning: 1,
  setup: 2,
  analyzing: 3,
  fixing: 4,
  testing: 5,
  verifying: 6,
  completed: 7,
  failed: 7,
};

export const SWETaskPhases = ({ currentPhase, style }: SWETaskPhasesProps) => {
  const { t } = useTranslation('swe');
  const currentIndex = PHASE_ORDER[currentPhase] || 0;

  // Compute step status
  const steps = PHASES.map((phase, index) => {
    let status: 'wait' | 'process' | 'finish' | 'error' = 'wait';
    let icon = undefined;

    if (index < currentIndex) {
      status = 'finish';
      icon = <CheckCircleOutlined />;
    } else if (index === currentIndex) {
      status = 'process';
      if (currentPhase === 'failed') {
        status = 'error';
      } else {
        icon = <LoadingOutlined />;
      }
    }

    return {
      key: phase.key,
      title: phase.title,
      description: phase.description,
      status,
      icon,
    };
  });

  return (
    <div style={style}>
      <Steps
        current={currentIndex}
        items={steps}
        size="small"
      />
      {currentPhase !== 'completed' && currentPhase !== 'failed' && (
        <Space style={{ marginTop: 8 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {t('task.currentPhase')}: {PHASES[currentIndex]?.title || t('progress.unknown')}
          </Text>
        </Space>
      )}
    </div>
  );
};

export default SWETaskPhases;
