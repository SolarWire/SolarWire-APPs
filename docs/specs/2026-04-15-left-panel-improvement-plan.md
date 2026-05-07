# 左侧视图改进规划

## 1. 需求视图改进

### 1.1 功能规划
- **视图切换控制**：仅在打开文件夹后可切换到需求视图
- **卡片展示**：以卡片形式展示当前文件夹及所有子文件夹中的.md文档
- **卡片信息**：
  - 大标题：显示.md文件所属文件夹名称（作为需求名称）
  - 副标题：显示文件最新git版本号、提交时间及当前git状态
- **交互功能**：选中.md文件后，在卡片下方显示该文件的所有git提交历史记录（按时间倒序）

### 1.2 实现方案
1. **修改 RequirementView 组件**：
   - 添加选中文件状态管理
   - 实现卡片样式和布局
   - 集成 Git 历史记录显示
   - 添加 Git 状态查询逻辑

2. **集成 Git 服务**：
   - 使用 `gitService.getLog()` 获取文件提交历史
   - 使用 `gitService.getStatus()` 获取文件状态
   - 缓存 Git 数据以提高性能

3. **UI 组件**：
   - 实现需求卡片组件
   - 实现 Git 历史记录列表组件
   - 添加加载状态和错误处理

## 2. SolarWire 视图改进

### 2.1 功能规划
- **视图切换控制**：仅在打开文件夹后可切换到 SolarWire 视图
- **卡片展示**：以卡片形式展示当前文件夹及所有子文件夹中.md文档内解析出的SolarWire代码块
- **卡片信息**：
  - 大标题：从代码块的!title=标记后提取页面名称
  - 副标题：显示该代码块所属.md文件的文件夹名称（作为需求名称）
- **标题处理**：如果代码块中没有检测到!title标记，则使用所属.md文件的所属文件夹名，加上页面编号作为标题

### 2.2 实现方案
1. **修改 SolarWireView 组件**：
   - 优化卡片样式和布局
   - 实现从代码块中提取!title=标记的逻辑
   - 实现无标题时代替方案：使用文件夹名 + 页面编号
   - 显示代码块所属文件夹名称

2. **集成文件系统服务**：
   - 使用现有的 `collectSolarWireSnippets` API
   - 增强 API 以包含文件夹信息和页面编号

3. **UI 组件**：
   - 实现 SolarWire 卡片组件
   - 添加加载状态和错误处理

## 3. 视图切换控制

### 3.1 功能规划
- 仅在打开文件夹后显示需求视图和 SolarWire 视图的切换按钮
- 未打开文件夹时，这两个视图选项应被禁用或隐藏

### 3.2 实现方案
1. **修改 ViewTabs 组件**：
   - 添加视图切换控制逻辑
   - 根据 `currentPath` 状态禁用或隐藏相关选项卡

## 4. 技术实现细节

### 4.1 数据结构
- **需求卡片数据**：
  ```typescript
  interface RequirementCard {
    id: string;
    fileName: string;
    folderName: string;
    filePath: string;
    gitInfo: {
      latestCommit: {
        hash: string;
        shortHash: string;
        date: string;
        message: string;
      };
      status: 'modified' | 'staged' | 'untracked' | 'clean';
    };
    commitHistory: GitCommit[];
  }
  ```

- **SolarWire 卡片数据**：
  ```typescript
  interface SolarWireCard {
    id: string;
    title: string;
    folderName: string;
    sourceFile: string;
    codeBlock: string;
    pageNumber: number;
  }
  ```

### 4.2 性能优化
- **缓存机制**：缓存 Git 数据和文件系统扫描结果
- **懒加载**：仅在需要时加载 Git 历史记录
- **防抖处理**：避免频繁的 Git 操作
- **批量请求**：合并多个 Git 操作请求

### 4.3 错误处理
- **Git 操作错误**：优雅处理 Git 命令失败的情况
- **文件系统错误**：处理文件读取失败的情况
- **网络错误**：处理 IPC 通信失败的情况

## 5. 实施步骤

1. **修改 ViewTabs 组件**：添加视图切换控制逻辑
2. **修改 RequirementView 组件**：实现卡片展示和 Git 历史记录
3. **修改 SolarWireView 组件**：实现卡片展示、标题提取和无标题处理
4. **添加必要的 UI 组件**：实现卡片和历史记录列表
5. **测试和优化**：确保功能正常且性能良好

## 6. 预期效果

- **需求视图**：
  - 清晰展示所有.md文件
  - 提供文件的 Git 版本信息
  - 方便查看文件的提交历史
  - 仅在打开文件夹后可用

- **SolarWire 视图**：
  - 清晰展示所有 SolarWire 代码块
  - 从代码块中提取标题信息
  - 无标题时使用文件夹名 + 页面编号作为标题
  - 显示代码块所属文件夹
  - 仅在打开文件夹后可用

这些改进将使左侧面板更加直观和功能丰富，提高用户体验。