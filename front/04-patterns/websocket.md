# WebSocket 集成

## 概述

WebSocket 用于接收实时通知和任务进度更新。

---

## 连接管理

### 单例连接

```typescript
// src/stores/wsStore.ts
import { create } from 'zustand'

interface WSStore {
  socket: WebSocket | null
  connectionState: ConnectionState
  clientId: string | null
  subscriptions: Set<string>

  connect: () => void
  disconnect: () => void
  subscribe: (filters: SubscribeFilters, callback: MessageCallback) => () => void
  send: (message: any) => void
}

export const useWSStore = create<WSStore>((set, get) => ({
  socket: null,
  connectionState: ConnectionState.DISCONNECTED,
  clientId: null,
  subscriptions: new Set(),

  connect: () => {
    const token = localStorage.getItem('access_token')
    const wsUrl = import.meta.env.VITE_WS_BASE_URL

    const ws = new WebSocket(`${wsUrl}?token=${token}`)

    ws.onopen = () => {
      set({ connectionState: ConnectionState.CONNECTED })
    }

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data)
      handleMessage(message)
    }

    ws.onclose = () => {
      set({ connectionState: ConnectionState.DISCONNECTED })
      // 触发重连
      setTimeout(() => get().connect(), 3000)
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
    }

    set({ socket: ws })
  },

  disconnect: () => {
    const { socket } = get()
    if (socket) {
      socket.close()
      set({ socket: null, connectionState: ConnectionState.DISCONNECTED })
    }
  },

  subscribe: (filters, callback) => {
    const { socket } = get()
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not connected')
      return () => {}
    }

    const subscriptionId = generateId()
    const message = {
      event: 'subscribe',
      filters,
      subscription_id: subscriptionId
    }

    socket.send(JSON.stringify(message))

    // 注册回调
    messageCallbacks.set(subscriptionId, callback)

    // 返回取消订阅函数
    return () => {
      socket.send(JSON.stringify({
        event: 'unsubscribe',
        subscription_id: subscriptionId
      }))
      messageCallbacks.delete(subscriptionId)
    }
  },

  send: (message) => {
    const { socket } = get()
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message))
    }
  }
}))
```

---

## 自动重连

### 指数退避策略

```typescript
// src/utils/websocket-reconnect.ts
class ReconnectManager {
  private retryCount = 0
  private maxRetries = 10
  private baseDelay = 1000
  private maxDelay = 30000

  getNextDelay(): number {
    const delay = Math.min(
      this.baseDelay * Math.pow(2, this.retryCount),
      this.maxDelay
    )
    this.retryCount++
    return delay
  }

  reset(): void {
    this.retryCount = 0
  }
}

// 在 wsStore 中使用
const reconnectManager = new ReconnectManager()

ws.onclose = () => {
  set({ connectionState: ConnectionState.RECONNECTING })

  const delay = reconnectManager.getNextDelay()
  setTimeout(() => {
    get().connect()
  }, delay)
}

ws.onopen = () => {
  reconnectManager.reset()
  set({ connectionState: ConnectionState.CONNECTED })
}
```

---

## 心跳保活

```typescript
// src/utils/websocket-heartbeat.ts
class HeartbeatManager {
  private interval: NodeJS.Timeout | null = null
  private timeout: NodeJS.Timeout | null = null
  private heartbeatInterval = 30000  // 30 秒
  private heartbeatTimeout = 45000    // 45 秒

  start(ws: WebSocket, onTimeout: () => void): void {
    this.stop()

    // 定期发送 ping
    this.interval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ event: 'ping' }))

        // 设置超时检测
        this.timeout = setTimeout(onTimeout, this.heartbeatTimeout)
      }
    }, this.heartbeatInterval)
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null
    }
    if (this.timeout) {
      clearTimeout(this.timeout)
      this.timeout = null
    }
  }

  onPong(): void {
    // 收到 pong，清除超时
    if (this.timeout) {
      clearTimeout(this.timeout)
      this.timeout = null
    }
  }
}
```

