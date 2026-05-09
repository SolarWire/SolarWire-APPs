import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { marked, Tokens } from 'marked';
import mermaid from 'mermaid';
import { useEditorStore } from '../../stores/editorStore';
import { useFileStore } from '../../stores/fileStore';
import { useAppStore } from '../../stores/appStore';
import { useSelectionStore } from '../../stores/selectionStore';
import { parse } from "../../../lib/parser";
import { render as renderSvg } from '../../../lib/renderer';
import { Scrollbar } from '../ui/Scrollbar';
import LoadingOverlay from '../ui/LoadingOverlay';
import './MarkdownPreview.css';

/**
 * Markdown 预览组件
 * 优化措施：
 * 1. 添加防抖机制，避免频繁渲染
 * 2. 并行处理 SolarWire、Mermaid、Graphviz 块
 * 3. 图片缓存机制
 * 4. 减少字符串替换次数
 * 5. 移除全局变量，使用 ref 管理状态
 */

// Mermaid 初始化（只执行一次）
mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
});

// Mermaid 实例缓存
let mermaidInstance: any = null;

interface DiagramBlock {
  index: number;
  code: string;
}

/**
 * 防抖函数
 */
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Mermaid 扩展
 */
const mermaidExtension = {
  name: 'mermaid',
  level: 'block' as const,
  start(src: string) {
    return src.match(/```mermaid/)?.index;
  },
  tokenizer(src: string): Tokens.Generic | void {
    const match = src.match(/^```mermaid\s*\n?([\s\S]*?)```/);
    if (match) {
      return {
        type: 'mermaid',
        raw: match[0],
        code: match[1].trim(),
      };
    }
  },
  renderer(token: Tokens.Generic): string {
    return `<div class="mermaid-placeholder" data-code="${encodeURIComponent(token.code)}"></div>`;
  },
};

marked.use({ extensions: [mermaidExtension] });

/**
 * 提取 Graphviz 块
 */
function extractGraphvizBlocks(content: string): { processed: string; blocks: DiagramBlock[] } {
  const blocks: DiagramBlock[] = [];
  let index = 0;

  const processed = content.replace(
    /```(?:graphviz|dot)\s*\n?([\s\S]*?)```/g,
    (match, code) => {
      blocks.push({ index: index++, code: code.trim() });
      return `<div class="graphviz-placeholder" data-code="${encodeURIComponent(code)}"></div>`;
    }
  );

  return { processed, blocks };
}

function MarkdownPreview(): React.ReactElement {
  const { content, setMode, setContent } = useEditorStore();
  const { selectedFile, fullFileContent } = useFileStore();
  const { setCurrentView } = useAppStore();
  const { setSelection } = useSelectionStore();
  const [html, setHtml] = useState<string>('');
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [renderProgress, setRenderProgress] = useState<number>(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isRenderingRef = useRef(false);
  const renderTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const imageCacheRef = useRef<Map<string, string>>(new Map());
  const renderVersionRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  // 滚动位置管理
  const handleScroll = useCallback(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.dataset.scrollTop = scrollContainerRef.current.scrollTop.toString();
    }
  }, []);

  // 处理 SolarWire 编辑按钮点击
  const handleSolarWireEditClick = useCallback(async (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.classList.contains('solarwire-edit-button')) {
      const encodedCode = target.getAttribute('data-code');
      if (encodedCode) {
        const code = decodeURIComponent(encodedCode);
        setContent(code);
        setMode('solarwire');
        
        // 切换左侧视图到 solarwire
        setCurrentView('solarwire');
        
        // 尝试找到对应的 snippet 并选中
        if (selectedFile && selectedFile.path) {
          try {
            const api = (window as any).api;
            if (api && typeof api.collectSolarWireSnippets === 'function') {
              const currentPath = selectedFile.path.replace(/[\\/][^\\/]*$/, '');
              const snippets = await api.collectSolarWireSnippets(currentPath);
              
              // 查找代码内容匹配的 snippet
              const matchingSnippet = snippets.find((snippet: any) => {
                const snippetCode = snippet.code.trim();
                return snippetCode === code.trim();
              });
              
              if (matchingSnippet) {
                // 使用 fileStore 的 openSolarWireSnippet 方法
                const fileStoreState = useFileStore.getState();
                if (fileStoreState.openSolarWireSnippet) {
                  await fileStoreState.openSolarWireSnippet(matchingSnippet);
                  setSelection('solarwire', matchingSnippet.sourceFile, matchingSnippet.id);
                }
              } else {
                // 没有找到匹配的 snippet，只选中文件
                setSelection('solarwire', selectedFile.path);
              }
            }
          } catch (err) {
            console.error('Failed to find matching snippet:', err);
            // 出错时只选中文件
            setSelection('solarwire', selectedFile.path);
          }
        }
      }
    }
  }, [setContent, setMode, setCurrentView, setSelection, selectedFile]);

  // 添加事件监听器
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('click', handleSolarWireEditClick);
      return () => {
        container.removeEventListener('click', handleSolarWireEditClick);
      };
    }
  }, [handleSolarWireEditClick]);

  // 恢复滚动位置
  useEffect(() => {
    if (scrollContainerRef.current) {
      const savedScroll = scrollContainerRef.current.dataset.scrollTop;
      if (savedScroll) {
        scrollContainerRef.current.scrollTop = parseInt(savedScroll);
      }
    }
  }, [html]);

  /**
   * 渲染 SolarWire 块
   */
  const renderSolarWireBlocks = useCallback(async (
    blocks: { match: string; code: string }[],
    processed: string,
    imageUrlResolver: (path: string) => string
  ): Promise<string> => {
    let finalProcessed = processed;
    
    // 并行处理所有 SolarWire 块，每个块独立处理错误
    const renderPromises = blocks.map(async (block, i) => {
      try {
        const ast = parse(block.code.trim());
        const svg = renderSvg(ast, { imageUrlResolver });
        const encodedCode = encodeURIComponent(block.code);
        return {
          index: i,
          success: true,
          replacement: `<div class="solarwire-code-block">
            <button 
              class="solarwire-edit-button" 
              title="在 SolarWire 视图中编辑"
              data-code="${encodedCode}"
            >✏️ 编辑</button>
            ${svg}
          </div>`
        };
      } catch (error) {
        console.error(`Failed to render SolarWire block ${i}:`, error);
        // 渲染失败时也要显示编辑按钮和原始代码
        const encodedCode = encodeURIComponent(block.code);
        const escapedCode = block.match.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return {
          index: i,
          success: false,
          replacement: `<div class="solarwire-code-block solarwire-error-block">
            <button 
              class="solarwire-edit-button" 
              title="在 SolarWire 视图中编辑"
              data-code="${encodedCode}"
            >✏️ 编辑</button>
            <div class="solarwire-error-message">SolarWire 渲染失败</div>
            <pre><code>${escapedCode}</code></pre>
          </div>`
        };
      }
    });

    // 使用 Promise.allSettled 确保即使某些块失败，其他块也能正常渲染
    const results = await Promise.allSettled(renderPromises);
    const successfulResults = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        console.error(`SolarWire block ${index} failed completely:`, result.reason);
        // 最后的错误处理，显示原始代码
        const block = blocks[index];
        const encodedCode = encodeURIComponent(block.code);
        const escapedCode = block.match.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return {
          index,
          success: false,
          replacement: `<div class="solarwire-code-block solarwire-error-block">
            <button 
              class="solarwire-edit-button" 
              title="在 SolarWire 视图中编辑"
              data-code="${encodedCode}"
            >✏️ 编辑</button>
            <div class="solarwire-error-message">SolarWire 渲染失败</div>
            <pre><code>${escapedCode}</code></pre>
          </div>`
        };
      }
    });
    
    // 一次性替换所有占位符
    successfulResults.forEach(({ index, replacement }) => {
      finalProcessed = finalProcessed.replace(
        `<<<SOLARWIRE_PLACEHOLDER_${index}>>>`,
        replacement
      );
    });

    return finalProcessed;
  }, []);

  /**
   * 渲染 Mermaid 块
   */
  const renderMermaidBlocks = useCallback(async (html: string): Promise<string> => {
    const placeholders = html.match(/<div class="mermaid-placeholder"[^>]*>/g) || [];
    if (placeholders.length === 0) return html;

    // 并行渲染所有 Mermaid 块
    const renderPromises = placeholders.map(async (placeholder) => {
      const codeMatch = placeholder.match(/data-code="([^"]+)"/);
      if (!codeMatch) return null;

      const code = decodeURIComponent(codeMatch[1]);
      try {
        if (!mermaidInstance) {
          mermaidInstance = await import('mermaid');
        }
        const id = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const { svg } = await mermaid.render(id, code);
        return {
          placeholder,
          replacement: `<div class="mermaid-container">${svg}</div>`
        };
      } catch (error) {
        console.error('Mermaid render error:', error);
        return {
          placeholder,
          replacement: `<div class="mermaid-error">Mermaid 渲染失败</div>`
        };
      }
    });

    const results = await Promise.all(renderPromises);
    let finalHtml = html;
    
    results.forEach(result => {
      if (result) {
        finalHtml = finalHtml.replace(result.placeholder, result.replacement);
      }
    });

    return finalHtml;
  }, []);

  /**
   * 渲染 Graphviz 块
   */
  const renderGraphvizBlocks = useCallback(async (html: string): Promise<string> => {
    const placeholders = html.match(/<div class="graphviz-placeholder"[^>]*>/g) || [];
    if (placeholders.length === 0) return html;

    // 并行渲染所有 Graphviz 块
    const renderPromises = placeholders.map(async (placeholder) => {
      const codeMatch = placeholder.match(/data-code="([^"]+)"/);
      if (!codeMatch) return null;

      const code = decodeURIComponent(codeMatch[1]);
      try {
        const viz = await import('@viz-js/viz').then(m => m.instance());
        const result = await viz.render(code, { format: 'svg' }) as { output: string };
        return {
          placeholder,
          replacement: `<div class="graphviz-container">${result.output}</div>`
        };
      } catch (error) {
        console.error('Graphviz render error:', error);
        return {
          placeholder,
          replacement: `<div class="graphviz-error">Graphviz 渲染失败</div>`
        };
      }
    });

    const results = await Promise.all(renderPromises);
    let finalHtml = html;
    
    results.forEach(result => {
      if (result) {
        finalHtml = finalHtml.replace(result.placeholder, result.replacement);
      }
    });

    return finalHtml;
  }, []);

  /**
   * 加载图片
   */
  const loadImages = useCallback(async (
    html: string,
    mdDir: string
  ): Promise<string> => {
    const imgSrcRegex = /<img\s+([^>]*?)src="(assets\/[^"]+)"([^>]*?)>/gi;
    const imgMatches = [...html.matchAll(imgSrcRegex)];
    
    if (imgMatches.length === 0 || !mdDir) return html;

    const api = (window as any).api;
    if (!api?.readImageAsBase64) return html;

    // 并行加载所有图片
    const loadPromises = imgMatches.map(async (match) => {
      const fullMatch = match[0];
      const before = match[1];
      const src = match[2];
      const after = match[3];
      
      // 检查缓存
      if (imageCacheRef.current.has(src)) {
        return {
          fullMatch,
          replacement: `<img ${before}src="${imageCacheRef.current.get(src)}"${after}>`
        };
      }

      try {
        const absolutePath = `${mdDir}/${src}`.replace(/\\/g, '/');
        const base64 = await api.readImageAsBase64(absolutePath);
        if (base64) {
          imageCacheRef.current.set(src, base64);
          return {
            fullMatch,
            replacement: `<img ${before}src="${base64}"${after}>`
          };
        }
      } catch (e) {
        console.warn(`Failed to load image in markdown: ${src}`, e);
      }

      return null;
    });

    const results = await Promise.all(loadPromises);
    let finalHtml = html;
    
    results.forEach(result => {
      if (result) {
        finalHtml = finalHtml.replace(result.fullMatch, result.replacement);
      }
    });

    return finalHtml;
  }, []);

  /**
   * 主渲染函数（防抖）
   */
  const renderMarkdown = useCallback(async () => {
    // 增加渲染版本
    renderVersionRef.current += 1;
    const currentVersion = renderVersionRef.current;

    // 中断之前的渲染
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    if (isRenderingRef.current) return;

    // 清除之前的定时器
    if (renderTimeoutRef.current) {
      clearTimeout(renderTimeoutRef.current);
    }

    renderTimeoutRef.current = setTimeout(async () => {
      // 检查版本是否已过期
      if (currentVersion !== renderVersionRef.current) return;

      let contentToRender = content;
      if (!contentToRender || contentToRender === '') {
        contentToRender = fullFileContent;
      }

      if (!contentToRender) return;

      isRenderingRef.current = true;
      setIsRendering(true);
      setRenderProgress(0);

      try {
        const mdDir = selectedFile?.path?.replace(/[\\/][^\\/]*$/, '') || '';
        const api = (window as any).api;

        // 检查版本是否已过期
        if (currentVersion !== renderVersionRef.current) return;

        // 提取 SolarWire 块
        const solarwireBlocks: { match: string; code: string }[] = [];
        const solarwirePlaceholder = contentToRender.replace(
          /```solarwire\s*([\s\S]*?)```/g,
          (match: string, code: string) => {
            solarwireBlocks.push({ match, code });
            return `<<<SOLARWIRE_PLACEHOLDER_${solarwireBlocks.length - 1}>>>`;
          }
        );

        setRenderProgress(20);

        // 检查版本是否已过期
        if (currentVersion !== renderVersionRef.current) return;

        // 预加载 SolarWire 块中的图片
        if (solarwireBlocks.length > 0 && api?.readImageAsBase64 && mdDir) {
          const imagePromises: Promise<void>[] = [];

          for (const block of solarwireBlocks) {
            const imageMatches = [...block.code.matchAll(/<([^>]+\.(?:png|jpg|jpeg|gif|webp|svg))>/gi)];
            for (const match of imageMatches) {
              const path = match[1];
              if (!imageCacheRef.current.has(path)) {
                imagePromises.push(
                  (async () => {
                    try {
                      const absolutePath = `${mdDir}/${path}`.replace(/\\/g, '/');
                      const base64 = await api.readImageAsBase64(absolutePath);
                      imageCacheRef.current.set(path, base64);
                    } catch (e) {
                      console.warn(`Failed to load image: ${path}`, e);
                    }
                  })()
                );
              }
            }
          }

          await Promise.all(imagePromises);
        }

        // 检查版本是否已过期
        if (currentVersion !== renderVersionRef.current) return;

        setRenderProgress(30);

        // 提取 Graphviz 块
        const { processed: graphvizProcessed } = extractGraphvizBlocks(solarwirePlaceholder);
        setRenderProgress(40);

        // 图片解析器
        const imageUrlResolver = (relativePath: string): string => {
          return imageCacheRef.current.get(relativePath) || relativePath;
        };

        // 渲染 SolarWire 块 - 单独处理错误，不影响整体渲染
        let finalProcessed;
        try {
          finalProcessed = await renderSolarWireBlocks(solarwireBlocks, graphvizProcessed, imageUrlResolver);
        } catch (solarWireError) {
          console.error('Failed to render SolarWire blocks:', solarWireError);
          // 如果SolarWire渲染失败，回退到原始占位符，让markdown继续渲染
          finalProcessed = graphvizProcessed;
        }

        // 检查版本是否已过期
        if (currentVersion !== renderVersionRef.current) return;

        setRenderProgress(50);

        // 渲染 Markdown - 单独处理错误
        let renderedHtml;
        try {
          renderedHtml = await marked(finalProcessed, {
            breaks: true,
            gfm: true,
          });
        } catch (markdownError) {
          console.error('Failed to render Markdown:', markdownError);
          // 如果markdown渲染失败，显示原始内容
          renderedHtml = `<pre><code>${contentToRender}</code></pre>`;
        }

        // 检查版本是否已过期
        if (currentVersion !== renderVersionRef.current) return;

        setRenderProgress(60);

        // 渲染 Mermaid 块 - 单独处理错误
        let mermaidHtml;
        try {
          mermaidHtml = await renderMermaidBlocks(renderedHtml);
        } catch (mermaidError) {
          console.error('Failed to render Mermaid blocks:', mermaidError);
          mermaidHtml = renderedHtml; // 使用未处理的HTML
        }

        // 检查版本是否已过期
        if (currentVersion !== renderVersionRef.current) return;

        setRenderProgress(70);

        // 渲染 Graphviz 块 - 单独处理错误
        let graphvizHtml;
        try {
          graphvizHtml = await renderGraphvizBlocks(mermaidHtml);
        } catch (graphvizError) {
          console.error('Failed to render Graphviz blocks:', graphvizError);
          graphvizHtml = mermaidHtml; // 使用未处理的HTML
        }

        // 检查版本是否已过期
        if (currentVersion !== renderVersionRef.current) return;

        setRenderProgress(85);

        // 加载 markdown 中的图片 - 单独处理错误
        let finalHtml;
        try {
          finalHtml = await loadImages(graphvizHtml, mdDir);
        } catch (imageError) {
          console.error('Failed to load images:', imageError);
          finalHtml = graphvizHtml; // 使用未处理的HTML
        }

        // 检查版本是否已过期
        if (currentVersion !== renderVersionRef.current) return;

        setRenderProgress(100);

        setHtml(finalHtml);
      } catch (error) {
        // 如果是被中断的错误，不显示错误信息
        if (signal.aborted) return;

        console.error('Critical error in markdown rendering:', error);
        // 只有在出现严重错误时才显示错误信息，否则尽量渲染内容
        setHtml(`<div class="markdown-error">Markdown 渲染出现严重错误</div><pre><code>${contentToRender}</code></pre>`);
        setRenderProgress(100);
      } finally {
        // 只有当前版本才清理状态
        if (currentVersion === renderVersionRef.current) {
          isRenderingRef.current = false;
          setTimeout(() => setIsRendering(false), 300);
        }
      }
    }, 300); // 300ms 防抖
  }, [content, fullFileContent, selectedFile, renderSolarWireBlocks, renderMermaidBlocks, renderGraphvizBlocks, loadImages]);

  useEffect(() => {
    renderMarkdown();
    return () => {
      if (renderTimeoutRef.current) {
        clearTimeout(renderTimeoutRef.current);
      }
    };
  }, [renderMarkdown]);

  return (
    <div className="markdown-preview-container">
      <LoadingOverlay
        visible={isRendering}
        icon="📝"
        text="正在渲染预览..."
        progress={renderProgress}
      />
      <Scrollbar className="markdown-preview" ref={scrollContainerRef} onScroll={handleScroll}>
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </Scrollbar>
    </div>
  );
}

export default MarkdownPreview;