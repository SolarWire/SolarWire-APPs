import '@testing-library/jest-dom';

// 只在测试环境中定义 mock
if (process.env.NODE_ENV === 'test') {
  Object.defineProperty(window, 'api', {
    value: {
      readFile: (globalThis as any).vi?.fn() || (() => Promise.resolve('')),
      writeFile: (globalThis as any).vi?.fn() || (() => Promise.resolve()),
      openFile: (globalThis as any).vi?.fn() || (() => Promise.resolve()),
      saveFile: (globalThis as any).vi?.fn() || (() => Promise.resolve()),
      initGitRepo: (globalThis as any).vi?.fn() || (() => Promise.resolve()),
      getGitStatus: (globalThis as any).vi?.fn() || (() => Promise.resolve({ modified: [], staged: [], untracked: [] })),
      gitCommit: (globalThis as any).vi?.fn() || (() => Promise.resolve()),
      gitCheckoutBranch: (globalThis as any).vi?.fn() || (() => Promise.resolve()),
      gitLog: (globalThis as any).vi?.fn() || (() => Promise.resolve([]))
    },
    writable: true
  });
}

