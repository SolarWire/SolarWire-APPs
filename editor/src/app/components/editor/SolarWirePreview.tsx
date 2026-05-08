import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useCoordinateSystem } from '../../../shared/hooks/useCoordinateSystem';
import {
  calculateImageSize
} from '../../../shared/utils/preview-utils';
import { useSolarWireStore } from '../../stores/solarWireStore';
import { useEditorStore } from '../../stores/editorStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useFileStore } from '../../stores/fileStore';
import { usePreviewStore } from '../../stores/previewStore';
import { useAppStore } from '../../stores/appStore';
import { parse } from '../../../lib/parser';
import { render, RenderResultWithMeta } from '../../../lib/renderer';
import { useImageDrop, getFileDir } from '../../hooks/useImageDrop';
import { validateImagePath } from '../../hooks/useImageDrop';
import { feedback } from '../../stores/feedbackStore';
import { hexToRgba } from '../../../shared/utils/preview-utils';
import { getLineCoordinates } from '../../../shared/utils/line-coordinate-utils';
import './SolarWirePreview.css';
import CanvasRuler from './CanvasRuler';

import type { SelectionTool } from '../../stores/solarWireStore';

import { useCanvasViewport } from './hooks/useCanvasViewport';
import { useElementBounds, getElementIdFromSVGElement } from './hooks/useElementBounds';
import { useElementInteraction } from './hooks/useElementInteraction';
import { useDropHandler } from './hooks/useDropHandler';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import SelectionOverlay from './overlays/SelectionOverlay';
import DragPreviewOverlay from './overlays/DragPreviewOverlay';
import SnapOverlay from './overlays/SnapOverlay';

interface SolarWirePreviewProps {
  selectionTool: SelectionTool;
  showNotes?: boolean;
  isPanMode?: boolean;
  isSpacePressed?: boolean;
  snapToGuides?: boolean;
  showGridProp?: boolean;
  snapToGridProp?: boolean;
  gridSizeProp?: number;
  externalContent?: string;
  onExternalContentChange?: (code: string) => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  allowImageElements?: boolean;
  onRequestExportSvg?: (getSvgContent: () => string | null) => void;
  hasSyntaxErrors?: boolean;
}

