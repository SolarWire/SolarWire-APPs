import { ipcMain } from 'electron';
import { Worker } from 'worker_threads';
import { readFile, readFileAsBuffer, writeFile, listFiles, getFileTree, collectSolarWireSnippets, copyFile, ensureDir, readImageAsBase64, setAllowedRoot, rename, deleteFile, deleteDirectory, mkdir, exists, showItemInFolder } from '../file-manager';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';

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

function getTableFileExtension(filePath: string): string {
  return filePath.split('.').pop()?.toLowerCase() || '';
}

function csvToSheetData(csvText: string, sheetName: string = 'Sheet1'): Sheet {
  const result = Papa.parse<string[]>(csvText, {
    skipEmptyLines: false,
  });

  const rows = result.data;
  const maxRow = rows.length;
  const maxCol = Math.max(...rows.map((r) => r.length), 1);

  const celldata: CellWithRowAndCol[] = [];

  for (let r = 0; r < maxRow; r++) {
    for (let c = 0; c < rows[r].length; c++) {
      const rawValue = rows[r][c];
      if (rawValue === '' || rawValue == null) continue;

      const cell: Cell = {};
      const numValue = Number(rawValue);
      if (!isNaN(numValue) && rawValue.trim() !== '') {
        cell.v = numValue;
        cell.m = rawValue;
        cell.ct = { fa: 'General', t: 'n' };
      } else {
        cell.v = rawValue;
        cell.m = rawValue;
        cell.ct = { fa: 'General', t: 'g' };
      }

      celldata.push({ r, c, v: cell });
    }
  }

  return {
    name: sheetName,
    celldata,
    row: Math.max(maxRow, 84),
    column: Math.max(maxCol, 60),
    defaultRowHeight: 25,
    defaultColWidth: 100,
  };
}

/**
 * Worker实例管理,支持取消操作和分批数据聚合
 */
interface ParseTask {
  worker: import('worker_threads').Worker;
  cancel: () => void;
  // 分批数据聚合状态
  batchAggregation?: {
    chunkIndex: number;
    totalChunks: number;
    sheetName: string;
    rowCount: number;
    colCount: number;
    config?: any;
    batches: CellWithRowAndCol[][];
    totalBatches: number;
    receivedBatches: number;
  };
  // 超时定时器
  timeoutId?: NodeJS.Timeout;
  // 标记是否已通过batch数据resolve
  resolvedByBatch?: boolean;
}

const PARSE_TIMEOUT_MS = 60 * 1000; // 60秒超时

const activeParseTasks = new Map<string, ParseTask>();
let taskIdCounter = 0;

/**
 * 聚合分批接收的单元格数据
 */
function aggregateBatchData(task: ParseTask, msg: any): Sheet[] | null {
  if (!task.batchAggregation) {
    task.batchAggregation = {
      chunkIndex: msg.chunkIndex,
      totalChunks: msg.totalChunks,
      sheetName: msg.sheetName,
      rowCount: msg.rowCount,
      colCount: msg.colCount,
      config: msg.config,
      batches: [],
      totalBatches: msg.totalBatches,
      receivedBatches: 0,
    };
  }

  const agg = task.batchAggregation;
  agg.batches[msg.batchIndex] = msg.celldata;
  agg.receivedBatches++;

  // 检查是否所有批次都已接收完成
  if (agg.receivedBatches === agg.totalBatches) {
    // 合并所有批次的celldata
    const mergedCelldata = agg.batches.flat();
    
    // 构建完整的Sheet对象
    const sheets: Sheet[] = [{
      name: agg.sheetName,
      celldata: mergedCelldata,
      row: Math.max(agg.rowCount + 50, 84),
      column: Math.max(agg.colCount + 20, 60),
      defaultRowHeight: 25,
      defaultColWidth: 100,
      config: agg.config,
    }];

    // 清理聚合状态
    task.batchAggregation = undefined;
    
    return sheets;
  }

  return null; // 还未接收完所有批次
}

