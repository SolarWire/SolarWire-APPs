import React, { useState, useCallback, useEffect, useRef } from 'react';
import { TabProvider, TabList, Tab, TabPanel } from '../ui/Tab';
import MonacoEditor from '../editor/MonacoEditor';
import SolarWireVisualEditor from '../editor/SolarWireVisualEditor';
import ErrorPanel from '../editor/ErrorPanel';
import { useEditorStore } from '../../stores/editorStore';
import { useFileStore } from '../../stores/fileStore';
import { useSolarWireStore } from '../../stores/solarWireStore';
import { getElementRelatedLines } from '../../../shared/utils/solarwire-utils';
import { syntaxErrorService, SyntaxError } from '../../services/syntax-error-service';
import './SolarWireMode.css';

function SolarWireMode(): React.ReactElement {
  const { content, setContent, commitContent, undo } = useEditorStore();
  const { selectedFile, fullFileContent, currentSnippet, syncFullFileContent } = useFileStore();
  const selectedElements = useSolarWireStore(s => s.selectedElements);
  const setSelectedElements = useSolarWireStore(s => s.setSelectedElements);
  const [activeTab, setActiveTab] = useState<'visual' | 'code'>('visual');
  const [scrollTrigger, setScrollTrigger] = useState(0);
  const [highlightTrigger, setHighlightTrigger] = useState(0);
  const [syntaxErrors, setSyntaxErrors] = useState<SyntaxError[]>([]);
  const mainErrorSourceId = useRef('main-editor').current;

  useEffect(() => {
    const listener = {
      sourceId: mainErrorSourceId,
      onErrorsChanged: (errors: SyntaxError[]) => {
        setSyntaxErrors(errors);
      }
    };

    syntaxErrorService.addListener(listener);
    return () => {
      syntaxErrorService.removeListener(listener);
    };
  }, [mainErrorSourceId]);

  useEffect(() => {
    const handleJumpToErrorEvent = (event: CustomEvent) => {
      const { line, column } = event.detail;

      setActiveTab('code');

      setTimeout(() => {
        setScrollTrigger(prev => prev + 1);
        setHighlightTrigger(prev => prev + 1);
      }, 100);
    };

    window.addEventListener('jumpToError', handleJumpToErrorEvent as EventListener);
    return () => {
      window.removeEventListener('jumpToError', handleJumpToErrorEvent as EventListener);
    };
  }, []);

  const handleContentChange = useCallback((newContent: string, snapshot?: string) => {
    if (snapshot !== undefined) {
      commitContent(newContent, snapshot);
    } else {
      setContent(newContent);
    }
    syncFullFileContent(newContent);

    syntaxErrorService.setCurrentSourceId(mainErrorSourceId);
    syntaxErrorService.runRendererCheck(newContent);
  }, [setContent, commitContent, syncFullFileContent, mainErrorSourceId]);

  const handleJumpToError = useCallback((line: number, column: number) => {
    setActiveTab('code');

    setTimeout(() => {
      setScrollTrigger(prev => prev + 1);
      setHighlightTrigger(prev => prev + 1);
    }, 100);
  }, []);

  const handleTabChange = useCallback((tab: 'visual' | 'code') => {
    setActiveTab(tab);
    if (tab === 'code' && selectedElements.length > 0) {
      setTimeout(() => {
        setScrollTrigger(prev => prev + 1);
        setHighlightTrigger(prev => prev + 1);
      }, 50);
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
    if (selectedFile && !currentSnippet) {
      if (content !== fullFileContent && fullFileContent) {
        setContent(fullFileContent);
      }
    }
  }, [selectedFile?.path, fullFileContent, currentSnippet]);

  useEffect(() => {
    if (selectedFile && currentSnippet) {
      syncFullFileContent(content);
    }
  }, [content, selectedFile, currentSnippet, syncFullFileContent]);

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
                onChange={handleContentChange}
                height="100%"
                highlightLines={highlightLines}
                errorLines={syntaxErrors.map(e => e.line)}
                scrollTrigger={scrollTrigger}
                highlightTrigger={highlightTrigger}
                errorSourceId={mainErrorSourceId}
              />
              {syntaxErrors.length > 0 && (
                <ErrorPanel
                  errors={syntaxErrors}
                  onJumpToError={handleJumpToError}
                />
              )}
            </div>
          </TabPanel>
          <TabPanel id="visual">
            <SolarWireVisualEditor
              content={content}
              onContentChange={handleContentChange}
              syntaxErrors={syntaxErrors}
              setSyntaxErrors={setSyntaxErrors}
              errorSourceId={mainErrorSourceId}
            />
          </TabPanel>
        </div>
      </div>
    </TabProvider>
  );
}

export default SolarWireMode;
