import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useGitStore } from '../gitStore';

// Mock window.api
const mockGitApi = {
  init: vi.fn(),
  getStatus: vi.fn(),
  commit: vi.fn(),
  checkoutBranch: vi.fn(),
  getLog: vi.fn(),
  push: vi.fn(),
  pull: vi.fn(),
  getBranches: vi.fn(),
  getCurrentBranch: vi.fn()
};

Object.defineProperty(window, 'api', {
  value: {
    git: mockGitApi
  },
  writable: true
});

describe('gitStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useGitStore.setState({
      status: { modified: [], staged: [], untracked: [] },
      history: [],
      branches: [],
      currentBranch: '',
      loading: false,
      error: null
    });
  });

  it('should initialize with empty state', () => {
    const state = useGitStore.getState();
    expect(state.status.modified).toEqual([]);
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('should refresh status successfully', async () => {
    const mockStatus = {
      modified: ['file1.txt'],
      staged: [],
      untracked: []
    };
    mockGitApi.getStatus.mockResolvedValue(mockStatus);
    
    await useGitStore.getState().refreshStatus();
    
    const state = useGitStore.getState();
    expect(state.status.modified).toContain('file1.txt');
    expect(state.loading).toBe(false);
  });

  it('should handle commit success', async () => {
    mockGitApi.commit.mockResolvedValue(undefined);
    mockGitApi.getStatus.mockResolvedValue({
      modified: [],
      staged: [],
      untracked: []
    });
    mockGitApi.getLog.mockResolvedValue([]);
    
    await useGitStore.getState().commit('Test commit');
    
    expect(mockGitApi.commit).toHaveBeenCalledWith('Test commit');
    expect(useGitStore.getState().loading).toBe(false);
  });

  it('should handle commit failure with error state', async () => {
    const errorMessage = 'Merge conflict';
    mockGitApi.commit.mockRejectedValue(new Error(errorMessage));
    
    try {
      await useGitStore.getState().commit('Bad commit');
    } catch (error) {
      // 预期会抛出错误
    }
    
    const state = useGitStore.getState();
    expect(state.error).toBe(errorMessage);
    expect(state.loading).toBe(false);
  });

  it('should prevent concurrent operations with lock', async () => {
    mockGitApi.commit.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    // 启动第一个操作
    const promise1 = useGitStore.getState().commit('First');
    
    // 立即尝试第二个操作
    await expect(useGitStore.getState().commit('Second')).rejects.toThrow(/operation in progress/i);
    
    await promise1;
  });

  it('should retry failed operations', async () => {
    // 前两次失败,第三次成功
    mockGitApi.push
      .mockRejectedValueOnce(new Error('Network error'))
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce(undefined);
    mockGitApi.getStatus.mockResolvedValue({ modified: [], staged: [], untracked: [] });
    
    await useGitStore.getState().push();
    
    expect(mockGitApi.push).toHaveBeenCalledTimes(3);
    expect(useGitStore.getState().error).toBeNull();
  });

  it('should clear error on demand', async () => {
    mockGitApi.commit.mockRejectedValue(new Error('Test error'));
    
    try {
      await useGitStore.getState().commit('Fail');
    } catch (error) {
      // 预期会抛出错误
    }
    expect(useGitStore.getState().error).not.toBeNull();
    
    useGitStore.getState().clearError();
    expect(useGitStore.getState().error).toBeNull();
  });
});