/**
 * 使用Worker线程异步解析Excel文件,避免阻塞主进程
 * @param buffer Excel文件数据
 * @returns Promise解析结果
 */
function parseExcelWithWorker(buffer: ArrayBuffer): Promise<Sheet[]> {
  const taskId = `task_${++taskIdCounter}`;
  
  return new Promise((resolve, reject) => {
    // Worker文件路径(编译后在dist/main/workers/excel-parser-worker.js)
    // __dirname指向dist/main/ipc/,需要向上一级到dist/main/
    const workerPath = path.join(__dirname, '..', 'workers', 'excel-parser-worker.js');

    const worker = new Worker(workerPath, {
      workerData: { buffer, chunkSize: 500 },
    });

    let lastProgress = 0;

    // 设置超时保护
    const timeoutId = setTimeout(() => {
      console.warn(`Excel解析超时，任务ID: ${taskId}，强制终止`);
      worker.terminate();
      activeParseTasks.delete(taskId);
      reject(new Error('Excel解析超时，请尝试更小的文件'));
    }, PARSE_TIMEOUT_MS);

    // 注册任务,支持取消
    const task: ParseTask = {
      worker,
      timeoutId,
      cancel: () => {
        clearTimeout(timeoutId);
        worker.postMessage('cancel');
        // 2秒后强制终止
        setTimeout(() => {
          try {
            worker.terminate();
          } catch (e) {
            // Worker可能已经终止
          }
        }, 2000);
      },
    };
    activeParseTasks.set(taskId, task);

    worker.on('message', (msg: { 
      success?: boolean; 
      sheets?: Sheet[]; 
      error?: string; 
      type?: string; 
      progress?: number; 
      detail?: string; 
      totalRows?: number; 
      processedRows?: number;
      // 分批传输相关字段
      chunkIndex?: number;
      totalChunks?: number;
      batchIndex?: number;
      totalBatches?: number;
      sheetName?: string;
      celldata?: CellWithRowAndCol[];
      rowCount?: number;
      colCount?: number;
      isFirstBatch?: boolean;
      isLastBatch?: boolean;
      config?: any;
    }) => {
      // 处理进度消息 - 发送到渲染进程
      if (msg.type === 'progress' && msg.progress !== undefined) {
        const mainWindow = require('electron').BrowserWindow.getAllWindows()[0];
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('table-parse-progress', {
            progress: msg.progress,
            detail: msg.detail,
            totalRows: msg.totalRows,
            processedRows: msg.processedRows
          });
        }
        lastProgress = msg.progress;
        return;
      }

      // 处理分批传输的chunk数据
      if (msg.type === 'batch' && msg.celldata) {
        const task = activeParseTasks.get(taskId);
        if (!task) {
          reject(new Error('任务不存在'));
          return;
        }

        // 转发batch数据到渲染进程用于增量渲染
        const mainWindow = require('electron').BrowserWindow.getAllWindows()[0];
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('table-batch-data', {
            chunkIndex: msg.chunkIndex,
            totalChunks: msg.totalChunks,
            batchIndex: msg.batchIndex,
            totalBatches: msg.totalBatches,
            sheetName: msg.sheetName,
            celldata: msg.celldata,
            rowCount: msg.rowCount,
            colCount: msg.colCount,
            isFirstBatch: msg.isFirstBatch,
            isLastBatch: msg.isLastBatch,
            config: msg.config,
          });
        }

        // 聚合分批数据（用于最终结果）
        const completedSheets = aggregateBatchData(task, msg);
        
        // 如果所有批次接收完成，返回结果
        if (completedSheets) {
          clearTimeout(task.timeoutId);
          task.resolvedByBatch = true;
          worker.terminate();
          activeParseTasks.delete(taskId);
          resolve(completedSheets);
        }
        return;
      }

      // 处理最终结果（兼容旧的完整数据传输方式）
      if (msg.type === 'complete') {
        const task = activeParseTasks.get(taskId);
        if (task) {
          clearTimeout(task.timeoutId);
          
          // 如果已经通过batch数据resolve了，直接忽略complete消息
          if (task.resolvedByBatch) {
            worker.terminate();
            activeParseTasks.delete(taskId);
            return;
          }
        }
        
        worker.terminate();
        activeParseTasks.delete(taskId);
        
        if (msg.success && msg.sheets) {
          resolve(msg.sheets);
        } else if (!msg.success) {
          reject(new Error(msg.error || 'Excel解析失败'));
        } else {
          // success=true但sheets为空，可能是空文件
          resolve([]);
        }
        return;
      }
    });

    worker.on('error', (err) => {
      const task = activeParseTasks.get(taskId);
      if (task) {
        clearTimeout(task.timeoutId);
      }
      worker.terminate();
      activeParseTasks.delete(taskId);
      reject(err);
    });

    worker.on('exit', (code) => {
      const task = activeParseTasks.get(taskId);
      if (task) {
        clearTimeout(task.timeoutId);
        activeParseTasks.delete(taskId);
      }
      if (code !== 0) {
        reject(new Error(`Worker stopped with exit code ${code}`));
      }
    });
  });
}

