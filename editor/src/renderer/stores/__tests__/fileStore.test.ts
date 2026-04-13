import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useFileStore } from '../fileStore';
import { useEditorStore } from '../editorStore';

const mockApi = {
  readFile: vi.fn(),
  writeFile: vi.fn(),
  getFileTree: vi.fn(),
  openFile: vi.fn()
};

Object.defineProperty(window, 'api', {
  value: mockApi,
  writable: true
});

describe('fileStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useFileStore.setState({
      fileTree: [],
      selectedFile: null,
      fileContent: ''
    });
    useEditorStore.setState({
      content: '',
      isModified: false
    });
  });

  it('should load file and sync with editorStore', async () => {
    const mockContent = '# Test Content';
    mockApi.readFile.mockResolvedValue(mockContent);
    
    await useFileStore.getState().openFileAtPath('/test/file.md');
    
    const fileState = useFileStore.getState();
    const editorState = useEditorStore.getState();
    
    expect(fileState.fileContent).toBe(mockContent);
    expect(editorState.content).toBe(mockContent); // ✅ 验证同步
    expect(fileState.selectedFile).not.toBeNull();
  });

  it('should save file with current editor content', async () => {
    useFileStore.setState({ 
      selectedFile: { name: 'file.md', path: '/test/file.md', type: 'file' },
      currentSnippet: null
    });
    useEditorStore.getState().setContent('# Modified');
    useEditorStore.getState().setModified(true);
    
    await useFileStore.getState().saveFile();
    
    expect(mockApi.writeFile).toHaveBeenCalledWith(
      '/test/file.md',
      '# Modified'
    );
  });

  it('should reject save when no file is open', async () => {
    useFileStore.setState({ selectedFile: null });
    
    await useFileStore.getState().saveFile();
    
    expect(mockApi.writeFile).not.toHaveBeenCalled();
  });

  it('should update file tree', async () => {
    const mockTree = [
      { name: 'file1.md', path: '/root/file1.md', type: 'file' },
      { name: 'folder', path: '/root/folder', type: 'directory' }
    ];
    mockApi.getFileTree.mockResolvedValue(mockTree);
    
    await useFileStore.getState().openDirectoryAtPath('/root');
    
    expect(useFileStore.getState().fileTree).toEqual(mockTree);
  });

  it('should mark file as modified when content changes', () => {
    useEditorStore.getState().setContent('New content');
    
    expect(useEditorStore.getState().isModified).toBe(true);
  });
});
