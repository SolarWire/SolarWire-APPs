import React, { useRef, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { useAppStore } from '../../stores/appStore';
import './MonacoEditor.css';

interface MonacoEditorProps {
  language: string;
  value: string;
  onChange: (value: string) => void;
  height?: string;
  highlightLines?: number[];
  primaryColor?: string;
}

function MonacoEditor({
  language,
  value,
  onChange,
  height = '100%',
  highlightLines = [],
  primaryColor = '#FCA506'
}: MonacoEditorProps): JSX.Element {
  const { theme } = useAppStore();
  const editorRef = useRef<any>(null);
  const decorationsRef = useRef<string[]>([]);
  
  const handleEditorDidMount = useCallback((editor: any, monaco: any) => {
    editorRef.current = editor;
    
    // 手动注册solarwire语言定义
    if (monaco) {
      // 检查solarwire语言定义
      if (!monaco.languages.getLanguages().some((lang: any) => lang.id === 'solarwire')) {
        monaco.languages.register({ id: 'solarwire' });
        
        // 设置Monarch语法高亮
        monaco.languages.setMonarchTokensProvider('solarwire', {
          tokenizer: {
            root: [
              // Comments
              [/\/\/.*$/, 'comment'],
              
              // Rectangles - 蓝色
              [/\(\("[^"]*"\)\)/, 'type'],
              [/\(\('[^']*'\)\)/, 'type'],
              [/\["[^"]*"\]/, 'type'],
              [/\('[^']*'\)/, 'type'],
              
              // Circles - 蓝色
              [/\(\[[^\]]*\)\)/, 'type'],
              [/\[[^\]]*\]/, 'type'],
              
              // Text - 蓝色
              [/"[^"]*"/, 'type'],
              
              // Lines - 蓝色
              [/--/, 'type'],
              
              // Tables - 紫色
              [/##/, 'namespace'],
              
              // Placeholders - 蓝色
              [/\[\?"[^"]*"\]/, 'type'],
              
              // Images - 蓝色
              [/<[^>]+>/, 'type'],
              
              // Coordinates
              [/@\([^)]+\)/, 'number'],
              [/->\([^)]+\)/, 'number'],
              
              // Attributes - key=value
              [/\b\w+\s*=\s*"[^"]*"/, 'attribute'],
              [/\b\w+\s*=\s*'[^']*'/, 'attribute'],
              [/\b\w+\s*=\s*[^\s]+/, 'attribute'],
              
              // Boolean attributes (bold, italic, note, etc.)
              [/\bbold\b/, 'attribute'],
              [/\bitalic\b/, 'attribute'],
              [/\bnote\b/, 'attribute'],
              
              // Numbers
              [/\b\d+\b/, 'number'],
              
              // Colors - 绿色
              [/#[0-9a-fA-F]{6}/, 'string']
            ]
          }
        });
        
        // 设置语言配置
        monaco.languages.setLanguageConfiguration('solarwire', {
          comments: {
            lineComment: '//'
          },
          brackets: [
            ['(', ')'],
            ['[', ']'],
            ['{', '}']
          ]
        });
      }
    }
  }, []);

  React.useEffect(() => {
    if (!editorRef.current) {
      return;
    }

    const monaco = (window as any).monaco;
    if (!monaco) return;

    let newDecorations: any[] = [];
    if (highlightLines.length > 0) {
      // 创建装饰
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

    // 应用装饰
    decorationsRef.current = editorRef.current.deltaDecorations(
      decorationsRef.current,
      newDecorations
    );
    
    // 滚动到第一个高亮行
    if (highlightLines.length > 0) {
      editorRef.current.revealLineInCenter(highlightLines[0]);
    }
  }, [highlightLines, primaryColor]);
  
  React.useEffect(() => {
    // 注入CSS样式用于高亮
    if (typeof window !== 'undefined' && document) {
      const existingStyle = document.getElementById('monaco-highlight-style');
      if (existingStyle) {
        existingStyle.remove();
      }
      
      const style = document.createElement('style');
      style.id = 'monaco-highlight-style';
      style.textContent = `
        .highlight-line {
          background-color: ${primaryColor}59 !important;
        }
      `;
      document.head.appendChild(style);
    }
  }, [primaryColor]);
  
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
