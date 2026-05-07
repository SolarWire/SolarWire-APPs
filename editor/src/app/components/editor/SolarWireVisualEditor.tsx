import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import SolarWirePreview from './SolarWirePreview';
import PropertyPanel from './PropertyPanel';
import TableEditorModal from './TableEditorModal';
import ComponentLibrary from './ComponentLibrary';
import LayerPanel from './LayerPanel';
import SolarWireToolbar from '../toolbar/SolarWireToolbar';
import ErrorCard from './ErrorCard';
import { useSolarWireStore, SelectionTool } from '../../stores/solarWireStore';
import { usePreviewStore } from '../../stores/previewStore';
import { syntaxErrorService, SyntaxError } from '../../services/syntax-error-service';
import { useEditorActions } from './hooks/useEditorActions';
import { useEditorKeyboard } from './hooks/useEditorKeyboard';
import ContextMenu from './ContextMenu';
import './SolarWireVisualEditor.css';

interface SolarWireVisualEditorProps {
  content: string;
  onContentChange: (content: string) => void;
  externalContent?: string;
  onExternalContentChange?: (content: string) => void;
  showLayerPanel?: boolean;
  onShowLayerPanelChange?: (show: boolean) => void;
  showComponentLibrary?: boolean;
  onShowComponentLibraryChange?: (show: boolean) => void;
  allowImageElements?: boolean;
  syntaxErrors?: any[];
  setSyntaxErrors?: (errors: any[]) => void;
  onSwitchToCodeTab?: (line: number, column: number) => void;
  errorSourceId?: string;
}

