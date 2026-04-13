import { describe, it, expect, vi } from 'vitest';
import * as fileUtils from '../file-utils';

describe('File Utils', () => {
  it('should validate file extension', () => {
    expect(fileUtils.isValidFileExtension('test.solarwire')).toBe(true);
    expect(fileUtils.isValidFileExtension('test.md')).toBe(true);
    expect(fileUtils.isValidFileExtension('test.txt')).toBe(false);
  });

  it('should get file extension', () => {
    expect(fileUtils.getFileExtension('test.solarwire')).toBe('solarwire');
    expect(fileUtils.getFileExtension('test.md')).toBe('md');
    expect(fileUtils.getFileExtension('test')).toBe('');
  });

  it('should get file name without extension', () => {
    expect(fileUtils.getFileNameWithoutExtension('test.solarwire')).toBe('test');
    expect(fileUtils.getFileNameWithoutExtension('path/to/test.md')).toBe('test');
  });

  it('should join paths safely', () => {
    const result = fileUtils.safeJoin('C:/project', 'subdir', 'file.solarwire');
    expect(result).toContain('project\\subdir\\file.solarwire') || expect(result).toContain('project/subdir/file.solarwire');
  });

  it('should validate path safety', () => {
    expect(fileUtils.isPathSafe('C:/project/file.solarwire', 'C:/project')).toBe(true);
    expect(fileUtils.isPathSafe('C:/other/file.solarwire', 'C:/project')).toBe(false);
  });

  it('should detect absolute path', () => {
    expect(fileUtils.isAbsolutePath('C:/project/file.solarwire')).toBe(true);
    expect(fileUtils.isAbsolutePath('./relative/path')).toBe(false);
  });

  it('should normalize path', () => {
    const result = fileUtils.normalizePath('C:/project//subdir/../file.solarwire');
    expect(result).toBe('C:\\project\\file.solarwire') || expect(result).toBe('C:/project/file.solarwire');
  });

  it('should get directory from path', () => {
    expect(fileUtils.getDirectory('C:/project/file.solarwire')).toBe('C:/project');
    expect(fileUtils.getDirectory('file.solarwire')).toBe('.');
  });

  it('should read file using API', async () => {
    const mockApi = {
      readFile: vi.fn().mockResolvedValue('test content')
    };
    (window as any).api = mockApi;

    const content = await fileUtils.readFile('test.solarwire');
    expect(content).toBe('test content');
    expect(mockApi.readFile).toHaveBeenCalledWith('test.solarwire');
  });

  it('should write file using API', async () => {
    const mockApi = {
      writeFile: vi.fn().mockResolvedValue(undefined)
    };
    (window as any).api = mockApi;

    await fileUtils.writeFile('test.solarwire', 'test content');
    expect(mockApi.writeFile).toHaveBeenCalledWith('test.solarwire', 'test content');
  });

  it('should fall back to ipcRenderer if API not available', async () => {
    (window as any).api = undefined;
    
    const mockIpcRenderer = {
      invoke: vi.fn().mockResolvedValue('test content')
    };
    
    vi.doMock('electron', () => ({
      ipcRenderer: mockIpcRenderer
    }));

    const { readFile } = await import('../file-utils');
    const content = await readFile('test.solarwire');
    expect(content).toBe('test content');
  });
});
