# 组件库系统设计文档

> 日期：2026-04-21
> 状态：待审批
> 背景：为产品经理提供快速搭建原型的能力，通过组件库实现业务组件的复用和管理

---

## 一、需求背景

### 1.1 用户定位
- **目标用户**：产品经理（非 UI 设计师）
- **核心需求**：快速搭建产品原型，表达产品需求
- **使用场景**：从组件库拖拽组件到画布，快速搭建页面原型

### 1.2 核心概念
- **组件**：由基础形状元素（矩形、圆形、文本、线等）组合而成的复合结构
- **组件库（.swc 文件）**：包含多个组件的完整集合，支持多级目录、分类、元数据
- **与元素库的关系**：
  - 元素库（ElementLibrary）：基础绘图工具箱，提供原子元素（矩形、圆形、线、文本等）
  - 组件库（ComponentLibrary）：业务组件集合，提供可复用的功能块
  - **两者完全独立，互不影响**

---

## 二、架构设计

### 2.1 组件库使用面板（拖拽使用）

**入口位置**：SolarWireMode 工具栏的 `display-section` 中，图层按钮右侧

```
工具栏布局：
[Pan] | [选择工具] | [Note] [缩放] [图层] [组件库] | [置顶] | [对齐工具] | [元素库]
```

**行为**：
- 点击切换显示/隐藏
- 面板悬浮在左侧（类似 LayerPanel）
- 独立状态管理，使用 Zustand 的 `showComponentLibrary` 状态
- **功能**：浏览组件、搜索组件、拖拽组件到画布

### 2.2 组件库管理功能（编辑管理）

**入口位置**：顶部导航栏（TopMenuBar）的切换主题按钮与设置按钮之间

```
顶部导航栏布局：
[Logo] [📂 打开] [💾 保存] ... [☀️/🌙 主题] [📦 组件库管理] [⚙️ 设置]
```

**行为**：
- 点击后进入组件库管理界面
- 全屏弹窗覆盖左侧视图栏和右侧属性面板
- 左右两栏布局：
  - **左栏**：组件库列表 + 组件列表（树形结构）
  - **右栏**：根据选中内容动态切换
    - 选中组件库 → 显示组件库属性编辑
    - 选中组件 → 上侧显示组件属性 + 下侧显示可视化编辑器

**可视化编辑器**：
- 复制现有的 SolarWire 可视化编辑功能
- 限制部分功能：
  - 工具栏禁用部分按钮（对齐、置顶等不适用的功能）
  - 属性面板禁用 note 功能
  - 禁用与文档级相关的操作
- 支持可视化编辑和代码模式切换
- 实时预览组件渲染效果

### 2.3 使用模式 vs 编辑模式对比

| 维度 | 使用模式 | 编辑模式 |
|------|---------|---------|
| 入口 | 工具栏图层按钮旁 | 顶部导航栏 |
| 界面 | 左侧悬浮面板 | 全屏弹窗 |
| 功能 | 浏览、搜索、拖拽使用 | 创建、编辑、删除组件库/组件 |
| 目标用户 | 产品经理（快速搭建） | 高级用户/管理员（管理组件） |
| 编辑能力 | 无 | 完整的可视化编辑 + 代码编辑 |

### 2.4 组件面板结构（使用模式）

```
组件库面板
├── 组件库列表（顶部）
│   ├── 当前加载的组件库标签页
│   ├── 添加组件库按钮（导入 .swc 文件）
│   └── 创建新组件库按钮
│
├── 当前组件库内容
│   ├── 搜索框（组件名称搜索）
│   ├── 目录树（左侧）/ 分类标签（顶部）
│   │   ├── 多级目录结构
│   │   └── 分类筛选
│   │
│   └── 组件网格（主区域）
│       ├── 组件卡片（SVG 预览 + 名称）
│       └── 拖拽到画布使用
│
└── 组件库管理（右键菜单/工具栏）
    ├── 编辑组件库信息
    ├── 添加/删除目录
    ├── 添加/删除组件
    ├── 导入/导出组件库
    └── 重命名/删除组件库
```

