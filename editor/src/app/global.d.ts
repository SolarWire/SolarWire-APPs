export {};

declare global {
  interface Window {
    api: {
      readFile: (filePath: string) => Promise<string>;
      writeFile: (filePath: string, content: string) => Promise<any>;
      openFileDialog: (options?: unknown) => Promise<string[]>;
    };
    __graphvizBlocks?: Array<{ index: number; code: string }>;
  }
}
