export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
  modifiedTime?: number; // 文件/文件夹修改时间（时间戳）
}

export interface SolarWireSnippet {
  id: string;
  name: string;
  sourceFile: string;
  code: string;
  type: 'file' | 'snippet';
  snippetIndex?: number;
}

export interface SnippetInfo {
  id: string;
  snippetIndex: number;
  title: string;
}

export interface FileState {
  currentPath: string;
  fileTree: FileNode[];
  selectedFile: FileNode | null;
  selectedImage: { path: string } | null;
  fullFileContent: string;
  expandedDirectories: Set<string>;
  currentSnippet: SolarWireSnippet | null;
  tableSheetData: any[] | null;
  autoRefreshEnabled: boolean;
  autoRefreshTimer: NodeJS.Timeout | null;
  refreshKey: number;
  snippetsByFile: Record<string, SolarWireSnippet[]>;
  snippetInfosByFile: Record<string, SnippetInfo[]>;
  setCurrentPath: (path: string) => void;
  setFileTree: (tree: FileNode[]) => void;
  setSelectedFile: (file: FileNode | null) => void;
  setSelectedImage: (image: { path: string } | null) => void;
  setCurrentSnippet: (snippet: SolarWireSnippet | null) => void;
  setTableSheetData: (data: any[] | null) => void;
  syncFullFileContent: (editorContent: string) => void;
  openFileAtPath?: (filePath: string) => Promise<void>;
  openSolarWireSnippet?: (snippet: SolarWireSnippet) => Promise<void>;
  openDirectoryAtPath?: (dirPath: string) => Promise<void>;
  toggleDirectory?: (dirPath: string) => void;
  expandToPath?: (filePath: string) => void;
  saveFile: () => Promise<void>;
  refreshCurrentDirectory: () => Promise<void>;
  toggleAutoRefresh: () => void;
  setSnippetsByFile: (data: Record<string, SolarWireSnippet[]>) => void;
  setSnippetInfosByFile: (data: Record<string, SnippetInfo[]>) => void;
}
