import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useFileStore } from '../../stores/fileStore';
import { useAppStore } from '../../stores/appStore';
import { SolarWireSnippet } from '../../../shared/types/file';
import { useSelectionStore } from '../../stores/selectionStore';
import { Scrollbar } from '../ui/Scrollbar';
import ContextMenu, { ContextMenuItem } from '../ui/ContextMenu';
import { replaceSolarWireSnippetInMarkdown } from '../../stores/fileStore';
import './SolarWireView.css';

interface SolarWirePage extends SolarWireSnippet {
  displayTitle: string;
  subtitle: string;
  requirementName: string;
  relativePath: string;
  declarations: Record<string, string>;
  keyDeclarations: string[];
  lineCount: number;
  elementCount: number;
}

const KEY_DECLARATION_NAMES = new Set(['page', 'size', 'direction', 'theme']);

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

function extractTitle(declarations: Record<string, string>): string {
  return declarations['title'] || '';
}

function getRelativePath(sourceFile: string, currentPath: string): string {
  const normalized = sourceFile.replace(/\\/g, '/');
  const normalizedRoot = currentPath.replace(/\\/g, '/');
  if (normalized.startsWith(normalizedRoot)) {
    let rel = normalized.substring(normalizedRoot.length);
    if (rel.startsWith('/')) rel = rel.substring(1);
    return rel;
  }
  return sourceFile;
}

function countElements(code: string): number {
  let count = 0;
  const lines = code.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('!')) continue;
    if (
      trimmed.startsWith('[') ||
      trimmed.startsWith('(') ||
      trimmed.startsWith('"') ||
      trimmed.startsWith('--') ||
      trimmed.startsWith('##') ||
      trimmed.startsWith('#') ||
      trimmed.startsWith('<')
    ) {
      count++;
    }
  }
  return count;
}

