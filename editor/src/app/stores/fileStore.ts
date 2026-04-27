import { create } from 'zustand';
import { FileState, FileNode, SolarWireSnippet } from '../../shared/types/file';
import { readFile } from '../../shared/utils/file-utils';
import { useEditorStore } from './editorStore';
import { useStatusStore } from './statusStore';

const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico']);

function isImageFile(filePath: string): boolean {
  const ext = filePath.split('.').pop()?.toLowerCase() || '';
  return IMAGE_EXTENSIONS.has(ext);
}

async function writeFile(filePath: string, content: string): Promise<void> {
  const api = (window as any).api;
  if (api && typeof api.writeFile === 'function') {
    return await api.writeFile(filePath, content);
  }
  throw new Error('writeFile API not available');
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

function replaceSolarWireSnippetInMarkdown(
  markdownContent: string,
  snippetIndex: number,
  newCode: string
): string {
  const solarwireBlockRegex = /```solarwire\s*([\s\S]*?)```/g;
  let match;
  let currentIndex = 0;
  let result = '';
  let found = false;

  while ((match = solarwireBlockRegex.exec(markdownContent)) !== null) {
    currentIndex++;
    if (currentIndex === snippetIndex) {
      found = true;
      result += markdownContent.substring(0, match.index);
      result += '```solarwire\n' + newCode + '\n```';
      result += markdownContent.substring(match.index + match[0].length);
      break;
    }
  }

  if (!found) {
    return markdownContent;
  }

  return result;
}

async function getFileTree(dirPath: string): Promise<FileNode[]> {
  const api = (window as any).api;
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
  fileContent: '',
  expandedDirectories: new Set(),
  currentSnippet: null,
  setCurrentPath: (path: string) => set({ currentPath: path }),
  setFileTree: (tree: FileNode[]) => set({ fileTree: tree }),
  setSelectedFile: (file: FileNode | null) => set({ selectedFile: file, currentSnippet: null, selectedImage: null }),
  setSelectedImage: (image) => set({ selectedImage: image, selectedFile: null, currentSnippet: null }),
  setCurrentSnippet: (snippet: SolarWireSnippet | null) => set({ currentSnippet: snippet }),
  setFileContent: (content: string) => {
    set({ fileContent: content });
    useEditorStore.getState().setContent(content);
  },
  updateFileContent: (file: FileNode | string, content: string) => {
    set({ fileContent: content });
  },
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
    try {
      useStatusStore.getState().startOperation('open', '打开文件...');

      const name = filePath.split(/[\\/]/).pop() || filePath;

      if (isImageFile(filePath)) {
        const node: FileNode = { name, path: filePath, type: 'file' };
        set({ selectedImage: { path: filePath } });
        useEditorStore.getState().setMode('image');
        useStatusStore.getState().completeOperation(`已打开: ${name}`);
        return;
      }

      const content = await readFile(filePath);
      const node: FileNode = { name, path: filePath, type: 'file' };
      set({ selectedFile: node, fileContent: content, selectedImage: null });
      useEditorStore.getState().setContent(content);
      useEditorStore.getState().setModified(false);
      useStatusStore.getState().setCurrentFilePath(filePath);
      
      try {
        const parts = name.split('.');
        const ext = parts.length > 1 ? parts.pop()!.toLowerCase() : '';
        if (ext === 'md' || ext === 'markdown' || ext === 'txt') {
          useEditorStore.getState().setMode('markdown');
        } else if (ext === 'sw' || ext === 'solarwire') {
          useEditorStore.getState().setMode('solarwire');
        } else {
          useEditorStore.getState().setMode('markdown');
        }
      } catch (e) {
        // ignore
      }
      
      useStatusStore.getState().completeOperation(`已打开: ${name}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '未知错误';
      useStatusStore.getState().failOperation('打开文件失败', errorMessage);
      console.error('Failed to open file', err);
    }
  },
  openSolarWireSnippet: async (snippet: SolarWireSnippet) => {
    try {
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
      useEditorStore.getState().setContent(latestCode);
      useEditorStore.getState().setModified(false);
      useEditorStore.getState().setMode('solarwire');
    } catch (err) {
      console.error('Failed to open solarwire snippet', err);
    }
  },
  openDirectoryAtPath: async (dirPath: string) => {
    try {
      useStatusStore.getState().startOperation('open', '打开目录...');

      const api = (window as any).api;
      if (api?.setAllowedRoot) {
        await api.setAllowedRoot(dirPath);
      }

      const tree = await getFileTree(dirPath);
      set({ currentPath: dirPath, fileTree: tree });
      useStatusStore.getState().setCurrentFilePath(dirPath);
      
      useStatusStore.getState().completeOperation('目录已打开');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '未知错误';
      useStatusStore.getState().failOperation('打开目录失败', errorMessage);
      console.error('Failed to open directory', err);
    }
  },
  saveFile: async () => {
    const { selectedFile, currentSnippet, fileContent } = get();
    const editorState = useEditorStore.getState();
    if (!selectedFile) {
      console.error('No file selected');
      useStatusStore.getState().failOperation('保存失败', '没有选择文件');
      return;
    }
    try {
      useStatusStore.getState().startOperation('save', '保存中...');
      
      let contentToSave = editorState.content;
      
      // 检查是否正在编辑一个 snippet
      const isSnippet = currentSnippet && currentSnippet.type === 'snippet';
      const hasSnippetIndex = currentSnippet && currentSnippet.snippetIndex !== undefined;
      
      // 如果当前正在编辑的是一个 snippet，就只替换对应的代码块
      if (isSnippet && hasSnippetIndex) {
        const originalContent = await readFile(selectedFile.path);
        contentToSave = replaceSolarWireSnippetInMarkdown(
          originalContent,
          currentSnippet.snippetIndex ?? 0,
          editorState.content
        );
      }
      
      await writeFile(selectedFile.path, contentToSave);
      
      set({ fileContent: contentToSave });
      useEditorStore.getState().setModified(false);
      useStatusStore.getState().completeOperation('保存成功');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '未知错误';
      useStatusStore.getState().failOperation('保存失败', errorMessage);
      console.error('Failed to save file', err);
    }
  },
}));