/**
 * 取消正在进行的解析任务
 */
function cancelAllParseTasks() {
  for (const [id, task] of activeParseTasks) {
    task.cancel();
  }
  activeParseTasks.clear();
}

/**
 * 同步解析Excel(保留用于小文件或兼容场景)
 */
function workbookToSheetsSync(buffer: ArrayBuffer): Sheet[] {
  const wb = XLSX.read(buffer, { type: 'array', cellStyles: true });
  const sheets: Sheet[] = [];

  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    if (!ws || !ws['!ref']) {
      sheets.push({
        name: sheetName,
        celldata: [],
        row: 84,
        column: 60,
        defaultRowHeight: 25,
        defaultColWidth: 100,
      });
      continue;
    }

    const range = XLSX.utils.decode_range(ws['!ref']);
    const celldata: CellWithRowAndCol[] = [];

    for (let r = range.s.r; r <= range.e.r; r++) {
      for (let c = range.s.c; c <= range.e.c; c++) {
        const cellRef = XLSX.utils.encode_cell({ r, c });
        const wsCell = ws[cellRef];
        if (!wsCell) continue;

        const cell: Cell = {};

        if (wsCell.v !== undefined && wsCell.v !== null) {
          if (typeof wsCell.v === 'number') {
            cell.v = wsCell.v;
            cell.m = wsCell.w || String(wsCell.v);
            cell.ct = { fa: wsCell.z || 'General', t: 'n' };
          } else if (typeof wsCell.v === 'boolean') {
            cell.v = wsCell.v;
            cell.m = wsCell.v ? 'TRUE' : 'FALSE';
            cell.ct = { fa: 'General', t: 'b' };
          } else {
            cell.v = String(wsCell.v);
            cell.m = wsCell.w || String(wsCell.v);
            cell.ct = { fa: 'General', t: 'g' };
          }
        }

        if (wsCell.f) {
          cell.f = wsCell.f;
        }

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

        celldata.push({ r, c, v: cell });
      }
    }

    const rowCount = range.e.r - range.s.r + 1;
    const colCount = range.e.c - range.s.c + 1;

    const colWidths: Record<string, number> = {};
    if (ws['!cols']) {
      ws['!cols'].forEach((col, idx) => {
        if (col?.wpx) {
          colWidths[String(idx)] = col.wpx;
        }
      });
    }

    const rowHeights: Record<string, number> = {};
    if (ws['!rows']) {
      ws['!rows'].forEach((row, idx) => {
        if (row?.hpx) {
          rowHeights[String(idx)] = row.hpx;
        }
      });
    }

    sheets.push({
      name: sheetName,
      celldata,
      row: Math.max(rowCount + 50, 84),
      column: Math.max(colCount + 20, 60),
      defaultRowHeight: 25,
      defaultColWidth: 100,
      config: {
        columnlen: Object.keys(colWidths).length > 0 ? colWidths : undefined,
        rowlen: Object.keys(rowHeights).length > 0 ? rowHeights : undefined,
      },
    });
  }

  return sheets;
}