function SolarWirePreview({ selectionTool, showNotes = true, isPanMode = false, isSpacePressed = false, snapToGuides = true, showGridProp = false, snapToGridProp = false, gridSizeProp = 20, externalContent, onExternalContentChange, onContextMenu, allowImageElements = true, onRequestExportSvg, hasSyntaxErrors = false }: SolarWirePreviewProps): React.ReactElement {
  const selectedElements = useSolarWireStore(s => s.selectedElements);
  const selectElements = useSolarWireStore(s => s.selectElements);
  const { content, setContent } = useEditorStore();
  const { currentPath, selectedFile } = useFileStore();
  const fileDir = getFileDir(selectedFile?.path, currentPath);
  const { primaryColor } = useSettingsStore();
  const { theme } = useAppStore();

  const {
    scale, setScale, position, setPosition,
    isInitialized, setIsInitialized,
    boxSelection, dragPreviewElement,
    hoveredElement, setHoveredElement,
    alignmentGuides, distanceLines,
  } = usePreviewStore();

  const [parseError, setParseError] = useState<string | null>(null);
  const prevErrorRef = useRef<string | null>(null);

  const isExternalMode = externalContent !== undefined;
  const effectiveContent = isExternalMode ? externalContent : content;
  const effectiveSetContent = isExternalMode ? (onExternalContentChange || (() => {})) : setContent;

  const svgContainerRef = useRef<HTMLDivElement>(null);
  const imageCacheRef = useRef<Record<string, string>>({});
  const loadingUrlsRef = useRef<Set<string>>(new Set());
  const [imageCacheTick, setImageCacheTick] = useState(0);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  const imageUrlResolver = useCallback((url: string): string => {
    if (url && !url.startsWith('http') && !url.startsWith('data:') && fileDir) {
      return imageCacheRef.current[url] || '';
    }
    return url;
  }, [fileDir, imageCacheTick]);

  const ast = useMemo(() => {
    try {
      const safeContent = effectiveContent || '';
      if (!safeContent.trim()) {
        return null;
      }
      return parse(safeContent);
    } catch {
      return null;
    }
  }, [effectiveContent]);

  const svg = useMemo(() => {
    if (!ast) return '';
    try {
      const renderedResult = render(ast, {
        disableNotes: !showNotes,
        selectedElementIds: selectedElements,
        primaryColor,
        sourceInput: effectiveContent || '',
        imageUrlResolver,
      }, true) as RenderResultWithMeta;
      return renderedResult.svg;
    } catch {
      return '';
    }
  }, [ast, showNotes, selectedElements, primaryColor, effectiveContent, imageUrlResolver]);

  const viewBox = useMemo(() => {
    if (!ast) return null;
    try {
      const renderedResult = render(ast, {
        disableNotes: !showNotes,
        selectedElementIds: selectedElements,
        primaryColor,
        sourceInput: effectiveContent || '',
        imageUrlResolver,
      }, true) as RenderResultWithMeta;
      return renderedResult.viewBox;
    } catch {
      return null;
    }
  }, [ast, showNotes, selectedElements, primaryColor, effectiveContent, imageUrlResolver]);

  const renderParseError = useMemo(() => {
    if (!effectiveContent?.trim()) return null;
    try {
      parse(effectiveContent);
      return null;
    } catch (e: any) {
      return e.message || String(e);
    }
  }, [effectiveContent]);

  const { viewport, getSvgCoords, getTransform, containerRef } = useCoordinateSystem({
    position,
    scale,
    viewBoxOffset: { x: viewBox?.x || 0, y: viewBox?.y || 0 }
  });

  const handleImageAdded = useCallback((assetPath: string, x: number, y: number, size?: { width: number; height: number }) => {
    if (!validateImagePath(assetPath)) {
      feedback.toast.error('Invalid image path');
      return;
    }

    const svgCoords = getSvgCoords(x, y);
    const imagePath = assetPath;
    const safeX = Math.round(svgCoords.x);
    const safeY = Math.round(svgCoords.y);
    const { w, h } = calculateImageSize(size);
    const attrStr = h ? `w=${w} h=${h}` : `w=${w}`;
    const imageElement = `<${imagePath}> @(${safeX}, ${safeY}) ${attrStr}`;
    const newContent = effectiveContent ? `${effectiveContent}\n${imageElement}` : imageElement;
    effectiveSetContent(newContent);
  }, [effectiveContent, effectiveSetContent, getSvgCoords]);

  const { handleDragOver: handleImageDragOver, handleDrop: handleImageDrop } = useImageDrop({
    onImageAdded: handleImageAdded,
    fileDir: fileDir || '',
    enablePaste: true,
  });

  useEffect(() => {
    if (renderParseError) {
      setTimeout(() => {
        console.error('[SolarWirePreview] Parse/Render error:', renderParseError);
      }, 0);
    }
  }, [renderParseError]);

  useEffect(() => {
    const errorFromAst = (ast as any)?.parseError || null;
    if (prevErrorRef.current !== errorFromAst) {
      prevErrorRef.current = errorFromAst;
      setParseError(errorFromAst);
    }
  }, [ast]);

  useEffect(() => {
    if (!ast || !fileDir) {
      imageCacheRef.current = {};
      setImageCacheTick(t => t + 1);
      return;
    }

    const currentImageUrls = new Set<string>();
    ast.elements.forEach(el => {
      if (el.type === 'image' && (el as any).url) {
        const url = (el as any).url;
        if (url && !url.startsWith('http') && !url.startsWith('data:')) {
          currentImageUrls.add(url);
        }
      }
    });

    Object.keys(imageCacheRef.current).forEach(cachedUrl => {
      if (!currentImageUrls.has(cachedUrl)) {
        delete imageCacheRef.current[cachedUrl];
      }
    });

    const imageUrls: string[] = [];
    currentImageUrls.forEach(url => {
      if (!imageCacheRef.current[url] && !loadingUrlsRef.current.has(url)) {
        imageUrls.push(url);
      }
    });

    if (imageUrls.length === 0) return;

    const loadImages = async () => {
      const api = (window as any).api;
      if (!api || !api.readImageAsBase64 || !fileDir) return;

      for (const url of imageUrls) {
        if (loadingUrlsRef.current.has(url)) continue;
        loadingUrlsRef.current.add(url);

        try {
          const fullPath = `${fileDir}/${url}`;
          const base64 = await api.readImageAsBase64(fullPath);
          if (base64) {
            imageCacheRef.current[url] = base64;
          }
        } catch (e) {
          console.warn(`Failed to load image: ${url}`, e);
        } finally {
          loadingUrlsRef.current.delete(url);
        }
      }

      setImageCacheTick(t => t + 1);
    };

    loadImages();
  }, [ast, fileDir]);

  useEffect(() => {
    if (!isInitialized) {
      setScale(1);
    }
  }, [isInitialized]);

  useEffect(() => {
    if (onRequestExportSvg) {
      onRequestExportSvg(() => svg);
    }
  }, [onRequestExportSvg, svg]);

  useCanvasViewport({
    containerRef,
    isInitialized,
    setIsInitialized,
    svg,
    onContainerResize: setContainerSize,
  });

  const elementBounds = useElementBounds({
    ast,
    effectiveContent,
    selectionTool,
  });

  const {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    lastMousePosition,
  } = useElementInteraction({
    ast,
    getSvgCoords,
    selectionTool,
    isPanMode,
    isSpacePressed,
    snapToGuides,
    effectiveContent,
    effectiveSetContent,
    allowImageElements,
    containerRef,
    getElementData: elementBounds.getElementData,
    getElementBounds: elementBounds.getElementBounds,
    getAllElementsBoundsMap: elementBounds.getAllElementsBoundsMap,
    getGroupBounds: elementBounds.getGroupBounds,
    findElementAtPosition: elementBounds.findElementAtPosition,
    testBoxSelection: elementBounds.testBoxSelection,
  });

  const {
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
    handleDragOverCombined,
  } = useDropHandler({
    getSvgCoords,
    effectiveContent,
    effectiveSetContent,
    allowImageElements,
    fileDir,
    currentPath,
    selectedFile: selectedFile ?? undefined,
    imageCacheRef,
    setImageCacheTick,
    handleImageAdded,
    handleImageDragOver,
  });

  useKeyboardShortcuts({
    containerRef,
    effectiveContent,
    effectiveSetContent,
    fileDir,
    lastMousePosition,
  });

  const setIsPreviewFocused = useSolarWireStore(s => s.setIsPreviewFocused);
  const cursor = isSpacePressed ? 'grab' : undefined;

  const renderError = () => {
    if (!parseError) return null;

    return (
      <div className="error-overlay">
        <div className="error-content">
          <div className="error-title">⚠️ Parse Error</div>
          <pre className="error-message">{parseError}</pre>
        </div>
      </div>
    );
  };

  const renderEmpty = () => {
    if (parseError || svg || hasSyntaxErrors) return null;

    return (
      <div className="empty-overlay">
        <div className="empty-content">
          <div className="empty-icon">📝</div>
          <div className="empty-text">Drag elements here or write SolarWire code</div>
        </div>
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className={`solarwire-preview ${isSpacePressed ? 'pan-mode' : ''}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => {
        setHoveredElement(null);
        handleMouseUp({} as React.MouseEvent);
      }}
      onFocus={() => setIsPreviewFocused(true)}
      onBlur={() => setIsPreviewFocused(false)}
      onDragOver={handleDragOverCombined}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onContextMenu={(e) => {
        e.stopPropagation();
        if (selectedElements.length > 0) {
          selectElements([]);
        }
        if (onContextMenu) {
          onContextMenu(e);
        }
      }}
      style={{
        cursor,
        userSelect: 'none',
        outline: 'none'
      }}
      tabIndex={0}
    >
      {svg && containerSize.width > 0 && containerSize.height > 0 && (
        <CanvasRuler
          position={position}
          scale={scale}
          viewBoxOffset={{ x: viewBox?.x || 0, y: viewBox?.y || 0 }}
          width={containerSize.width}
          height={containerSize.height}
          theme={theme}
        />
      )}

      {svg && (
        <div
          ref={svgContainerRef}
          className="svg-container"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            transform: getTransform(),
            transformOrigin: '0 0',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            MozUserSelect: 'none',
            msUserSelect: 'none'
          }}
          dangerouslySetInnerHTML={{ __html: svg }}
          onSelect={(e) => e.preventDefault()}
        />
      )}

      {svg && (
        <div
          className="interaction-layer-wrapper"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            transform: getTransform(),
            transformOrigin: '0 0'
          }}
        >
          <svg
            className="interaction-layer"
            viewBox={viewBox ? `${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}` : "0 0 100000 100000"}
            width={viewBox?.width || 100000}
            height={viewBox?.height || 100000}
            style={{
              overflow: 'visible'
            }}
          >
            <g style={{ pointerEvents: 'auto' }}>
              <SelectionOverlay
                boxSelection={boxSelection}
                hoveredElement={hoveredElement}
                selectedElements={selectedElements}
                scale={scale}
                primaryColor={primaryColor}
                getSvgCoords={getSvgCoords}
                getElementData={elementBounds.getElementData}
                getElementBounds={elementBounds.getElementBounds}
                getLineCoordinates={getLineCoordinates}
                hexToRgba={hexToRgba}
              />
              <DragPreviewOverlay
                dragPreviewElement={dragPreviewElement}
                scale={scale}
                primaryColor={primaryColor}
                hexToRgba={hexToRgba}
              />
              <SnapOverlay
                alignmentGuides={alignmentGuides}
                distanceLines={distanceLines}
                selectedElements={selectedElements}
                effectiveContent={effectiveContent}
                viewBox={viewBox}
                scale={scale}
                primaryColor={primaryColor}
                getElementData={elementBounds.getElementData}
                getElementBounds={elementBounds.getElementBounds}
                getLineCoordinates={getLineCoordinates}
              />
            </g>
          </svg>
        </div>
      )}

      {renderError()}
      {renderEmpty()}
    </div>
  );
}

export default SolarWirePreview;
