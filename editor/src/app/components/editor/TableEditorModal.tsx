import React, { useEffect, useCallback, useState } from 'react';
import TableGrid from './TableGrid';
import CellProperties from './CellProperties';
import { DraggableNumberInput } from './property/PropertyRow';
import ColorPicker from '../ui/ColorPicker';
import { useTableEditor } from '../../../shared/hooks/useTableEditor';
import './TableEditorModal.css';

interface TableEditorModalProps {
  isOpen: boolean;
  content: string;
  tableLine: number;
  onSave: (newContent: string) => void;
  onClose: () => void;
}

const TableEditorModal: React.FC<TableEditorModalProps> = ({
  isOpen,
  content,
  tableLine,
  onSave,
  onClose,
}) => {
  const [scale, setScale] = useState(1);

  const {
    tableData,
    selectedCells,
    editingCell,
    isDirty,
    updateCell,
    updateRow,
    updateTableAttrs,
    addRow,
    deleteRow,
    addColumn,
    deleteColumn,
    selectCell,
    startEditing,
    stopEditing,
    save,
    reset,
  } = useTableEditor(content, tableLine, onSave);

  const handleOverlayClick = useCallback(() => {
    if (isDirty) {
      if (window.confirm('有未保存的修改，确定要关闭吗？')) {
        onClose();
      }
    } else {
      onClose();
    }
  }, [isDirty, onClose]);

  const handleSave = useCallback(() => {
    save();
    onClose();
  }, [save, onClose]);

  const handleZoomIn = useCallback(() => {
    setScale(prev => Math.min(2, prev + 0.1));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale(prev => Math.max(0.3, prev - 0.1));
  }, []);

  const handleZoomReset = useCallback(() => {
    setScale(1);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleOverlayClick();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        setScale(prev => {
          const delta = e.deltaY > 0 ? -0.05 : 0.05;
          return Math.min(2, Math.max(0.3, prev + delta));
        });
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('wheel', handleWheel);
    };
  }, [isOpen, handleOverlayClick, handleSave]);

  if (!isOpen || !tableData) return null;

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">编辑表格</h2>
          <div className="modal-header-actions">
            <div className="zoom-controls">
              <button className="zoom-btn" onClick={handleZoomOut} title="缩小">−</button>
              <span className="zoom-value" onClick={handleZoomReset} title="点击重置缩放">{Math.round(scale * 100)}%</span>
              <button className="zoom-btn" onClick={handleZoomIn} title="放大">+</button>
            </div>
            {isDirty && <span className="dirty-indicator" title="有未保存的修改">●</span>}
            <button className="close-btn" onClick={handleOverlayClick}>×</button>
          </div>
        </div>

        <div className="modal-body">
          <div className="modal-main">
            <TableGrid
              tableData={tableData}
              selectedCells={selectedCells}
              editingCell={editingCell}
              onSelectCell={selectCell}
              onStartEditing={startEditing}
              onStopEditing={stopEditing}
              onUpdateCell={updateCell}
              onAddRow={addRow}
              onDeleteRow={deleteRow}
              onAddColumn={addColumn}
              onDeleteColumn={deleteColumn}
              scale={scale}
            />
          </div>

          <div className="modal-sidebar">
            <div className="sidebar-section">
              <h4 className="sidebar-section-title">表格属性</h4>
              <div className="sidebar-row">
                <ColorPicker
                  label="Fill"
                  codeAttr="bg"
                  value={tableData.attrs.bg || '#ffffff'}
                  onChange={(color) => updateTableAttrs({ bg: color })}
                />
              </div>
              <div className="sidebar-row">
                <ColorPicker
                  label="Border"
                  codeAttr="b"
                  value={tableData.attrs.b || '#333333'}
                  onChange={(color) => updateTableAttrs({ b: color })}
                />
              </div>
              <div className="sidebar-row two-col">
                <div className="mini-field">
                  <span className="mini-label">W</span>
                  <DraggableNumberInput
                    label=""
                    value={tableData.attrs.w || 600}
                    onChange={(v) => updateTableAttrs({ w: v })}
                  />
                </div>
                <div className="mini-field">
                  <span className="mini-label">H</span>
                  <DraggableNumberInput
                    label=""
                    value={tableData.attrs.h || 0}
                    onChange={(v) => updateTableAttrs({ h: v })}
                  />
                </div>
              </div>
              <div className="sidebar-row two-col">
                <div className="mini-field">
                  <span className="mini-label">Border</span>
                  <DraggableNumberInput
                    label=""
                    value={tableData.attrs.border || 1}
                    onChange={(v) => updateTableAttrs({ border: v })}
                  />
                </div>
                <div className="mini-field">
                  <span className="mini-label">CS</span>
                  <DraggableNumberInput
                    label=""
                    value={tableData.attrs.cellspacing || 0}
                    onChange={(v) => updateTableAttrs({ cellspacing: v })}
                  />
                </div>
              </div>
            </div>

            <div className="sidebar-divider" />

            <CellProperties
              tableData={tableData}
              selectedCells={selectedCells}
              onUpdateCell={updateCell}
              onUpdateRow={updateRow}
            />
          </div>
        </div>

        <div className="modal-footer">
          <button className="cancel-btn" onClick={handleOverlayClick}>取消</button>
          <button className="reset-btn" onClick={reset} disabled={!isDirty}>重置</button>
          <button className="save-btn" onClick={handleSave} disabled={!isDirty}>保存</button>
        </div>
      </div>
    </div>
  );
};

export default TableEditorModal;