/**
 * 兼容旧接口,实际调用已改为异步Worker版本
 * @deprecated 直接使用 parseExcelWithWorker
 */
function workbookToSheets(buffer: ArrayBuffer): Sheet[] {
  console.warn('workbookToSheets is deprecated, use parseExcelWithWorker instead');
  return workbookToSheetsSync(buffer);
}

function sheetDataToCsv(sheet: Sheet): string {
  const celldata = sheet.celldata;
  if (!celldata || celldata.length === 0) return '';

  // Find max row and column to create grid
  const maxRow = Math.max(...celldata.map(cell => cell.r)) + 1;
  const maxCol = Math.max(...celldata.map(cell => cell.c)) + 1;

  // Create empty grid
  const grid: string[][] = Array(maxRow).fill(null).map(() => Array(maxCol).fill(''));

  // Fill grid with cell values
  celldata.forEach(cell => {
    const { r: rowIndex, c: colIndex, v: cellData } = cell;
    if (cellData != null && cellData.v != null) {
      grid[rowIndex][colIndex] = String(cellData.v);
    }
  });

  return Papa.unparse(grid);
}

function sheetsToWorkbook(sheets: Sheet[]): ArrayBuffer {
  const wb = XLSX.utils.book_new();

  for (const sheet of sheets) {
    const celldata = sheet.celldata;
    if (!celldata || celldata.length === 0) continue;

    // Find max row and column to create grid
    const maxRow = Math.max(...celldata.map(cell => cell.r)) + 1;
    const maxCol = Math.max(...celldata.map(cell => cell.c)) + 1;

    // Create empty grid
    const aoa: (string | number | boolean | null)[][] = Array(maxRow).fill(null).map(() => Array(maxCol).fill(null));

    // Fill grid with cell values
    celldata.forEach(cell => {
      const { r: rowIndex, c: colIndex, v: cellData } = cell;
      if (cellData != null && cellData.v != null) {
        aoa[rowIndex][colIndex] = cellData.v;
      }
    });

    const ws = XLSX.utils.aoa_to_sheet(aoa);
    XLSX.utils.book_append_sheet(wb, ws, sheet.name);
  }

  return XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
}

