import React, { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import { useEditorStore } from '../../stores/editorStore';
import { useSolarWireStore } from '../../stores/solarWireStore';
import { parse } from '../../../lib/parser';
import type { Element as SolarWireElement } from '../../../lib/parser/types';
import { detectNoteBounds, detectTableBounds } from '../../../shared/utils/solarwire-utils';
import './LayerPanel.css';

interface LayerPanelProps {
  onSelectElement: (elementId: string) => void;
  onReorderElements?: (reorderedIds: string[]) => void;
}

const ELEMENT_ICONS: Record<string, string> = {
  rectangle: '▭',
  'rounded-rectangle': '▢',
  circle: '○',
  text: 'T',
  line: '╱',
  image: '🖼',
  placeholder: '□',
  table: '⊞',
};

const ELEMENT_NAMES: Record<string, string> = {
  rectangle: 'Rectangle',
  'rounded-rectangle': 'Rounded',
  circle: 'Circle',
  text: 'Text',
  line: 'Line',
  image: 'Image',
  placeholder: 'Placeholder',
  table: 'Table',
};

interface NoteInfo {
  number: number;
  content: string;
  color: string;
}

function LayerPanel({ onSelectElement, onReorderElements }: LayerPanelProps): React.ReactElement {
  const { content } = useEditorStore();
  const { selectedElements, selectElements } = useSolarWireStore();
  const [tooltipPosition, setTooltipPosition] = useState<{ left: number; top: number } | null>(null);
  const [hoveredNote, setHoveredNote] = useState<NoteInfo | null>(null);
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);
  const leaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isTooltipHoveredRef = useRef(false);
  const isLayerHoveredRef = useRef(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const layers = useMemo(() => {
    if (!content?.trim()) return [];

    try {
      const ast = parse(content);
      let noteCounter = 0;
      
      return ast.elements.map((el: SolarWireElement, index: number) => {
        const id = el.location?.line?.toString() || (index + 1).toString();
        const type = el.type as string;
        const isSelected = selectedElements.includes(id);
        
        let label = ELEMENT_NAMES[type] || type;
        let noteInfo: NoteInfo | null = null;
        
        const attrs = (el as any).attributes || {};
        const rawNote = attrs.note;
        if (rawNote) {
          noteCounter++;
          let noteContent = rawNote as string;
          if (noteContent.startsWith('"""') && noteContent.endsWith('"""')) {
            noteContent = noteContent.slice(3, -3);
          } else if (noteContent.startsWith('"') && noteContent.endsWith('"')) {
            noteContent = noteContent.slice(1, -1);
          } else if (noteContent.startsWith("'") && noteContent.endsWith("'")) {
            noteContent = noteContent.slice(1, -1);
          }
          noteContent = noteContent.replace(/\\n/g, '\n').replace(/\\"/g, '"');
          noteInfo = {
            number: noteCounter,
            content: noteContent,
            color: '#70B603',
          };
        }
        
        if (type === 'text' && 'text' in el) {
          label = (el as any).text?.substring(0, 20) || 'Text';
        } else if (type === 'image' && 'url' in el) {
          const url = (el as any).url || '';
          const fileName = url.split('/').pop() || url;
          label = fileName.substring(0, 20) || 'Image';
        }

        return {
          id,
          type,
          label,
          isSelected,
          lineNum: parseInt(id),
          note: noteInfo,
        };
      });
    } catch {
      return [];
    }
  }, [content, selectedElements]);

  const handleLayerClick = (id: string, e: React.MouseEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      if (selectedElements.includes(id)) {
        selectElements(selectedElements.filter((elId) => elId !== id));
      } else {
        selectElements([...selectedElements, id]);
      }
    } else if (e.shiftKey) {
      e.preventDefault();
      const currentIndex = layers.findIndex(l => l.id === id);
      if (selectedElements.length > 0) {
        const firstSelectedIndex = layers.findIndex(l => l.id === selectedElements[0]);
        const lastSelectedIndex = layers.findIndex(l => l.id === selectedElements[selectedElements.length - 1]);
        const startIdx = Math.min(firstSelectedIndex, lastSelectedIndex, currentIndex);
        const endIdx = Math.max(firstSelectedIndex, lastSelectedIndex, currentIndex);
        const rangeIds = layers.slice(startIdx, endIdx + 1).map(l => l.id);
        selectElements(rangeIds);
      } else {
        selectElements([id]);
        onSelectElement(id);
      }
    } else {
      selectElements([id]);
      onSelectElement(id);
    }
  };

  const hideTooltip = useCallback(() => {
    setHoveredNote(null);
    setTooltipPosition(null);
  }, []);

  const scheduleHide = useCallback(() => {
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
    }
    leaveTimerRef.current = setTimeout(() => {
      if (!isTooltipHoveredRef.current && !isLayerHoveredRef.current) {
        hideTooltip();
      }
    }, 400);
  }, [hideTooltip]);

  const cancelHide = useCallback(() => {
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
  }, []);

  const handleLayerMouseEnter = useCallback((layer: any, element: HTMLDivElement) => {
    isLayerHoveredRef.current = true;
    cancelHide();

    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }

    if (layer.note) {
      const rect = element.getBoundingClientRect();
      const padding = 12;
      let left = rect.right + padding;
      let top = rect.top;

      const tooltipMinWidth = 300;
      if (left + tooltipMinWidth > window.innerWidth) {
        left = rect.left - tooltipMinWidth - padding;
        if (left < 0) {
          left = rect.left;
          top = rect.bottom + padding;
        }
      }

      setHoveredNote(layer.note);
      setTooltipPosition({ left, top });
    }
  }, [cancelHide]);

  const handleLayerMouseLeave = useCallback(() => {
    isLayerHoveredRef.current = false;
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    scheduleHide();
  }, [scheduleHide]);

  const handleTooltipMouseEnter = useCallback(() => {
    isTooltipHoveredRef.current = true;
    cancelHide();
  }, [cancelHide]);

  const handleTooltipMouseLeave = useCallback(() => {
    isTooltipHoveredRef.current = false;
    scheduleHide();
  }, [scheduleHide]);

  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
      if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
    };
  }, []);

  const handleDragStart = useCallback((e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedId(id);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverId(id);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverId(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    setDragOverId(null);
    setDraggedId(null);

    const draggedId = e.dataTransfer.getData('text/plain');
    if (!draggedId || draggedId === targetId) return;

    const draggedIndex = layers.findIndex(l => l.id === draggedId);
    const targetIndex = layers.findIndex(l => l.id === targetId);
    if (draggedIndex === -1 || targetIndex === -1) return;

    const elementsToMove = selectedElements.length > 1 && selectedElements.includes(draggedId)
      ? selectedElements
      : [draggedId];

    const idsToMove = new Set(elementsToMove);
    const remaining = layers.filter(l => !idsToMove.has(l.id)).map(l => l.id);
    
    const targetIndexInRemaining = remaining.findIndex(id => id === targetId);
    const finalIndex = targetIndexInRemaining >= 0 ? targetIndexInRemaining : remaining.length;
    
    remaining.splice(finalIndex, 0, ...elementsToMove);

    if (onReorderElements) {
      onReorderElements(remaining);
    }
  }, [layers, selectedElements, onReorderElements]);

  const handleDragEnd = useCallback(() => {
    setDraggedId(null);
    setDragOverId(null);
  }, []);

  if (layers.length === 0) {
    return (
      <div className="layer-panel">
        <div className="layer-panel-header">Layers</div>
        <div className="layer-panel-empty">No elements yet</div>
      </div>
    );
  }

  return (
    <div className="layer-panel">
      <div className="layer-panel-header">
        <span>Layers</span>
        <span className="layer-count">{layers.length}</span>
      </div>
      <div className="layer-list scrollbar">
        {layers.map((layer) => (
          <div
            key={layer.id}
            ref={(el) => {
              if (el) {
                itemRefs.current.set(layer.id, el);
              } else {
                itemRefs.current.delete(layer.id);
              }
            }}
            className={`layer-item ${layer.isSelected ? 'selected' : ''} ${dragOverId === layer.id ? 'drag-over' : ''}`}
            onClick={(e) => handleLayerClick(layer.id, e)}
            onMouseEnter={() => {
              const element = itemRefs.current.get(layer.id);
              if (element) {
                handleLayerMouseEnter(layer, element);
              }
            }}
            onMouseLeave={handleLayerMouseLeave}
            draggable
            onDragStart={(e) => handleDragStart(e, layer.id)}
            onDragOver={(e) => handleDragOver(e, layer.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, layer.id)}
            onDragEnd={handleDragEnd}
          >
            <span className="layer-icon">{ELEMENT_ICONS[layer.type] || '?'}</span>
            <span className="layer-label" title={layer.label}>
              {layer.label}
            </span>
            {layer.note && (
              <span 
                className="layer-note-badge" 
                style={{ backgroundColor: layer.note.color }}
                title={`Note #${layer.note.number}`}
              >
                {layer.note.number}
              </span>
            )}
            <span className="layer-line">L{layer.lineNum}</span>
          </div>
        ))}
      </div>

      {hoveredNote && tooltipPosition && (
        <div
          ref={tooltipRef}
          className="layer-tooltip"
          style={{ left: tooltipPosition.left, top: tooltipPosition.top }}
          onMouseEnter={handleTooltipMouseEnter}
          onMouseLeave={handleTooltipMouseLeave}
        >
          <div className="layer-tooltip-header">
            <span 
              className="layer-tooltip-badge" 
              style={{ backgroundColor: hoveredNote.color }}
            >
              {hoveredNote.number}
            </span>
            <span className="layer-tooltip-title">Note</span>
          </div>
          <div className="layer-tooltip-content scrollbar">
            {hoveredNote.content}
          </div>
        </div>
      )}
    </div>
  );
}

export default LayerPanel;
