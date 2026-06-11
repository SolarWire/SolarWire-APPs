import React, { useRef, useCallback, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { useAppStore } from '../../stores/appStore';
import { isDarkTheme } from '../../../shared/types/app';
import { syntaxErrorService, SyntaxError } from '../../services/syntax-error-service';
import { useStatusStore } from '../../stores/statusStore';
import { registerSolarWireLanguage, getThemeName } from '../../../shared/utils/solarwire-language';
import { registerSolarWireCompletion } from '../../../shared/utils/solarwire-completion';
import './MonacoEditor.css';

// 全局保存的滚动位置记录
let globalSavedScrollPosition: Record<string, number> = {};

/**
 * Monaco 编辑器组件属性接口
 */
interface MonacoEditorProps {
  /** 编辑器语言 */
  language: string;
  /** 编辑器内容 */
  value: string;
  /** 内容变化回调 */
  onChange: (value: string) => void;
  /** 编辑器高度 */
  height?: string;
  /** 高亮行号列表 */
  highlightLines?: number[];
  /** 错误行号列表 */
  errorLines?: number[];
  /** 滚动触发器（用于触发滚动操作） */
  scrollTrigger?: number;
  /** 高亮触发器（用于触发高亮更新） */
  highlightTrigger?: number;
  /** 是否自动滚动 */
  autoScroll?: boolean;
  /** 是否保持滚动位置 */
  preserveScrollPosition?: boolean;
  /** 滚动位置键（用于区分不同的编辑器实例） */
  scrollKey?: string;
  /** 错误来源标识，用于语法错误服务隔离 */
  errorSourceId?: string;
}

/**
 * Monaco 编辑器组件
 * 封装 Monaco Editor，提供 SolarWire 语言支持
 */
function MonacoEditor({
  language,
  value,
  onChange,
  height = '100%',
  highlightLines = [],
  errorLines = [],
  scrollTrigger,
  highlightTrigger,
  preserveScrollPosition = false,
  scrollKey,
  errorSourceId
}: MonacoEditorProps): React.ReactElement {
  // 主题
  const { theme } = useAppStore();
  // 状态栏
  const { updateFileStatus, updateEditorStatus } = useStatusStore();
  // Monaco 实例引用
  const monacoRef = useRef<any>(null);
  // 编辑器实例引用
  const editorRef = useRef<any>(null);
  // 装饰器引用
  const decorationsRef = useRef<string[]>([]);
  // 上次滚动触发器
  const prevScrollTriggerRef = useRef<number>(0);
  // 上次高亮触发器
  const prevHighlightTriggerRef = useRef<number>(0);
  // 高亮行号引用
  const highlightLinesRef = useRef<number[]>(highlightLines);
  // 上次内容引用（用于检测修改）
  const lastContentRef = useRef<string>(value);
  // 修改状态跟踪
  const isModifiedRef = useRef<boolean>(false);

  // 保存待应用的高亮/滚动数据，用于编辑器挂载后应用
  const pendingHighlightRef = useRef<{lines: number[], trigger: number} | null>(null);
  const pendingScrollRef = useRef<{scrollTrigger: number, line: number} | null>(null);

  // 始终同步 highlightLines 到 ref，确保滚动时使用最新值
  highlightLinesRef.current = highlightLines;

  // 监听语法错误变化
  useEffect(() => {
    const listener = {
      sourceId: errorSourceId || 'main-editor',
      onErrorsChanged: (errors: SyntaxError[]) => {
        const errorLines = errors.map(e => e.line);
      }
    };

    syntaxErrorService.addListener(listener);
    return () => {
      syntaxErrorService.removeListener(listener);
    };
  }, [errorSourceId]);

  const handleBeforeMount = useCallback((monaco: any) => {
    registerSolarWireLanguage(monaco);
    registerSolarWireCompletion(monaco);
  }, []);

  /**
   * 编辑器挂载完成回调
   */
  const handleEditorDidMount = useCallback((editor: any, monaco: any) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    
    // 光标位置变化监听
    const cursorChangeListener = () => {
      const position = editor.getPosition();
      if (position) {
        updateFileStatus({
          cursorPosition: { line: position.lineNumber, column: position.column }
        });
      }
    };
    
    // 选择变化监听
    const selectionChangeListener = () => {
      const selection = editor.getSelection();
      if (selection && !selection.isEmpty()) {
        const selectedText = editor.getModel().getValueInRange(selection);
        updateFileStatus({
          selectionCount: selectedText.length
        });
      } else {
        updateFileStatus({ selectionCount: 0 });
      }
    };
    
    // 内容变化监听
    const contentChangeListener = () => {
      const currentContent = editor.getValue();
      const isModified = currentContent !== lastContentRef.current;
      
      if (isModified !== isModifiedRef.current) {
        isModifiedRef.current = isModified;
        updateFileStatus({ isModified });
      }
      
      // 更新行数
      const lineCount = currentContent.split('\n').length;
      updateFileStatus({ lineCount });
    };
    
    // 注册监听器
    editor.onDidChangeCursorPosition(cursorChangeListener);
    editor.onDidChangeCursorSelection(selectionChangeListener);
    editor.onDidChangeModelContent(contentChangeListener);
    
    // 初始化状态
    cursorChangeListener();
    selectionChangeListener();
    contentChangeListener();
    
    if (preserveScrollPosition && scrollKey) {
      const savedPosition = globalSavedScrollPosition[scrollKey];
      if (savedPosition && savedPosition > 0) {
        editor.revealLine(savedPosition);
      }
      
      const scrollListener = () => {
        const topLine = editor.getScrollTop();
        const lineHeight = editor.getOption(monaco.editor.EditorOption.lineHeight);
        if (lineHeight > 0) {
          globalSavedScrollPosition[scrollKey] = Math.round(topLine / lineHeight) + 1;
        }
      };
      editor.onDidScrollChange(scrollListener);
    }
  }, [preserveScrollPosition, scrollKey, updateFileStatus]);

  // Effect 1: 更新高亮装饰（包括错误行高亮）
  useEffect(() => {
    if (!editorRef.current) {
      pendingHighlightRef.current = { lines: highlightLines, trigger: highlightTrigger || 0 };
      return;
    }
    const monaco = monacoRef.current;
    const editor = editorRef.current;
    if (!monaco || !editor) return;

    let newDecorations: any[] = [];
    
    // 添加普通高亮行
    if (highlightLines.length > 0) {
      newDecorations = highlightLines.map((line: number) => ({
        range: new monaco.Range(line, 1, line, 1),
        options: {
          isWholeLine: true,
          className: 'highlight-line',
          inlineClassName: 'highlight-line-inline',
          glyphMarginClassName: 'highlight-line-glyph'
        }
      }));
    }
    
    // 添加错误行高亮
    if (errorLines && errorLines.length > 0) {
      const errorDecorations = errorLines.map((line: number) => ({
        range: new monaco.Range(line, 1, line, 1),
        options: {
          isWholeLine: true,
          className: 'error-line-highlight',
          glyphMarginClassName: 'error-line-glyph'
        }
      }));
      newDecorations = [...newDecorations, ...errorDecorations];
    }
    
    decorationsRef.current = editor.deltaDecorations(decorationsRef.current, newDecorations);
    pendingHighlightRef.current = null;

    // Check if there is pending scroll data to apply
    if (pendingScrollRef.current) {
      editor.revealLineInCenter(pendingScrollRef.current.line);
      pendingScrollRef.current = null;
    }
  }, [highlightLines, errorLines, highlightTrigger]);

  // Effect 2: 处理滚动触发器
  useEffect(() => {
    if (!scrollTrigger || scrollTrigger === prevScrollTriggerRef.current) {
      return;
    }
    prevScrollTriggerRef.current = scrollTrigger;

    if (!editorRef.current) {
      pendingScrollRef.current = { scrollTrigger, line: 1 };
      return;
    }

    const editor = editorRef.current;
    
    // 优先跳转到错误行，如果没有错误行则跳转到高亮行
    let targetLine = 1;
    if (errorLines && errorLines.length > 0) {
      targetLine = errorLines[0];
    } else if (highlightLinesRef.current && highlightLinesRef.current.length > 0) {
      targetLine = highlightLinesRef.current[0];
    } else {
      // 如果没有错误行或高亮行，尝试从语法错误服务获取最新的错误行
      const currentErrors = syntaxErrorService.getErrors(errorSourceId);
      if (currentErrors.length > 0) {
        targetLine = currentErrors[0].line;
      }
    }
    
    editor.revealLineInCenter(targetLine);
    editor.setPosition({ lineNumber: targetLine, column: 1 });
    pendingScrollRef.current = null;
  }, [scrollTrigger, errorLines]);

  // Effect 3: 处理高亮触发器
  useEffect(() => {
    if (!highlightTrigger || highlightTrigger === prevHighlightTriggerRef.current) {
      return;
    }
    prevHighlightTriggerRef.current = highlightTrigger;

    if (!editorRef.current || !highlightLinesRef.current || highlightLinesRef.current.length === 0) {
      pendingHighlightRef.current = { lines: highlightLinesRef.current, trigger: highlightTrigger };
      return;
    }

    const monaco = monacoRef.current;
    const editor = editorRef.current;
    if (!monaco || !editor) return;

    const newDecorations = highlightLinesRef.current.map((line: number) => ({
      range: new monaco.Range(line, 1, line, 1),
      options: {
        isWholeLine: true,
        className: 'highlight-line',
        inlineClassName: 'highlight-line-inline',
        glyphMarginClassName: 'highlight-line-glyph'
      }
    }));
    
    decorationsRef.current = editor.deltaDecorations(decorationsRef.current, newDecorations);
    pendingHighlightRef.current = null;
  }, [highlightTrigger]);

  // Effect 4: 设置编辑器选项和语法错误服务
  useEffect(() => {
    if (!monacoRef.current) return;
    
    const monaco = monacoRef.current;
    const editor = editorRef.current;

    registerSolarWireLanguage(monaco);
    registerSolarWireCompletion(monaco);

    if (editor) {
      if (editor.getModel()) {
        const model = editor.getModel();
        syntaxErrorService.setMonacoRef(monaco);
        
        model.onDidChangeContent(() => {
          syntaxErrorService.setCurrentSourceId(errorSourceId || 'main-editor');
          syntaxErrorService.runRendererCheck(model.getValue());
        });
        
        syntaxErrorService.setCurrentSourceId(errorSourceId || 'main-editor');
        syntaxErrorService.runRendererCheck(model.getValue());
      }
    }
  }, [language]);

  // Effect 5: 更新编辑器模式状态
  useEffect(() => {
    const mode = language === 'solarwire' ? 'solarwire' : 'markdown';
    // 这里可以调用状态更新
  }, [language]);

  // Effect 6: 更新内容引用
  useEffect(() => {
    lastContentRef.current = value;
  }, [value]);

  return (
    <Editor
      height={height}
      language={language}
      value={value}
      onChange={(value: string | undefined) => onChange(value || '')}
      theme={language === 'solarwire' ? getThemeName(isDarkTheme(theme)) : (isDarkTheme(theme) ? 'vs-dark' : 'vs-light')}
      beforeMount={handleBeforeMount}
      onMount={handleEditorDidMount}
      options={{
        fontSize: 14,
        fontFamily: 'Consolas, Monaco, "Courier New", monospace',
        lineNumbers: 'on',
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        wordWrap: language === 'markdown' ? 'on' : 'off',
        automaticLayout: true,
        tabSize: 2,
        insertSpaces: true,
        renderWhitespace: 'selection',
        renderLineHighlight: 'line',
        cursorBlinking: 'blink',
        cursorSmoothCaretAnimation: 'on',
        smoothScrolling: true,
        bracketPairColorization: { enabled: true }
      }}
    />
  );
}

export default MonacoEditor;
