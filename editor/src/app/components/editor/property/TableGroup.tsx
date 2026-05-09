import React from 'react';
import PropertyGroupTitle from './PropertyGroupTitle';
import type { ElementProps } from '../hooks/useElementProps';

interface TableGroupProps {
  table: NonNullable<ElementProps['table']>;
  onOpenTableEditor: (tableLine: number) => void;
  tableLine: number | undefined;
}

const TableGroup: React.FC<TableGroupProps> = ({ table, onOpenTableEditor, tableLine }) => (
  <PropertyGroupTitle title="表格">
    <div className="table-structure-info">
      <span className="structure-text">
        {table.rows} 行 × {table.cols} 列
      </span>
      <button
        className="edit-table-btn"
        onClick={() => {
          if (tableLine) onOpenTableEditor(tableLine);
        }}
      >
        编辑表格
      </button>
    </div>
  </PropertyGroupTitle>
);

export default TableGroup;