### 2.5 数据流

```
┌─────────────────────────────────────────────────────────┐
│                    组件库管理                             │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────┐    ┌──────────────┐                   │
│  │ 官方预制组件  │    │ 用户自定义    │                   │
│  │ (代码目录)    │    │ (IndexedDB)  │                   │
│  └──────┬───────┘    └──────┬───────┘                   │
│         │                   │                            │
│         └────────┬──────────┘                            │
│                  │                                       │
│         ┌────────▼────────┐                              │
│         │  组件库管理器    │                              │
│         │ (状态管理)       │                              │
│         └────────┬────────┘                              │
│                  │                                       │
│         ┌────────▼────────┐                              │
│         │  组件库面板      │                              │
│         │ (UI 渲染)        │                              │
│         └────────┬────────┘                              │
│                  │                                       │
│         ┌────────▼────────┐                              │
│         │  拖拽到画布      │                              │
│         │ (DSL 注入)       │                              │
│         └─────────────────┘                              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 三、组件库文件格式（.swc）

### 3.1 文件结构

```json
{
  "$schema": "solarwire-component-library-v1",
  "metadata": {
    "id": "unique-library-id",
    "name": "电商组件库",
    "description": "电商平台常用的业务组件",
    "version": "1.0.0",
    "author": "产品经理A",
    "createdAt": "2026-04-21T10:00:00Z",
    "updatedAt": "2026-04-21T10:00:00Z"
  },
  "categories": [
    {
      "id": "cat-forms",
      "name": "表单组件",
      "parentId": null,
      "order": 1
    },
    {
      "id": "cat-forms-input",
      "name": "输入类",
      "parentId": "cat-forms",
      "order": 1
    },
    {
      "id": "cat-lists",
      "name": "列表组件",
      "parentId": null,
      "order": 2
    }
  ],
  "components": [
    {
      "id": "comp-search-bar",
      "name": "搜索栏",
      "description": "顶部搜索栏组件，包含输入框和搜索按钮",
      "categoryId": "cat-forms-input",
      "thumbnail": "data:image/svg+xml;base64,...",
      "createdAt": "2026-04-21T10:00:00Z",
      "updatedAt": "2026-04-21T10:00:00Z",
      "code": "!title=\"搜索栏\"\n\nrectangle x=0 y=0 w=400 h=40 fill=#f5f5f5\nrectangle x=10 y=10 w=320 h=20 fill=#ffffff rounded=4\n->(10, 10) text x=20 y=15 \"搜索...\" fill=#999999\n->(10, 10) rectangle x=340 y=10 w=50 h=20 fill=#007aff rounded=4\n->(340, 10) text x=350 y=15 \"搜索\" fill=#ffffff"
    },
    {
      "id": "comp-product-card",
      "name": "商品卡片",
      "description": "商品展示卡片，包含图片、名称、价格",
      "categoryId": "cat-lists",
      "thumbnail": "data:image/svg+xml;base64,...",
      "createdAt": "2026-04-21T10:00:00Z",
      "updatedAt": "2026-04-21T10:00:00Z",
      "code": "!title=\"商品卡片\"\n\nrectangle x=0 y=0 w=200 h=250 fill=#ffffff rounded=8 stroke=#e0e0e0\nrectangle x=10 y=10 w=180 h=140 fill=#f5f5f5 rounded=4\n->(10, 10) text x=10 y=165 \"商品名称\" fill=#333333\n->(10, 10) text x=10 y=185 \"¥99.00\" fill=#ff6b00\n->(10, 10) text x=10 y=205 \"已售 1000+\" fill=#999999"
    }
  ]
}
```

### 3.2 字段说明

**metadata（组件库元数据）**：
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 组件库唯一标识（UUID） |
| name | string | 是 | 组件库名称 |
| description | string | 否 | 组件库描述 |
| version | string | 是 | 版本号（语义化版本） |
| author | string | 否 | 作者 |
| createdAt | datetime | 是 | 创建时间 |
| updatedAt | datetime | 是 | 更新时间 |

**categories（分类/目录）**：
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 分类唯一标识 |
| name | string | 是 | 分类名称 |
| parentId | string/null | 是 | 父分类 ID（null 表示顶级） |
| order | number | 是 | 排序权重 |

**components（组件列表）**：
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 组件唯一标识 |
| name | string | 是 | 组件名称 |
| description | string | 否 | 组件描述 |
| categoryId | string | 否 | 所属分类 ID |
| thumbnail | string | 是 | SVG 缩略图（Base64） |
| code | string | 是 | SolarWire DSL 代码 |
| createdAt | datetime | 是 | 创建时间 |
| updatedAt | datetime | 是 | 更新时间 |

---

## 四、功能设计

### 4.1 组件库加载

**官方预制组件**：
- 存储在 `editor/src/lib/components/presets/` 目录
- 应用启动时自动加载
- 用户可查看、编辑、导出

**用户自定义组件库**：
- 存储在 IndexedDB 中
- 支持创建、编辑、删除
- 支持导出为 `.swc` 文件

**外部导入组件库**：
- 拖拽 `.swc` 文件到面板导入
- 或通过"添加组件库"按钮选择文件
- 导入后存储在 IndexedDB 中

### 4.2 组件浏览

**视图模式**：
- 网格视图：2-3 列网格，显示组件缩略图和名称
- 列表视图：单列列表，显示组件名称和描述

**搜索功能**：
- 组件名称模糊搜索
- 组件描述关键词搜索

**分类筛选**：
- 目录树（左侧）：多级目录结构
- 分类标签（顶部）：快速切换分类

### 4.3 组件使用

**拖拽到画布**：
1. 从组件库拖拽组件卡片
2. 在画布上释放鼠标
3. 组件的 DSL 代码注入到当前文档
4. 自动选中该组件的所有元素

**坐标处理**：
- 组件代码中的坐标为相对坐标（相对于组件左上角）
- 拖入画布时，自动转换为画布绝对坐标（基于放置位置）

### 4.4 组件管理

**创建组件**：
1. 在画布中选中多个元素
2. 右键菜单 → "保存为组件"
3. 输入组件名称、描述、选择分类
4. 自动生成缩略图并保存到当前组件库

**编辑组件**：
- 右键组件卡片 → "编辑"
- 修改名称、描述、分类
- 预览并更新 DSL 代码
- 更新缩略图

**删除组件**：
- 右键组件卡片 → "删除"
- 确认后从组件库中移除

**组件库管理**：
- 创建新组件库
- 编辑组件库元数据
- 添加/删除/重命名分类
- 导入/导出组件库（.swc 文件）
- 删除组件库

### 4.5 组件预览

**预览生成**：
- 使用现有的 SVG 渲染器渲染组件 DSL 代码
- 生成 SVG 缩略图（Base64 编码）
- 存储在组件元数据中

**预览更新**：
- 组件代码修改后，自动重新生成缩略图
- 手动触发更新按钮

---

## 五、技术实现

### 5.1 状态管理（Zustand）

```typescript
// stores/componentLibraryStore.ts