function SolarWireVisualEditor({
  content,
  onContentChange,
  externalContent,
  onExternalContentChange,
  showLayerPanel: externalShowLayerPanel,
  onShowLayerPanelChange,
  showComponentLibrary: externalShowComponentLibrary,
  onShowComponentLibraryChange,
  allowImageElements = true,
  syntaxErrors,
  setSyntaxErrors,
  onSwitchToCodeTab,
  errorSourceId: externalErrorSourceId
}: SolarWireVisualEditorProps): React.ReactElement {
  const isExternalMode = externalContent !== undefined;
  const effectiveContent = isExternalMode ? externalContent : content;
  const handleContentChange = isExternalMode ? onExternalContentChange : onContentChange;

  const [internalShowLayerPanel, setInternalShowLayerPanel] = useState(false);
  const [internalShowComponentLibrary, setInternalShowComponentLibrary] = useState(false);
  const [snapToGuides, setSnapToGuides] = useState(true);
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const [tableEditorOpen, setTableEditorOpen] = useState(false);
  const [tableEditorLine, setTableEditorLine] = useState<number | null>(null);
  const getSvgContentRef = useRef<(() => string | null) | null>(null);

  const showLayerPanel = externalShowLayerPanel !== undefined ? externalShowLayerPanel : internalShowLayerPanel;
  const showComponentLibrary = externalShowComponentLibrary !== undefined ? externalShowComponentLibrary : internalShowComponentLibrary;
  const setShowLayerPanel = onShowLayerPanelChange || setInternalShowLayerPanel;
  const setShowComponentLibrary = onShowComponentLibraryChange || setInternalShowComponentLibrary;

  const selectedElements = useSolarWireStore(s => s.selectedElements);
  const selectionTool = useSolarWireStore(s => s.selectionTool);
  const isPanMode = useSolarWireStore(s => s.isPanMode);
  const setSelectionTool = useSolarWireStore(s => s.setSelectionTool);
  const setIsPanMode = useSolarWireStore(s => s.setIsPanMode);
  const showNotes = useSolarWireStore(s => s.showNotes);
  const setShowNotes = useSolarWireStore(s => s.setShowNotes);
  const scale = usePreviewStore(s => s.scale);
  const setScale = usePreviewStore(s => s.setScale);
  const isSpacePressed = useSolarWireStore(s => s.isSpacePressed);
  const setSelectedElements = useSolarWireStore(s => s.setSelectedElements);

  const [internalSyntaxErrors, setInternalSyntaxErrors] = useState<any[]>([]);
  const currentSyntaxErrors = syntaxErrors || internalSyntaxErrors;
  const currentSetSyntaxErrors = setSyntaxErrors || setInternalSyntaxErrors;
  const setSyntaxErrorsRef = useRef(currentSetSyntaxErrors);
  setSyntaxErrorsRef.current = currentSetSyntaxErrors;

  const internalErrorSourceId = useRef(Math.random().toString(36).substr(2, 9)).current;
  const errorSourceId = externalErrorSourceId || internalErrorSourceId;

  useEffect(() => {
    syntaxErrorService.startRendererErrorMonitoring();
    const listener = {
      sourceId: errorSourceId,
      onErrorsChanged: (errors: SyntaxError[]) => {
        setSyntaxErrorsRef.current(errors);
      }
    };
    syntaxErrorService.addListener(listener);
    syntaxErrorService.clearErrors(errorSourceId);
    return () => {
      syntaxErrorService.removeListener(listener);
      syntaxErrorService.stopRendererErrorMonitoring();
    };
  }, [effectiveContent, errorSourceId]);

  const handleJumpToError = useCallback((line: number, column: number) => {
    if (onSwitchToCodeTab) {
      onSwitchToCodeTab(line, column);
    } else {
      setTimeout(() => {
        const event = new CustomEvent('jumpToError', { detail: { line, column } });
        window.dispatchEvent(event);
      }, 100);
    }
  }, [onSwitchToCodeTab]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    const previewEl = document.querySelector('.solarwire-preview');
    if (!previewEl || !previewEl.contains(e.target as Node)) return;
    e.preventDefault();
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
  }, []);

  const closeContextMenu = useCallback(() => {
    setContextMenuPosition(null);
  }, []);

  const {
    handleDeleteSelected,
    handleBringToFront,
    handleAlign,
    handleReorderElements,
    handleDropComponentToCanvas,
    handleExportSvg,
  } = useEditorActions({
    content,
    effectiveContent,
    handleContentChange,
    getSvgContentRef,
    setShowComponentLibrary,
  });

  useEditorKeyboard({
    content,
    handleContentChange,
    handleDeleteSelected,
  });

  const handleZoomIn = () => setScale(Math.min(scale + 0.1, 2));
  const handleZoomOut = () => setScale(Math.max(scale - 0.1, 0.25));

  const toolbarState = useMemo(() => ({
    showLayerPanel,
    showComponentLibrary,
    showNotes,
    scale,
    isPanMode,
    isSpacePressed,
    selectionTool,
    selectedCount: selectedElements.length,
    snapToGuides
  }), [showLayerPanel, showComponentLibrary, showNotes, scale, isPanMode, isSpacePressed, selectionTool, selectedElements.length, snapToGuides]);

  const toolbarCallbacks = useMemo(() => ({
    onToggleLayerPanel: () => setShowLayerPanel(!showLayerPanel),
    onToggleComponentLibrary: () => setShowComponentLibrary(!showComponentLibrary),
    onToggleNotes: () => setShowNotes(!showNotes),
    onZoomIn: handleZoomIn,
    onZoomOut: handleZoomOut,
    onTogglePanMode: () => setIsPanMode(!isPanMode),
    onSelectTool: (tool: SelectionTool) => {
      setSelectionTool(tool);
      if (isPanMode) setIsPanMode(false);
    },
    onBringToFront: handleBringToFront,
    onAlign: handleAlign,
    onExportSvg: handleExportSvg,
    onToggleSnapGuides: () => setSnapToGuides(!snapToGuides)
  }), [showLayerPanel, showComponentLibrary, showNotes, isPanMode, handleZoomIn, handleZoomOut, handleBringToFront, handleAlign, handleExportSvg, snapToGuides]);

  return (
    <div className="solarwire-visual-editor">
      <SolarWireToolbar state={toolbarState} callbacks={toolbarCallbacks} />

      <div className="solarwire-content">
        <SolarWirePreview
            selectionTool={selectionTool}
            showNotes={showNotes}
            isPanMode={isPanMode}
            isSpacePressed={isSpacePressed}
            snapToGuides={snapToGuides}
            externalContent={externalContent}
            onExternalContentChange={onExternalContentChange}
            onContextMenu={handleContextMenu}
            allowImageElements={allowImageElements}
            onRequestExportSvg={(fn) => { getSvgContentRef.current = fn; }}
            hasSyntaxErrors={currentSyntaxErrors.length > 0}
          />

        {currentSyntaxErrors.length > 0 && (
          <>
            {currentSyntaxErrors.slice(0, 3).map((error: SyntaxError, index: number) => (
              <ErrorCard 
                key={`${error.line}-${error.column}-${index}`}
                error={error}
                onViewInCode={handleJumpToError}
              />
            ))}
          </>
        )}

        {selectedElements.length > 0 && (
          <div className="property-panel-fixed">
            <PropertyPanel
              externalContent={externalContent}
              onExternalContentChange={onExternalContentChange}
              onOpenTableEditor={(line) => {
                setTableEditorLine(line);
                setTableEditorOpen(true);
              }}
            />
          </div>
        )}

        {showLayerPanel && (
          <div className="layer-panel-fixed">
            <LayerPanel 
              onSelectElement={(id) => setSelectedElements([id])} 
              onReorderElements={handleReorderElements}
              externalContent={externalContent}
            />
          </div>
        )}

        {showComponentLibrary && (
          <div className="component-library-panel-fixed">
            <ComponentLibrary onDropToCanvas={handleDropComponentToCanvas} />
          </div>
        )}

        <ContextMenu
          position={contextMenuPosition}
          content={content}
          onClose={closeContextMenu}
          onDelete={handleDeleteSelected}
          onContentChange={handleContentChange}
        />

        {tableEditorOpen && tableEditorLine !== null && (
          <TableEditorModal
            isOpen={tableEditorOpen}
            content={externalContent || content}
            tableLine={tableEditorLine}
            onSave={(newContent) => {
              if (onExternalContentChange) {
                onExternalContentChange(newContent);
              } else {
                onContentChange(newContent);
              }
              setTableEditorOpen(false);
            }}
            onClose={() => setTableEditorOpen(false)}
          />
        )}
      </div>
    </div>
  );
}

export default SolarWireVisualEditor;
