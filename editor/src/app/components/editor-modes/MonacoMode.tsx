import React, { useEffect, useRef } from 'react';
import { useEditorStore } from '../../stores/editorStore';
import './MonacoMode.css';

const MonacoMode: React.FC<{ language?: string }> = ({ language = 'markdown' }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const content = useEditorStore((s) => s.content);
  const setContent = useEditorStore((s) => s.setContent);
  const editorRef = useRef<any>(null);

  useEffect(() => {
    let mounted = true;

    const initEditor = () => {
      try {
        // @ts-ignore
        const monaco = (window as any).monaco;
        if (!monaco || !containerRef.current) return;
        editorRef.current = monaco.editor.create(containerRef.current, {
          value: content || '',
          language,
          theme: 'vs-dark',
          automaticLayout: true,
        });
        editorRef.current.onDidChangeModelContent(() => {
          const v = editorRef.current.getValue();
          setContent(v);
        });
      } catch (err) {
        console.error('Monaco init failed', err);
      }
    };

    const loadMonaco = async () => {
      if ((window as any).monaco) {
        initEditor();
        return;
      }

      const loader = '/monaco/min/vs/loader.js';
      await new Promise<void>((resolve, reject) => {
        const existing = document.querySelector(`script[src="${loader}"]`);
        if (existing) {
          existing.addEventListener('load', () => resolve());
          existing.addEventListener('error', (e) => reject(e));
          return;
        }
        const s = document.createElement('script');
        s.src = loader;
        s.onload = () => resolve();
        s.onerror = (e) => reject(e);
        document.body.appendChild(s);
      });

      // @ts-ignore
      (window as any).require.config({ paths: { vs: '/monaco/min/vs' } });
      // @ts-ignore
      (window as any).require(['vs/editor/editor.main'], () => {
        if (!mounted) return;
        initEditor();
      });
    };

    loadMonaco().catch((err) => console.error('Failed to load monaco:', err));

    return () => {
      mounted = false;
      try {
        if (editorRef.current) {
          editorRef.current.dispose();
          editorRef.current = null;
        }
      } catch (e) {
        // ignore
      }
    };
  }, []);

  useEffect(() => {
    if (editorRef.current) {
      const v = editorRef.current.getValue();
      if (v !== content) editorRef.current.setValue(content || '');
    }
  }, [content]);

  return (
    <div className="monaco-mode">
      <div ref={containerRef} className="monaco-container" />
    </div>
  );
};

export default MonacoMode;
