import { create } from 'zustand';
import { EditorState, EditorMode } from '../types/editor';

const sampleContent = `# Sample Markdown

This is a sample Markdown file to test the editor.

## Features

- **Code highlighting**:
  
  \`\`\`javascript
  function hello() {
    console.log('Hello, world!');
  }
  \`\`\`

- *Italic* and **bold** text
- Lists
  - Item 1
  - Item 2
  - Item 3

- Blockquotes:
  
  > This is a blockquote
  > It can span multiple lines

- Links: [SolarWire](https://solarwire.dev)`;

export const useEditorStore = create<EditorState>((set, get) => ({
  mode: 'solarwire',
  content: sampleContent,
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
