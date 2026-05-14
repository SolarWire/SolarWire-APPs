import { parentPort, workerData } from 'worker_threads';
import * as XLSX from 'xlsx';

// Define types for Excel sheet data (replacing fortune-sheet types)
interface Cell {
  v?: any;
  m?: string;
  ct?: { fa: string; t: string };
  f?: string;
  bl?: number;
  it?: number;
  fs?: number;
  fc?: string;
  ff?: string;
  bg?: string;
  ht?: number;
  vt?: number;
}

interface CellWithRowAndCol {
  r: number;
  c: number;
  v: Cell;
}

interface Sheet {
  name: string;
  celldata: CellWithRowAndCol[];
  row: number;
  column: number;
  defaultRowHeight: number;
  defaultColWidth: number;
  config?: any;
}

interface WorkerInput {
  buffer: ArrayBuffer;
  chunkSize?: number; // 每次处理的行数,默认500
}

interface ProgressMessage {
  type: 'progress';
  progress: number;
  detail?: string;
  totalRows?: number;
  processedRows?: number;
}

interface ChunkMessage {
  type: 'chunk';
  chunkIndex: number;
  totalChunks: number;
  sheetName: string;
  celldata: CellWithRowAndCol[];
  rowCount: number;
  colCount: number;
  config?: {
    columnlen?: Record<string, number>;
    rowlen?: Record<string, number>;
  };
}

// 分批传输配置
const BATCH_CONFIG = {
  MAX_CELLS_PER_BATCH: 5000, // 每批最多单元格数量
  MAX_SIZE_PER_BATCH: 500 * 1024, // 每批最大500KB
};

interface BatchMessage {
  type: 'batch';
  chunkIndex: number;
  totalChunks: number;
  batchIndex: number;
  totalBatches: number;
  sheetName: string;
  celldata: CellWithRowAndCol[];
  rowCount: number;
  colCount: number;
  isFirstBatch: boolean;
  isLastBatch: boolean;
  config?: {
    columnlen?: Record<string, number>;
    rowlen?: Record<string, number>;
  };
}

let cancelled = false;

// 监听取消消息
if (parentPort) {
  parentPort.on('message', (msg) => {
    if (msg === 'cancel') {
      cancelled = true;
    }
  });
}

function sendProgress(progress: number, detail?: string, totalRows?: number, processedRows?: number) {
  if (parentPort && !cancelled) {
    const msg: ProgressMessage = { 
      type: 'progress', 
      progress, 
      detail,
      totalRows,
      processedRows
    };
    parentPort.postMessage(msg);
  }
}

/**
 * 流式分块解析单个工作表
 * 关键优化:
 * 1. 按行分块处理,避免一次性加载所有数据到内存
 * 2. 每处理完一个chunk就发送出去,减少内存峰值
 * 3. 支持中途取消
 */
