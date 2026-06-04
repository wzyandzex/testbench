type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

type MessageHandler = (data: any) => void;
type ConnectionHandler = (state: ConnectionState) => void;

interface WebSocketManagerOptions {
  url: string;
  token: string | null;
  heartbeatInterval?: number;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

/**
 * WebSocket 连接管理器
 */
export class WebSocketManager {
  private ws: WebSocket | null = null;
  private url: string;
  private token: string | null;
  private state: ConnectionState = 'disconnected';
  private heartbeatInterval: number;
  private reconnectInterval: number;
  private maxReconnectAttempts: number;
  private reconnectAttempts = 0;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  // 订阅管理
  private subscriptions = new Map<string, Set<MessageHandler>>();
  private onceSubscriptions = new Map<string, Set<MessageHandler>>();

  // 事件监听器
  private stateListeners = new Set<ConnectionHandler>();
  private messageListeners = new Set<MessageHandler>();

  constructor(options: WebSocketManagerOptions) {
    this.url = options.url;
    this.token = options.token;
    this.heartbeatInterval = options.heartbeatInterval || 30000;
    this.reconnectInterval = options.reconnectInterval || 3000;
    this.maxReconnectAttempts = options.maxReconnectAttempts || 10;
  }

  /**
   * 连接
   */
  connect(): void {
    if (this.state === 'connected' || this.state === 'connecting') {
      return;
    }

    this.setState('connecting');

    try {
      const wsUrl = this.url;
      const protocols = this.token ? [`Bearer.${this.token}`] : undefined;
      this.ws = new WebSocket(wsUrl, protocols);

      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
      this.ws.onerror = this.handleError.bind(this);
    } catch (error) {
      this.setState('error');
      this.scheduleReconnect();
    }
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    this.clearHeartbeat();
    this.clearReconnect();

    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onclose = null;
      this.ws.onerror = null;
      this.ws.close();
      this.ws = null;
    }

    this.setState('disconnected');
  }

  /**
   * 更新 Token
   */
  updateToken(token: string): void {
    this.token = token;
    if (this.state === 'connected') {
      // 重新连接以使用新 Token
      this.disconnect();
      this.connect();
    }
  }

  /**
   * 订阅频道
   */
  subscribe(channel: string, handler: MessageHandler): () => void {
    if (!this.subscriptions.has(channel)) {
      this.subscriptions.set(channel, new Set());
    }
    this.subscriptions.get(channel)!.add(handler);

    // 发送订阅消息
    this.send({ type: 'subscribe', channel });

    // 返回取消订阅函数
    return () => this.unsubscribe(channel, handler);
  }

  /**
   * 取消订阅
   */
  unsubscribe(channel: string, handler?: MessageHandler): void {
    if (handler) {
      this.subscriptions.get(channel)?.delete(handler);
      if (this.subscriptions.get(channel)?.size === 0) {
        this.subscriptions.delete(channel);
        this.send({ type: 'unsubscribe', channel });
      }
    } else {
      this.subscriptions.delete(channel);
      this.send({ type: 'unsubscribe', channel });
    }
  }

  /**
   * 一次性订阅
   */
  subscribeOnce(channel: string, handler: MessageHandler): void {
    if (!this.onceSubscriptions.has(channel)) {
      this.onceSubscriptions.set(channel, new Set());
    }
    this.onceSubscriptions.get(channel)!.add(handler);
    this.subscribe(channel, handler);
  }

  /**
   * 发送消息
   */
  send(data: any): boolean {
    if (this.state !== 'connected' || !this.ws) {
      console.warn('WebSocket not connected');
      return false;
    }

    try {
      this.ws.send(JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Failed to send WebSocket message:', error);
      return false;
    }
  }

  /**
   * 监听连接状态
   */
  onStateChange(handler: ConnectionHandler): () => void {
    this.stateListeners.add(handler);
    return () => this.stateListeners.delete(handler);
  }

  /**
   * 监听所有消息
   */
  onMessage(handler: MessageHandler): () => void {
    this.messageListeners.add(handler);
    return () => this.messageListeners.delete(handler);
  }

  /**
   * 获取连接状态
   */
  getState(): ConnectionState {
    return this.state;
  }

  // ==================== 私有方法 ====================

  private setState(state: ConnectionState): void {
    if (this.state !== state) {
      this.state = state;
      this.stateListeners.forEach((handler) => handler(state));
    }
  }

  private handleOpen(): void {
    this.setState('connected');
    this.reconnectAttempts = 0;
    this.startHeartbeat();

    // 重新订阅所有频道
    this.resubscribeAll();
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data);

      // 处理心跳响应
      if (data.type === 'pong') {
        return;
      }

      // 通知所有消息监听器
      this.messageListeners.forEach((handler) => handler(data));

      // 通知特定频道订阅者
      if (data.channel) {
        const handlers = this.subscriptions.get(data.channel);
        handlers?.forEach((handler) => {
          handler(data.payload || data);
        });

        // 处理一次性订阅
        const onceHandlers = this.onceSubscriptions.get(data.channel);
        onceHandlers?.forEach((handler) => {
          handler(data.payload || data);
          this.unsubscribe(data.channel, handler);
        });
        this.onceSubscriptions.delete(data.channel);
      }
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }

  private handleClose(event: CloseEvent): void {
    this.setState('disconnected');
    this.clearHeartbeat();

    // 如果不是主动关闭，尝试重连
    if (event.code !== 1000) {
      this.scheduleReconnect();
    }
  }

  private handleError(): void {
    this.setState('error');
  }

  private startHeartbeat(): void {
    this.clearHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      this.send({ type: 'ping' });
    }, this.heartbeatInterval);
  }

  private clearHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnect attempts reached');
      return;
    }

    this.clearReconnect();
    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect();
    }, this.reconnectInterval * Math.min(this.reconnectAttempts, 5)); // 指数退避
  }

  private clearReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private resubscribeAll(): void {
    this.subscriptions.forEach((_, channel) => {
      this.send({ type: 'subscribe', channel });
    });
  }
}
