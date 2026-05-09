import { create } from 'zustand';
import { FileState, FileNode, SolarWireSnippet } from '../../shared/types/file';
import { readFile } from '../../shared/utils/file-utils';
import { eventBus, EditorEvents } from '../../shared/utils/EventBus';
import { fileSystemService } from '../services/file-system-service';
import { useStatusStore } from './statusStore';
import { feedback } from './feedbackStore';
import { useEditorStore } from './editorStore';
import { syntaxErrorService } from '../services/syntax-error-service';
import { isTableFile } from '../../shared/utils/table-file-adapters';

const AUTO_REFRESH_INTERVAL = 30000;

const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico']);

function isImageFile(filePath: string): boolean {
  const ext = filePath.split('.').pop()?.toLowerCase() || '';
  return IMAGE_EXTENSIONS.has(ext);
}

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

export function replaceSolarWireSnippetInMarkdown(
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

  while ((match = solarwireBlockRegex.exec(markdownContent)) !== null) {
    currentIndex++;
    result += markdownContent.substring(lastIndex, match.index);

    if (currentIndex === snippetIndex) {
      found = true;
      result += '```solarwire\n' + newCode + '\n```';
    } else {
      result += match[0];
    }

    lastIndex = match.index + match[0].length;
  }

  result += markdownContent.substring(lastIndex);

  if (!found) {
    console.warn(`Snippet index ${snippetIndex} not found in markdown`);
    return markdownContent;
  }

  return result;
}

async function getFileTree(dirPath: string): Promise<FileNode[]> {
  const api = window.api;
  if (api && typeof api.getFileTree === 'function') {
    return await api.getFileTree(dirPath);
  }
  return [];
}

