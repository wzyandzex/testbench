# 通知推送

## 概述

**业务目标**: 实时推送系统通知和任务进度

**涉及角色**: 所有用户

**前置条件**: 用户已登录

---

## 核心概念

### 通知类型

| 类型 | 说明 | 优先级 |
|------|------|--------|
| system | 系统公告 | high |
| execution_started | 执行开始 | normal |
| execution_completed | 执行完成 | normal |
| execution_failed | 执行失败 | high |
| batch_completed | 批量完成 | normal |
| batch_failed | 批量失败 | high |
| invitation_received | 收到邀请 | normal |
| invitation_accepted | 邀请被接受 | normal |
| scheduled_task_completed | 定时任务完成 | normal |
| scheduled_task_failed | 定时任务失败 | high |

### 通知状态

| 状态 | 说明 |
|------|------|
| unread | 未读 |
| read | 已读 |
| archived | 已归档 |

---

## 流程 1: WebSocket 连接管理

### 步骤 1: 建立 WebSocket 连接

**触发条件**: 用户登录后

**前端行为**:
- 连接: `ws://notifier:8005/ws`
- 携带 Token:
  ```typescript
  const ws = new WebSocket(`${wsBaseUrl}/ws?token=${accessToken}`)
  ```

**连接状态**:
```typescript
enum ConnectionState {
  CONNECTING = 'connecting',   // 连接中
  CONNECTED = 'connected',     // 已连接
  DISCONNECTED = 'disconnected', // 已断开
  RECONNECTING = 'reconnecting' // 重连中
}
```

### 步骤 2: 处理连接成功

**服务器消息**:
```typescript
{
  event: "connected",
  data: {
    client_id: string,
    server_time: number
  }
}
```

**前端行为**:
```typescript
wsStore.setConnectionState(ConnectionState.CONNECTED)
wsStore.setClientId(data.client_id)
```

### 步骤 3: 订阅事件

**前端行为**:
- 发送订阅消息:
  ```typescript
  {
    event: "subscribe",
    filters: {
      user_id: string,      // 订阅用户相关
      organization_id?: string,  // 订阅组织相关
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

### 步骤 4: 心跳保活

**前端行为**:
- 每 30 秒发送心跳:
  ```typescript
  setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ event: "ping" }))
    }
  }, 30000)
  ```

**服务器响应**:
```typescript
{ event: "pong" }
```

---

## 流程 2: 接收通知

### 消息格式

```typescript
interface WSMessage {
  event: string
  data: any
  timestamp: number
}

// 通用通知
{
  event: "notification",
  data: {
    id: string,
    type: string,
    title: string,
    message: string,
    link?: string,    // 跳转链接
    metadata: object
  },
  timestamp: number
}
```

### 前端处理

```typescript
wsStore.onMessage((message) => {
  switch (message.event) {
    case 'notification':
      notificationStore.addNotification(message.data)
      // 显示 toast
      toast.info(message.data.title, {
        description: message.data.message,
        onClick: () => navigate(message.data.link)
      })
      break

    case 'execution_progress':
      executionStore.updateProgress(message.data)
      break

    case 'batch_progress':
      batchStore.updateProgress(message.data)
      break
  }
})
```

---

## 流程 3: 通知中心

### 步骤 1: 查看通知列表

**用户操作**: 用户点击通知铃铛图标

**前端行为**:
- API 请求: `GET /api/v1/notifications?page=1&page_size=20&status=unread`
- 或使用 WebSocket 获取实时通知

**响应**:
```typescript
{
  code: 0,
  message: "success",
  data: {
    data: Notification[],
    total: number,
    unread_count: number
  }
}

interface Notification {
  id: string,
  type: string,
  title: string,
  message: string,
  link: string,
  status: "unread" | "read",
  metadata: object,
  created_at: string
}
```

### 步骤 2: 标记已读

**用户操作**: 用户点击通知或点击"全部已读"

**前端行为**:
- 单个已读: `PUT /api/v1/notifications/:id/read`
- 全部已读: `PUT /api/v1/notifications/read-all`

### 步骤 3: 删除通知

**用户操作**: 用户点击"删除"

**前端行为**:
- API 请求: `DELETE /api/v1/notifications/:id`

### 步骤 4: 通知设置

**用户操作**: 用户打开通知设置

**前端行为**:
- 加载设置:
  ```typescript
  interface NotificationSettings {
    enabled: boolean,
    types: {
      execution_started: boolean,
      execution_completed: boolean,
      execution_failed: boolean,
      batch_completed: boolean,
      batch_failed: boolean,
      invitation_received: boolean,
      system: boolean
    },
    channels: {
      web: boolean,
      email: boolean
    }
  }
  ```
- 保存设置: `PUT /api/v1/notifications/settings`

---

## 流程 4: 断线重连

### 步骤 1: 检测断线

**触发条件**:
- `WebSocket.onclose` 被触发
- 心跳超时（45 秒无响应）

**前端行为**:
```typescript
wsStore.setConnectionState(ConnectionState.DISCONNECTED)
```

### 步骤 2: 指数退避重连

**前端行为**:
```typescript
let retryCount = 0
const maxRetries = 10
const baseDelay = 1000

