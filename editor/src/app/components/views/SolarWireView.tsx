import React, { useState, useMemo, useEffect } from 'react';
import { useFileStore } from '../../stores/fileStore';
import { useAppStore } from '../../stores/appStore';
import { SolarWireSnippet } from '../../types/file';
import { useSelectionStore } from '../../stores/selectionStore';
import './SolarWireView.css';

function SolarWireView(): JSX.Element {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [pages, setPages] = useState<SolarWireSnippet[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const { currentPath, openFileAtPath, openSolarWireSnippet } = useFileStore();

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
          
          // 处理snippets，提取标题和需求信息
          const processedSnippets = snippets.map((snippet: SolarWireSnippet) => {
            // 从代码中提取!title标记
            const titleMatch = snippet.code.match(/!title=(.+)/);
            let title = '';
            if (titleMatch && titleMatch[1]) {
              title = titleMatch[1].trim();
              // 去掉双引号
              if (title.startsWith('"') && title.endsWith('"')) {
                title = title.substring(1, title.length - 1);
              }
            }
            
            // 提取需求名称（文件夹名称）
            let requirementName = 'Root';
            if (snippet.sourceFile) {
              const relativePath = snippet.sourceFile.replace(currentPath, '');
              const lastSlash = relativePath.lastIndexOf('/');
              const lastBackslash = relativePath.lastIndexOf('\\');
              const lastSeparator = Math.max(lastSlash, lastBackslash);
              if (lastSeparator > 0) {
                requirementName = relativePath.substring(1, lastSeparator);
              }
            }
            
            // 生成副标题：需求名称-#编号
            const subtitle = `${requirementName}-#${snippet.snippetIndex || 1}`;
            
            // 如果没有提取到标题，使用副标题作为标题
            const displayTitle = title || subtitle;
            
            return {
              ...snippet,
              displayTitle,
              subtitle,
              requirementName
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
  }, [currentPath]);

  const filteredPages = useMemo(() => {
    return pages.filter((page) =>
      page.displayTitle.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [pages, searchTerm]);

  const { selectedFile, currentSnippet } = useFileStore();
  const { currentView } = useAppStore();
  const { setSelection, getSelectionForView } = useSelectionStore();

  const handleClick = async (page: any) => {
    if (page.type === 'file' && openFileAtPath) {
      // 更新选中记录
      setSelection('solarwire', page.sourceFile);
      await openFileAtPath(page.sourceFile);
    } else if (page.type === 'snippet' && openSolarWireSnippet) {
      // 更新选中记录
      setSelection('solarwire', page.sourceFile, page.id);
      await openSolarWireSnippet(page);
    }
  };

  const isSelected = (page: any): boolean => {
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
          {filteredPages.map((page: any) => (
            <div
              key={page.id}
              className={`page-card ${isSelected(page) ? 'page-card-selected' : ''}`}
              onClick={() => handleClick(page)}
            >
              <h4 className="page-title">{page.displayTitle}</h4>
              <div className="page-subtitle">{page.subtitle}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SolarWireView;
