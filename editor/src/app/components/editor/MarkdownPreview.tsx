import React, { useEffect, useState, useRef } from 'react';
import { marked } from 'marked';
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css';
import mermaid from 'mermaid';
import { useEditorStore } from '../../stores/editorStore';
import { useFileStore } from '../../stores/fileStore';
import { parse } from "../../../lib/parser";
import { render as renderSvg } from '../../../lib/renderer';
import { Scrollbar } from '../ui/Scrollbar';

mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
});

const markdownPreviewScrollPosition = { value: 0 };
let mermaidRenderCounter = 0;

function MarkdownPreview(): React.ReactElement {
  const { content } = useEditorStore();
  const { selectedFile, fileContent } = useFileStore();
  const [html, setHtml] = useState<string>('');
  const [isRenderingMermaid, setIsRenderingMermaid] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let contentToRender = content;
    if (!contentToRender || contentToRender === '') {
      contentToRender = fileContent;
    }

    if (contentToRender) {
      const processedContent = contentToRender.replace(
        /```solarwire\s*([\s\S]*?)```/g,
        (match: string, code: string) => {
          try {
            const ast = parse(code.trim());
            const svg = renderSvg(ast);
            return `<div class="solarwire-code-block">${svg}</div>`;
          } catch (error) {
            console.error('Failed to parse SolarWire:', error);
            return match;
          }
        }
      );

      const renderMarkdown = async () => {
        try {
          const renderedHtml = await marked(processedContent, {
            breaks: true,
            gfm: true,
          });
          setHtml(renderedHtml as string);
        } catch (error) {
          console.error('Failed to render Markdown:', error);
        }
      };
      renderMarkdown();
    }
  }, [selectedFile, fileContent, content]);

  useEffect(() => {
    if (!html || !previewRef.current) return;

    const renderMermaid = async () => {
      setIsRenderingMermaid(true);
      try {
        const codeBlocks = previewRef.current!.querySelectorAll('pre code.language-mermaid');
        if (codeBlocks.length === 0) {
          setIsRenderingMermaid(false);
          return;
        }

        for (let i = 0; i < codeBlocks.length; i++) {
          const codeEl = codeBlocks[i];
          const mermaidCode = codeEl.textContent?.trim();
          if (!mermaidCode) continue;

          const preEl = codeEl.closest('pre');
          if (!preEl) continue;

          try {
            mermaidRenderCounter++;
            const id = `mermaid-${Date.now()}-${mermaidRenderCounter}`;
            const { svg } = await mermaid.render(id, mermaidCode);

            const container = document.createElement('div');
            container.className = 'mermaid-container';
            container.innerHTML = svg;

            preEl.parentNode?.replaceChild(container, preEl);
          } catch (error) {
            console.error('Mermaid render error:', error);
            const errorDiv = document.createElement('div');
            errorDiv.className = 'mermaid-error';
            errorDiv.textContent = 'Mermaid 渲染失败';
            preEl.parentNode?.replaceChild(errorDiv, preEl);
          }
        }
      } finally {
        setIsRenderingMermaid(false);
      }
    };

    renderMermaid();
  }, [html]);

  useEffect(() => {
    if (scrollContainerRef.current && markdownPreviewScrollPosition.value > 0) {
      scrollContainerRef.current.scrollTop = markdownPreviewScrollPosition.value;
    }
  }, []);

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      markdownPreviewScrollPosition.value = scrollContainerRef.current.scrollTop;
    }
  };

  return (
    <Scrollbar className="markdown-preview" ref={scrollContainerRef} onScroll={handleScroll}>
      <div ref={previewRef} dangerouslySetInnerHTML={{ __html: html }} />
    </Scrollbar>
  );
}

export default MarkdownPreview;
