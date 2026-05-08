import React, { useEffect, useCallback, useState, useRef } from 'react';
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
  const modalContainerRef = useRef<HTMLDivElement>(null);

  const {
    tableData,
    selectedCells,
    editingCell,
    isDirty,
    updateCell,
    updateRow,
    resetRowAttrs,
    resetCellAttrs,
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
    const container = modalContainerRef.current;
    container?.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      container?.removeEventListener('wheel', handleWheel);
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
          <div className="modal-toolbar">
            <div className="toolbar-group">
              <span className="toolbar-group-label">表格</span>
              <div className="toolbar-field">
                <span className="toolbar-label">Fill</span>
                <ColorPicker value={tableData.attrs.bg || '#ffffff'} onChange={(color) => updateTableAttrs({ bg: color })} label="表格背景色" />
              </div>
              <div className="toolbar-field">
                <span className="toolbar-label">Border</span>
                <ColorPicker value={tableData.attrs.b || '#333333'} onChange={(color) => updateTableAttrs({ b: color })} label="表格边框色" />
              </div>
              <div className="toolbar-field">
                <span className="toolbar-label">W</span>
                <DraggableNumberInput label="" value={tableData.attrs.w || 600} onChange={(v) => updateTableAttrs({ w: v })} />
              </div>
              <div className="toolbar-field">
                <span className="toolbar-label">H</span>
                <DraggableNumberInput label="" value={tableData.attrs.h || 0} onChange={(v) => updateTableAttrs({ h: v })} />
              </div>
              <div className="toolbar-field">
                <span className="toolbar-label">Border</span>
                <DraggableNumberInput label="" value={tableData.attrs.border || 1} onChange={(v) => updateTableAttrs({ border: v })} />
              </div>
              <div className="toolbar-field">
                <span className="toolbar-label">CS</span>
                <DraggableNumberInput label="" value={tableData.attrs.cellspacing || 0} onChange={(v) => updateTableAttrs({ cellspacing: v })} />
              </div>
            </div>
            <div className="toolbar-group">
              <span className="toolbar-group-label">结构</span>
              <button className="toolbar-btn" onClick={() => addRow()}>+ 行</button>
              <button className="toolbar-btn" onClick={() => addColumn()}>+ 列</button>
              <button className="toolbar-btn danger" onClick={() => deleteRow(tableData.rows.length - 1)} disabled={tableData.rows.length <= 1}>- 行</button>
              <button className="toolbar-btn danger" onClick={() => deleteColumn(tableData.rows[0]?.cells.length - 1)} disabled={(tableData.rows[0]?.cells.length || 0) <= 1}>- 列</button>
            </div>
            <div className="toolbar-group">
              <span className="toolbar-info">{tableData.rows.length} 行 × {tableData.rows[0]?.cells.length || 0} 列</span>
              {isDirty && <span className="dirty-indicator" title="有未保存的修改">●</span>}
            </div>
          </div>

          <div className="modal-content-area">
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
              <CellProperties
                tableData={tableData}
                selectedCells={selectedCells}
                onUpdateCell={updateCell}
                onUpdateRow={updateRow}
                onResetRowAttrs={resetRowAttrs}
                onResetCellAttrs={resetCellAttrs}
              />
            </div>
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
