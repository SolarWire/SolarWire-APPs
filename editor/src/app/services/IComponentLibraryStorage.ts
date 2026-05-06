import { ComponentLibrary } from '../../shared/types/component';

/**
 * 组件库存储接口
 * 用于解耦 ComponentLibraryManager 与具体存储实现
 */
export interface IComponentLibraryStorage {
  /**
   * 初始化存储
   */
  init(): Promise<void>;

  /**
   * 获取所有组件库
   */
  getAllLibraries(): Promise<ComponentLibrary[]>;

  /**
   * 保存组件库
   */
  saveLibrary(library: ComponentLibrary): Promise<void>;

  /**
   * 删除组件库
   */
  deleteLibrary(id: string): Promise<void>;

  /**
   * 获取单个组件库
   */
  getLibrary(id: string): Promise<ComponentLibrary | null>;

  /**
   * 检查组件库是否存在
   */
  hasLibrary(id: string): Promise<boolean>;
}
