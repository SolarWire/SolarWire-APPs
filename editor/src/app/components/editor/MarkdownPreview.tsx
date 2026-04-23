import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { marked, Tokens } from 'marked';
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

interface DiagramBlock {
  index: number;
  code: string;
}

const mermaidBlocksStore: DiagramBlock[] = [];

const mermaidExtension = {
  name: 'mermaid',
  level: 'block' as const,
  start(src: string) {
    return src.match(/```mermaid/)?.index;
  },
  tokenizer(src: string): Tokens.Generic | void {
    const match = src.match(/^```mermaid\s*\n?([\s\S]*?)```/);
    if (match) {
      const block: DiagramBlock = {
        index: mermaidBlocksStore.length,
        code: match[1].trim(),
      };
      mermaidBlocksStore.push(block);
      return {
        type: 'mermaid',
        raw: match[0],
        code: match[1].trim(),
      };
    }
  },
  renderer(token: Tokens.Generic): string {
    return `<div class="mermaid-placeholder" data-index="${mermaidBlocksStore.length - 1}"></div>`;
  },
};

marked.use({ extensions: [mermaidExtension] });

function extractGraphvizBlocks(content: string): { processed: string; blocks: DiagramBlock[] } {
  const blocks: DiagramBlock[] = [];
  let index = 0;

  const processed = content.replace(
    /```(?:graphviz|dot)\s*\n?([\s\S]*?)```/g,
    (match, code) => {
      blocks.push({ index: index++, code: code.trim() });
      return `<div class="graphviz-placeholder" data-index="${index - 1}"></div>`;
    }
  );

  return { processed, blocks };
}

function MarkdownPreview(): React.ReactElement {
  const { content } = useEditorStore();
  const { selectedFile, fileContent } = useFileStore();
  const [html, setHtml] = useState<string>('');
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [renderProgress, setRenderProgress] = useState<number>(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isRenderingRef = useRef(false);

  useEffect(() => {
    let contentToRender = content;
    if (!contentToRender || contentToRender === '') {
      contentToRender = fileContent;
    }

    if (contentToRender && !isRenderingRef.current) {
      isRenderingRef.current = true;
      setRenderProgress(0);

      const mdDir = selectedFile?.path?.replace(/[\\/][^\\/]*$/, '') || '';
      const api = (window as any).api;

      const solarwireBlocks: { match: string; code: string }[] = [];
      const solarwirePlaceholder = contentToRender.replace(
        /```solarwire\s*([\s\S]*?)```/g,
        (match: string, code: string) => {
          solarwireBlocks.push({ match, code });
          return `<<<SOLARWIRE_PLACEHOLDER_${solarwireBlocks.length - 1}>>>`;
        }
      );

      setRenderProgress(20);

      const { processed: graphvizProcessed, blocks: graphvizBlocks } = extractGraphvizBlocks(solarwirePlaceholder);

      setRenderProgress(30);

      let finalProcessed = graphvizProcessed;

      const renderAll = async () => {
        try {
          const imageCache: Record<string, string> = {};

          for (let i = 0; i < solarwireBlocks.length; i++) {
            const code = solarwireBlocks[i].code;
            const imageMatches = [...code.matchAll(/<([^>]+\.(?:png|jpg|jpeg|gif|webp|svg))>/gi)];
            for (const match of imageMatches) {
              const path = match[1];
              if (!imageCache[path] && api?.readImageAsBase64 && mdDir) {
                try {
                  const absolutePath = `${mdDir}/${path}`.replace(/\\/g, '/');
                  imageCache[path] = await api.readImageAsBase64(absolutePath);
                } catch (e) {
                  console.warn(`Failed to load image: ${path}`, e);
                }
              }
            }
          }

          const syncImageUrlResolver = (relativePath: string): string => {
            return imageCache[relativePath] || relativePath;
          };

          for (let i = 0; i < solarwireBlocks.length; i++) {
            try {
              const ast = parse(solarwireBlocks[i].code.trim());
              const svg = renderSvg(ast, { imageUrlResolver: syncImageUrlResolver });
              finalProcessed = finalProcessed.replace(
                `<<<SOLARWIRE_PLACEHOLDER_${i}>>>`,
                `<div class="solarwire-code-block">${svg}</div>`
              );
            } catch (error) {
              console.error('Failed to parse SolarWire:', error);
              finalProcessed = finalProcessed.replace(
                `<<<SOLARWIRE_PLACEHOLDER_${i}>>>`,
                solarwireBlocks[i].match
              );
            }
          }

          mermaidBlocksStore.length = 0;

          const renderedHtml = await marked(finalProcessed, {
            breaks: true,
            gfm: true,
          });

          setRenderProgress(50);

          let finalHtml = renderedHtml;

          for (let i = 0; i < mermaidBlocksStore.length; i++) {
            const placeholder = `<div class="mermaid-placeholder" data-index="${i}"></div>`;
            try {
              mermaidRenderCounter++;
              const id = `mermaid-${Date.now()}-${mermaidRenderCounter}`;
              const { svg } = await mermaid.render(id, mermaidBlocksStore[i].code);
              finalHtml = finalHtml.replace(
                placeholder,
                `<div class="mermaid-container">${svg}</div>`
              );
            } catch (error) {
              console.error('Mermaid render error:', error);
              finalHtml = finalHtml.replace(
                placeholder,
                `<div class="mermaid-error">Mermaid 渲染失败</div>`
              );
            }
            setRenderProgress(50 + Math.round((i + 1) / (mermaidBlocksStore.length + 1) * 25));
          }

          for (let i = 0; i < graphvizBlocks.length; i++) {
            const placeholder = `<div class="graphviz-placeholder" data-index="${i}"></div>`;
            try {
              const viz = await import('@viz-js/viz').then(m => m.instance());
              const result = await viz.render(graphvizBlocks[i].code, { format: 'svg' }) as { output: string };
              const svg = result.output;
              finalHtml = finalHtml.replace(
                placeholder,
                `<div class="graphviz-container">${svg}</div>`
              );
            } catch (error) {
              console.error('Graphviz render error:', error);
              finalHtml = finalHtml.replace(
                placeholder,
                `<div class="graphviz-error">Graphviz 渲染失败</div>`
              );
            }
            setRenderProgress(75 + Math.round((i + 1) / (graphvizBlocks.length + 1) * 20));
          }

          if (selectedFile?.path) {
            const mdDir = selectedFile.path.replace(/[\\/][^\\/]*$/, '');
            const imgSrcRegex = /<img\s+([^>]*?)src="(assets\/[^"]+)"([^>]*?)>/gi;
            const imgMatches = [...finalHtml.matchAll(imgSrcRegex)];

            if (imgMatches.length > 0 && mdDir) {
              const api = (window as any).api;
              if (api && api.readImageAsBase64) {
                for (const match of imgMatches) {
                  const fullMatch = match[0];
                  const before = match[1];
                  const src = match[2];
                  const after = match[3];
                  try {
                    const absolutePath = `${mdDir}/${src}`.replace(/\\/g, '/');
                    const base64 = await api.readImageAsBase64(absolutePath);
                    if (base64) {
                      const replacement = `<img ${before}src="${base64}"${after}>`;
                      finalHtml = finalHtml.replace(fullMatch, replacement);
                    }
                  } catch (e) {
                    console.warn(`Failed to load image in markdown: ${src}`, e);
                  }
                }
              }
            }
          }

          setRenderProgress(100);
          setHtml(finalHtml as string);
        } catch (error) {
          console.error('Failed to render Markdown:', error);
          setRenderProgress(100);
        } finally {
          isRenderingRef.current = false;
          setTimeout(() => setIsRendering(false), 300);
        }
      };

      renderAll();
    }
  }, [selectedFile, fileContent, content]);

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
    <>
      {createPortal(
        isRendering && (
          <div className="markdown-render-progress">
            <div className="progress-bar-container">
              <div
                className="progress-bar"
                style={{ width: `${renderProgress}%` }}
              />
            </div>
          </div>
        ),
        document.body
      )}
      <Scrollbar className="markdown-preview" ref={scrollContainerRef} onScroll={handleScroll}>
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </Scrollbar>
    </>
  );
}

export default MarkdownPreview;