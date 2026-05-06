import { create } from 'zustand';
import { EditorState, EditorMode } from '../../shared/types/editor';
import { eventBus, EditorEvents } from '../../shared/utils/EventBus';
import { syntaxErrorService } from '../services/syntax-error-service';

/**
 * 编辑器状态管理 Store
 * 管理编辑器的内容、模式、修改状态和历史记录
 */
export const useEditorStore = create<EditorState>()((set, get) => {
  // 监听内容变化事件
  eventBus.on(EditorEvents.CONTENT_CHANGED, (content: string) => {
    const { content: oldContent, history, historyIndex } = get();
    if (oldContent !== content) {
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(oldContent);
      
      // 限制历史记录长度为 50
      if (newHistory.length > 50) {
        newHistory.shift();
      }
      
      set({
        content,
        isModified: true,
        history: newHistory,
        historyIndex: newHistory.length - 1
      });
    }
  });

  // 监听模式变化事件
  eventBus.on(EditorEvents.MODE_CHANGED, (mode: EditorMode) => {
    set({ mode });
    
    // 当切换到非SolarWire模式时，清除语法错误状态
    if (mode !== 'solarwire') {
      syntaxErrorService.clearAllErrors();
    }
  });

  return {
    mode: 'blank',
    content: '',
    isModified: false,
    history: [],
    historyIndex: -1,
    
    /**
     * 设置编辑器模式
     */
    setMode: (mode: EditorMode) => set({ mode }),
    
    /**
     * 设置编辑器内容
     * 自动记录历史
     */
    setContent: (content: string) => {
      const { content: oldContent, history, historyIndex } = get();
      
      if (oldContent !== content) {
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(oldContent);
        
        // 限制历史记录长度为 50
        if (newHistory.length > 50) {
          newHistory.shift();
        }
        
        set({
          content,
          isModified: true,
          history: newHistory,
          historyIndex: newHistory.length - 1
        });
      }
    },
    
    /**
     * 设置修改状态
     */
    setModified: (modified: boolean) => set({ isModified: modified }),
    
    /**
     * 清除历史记录
     */
    clearHistory: () => set({ history: [], historyIndex: -1 }),
    
    /**
     * 撤销操作
     */
    undo: () => {
      const { history, historyIndex, content } = get();
      
      if (historyIndex >= 0) {
        const previousContent = history[historyIndex];
        const newHistory = [...history];
        
        // 如果在历史记录末尾，先保存当前内容
        if (historyIndex === history.length - 1) {
          newHistory.push(content);
        }
        
        set({
          content: previousContent,
          isModified: true,
          history: newHistory,
          historyIndex: historyIndex - 1
        });
      }
    }
  };
});
