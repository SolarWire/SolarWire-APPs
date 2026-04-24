import { create } from 'zustand';
import { EditorState, EditorMode } from '../../shared/types/editor';

export const useEditorStore = create<EditorState>()((set, get) => ({
  mode: 'blank',
  content: '',
  isModified: false,
  history: [],
  historyIndex: -1,
  
  setMode: (mode: EditorMode) => set({ mode }),
  setContent: (content: string) => {
    const { content: oldContent, history, historyIndex } = get();
    
    // 只在内容实际变化时记录历史
    if (oldContent !== content) {
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(oldContent);
      
      // 限制历史记录最多 50 条
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
  setModified: (modified: boolean) => set({ isModified: modified }),
  
  undo: () => {
    const { history, historyIndex, content } = get();
    
    if (historyIndex >= 0) {
      const previousContent = history[historyIndex];
      const newHistory = [...history];
      
      // 如果是最后一步，保存当前内容到历史以便 redo
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
}));
