/**
 * 版本历史缓存系统（LRU 策略）
 */

import { GitCommit, VersionAnalysisContext } from '../types/version';

/**
 * 缓存项接口
 */
interface VersionCacheItem {
  /**
   * 匹配的提交列表
   */
  commits: GitCommit[];
  
  /**
   * 缓存时间戳
   */
  timestamp: number;
  
  /**
   * 已分析的提交数量
   */
  analyzedCount: number;
  
  /**
   * 分析上下文
   */
  context: VersionAnalysisContext;
}

/**
 * 版本历史缓存类
 */
class VersionCache {
  private cache = new Map<string, VersionCacheItem>();
  private readonly MAX_SIZE = 100; // 最多缓存 100 个文件
  private readonly TTL = 1000 * 60 * 30; // 30 分钟过期

  /**
   * 构建缓存 Key
   * @param filePath 文件路径
   * @param snippet 代码块信息（可选）
   * @param title !title 标识
   */
  buildCacheKey(
    filePath: string,
    snippet: { code: string; snippetIndex: number } | undefined,
    title: string
  ): string {
    if (snippet) {
      return `${filePath}:${snippet.snippetIndex}:${title}`;
    }
    return `${filePath}:${title}`;
  }

  /**
   * 获取缓存
   * @param key 缓存 Key
   * @returns 缓存项，如果不存在或已过期则返回 null
   */
  get(key: string): VersionCacheItem | null {
    const item = this.cache.get(key);
    if (!item) return null;
    
    // 检查是否过期
    if (Date.now() - item.timestamp > this.TTL) {
      this.cache.delete(key);
      return null;
    }
    
    return item;
  }

  /**
   * 设置缓存
   * @param key 缓存 Key
   * @param value 缓存项
   */
  set(key: string, value: VersionCacheItem): void {
    // 如果缓存已满，删除最旧的
    if (this.cache.size >= this.MAX_SIZE) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
    
    this.cache.set(key, value);
  }

  /**
   * 使缓存失效（文件变化时调用）
   * @param filePath 文件路径
   */
  invalidate(filePath: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(filePath)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * 清空缓存
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * 获取缓存统计信息
   * @returns 缓存大小和所有 Key
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  /**
   * 清理过期缓存
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > this.TTL) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * 预热缓存（批量设置初始缓存）
   * @param items 预热的缓存项数组
   */
  warmup(items: Array<{ key: string; value: VersionCacheItem }>): void {
    for (const { key, value } of items) {
      this.set(key, value);
    }
  }

  /**
   * 检查缓存是否命中
   * @param key 缓存 Key
   * @returns 是否命中
   */
  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;
    
    // 检查是否过期
    if (Date.now() - item.timestamp > this.TTL) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * 获取缓存命中率
   * @returns 命中率（0-1 之间）
   */
  getHitRate(): number {
    const total = this.cache.size;
    if (total === 0) return 0;
    
    const now = Date.now();
    let validCount = 0;
    
    for (const item of this.cache.values()) {
      if (now - item.timestamp <= this.TTL) {
        validCount++;
      }
    }
    
    return validCount / total;
  }
}

// 单例模式
const versionCache = new VersionCache();

// 定期清理过期缓存（每 5 分钟）
if (typeof window !== 'undefined') {
  setInterval(() => {
    versionCache.cleanup();
  }, 5 * 60 * 1000);
}

export { versionCache };
export type { VersionCacheItem };
