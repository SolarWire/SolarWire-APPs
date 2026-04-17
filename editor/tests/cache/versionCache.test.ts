/**
 * VersionCache 测试
 */

import { versionCache } from './versionCache';

describe('versionCache', () => {
  beforeEach(() => {
    versionCache.clear();
  });

  test('should build cache key correctly for solarwire file', () => {
    const key = versionCache.buildCacheKey('test.solarwire', undefined, 'Test Title');
    expect(key).toBe('test.solarwire:Test Title');
  });

  test('should build cache key correctly for markdown snippet', () => {
    const snippet = { code: '!title=Test', snippetIndex: 0 };
    const key = versionCache.buildCacheKey('test.md', snippet, 'Test Title');
    expect(key).toBe('test.md:0:Test Title');
  });

  test('should set and get cache', () => {
    const key = 'test:key';
    const value = {
      commits: [{ hash: 'abc123', shortHash: 'abc', date: '2024-01-01', message: 'test', authorName: 'test' }],
      timestamp: Date.now(),
      analyzedCount: 10,
      context: { type: 'solarwire-file' as const, filePath: 'test.solarwire', title: 'Test' }
    };

    versionCache.set(key, value);
    const retrieved = versionCache.get(key);

    expect(retrieved).not.toBeNull();
    expect(retrieved?.commits).toHaveLength(1);
    expect(retrieved?.commits[0].hash).toBe('abc123');
  });

  test('should return null for expired cache', () => {
    const key = 'test:expired';
    const value = {
      commits: [],
      timestamp: Date.now() - 31 * 60 * 1000, // 31 分钟前
      analyzedCount: 0,
      context: { type: 'solarwire-file' as const, filePath: 'test.solarwire', title: 'Test' }
    };

    // 直接设置到 cache 中（绕过 TTL 检查）
    (versionCache as any).cache.set(key, value);

    const retrieved = versionCache.get(key);
    expect(retrieved).toBeNull();
  });

  test('should invalidate cache by file path', () => {
    const key1 = 'test.md:0:Title1';
    const key2 = 'test.md:1:Title2';
    const key3 = 'other.md:0:Title3';

    versionCache.set(key1, {
      commits: [],
      timestamp: Date.now(),
      analyzedCount: 0,
      context: { type: 'markdown-snippet' as const, filePath: 'test.md', title: 'Title1' }
    });
    versionCache.set(key2, {
      commits: [],
      timestamp: Date.now(),
      analyzedCount: 0,
      context: { type: 'markdown-snippet' as const, filePath: 'test.md', title: 'Title2' }
    });
    versionCache.set(key3, {
      commits: [],
      timestamp: Date.now(),
      analyzedCount: 0,
      context: { type: 'markdown-snippet' as const, filePath: 'other.md', title: 'Title3' }
    });

    versionCache.invalidate('test.md');

    expect(versionCache.get(key1)).toBeNull();
    expect(versionCache.get(key2)).toBeNull();
    expect(versionCache.get(key3)).not.toBeNull();
  });

  test('should respect max size', () => {
    const maxSize = (versionCache as any).MAX_SIZE;
    
    for (let i = 0; i < maxSize + 10; i++) {
      versionCache.set(`key:${i}`, {
        commits: [],
        timestamp: Date.now(),
        analyzedCount: 0,
        context: { type: 'solarwire-file' as const, filePath: `test${i}.solarwire`, title: `Title${i}` }
      });
    }

    expect(versionCache.getStats().size).toBeLessThanOrEqual(maxSize);
  });

  test('should get stats', () => {
    versionCache.set('key1', {
      commits: [],
      timestamp: Date.now(),
      analyzedCount: 0,
      context: { type: 'solarwire-file' as const, filePath: 'test1.solarwire', title: 'Title1' }
    });
    versionCache.set('key2', {
      commits: [],
      timestamp: Date.now(),
      analyzedCount: 0,
      context: { type: 'solarwire-file' as const, filePath: 'test2.solarwire', title: 'Title2' }
    });

    const stats = versionCache.getStats();
    expect(stats.size).toBe(2);
    expect(stats.keys).toHaveLength(2);
  });
});
