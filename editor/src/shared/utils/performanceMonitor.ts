/**
 * 性能监控工具
 * 监控版本历史分析的性能指标
 */

import { versionCache } from '../cache/versionCache';
import { workerPool } from './WorkerPool';

/**
 * 性能指标接口
 */
interface PerformanceMetrics {
  /**
   * 缓存命中率（0-1）
   */
  cacheHitRate: number;
  
  /**
   * Worker 池统计
   */
  workerPoolStats: {
    size: number;
    busy: number;
    queued: number;
    totalTasksProcessed: number;
    avgWaitTime: number;
    avgExecutionTime: number;
  };
  
  /**
   * 平均分析时间（毫秒）
   */
  avgAnalysisTime: number;
  
  /**
   * 总分析次数
   */
  totalAnalyses: number;
  
  /**
   * 内存使用情况（如果可用）
   */
  memoryUsage?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
  };
}

/**
 * 性能监控类
 */
class PerformanceMonitor {
  private analysisTimes: number[] = [];
  private totalAnalyses = 0;
  private readonly MAX_SAMPLES = 100; // 最多保留 100 个样本
  private monitoringInterval?: NodeJS.Timeout;

  /**
   * 记录分析时间
   */
  recordAnalysisTime(timeMs: number): void {
    this.analysisTimes.push(timeMs);
    this.totalAnalyses++;
    
    // 保持样本数量在限制内
    if (this.analysisTimes.length > this.MAX_SAMPLES) {
      this.analysisTimes.shift();
    }
  }

  /**
   * 获取平均分析时间
   */
  getAvgAnalysisTime(): number {
    if (this.analysisTimes.length === 0) return 0;
    const sum = this.analysisTimes.reduce((a, b) => a + b, 0);
    return sum / this.analysisTimes.length;
  }

  /**
   * 获取性能指标
   */
  getMetrics(): PerformanceMetrics {
    const cacheStats = versionCache.getStats();
    const workerStats = workerPool.getStats();
    
    const metrics: PerformanceMetrics = {
      cacheHitRate: versionCache.getHitRate(),
      workerPoolStats: {
        size: workerStats.size,
        busy: workerStats.busy,
        queued: workerStats.queued,
        totalTasksProcessed: workerStats.totalTasksProcessed,
        avgWaitTime: workerStats.avgWaitTime,
        avgExecutionTime: workerStats.avgExecutionTime
      },
      avgAnalysisTime: this.getAvgAnalysisTime(),
      totalAnalyses: this.totalAnalyses
    };

    // 添加内存使用情况（如果可用）
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      const memory = (performance as any).memory;
      metrics.memoryUsage = {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize
      };
    }

    return metrics;
  }

  /**
   * 打印性能报告
   */
  printReport(): void {
    const metrics = this.getMetrics();
    
    console.log('=== Version History Performance Report ===');
    console.log(`Total Analyses: ${metrics.totalAnalyses}`);
    console.log(`Avg Analysis Time: ${metrics.avgAnalysisTime.toFixed(2)}ms`);
    console.log(`Cache Hit Rate: ${(metrics.cacheHitRate * 100).toFixed(2)}%`);
    console.log(`Worker Pool: ${metrics.workerPoolStats.size} workers (${metrics.workerPoolStats.busy} busy, ${metrics.workerPoolStats.queued} queued)`);
    console.log(`Worker Avg Wait Time: ${metrics.workerPoolStats.avgWaitTime.toFixed(2)}ms`);
    console.log(`Worker Avg Execution Time: ${metrics.workerPoolStats.avgExecutionTime.toFixed(2)}ms`);
    
    if (metrics.memoryUsage) {
      console.log(`Memory Used: ${(metrics.memoryUsage.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`);
      console.log(`Memory Total: ${(metrics.memoryUsage.totalJSHeapSize / 1024 / 1024).toFixed(2)}MB`);
    }
    
    console.log('==========================================');
  }

  /**
   * 开始定期监控
   * @param intervalMs 监控间隔（毫秒），默认 60 秒
   */
  startMonitoring(intervalMs: number = 60000): void {
    if (this.monitoringInterval) {
      this.stopMonitoring();
    }

    this.monitoringInterval = setInterval(() => {
      this.printReport();
    }, intervalMs);

    console.log(`[PerformanceMonitor] Started monitoring (interval: ${intervalMs}ms)`);
  }

  /**
   * 停止监控
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
      console.log('[PerformanceMonitor] Stopped monitoring');
    }
  }

  /**
   * 重置统计数据
   */
  reset(): void {
    this.analysisTimes = [];
    this.totalAnalyses = 0;
    workerPool.resetStats();
    console.log('[PerformanceMonitor] Stats reset');
  }
}

// 单例模式
const performanceMonitor = new PerformanceMonitor();

// 在开发环境下自动启动监控
if (process.env.NODE_ENV === 'development') {
  // 每 60 秒打印一次报告
  performanceMonitor.startMonitoring(60000);
}

export { performanceMonitor };
export type { PerformanceMetrics };
