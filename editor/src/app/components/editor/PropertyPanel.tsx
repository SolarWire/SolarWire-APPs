import React, { useMemo, useCallback, useRef, useEffect } from 'react';
import { useSolarWireStore } from '../../stores/solarWireStore';
import { useEditorStore } from '../../stores/editorStore';
import { useAppStore } from '../../stores/appStore';
import { parse } from '../../../lib/parser';
import { updateLineAttribute, deleteLineAttribute } from '../../../shared/utils/solarwire-utils';
import type { Element } from '../../../lib/parser/types';
import PropertyGroupTitle from './property/PropertyGroupTitle';
import ShadowEditor from './property/ShadowEditor';
import PositionGroup from './property/PositionGroup';
import SizeGroup from './property/SizeGroup';
import PaddingEditor from './property/PaddingEditor';
import LineGroup from './property/LineGroup';
import AppearanceGroup from './property/AppearanceGroup';
import TextGroup from './property/TextGroup';
import TableGroup from './property/TableGroup';
import ImageGroup from './property/ImageGroup';
import NoteGroup from './property/NoteGroup';
import { fileDialogService, IFileDialogService } from '../../services/file-dialog-service';
import { useElementProps } from './hooks/useElementProps';
import type { ElementProps } from './hooks/useElementProps';
import './PropertyPanel.css';

interface PropertyPanelProps {
  externalContent?: string;
  onExternalContentChange?: (content: string) => void;
  fileDialogService?: IFileDialogService;
  onErrorLineClick?: (line: number) => void;
  onOpenTableEditor?: (tableLine: number) => void;
}

function PropertyPanel({ externalContent, onExternalContentChange, fileDialogService: dialogService = fileDialogService, onErrorLineClick, onOpenTableEditor }: PropertyPanelProps): React.JSX.Element {
  const selectedElements = useSolarWireStore(s => s.selectedElements);
  const { content, setContent } = useEditorStore();
  const { theme } = useAppStore();

  const isExternalMode = externalContent !== undefined;

  const safeContent = useMemo(() => {
    if (isExternalMode && externalContent) return externalContent;
    return content || '';
  }, [isExternalMode, externalContent, content]);
  const effectiveContent = isExternalMode ? externalContent : content;
  const effectiveSetContent = isExternalMode ? (c: string) => onExternalContentChange?.(c) : setContent;

  const latestContentRef = useRef(safeContent);
  useEffect(() => {
    latestContentRef.current = safeContent;
  }, [safeContent]);

  const [parseError, setParseError] = React.useState<string | null>(null);

  const ast = useMemo(() => {
    try {
      setParseError(null);
      return parse(safeContent || '');
    } catch (e) {
      setParseError(e instanceof Error ? e.message : String(e));
      return null;
    }
  }, [safeContent]);

  const element = useMemo(() => {
    if (selectedElements.length !== 1) return null;
    const elementId = selectedElements[0];
    return ast?.elements.find((el, index) => {
      const id = (el as Element & { id?: string }).id || el.location?.line?.toString() || (index + 1).toString();
      return id === elementId;
    });
  }, [ast, selectedElements]);

  const handleChange = useCallback((property: string, value: string | number | boolean | undefined) => {
    if (!element) return;
    const lineNum = element.location?.line;
    if (!lineNum) return;
    const currentContent = latestContentRef.current;
    if (value === undefined) {
      const newContent = deleteLineAttribute(currentContent, lineNum, property);
      latestContentRef.current = newContent;
      effectiveSetContent(newContent);
    } else {
      const newContent = updateLineAttribute(currentContent, lineNum, property, value);
      latestContentRef.current = newContent;
      effectiveSetContent(newContent);
    }
  }, [element, effectiveSetContent]);

  const handleGoToError = useCallback(() => {
    if (parseError) {
      const lineMatch = parseError.match(/line (\d+)/);
      const errorLine = lineMatch ? parseInt(lineMatch[1]) : null;
      if (errorLine && onErrorLineClick) {
        onErrorLineClick(errorLine);
      }
    }
  }, [parseError, onErrorLineClick]);

  const elementProps = useElementProps({ element });

  const lineMatch = parseError ? parseError.match(/line (\d+)/) : null;
  const errorLine = lineMatch ? parseInt(lineMatch[1]) : null;

  if (parseError) {
    return (
      <div className="property-panel">
        <div className="error-section">
          <h3>错误</h3>
          <div className="error-message">
            <pre>{parseError}</pre>
          </div>
          {errorLine && (
            <button className="error-button" onClick={handleGoToError}>
              跳转到错误行
            </button>
          )}
        </div>
      </div>
    );
  }

  if (selectedElements.length === 0) {
    return (
      <div className="property-panel">
        <p className="empty-state">未选中元素</p>
      </div>
    );
  }

  if (selectedElements.length > 1) {
    return (
      <div className="property-panel">
        <div className="property-panel-header">
          <span className="property-panel-type">{selectedElements.length} 个元素已选中</span>
        </div>
        <p className="multi-select-hint">请选择单个元素以编辑其属性。</p>
      </div>
    );
  }

  if (!element || !elementProps) {
    return (
      <div className="property-panel">
        <p className="empty-state">未找到元素</p>
      </div>
    );
  }

  const { type, attrs, position, size, appearance, text, line, table, image, note } = elementProps;

  return (
    <div className="property-panel">
      <div className="property-panel-header">
        <span className="property-panel-type">{type}</span>
      </div>

      <PositionGroup position={position} onChange={handleChange} />
      <SizeGroup size={size} onChange={handleChange} />

      {size.showPadding && (
        <PropertyGroupTitle title="边距">
          <PaddingEditor
            paddingTop={text.paddingTop}
            paddingRight={text.paddingRight}
            paddingBottom={text.paddingBottom}
            paddingLeft={text.paddingLeft}
            onChange={handleChange}
          />
        </PropertyGroupTitle>
      )}

      {line ? (
        <LineGroup line={line} appearance={appearance} onChange={handleChange} />
      ) : !table && (appearance.showFill || appearance.showBorder) ? (
        <AppearanceGroup type={type} appearance={appearance} onChange={handleChange} />
      ) : null}

      {appearance.showShadow && (
        <PropertyGroupTitle title="阴影" defaultCollapsed={true}>
          <ShadowEditor attrs={attrs} onChange={handleChange} />
        </PropertyGroupTitle>
      )}

      <TextGroup element={element} text={text} appearance={appearance} type={type} onChange={handleChange} />

      {table && (
        <TableGroup table={table} onOpenTableEditor={onOpenTableEditor || (() => {})} tableLine={element.location?.line} />
      )}

      {image && (
        <ImageGroup image={image} onChange={handleChange} fileDialogService={dialogService} />
      )}

      <NoteGroup value={note} onChange={handleChange} />
    </div>
  );
}

export default PropertyPanel;
