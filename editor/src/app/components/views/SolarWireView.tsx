import React, { useState, useMemo, useEffect } from 'react';
import { useFileStore } from '../../stores/fileStore';
import { SolarWireSnippet } from '../../types/file';
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
          setPages(snippets);
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
      page.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [pages, searchTerm]);

  const handleClick = async (page: SolarWireSnippet) => {
    if (page.type === 'file' && openFileAtPath) {
      await openFileAtPath(page.sourceFile);
    } else if (page.type === 'snippet' && openSolarWireSnippet) {
      await openSolarWireSnippet(page);
    }
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
          {filteredPages.map((page) => (
            <div
              key={page.id}
              className="page-card"
              onClick={() => handleClick(page)}
            >
              <h4 className="page-name">{page.name}</h4>
              <div className="page-type">{page.type === 'file' ? 'File' : 'Snippet'}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SolarWireView;