interface ComponentLibraryStore {
  // 面板状态
  showComponentLibrary: boolean;
  setShowComponentLibrary: (show: boolean) => void;
  
  // 组件库列表
  libraries: ComponentLibrary[];
  activeLibraryId: string | null;
  
  // 组件库操作
  loadLibrary: (library: ComponentLibrary) => void;
  removeLibrary: (libraryId: string) => void;
  setActiveLibrary: (libraryId: string | null) => void;
  
  // 组件操作
  addComponent: (libraryId: string, component: Component) => void;
  updateComponent: (libraryId: string, componentId: string, updates: Partial<Component>) => void;
  deleteComponent: (libraryId: string, componentId: string) => void;
  
  // 分类操作
  addCategory: (libraryId: string, category: Category) => void;
  updateCategory: (libraryId: string, categoryId: string, updates: Partial<Category>) => void;
  deleteCategory: (libraryId: string, categoryId: string) => void;
  
  // 导入导出
  importLibrary: (file: File) => Promise<void>;
  exportLibrary: (libraryId: string) => void;
  
  // 搜索和筛选
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeCategoryId: string | null;
  setActiveCategoryId: (categoryId: string | null) => void;
  
  // 拖拽状态
  draggedComponent: Component | null;
  setDraggedComponent: (component: Component | null) => void;
}
```

### 5.2 组件库管理器

```typescript
// services/ComponentLibraryManager.ts

