"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerFileHandlers = registerFileHandlers;
exports.cleanupParseTasks = cleanupParseTasks;
const electron_1 = require("electron");
const worker_threads_1 = require("worker_threads");
const file_manager_1 = require("../file-manager");
const papaparse_1 = __importDefault(require("papaparse"));
const XLSX = __importStar(require("xlsx"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
function getTableFileExtension(filePath) {
    return filePath.split('.').pop()?.toLowerCase() || '';
}
function csvToSheetData(csvText, sheetName = 'Sheet1') {
    const result = papaparse_1.default.parse(csvText, {
        skipEmptyLines: false,
    });
    const rows = result.data;
    const maxRow = rows.length;
    const maxCol = Math.max(...rows.map((r) => r.length), 1);
    const celldata = [];
    for (let r = 0; r < maxRow; r++) {
        for (let c = 0; c < rows[r].length; c++) {
            const rawValue = rows[r][c];
            if (rawValue === '' || rawValue == null)
                continue;
            const cell = {};
            const numValue = Number(rawValue);
            if (!isNaN(numValue) && rawValue.trim() !== '') {
                cell.v = numValue;
                cell.m = rawValue;
                cell.ct = { fa: 'General', t: 'n' };
            }
            else {
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
const PARSE_TIMEOUT_MS = 60 * 1000; // 60秒超时
const activeParseTasks = new Map();
let taskIdCounter = 0;
/**
 * 聚合分批接收的单元格数据
 */
function aggregateBatchData(task, msg) {
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
        const sheets = [{
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
function parseExcelWithWorker(buffer) {
    const taskId = `task_${++taskIdCounter}`;
    return new Promise((resolve, reject) => {
        // Worker文件路径(编译后在dist/main/workers/excel-parser-worker.js)
        // __dirname指向dist/main/ipc/,需要向上一级到dist/main/
        const workerPath = path_1.default.join(__dirname, '..', 'workers', 'excel-parser-worker.js');
        const worker = new worker_threads_1.Worker(workerPath, {
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
        const task = {
            worker,
            timeoutId,
            cancel: () => {
                clearTimeout(timeoutId);
                worker.postMessage('cancel');
                // 2秒后强制终止
                setTimeout(() => {
                    try {
                        worker.terminate();
                    }
                    catch (e) {
                        // Worker可能已经终止
                    }
                }, 2000);
            },
        };
        activeParseTasks.set(taskId, task);
        worker.on('message', (msg) => {
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
                }
                else if (!msg.success) {
                    reject(new Error(msg.error || 'Excel解析失败'));
                }
                else {
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
function workbookToSheetsSync(buffer) {
    const wb = XLSX.read(buffer, { type: 'array', cellStyles: true });
    const sheets = [];
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
        const celldata = [];
        for (let r = range.s.r; r <= range.e.r; r++) {
            for (let c = range.s.c; c <= range.e.c; c++) {
                const cellRef = XLSX.utils.encode_cell({ r, c });
                const wsCell = ws[cellRef];
                if (!wsCell)
                    continue;
                const cell = {};
                if (wsCell.v !== undefined && wsCell.v !== null) {
                    if (typeof wsCell.v === 'number') {
                        cell.v = wsCell.v;
                        cell.m = wsCell.w || String(wsCell.v);
                        cell.ct = { fa: wsCell.z || 'General', t: 'n' };
                    }
                    else if (typeof wsCell.v === 'boolean') {
                        cell.v = wsCell.v;
                        cell.m = wsCell.v ? 'TRUE' : 'FALSE';
                        cell.ct = { fa: 'General', t: 'b' };
                    }
                    else {
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
                        if (style.font.bold)
                            cell.bl = 1;
                        if (style.font.italic)
                            cell.it = 1;
                        if (style.font.sz)
                            cell.fs = style.font.sz;
                        if (style.font.color?.rgb) {
                            const rgb = style.font.color.rgb;
                            cell.fc = rgb.startsWith('#') ? rgb : `#${rgb}`;
                        }
                        if (style.font.name)
                            cell.ff = style.font.name;
                    }
                    if (style.fill?.fgColor?.rgb) {
                        const rgb = style.fill.fgColor.rgb;
                        cell.bg = rgb.startsWith('#') ? rgb : `#${rgb}`;
                    }
                    if (style.alignment) {
                        if (style.alignment.horizontal === 'center')
                            cell.ht = 0;
                        else if (style.alignment.horizontal === 'right')
                            cell.ht = 2;
                        else if (style.alignment.horizontal === 'left')
                            cell.ht = 1;
                        if (style.alignment.vertical === 'center')
                            cell.vt = 0;
                        else if (style.alignment.vertical === 'top')
                            cell.vt = 1;
                        else if (style.alignment.vertical === 'bottom')
                            cell.vt = 2;
                    }
                }
                celldata.push({ r, c, v: cell });
            }
        }
        const rowCount = range.e.r - range.s.r + 1;
        const colCount = range.e.c - range.s.c + 1;
        const colWidths = {};
        if (ws['!cols']) {
            ws['!cols'].forEach((col, idx) => {
                if (col?.wpx) {
                    colWidths[String(idx)] = col.wpx;
                }
            });
        }
        const rowHeights = {};
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
function workbookToSheets(buffer) {
    console.warn('workbookToSheets is deprecated, use parseExcelWithWorker instead');
    return workbookToSheetsSync(buffer);
}
function sheetDataToCsv(sheet) {
    const celldata = sheet.celldata;
    if (!celldata || celldata.length === 0)
        return '';
    // Find max row and column to create grid
    const maxRow = Math.max(...celldata.map(cell => cell.r)) + 1;
    const maxCol = Math.max(...celldata.map(cell => cell.c)) + 1;
    // Create empty grid
    const grid = Array(maxRow).fill(null).map(() => Array(maxCol).fill(''));
    // Fill grid with cell values
    celldata.forEach(cell => {
        const { r: rowIndex, c: colIndex, v: cellData } = cell;
        if (cellData != null && cellData.v != null) {
            grid[rowIndex][colIndex] = String(cellData.v);
        }
    });
    return papaparse_1.default.unparse(grid);
}
function sheetsToWorkbook(sheets) {
    const wb = XLSX.utils.book_new();
    for (const sheet of sheets) {
        const celldata = sheet.celldata;
        if (!celldata || celldata.length === 0)
            continue;
        // Find max row and column to create grid
        const maxRow = Math.max(...celldata.map(cell => cell.r)) + 1;
        const maxCol = Math.max(...celldata.map(cell => cell.c)) + 1;
        // Create empty grid
        const aoa = Array(maxRow).fill(null).map(() => Array(maxCol).fill(null));
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
    return XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
}
function registerFileHandlers() {
    electron_1.ipcMain.handle('file:getAppRoot', async () => {
        // 直接检查技能包位置来确定正确的应用根目录
        // 首先检查打包环境的技能包位置
        const packagedSkillsPath = path_1.default.join(__dirname, '..', 'public', 'solarwire');
        if (fs_1.default.existsSync(packagedSkillsPath)) {
            // 打包环境：返回应用根目录
            const appRoot = path_1.default.join(__dirname, '..');
            console.log('Packaged environment detected, app root:', appRoot);
            console.log('Skills path found at:', packagedSkillsPath);
            return appRoot;
        }
        // 检查开发环境的技能包位置
        const devSkillsPath = path_1.default.join(__dirname, '..', '..', 'sw-skills', 'solarwire');
        if (fs_1.default.existsSync(devSkillsPath)) {
            // 开发环境：返回项目根目录
            const appRoot = path_1.default.join(__dirname, '..', '..');
            console.log('Development environment detected, app root:', appRoot);
            console.log('Skills path found at:', devSkillsPath);
            return appRoot;
        }
        // 如果都找不到，返回默认的应用根目录并记录警告
        const defaultAppRoot = path_1.default.join(__dirname, '..');
        console.warn('Skills directory not found in expected locations');
        console.warn('Checked paths:', {
            packaged: packagedSkillsPath,
            dev: devSkillsPath,
            returning: defaultAppRoot
        });
        return defaultAppRoot;
    });
    electron_1.ipcMain.handle('file:read', async (_event, filePath) => {
        return await (0, file_manager_1.readFile)(filePath);
    });
    electron_1.ipcMain.handle('file:readAsBuffer', async (_event, filePath) => {
        return await (0, file_manager_1.readFileAsBuffer)(filePath);
    });
    electron_1.ipcMain.handle('file:write', async (_event, filePath, content, allowOutsideProject) => {
        await (0, file_manager_1.writeFile)(filePath, content, allowOutsideProject);
        return { success: true };
    });
    electron_1.ipcMain.handle('file:listDirectory', async (_event, dirPath) => {
        return await (0, file_manager_1.listFiles)(dirPath);
    });
    electron_1.ipcMain.handle('file:getFileTree', async (_event, dirPath, depth = 3) => {
        return await (0, file_manager_1.getFileTree)(dirPath, depth);
    });
    electron_1.ipcMain.handle('file:collectSolarWireSnippets', async (_event, dirPath) => {
        return await (0, file_manager_1.collectSolarWireSnippets)(dirPath);
    });
    electron_1.ipcMain.handle('file:copy', async (_event, srcPath, destPath) => {
        await (0, file_manager_1.copyFile)(srcPath, destPath);
        return { success: true };
    });
    electron_1.ipcMain.handle('file:ensureDir', async (_event, dirPath) => {
        await (0, file_manager_1.ensureDir)(dirPath);
        return { success: true };
    });
    electron_1.ipcMain.handle('file:readImageAsBase64', async (_event, imagePath) => {
        return await (0, file_manager_1.readImageAsBase64)(imagePath);
    });
    electron_1.ipcMain.handle('file:setAllowedRoot', async (_event, dirPath) => {
        (0, file_manager_1.setAllowedRoot)(dirPath);
        return { success: true };
    });
    electron_1.ipcMain.handle('file:rename', async (_event, oldPath, newPath) => {
        await (0, file_manager_1.rename)(oldPath, newPath);
        return { success: true };
    });
    electron_1.ipcMain.handle('file:deleteFile', async (_event, filePath) => {
        await (0, file_manager_1.deleteFile)(filePath);
        return { success: true };
    });
    electron_1.ipcMain.handle('file:deleteDirectory', async (_event, dirPath) => {
        await (0, file_manager_1.deleteDirectory)(dirPath);
        return { success: true };
    });
    electron_1.ipcMain.handle('file:mkdir', async (_event, dirPath) => {
        await (0, file_manager_1.mkdir)(dirPath);
        return { success: true };
    });
    electron_1.ipcMain.handle('file:exists', async (_event, filePath) => {
        return await (0, file_manager_1.exists)(filePath);
    });
    electron_1.ipcMain.handle('file:showItemInFolder', async (_event, filePath) => {
        await (0, file_manager_1.showItemInFolder)(filePath);
        return { success: true };
    });
    electron_1.ipcMain.handle('file:copyDirectory', async (_event, srcDir, destDir) => {
        try {
            // 递归复制目录
            const copyRecursive = (src, dest) => {
                const stats = fs_1.default.statSync(src);
                if (stats.isDirectory()) {
                    // 创建目标目录
                    if (!fs_1.default.existsSync(dest)) {
                        fs_1.default.mkdirSync(dest, { recursive: true });
                    }
                    // 递归复制子文件和子目录
                    const files = fs_1.default.readdirSync(src);
                    for (const file of files) {
                        copyRecursive(path_1.default.join(src, file), path_1.default.join(dest, file));
                    }
                }
                else {
                    // 复制文件
                    fs_1.default.copyFileSync(src, dest);
                }
            };
            copyRecursive(srcDir, destDir);
            return { success: true };
        }
        catch (error) {
            console.error('Failed to copy directory:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    });
    electron_1.ipcMain.handle('file:parseTableFile', async (_event, filePath) => {
        // 关键:切换文件时,先取消所有正在进行的解析任务
        cancelAllParseTasks();
        const content = await (0, file_manager_1.readFileAsBuffer)(filePath);
        const ext = getTableFileExtension(filePath);
        if (ext === 'xlsx' || ext === 'xls') {
            // 使用Worker线程异步解析,避免阻塞主进程
            return await parseExcelWithWorker(content);
        }
        if (ext === 'csv') {
            const textContent = await (0, file_manager_1.readFile)(filePath);
            return [csvToSheetData(textContent, 'Sheet1')];
        }
        return [];
    });
    electron_1.ipcMain.handle('file:saveTableFile', async (_event, filePath, sheets) => {
        const ext = getTableFileExtension(filePath);
        let content;
        if (ext === 'xlsx' || ext === 'xls') {
            content = sheetsToWorkbook(sheets);
        }
        else if (ext === 'csv') {
            content = sheetDataToCsv(sheets[0]);
        }
        else {
            return { success: false, error: 'Unsupported format' };
        }
        await (0, file_manager_1.writeFile)(filePath, content);
        return { success: true };
    });
}
/**
 * 清理所有正在进行的解析任务(应用退出时调用)
 */
function cleanupParseTasks() {
    cancelAllParseTasks();
}
