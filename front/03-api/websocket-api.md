# WebSocket API

## 基础信息

| 项目 | 值 |
|------|------|
| 连接地址 | `ws://notifier:8005/ws` 或 `wss://notifier:8005/ws` |
| 认证方式 | Token (query param 或 header) |
| 心跳间隔 | 30 秒 |
| 消息格式 | JSON |

---

## 连接认证

### 方式 1: Query 参数

```typescript
const ws = new WebSocket(`ws://notifier:8005/ws?token=${accessToken}`)
```

### 方式 2: Header

```typescript
const ws = new WebSocket('ws://notifier:8005/ws', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
} as any)
```

---

## 消息协议

### 客户端 → 服务器

#### 1. 订阅事件

```typescript
{
  event: "subscribe",
  filters: {
    user_id?: string,          // 订阅用户相关事件
    organization_id?: string,  // 订阅组织相关事件
    execution_id?: string,     // 订阅特定执行
    batch_id?: string          // 订阅特定批量
  }
}
```

**响应**:
```typescript
{
  event: "subscribed",
  data: {
    subscription_id: string,
    filters: object
  }
}
```

#### 2. 取消订阅

```typescript
{
  event: "unsubscribe",
  subscription_id: string
}
```

#### 3. 心跳

```typescript
{ event: "ping" }
```

**响应**:
```typescript
{ event: "pong" }
```

---

### 服务器 → 客户端

#### 1. 连接确认

```typescript
{
  event: "connected",
  data: {
    client_id: string,
    server_time: number
  }
}
```

#### 2. 通知推送

```typescript
{
  event: "notification",
  data: {
    id: string,
    type: string,
    title: string,
    message: string,
    link?: string,
    metadata: object
  },
  timestamp: number
}
```

#### 3. 执行进度

```typescript
{
  event: "execution_progress",
  data: {
    execution_id: string,
    status: ExecutionStatus,
    progress: number,          // 0-100
    current_step: number,
    total_steps: number,
    message: string,
    started_at: string,
    updated_at: string
  },
  timestamp: number
}
```

#### 4. 执行日志

```typescript
{
  event: "execution_log",
  data: {
    execution_id: string,
    level: "debug" | "info" | "warn" | "error",
    message: string,
    timestamp: number
  }
}
```

#### 5. 执行完成

```typescript
{
  event: "execution_completed",
  data: {
    execution_id: string,
    result: {
      success: boolean,
      exit_code: number,
      output: string,
      duration_ms: number,
      tokens_used: number,
      cost: number
    }
  }
}
```

#### 6. 执行失败

```typescript
{
  event: "execution_failed",
  data: {
    execution_id: string,
    error: string,
    error_code?: number
  }
}
```

#### 7. 批量进度

```typescript
{
  event: "batch_progress",
  data: {
    batch_id: string,
    task_id?: string,
    agent_id?: string,
    benchmark_id?: string,
    status: BatchStatus,
    completed_count: number,
    total_count: number,
    percentage: number,
    timestamp: number
  }
}
```

#### 8. 批量完成

```typescript
{
  event: "batch_completed",
  data: {
    batch_id: string,
    report_id: string,
    timestamp: number
  }
}
```

#### 9. 批量失败

```typescript
{
  event: "batch_failed",
  data: {
    batch_id: string,
    error: string,
    timestamp: number
  }
}
```

#### 10. SWE-bench 进度

```typescript
{
  event: "swe_progress",
  data: {
    task_id: string,
    phase: "init" | "repository" | "indexing" | "executing" | "testing" | "fixing" | "completed" | "failed",
    progress: number,          // 0-100
    message: string
  }
}
```

---

## 错误处理

### 连接错误

```typescript
ws.onerror = (error) => {
  console.error('WebSocket error:', error)
}

ws.onclose = (event) => {
  if (!event.wasClean) {
    console.error('WebSocket disconnected:', event.code, event.reason)
    // 触发重连
  }
}
```

### 错误消息

```typescript
{
  event: "error",
  data: {
    code: string,
    message: string
  }
}
```

| 错误码 | 说明 |
|--------|------|
| AUTH_FAILED | 认证失败 |
| INVALID_FORMAT | 消息格式无效 |
| SUBSCRIPTION_FAILED | 订阅失败 |
| RATE_LIMITED | 请求过于频繁 |

---

## TypeScript 类型定义

```typescript
// src/types/websocket.ts

export type WSMessageType =
  | 'connected'
  | 'subscribed'
  | 'notification'
  | 'execution_progress'
  | 'execution_log'
  | 'execution_completed'
  | 'execution_failed'
  | 'batch_progress'
  | 'batch_status_change'
  | 'batch_completed'
  | 'batch_failed'
  | 'swe_progress'
  | 'error'

export interface WSMessage<T = any> {
  event: WSMessageType
  data: T
  timestamp?: number
}

export interface SubscribeFilters {
  user_id?: string
  organization_id?: string
  execution_id?: string
  batch_id?: string
}

export interface ExecutionProgressData {
  execution_id: string
  status: ExecutionStatus
  progress: number
  current_step: number
  total_steps: number
  message: string
  started_at: string
  updated_at: string
}

export interface ExecutionLogData {
  execution_id: string
  level: 'debug' | 'info' | 'warn' | 'error'
  message: string
  timestamp: number
}

export interface BatchProgressData {
  batch_id: string
  task_id?: string
  agent_id?: string
  benchmark_id?: string
  status: BatchStatus
  completed_count: number
  total_count: number
  percentage: number
  timestamp: number
}
```
