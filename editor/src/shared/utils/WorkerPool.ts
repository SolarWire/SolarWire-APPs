/**
 * Worker 池 - 管理 Web Worker 的复用
 */

import type { GitCommit, VersionAnalysisContext } from '../shared/types/version';

interface WorkerTask {
  commits: GitCommit[];
  filePath: string;
  context: VersionAnalysisContext;
  resolve: (result: any) => void;
  reject: (error: Error) => void;
  timestamp: number;
}

interface WorkerWrapper {
  worker: Worker;
  busy: boolean;
  id: number;
  tasksCompleted: number;
  lastActiveTime: number;
}

interface WorkerPoolStats {
  size: number;
  busy: number;
  queued: number;
  totalTasksProcessed: number;
  avgWaitTime: number;
  avgExecutionTime: number;
}

class WorkerPool {
  private workers: WorkerWrapper[] = [];
  private taskQueue: WorkerTask[] = [];
  private readonly MIN_SIZE = 1;
  private readonly MAX_SIZE = 3;
  private readonly IDLE_TIMEOUT = 5 * 60 * 1000; // 5 分钟空闲超时
  private nextId = 1;
  private totalTasksProcessed = 0;
  private totalWaitTime = 0;
  private totalExecutionTime = 0;

  /**
   * 获取空闲 Worker
   */
  acquire(): Worker {
    const idleWorker = this.workers.find(w => !w.busy);
    
    if (idleWorker) {
      idleWorker.busy = true;
      idleWorker.lastActiveTime = Date.now();
      console.log(`[WorkerPool] Acquired worker ${idleWorker.id}`);
      return idleWorker.worker;
    }

    // 如果没有空闲 Worker，创建新的（不超过最大值）
    if (this.workers.length < this.MAX_SIZE) {
      const worker = new Worker(
        new URL('../../workers/git-diff-analyzer.worker.ts', import.meta.url),
        { type: 'module' }
      );
      const wrapper: WorkerWrapper = {
        worker,
        busy: true,
        id: this.nextId++,
        tasksCompleted: 0,
        lastActiveTime: Date.now()
      };
      this.workers.push(wrapper);
      console.log(`[WorkerPool] Created new worker ${wrapper.id}`);
      return worker;
    }

    // 如果已达到最大值，等待任务队列处理
    console.log('[WorkerPool] Pool exhausted, queuing task...');
    throw new Error('Worker pool exhausted, task queued');
  }

  /**
   * 释放 Worker
   */
  release(worker: Worker): void {
    const wrapper = this.workers.find(w => w.worker === worker);
    if (wrapper) {
      wrapper.busy = false;
      wrapper.tasksCompleted++;
      wrapper.lastActiveTime = Date.now();
      this.totalTasksProcessed++;
      console.log(`[WorkerPool] Released worker ${wrapper.id} (tasks: ${wrapper.tasksCompleted})`);
      
      // 检查是否需要清理空闲 Worker
      this.cleanupIdleWorkers();
    }
  }

  /**
   * 提交任务
   */
  async submitTask(
    commits: GitCommit[],
    filePath: string,
    context: VersionAnalysisContext
  ): Promise<any> {
    const task: WorkerTask = {
      commits,
      filePath,
      context,
      resolve,
      reject,
      timestamp: Date.now()
    };
    
    return new Promise((resolve, reject) => {
      this.taskQueue.push({ ...task, resolve, reject });
      this.processQueue();
    });
  }

  /**
   * 处理任务队列
   */
  private async processQueue(): Promise<void> {
    if (this.taskQueue.length === 0) return;

    const idleWorker = this.workers.find(w => !w.busy);
    if (!idleWorker) return;

    const task = this.taskQueue.shift();
    if (!task) return;

    idleWorker.busy = true;
    
    try {
      const result = await this.executeTask(idleWorker.worker, task);
      task.resolve(result);
    } catch (error) {
      task.reject(error as Error);
    } finally {
      idleWorker.busy = false;
      this.processQueue(); // 处理下一个任务
    }
  }

  /**
   * 执行任务
   */
  private executeTask(worker: Worker, task: WorkerTask): Promise<any> {
    const startTime = Date.now();
    this.totalWaitTime += startTime - task.timestamp;
    
    return new Promise((resolve, reject) => {
      const messageHandler = (event: MessageEvent) => {
        const { type, data } = event.data;
        const endTime = Date.now();
        this.totalExecutionTime += endTime - startTime;

        if (type === 'complete') {
          worker.removeEventListener('message', messageHandler);
          resolve(data);
        } else if (type === 'error') {
          worker.removeEventListener('message', messageHandler);
          reject(new Error(data.message));
        }
      };

      worker.addEventListener('message', messageHandler);
      worker.onerror = () => {
        worker.removeEventListener('message', messageHandler);
        reject(new Error('Worker error'));
      };

      worker.postMessage({
        type: 'analyze',
        commits: task.commits,
        filePath: task.filePath,
        context: task.context
      });
    });
  }

  /**
   * 清理空闲 Worker
   */
  private cleanupIdleWorkers(): void {
    const now = Date.now();
    const idleWorkers = this.workers.filter(
      w => !w.busy && now - w.lastActiveTime > this.IDLE_TIMEOUT
    );

    if (idleWorkers.length > 0 && this.workers.length > this.MIN_SIZE) {
      console.log(`[WorkerPool] Cleaning up ${idleWorkers.length} idle workers`);
      
      idleWorkers.forEach(w => {
        w.worker.terminate();
        this.workers = this.workers.filter(worker => worker !== w);
      });
      
      console.log(`[WorkerPool] Current pool size: ${this.workers.length}`);
    }
  }

  /**
   * 清空池
   */
  clear(): void {
    this.workers.forEach(w => w.worker.terminate());
    this.workers = [];
    this.taskQueue = [];
    console.log('[WorkerPool] Cleared');
  }

  /**
   * 获取统计信息
   */
  getStats(): WorkerPoolStats {
    const avgWaitTime = this.totalTasksProcessed > 0 
      ? this.totalWaitTime / this.totalTasksProcessed 
      : 0;
    const avgExecutionTime = this.totalTasksProcessed > 0
      ? this.totalExecutionTime / this.totalTasksProcessed
      : 0;
    
    return {
      size: this.workers.length,
      busy: this.workers.filter(w => w.busy).length,
      queued: this.taskQueue.length,
      totalTasksProcessed: this.totalTasksProcessed,
      avgWaitTime,
      avgExecutionTime
    };
  }

  /**
   * 重置统计信息
   */
  resetStats(): void {
    this.totalTasksProcessed = 0;
    this.totalWaitTime = 0;
    this.totalExecutionTime = 0;
    console.log('[WorkerPool] Stats reset');
  }
}

// 单例模式
const workerPool = new WorkerPool();

export { workerPool };
