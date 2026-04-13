import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as path from 'path';
import * as fileManager from '../file-manager';

// 导入 fs/promises
import * as fs from 'fs/promises';

// Mock fs/promises module
vi.mock('fs/promises', () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
  mkdir: vi.fn(),
  readdir: vi.fn(),
  access: vi.fn()
}));

// 类型声明
declare module 'fs/promises' {
  const readFile: vi.Mock;
  const writeFile: vi.Mock;
  const mkdir: vi.Mock;
  const readdir: vi.Mock;
  const access: vi.Mock;
}
vi.mock('path', () => ({
  resolve: vi.fn((p) => p),
  normalize: vi.fn((p) => p),
  dirname: vi.fn((p) => '/project'),
  join: vi.fn((...args) => args.join('/')),
  extname: vi.fn((p) => p.includes('.') ? p.substring(p.lastIndexOf('.')) : ''),
  basename: vi.fn((p) => p.substring(p.lastIndexOf('/') + 1))
}));

// 类型声明
declare module 'fs/promises' {
  const readFile: vi.Mock;
  const writeFile: vi.Mock;
  const mkdir: vi.Mock;
  const readdir: vi.Mock;
  const access: vi.Mock;
}

describe('File Manager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set allowed root for testing
    fileManager.setAllowedRoot('/project');
  });

  it('should read file successfully', async () => {
    const mockContent = '# Test Content';
    fs.readFile.mockResolvedValue(mockContent);
    
    const content = await fileManager.readFile('/project/test.solarwire');
    expect(content).toBe(mockContent);
    expect(fs.readFile).toHaveBeenCalledWith('/project/test.solarwire', 'utf-8');
  });

  it('should handle file read error', async () => {
    const error = new Error('File not found');
    fs.readFile.mockRejectedValue(error);
    
    await expect(fileManager.readFile('/project/nonexistent.solarwire')).rejects.toThrow('Failed to read file: /project/nonexistent.solarwire');
  });

  it('should write file successfully', async () => {
    const content = '# Test Content';
    fs.writeFile.mockResolvedValue(undefined);
    fs.mkdir.mockResolvedValue(undefined);
    
    await fileManager.writeFile('/project/test.solarwire', content);
    expect(fs.writeFile).toHaveBeenCalledWith('/project/test.solarwire', content, 'utf-8');
  });

  it('should handle file write error', async () => {
    const error = new Error('Permission denied');
    fs.writeFile.mockRejectedValue(error);
    fs.mkdir.mockResolvedValue(undefined);
    
    await expect(fileManager.writeFile('/project/test.solarwire', 'content')).rejects.toThrow('Failed to write file: /project/test.solarwire');
  });

  it('should get file tree', async () => {
    fs.readdir.mockResolvedValue([
      { name: 'file1.solarwire', isDirectory: () => false }, 
      { name: 'subdir', isDirectory: () => true }
    ]);
    
    const tree = await fileManager.getFileTree('/project');
    expect(tree).toHaveLength(2);
  });

  it('should validate path safety', () => {
    // Test with allowed path
    expect(() => fileManager.validatePath('/project/subdir/file.solarwire')).not.toThrow();
    
    // Test with disallowed path
    // 这里我们需要修改 mock 的行为，因为 path.resolve 总是返回相同的路径
    // 我们可以直接测试 fileManager.validatePath 函数的行为
    expect(() => fileManager.validatePath('/other/file.solarwire')).toThrow('Access denied: Path outside project directory');
  });

  it('should list files successfully', async () => {
    const mockFiles = ['file1.solarwire', 'file2.solarwire', 'subdir'];
    fs.readdir.mockResolvedValue(mockFiles);
    
    const files = await fileManager.listFiles('/project');
    expect(files).toEqual(mockFiles);
    expect(fs.readdir).toHaveBeenCalledWith('/project');
  });

  it('should handle list files error', async () => {
    const error = new Error('Permission denied');
    fs.readdir.mockRejectedValue(error);
    
    await expect(fileManager.listFiles('/project')).rejects.toThrow('Failed to list files: /project');
  });

  it('should collect solarwire snippets', async () => {
    // Mock fs.readFile to return different content based on file path
    fs.readFile.mockImplementation((path: string) => {
      if (path === '/project/file1.solarwire') {
        return Promise.resolve('# SolarWire Content');
      } else if (path === '/project/file2.md') {
        return Promise.resolve('Some markdown content\n```solarwire\n# SolarWire Snippet\n```');
      }
      return Promise.resolve('');
    });
    
    // Mock fs.readdir for getFileTree
    fs.readdir.mockResolvedValue([
      { name: 'file1.solarwire', isDirectory: () => false },
      { name: 'file2.md', isDirectory: () => false }
    ]);
    
    const snippets = await fileManager.collectSolarWireSnippets('/project');
    expect(snippets).toHaveLength(2);
  });

  it('should handle collect solarwire snippets error', async () => {
    // Mock fs.readdir to throw an error
    fs.readdir.mockRejectedValue(new Error('Permission denied'));
    
    const snippets = await fileManager.collectSolarWireSnippets('/project');
    expect(snippets).toEqual([]);
  });

  it('should collect solarwire snippets from directory tree', async () => {
    // Mock fs.readFile to return content for solarwire file
    fs.readFile.mockResolvedValue('# SolarWire Content');
    
    // Mock fs.readdir for getFileTree
    fs.readdir
      .mockResolvedValueOnce([
        { name: 'subdir', isDirectory: () => true },
        { name: 'file.solarwire', isDirectory: () => false }
      ])
      .mockResolvedValueOnce([
        { name: 'nested.solarwire', isDirectory: () => false }
      ]);
    
    const snippets = await fileManager.collectSolarWireSnippets('/project');
    expect(snippets).toHaveLength(2);
  });

  it('should handle extract solarwire from file error', async () => {
    // Mock fs.readFile to throw an error
    fs.readFile.mockRejectedValue(new Error('Permission denied'));
    
    // Mock fs.readdir for getFileTree
    fs.readdir.mockResolvedValue([
      { name: 'file.solarwire', isDirectory: () => false }
    ]);
    
    const snippets = await fileManager.collectSolarWireSnippets('/project');
    expect(snippets).toEqual([]);
  });

  it('should not collect snippets from non-solarwire files', async () => {
    // Mock fs.readFile to return content for non-solarwire file
    fs.readFile.mockResolvedValue('Some text content');
    
    // Mock fs.readdir for getFileTree
    fs.readdir.mockResolvedValue([
      { name: 'file.txt', isDirectory: () => false }
    ]);
    
    const snippets = await fileManager.collectSolarWireSnippets('/project');
    expect(snippets).toEqual([]);
  });

  it('should handle empty solarwire block in markdown', async () => {
    // Mock fs.readFile to return markdown with empty solarwire block
    fs.readFile.mockResolvedValue('Some markdown content\n```solarwire\n\n```');
    
    // Mock fs.readdir for getFileTree
    fs.readdir.mockResolvedValue([
      { name: 'file.md', isDirectory: () => false }
    ]);
    
    const snippets = await fileManager.collectSolarWireSnippets('/project');
    expect(snippets).toEqual([]);
  });
});