export function registerFileHandlers(): void {
  ipcMain.handle('file:getAppRoot', async () => {
    // 直接检查技能包位置来确定正确的应用根目录
    
    // 首先检查打包环境的技能包位置
    const packagedSkillsPath = path.join(__dirname, '..', 'public', 'solarwire');
    if (fs.existsSync(packagedSkillsPath)) {
      // 打包环境：返回应用根目录
      const appRoot = path.join(__dirname, '..');
      console.log('Packaged environment detected, app root:', appRoot);
      console.log('Skills path found at:', packagedSkillsPath);
      return appRoot;
    }
    
    // 检查开发环境的技能包位置
    const devSkillsPath = path.join(__dirname, '..', '..', 'sw-skills', 'solarwire');
    if (fs.existsSync(devSkillsPath)) {
      // 开发环境：返回项目根目录
      const appRoot = path.join(__dirname, '..', '..');
      console.log('Development environment detected, app root:', appRoot);
      console.log('Skills path found at:', devSkillsPath);
      return appRoot;
    }
    
    // 如果都找不到，返回默认的应用根目录并记录警告
    const defaultAppRoot = path.join(__dirname, '..');
    console.warn('Skills directory not found in expected locations');
    console.warn('Checked paths:', {
      packaged: packagedSkillsPath,
      dev: devSkillsPath,
      returning: defaultAppRoot
    });
    
    return defaultAppRoot;
  });

  ipcMain.handle('file:read', async (_event, filePath: string) => {
    return await readFile(filePath);
  });

  ipcMain.handle('file:readAsBuffer', async (_event, filePath: string) => {
    return await readFileAsBuffer(filePath);
  });

  ipcMain.handle('file:write', async (_event, filePath: string, content: string | ArrayBuffer | Uint8Array, allowOutsideProject?: boolean) => {
    await writeFile(filePath, content, allowOutsideProject);
    return { success: true };
  });

  ipcMain.handle('file:listDirectory', async (_event, dirPath: string) => {
    return await listFiles(dirPath);
  });

  ipcMain.handle('file:getFileTree', async (_event, dirPath: string, depth = 3) => {
    return await getFileTree(dirPath, depth);
  });

  ipcMain.handle('file:collectSolarWireSnippets', async (_event, dirPath: string) => {
    return await collectSolarWireSnippets(dirPath);
  });

  ipcMain.handle('file:copy', async (_event, srcPath: string, destPath: string) => {
    await copyFile(srcPath, destPath);
    return { success: true };
  });

  ipcMain.handle('file:ensureDir', async (_event, dirPath: string) => {
    await ensureDir(dirPath);
    return { success: true };
  });

  ipcMain.handle('file:readImageAsBase64', async (_event, imagePath: string) => {
    return await readImageAsBase64(imagePath);
  });

  ipcMain.handle('file:setAllowedRoot', async (_event, dirPath: string) => {
    setAllowedRoot(dirPath);
    return { success: true };
  });

  ipcMain.handle('file:rename', async (_event, oldPath: string, newPath: string) => {
    await rename(oldPath, newPath);
    return { success: true };
  });

  ipcMain.handle('file:deleteFile', async (_event, filePath: string) => {
    await deleteFile(filePath);
    return { success: true };
  });

  ipcMain.handle('file:deleteDirectory', async (_event, dirPath: string) => {
    await deleteDirectory(dirPath);
    return { success: true };
  });

  ipcMain.handle('file:mkdir', async (_event, dirPath: string) => {
    await mkdir(dirPath);
    return { success: true };
  });

  ipcMain.handle('file:exists', async (_event, filePath: string) => {
    return await exists(filePath);
  });

  ipcMain.handle('file:showItemInFolder', async (_event, filePath: string) => {
    await showItemInFolder(filePath);
    return { success: true };
  });

  ipcMain.handle('file:copyDirectory', async (_event, srcDir: string, destDir: string) => {
    try {
      // 递归复制目录
      const copyRecursive = (src: string, dest: string): void => {
        const stats = fs.statSync(src);
        
        if (stats.isDirectory()) {
          // 创建目标目录
          if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
          }
          
          // 递归复制子文件和子目录
          const files = fs.readdirSync(src);
          for (const file of files) {
            copyRecursive(path.join(src, file), path.join(dest, file));
          }
        } else {
          // 复制文件
          fs.copyFileSync(src, dest);
        }
      };

      copyRecursive(srcDir, destDir);
      return { success: true };
    } catch (error) {
      console.error('Failed to copy directory:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  });

  ipcMain.handle('file:parseTableFile', async (_event, filePath: string) => {
    // 关键:切换文件时,先取消所有正在进行的解析任务
    cancelAllParseTasks();
    
    const content = await readFileAsBuffer(filePath);
    const ext = getTableFileExtension(filePath);

    if (ext === 'xlsx' || ext === 'xls') {
      // 使用Worker线程异步解析,避免阻塞主进程
      return await parseExcelWithWorker(content);
    }

    if (ext === 'csv') {
      const textContent = await readFile(filePath);
      return [csvToSheetData(textContent, 'Sheet1')];
    }

    return [];
  });

  ipcMain.handle('file:saveTableFile', async (_event, filePath: string, sheets: Sheet[]) => {
    const ext = getTableFileExtension(filePath);

    let content: ArrayBuffer | string;
    if (ext === 'xlsx' || ext === 'xls') {
      content = sheetsToWorkbook(sheets);
    } else if (ext === 'csv') {
      content = sheetDataToCsv(sheets[0]);
    } else {
      return { success: false, error: 'Unsupported format' };
    }

    await writeFile(filePath, content);
    return { success: true };
  });
}

/**
 * 清理所有正在进行的解析任务(应用退出时调用)
 */
export function cleanupParseTasks(): void {
  cancelAllParseTasks();
}
