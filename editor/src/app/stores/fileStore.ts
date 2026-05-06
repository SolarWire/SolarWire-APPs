import { create } from 'zustand';
import { FileState, FileNode, SolarWireSnippet } from '../../shared/types/file';
import { readFile } from '../../shared/utils/file-utils';
import { eventBus, EditorEvents } from '../../shared/utils/EventBus';
import { fileSystemService } from '../services/file-system-service';
import { useStatusStore, showInfo, showSuccess, showError } from './statusStore';
import { useEditorStore } from './editorStore';
import { syntaxErrorService } from '../services/syntax-error-service';

// 定期刷新间隔（毫秒）
const AUTO_REFRESH_INTERVAL = 30000; // 30秒

// 图片文件扩展名集合
const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico']);

/**
 * 判断是否为图片文件
 * @param filePath 文件路径
 * @returns 是否为图片文件
 */
function isImageFile(filePath: string): boolean {
  const ext = filePath.split('.').pop()?.toLowerCase() || '';
  return IMAGE_EXTENSIONS.has(ext);
}

/**
 * 从 Markdown 内容中提取 SolarWire 代码片段
 * @param markdownContent Markdown 内容
 * @param snippetIndex 代码片段索引
 * @returns SolarWire 代码或 null
 */
function extractSolarWireSnippetCode(
  markdownContent: string,
  snippetIndex: number
): string | null {
  const solarwireBlockRegex = /```solarwire\s*([\s\S]*?)```/g;
  let match;
  let currentIndex = 0;

  while ((match = solarwireBlockRegex.exec(markdownContent)) !== null) {
    currentIndex++;
    if (currentIndex === snippetIndex) {
      return match[1].trim();
    }
  }

  return null;
}

/**
 * 替换 Markdown 中的 SolarWire 代码片段
 * @param markdownContent Markdown 内容
 * @param snippetIndex 代码片段索引
 * @param newCode 新的 SolarWire 代码
 * @returns 替换后的 Markdown 内容
 */
function replaceSolarWireSnippetInMarkdown(
  markdownContent: string,
  snippetIndex: number,
  newCode: string
): string {
  const solarwireBlockRegex = /```solarwire\s*([\s\S]*?)```/g;
  let match;
  let currentIndex = 0;
  let lastIndex = 0;
  let result = '';
  let found = false;

  // 遍历所有 SolarWire 代码块
  while ((match = solarwireBlockRegex.exec(markdownContent)) !== null) {
    currentIndex++;
    // 添加匹配前的内容（包括前面的代码块）
    result += markdownContent.substring(lastIndex, match.index);
    
    if (currentIndex === snippetIndex) {
      found = true;
      // 替换目标代码块
      result += '```solarwire\n' + newCode + '\n```';
    } else {
      // 保留其他代码块
      result += match[0];
    }
    
    // 更新最后位置
    lastIndex = match.index + match[0].length;
  }

  // 添加剩余内容
  result += markdownContent.substring(lastIndex);

  if (!found) {
    console.warn(`Snippet index ${snippetIndex} not found in markdown`);
    return markdownContent;
  }

  return result;
}

/**
 * 获取文件树
 * @param dirPath 目录路径
 * @returns 文件节点列表
 */
async function getFileTree(dirPath: string): Promise<FileNode[]> {
  const api = (window as any).api;
  if (api && typeof api.getFileTree === 'function') {
    return await api.getFileTree(dirPath);
  }
  return [];
}

/**
 * 文件状态管理 Store
 * 管理文件树、选中文件、文件内容等
 */
