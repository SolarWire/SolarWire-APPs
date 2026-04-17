import React, { useRef, useCallback, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { useAppStore } from '../../stores/appStore';
import './MonacoEditor.css';

interface MonacoEditorProps {
  language: string;
  value: string;
  onChange: (value: string) => void;
  height?: string;
  highlightLines?: number[];
  scrollTrigger?: number;
  highlightTrigger?: number;
  autoScroll?: boolean;
}

function MonacoEditor({
  language,
  value,
  onChange,
  height = '100%',
  highlightLines = [],
  scrollTrigger,
  highlightTrigger
}: MonacoEditorProps): JSX.Element {
  const { theme } = useAppStore();
  const monacoRef = useRef<any>(null);
  const editorRef = useRef<any>(null);
  const decorationsRef = useRef<string[]>([]);
  const prevScrollTriggerRef = useRef<number>(0);
  const prevHighlightTriggerRef = useRef<number>(0);
  const highlightLinesRef = useRef<number[]>(highlightLines);
  
  // 保存待应用的高亮/滚动数据，用于编辑器挂载后应用
  const pendingHighlightRef = useRef<{lines: number[], trigger: number} | null>(null);
  const pendingScrollRef = useRef<{scrollTrigger: number, line: number} | null>(null);
  
  // 始终同步 highlightLines 到 ref，确保滚动时使用最新值
  highlightLinesRef.current = highlightLines;
  
  const handleEditorDidMount = useCallback((editor: any, monaco: any) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    
    // 检查是否有待应用的高亮数据
    if (pendingHighlightRef.current && pendingHighlightRef.current.lines.length > 0) {
      const newDecorations = pendingHighlightRef.current.lines.map(line => ({
        range: new monaco.Range(line, 1, line, 1),
        options: {
          isWholeLine: true,
          className: 'highlight-line',
          inlineClassName: 'highlight-line-inline',
          glyphMarginClassName: 'highlight-line-glyph'
        }
      }));
      decorationsRef.current = editor.deltaDecorations([], newDecorations);
      pendingHighlightRef.current = null;
    }

    // 检查是否有待应用的滚动数据
    if (pendingScrollRef.current) {
      editor.revealLineInCenter(pendingScrollRef.current.line);
      pendingScrollRef.current = null;
    }
    
    if (monaco) {
      if (!monaco.languages.getLanguages().some((lang: any) => lang.id === 'solarwire')) {
        monaco.languages.register({ id: 'solarwire' });
        
        monaco.languages.setMonarchTokensProvider('solarwire', {
          tokenizer: {
            root: [
              [/\/\/.*$/, 'comment'],
              [/\(\("[^"]*"\)\)/, 'type'],
              [/\(\('[^']*'\)\)/, 'type'],
              [/\["[^"]*"\]/, 'type'],
              [/\('[^']*'\)/, 'type'],
              [/\(\[[^\]]*\)\)/, 'type'],
              [/\[[^\]]*\]/, 'type'],
              [/"[^"]*"/, 'type'],
              [/--/, 'type'],
              [/##/, 'namespace'],
              [/\[\?"[^"]*"\]/, 'type'],
              [/<[^>]+>/, 'type'],
              [/@\([^)]+\)/, 'number'],
              [/->\([^)]+\)/, 'number'],
              [/\b\w+\s*=\s*"[^"]*"/, 'attribute'],
              [/\b\w+\s*=\s*'[^']*'/, 'attribute'],
              [/\b\w+\s*=\s*[^\s]+/, 'attribute'],
              [/\bbold\b/, 'attribute'],
              [/\bitalic\b/, 'attribute'],
              [/\bnote\b/, 'attribute'],
              [/\b\d+\b/, 'number'],
              [/#[0-9a-fA-F]{6}/, 'string']
            ]
          }
        });
        
        monaco.languages.setLanguageConfiguration('solarwire', {
          comments: { lineComment: '//' },
          brackets: [['(', ')'], ['[', ']'], ['{', '}']]
        });
      }
    }
  }, []);

  // Effect 1: 更新高亮装饰（不滚动）
  useEffect(() => {
    if (!editorRef.current) {
      pendingHighlightRef.current = { lines: highlightLines, trigger: highlightTrigger || 0 };
      return;
    }
    const monaco = monacoRef.current;
    if (!monaco) return;

    let newDecorations: any[] = [];
    if (highlightLines.length > 0) {
      newDecorations = highlightLines.map(line => ({
        range: new monaco.Range(line, 1, line, 1),
        options: {
          isWholeLine: true,
          className: 'highlight-line',
          inlineClassName: 'highlight-line-inline',
          glyphMarginClassName: 'highlight-line-glyph'
        }
      }));
    }

    decorationsRef.current = editorRef.current.deltaDecorations(
      decorationsRef.current,
      newDecorations
    );
  }, [highlightLines]);

  // Effect 2: 仅在 scrollTrigger 变化时滚动一次
  useEffect(() => {
    if (scrollTrigger === undefined || scrollTrigger === 0) return;
    if (scrollTrigger === prevScrollTriggerRef.current) return;
    
    prevScrollTriggerRef.current = scrollTrigger;
    
    // 使用 ref 获取最新的 highlightLines，避免将其加入依赖数组
    if (highlightLinesRef.current.length === 0) return;

    const firstLine = Math.min(...highlightLinesRef.current);
    
    if (!editorRef.current) {
      // 编辑器未准备好，保存待滚动的数据
      pendingScrollRef.current = { scrollTrigger, line: firstLine };
      return;
    }
    
    editorRef.current.revealLineInCenter(firstLine);
  }, [scrollTrigger]);

  // Effect 3: 仅在 highlightTrigger 变化时强制更新高亮装饰
  useEffect(() => {
    if (!editorRef.current) return;
    if (highlightTrigger === undefined || highlightTrigger === 0) return;
    if (highlightTrigger === prevHighlightTriggerRef.current) return;
    
    prevHighlightTriggerRef.current = highlightTrigger;
    
    const monaco = monacoRef.current;
    if (!monaco || highlightLinesRef.current.length === 0) return;

    const newDecorations = highlightLinesRef.current.map(line => ({
      range: new monaco.Range(line, 1, line, 1),
      options: {
        isWholeLine: true,
        className: 'highlight-line',
        inlineClassName: 'highlight-line-inline',
        glyphMarginClassName: 'highlight-line-glyph'
      }
    }));

    decorationsRef.current = editorRef.current.deltaDecorations(
      decorationsRef.current,
      newDecorations
    );
  }, [highlightTrigger]);
  
  return (
    <div className="monaco-editor">
      <Editor
        height={height}
        language={language}
        value={value}
        onChange={(val) => onChange(val || '')}
        theme={theme === 'dark' ? 'vs-dark' : 'vs'}
        onMount={handleEditorDidMount}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          wordWrap: 'on',
        }}
      />
    </div>
  );
}

export default MonacoEditor;