export const useFileStore = create<FileState>()((set, get) => ({
  currentPath: '',
  fileTree: [],
  selectedFile: null,
  selectedImage: null,
  fullFileContent: '',
  expandedDirectories: new Set(),
  currentSnippet: null,
  tableSheetData: null,
  autoRefreshEnabled: true,
  autoRefreshTimer: null,
  refreshKey: 0,

  setCurrentPath: (path: string) => set({ currentPath: path }),

  setFileTree: (tree: FileNode[]) => set({ fileTree: tree }),

  setSelectedFile: (file: FileNode | null) => set({ selectedFile: file, currentSnippet: null, selectedImage: null }),

  setSelectedImage: (image) => set({ selectedImage: image, selectedFile: null, currentSnippet: null }),

  setCurrentSnippet: (snippet: SolarWireSnippet | null) => set({ currentSnippet: snippet }),

  setTableSheetData: (data: any[] | null) => set({ tableSheetData: data }),

  toggleDirectory: (dirPath: string) => {
    const expanded = new Set(get().expandedDirectories);
    if (expanded.has(dirPath)) {
      expanded.delete(dirPath);
    } else {
      expanded.add(dirPath);
    }
    set({ expandedDirectories: expanded });
  },

  expandToPath: (filePath: string) => {
    const expanded = new Set(get().expandedDirectories);
    const parts = filePath.split(/[/\\]/);
    let currentPath = parts[0];
    for (let i = 1; i < parts.length - 1; i++) {
      currentPath = currentPath + '\\' + parts[i];
      expanded.add(currentPath);
    }
    set({ expandedDirectories: expanded });
  },

  syncFullFileContent: (editorContent: string) => {
    const { currentSnippet } = get();
    if (currentSnippet && currentSnippet.type === 'snippet' && currentSnippet.snippetIndex !== undefined) {
      const updated = replaceSolarWireSnippetInMarkdown(
        get().fullFileContent,
        currentSnippet.snippetIndex,
        editorContent
      );
      set({ fullFileContent: updated });
    } else {
      set({ fullFileContent: editorContent });
    }
  },

  openFileAtPath: async (filePath: string) => {
    const statusStore = useStatusStore.getState();
    const opId = feedback.operation.start('open', '打开文件中...');

    try {
      statusStore.setCurrentFilePath(filePath);

      eventBus.emit(EditorEvents.FILE_OPENED, { phase: 'start', filePath });

      const name = filePath.split(/[\\/]/).pop() || filePath;

      if (isImageFile(filePath)) {
        const node: FileNode = { name, path: filePath, type: 'file' };
        set({ selectedFile: node, selectedImage: { path: filePath } });
        eventBus.emit(EditorEvents.MODE_CHANGED, 'image');
        eventBus.emit(EditorEvents.FILE_OPENED, { phase: 'complete', fileName: name });

        feedback.operation.complete(opId, '已打开图片');
        feedback.toast.info(`已打开图片: ${name}`);
        return;
      }

      if (isTableFile(filePath)) {
        const node: FileNode = { name, path: filePath, type: 'file' };
        set({ selectedFile: node, selectedImage: null, currentSnippet: null });
        eventBus.emit(EditorEvents.MODE_CHANGED, 'table');
        statusStore.setCurrentFilePath(filePath);
        statusStore.updateEditorStatus({ mode: 'table' });
        statusStore.updateFileStatus({ isModified: false, lineCount: 0, encoding: 'UTF-8' });

        eventBus.emit(EditorEvents.FILE_OPENED, { phase: 'complete', fileName: name });
        feedback.operation.complete(opId, `已打开: ${name}`);
        feedback.toast.success(`文件已打开: ${name}`);
        return;
      }

      const content = await readFile(filePath);
      const node: FileNode = { name, path: filePath, type: 'file' };

      const lineCount = content.split('\n').length;
      statusStore.updateFileStatus({
        isModified: false,
        lineCount,
        encoding: 'UTF-8'
      });

      set({ selectedFile: node, fullFileContent: content, selectedImage: null, currentSnippet: null });

      const editorStore = useEditorStore.getState();
      editorStore.clearHistory();

      syntaxErrorService.clearAllErrors();

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
      feedback.operation.complete(opId, `已打开: ${name}`);
      feedback.toast.success(`文件已打开: ${name}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '未知错误';
      eventBus.emit(EditorEvents.FILE_OPENED, { phase: 'error', error: errorMessage });
      console.error('Failed to open file', err);

      feedback.operation.fail(opId, '打开文件失败', errorMessage);
      feedback.notify.error(`打开文件失败: ${errorMessage}`);
    }
  },

  openSolarWireSnippet: async (snippet: SolarWireSnippet) => {
    const statusStore = useStatusStore.getState();
    const opId = feedback.operation.start('open', '打开代码片段中...');

    try {

      const node: FileNode = { name: snippet.name, path: snippet.sourceFile, type: 'file' };

      const fullContent = await readFile(snippet.sourceFile);

      let snippetCode = snippet.code;
      if (snippet.snippetIndex !== undefined) {
        const extracted = extractSolarWireSnippetCode(fullContent, snippet.snippetIndex);
        if (extracted !== null) {
          snippetCode = extracted;
        }
      }

      set({ selectedFile: node, fullFileContent: fullContent, currentSnippet: snippet, selectedImage: null });

      const editorStore = useEditorStore.getState();
      editorStore.clearHistory();

      syntaxErrorService.clearAllErrors();

      eventBus.emit(EditorEvents.CONTENT_CHANGED, snippetCode);
      eventBus.emit(EditorEvents.MODE_CHANGED, 'solarwire');

      statusStore.setCurrentFilePath(snippet.sourceFile);
      statusStore.updateEditorStatus({ mode: 'solarwire' });
      statusStore.updateFileStatus({
        isModified: false,
        lineCount: snippetCode.split('\n').length
      });

      feedback.operation.complete(opId, `已打开: ${snippet.name}`);
      feedback.toast.info(`已打开代码片段: ${snippet.name}`);
    } catch (err) {
      console.error('Failed to open solarwire snippet', err);
      const errorMessage = err instanceof Error ? err.message : '未知错误';

      feedback.operation.fail(opId, '打开代码片段失败', errorMessage);
      feedback.notify.error(`打开代码片段失败: ${errorMessage}`);
    }
  },

  openDirectoryAtPath: async (dirPath: string) => {
    const statusStore = useStatusStore.getState();
    const opId = feedback.operation.start('open', '打开目录中...');

    try {
      eventBus.emit(EditorEvents.FILE_OPENED, { phase: 'start', filePath: dirPath });

      const api = window.api;
      if (api?.setAllowedRoot) {
        await api.setAllowedRoot(dirPath);
      }

      const tree = await getFileTree(dirPath);
      set({ currentPath: dirPath, fileTree: tree });
      eventBus.emit(EditorEvents.FILE_OPENED, { phase: 'set-path', filePath: dirPath });

      eventBus.emit(EditorEvents.FILE_OPENED, { phase: 'complete', fileName: dirPath });
      feedback.operation.complete(opId, `已打开目录: ${dirPath}`);
      feedback.toast.success(`目录已打开: ${dirPath}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '未知错误';
      eventBus.emit(EditorEvents.FILE_OPENED, { phase: 'error', error: errorMessage });
      console.error('Failed to open directory', err);

      feedback.operation.fail(opId, '打开目录失败', errorMessage);
      feedback.notify.error(`打开目录失败: ${errorMessage}`);
    }
  },

  saveFile: async () => {
    const { selectedFile, currentSnippet, fullFileContent, tableSheetData } = get();
    const editorStore = useEditorStore.getState();
    const editorContent = editorStore.content;
    const currentMode = editorStore.mode;
    const statusStore = useStatusStore.getState();

    if (!selectedFile) {
      console.error('No file selected');
      eventBus.emit(EditorEvents.FILE_SAVED, { phase: 'error', error: '没有选择文件' });

      feedback.operation.fail(feedback.operation.start('save', ''), '保存失败', '没有选择文件');
      feedback.notify.error('没有选择文件');
      return;
    }

    const opId = feedback.operation.start('save', '保存中...');

    try {
      eventBus.emit(EditorEvents.FILE_SAVED, { phase: 'start' });

      if (currentMode === 'table' && tableSheetData) {
        const result = await fileSystemService.saveTableFile(selectedFile.path, tableSheetData);
        if (!result.success) throw new Error(result.error || '保存失败');
        editorStore.setModified(false);
        eventBus.emit(EditorEvents.FILE_SAVED, { phase: 'complete' });
        statusStore.updateFileStatus({ isModified: false });
        feedback.operation.complete(opId, '保存成功');
        feedback.toast.success('文件保存成功');
        return;
      }

      const isSnippet = currentSnippet && currentSnippet.type === 'snippet';
      const hasSnippetIndex = currentSnippet && currentSnippet.snippetIndex !== undefined;
      let contentToSave: string;

      if (isSnippet && hasSnippetIndex) {
        if (!editorContent || editorContent.trim() === '') {
          throw new Error('代码块内容为空，无法保存');
        }
        const syncedContent = replaceSolarWireSnippetInMarkdown(
          fullFileContent,
          currentSnippet.snippetIndex ?? 0,
          editorContent
        );
        if (!syncedContent || syncedContent.trim() === '') {
          throw new Error('文件内容为空，无法保存');
        }
        contentToSave = syncedContent;
        set({ fullFileContent: syncedContent });
      } else {
        if (!editorContent || editorContent.trim() === '') {
          throw new Error('文件内容为空，无法保存');
        }
        contentToSave = editorContent;
        set({ fullFileContent: contentToSave });
      }

      await fileSystemService.writeFile(selectedFile.path, contentToSave);

      editorStore.setModified(false);

      eventBus.emit(EditorEvents.FILE_SAVED, { phase: 'complete' });

      statusStore.updateFileStatus({ isModified: false });
      feedback.operation.complete(opId, '保存成功');
      feedback.toast.success('文件保存成功');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '未知错误';
      eventBus.emit(EditorEvents.FILE_SAVED, { phase: 'error', error: errorMessage });
      console.error('Failed to save file', err);

      feedback.operation.fail(opId, '保存失败', errorMessage);
      feedback.notify.error(`保存失败: ${errorMessage}`);
    }
  },

  refreshCurrentDirectory: async () => {
    const { currentPath } = get();
    const statusStore = useStatusStore.getState();
    const opId = feedback.operation.start('refresh', '刷新中...');

    try {
      if (currentPath) {
        const tree = await getFileTree(currentPath);
        set({ fileTree: tree, refreshKey: Date.now() });
        feedback.toast.success('文件视图已刷新');
      } else {
        const api = window.api;
        if (api && typeof api.getDefaultDirectory === 'function') {
          const defaultDir = await api.getDefaultDirectory();
          const tree = await getFileTree(defaultDir);
          set({ currentPath: defaultDir, fileTree: tree, refreshKey: Date.now() });
          feedback.toast.success('文件视图已刷新');
        }
      }

      feedback.operation.complete(opId, '刷新完成');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '未知错误';
      console.error('Failed to refresh directory', err);

      feedback.operation.fail(opId, '刷新失败', errorMessage);
      feedback.notify.error(`刷新失败: ${errorMessage}`);
    }
  },

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
      feedback.toast.info('自动刷新已启用');
    } else {
      feedback.toast.info('自动刷新已禁用');
    }
  },
}));