interface TooltipProps {
  page: SolarWirePage;
  visible: boolean;
  anchorRect: DOMRect | null;
  onNavigateToFile: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

function SnippetTooltip({ page, visible, anchorRect, onNavigateToFile, onMouseEnter, onMouseLeave }: TooltipProps) {
  if (!visible || !anchorRect) return null;

  const style: React.CSSProperties = {
    position: 'fixed',
    left: anchorRect.right + 8,
    top: anchorRect.top,
    zIndex: 10000,
  };

  if (anchorRect.right + 280 > window.innerWidth) {
    style.left = anchorRect.left - 280 - 8;
  }
  if (anchorRect.top + 300 > window.innerHeight) {
    style.top = window.innerHeight - 300 - 8;
  }

  const declKeys = Object.keys(page.declarations);

  return createPortal(
    <div
      className="snippet-tooltip"
      style={style}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="snippet-tooltip-row">
        <span className="snippet-tooltip-label">标题</span>
        <span className="snippet-tooltip-value">{page.displayTitle}</span>
      </div>
      <div className="snippet-tooltip-row">
        <span className="snippet-tooltip-label">文件</span>
        <span className="snippet-tooltip-value snippet-tooltip-file">
          {page.relativePath}
          <button
            className="snippet-tooltip-nav-btn"
            onClick={(e) => { e.stopPropagation(); onNavigateToFile(); }}
            title="在文件视图中定位"
          >
            📂
          </button>
        </span>
      </div>
      <div className="snippet-tooltip-row">
        <span className="snippet-tooltip-label">序号</span>
        <span className="snippet-tooltip-value">#{page.snippetIndex || 1}</span>
      </div>
      {declKeys.length > 0 && (
        <>
          <div className="snippet-tooltip-divider" />
          <div className="snippet-tooltip-row">
            <span className="snippet-tooltip-label">声明</span>
          </div>
          {declKeys.map((key) => (
            <div key={key} className="snippet-tooltip-row snippet-tooltip-indent">
              <span className="snippet-tooltip-decl">!{key}={page.declarations[key]}</span>
            </div>
          ))}
        </>
      )}
      <div className="snippet-tooltip-divider" />
      <div className="snippet-tooltip-row">
        <span className="snippet-tooltip-label">代码行数</span>
        <span className="snippet-tooltip-value">{page.lineCount}</span>
      </div>
      <div className="snippet-tooltip-row">
        <span className="snippet-tooltip-label">元素数量</span>
        <span className="snippet-tooltip-value">{page.elementCount}</span>
      </div>
    </div>,
    document.body
  );
}

function SolarWireView(): React.ReactElement {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [pages, setPages] = useState<SolarWirePage[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const { currentPath, openFileAtPath, openSolarWireSnippet, refreshKey, fullFileContent, syncFullFileContent, expandToPath } = useFileStore();
  const { setCurrentView } = useAppStore();

  const [tooltipPage, setTooltipPage] = useState<SolarWirePage | null>(null);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipRect, setTooltipRect] = useState<DOMRect | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [contextMenuVisible, setContextMenuVisible] = useState(false);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });
  const [contextMenuPage, setContextMenuPage] = useState<SolarWirePage | null>(null);

  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const renameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const collectSnippets = async () => {
      if (!currentPath) {
        setPages([]);
        return;
      }

      setLoading(true);
      try {
        const api = (window as any).api;
        if (api && typeof api.collectSolarWireSnippets === 'function') {
          const snippets = await api.collectSolarWireSnippets(currentPath);

          const processedSnippets = snippets.map((snippet: SolarWireSnippet) => {
            const declarations = extractDeclarations(snippet.code);
            const title = extractTitle(declarations);
            const relativePath = getRelativePath(snippet.sourceFile, currentPath);

            let requirementName = 'Root';
            const lastSlash = relativePath.lastIndexOf('/');
            if (lastSlash > 0) {
              requirementName = relativePath.substring(0, lastSlash);
            }

            const subtitle = `${requirementName} · #${snippet.snippetIndex || 1}`;
            const displayTitle = title || `${relativePath.split('/').pop() || snippet.name} #${snippet.snippetIndex || 1}`;

            const keyDeclarations: string[] = [];
            for (const key of KEY_DECLARATION_NAMES) {
              if (declarations[key]) {
                keyDeclarations.push(`${key}=${declarations[key]}`);
              }
            }

            const lineCount = snippet.code.split(/\r?\n/).filter(l => l.trim()).length;
            const elementCount = countElements(snippet.code);

            return {
              ...snippet,
              displayTitle,
              subtitle,
              requirementName,
              relativePath,
              declarations,
              keyDeclarations,
              lineCount,
              elementCount
            };
          });

          setPages(processedSnippets);
        }
      } catch (err) {
        console.error('Failed to collect solarwire snippets:', err);
        setPages([]);
      } finally {
        setLoading(false);
      }
    };

    collectSnippets();
  }, [currentPath, refreshKey]);

  const filteredPages = useMemo(() => {
    const term = searchTerm.toLowerCase();
    if (!term) return pages;
    return pages.filter((page) => {
      if (page.displayTitle.toLowerCase().includes(term)) return true;
      if (page.subtitle.toLowerCase().includes(term)) return true;
      if (page.relativePath.toLowerCase().includes(term)) return true;
      for (const key of Object.keys(page.declarations)) {
        if (page.declarations[key].toLowerCase().includes(term)) return true;
      }
      return false;
    });
  }, [pages, searchTerm]);

  const { selectedFile, currentSnippet } = useFileStore();
  const { currentView } = useAppStore();
  const { setSelection, getSelectionForView } = useSelectionStore();

  const handleClick = async (page: SolarWirePage) => {
    if (page.type === 'file' && openFileAtPath) {
      setSelection('solarwire', page.sourceFile);
      await openFileAtPath(page.sourceFile);
    } else if (page.type === 'snippet' && openSolarWireSnippet) {
      setSelection('solarwire', page.sourceFile, page.id);
      await openSolarWireSnippet(page);
    }
  };

  const isSelected = (page: SolarWirePage): boolean => {
    if (currentView !== 'solarwire') {
      return false;
    }
    const selectedItem = getSelectionForView('solarwire');
    if (page.type === 'file') {
      return selectedFile?.path === page.sourceFile || selectedItem?.path === page.sourceFile;
    } else if (page.type === 'snippet') {
      return currentSnippet?.id === page.id || selectedItem?.snippetId === page.id;
    }
    return false;
  };

  const showTooltip = useCallback((page: SolarWirePage, rect: DOMRect) => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    setTooltipPage(page);
    setTooltipRect(rect);
    setTooltipVisible(true);
  }, []);

  const scheduleHideTooltip = useCallback(() => {
    hideTimerRef.current = setTimeout(() => {
      setTooltipVisible(false);
      setTooltipPage(null);
    }, 200);
  }, []);

  const cancelHideTooltip = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const handleNavigateToFile = useCallback(async () => {
    if (!tooltipPage) return;
    setTooltipVisible(false);
    setTooltipPage(null);
    if (expandToPath) expandToPath(tooltipPage.sourceFile);
    setCurrentView('file');
    if (openFileAtPath) {
      await openFileAtPath(tooltipPage.sourceFile);
    }
  }, [tooltipPage, setCurrentView, openFileAtPath, expandToPath]);

  const handleContextMenu = useCallback((e: React.MouseEvent, page: SolarWirePage) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenuPage(page);
    setContextMenuPos({ x: e.clientX, y: e.clientY });
    setContextMenuVisible(true);
  }, []);

  const handleRename = useCallback(() => {
    if (!contextMenuPage) return;
    setRenameValue(contextMenuPage.declarations['title'] || '');
    setRenaming(true);
    setTimeout(() => renameInputRef.current?.focus(), 50);
  }, [contextMenuPage]);

  const handleRenameConfirm = useCallback(async () => {
    if (!contextMenuPage || !renameValue.trim()) {
      setRenaming(false);
      return;
    }

    const newTitle = renameValue.trim();
    const code = contextMenuPage.code;
    let newCode: string;

    if (contextMenuPage.declarations['title']) {
      newCode = code.replace(/!title=.+/, `!title=${newTitle}`);
    } else {
      newCode = `!title=${newTitle}\n` + code;
    }

    if (contextMenuPage.snippetIndex !== undefined) {
      const updatedFullContent = replaceSolarWireSnippetInMarkdown(
        fullFileContent,
        contextMenuPage.snippetIndex,
        newCode
      );
      syncFullFileContent(updatedFullContent);

      const api = (window as any).api;
      if (api && typeof api.writeFile === 'function') {
        await api.writeFile(contextMenuPage.sourceFile, updatedFullContent);
      }

      setPages(prev => prev.map(p => {
        if (p.id === contextMenuPage.id) {
          const newDeclarations = { ...p.declarations, title: newTitle };
          return {
            ...p,
            code: newCode,
            declarations: newDeclarations,
            displayTitle: newTitle,
          };
        }
        return p;
      }));
    }

    setRenaming(false);
  }, [contextMenuPage, renameValue, fullFileContent, syncFullFileContent]);

  const handleCopyPath = useCallback(() => {
    if (!contextMenuPage) return;
    navigator.clipboard.writeText(contextMenuPage.sourceFile);
  }, [contextMenuPage]);

  const handleOpenInFileView = useCallback(async () => {
    if (!contextMenuPage) return;
    if (expandToPath) expandToPath(contextMenuPage.sourceFile);
    setCurrentView('file');
    if (openFileAtPath) {
      await openFileAtPath(contextMenuPage.sourceFile);
    }
  }, [contextMenuPage, setCurrentView, openFileAtPath, expandToPath]);

  const contextMenuItems: ContextMenuItem[] = useMemo(() => {
    const items: ContextMenuItem[] = [
      { type: 'item', label: '重命名标题', icon: '✏️', onClick: handleRename },
      { type: 'item', label: '在文件视图中定位', icon: '📂', onClick: handleOpenInFileView },
      { type: 'separator' },
      { type: 'item', label: '复制文件路径', icon: '📋', onClick: handleCopyPath },
    ];
    return items;
  }, [handleRename, handleOpenInFileView, handleCopyPath]);

  if (!currentPath) {
    return (
    <div className="solarwire-view pages-view">
      <input
        type="text"
        className="search-input"
        placeholder="Search pages..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        disabled
      />
      <div className="solarwire-empty">Open a folder first to see SolarWire files</div>
    </div>
  );
  }

  return (
    <Scrollbar className="solarwire-view-scrollbar">
      <div className="solarwire-view pages-view">
        <input
          type="text"
          className="search-input"
          placeholder="Search pages..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {loading ? (
          <div className="solarwire-empty">Loading...</div>
        ) : filteredPages.length === 0 ? (
          <div className="solarwire-empty">No SolarWire files found in the current folder</div>
        ) : (
          <div className="page-grid">
            {filteredPages.map((page: SolarWirePage) => (
              <div
                key={page.id}
                className={`page-card ${isSelected(page) ? 'page-card-selected' : ''}`}
                onClick={() => handleClick(page)}
                onContextMenu={(e) => handleContextMenu(e, page)}
                onMouseEnter={(e) => showTooltip(page, (e.currentTarget as HTMLElement).getBoundingClientRect())}
                onMouseLeave={scheduleHideTooltip}
              >
                <h4 className="page-title">{page.displayTitle}</h4>
                <div className="page-subtitle">{page.subtitle}</div>
                {page.keyDeclarations.length > 0 && (
                  <div className="page-declarations">
                    {page.keyDeclarations.map((decl) => (
                      <span key={decl} className="page-declaration-tag">{decl}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <SnippetTooltip
        page={tooltipPage!}
        visible={tooltipVisible && tooltipPage !== null}
        anchorRect={tooltipRect}
        onNavigateToFile={handleNavigateToFile}
        onMouseEnter={cancelHideTooltip}
        onMouseLeave={scheduleHideTooltip}
      />

      <ContextMenu
        visible={contextMenuVisible}
        x={contextMenuPos.x}
        y={contextMenuPos.y}
        items={contextMenuItems}
        onClose={() => setContextMenuVisible(false)}
      />

      {renaming && createPortal(
        <div className="rename-overlay" onClick={() => setRenaming(false)}>
          <div className="rename-dialog" onClick={(e) => e.stopPropagation()}>
            <h3 className="rename-title">重命名标题</h3>
            <input
              ref={renameInputRef}
              className="rename-input"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRenameConfirm();
                if (e.key === 'Escape') setRenaming(false);
              }}
              placeholder="输入新标题"
            />
            <div className="rename-actions">
              <button className="rename-btn rename-btn-cancel" onClick={() => setRenaming(false)}>取消</button>
              <button className="rename-btn rename-btn-confirm" onClick={handleRenameConfirm}>确认</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </Scrollbar>
  );
}

export default SolarWireView;
