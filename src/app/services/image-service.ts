/**
 * 图片服务接口
 * 用于解耦组件与 Electron 图片 API 的直接依赖
 */
export interface IImageService {
  readImageAsBase64(filePath: string): Promise<string>;
  saveImage(filePath: string, content: string | Uint8Array): Promise<void>;
}

/**
 * Electron 图片服务实现
 */
export class ElectronImageService implements IImageService {
  async readImageAsBase64(filePath: string): Promise<string> {
    const api = (window as any).api;
    if (!api || !api.readImageAsBase64) {
      throw new Error('Image API not available');
    }
    return await api.readImageAsBase64(filePath);
  }

  async saveImage(filePath: string, content: string | Uint8Array): Promise<void> {
    const api = (window as any).api;
    if (!api || !api.writeFile) {
      throw new Error('File API not available');
    }
    await api.writeFile(filePath, content);
  }
}

// 单例实例
export const imageService = new ElectronImageService();
