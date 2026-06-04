# WebSocket 消息类型定义

## 消息格式规范

所有 WebSocket 消息遵循以下 JSON 格式：

```typescript
interface WebSocketMessage {
  type: string;          // 消息类型
  channel?: string;      // 频道名称（可选）
  payload?: any;         // 消息数据（可选）
  timestamp?: string;    // 时间戳（可选）
  id?: string;           // 消息 ID（可选）
}
```

---

## 客户端 → 服务端

### 心跳消息

```typescript
interface PingMessage {
  type: 'ping';
}
```

**用途**：保持连接活跃，防止超时断开。

**频率**：每 30 秒一次。

### 订阅频道

```typescript
interface SubscribeMessage {
  type: 'subscribe';
  channel: string;       // 频道名称
  filters?: Record<string, any>;  // 过滤条件（可选）
}
```

**示例**：

```json
{
  "type": "subscribe",
  "channel": "execution:exec_123"
}
```

### 取消订阅

```typescript
interface UnsubscribeMessage {
  type: 'unsubscribe';
  channel: string;
}
```

**示例**：

```json
{
  "type": "unsubscribe",
  "channel": "execution:exec_123"
}
```

---

## 服务端 → 客户端

### 心跳响应

```typescript
interface PongMessage {
  type: 'pong';
  timestamp: string;
}
```

### 连接确认

```typescript
interface ConnectedMessage {
  type: 'connected';
  connection_id: string;
  server_time: string;
}
```

### 错误消息

```typescript
interface ErrorMessage {
  type: 'error';
  code: string;
  message: string;
  details?: any;
}
```

---

## 业务消息类型

### 执行状态更新

```typescript
interface ExecutionUpdateMessage extends WebSocketMessage {
  type: 'execution_update';
  channel: string;        // 格式: execution:{execution_id}
  payload: {
    execution_id: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'timeout' | 'cancelled';
    progress?: number;     // 0-100
    current_step?: string;
    result?: any;
    error?: string;
    updated_at: string;
  };
}
```

**示例**：

```json
{
  "type": "execution_update",
  "channel": "execution:exec_123",
  "payload": {
    "execution_id": "exec_123",
    "status": "running",
    "progress": 45,
    "current_step": "执行测试用例",
    "updated_at": "2026-01-01T00:00:00Z"
  }
}
```

### 任务进度更新

```typescript
interface TaskProgressMessage extends WebSocketMessage {
  type: 'task_progress';
  channel: string;        // 格式: task:{task_id}
  payload: {
    task_id: string;
    current: number;
    total: number;
    percentage: number;
    status: string;
  };
}
```

### 日志消息

```typescript
interface LogMessage extends WebSocketMessage {
  type: 'log';
  channel: string;        // 格式: logs:{execution_id}
  payload: {
    execution_id: string;
    level: 'debug' | 'info' | 'warn' | 'error';
    message: string;
    timestamp: string;
    source?: string;
  };
}
```

**示例**：

```json
{
  "type": "log",
  "channel": "logs:exec_123",
  "payload": {
    "execution_id": "exec_123",
    "level": "info",
    "message": "开始执行任务",
    "timestamp": "2026-01-01T00:00:00Z",
    "source": "executor"
  }
}
```

### 批量执行进度

```typescript
interface BatchProgressMessage extends WebSocketMessage {
  type: 'batch_progress';
  channel: string;        // 格式: batch:{batch_id}
  payload: {
    batch_id: string;
    total_tasks: number;
    completed_tasks: number;
    failed_tasks: number;
    running_tasks: number;
    pending_tasks: number;
    percentage: number;
    started_at: string;
    estimated_completion?: string;
  };
}
```

**示例**：

```json
{
  "type": "batch_progress",
  "channel": "batch:batch_456",
  "payload": {
    "batch_id": "batch_456",
    "total_tasks": 100,
    "completed_tasks": 45,
    "failed_tasks": 5,
    "running_tasks": 10,
    "pending_tasks": 40,
    "percentage": 45,
    "started_at": "2026-01-01T00:00:00Z"
  }
}
```

### 通知消息

```typescript
interface NotificationMessage extends WebSocketMessage {
  type: 'notification';
  channel: 'notifications';  // 全局通知频道
  payload: {
    id: string;
    type: 'info' | 'success' | 'warning' | 'error';
    title: string;
    message: string;
    link?: string;          // 可跳转链接
    timestamp: string;
  };
}
```

**示例**：

