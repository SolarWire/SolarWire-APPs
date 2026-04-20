import React, { useMemo } from 'react';
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

function LayerPanel({ onSelectElement }: LayerPanelProps): React.ReactElement {
  const { content } = useEditorStore();
  const { selectedElements, selectElements } = useSolarWireStore();

  const layers = useMemo(() => {
    if (!content?.trim()) return [];

    try {
      const ast = parse(content);
      return ast.elements.map((el: SolarWireElement, index: number) => {
        const id = el.location?.line?.toString() || (index + 1).toString();
        const type = el.type as string;
        const isSelected = selectedElements.includes(id);
        
        let label = ELEMENT_NAMES[type] || type;
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
            className={`layer-item ${layer.isSelected ? 'selected' : ''}`}
            onClick={(e) => handleLayerClick(layer.id, e)}
          >
            <span className="layer-icon">{ELEMENT_ICONS[layer.type] || '?'}</span>
            <span className="layer-label" title={layer.label}>
              {layer.label}
            </span>
            <span className="layer-line">L{layer.lineNum}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default LayerPanel;
