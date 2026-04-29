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

export interface FileState {
  currentPath: string;
  fileTree: FileNode[];
  selectedFile: FileNode | null;
  selectedImage: { path: string } | null;
  fileContent: string;
  expandedDirectories: Set<string>;
  currentSnippet: SolarWireSnippet | null;
  setCurrentPath: (path: string) => void;
  setFileTree: (tree: FileNode[]) => void;
  setSelectedFile: (file: FileNode | null) => void;
  setSelectedImage: (image: { path: string } | null) => void;
  setCurrentSnippet: (snippet: SolarWireSnippet | null) => void;
  setFileContent: (content: string) => void;
  updateFileContent: (file: FileNode | string, content: string) => void;
  openFileAtPath?: (filePath: string) => Promise<void>;
  openSolarWireSnippet?: (snippet: SolarWireSnippet) => Promise<void>;
  openDirectoryAtPath?: (dirPath: string) => Promise<void>;
  toggleDirectory?: (dirPath: string) => void;
  saveFile: () => Promise<void>;
}
