import { parse } from '../../lib/parser';
import { render } from '../../lib/renderer';

export interface SyntaxError {
  line: number;
  column: number;
  message: string;
  severity: 'error' | 'warning';
  source?: 'parser' | 'renderer' | 'diagnostic';
}

export interface SyntaxErrorListener {
  sourceId: string;
  onErrorsChanged: (errors: SyntaxError[]) => void;
}

class SyntaxErrorService {
  private listeners: SyntaxErrorListener[] = [];
  private errorsBySource: Map<string, SyntaxError[]> = new Map();
  private monacoRef: any = null;
  private originalConsoleError: ((...args: any[]) => void) | null = null;
  private renderCheckTimeout: NodeJS.Timeout | null = null;
  private monitoringRefCount = 0;
  private currentSourceId: string | null = null;
  private isMonitoringStarted = false;

  addListener(listener: SyntaxErrorListener): void {
    this.listeners.push(listener);
  }

  removeListener(listener: SyntaxErrorListener): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
    this.errorsBySource.delete(listener.sourceId);
  }

  private notifyListeners(sourceId: string): void {
    setTimeout(() => {
      const errors = this.errorsBySource.get(sourceId) || [];
      this.listeners
        .filter(l => l.sourceId === sourceId)
        .forEach(listener => {
          listener.onErrorsChanged([...errors]);
        });
    }, 0);
  }

  setMonacoRef(monaco: any): void {
    this.monacoRef = monaco;
  }

  setCurrentSourceId(sourceId: string | null): void {
    this.currentSourceId = sourceId;
  }

  startRendererErrorMonitoring(): void {
    this.monitoringRefCount++;
    if (this.originalConsoleError) return;

    this.originalConsoleError = console.error;
    console.error = (...args) => {
      const message = args.join(' ');
      
      if (message.includes('[SolarWirePreview] Parse/Render error:')) {
        this.handleRendererError(message);
        return;
      }
      
      if (this.originalConsoleError) {
        this.originalConsoleError.apply(console, args);
      }
    };
  }

  stopRendererErrorMonitoring(): void {
    this.monitoringRefCount = Math.max(0, this.monitoringRefCount - 1);
    if (this.monitoringRefCount > 0) return;
    if (this.originalConsoleError) {
      console.error = this.originalConsoleError;
      this.originalConsoleError = null;
    }
  }

  private handleRendererError(message: string): void {
    let line = 1;
    let column = 1;
    let errorMessage = 'Unknown error';

    const locationMatch = message.match(/Location:\s*Line\s*(\d+),\s*Column\s*(\d+)/i);
    if (locationMatch) {
      line = parseInt(locationMatch[1]);
      column = parseInt(locationMatch[2]);
    } else {
      const lineMatch = message.match(/line\s+(\d+)/i);
      const columnMatch = message.match(/column\s+(\d+)/i);
      if (lineMatch) line = parseInt(lineMatch[1]);
      if (columnMatch) column = parseInt(columnMatch[1]);
    }

    const detailsMatch = message.match(/Details:\s*\n\s*(.+?)(?:\s*\n\s*Expected|$)/s);
    if (detailsMatch) {
      errorMessage = detailsMatch[1].trim();
    } else {
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

  runDiagnostics(_content: string): void {
  }

  runRendererCheck(content: string): void {
    if (this.renderCheckTimeout) {
      clearTimeout(this.renderCheckTimeout);
    }
    
    this.renderCheckTimeout = setTimeout(() => {
      this.performRendererCheck(content);
    }, 300);
  }

  private performRendererCheck(content: string): void {
    if (!this.currentSourceId) return;

    const errors: SyntaxError[] = [];

    if (content && content.trim()) {
      // 1. 解析检查
      let ast: any = null;
      try {
        ast = parse(content);
      } catch (parseErr: any) {
        const error = this.extractErrorFromMessage(parseErr.message || String(parseErr), 'parser');
        if (error) errors.push(error);
      }

      // 2. 渲染检查（仅当解析成功时）
      if (ast) {
        try {
          render(ast, {
            disableNotes: false,
            selectedElementIds: [],
            primaryColor: '#FCA506',
            sourceInput: content,
          }, true);
        } catch (renderErr: any) {
          const error = this.extractErrorFromMessage(renderErr.message || String(renderErr), 'renderer');
          if (error) errors.push(error);
        }
      }
    }

    this.errorsBySource.set(this.currentSourceId, errors);
    this.notifyListeners(this.currentSourceId);
  }

  private extractErrorFromMessage(message: string, source: 'parser' | 'renderer'): SyntaxError | null {
    let line = 1;
    let column = 1;
    let errorMessage = 'Unknown error';

    // 提取 line/column
    // 解析错误格式：Location: Line X, Column Y
    const parseLocationMatch = message.match(/Location:\s*Line\s*(\d+),\s*Column\s*(\d+)/i);
    if (parseLocationMatch) {
      line = parseInt(parseLocationMatch[1]);
      column = parseInt(parseLocationMatch[2]);
    } else {
      // 渲染错误格式：Position: line X
      const renderPositionMatch = message.match(/Position:\s*line\s*(\d+)/i);
      if (renderPositionMatch) {
        line = parseInt(renderPositionMatch[1]);
      } else {
        // 回退：尝试匹配 "line N" 格式
        const lineMatch = message.match(/line\s+(\d+)/i);
        if (lineMatch) line = parseInt(lineMatch[1]);
      }
    }

    // 提取错误消息
    // 格式：═...═\n  <title>\n═...═\n\n  Location/Position: ...\n\n  <message/reason>\n
    // 提取 ═ 之间的 title
    const titleMatch = message.match(/═+\s*\n\s+(.+?)\n\s*═+/);
    if (titleMatch) {
      errorMessage = titleMatch[1].trim();
    } else {
      // 回退：提取第一行非空内容
      const lines = message.split('\n').filter(l => l.trim());
      errorMessage = lines[0]?.trim() || 'Unknown error';
    }

    return {
      line,
      column,
      message: errorMessage,
      severity: 'error',
      source
    };
  }

  private addError(error: SyntaxError): void {
    const sourceId = this.currentSourceId;
    if (!sourceId) return;

    const errors = this.errorsBySource.get(sourceId) || [];
    const exists = errors.some(
      e => e.line === error.line && e.column === error.column && e.message === error.message
    );
    
    if (!exists) {
      errors.push(error);
      this.errorsBySource.set(sourceId, errors);
      this.notifyListeners(sourceId);
    }
  }

  clearErrors(sourceId: string): void {
    this.errorsBySource.set(sourceId, []);
    this.notifyListeners(sourceId);
  }

  clearAllErrors(): void {
    const sourceIds = [...this.errorsBySource.keys()];
    this.errorsBySource.clear();
    sourceIds.forEach(id => this.notifyListeners(id));
  }

  getErrors(sourceId?: string): SyntaxError[] {
    if (sourceId) {
      return [...(this.errorsBySource.get(sourceId) || [])];
    }
    const all: SyntaxError[] = [];
    this.errorsBySource.forEach(errors => all.push(...errors));
    return all;
  }

  getErrorLines(sourceId: string): number[] {
    return [...new Set((this.errorsBySource.get(sourceId) || []).map(e => e.line))];
  }

  dispose(): void {
    this.stopRendererErrorMonitoring();
    this.listeners = [];
    this.errorsBySource.clear();
    this.monacoRef = null;
  }
}

export const syntaxErrorService = new SyntaxErrorService();

export default syntaxErrorService;