class ComponentLibraryManager {
  // 加载官方预制组件库
  loadPresetLibraries(): Promise<ComponentLibrary[]>;
  
  // 从 IndexedDB 加载用户组件库
  loadUserLibraries(): Promise<ComponentLibrary[]>;
  
  // 保存组件库到 IndexedDB
  saveLibrary(library: ComponentLibrary): Promise<void>;
  
  // 从文件导入组件库
  importFromFile(file: File): Promise<ComponentLibrary>;
  
  // 导出组件库为文件
  exportToFile(library: ComponentLibrary): void;
  
  // 生成组件缩略图
  generateThumbnail(componentCode: string): Promise<string>;
  
  // 从画布选中的元素创建组件
  createComponentFromSelection(content: string, selectedIds: string[]): Promise<Component>;
}
```

### 5.3 IndexedDB 结构

```typescript
// 数据库：solarwire-components
// 对象存储：
//   - libraries: ComponentLibrary[]
//   - 主键：metadata.id
//   - 索引：metadata.name, metadata.author

const DB_NAME = 'solarwire-components';
const DB_VERSION = 1;

const STORES = {
  LIBRARIES: 'libraries',
};
```

### 5.4 文件变更清单

**新增文件**：

| 文件路径 | 说明 |
|---------|------|
| `editor/src/app/components/editor/ComponentLibrary.tsx` | 组件库面板组件 |
| `editor/src/app/components/editor/ComponentLibrary.css` | 组件库面板样式 |
| `editor/src/app/stores/componentLibraryStore.ts` | 组件库状态管理 |
| `editor/src/app/services/ComponentLibraryManager.ts` | 组件库管理服务 |
| `editor/src/app/services/IndexedDBService.ts` | IndexedDB 封装服务 |
| `editor/src/lib/components/presets/` | 官方预制组件目录 |
| `editor/src/lib/components/presets/default.swc.json` | 默认组件库 |
| `editor/src/shared/types/component.ts` | 组件库类型定义 |

**修改文件**：

| 文件路径 | 变更说明 |
|---------|---------|
| `editor/src/app/components/editor-modes/SolarWireMode.tsx` | 添加工具栏组件库按钮 |
| `editor/src/app/components/layout/TopMenuBar.tsx` | 添加工具栏组件库按钮（如果使用 TopMenuBar） |
| `editor/src/app/stores/solarWireStore.ts` | 添加 showComponentLibrary 状态（或独立 store） |

---

## 六、交互流程

### 6.1 拖拽组件到画布

```
1. 用户从组件库拖拽组件卡片
   ↓
2. 设置 draggedComponent 状态
   ↓
3. 用户移动鼠标到画布
   ↓
4. 显示组件预览（半透明）
   ↓
5. 用户释放鼠标
   ↓
6. 获取组件 DSL 代码
   ↓
7. 计算放置位置的坐标偏移
   ↓
8. 将 DSL 代码注入到当前文档
   ↓
9. 更新文档内容
   ↓
10. 选中新插入的组件元素
```

### 6.2 保存画布元素为组件

```
1. 用户选中画布中的多个元素
   ↓
