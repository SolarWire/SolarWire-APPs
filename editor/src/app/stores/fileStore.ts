import { create } from 'zustand';
import { FileState, FileNode, SolarWireSnippet } from '../types/file';
import { readFile } from '../../shared/utils/file-utils';
import { useEditorStore } from './editorStore';
import { useGitStore } from './gitStore';

async function writeFile(filePath: string, content: string): Promise<void> {
  const api = (window as any).api;
  if (api && typeof api.writeFile === 'function') {
    return await api.writeFile(filePath, content);
  }
  throw new Error('writeFile API not available');
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

export const useFileStore = create<FileState>((set, get) => ({
  currentPath: '',
  fileTree: [],
  selectedFile: null,
  fileContent: '',
  expandedDirectories: new Set(),
  currentSnippet: null,
  setCurrentPath: (path: string) => set({ currentPath: path }),
  setFileTree: (tree: FileNode[]) => set({ fileTree: tree }),
  setSelectedFile: (file: FileNode | null) => set({ selectedFile: file, currentSnippet: null }),
  setCurrentSnippet: (snippet: SolarWireSnippet | null) => set({ currentSnippet: snippet }),
  setFileContent: (content: string) => {
    set({ fileContent: content });
    useEditorStore.getState().setContent(content);
  },
  updateFileContent: (file: FileNode | string, content: string) => {
    set({ fileContent: content });
    useEditorStore.getState().setContent(content);
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
      const content = await readFile(filePath);
      const name = filePath.split(/[\\/]/).pop() || filePath;
      const node: FileNode = { name, path: filePath, type: 'file' };
      set({ selectedFile: node, fileContent: content });
      useEditorStore.getState().setContent(content);
      useEditorStore.getState().setModified(false);
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
    } catch (err) {
      console.error('Failed to open file', err);
    }
  },
  openSolarWireSnippet: async (snippet: SolarWireSnippet) => {
    try {
      const node: FileNode = { name: snippet.name, path: snippet.sourceFile, type: 'file' };
      set({ selectedFile: node, fileContent: snippet.code, currentSnippet: snippet });
      useEditorStore.getState().setContent(snippet.code);
      useEditorStore.getState().setModified(false);
      useEditorStore.getState().setMode('solarwire');
    } catch (err) {
      console.error('Failed to open solarwire snippet', err);
    }
  },
  openDirectoryAtPath: async (dirPath: string) => {
    try {
      const tree = await getFileTree(dirPath);
      set({ currentPath: dirPath, fileTree: tree });
      
      // Initialize Git for this directory
      const gitStore = useGitStore.getState();
      await gitStore.initGit(dirPath);
    } catch (err) {
      console.error('Failed to open directory', err);
    }
  },
  saveFile: async () => {
    const { selectedFile, currentSnippet, fileContent } = get();
    const editorState = useEditorStore.getState();
    if (!selectedFile) {
      console.error('No file selected');
      return;
    }
    try {
      let contentToSave = editorState.content;
      
      // 检查是否正在编辑一个 snippet
      const isSnippet = currentSnippet && currentSnippet.type === 'snippet';
      const hasSnippetIndex = currentSnippet && currentSnippet.snippetIndex !== undefined;
      
      console.log('saveFile:', { isSnippet, hasSnippetIndex, currentSnippet });
      
      // 如果当前正在编辑的是一个 snippet，就只替换对应的代码块
      if (isSnippet && hasSnippetIndex) {
        // 读取原始的 md 文件内容
        const originalContent = await readFile(selectedFile.path);
        console.log('Original content length:', originalContent.length);
        // 替换对应的 solarwire 代码块
        contentToSave = replaceSolarWireSnippetInMarkdown(
          originalContent,
          currentSnippet.snippetIndex,
          editorState.content
        );
        console.log('Modified content length:', contentToSave.length);
      }
      
      await writeFile(selectedFile.path, contentToSave);
      
      // 更新 fileContent，但保持 currentSnippet 不变
      set({ fileContent: contentToSave });
      
      useEditorStore.getState().setModified(false);
    } catch (err) {
      console.error('Failed to save file', err);
    }
  },
}));
