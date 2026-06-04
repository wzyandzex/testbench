# 断线重连策略

## 重连策略概述

WebSocket 连接可能因网络波动、服务重启等原因中断。需要实现自动重连机制，确保服务的可用性。

## 重连策略配置

### 基础配置

```typescript
interface ReconnectConfig {
  enabled: boolean;           // 是否启用自动重连
  maxAttempts: number;        // 最大重连次数
  baseInterval: number;       // 基础重连间隔（毫秒）
  maxInterval: number;        // 最大重连间隔（毫秒）
  backoffFactor: number;      // 退避因子（指数增长）
  jitter: boolean;            // 是否添加随机抖动
}
```

### 默认配置

```typescript
const defaultReconnectConfig: ReconnectConfig = {
  enabled: true,
  maxAttempts: 10,           // 最多重连 10 次
  baseInterval: 1000,        // 初始 1 秒
  maxInterval: 30000,        // 最大 30 秒
  backoffFactor: 2,          // 每次间隔翻倍
  jitter: true,              // 添加随机抖动
};
```

## 指数退避算法

### 计算重连间隔

```typescript
function calculateReconnectInterval(
  attempt: number,
  config: ReconnectConfig
): number {
  // 指数退避: baseInterval * (backoffFactor ^ attempt)
  let interval = config.baseInterval * Math.pow(config.backoffFactor, attempt);

  // 限制最大值
  interval = Math.min(interval, config.maxInterval);

  // 添加随机抖动（避免所有客户端同时重连）
  if (config.jitter) {
    interval = interval * (0.5 + Math.random() * 0.5);
  }

  return Math.floor(interval);
}
```

### 间隔示例

| 尝试次数 | 间隔（无抖动） | 间隔（有抖动范围） |
|---------|---------------|-------------------|
| 1 | 1s | 0.5s - 1s |
| 2 | 2s | 1s - 2s |
| 3 | 4s | 2s - 4s |
| 4 | 8s | 4s - 8s |
| 5 | 16s | 8s - 16s |
| 6+ | 30s | 15s - 30s |

## 重连状态机

```
┌─────────────┐
│ disconnected│
└──────┬──────┘
       │ connect()
       ▼
┌─────────────┐
│  connecting │ ◄─────────────────────┐
└──────┬──────┘                       │
       │ onopen                       │
       ▼                              │
┌─────────────┐    onclose (非主动)   │
│  connected  ├───────────────────────┤
└─────────────┘                       │
       │ onclose (主动)                │
       ▼                              │
┌─────────────┐                       │
│  closed     │                       │
└─────────────┘                       │
                                       │
    ┌──────────────────────────────────┘
    │
    │ onClose (非主动)
    ▼
┌─────────────┐    达到最大次数
│ reconnecting├───────────────────────┐
└──────┬──────┘                       │
       │                              │
       │ 重连成功                      │
       ▼                              │
┌─────────────┐                       │
│  connected  │                       │
└─────────────┘                       │
                                       │
    ┌──────────────────────────────────┘
    │
    │ 重连失败
    ▼
┌─────────────┐
│    failed   │
└─────────────┘
```

## 完整实现

```typescript
// src/services/websocket/reconnect.ts
export class ReconnectManager {
  private config: ReconnectConfig;
  private attempt = 0;
  private timer: NodeJS.Timeout | null = null;
  private state: 'idle' | 'reconnecting' | 'failed' = 'idle';

  private onStateChangeCallbacks = new Set<(state: string) => void>();

  constructor(config: Partial<ReconnectConfig> = {}) {
    this.config = { ...defaultReconnectConfig, ...config };
  }

  // 计算下次重连间隔
  private getNextInterval(): number {
    return calculateReconnectInterval(this.attempt, this.config);
  }

  // 开始重连
  start(connectFn: () => Promise<boolean>): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (!this.config.enabled) {
        this.setState('failed');
        reject(new Error('Reconnect disabled'));
        return;
      }

      if (this.attempt >= this.config.maxAttempts) {
        this.setState('failed');
        reject(new Error('Max reconnect attempts reached'));
        return;
      }

      this.setState('reconnecting');
      this.attempt++;

      const interval = this.getNextInterval();

      console.log(`Reconnect attempt ${this.attempt}/${this.config.maxAttempts} in ${interval}ms`);

      this.timer = setTimeout(async () => {
        try {
          const success = await connectFn();
          if (success) {
            this.reset();
            resolve(true);
          } else {
            // 连接失败，继续重连
            this.start(connectFn).then(resolve).catch(reject);
          }
        } catch (error) {
          // 连接异常，继续重连
          this.start(connectFn).then(resolve).catch(reject);
        }
      }, interval);
    });
  }

  // 停止重连
  stop(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.setState('idle');
  }

  // 重置状态
  reset(): void {
    this.stop();
    this.attempt = 0;
  }

  // 获取当前状态
  getState(): 'idle' | 'reconnecting' | 'failed' {
    return this.state;
  }

  // 获取尝试次数
  getAttempt(): number {
    return this.attempt;
  }

  // 状态变化监听
  onStateChange(callback: (state: string) => void): () => void {
    this.onStateChangeCallbacks.add(callback);
    return () => this.onStateChangeCallbacks.delete(callback);
  }

  private setState(state: 'idle' | 'reconnecting' | 'failed'): void {
    if (this.state !== state) {
      this.state = state;
      this.onStateChangeCallbacks.forEach((cb) => cb(state));
    }
  }
}
```

