import { Alert, Descriptions, Drawer, Empty, Tag, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

import type { TrendPoint } from '../service';

const { Text, Link } = Typography;

interface DailyExecutionDrawerProps {
  open: boolean;
  point: TrendPoint | null;
  agentId?: string;
  onClose: () => void;
}

export function DailyExecutionDrawer({ open, point, agentId, onClose }: DailyExecutionDrawerProps) {
  const navigate = useNavigate();

  return (
    <Drawer
      title={point ? `${dayjs(point.date).format('YYYY-MM-DD')} 的详情` : '详情'}
      open={open}
      onClose={onClose}
      width={480}
    >
      {!point ? (
        <Empty />
      ) : (
        <div>
          {point.is_anomaly && (
            <Alert
              type="warning"
              showIcon
              message="异常点"
              description={point.anomaly_reason}
              style={{ marginBottom: 16 }}
            />
          )}

          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="合成质量分">
              <Text strong style={{ fontSize: 18 }}>{point.composite_score.toFixed(3)}</Text>
              {point.is_anomaly && <Tag color="orange" style={{ marginLeft: 8 }}>异常</Tag>}
            </Descriptions.Item>
            <Descriptions.Item label="功能 (30%)">{point.func_score.toFixed(3)}</Descriptions.Item>
            <Descriptions.Item label="质量 (25%)">{point.qual_score.toFixed(3)}</Descriptions.Item>
            <Descriptions.Item label="稳定性 (25%)">{point.stab_score.toFixed(3)}</Descriptions.Item>
            <Descriptions.Item label="推理 (10%)">{point.reas_score.toFixed(3)}</Descriptions.Item>
            <Descriptions.Item label="效率 (10%)">{point.eff_score.toFixed(3)}</Descriptions.Item>
            <Descriptions.Item label="执行数">{point.execution_count}</Descriptions.Item>
          </Descriptions>

          <div style={{ marginTop: 16 }}>
            <Link
              onClick={() => {
                if (agentId) {
                  const date = dayjs(point.date).format('YYYY-MM-DD');
                  navigate(
                    `/executions?agent_id=${agentId}&created_after=${date}T00:00:00Z&created_before=${date}T23:59:59Z`
                  );
                  onClose();
                }
              }}
            >
              查看当日所有执行记录 →
            </Link>
          </div>
        </div>
      )}
    </Drawer>
  );
}
