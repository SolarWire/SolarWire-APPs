export interface SyntaxError {
  line: number;
  column: number;
  message: string;
  severity: 'error' | 'warning';
  source?: 'parser' | 'diagnostic';
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

  private performRendererCheck(_content: string): void {
    if (this.currentSourceId) {
      this.errorsBySource.set(this.currentSourceId, []);
      this.notifyListeners(this.currentSourceId);
    }
  }

  private addError(error: SyntaxError): void {
    const sourceId = this.currentSourceId;
    if (!sourceId) return;

    const errors = this.errorsBySource.get(sourceId) || [];
    const exists = errors.some(
      e => e.line === error.line && e.column === error.column
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