2. 右键菜单 → "保存为组件"
   ↓
3. 弹出"创建组件"对话框
   ↓
4. 用户输入：名称、描述、选择分类
   ↓
5. 提取选中元素的 DSL 代码
   ↓
6. 生成缩略图（SVG 渲染）
   ↓
7. 创建 Component 对象
   ↓
8. 保存到当前组件库
   ↓
9. 同步到 IndexedDB
   ↓
10. 更新组件库面板显示
```

### 6.3 导入组件库文件

```
1. 用户点击"添加组件库"按钮
   ↓
2. 弹出文件选择对话框
   ↓
3. 选择 .swc.json 文件
   ↓
4. 解析 JSON 文件
   ↓
5. 验证文件格式和必填字段
   ↓
6. 生成唯一 ID（如果没有）
   ↓
7. 加载到组件库列表
   ↓
8. 保存到 IndexedDB
   ↓
9. 更新面板显示
```

---

## 七、UI 设计要点

### 7.1 组件库面板布局

```
┌──────────────────────────────────────┐
│ 组件库                    [+] [⚙️]   │  ← 顶部：标题 + 操作按钮
├──────────────────────────────────────┤
│ [电商组件库 ▼] [导入] [创建]          │  ← 组件库选择器
├──────────────────────────────────────┤
│ 🔍 搜索组件...                        │  ← 搜索框
├──────────────────────────────────────┤
│ ┌──────────┬───────────────────────┐ │
│ │ 目录树    │ 组件网格              │ │
│ │          │                       │ │
│ │ 📁 表单   │ ┌─────┐ ┌─────┐      │ │
│ │   📁 输入 │ │ 🖼️  │ │ 🖼️  │      │ │
│ │   📁 选择 │ │搜索栏│ │输入框│      │ │
│ │ 📁 列表   │ └─────┘ └─────┘      │ │
│ │ 📁 导航   │ ┌─────┐ ┌─────┐      │ │
│ │ 📁 卡片   │ │ 🖼️  │ │ 🖼️  │      │ │
│ │          │ │商品卡│ │用户卡│      │ │
│ │          │ └─────┘ └─────┘      │ │
│ │          │                       │ │
│ └──────────┴───────────────────────┘ │
└──────────────────────────────────────┘
```

### 7.2 组件卡片设计

```
┌─────────────┐
│             │
│   SVG 预览   │
│  (150x100)  │
│             │
├─────────────┤
│ 组件名称     │
│ 组件描述     │
└─────────────┘
```

**交互**：
- 悬停：显示操作菜单（编辑、删除、导出）
- 拖拽：开始拖拽，设置 draggedComponent
- 双击：预览组件详情

### 7.3 右键菜单

**组件卡片右键**：
- 编辑组件
- 复制组件
- 导出组件
- 删除组件

**组件库右键**：
- 编辑组件库信息
- 添加分类
- 导出组件库
- 删除组件库

---

## 八、预期效果

1. **产品经理可快速搭建原型**：通过拖拽组件到画布，快速表达产品需求
2. **组件可复用**：一次创建，多次使用，提升效率
3. **组件库可共享**：通过 .swc 文件导入导出，团队共享组件资源
4. **不影响现有元素库**：元素库保持基础工具定位，组件库提供业务组件能力

---

## 九、风险与约束

1. **性能**：组件缩略图生成可能影响性能，需异步处理
2. **存储限制**：IndexedDB 存储容量有限，需考虑清理策略
3. **兼容性**：.swc 文件格式需版本管理，未来升级需向后兼容
4. **学习成本**：组件库功能较多，需提供引导和文档

---

## 十、后续扩展

1. **组件市场**：云端组件市场，在线浏览和下载
2. **组件版本管理**：组件版本控制和更新机制
3. **组件依赖管理**：组件之间的依赖关系管理
4. **组件测试**：组件渲染测试和兼容性测试
5. **AI 辅助创建**：通过自然语言描述自动生成组件