```json
{
  "type": "notification",
  "channel": "notifications",
  "payload": {
    "id": "notif_001",
    "type": "success",
    "title": "执行完成",
    "message": "任务 exec_123 已成功完成",
    "link": "/executions/exec_123",
    "timestamp": "2026-01-01T00:00:00Z"
  }
}
```

### Agent 状态更新

```typescript
interface AgentStatusMessage extends WebSocketMessage {
  type: 'agent_status';
  channel: string;        // 格式: agent:{agent_id}
  payload: {
    agent_id: string;
    status: 'active' | 'inactive' | 'busy' | 'error';
    current_tasks: number;
    max_concurrent_tasks: number;
    memory_usage?: number;
    cpu_usage?: number;
  };
}
```

### 系统状态更新

```typescript
interface SystemStatusMessage extends WebSocketMessage {
  type: 'system_status';
  channel: 'system';
  payload: {
    cpu_usage: number;
    memory_usage: number;
    active_connections: number;
    queue_size: number;
  };
}
```

---

## 频道命名规范

| 频道模式 | 说明 | 示例 |
|---------|------|------|
| `execution:{id}` | 执行记录状态 | `execution:exec_123` |
| `task:{id}` | 任务进度 | `task:task_456` |
| `batch:{id}` | 批量执行进度 | `batch:batch_789` |
| `logs:{id}` | 执行日志流 | `logs:exec_123` |
| `agent:{id}` | Agent 状态 | `agent:agent_001` |
| `notifications` | 全局通知 | `notifications` |
| `system` | 系统状态 | `system` |
| `scheduler` | 调度器状态 | `scheduler` |

---

## TypeScript 类型定义

```typescript
// src/types/websocket.ts
export type WebSocketMessageType =
  | 'ping'
  | 'pong'
  | 'subscribe'
  | 'unsubscribe'
  | 'connected'
  | 'error'
  | 'execution_update'
  | 'task_progress'
  | 'log'
  | 'batch_progress'
  | 'notification'
  | 'agent_status'
  | 'system_status';

export interface BaseWebSocketMessage {
  type: WebSocketMessageType;
  channel?: string;
  timestamp?: string;
  id?: string;
}

export interface WebSocketMessageWithPayload<T> extends BaseWebSocketMessage {
  payload?: T;
}

// 执行更新
export interface ExecutionUpdatePayload {
  execution_id: string;
  status: ExecutionStatus;
  progress?: number;
  current_step?: string;
  result?: any;
  error?: string;
  updated_at: string;
}

// 日志
export interface LogPayload {
  execution_id: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  timestamp: string;
  source?: string;
}

// 通知
export interface NotificationPayload {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  link?: string;
  timestamp: string;
}

// 批量进度
export interface BatchProgressPayload {
  batch_id: string;
  total_tasks: number;
  completed_tasks: number;
  failed_tasks: number;
  running_tasks: number;
  pending_tasks: number;
  percentage: number;
  started_at: string;
  estimated_completion?: string;
}

export type WebSocketMessage =
  | WebSocketMessageWithPayload<ExecutionUpdatePayload>
  | WebSocketMessageWithPayload<LogPayload>
  | WebSocketMessageWithPayload<NotificationPayload>
  | WebSocketMessageWithPayload<BatchProgressPayload>
  | BaseWebSocketMessage;
```

---

## 消息处理器示例

```typescript
// src/services/websocket/handlers.ts
import { message } from 'antd';

export class MessageHandler {
  handleExecutionUpdate(payload: ExecutionUpdatePayload) {
    // 更新 UI 状态
    console.log('Execution update:', payload);

    // 如果完成，显示通知
    if (payload.status === 'completed') {
      message.success(`任务 ${payload.execution_id} 已完成`);
    } else if (payload.status === 'failed') {
      message.error(`任务 ${payload.execution_id} 失败: ${payload.error}`);
    }
  }

  handleLog(payload: LogPayload) {
    // 添加到日志组件
    console.log(`[${payload.level}] ${payload.message}`);
  }

  handleNotification(payload: NotificationPayload) {
    // 显示通知
    const config = {
      type: payload.type,
      message: payload.title,
      description: payload.message,
      duration: 4.5,
    };

    if (payload.link) {
      message.open({
        ...config,
        onClick: () => {
          window.location.href = payload.link!;
        },
      });
    } else {
      message.open(config);
    }
  }

  handleBatchProgress(payload: BatchProgressPayload) {
    // 更新批量执行进度
    console.log('Batch progress:', payload.percentage + '%');
  }
}
```