---

## 消息处理

```typescript
// src/utils/websocket-handler.ts
type MessageCallback = (message: WSMessage) => void

const messageCallbacks = new Map<string, MessageCallback>()

function handleMessage(message: WSMessage): void {
  switch (message.event) {
    case 'pong':
      heartbeatManager.onPong()
      break

    case 'notification':
      // 分发到所有订阅者
      notifySubscribers('notification', message)
      // 显示 toast
      showNotificationToast(message.data)
      break

    case 'execution_progress':
    case 'execution_log':
    case 'execution_completed':
    case 'execution_failed':
      // 分发到订阅特定执行的回调
      notifySubscribers(message.data.execution_id, message)
      break

    case 'batch_progress':
    case 'batch_completed':
    case 'batch_failed':
      // 分发到订阅特定批量的回调
      notifySubscribers(message.data.batch_id, message)
      break

    default:
      console.warn('Unknown WebSocket event:', message.event)
  }
}

function notifySubscribers(key: string, message: WSMessage): void {
  messageCallbacks.forEach((callback, subscriptionId) => {
    if (subscriptionId.startsWith(key)) {
      callback(message)
    }
  })
}
```

---

## React Hook

```typescript
// src/hooks/useWebSocket.ts
import { useEffect, useRef } from 'react'
import { useWSStore } from '@/stores/wsStore'

export function useWebSocket(
  filters: SubscribeFilters,
  callback: MessageCallback,
  enabled = true
) {
  const unsubscribeRef = useRef<(() => void) | null>(null)
  const wsStore = useWSStore()

  useEffect(() => {
    if (!enabled) return

    // 确保 WebSocket 已连接
    if (wsStore.connectionState === ConnectionState.DISCONNECTED) {
      wsStore.connect()
    }

    // 订阅
    unsubscribeRef.current = wsStore.subscribe(filters, callback)

    return () => {
      // 取消订阅
      unsubscribeRef.current?.()
    }
  }, [JSON.stringify(filters), enabled])

  return {
    connected: wsStore.connectionState === ConnectionState.CONNECTED,
    sendMessage: wsStore.send
  }
}
```

---

## 使用示例

### 订阅执行进度

```typescript
// src/pages/ExecutionDetailPage.tsx
import { useWebSocket } from '@/hooks/useWebSocket'

function ExecutionDetailPage({ executionId }: { executionId: string }) {
  const [progress, setProgress] = useState(0)
  const [logs, setLogs] = useState<LogEntry[]>([])

  useWebSocket(
    { execution_id: executionId },
    (message) => {
      switch (message.event) {
        case 'execution_progress':
          setProgress(message.data.progress)
          break
        case 'execution_log':
          setLogs(prev => [...prev, message.data])
          break
      }
    },
    true // enabled
  )

  return (
    <div>
      <Progress percent={progress} />
      <LogViewer logs={logs} />
    </div>
  )
}
```

### 订阅所有通知

```typescript
// src/App.tsx
function App() {
  const { addNotification } = useNotificationStore()

  useWebSocket(
    { user_id: currentUser.id },
    (message) => {
      if (message.event === 'notification') {
        addNotification(message.data)
      }
    }
  )

  return <Routes>{/* ... */}</Routes>
}
```

---

## 离线消息同步

当 WebSocket 重连成功后，同步离线期间的消息：

```typescript
ws.onopen = () => {
  set({ connectionState: ConnectionState.CONNECTED })
  reconnectManager.reset()

  // 同步离线消息
  syncOfflineMessages()
}

async function syncOfflineMessages() {
  const lastMessageTime = localStorage.getItem('last_message_time')

  if (!lastMessageTime) return

  const res = await api.get('/notifications/since', {
    params: { timestamp: lastMessageTime }
  })

  res.data.data.forEach((notification: Notification) => {
    handleMessage({
      event: 'notification',
      data: notification
    })
  })
}
```