export const useFileStore = create<FileState>()((set, get) => ({
  currentPath: '',
  fileTree: [],
  selectedFile: null,
  selectedImage: null,
  fileContent: '',
  expandedDirectories: new Set(),
  currentSnippet: null,
  autoRefreshEnabled: true,
  autoRefreshTimer: null,
  refreshKey: 0,
  
  /**
   * 设置当前路径
   */
  setCurrentPath: (path: string) => set({ currentPath: path }),
  
  /**
   * 设置文件树
   */
  setFileTree: (tree: FileNode[]) => set({ fileTree: tree }),
  
  /**
   * 设置选中的文件
   */
  setSelectedFile: (file: FileNode | null) => set({ selectedFile: file, currentSnippet: null, selectedImage: null }),
  
  /**
   * 设置选中的图片
   */
  setSelectedImage: (image) => set({ selectedImage: image, selectedFile: null, currentSnippet: null }),
  
  /**
   * 设置当前的代码片段
   */
  setCurrentSnippet: (snippet: SolarWireSnippet | null) => set({ currentSnippet: snippet }),
  
  /**
   * 设置文件内容
   */
  setFileContent: (content: string) => {
    set({ fileContent: content });
    eventBus.emit(EditorEvents.CONTENT_CHANGED, content);
  },
  
  /**
   * 更新文件内容
   */
  updateFileContent: (file: FileNode | string, content: string) => {
    set({ fileContent: content });
  },
  
  /**
   * 切换目录展开状态
   */
  toggleDirectory: (dirPath: string) => {
    const expanded = new Set(get().expandedDirectories);
    if (expanded.has(dirPath)) {
      expanded.delete(dirPath);
    } else {
      expanded.add(dirPath);
    }
    set({ expandedDirectories: expanded });
  },
  openFileAtPath: async (filePath: string) => {
    const statusStore = useStatusStore.getState();
    
    try {
      statusStore.startOperation('open', '打开文件中...');
      statusStore.setCurrentFilePath(filePath);
      
      eventBus.emit(EditorEvents.FILE_OPENED, { phase: 'start', filePath });

      const name = filePath.split(/[\\/]/).pop() || filePath;

      if (isImageFile(filePath)) {
        const node: FileNode = { name, path: filePath, type: 'file' };
        set({ selectedFile: node, selectedImage: { path: filePath } });
        eventBus.emit(EditorEvents.MODE_CHANGED, 'image');
        eventBus.emit(EditorEvents.FILE_OPENED, { phase: 'complete', fileName: name });

        statusStore.completeOperation('已打开图片');
        showInfo(`已打开图片: ${name}`);
        return;
      }

      const content = await readFile(filePath);
      const node: FileNode = { name, path: filePath, type: 'file' };
      
      // 更新文件状态
      const lineCount = content.split('\n').length;
      statusStore.updateFileStatus({ 
        isModified: false, 
        lineCount,
        encoding: 'UTF-8' // 默认编码，实际应该检测
      });
      
      set({ selectedFile: node, fileContent: content, selectedImage: null });
      
      // 清除编辑器历史记录，避免跨文件的历史记录污染
      const editorStore = useEditorStore.getState();
      editorStore.clearHistory();
      
      // 清除之前的语法错误状态，避免错误高亮残留
      syntaxErrorService.clearErrors();
      
      eventBus.emit(EditorEvents.CONTENT_CHANGED, content);
      eventBus.emit(EditorEvents.FILE_OPENED, { phase: 'set-path', filePath });
      
      try {
        const parts = name.split('.');
        const ext = parts.length > 1 ? parts.pop()!.toLowerCase() : '';
        let mode: 'markdown' | 'solarwire' = 'markdown';
        if (ext === 'md' || ext === 'markdown' || ext === 'txt') {
          mode = 'markdown';
        } else if (ext === 'sw' || ext === 'solarwire') {
          mode = 'solarwire';
        }
        eventBus.emit(EditorEvents.MODE_CHANGED, mode);
        statusStore.updateEditorStatus({ mode });
      } catch (e) {
        // ignore
      }
      
      eventBus.emit(EditorEvents.FILE_OPENED, { phase: 'complete', fileName: name });
      statusStore.completeOperation(`已打开: ${name}`);
      showSuccess(`文件已打开: ${name}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '未知错误';
      eventBus.emit(EditorEvents.FILE_OPENED, { phase: 'error', error: errorMessage });
      console.error('Failed to open file', err);
      
      statusStore.failOperation('打开文件失败', errorMessage);
      showError(`打开文件失败: ${errorMessage}`);
    }
  },
  openSolarWireSnippet: async (snippet: SolarWireSnippet) => {
    const statusStore = useStatusStore.getState();
    
    try {
      statusStore.startOperation('open', '打开代码片段中...');
      
      const node: FileNode = { name: snippet.name, path: snippet.sourceFile, type: 'file' };

      let latestCode = snippet.code;
      if (snippet.snippetIndex !== undefined) {
        const fileOnDisk = await readFile(snippet.sourceFile);
        const extracted = extractSolarWireSnippetCode(fileOnDisk, snippet.snippetIndex);
        if (extracted !== null) {
          latestCode = extracted;
        }
      }

      set({ selectedFile: node, fileContent: latestCode, currentSnippet: snippet });
      
      // 清除编辑器历史记录，避免跨文件的历史记录污染
      const editorStore = useEditorStore.getState();
      editorStore.clearHistory();
      
      // 清除之前的语法错误状态，避免错误高亮残留
      syntaxErrorService.clearErrors();
      
      eventBus.emit(EditorEvents.CONTENT_CHANGED, latestCode);
      eventBus.emit(EditorEvents.MODE_CHANGED, 'solarwire');
      
      statusStore.setCurrentFilePath(snippet.sourceFile);
      statusStore.updateEditorStatus({ mode: 'solarwire' });
      statusStore.updateFileStatus({ 
        isModified: false, 
        lineCount: latestCode.split('\n').length 
      });
      
      statusStore.completeOperation(`已打开: ${snippet.name}`);
      showInfo(`已打开代码片段: ${snippet.name}`);
    } catch (err) {
      console.error('Failed to open solarwire snippet', err);
      const errorMessage = err instanceof Error ? err.message : '未知错误';
      
      statusStore.failOperation('打开代码片段失败', errorMessage);
      showError(`打开代码片段失败: ${errorMessage}`);
    }
  },
  openDirectoryAtPath: async (dirPath: string) => {
    const statusStore = useStatusStore.getState();
    
    try {
      statusStore.startOperation('open', '打开目录中...');
      eventBus.emit(EditorEvents.FILE_OPENED, { phase: 'start', filePath: dirPath });

      const api = (window as any).api;
      if (api?.setAllowedRoot) {
        await api.setAllowedRoot(dirPath);
      }

      const tree = await getFileTree(dirPath);
      set({ currentPath: dirPath, fileTree: tree });
      eventBus.emit(EditorEvents.FILE_OPENED, { phase: 'set-path', filePath: dirPath });
      
      eventBus.emit(EditorEvents.FILE_OPENED, { phase: 'complete', fileName: dirPath });
      statusStore.completeOperation(`已打开目录: ${dirPath}`);
      showSuccess(`目录已打开: ${dirPath}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '未知错误';
      eventBus.emit(EditorEvents.FILE_OPENED, { phase: 'error', error: errorMessage });
      console.error('Failed to open directory', err);
      
      statusStore.failOperation('打开目录失败', errorMessage);
      showError(`打开目录失败: ${errorMessage}`);
    }
  },
  saveFile: async () => {
    const { selectedFile, currentSnippet, fileContent } = get();
    const editorStore = useEditorStore.getState();
    const editorContent = editorStore.content;
    const currentMode = editorStore.mode;
    const statusStore = useStatusStore.getState();
    
    if (!selectedFile) {
      console.error('No file selected');
      eventBus.emit(EditorEvents.FILE_SAVED, { phase: 'error', error: '没有选择文件' });
      
      statusStore.failOperation('保存失败', '没有选择文件');
      showError('没有选择文件');
      return;
    }
    
    try {
      statusStore.startOperation('save', '保存中...');
      eventBus.emit(EditorEvents.FILE_SAVED, { phase: 'start' });
      
      // 检查是否正在编辑一个 snippet
      const isSnippet = currentSnippet && currentSnippet.type === 'snippet';
      const hasSnippetIndex = currentSnippet && currentSnippet.snippetIndex !== undefined;
      
      let contentToSave: string;
      
      // 场景1：md内SolarWire代码块编辑（snippet）
      // 读取原始md文件，用editorContent替换对应位置的代码块
      if (isSnippet && hasSnippetIndex) {
        const originalContent = await readFile(selectedFile.path);
        contentToSave = replaceSolarWireSnippetInMarkdown(
          originalContent,
          currentSnippet.snippetIndex ?? 0,
          editorContent  // 使用editorContent作为替换的代码块内容
        );
        // snippet场景：更新fileContent为完整的md内容，保持状态一致
        set({ fileContent: contentToSave, currentSnippet: null });
      } 
      // 场景2：独立文件编辑（solarwire或markdown）
      // 使用editorContent（用户实际编辑的内容）
      else {
        contentToSave = editorContent || fileContent;
        // 独立文件场景：正常更新fileContent
        set({ fileContent: contentToSave });
      }
      
      await fileSystemService.writeFile(selectedFile.path, contentToSave);
      
      // 重置修改状态
      editorStore.setModified(false);
      
      eventBus.emit(EditorEvents.FILE_SAVED, { phase: 'complete' });
      
      // 更新文件状态
      statusStore.updateFileStatus({ isModified: false });
      statusStore.completeOperation('保存成功');
      showSuccess('文件保存成功');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '未知错误';
      eventBus.emit(EditorEvents.FILE_SAVED, { phase: 'error', error: errorMessage });
      console.error('Failed to save file', err);
      
      statusStore.failOperation('保存失败', errorMessage);
      showError(`保存失败: ${errorMessage}`);
    }
  },
  /**
   * 刷新当前目录的文件树
   */
  refreshCurrentDirectory: async () => {
    const { currentPath } = get();
    const statusStore = useStatusStore.getState();
    
    try {
      statusStore.startOperation('refresh', '刷新中...');
      
      if (currentPath) {
        // 如果有当前路径，刷新该目录
        const tree = await getFileTree(currentPath);
        set({ fileTree: tree, refreshKey: Date.now() });
        showSuccess('文件视图已刷新');
      } else {
        // 如果没有当前路径，尝试刷新根目录
        const api = (window as any).api;
        if (api && typeof api.getDefaultDirectory === 'function') {
          const defaultDir = await api.getDefaultDirectory();
          const tree = await getFileTree(defaultDir);
          set({ currentPath: defaultDir, fileTree: tree, refreshKey: Date.now() });
          showSuccess('文件视图已刷新');
        }
      }
      
      statusStore.completeOperation('刷新完成');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '未知错误';
      console.error('Failed to refresh directory', err);
      
      statusStore.failOperation('刷新失败', errorMessage);
      showError(`刷新失败: ${errorMessage}`);
    }
  },
  /**
   * 切换自动刷新状态
   */
  toggleAutoRefresh: () => {
    const { autoRefreshEnabled, autoRefreshTimer, currentPath } = get();
    
    if (autoRefreshTimer) {
      clearInterval(autoRefreshTimer);
    }
    
    const newEnabled = !autoRefreshEnabled;
    set({ autoRefreshEnabled: newEnabled, autoRefreshTimer: null });
    
    if (newEnabled && currentPath) {
      const timer = setInterval(async () => {
        try {
          const tree = await getFileTree(currentPath);
          set({ fileTree: tree });
        } catch (error) {
          console.error('Auto refresh failed:', error);
        }
      }, AUTO_REFRESH_INTERVAL);
      
      set({ autoRefreshTimer: timer });
      showInfo('自动刷新已启用');
    } else {
      showInfo('自动刷新已禁用');
    }
  },
}));