## 集成到 WebSocketManager

```typescript
// src/services/websocket/index.ts
export class WebSocketManager {
  private reconnectManager: ReconnectManager;

  constructor(options: WebSocketManagerOptions) {
    // ...

    this.reconnectManager = new ReconnectManager(options.reconnect);

    // 监听重连状态
    this.reconnectManager.onStateChange((state) => {
      if (state === 'reconnecting') {
        this.setState('reconnecting');
      } else if (state === 'failed') {
        this.setState('error');
      }
    });
  }

  private handleClose(event: CloseEvent): void {
    this.setState('disconnected');
    this.clearHeartbeat();

    // 主动关闭不重连
    if (event.code === 1000) {
      this.reconnectManager.stop();
      return;
    }

    // 启动重连
    this.startReconnect();
  }

  private startReconnect(): void {
    this.reconnectManager.start(async () => {
      return new Promise((resolve) => {
        try {
          this.connect();

          // 等待连接状态
          const unsubscribe = this.onStateChange((state) => {
            if (state === 'connected') {
              unsubscribe();
              resolve(true);
            } else if (state === 'error') {
              unsubscribe();
              resolve(false);
            }
          });
        } catch {
          resolve(false);
        }
      });
    }).catch((error) => {
      console.error('Reconnect failed:', error);
      // 触发重连失败事件
      this.dispatchEvent(new CustomEvent('reconnect-failed', { detail: error }));
    });
  }
}
```

## UI 反馈

### 连接状态组件

```typescript
// src/components/ConnectionStatus.tsx
import { Badge, Button, Space, Typography } from 'antd';
import { useWebSocket } from '@/hooks/useWebSocket';

const { Text } = Typography;

const statusConfig = {
  disconnected: { status: 'default', text: '未连接' },
  connecting: { status: 'processing', text: '连接中' },
  connected: { status: 'success', text: '已连接' },
  reconnecting: { status: 'warning', text: '重连中' },
  error: { status: 'error', text: '连接失败' },
};

export function ConnectionStatus({ showRetry = true }) {
  const { state, connect, reconnectManager } = useWebSocket();

  const config = statusConfig[state];
  const attempt = reconnectManager?.getAttempt() || 0;

  return (
    <Space align="center">
      <Badge status={config.status as any} text={config.text} />

      {state === 'reconnecting' && (
        <Text type="secondary" style={{ fontSize: 12 }}>
          重连尝试 {attempt}/10
        </Text>
      )}

      {showRetry && (state === 'disconnected' || state === 'error') && (
        <Button size="small" onClick={connect}>
          重新连接
        </Button>
      )}
    </Space>
  );
}
```

### 重连进度提示

```typescript
// src/components/ReconnectingOverlay.tsx
import { Modal, Progress, Typography } from 'antd';
import { useWebSocket } from '@/hooks/useWebSocket';

const { Text } = Typography;

export function ReconnectingOverlay() {
  const { state, reconnectManager } = useWebSocket();

  const attempt = reconnectManager?.getAttempt() || 0;
  const maxAttempts = 10;
  const progress = (attempt / maxAttempts) * 100;

  if (state !== 'reconnecting') return null;

  return (
    <Modal
      open
      closable={false}
      footer={null}
      centered
      width={400}
    >
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <Progress
          type="circle"
          percent={Math.round(progress)}
          status="active"
          strokeColor={{
            '0%': '#108ee9',
            '100%': '#87d068',
          }}
        />
        <div style={{ marginTop: 16 }}>
          <Text>连接中断，正在重连...</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {attempt}/{maxAttempts}
          </Text>
        </div>
      </div>
    </Modal>
  );
}
```

## 手动重连

```typescript
// src/hooks/useWebSocketReconnect.ts
export function useWebSocketReconnect() {
  const { state, connect, disconnect } = useWebSocket();

  const reconnect = useCallback(() => {
    disconnect();
    setTimeout(() => {
      connect();
    }, 100);
  }, [connect, disconnect]);

  const forceReconnect = useCallback(() => {
    disconnect();
    connect();
  }, [connect, disconnect]);

  return {
    state,
    reconnect,
    forceReconnect,
  };
}
```

## 最佳实践

1. **指数退避** - 避免服务器压力
2. **随机抖动** - 避免客户端同时重连
3. **最大次数限制** - 无限重连浪费资源
4. **状态反馈** - 让用户知道连接状态
5. **手动重连** - 提供用户手动触发重连的选项
6. **重连成功恢复** - 重连后自动恢复订阅
