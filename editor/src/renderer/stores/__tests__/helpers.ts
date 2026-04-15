import { vi } from 'vitest';

/**
 * 创建 Mock API 对象
 */
export function createMockApi(methods: Record<string, any>) {
  const mockApi: Record<string, ReturnType<typeof vi.fn>> = {};
  
  Object.keys(methods).forEach(key => {
    mockApi[key] = vi.fn(methods[key]);
  });
  
  Object.defineProperty(window, 'api', {
    value: mockApi,
    writable: true
  });
  
  return mockApi;
}

/**
 * 创建 Mock Git API 对象
 */
export function createMockGitApi(methods: Record<string, any>) {
  const mockGitApi: Record<string, ReturnType<typeof vi.fn>> = {};
  
  Object.keys(methods).forEach(key => {
    mockGitApi[key] = vi.fn(methods[key]);
  });
  
  Object.defineProperty(window, 'api', {
    value: {
      git: mockGitApi
    },
    writable: true
  });
  
  return mockGitApi;
}

/**
 * 重置所有 Store 到初始状态
 */
export function resetAllStores() {
  // 导入并重置每个 store
  // 这需要在实际使用时根据 store 导出调整
}
