import React from 'react';
import PropertyGroupTitle from './PropertyGroupTitle';
import type { ElementProps } from '../hooks/useElementProps';

interface TableGroupProps {
  table: NonNullable<ElementProps['table']>;
  onOpenTableEditor: (tableLine: number) => void;
  tableLine: number | undefined;
}

const TableGroup: React.FC<TableGroupProps> = ({ table, onOpenTableEditor, tableLine }) => (
  <PropertyGroupTitle title="Table">
    <div className="table-structure-info">
      <span className="structure-text">
        {table.rows} rows × {table.cols} cols
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
