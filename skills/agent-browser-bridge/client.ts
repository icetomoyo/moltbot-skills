import { EventEmitter } from 'events';
import WebSocket from 'ws';

interface BrowserState {
  url: string;
  title: string;
  screenshot: string;
  action: string;
  description: string;
  timestamp: string;
}

interface HandoffRequest {
  type: 'handoff_required';
  reason: string;
  url: string;
  message: string;
}

interface TaskResult {
  task: string;
  completed_at: string;
  summary: string;
}

export interface BrowserUseOptions {
  host?: string;
  port?: number;
  reconnect?: boolean;
  reconnectInterval?: number;
}

/**
 * Browser Use Client for OpenClaw
 * 连接到 Python Bridge Service，控制 browser-use Agent
 */
export class BrowserUseClient extends EventEmitter {
  private ws: WebSocket | null = null;
  private url: string;
  private options: Required<BrowserUseOptions>;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isConnected = false;
  private messageQueue: any[] = [];

  constructor(options: BrowserUseOptions = {}) {
    super();
    this.options = {
      host: options.host || 'localhost',
      port: options.port || 8765,
      reconnect: options.reconnect !== false,
      reconnectInterval: options.reconnectInterval || 5000,
    };
    this.url = `ws://${this.options.host}:${this.options.port}/ws`;
  }

  /**
   * 连接到 Bridge Service
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);

        this.ws.on('open', () => {
          console.log('✅ Connected to Browser Bridge');
          this.isConnected = true;
          this.emit('connected');
          
          // 发送队列中的消息
          while (this.messageQueue.length > 0) {
            const msg = this.messageQueue.shift();
            this.send(msg);
          }
          
          resolve();
        });

        this.ws.on('message', (data) => {
          this.handleMessage(data.toString());
        });

        this.ws.on('error', (error) => {
          console.error('❌ WebSocket error:', error);
          this.emit('error', error);
          reject(error);
        });

        this.ws.on('close', () => {
          console.log('🔌 Disconnected from Browser Bridge');
          this.isConnected = false;
          this.emit('disconnected');
          
          if (this.options.reconnect) {
            this.scheduleReconnect();
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * 执行任务
   */
  async executeTask(task: string, options: { headless?: boolean; model?: string } = {}): Promise<void> {
    this.send({
      type: 'execute_task',
      task,
      options,
    });
  }

  /**
   * 获取当前浏览器状态
   */
  async getState(): Promise<BrowserState> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Get state timeout'));
      }, 10000);

      this.once('state', (state) => {
        clearTimeout(timeout);
        resolve(state);
      });

      this.send({ type: 'get_state' });
    });
  }

  /**
   * 停止当前任务
   */
  stop(): void {
    this.send({ type: 'stop' });
  }

  /**
   * 确认人工接管完成
   */
  confirmHandoff(success: boolean = true): void {
    this.send({
      type: 'human_completed',
      success,
    });
  }

  /**
   * 发送消息
   */
  private send(message: any): void {
    const data = JSON.stringify(message);
    
    if (this.isConnected && this.ws) {
      this.ws.send(data);
    } else {
      this.messageQueue.push(message);
    }
  }

  /**
   * 处理接收到的消息
   */
  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data);
      
      switch (message.type) {
        case 'state_update':
          this.emit('stateUpdate', message as BrowserState);
          break;
        
        case 'state':
          this.emit('state', message);
          break;
        
        case 'handoff_required':
          this.handleHandoff(message as HandoffRequest);
          break;
        
        case 'task_completed':
          this.emit('taskCompleted', message.result as TaskResult);
          break;
        
        case 'task_cancelled':
          this.emit('taskCancelled', message);
          break;
        
        case 'error':
          console.error('Bridge error:', message.message);
          this.emit('error', new Error(message.message));
          break;
        
        case 'stopped':
          this.emit('stopped');
          break;
        
        default:
          console.log('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Failed to parse message:', error);
    }
  }

  /**
   * 处理人工接管请求
   */
  private async handleHandoff(request: HandoffRequest): Promise<void> {
    console.log(`🤖 Handoff required: ${request.message}`);
    console.log(`   URL: ${request.url}`);
    
    // 触发事件，让 UI 层处理
    this.emit('handoffRequired', request);
  }

  /**
   * 安排重连
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    
    console.log(`⏰ Reconnecting in ${this.options.reconnectInterval}ms...`);
    
    this.reconnectTimer = setTimeout(async () => {
      this.reconnectTimer = null;
      try {
        await this.connect();
      } catch (error) {
        console.error('Reconnect failed:', error);
      }
    }, this.options.reconnectInterval);
  }
}

export default BrowserUseClient;
