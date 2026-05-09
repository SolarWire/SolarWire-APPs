import React, { useEffect, useRef, useCallback } from 'react';
import { Workbook } from '@fortune-sheet/react';
import type { WorkbookInstance } from '@fortune-sheet/react';
import type { Sheet } from '@fortune-sheet/core';
import { useFileStore } from '../../stores/fileStore';
import { useEditorStore } from '../../stores/editorStore';
import { serializeTableFile } from '../../../shared/utils/table-file-adapters';
import { fileSystemService } from '../../services/file-system-service';
import '@fortune-sheet/react/dist/index.css';
import './TableMode.css';

const TableMode: React.FC = () => {
  const { selectedFile, tableSheetData, setTableSheetData } = useFileStore();
  const { setModified } = useEditorStore();
  const workbookRef = useRef<WorkbookInstance>(null);
  const isSavingRef = useRef(false);

  const handleChange = useCallback((data: Sheet[]) => {
    if (isSavingRef.current) return;
    setTableSheetData(data);
    setModified(true);
  }, [setTableSheetData, setModified]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        e.stopPropagation();

        if (!selectedFile || !tableSheetData) return;

        isSavingRef.current = true;
        try {
          const currentData = workbookRef.current?.getAllSheets() || tableSheetData;
          const serialized = serializeTableFile(currentData, selectedFile.name);
          fileSystemService.writeFile(selectedFile.path, serialized as string | Uint8Array).then(() => {
            setModified(false);
            isSavingRef.current = false;
          }).catch(() => {
            isSavingRef.current = false;
          });
        } catch {
          isSavingRef.current = false;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [selectedFile, tableSheetData, setModified]);

  if (!tableSheetData || tableSheetData.length === 0) {
    return (
      <div className="table-mode-empty">
        <div className="table-mode-empty-icon">📊</div>
        <div className="table-mode-empty-text">无法解析表格文件</div>
      </div>
    );
  }

  return (
    <div className="table-mode">
      <Workbook
        ref={workbookRef}
        data={tableSheetData as Sheet[]}
        onChange={handleChange}
        showToolbar={true}
        showFormulaBar={true}
        showSheetTabs={true}
        allowEdit={true}
        lang="zh"
      />
    </div>
  );
};

export default TableMode;
