/**
 * 系统监控服务
 * 监控网络状态、内存使用等系统信息
 */

import { useStatusStore } from '../stores/statusStore';

class SystemMonitorService {
  private isOnline = true;
  private memoryCheckInterval: NodeJS.Timeout | null = null;
  private networkCheckInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeMonitoring();
  }

  /**
   * 初始化监控
   */
  private initializeMonitoring() {
    // 初始化网络状态
    this.updateOnlineStatus();
    
    // 监听网络状态变化
    window.addEventListener('online', this.handleOnlineChange.bind(this));
    window.addEventListener('offline', this.handleOfflineChange.bind(this));
    
    // 启动内存监控
    this.startMemoryMonitoring();
    
    // 启动网络状态检查
    this.startNetworkMonitoring();
  }

  /**
   * 处理网络连接
   */
  private handleOnlineChange() {
    this.isOnline = true;
    this.updateOnlineStatus();
  }

  /**
   * 处理网络断开
   */
  private handleOfflineChange() {
    this.isOnline = false;
    this.updateOnlineStatus();
  }

  /**
   * 更新在线状态
   */
  private updateOnlineStatus() {
    const statusStore = useStatusStore.getState();
    statusStore.setOnlineStatus(this.isOnline);
  }

  /**
   * 启动内存监控
   */
  private startMemoryMonitoring() {
    // 每30秒检查一次内存使用情况
    this.memoryCheckInterval = setInterval(() => {
      this.checkMemoryUsage();
    }, 30000);
    
    // 立即检查一次
    this.checkMemoryUsage();
  }

  /**
   * 检查内存使用情况
   */
  private checkMemoryUsage() {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const usedJSHeapSize = memory.usedJSHeapSize;
      const totalJSHeapSize = memory.totalJSHeapSize;
      const jsHeapSizeLimit = memory.jsHeapSizeLimit;
      
      // 计算内存使用百分比
      const memoryUsagePercent = Math.round((usedJSHeapSize / jsHeapSizeLimit) * 100);
      
      const statusStore = useStatusStore.getState();
      statusStore.updateMemoryUsage(memoryUsagePercent);
      
      // 如果内存使用超过80%，显示警告
      if (memoryUsagePercent > 80) {
        statusStore.addNotification('warning', `内存使用率较高: ${memoryUsagePercent}%`);
      }
    }
  }

  /**
   * 启动网络监控
   */
  private startNetworkMonitoring() {
    // 每60秒检查一次网络连接状态
    this.networkCheckInterval = setInterval(() => {
      this.checkNetworkConnection();
    }, 60000);
  }

  /**
   * 检查网络连接
   */
  private async checkNetworkConnection() {
    try {
      // 尝试访问一个可靠的端点来检查网络连接
      const response = await fetch('https://www.google.com/favicon.ico', {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-cache'
      });
      
      // 如果没有抛出错误，说明网络连接正常
      if (!this.isOnline) {
        this.isOnline = true;
        this.updateOnlineStatus();
      }
    } catch (error) {
      // 网络可能有问题
      if (this.isOnline) {
        this.isOnline = false;
        this.updateOnlineStatus();
      }
    }
  }

  /**
   * 获取系统信息
   */
  public getSystemInfo() {
    const info: any = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      online: navigator.onLine,
      cookieEnabled: navigator.cookieEnabled,
    };

    // 添加内存信息（如果支持）
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      info.memory = {
        used: Math.round(memory.usedJSHeapSize / 1024 / 1024), // MB
        total: Math.round(memory.totalJSHeapSize / 1024 / 1024), // MB
        limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024), // MB
        usagePercent: Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100)
      };
    }

    // 添加屏幕信息
    info.screen = {
      width: screen.width,
      height: screen.height,
      colorDepth: screen.colorDepth,
      pixelDepth: screen.pixelDepth
    };

    return info;
  }

  /**
   * 清理监控
   */
  public destroy() {
    // 移除事件监听器
    window.removeEventListener('online', this.handleOnlineChange.bind(this));
    window.removeEventListener('offline', this.handleOfflineChange.bind(this));
    
    // 清理定时器
    if (this.memoryCheckInterval) {
      clearInterval(this.memoryCheckInterval);
      this.memoryCheckInterval = null;
    }
    
    if (this.networkCheckInterval) {
      clearInterval(this.networkCheckInterval);
      this.networkCheckInterval = null;
    }
  }
}

// 导出单例实例
export const systemMonitorService = new SystemMonitorService();
