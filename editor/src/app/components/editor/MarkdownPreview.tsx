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
  theme: 'dark',
  securityLevel: 'loose',
});

const markdownPreviewScrollPosition = { value: 0 };

function MarkdownPreview(): React.ReactElement {
  const { content } = useEditorStore();
  const { selectedFile, fileContent } = useFileStore();
  const [html, setHtml] = useState<string>('');
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
        (match, code) => {
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
    if (previewRef.current && html) {
      const mermaidElements = previewRef.current.querySelectorAll('.language-mermaid, code.language-mermaid, pre:has(code.language-mermaid)');
      
      mermaidElements.forEach(async (element, index) => {
        const mermaidCode = element.textContent || '';
        if (mermaidCode.trim()) {
          try {
            const { svg } = await mermaid.render(`mermaid-${Date.now()}-${index}`, mermaidCode);
            const container = document.createElement('div');
            container.className = 'mermaid-container';
            container.innerHTML = svg;
            element.parentNode?.replaceChild(container, element);
          } catch (error) {
            console.error('Failed to render Mermaid:', error);
          }
        }
      });
    }
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
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </Scrollbar>
  );
}

export default MarkdownPreview;
