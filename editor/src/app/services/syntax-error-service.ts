/**
 * SolarWire 语法错误检测服务
 * 统一管理语法错误检测逻辑，避免重复代码
 */

export interface SyntaxError {
  line: number;
  column: number;
  message: string;
  severity: 'error' | 'warning';
  source?: 'parser' | 'diagnostic';
}

export interface SyntaxErrorListener {
  onErrorsChanged: (errors: SyntaxError[]) => void;
}

class SyntaxErrorService {
  private listeners: SyntaxErrorListener[] = [];
  private currentErrors: SyntaxError[] = [];
  private monacoRef: any = null;
  private originalConsoleError: ((...args: any[]) => void) | null = null;
  private renderCheckTimeout: NodeJS.Timeout | null = null;

  constructor() {
    // 启动渲染器错误监听
    this.startRendererErrorMonitoring();
  }

  /**
   * 注册错误监听器
   */
  addListener(listener: SyntaxErrorListener): void {
    this.listeners.push(listener);
  }

  /**
   * 移除错误监听器
   */
  removeListener(listener: SyntaxErrorListener): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * 通知所有监听器错误变化
   */
  private notifyListeners(): void {
    // 使用setTimeout延迟通知，避免在渲染期间触发setState
    setTimeout(() => {
      this.listeners.forEach(listener => {
        listener.onErrorsChanged([...this.currentErrors]);
      });
    }, 0);
  }

  /**
   * 设置 Monaco 实例引用
   */
  setMonacoRef(monaco: any): void {
    this.monacoRef = monaco;
  }

  /**
   * 启动渲染器错误监听
   */
  startRendererErrorMonitoring(): void {
    if (this.originalConsoleError) return; // 避免重复监听

    this.originalConsoleError = console.error;
    console.error = (...args) => {
      const message = args.join(' ');
      
      if (message.includes('[SolarWirePreview] Parse/Render error:')) {
        this.handleRendererError(message);
        // 不调用原始 console.error，因为错误已通过错误卡片显示
        return;
      }
      
      // 调用原始 console.error（非渲染器错误）
      if (this.originalConsoleError) {
        this.originalConsoleError.apply(console, args);
      }
    };
  }

  /**
   * 停止渲染器错误监听
   */
  stopRendererErrorMonitoring(): void {
    if (this.originalConsoleError) {
      console.error = this.originalConsoleError;
      this.originalConsoleError = null;
    }
  }

  /**
   * 处理渲染器错误
   */
  private handleRendererError(message: string): void {
    // 直接从完整消息中提取 Location 信息
    let line = 1;
    let column = 1;
    let errorMessage = 'Unknown error';

    // 首先尝试提取 Location 信息
    const locationMatch = message.match(/Location:\s*Line\s*(\d+),\s*Column\s*(\d+)/i);
    if (locationMatch) {
      line = parseInt(locationMatch[1]);
      column = parseInt(locationMatch[2]);
    } else {
      // 如果没有 Location 信息，尝试从错误消息中提取 line 和 column
      const lineMatch = message.match(/line\s+(\d+)/i);
      const columnMatch = message.match(/column\s+(\d+)/i);
      if (lineMatch) line = parseInt(lineMatch[1]);
      if (columnMatch) column = parseInt(columnMatch[1]);
    }

    // 尝试提取错误详情
    const detailsMatch = message.match(/Details:\s*\n\s*(.+?)(?:\s*\n\s*Expected|$)/s);
    if (detailsMatch) {
      errorMessage = detailsMatch[1].trim();
    } else {
      // 尝试提取简化的错误消息
      const errorMatch = message.match(/Parse\/Render error:\s*(.+?)(?:\s|$)/);
      if (errorMatch) {
        errorMessage = errorMatch[1];
      }
    }

    const error: SyntaxError = {
      line,
      column,
      message: errorMessage,
      severity: 'error',
      source: 'parser'
    };

    this.addError(error);
  }

  /**
   * 运行 Monaco 诊断（已禁用，只使用渲染器报错）
   */
  runDiagnostics(content: string): void {
    // 此方法已禁用，完全依赖渲染器报错检测
  }

  /**
   * 高性能实时渲染器检测（防抖）
   */
  runRendererCheck(content: string): void {
    // 清除之前的定时器
    if (this.renderCheckTimeout) {
      clearTimeout(this.renderCheckTimeout);
    }
    
    // 设置新的定时器，300ms 后执行检测
    this.renderCheckTimeout = setTimeout(() => {
      this.performRendererCheck(content);
    }, 300);
  }

  /**
   * 执行渲染器检测
   */
  private performRendererCheck(content: string): void {
    // 清除所有之前的错误
    this.currentErrors = [];
    
    // 真正的渲染器报错通过console.error拦截捕获
    // 这里不需要主动解析，等待渲染器实际报错
    
    // 通知监听器（即使没有错误也要通知，以清除之前的错误状态）
    this.notifyListeners();
  }

  /**
   * 添加单个错误
   */
  private addError(error: SyntaxError): void {
    // 检查是否已存在相同位置的错误
    const exists = this.currentErrors.some(
      e => e.line === error.line && e.column === error.column
    );
    
    if (!exists) {
      this.currentErrors.push(error);
      this.notifyListeners();
    }
  }

  /**
   * 清除所有错误
   */
  clearErrors(): void {
    this.currentErrors = [];
    this.notifyListeners();
  }

  /**
   * 获取当前错误列表
   */
  getErrors(): SyntaxError[] {
    return [...this.currentErrors];
  }

  /**
   * 获取错误行号列表
   */
  getErrorLines(): number[] {
    return [...new Set(this.currentErrors.map(e => e.line))];
  }

  /**
   * 清理资源
   */
  dispose(): void {
    this.stopRendererErrorMonitoring();
    this.listeners = [];
    this.currentErrors = [];
    this.monacoRef = null;
  }
}

// 单例实例
export const syntaxErrorService = new SyntaxErrorService();

export default syntaxErrorService;
