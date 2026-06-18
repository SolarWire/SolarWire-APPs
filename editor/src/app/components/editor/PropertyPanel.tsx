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
import { useMultiElementProps } from './hooks/useMultiElementProps';
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

  const elements = useMemo(() => {
    if (selectedElements.length === 0) return [];
    return selectedElements.map(elementId => {
      return ast?.elements.find((el, index) => {
        const id = (el as Element & { id?: string }).id || el.location?.line?.toString() || (index + 1).toString();
        return id === elementId;
      });
    }).filter(Boolean) as Element[];
  }, [ast, selectedElements]);

  const element = elements.length === 1 ? elements[0] : null;

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

  /**
   * 多选批量更新：倒序遍历选中元素（按行号降序），
   * 避免 note 等多行属性 splice 导致后续元素行号偏移。
   */
  const handleBatchChange = useCallback((property: string, value: string | number | boolean | undefined) => {
    if (elements.length === 0) return;
    const sortedElements = [...elements].sort((a, b) =>
      (b.location?.line || 0) - (a.location?.line || 0)
    );
    let newContent = latestContentRef.current;
    for (const el of sortedElements) {
      const lineNum = el.location?.line;
      if (!lineNum) continue;
      if (value === undefined) {
        newContent = deleteLineAttribute(newContent, lineNum, property);
      } else {
        newContent = updateLineAttribute(newContent, lineNum, property, value);
      }
    }
    latestContentRef.current = newContent;
    effectiveSetContent(newContent);
  }, [elements, effectiveSetContent]);

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
  const multiElementProps = useMultiElementProps({ elements: elements.length > 1 ? elements : [] });

  const lineMatch = parseError ? parseError.match(/line (\d+)/) : null;
  const errorLine = lineMatch ? parseInt(lineMatch[1]) : null;

  if (parseError) {
    return (
      <div className="property-panel glass-panel">
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
      <div className="property-panel glass-panel">
        <p className="empty-state">未选中元素</p>
      </div>
    );
  }

  if (selectedElements.length > 1) {
    if (!multiElementProps) {
      return (
        <div className="property-panel glass-panel">
          <p className="empty-state">未找到元素</p>
        </div>
      );
    }
    const { props: multiProps, mixedFields } = multiElementProps;
    const { type, size, appearance, line } = multiProps;
    return (
      <div className="property-panel glass-panel">
        <div className="property-panel-header">
          <span className="property-panel-type">{selectedElements.length} 个元素已选中</span>
        </div>

        {/* 多选时不渲染 PositionGroup（按决策）*/}

        {size.show && (
          <SizeGroup size={size} onChange={handleBatchChange} mixedFields={mixedFields} />
        )}

        {size.showPadding && (
          <PropertyGroupTitle title="边距">
            <PaddingEditor
              paddingTop={multiProps.text.paddingTop}
              paddingRight={multiProps.text.paddingRight}
              paddingBottom={multiProps.text.paddingBottom}
              paddingLeft={multiProps.text.paddingLeft}
              onChange={handleBatchChange}
              mixedFields={mixedFields}
            />
          </PropertyGroupTitle>
        )}

        {line ? (
          <LineGroup line={line} appearance={appearance} onChange={handleBatchChange} mixedFields={mixedFields} />
        ) : (appearance.showFill || appearance.showBorder) ? (
          <AppearanceGroup type={type} appearance={appearance} onChange={handleBatchChange} mixedFields={mixedFields} />
        ) : null}

        {appearance.showShadow && (
          <PropertyGroupTitle title="阴影" defaultCollapsed={true}>
            <ShadowEditor attrs={multiProps.attrs} onChange={handleBatchChange} mixedFields={mixedFields} />
          </PropertyGroupTitle>
        )}

        {/* 多选时渲染文字格式属性（隐藏文本内容），不渲染 NoteGroup */}
        <TextGroup text={multiProps.text} appearance={appearance} type={type} onChange={handleBatchChange} multiSelect mixedFields={mixedFields} />
      </div>
    );
  }

  if (!element || !elementProps) {
    return (
      <div className="property-panel glass-panel">
        <p className="empty-state">未找到元素</p>
      </div>
    );
  }

  const { type, attrs, position, size, appearance, text, line, table, image, note } = elementProps;

  return (
    <div className="property-panel glass-panel">
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
