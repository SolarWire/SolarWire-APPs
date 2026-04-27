import React, { useEffect, useState, useCallback } from 'react';
import MonacoEditor from '../editor/MonacoEditor';
import SolarWireVisualEditor from '../editor/SolarWireVisualEditor';
import { useEditorStore } from '../../stores/editorStore';
import { useFileStore } from '../../stores/fileStore';
import { useSolarWireStore } from '../../stores/solarWireStore';
import { useComponentLibraryStore } from '../../stores/componentLibraryStore';
import { getElementRelatedLines } from '../../../shared/utils/solarwire-utils';
import { TabProvider, TabList, Tab, TabPanel } from '../ui/Tab';
import './SolarWireMode.css';

function SolarWireMode(): React.ReactElement {
  const { content, setContent, undo } = useEditorStore();
  const { selectedFile, fileContent, currentSnippet } = useFileStore();
  const selectedElements = useSolarWireStore(s => s.selectedElements);
  const setSelectedElements = useSolarWireStore(s => s.setSelectedElements);
  const zoomLevel = useSolarWireStore(s => s.zoomLevel);
  const [activeTab, setActiveTab] = useState<'visual' | 'code'>('visual');
  const [scrollTrigger, setScrollTrigger] = useState(0);
  const [highlightTrigger, setHighlightTrigger] = useState(0);

  const handleTabChange = useCallback((tab: 'visual' | 'code') => {
    setActiveTab(tab);
    if (tab === 'code' && selectedElements.length > 0) {
      setScrollTrigger(prev => prev + 1);
      setHighlightTrigger(prev => prev + 1);
    }
  }, [selectedElements.length]);

  const highlightLines = React.useMemo(() => {
    if (selectedElements.length === 0) return [];
    const lines: number[] = [];
    selectedElements.forEach((elementId) => {
      const elementLine = parseInt(elementId);
      if (!isNaN(elementLine)) {
        const relatedLines = getElementRelatedLines(content, elementLine);
        lines.push(...relatedLines);
      }
    });
    return lines;
  }, [selectedElements, content]);

  useEffect(() => {
    if (selectedFile && fileContent && !currentSnippet) {
      const editorContent = useEditorStore.getState().content;
      if (editorContent !== fileContent) {
        setContent(fileContent);
      }
    }
  }, [selectedFile?.path, fileContent, currentSnippet]);

  useEffect(() => {
    const handleKeyDownEvent = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undo();
      }
    };
    window.addEventListener('keydown', handleKeyDownEvent);
    return () => window.removeEventListener('keydown', handleKeyDownEvent);
  }, [undo]);

  return (
    <TabProvider activeTab={activeTab} onTabChange={(tabId) => handleTabChange(tabId as 'visual' | 'code')}>
      <div className="solarwire-mode">
        <div className="solarwire-header">
          <TabList className="solarwire-tabs">
            <Tab id="visual" title="可视化编辑">
              🎨
            </Tab>
            <Tab id="code" title="代码编辑">
              💻
            </Tab>
          </TabList>
        </div>

        <div className="solarwire-content">
          <TabPanel id="code">
            <div className="code-panel">
              <MonacoEditor
                language="solarwire"
                value={content}
                onChange={setContent}
                height="100%"
                highlightLines={highlightLines}
                scrollTrigger={scrollTrigger}
                highlightTrigger={highlightTrigger}
              />
            </div>
          </TabPanel>
          <TabPanel id="visual">
            <SolarWireVisualEditor
              content={content}
              onContentChange={setContent}
            />
          </TabPanel>
        </div>
      </div>
    </TabProvider>
  );
}

export default SolarWireMode;
