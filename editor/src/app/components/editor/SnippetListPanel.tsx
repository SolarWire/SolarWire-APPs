import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useFileStore } from '../../stores/fileStore';
import { SolarWireSnippet } from '../../../shared/types/file';
import { useSelectionStore } from '../../stores/selectionStore';
import ContextMenu, { ContextMenuItem } from '../ui/ContextMenu';
import { replaceSolarWireSnippetInMarkdown } from '../../stores/fileStore';
import { generateThumbnail } from '../../../lib/components/thumbnail-generator';
import './SnippetListPanel.css';

interface SnippetListPanelProps {
  sourceFilePath: string;
  fileName: string;
}

function extractDeclarations(code: string): Record<string, string> {
  const declarations: Record<string, string> = {};
  const regex = /!(\w+)=(.+)/g;
  let match;
  while ((match = regex.exec(code)) !== null) {
    let value = match[2].trim();
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    }
    declarations[match[1]] = value;
  }
  return declarations;
}

const SnippetListPanel: React.FC<SnippetListPanelProps> = ({ sourceFilePath, fileName }) => {
  const { snippetsByFile, openSolarWireSnippet, currentSnippet, fullFileContent, syncFullFileContent } = useFileStore();
  const { setSelection } = useSelectionStore();
  const snippets = snippetsByFile[sourceFilePath] || [];

  const [contextMenuVisible, setContextMenuVisible] = useState(false);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });
  const [contextMenuSnippet, setContextMenuSnippet] = useState<SolarWireSnippet | null>(null);

  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const renameInputRef = useRef<HTMLInputElement>(null);

  const [tooltipState, setTooltipState] = useState<{
    visible: boolean;
    x: number;
    y: number;
    snippetId: string;
  }>({ visible: false, x: 0, y: 0, snippetId: '' });
  const [thumbnailCache, setThumbnailCache] = useState<Record<string, string>>({});
  const thumbnailLoadingRef = useRef<Set<string>>(new Set());
  const prevSnippetCodesRef = useRef<Record<string, string>>({});
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    const currentSnippetCodes: Record<string, string> = {};
    let hasChanged = false;
    for (const s of snippets) {
      currentSnippetCodes[s.id] = s.code;
    }

    for (const id of Object.keys(prevSnippetCodesRef.current)) {
      if (!currentSnippetCodes[id]) {
        hasChanged = true;
        break;
      }
      if (prevSnippetCodesRef.current[id] !== currentSnippetCodes[id]) {
        hasChanged = true;
        break;
      }
    }
    if (Object.keys(prevSnippetCodesRef.current).length !== Object.keys(currentSnippetCodes).length) {
      hasChanged = true;
    }

    if (hasChanged) {
      setThumbnailCache({});
      thumbnailLoadingRef.current.clear();
    }
    prevSnippetCodesRef.current = currentSnippetCodes;
  }, [snippets]);

  useEffect(() => {
    if (!tooltipState.visible || !tooltipState.snippetId) return;
    const snippet = snippets.find(s => s.id === tooltipState.snippetId);
    if (!snippet) return;
    if (thumbnailCache[snippet.id] || thumbnailLoadingRef.current.has(snippet.id)) return;

    thumbnailLoadingRef.current.add(snippet.id);
    generateThumbnail(snippet.code, 200, 140).then(svg => {
      setThumbnailCache(prev => ({ ...prev, [snippet.id]: svg }));
      thumbnailLoadingRef.current.delete(snippet.id);
    }).catch(() => {
      thumbnailLoadingRef.current.delete(snippet.id);
    });
  }, [tooltipState.visible, tooltipState.snippetId, snippets]);

  const handleItemMouseEnter = useCallback((snippet: SolarWireSnippet) => {
    const el = itemRefs.current[snippet.id];
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setTooltipState({
      visible: true,
      x: rect.right + 8,
      y: rect.top,
      snippetId: snippet.id,
    });
  }, []);

  const handleItemMouseLeave = useCallback(() => {
    setTooltipState(prev => ({ ...prev, visible: false }));
  }, []);

  const handleClick = useCallback(async (snippet: SolarWireSnippet) => {
    setSelection('file', snippet.sourceFile, snippet.id);
    if (openSolarWireSnippet) {
      await openSolarWireSnippet(snippet);
    }
  }, [openSolarWireSnippet, setSelection]);

  const isSelected = useCallback((snippet: SolarWireSnippet): boolean => {
    return currentSnippet?.id === snippet.id;
  }, [currentSnippet]);

  const handleContextMenu = useCallback((e: React.MouseEvent, snippet: SolarWireSnippet) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenuSnippet(snippet);
    setContextMenuPos({ x: e.clientX, y: e.clientY });
    setContextMenuVisible(true);
  }, []);

  const handleRename = useCallback(() => {
    if (!contextMenuSnippet) return;
    const declarations = extractDeclarations(contextMenuSnippet.code);
    setRenameValue(declarations['title'] || '');
    setRenaming(true);
    setTimeout(() => renameInputRef.current?.focus(), 50);
  }, [contextMenuSnippet]);

  const handleRenameConfirm = useCallback(async () => {
    if (!contextMenuSnippet || !renameValue.trim()) {
      setRenaming(false);
      return;
    }

    const newTitle = renameValue.trim();
    const code = contextMenuSnippet.code;
    let newCode: string;

    const declarations = extractDeclarations(code);
    if (declarations['title']) {
      newCode = code.replace(/!title=.+/, `!title=${newTitle}`);
    } else {
      newCode = `!title=${newTitle}\n` + code;
    }

    if (contextMenuSnippet.snippetIndex !== undefined) {
      const updatedFullContent = replaceSolarWireSnippetInMarkdown(
        fullFileContent,
        contextMenuSnippet.snippetIndex,
        newCode
      );
      syncFullFileContent(updatedFullContent);

      const api = (window as any).api;
      if (api && typeof api.writeFile === 'function') {
        await api.writeFile(contextMenuSnippet.sourceFile, updatedFullContent);
      }
    }

    setRenaming(false);
  }, [contextMenuSnippet, renameValue, fullFileContent, syncFullFileContent]);

  const handleCopyPath = useCallback(() => {
    if (!contextMenuSnippet) return;
    navigator.clipboard.writeText(contextMenuSnippet.sourceFile);
  }, [contextMenuSnippet]);

  const contextMenuItems: ContextMenuItem[] = useMemo(() => [
    { type: 'item', label: '重命名标题', icon: '✏️', onClick: handleRename },
    { type: 'separator' },
    { type: 'item', label: '复制文件路径', icon: '📋', onClick: handleCopyPath },
  ], [handleRename, handleCopyPath]);

  const getSnippetTitle = (snippet: SolarWireSnippet): string => {
    const declarations = extractDeclarations(snippet.code);
    return declarations['title'] || '';
  };

  const getSnippetTooltipContent = (snippet: SolarWireSnippet) => {
    const declarations = extractDeclarations(snippet.code);
    const title = declarations['title'] || '未命名';
    const index = snippet.snippetIndex || 1;
    const lines = [`#${index} ${title}`];
    if (declarations['bg']) lines.push(`背景: ${declarations['bg']}`);
    if (declarations['w']) lines.push(`宽度: ${declarations['w']}`);
    if (declarations['h']) lines.push(`高度: ${declarations['h']}`);
    return lines;
  };

  const tooltipSnippet = tooltipState.visible
    ? snippets.find(s => s.id === tooltipState.snippetId)
    : null;

  if (snippets.length === 0) return null;

  return (
    <div className="snippet-list-panel">
      <div className="snippet-list-header">
        📝 {fileName} · SolarWire 页面
      </div>
      <div className="snippet-list-items">
        {snippets.map((snippet) => {
          const title = getSnippetTitle(snippet);
          const index = snippet.snippetIndex || 1;
          const displayText = title ? `#${index} ${title}` : `#${index}`;

          return (
            <div
              key={snippet.id}
              ref={el => { itemRefs.current[snippet.id] = el; }}
              className={`snippet-list-item ${isSelected(snippet) ? 'snippet-list-item-selected' : ''}`}
              onClick={() => handleClick(snippet)}
              onContextMenu={(e) => handleContextMenu(e, snippet)}
              onMouseEnter={() => handleItemMouseEnter(snippet)}
              onMouseLeave={handleItemMouseLeave}
            >
              <span className="snippet-list-item-icon">⚡</span>
              <span className="snippet-list-item-text">{displayText}</span>
            </div>
          );
        })}
      </div>

      <ContextMenu
        visible={contextMenuVisible}
        x={contextMenuPos.x}
        y={contextMenuPos.y}
        items={contextMenuItems}
        onClose={() => setContextMenuVisible(false)}
      />

      {tooltipSnippet && createPortal(
        <div
          className="snippet-global-tooltip"
          style={{
            position: 'fixed',
            left: tooltipState.x,
            top: tooltipState.y,
            zIndex: 10000,
          }}
        >
          {thumbnailCache[tooltipSnippet.id] ? (
            <div
              className="snippet-tooltip-preview"
              dangerouslySetInnerHTML={{ __html: thumbnailCache[tooltipSnippet.id] }}
            />
          ) : (
            <div className="snippet-tooltip-preview snippet-tooltip-preview-loading">
              <span>生成预览...</span>
            </div>
          )}
          <div className="snippet-tooltip-info">
            {getSnippetTooltipContent(tooltipSnippet).map((line, i) => (
              <div key={i} className="snippet-tooltip-info-line">{line}</div>
            ))}
          </div>
        </div>,
        document.body
      )}

      {renaming && createPortal(
        <div className="snippet-rename-overlay" onClick={() => setRenaming(false)}>
          <div className="snippet-rename-dialog" onClick={(e) => e.stopPropagation()}>
            <h3 className="snippet-rename-title">重命名标题</h3>
            <input
              ref={renameInputRef}
              className="snippet-rename-input"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRenameConfirm();
                if (e.key === 'Escape') setRenaming(false);
              }}
              placeholder="输入新标题"
            />
            <div className="snippet-rename-actions">
              <button className="snippet-rename-btn snippet-rename-btn-cancel" onClick={() => setRenaming(false)}>取消</button>
              <button className="snippet-rename-btn snippet-rename-btn-confirm" onClick={handleRenameConfirm}>确认</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default SnippetListPanel;
