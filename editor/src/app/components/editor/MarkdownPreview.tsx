import React, { useEffect, useState, useRef } from 'react';
import { marked } from 'marked';
import mermaid from 'mermaid';
import { useEditorStore } from '../../stores/editorStore';
import { useFileStore } from '../../stores/fileStore';
import { parse } from "../../../lib/parser";
import { render as renderSvg } from '../../../lib/renderer';
import { Scrollbar } from '../ui/Scrollbar';

/**
 * Mermaid 配置
 * - startOnLoad: false - 禁用自动渲染，由组件手动控制
 * - theme: 'default' - 使用默认主题
 * - securityLevel: 'loose' - 宽松安全级别，允许点击事件
 */
mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
});

const markdownPreviewScrollPosition = { value: 0 };
let mermaidRenderCounter = 0;

/**
 * Mermaid 占位符前缀
 * 用于在 Markdown 渲染前替换 Mermaid 代码块，避免被 marked 解析为代码
 */
const MERMAID_PLACEHOLDER_PREFIX = '<!--MERMAID_PLACEHOLDER_';

/**
 * Markdown 预览组件
 * 
 * 核心设计原理：
 * 1. 预处理策略：在 marked 渲染前提取 Mermaid 代码块，替换为 HTML 注释占位符
 * 2. 并行渲染：marked 渲染 Markdown 的同时，调用 mermaid.render() 渲染图表
 * 3. 一次性设置：将渲染结果合并后一次性 setHtml()，避免 DOM 后处理
 * 4. 性能优化：减少 React 重新渲染和 DOM 操作
 * 
 * 为什么选择此方案：
 * - 避免了 DOM 后处理被 React 重新渲染覆盖的问题
 * - 减少了多次 DOM 操作，提升性能
 * - 代码逻辑更清晰，易于维护
 * 
 * 注意：此渲染逻辑经过精心设计，请勿随意修改为 DOM 后处理方式
 */
function MarkdownPreview(): React.ReactElement {
  const { content } = useEditorStore();
  const { selectedFile, fileContent } = useFileStore();
  const [html, setHtml] = useState<string>('');
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [renderProgress, setRenderProgress] = useState<number>(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let contentToRender = content;
    if (!contentToRender || contentToRender === '') {
      contentToRender = fileContent;
    }

    if (contentToRender) {
      setIsRendering(true);
      setRenderProgress(0);

      // 步骤1：处理 SolarWire 代码块
      const solarwireProcessed = contentToRender.replace(
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

      setRenderProgress(20);

      // 步骤2：提取 Mermaid 代码块并替换为占位符
      const mermaidBlocks: string[] = [];
      const mermaidProcessed = solarwireProcessed.replace(
        /```mermaid\s*([\s\S]*?)```/g,
        (match: string, code: string) => {
          const index = mermaidBlocks.length;
          mermaidBlocks.push(code.trim());
          return `${MERMAID_PLACEHOLDER_PREFIX}${index}-->`;
        }
      );

      setRenderProgress(40);

      const renderAll = async () => {
        try {
          // 步骤3：渲染 Markdown
          const renderedHtml = await marked(mermaidProcessed, {
            breaks: true,
            gfm: true,
          });

          setRenderProgress(60);

          // 步骤4：渲染 Mermaid 图表并替换占位符
          let finalHtml = renderedHtml;
          for (let i = 0; i < mermaidBlocks.length; i++) {
            const placeholder = `${MERMAID_PLACEHOLDER_PREFIX}${i}-->`;
            try {
              mermaidRenderCounter++;
              const id = `mermaid-${Date.now()}-${mermaidRenderCounter}`;
              const { svg } = await mermaid.render(id, mermaidBlocks[i]);
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
            // 更新进度
            setRenderProgress(60 + Math.round((i + 1) / mermaidBlocks.length * 30));
          }

          // 步骤5：转换图片相对路径为 file:// 绝对路径
          if (selectedFile?.path) {
            const mdDir = selectedFile.path.replace(/[\\/][^\\/]*$/, '');
            finalHtml = finalHtml.replace(
              /<img\s+([^>]*?)src="(assets\/[^"]+)"([^>]*?)>/gi,
              (match, before, src, after) => {
                const absolutePath = `${mdDir}/${src}`.replace(/\\/g, '/');
                const fileUrl = `file:///${absolutePath}`;
                return `<img ${before}src="${fileUrl}"${after}>`;
              }
            );
          }

          setRenderProgress(100);
          // 步骤6：一次性设置 HTML
          setHtml(finalHtml as string);
        } catch (error) {
          console.error('Failed to render Markdown:', error);
          setRenderProgress(100);
        } finally {
          // 延迟关闭加载状态，确保进度条显示完整
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
    <Scrollbar className="markdown-preview" ref={scrollContainerRef} onScroll={handleScroll}>
      {isRendering && (
        <div className="markdown-render-progress">
          <div
            className="progress-bar"
            style={{ width: `${renderProgress}%` }}
          />
        </div>
      )}
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </Scrollbar>
  );
}

export default MarkdownPreview;
