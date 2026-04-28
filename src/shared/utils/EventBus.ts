type EventCallback<T = any> = (data: T) => void;

class EventBus {
  private listeners: Map<string, Set<EventCallback>> = new Map();

  on<T = any>(event: string, callback: EventCallback<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    
    // 返回取消订阅函数
    return () => this.off(event, callback);
  }

  off<T = any>(event: string, callback: EventCallback<T>): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(callback);
      if (eventListeners.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  emit<T = any>(event: string, data: T): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for "${event}":`, error);
        }
      });
    }
  }

  once<T = any>(event: string, callback: EventCallback<T>): void {
    const wrappedCallback = (data: T) => {
      callback(data);
      this.off(event, wrappedCallback);
    };
    this.on(event, wrappedCallback);
  }

  clear(): void {
    this.listeners.clear();
  }

  clearEvent(event: string): void {
    this.listeners.delete(event);
  }

  listenerCount(event: string): number {
    return this.listeners.get(event)?.size || 0;
  }
}

// 创建全局事件总线实例
export const eventBus = new EventBus();

// 定义编辑器相关的事件类型
export enum EditorEvents {
  CONTENT_CHANGED = 'editor:content:changed',
  MODE_CHANGED = 'editor:mode:changed',
  FILE_OPENED = 'file:opened',
  FILE_SAVED = 'file:saved',
  SELECTION_CHANGED = 'selection:changed',
  SETTINGS_CHANGED = 'settings:changed',
  COMPONENT_LIBRARY_CHANGED = 'component:library:changed',
}

export default EventBus;