function processWorksheetChunked(
  ws: XLSX.WorkSheet,
  sheetName: string,
  chunkSize: number = 500
): void {
  if (!ws || !ws['!ref']) {
    // 空工作表 - 使用分批格式发送
    if (parentPort) {
      parentPort.postMessage({
        type: 'batch',
        chunkIndex: 0,
        totalChunks: 1,
        batchIndex: 0,
        totalBatches: 1,
        sheetName,
        celldata: [],
        rowCount: 84,
        colCount: 60,
        isFirstBatch: true,
        isLastBatch: true,
        config: undefined
      } as BatchMessage);
    }
    return;
  }

  const range = XLSX.utils.decode_range(ws['!ref']);
  const totalRows = range.e.r - range.s.r + 1;
  const totalCols = range.e.c - range.s.c + 1;
  const totalChunks = Math.ceil(totalRows / chunkSize);

  // 提取列宽配置
  const colWidths: Record<string, number> = {};
  if (ws['!cols']) {
    ws['!cols'].forEach((col, idx) => {
      if (col?.wpx) {
        colWidths[String(idx)] = col.wpx;
      }
    });
  }

  // 提取行高配置
  const rowHeights: Record<string, number> = {};
  if (ws['!rows']) {
    ws['!rows'].forEach((row, idx) => {
      if (row?.hpx) {
        rowHeights[String(idx)] = row.hpx;
      }
    });
  }

  const config = {
    columnlen: Object.keys(colWidths).length > 0 ? colWidths : undefined,
    rowlen: Object.keys(rowHeights).length > 0 ? rowHeights : undefined,
  };

  // 分块处理每一行
  for (let chunkIdx = 0; chunkIdx < totalChunks; chunkIdx++) {
    if (cancelled) {
      throw new Error('解析已取消');
    }

    const startRow = range.s.r + chunkIdx * chunkSize;
    const endRow = Math.min(startRow + chunkSize - 1, range.e.r);
    const celldata: CellWithRowAndCol[] = [];

    for (let r = startRow; r <= endRow; r++) {
      for (let c = range.s.c; c <= range.e.c; c++) {
        const cellRef = XLSX.utils.encode_cell({ r, c });
        const wsCell = ws[cellRef];
        if (!wsCell) continue;

        const cell: any = {};

        // 值处理 - 简化逻辑
        const v = wsCell.v;
        if (v !== undefined && v !== null) {
          if (typeof v === 'number') {
            cell.v = v;
            cell.m = wsCell.w || String(v);
            cell.ct = { fa: wsCell.z || 'General', t: 'n' };
          } else if (typeof v === 'boolean') {
            cell.v = v ? 1 : 0;
            cell.m = v ? 'TRUE' : 'FALSE';
            cell.ct = { fa: 'General', t: 'b' };
          } else {
            cell.v = String(v);
            cell.m = wsCell.w || String(v);
            cell.ct = { fa: 'General', t: 'g' };
          }
        }

        // 公式
        if (wsCell.f) {
          cell.f = wsCell.f;
        }

        // 样式 - 只在需要时处理
        const style = wsCell.s;
        if (style) {
          if (style.font) {
            if (style.font.bold) cell.bl = 1;
            if (style.font.italic) cell.it = 1;
            if (style.font.sz) cell.fs = style.font.sz;
            if (style.font.color?.rgb) {
              const rgb = style.font.color.rgb;
              cell.fc = rgb.startsWith('#') ? rgb : `#${rgb}`;
            }
            if (style.font.name) cell.ff = style.font.name;
          }
          if (style.fill?.fgColor?.rgb) {
            const rgb = style.fill.fgColor.rgb;
            cell.bg = rgb.startsWith('#') ? rgb : `#${rgb}`;
          }
          if (style.alignment) {
            if (style.alignment.horizontal === 'center') cell.ht = 0;
            else if (style.alignment.horizontal === 'right') cell.ht = 2;
            else if (style.alignment.horizontal === 'left') cell.ht = 1;

            if (style.alignment.vertical === 'center') cell.vt = 0;
            else if (style.alignment.vertical === 'top') cell.vt = 1;
            else if (style.alignment.vertical === 'bottom') cell.vt = 2;
          }
        }

        celldata.push({ r: r - range.s.r, c: c - range.s.c, v: cell });
      }
    }

    // 分批发送当前chunk的数据
    if (parentPort) {
      const totalBatches = Math.ceil(celldata.length / BATCH_CONFIG.MAX_CELLS_PER_BATCH);
      
      for (let batchIdx = 0; batchIdx < totalBatches; batchIdx++) {
        if (cancelled) {
          throw new Error('解析已取消');
        }

        const startIdx = batchIdx * BATCH_CONFIG.MAX_CELLS_PER_BATCH;
        const endIdx = Math.min(startIdx + BATCH_CONFIG.MAX_CELLS_PER_BATCH, celldata.length);
        const batchData = celldata.slice(startIdx, endIdx);

        parentPort.postMessage({
          type: 'batch',
          chunkIndex: chunkIdx,
          totalChunks,
          batchIndex: batchIdx,
          totalBatches,
          sheetName,
          celldata: batchData,
          rowCount: totalRows,
          colCount: totalCols,
          isFirstBatch: batchIdx === 0,
          isLastBatch: batchIdx === totalBatches - 1,
          config: batchIdx === 0 ? config : undefined // 只在第一批发送config
        } as BatchMessage);
      }
    }

    // 发送进度更新
    const processedRows = Math.min((chunkIdx + 1) * chunkSize, totalRows);
    sendProgress(
      Math.round((processedRows / totalRows) * 100),
      `${sheetName}: ${processedRows}/${totalRows}行`,
      totalRows,
      processedRows
    );
  }
}

/**
 * 主解析函数 - 流式分块处理
 */
function parseExcelStream(buffer: ArrayBuffer, chunkSize: number = 500): void {
  sendProgress(5, '正在读取Excel文件...');
  
  // 优化:关闭不必要的解析选项
  const wb = XLSX.read(buffer, { 
    type: 'array', 
    cellStyles: true,
    cellFormula: false,  // 不解析公式提升性能
    cellHTML: false,     // 不解析富文本
  });
  
  const totalSheets = wb.SheetNames.length;
  
  for (let s = 0; s < totalSheets; s++) {
    if (cancelled) {
      throw new Error('解析已取消');
    }

    const sheetName = wb.SheetNames[s];
    const ws = wb.Sheets[sheetName];
    
    sendProgress(
      Math.round(10 + (s / totalSheets) * 80),
      `处理工作表: ${sheetName}`
    );

    // 流式分块处理当前工作表
    processWorksheetChunked(ws, sheetName, chunkSize);
  }

  // 发送完成信号
  if (parentPort) {
    parentPort.postMessage({
      type: 'complete',
      success: true
    });
  }
}

// Worker入口
if (parentPort) {
  try {
    const { buffer, chunkSize = 500 }: WorkerInput = workerData as unknown as WorkerInput;
    parseExcelStream(buffer, chunkSize);
  } catch (error) {
    if (cancelled || (error instanceof Error && error.message === '解析已取消')) {
      if (parentPort) {
        parentPort.postMessage({
          type: 'complete',
          success: false,
          error: '解析已取消'
        });
      }
    } else {
      console.error('Excel解析错误:', error);
      if (parentPort) {
        parentPort.postMessage({
          type: 'complete',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }
}