function reconnect() {
  if (retryCount >= maxRetries) {
    wsStore.setConnectionState(ConnectionState.DISCONNECTED)
    message.error('连接已断开，请刷新页面')
    return
  }

  const delay = baseDelay * Math.pow(2, retryCount)
  retryCount++

  setTimeout(() => {
    wsStore.setConnectionState(ConnectionState.RECONNECTING)
    connectWebSocket()
  }, delay)
}
```

### 步骤 3: 重连成功

**前端行为**:
- 重置 `retryCount = 0`
- 重新订阅之前的 filters
- 同步离线期间的通知

---

## 流程 5: 执行进度实时推送

### 订阅执行进度

**前端行为**:
```typescript
// 订阅单个执行
{
  event: "subscribe",
  filters: {
    execution_id: "exec-123"
  }
}

// 订阅所有执行
{
  event: "subscribe",
  filters: {
    user_id: "user-456"
  }
}
```

### 进度消息

```typescript
// 进度更新
{
  event: "execution_progress",
  data: {
    execution_id: string,
    status: string,
    progress: number,      // 0-100
    current_step: number,
    total_steps: number,
    message: string,
    timestamp: number
  }
}

// 日志输出
{
  event: "execution_log",
  data: {
    execution_id: string,
    level: "debug" | "info" | "warn" | "error",
    message: string,
    timestamp: number
  }
}

// 步骤完成
{
  event: "execution_step_completed",
  data: {
    execution_id: string,
    step_number: number,
    step_name: string,
    duration_ms: number,
    success: boolean
  }
}
```

### 前端展示

```typescript
// 进度条
<Progress percent={progress} status={status === 'failed' ? 'exception' : 'active'} />

// 步骤列表
<Steps current={currentStep}>
  {steps.map(step => (
    <Step key={step.number} title={step.name} />
  ))}
</Steps>

// 日志面板
<LogViewer logs={logs} autoScroll={true} />
```

---

## 流程 6: 批量执行进度推送

### 批量进度消息

```typescript
// 批量进度
{
  event: "batch_progress",
  data: {
    batch_id: string,
    status: string,
    total_tasks: number,
    completed_tasks: number,
    failed_tasks: number,
    percentage: number,
    timestamp: number
  }
}

// 子任务更新
{
  event: "batch_task_update",
  data: {
    batch_id: string,
    task_id: string,
    agent_id: string,
    benchmark_id: string,
    status: string,
    result?: object
  }
}
```

### 前端展示

```typescript
// 汇总卡片
<Card>
  <Statistic title="总任务" value={totalTasks} />
  <Statistic title="已完成" value={completedTasks} />
  <Statistic title="失败" value={failedTasks} />
  <Progress percent={percentage} />
</Card>

// 任务矩阵
<Table
  columns={agents.map(a => ({ title: a.name }))}
  dataSource={benchmarks}
  pagination={false}
  cellRender={(benchmark, agent) => {
    const task = getTask(benchmark.id, agent.id)
    return <TaskStatusCell status={task?.status} />
  }}
/>
```

---

## 异常场景处理

### WebSocket 连接失败
- 显示"实时连接失败，部分功能可能受影响"
- 提供重试按钮
- 降级到轮询模式

### 消息丢失
- 重连后同步离线消息
- API: `GET /api/v1/notifications/since?timestamp={lastMessageTime}`

### 订阅失败
- 记录错误日志
- 提示"订阅失败，可能无法接收实时通知"

---

## 相关页面

- [通知中心页](../02-pages/notification.md)

## 相关 API

- [WebSocket API](../03-api/websocket-api.md)
- [技术模式 - WebSocket](../04-patterns/websocket.md)
