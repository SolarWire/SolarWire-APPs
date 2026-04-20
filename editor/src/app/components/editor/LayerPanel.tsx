import React, { useMemo, useState, useRef, useCallback } from 'react';
import { useEditorStore } from '../../stores/editorStore';
import { useSolarWireStore } from '../../stores/solarWireStore';
import { parse } from '../../../lib/parser';
import type { Element as SolarWireElement } from '../../../lib/parser/types';
import './LayerPanel.css';

interface LayerPanelProps {
  onSelectElement: (elementId: string) => void;
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

function LayerPanel({ onSelectElement }: LayerPanelProps): React.ReactElement {
  const { content } = useEditorStore();
  const { selectedElements, selectElements } = useSolarWireStore();
  const [hoveredLayerId, setHoveredLayerId] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ left: number; top: number } | null>(null);
  const [hoveredNote, setHoveredNote] = useState<NoteInfo | null>(null);
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);

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
        
        if ('note' in el && el.note) {
          noteCounter++;
          let noteContent = el.note as string;
          if (noteContent.startsWith('"""') && noteContent.endsWith('"""')) {
            noteContent = noteContent.slice(3, -3);
          } else if (noteContent.startsWith('"') && noteContent.endsWith('"')) {
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
    if (e.shiftKey) {
      if (selectedElements.includes(id)) {
        selectElements(selectedElements.filter((elId) => elId !== id));
      } else {
        selectElements([...selectedElements, id]);
      }
    } else {
      selectElements([id]);
    }
    onSelectElement(id);
  };

  const handleMouseEnter = useCallback((layer: any, element: HTMLDivElement) => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
    }

    hoverTimerRef.current = setTimeout(() => {
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

        const tooltipHeight = 200;
        if (top + tooltipHeight > window.innerHeight) {
          top = Math.max(0, window.innerHeight - tooltipHeight - padding);
        }

        setHoveredNote(layer.note);
        setTooltipPosition({ left, top });
        setHoveredLayerId(layer.id);
      }
    }, 300);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    setHoveredLayerId(null);
    setHoveredNote(null);
    setTooltipPosition(null);
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
      <div className="layer-list">
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
            className={`layer-item ${layer.isSelected ? 'selected' : ''}`}
            onClick={(e) => handleLayerClick(layer.id, e)}
            onMouseEnter={() => {
              const element = itemRefs.current.get(layer.id);
              if (element) {
                handleMouseEnter(layer, element);
              }
            }}
            onMouseLeave={handleMouseLeave}
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
          className="layer-tooltip"
          style={{ left: tooltipPosition.left, top: tooltipPosition.top }}
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
          <div className="layer-tooltip-content">
            {hoveredNote.content}
          </div>
        </div>
      )}
    </div>
  );
}

export default LayerPanel;
