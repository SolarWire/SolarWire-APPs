export {};

declare global {
  interface Window {
    __graphvizBlocks?: Array<{ index: number; code: string }>;
  }
}
