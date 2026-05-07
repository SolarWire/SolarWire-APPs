# 组件库管理全流程重构设计

## 目标
实现组件库的完整新建、维护、导出全流程管理，提升用户体验。

## 布局设计

### 左右两栏
```
┌──────────────────────┬──────────────────────────────────┐
│ 树形导航              │ 编辑区                            │
│                      │                                  │
│ 📦 Ant Design    ✏️  │ ┌─────┬─────┬─────┐              │
│   ├─ 📁 通用     ✏️  │ │ 📋  │ 📝  │     │              │
│   │   ├─ 主按钮      │ │     │     │     │              │
│   │   └─ 默认按钮    │ │  编辑内容                       │
│   ├─ 📁 表单     ✏️  │ │                                 │
│   └─ 📁 未分类   ✏️  │ └─────────────────────────────────┘
│                      │                                  │
│ [+ 新建组件库]        │                                  │
│ [+ 导入组件库]        │                                  │
└──────────────────────┴──────────────────────────────────┘
```

## 树形导航

### 节点类型
1. **组件库节点**：显示名称 + 组件数量，右侧编辑图标 ✏️
2. **分类节点**：显示名称 + 组件数量，右侧编辑图标 ✏️
3. **组件节点**：显示名称

### 展开/收起
- 点击组件库 → 展开/收起其下分类
- 点击分类 → 展开/收起其下组件

### 拖拽支持
- 所有节点可拖拽
- 区分插入位置：拖到目标上半部 → 插入前面；拖到下半部 → 插入后面
- 跨层级移动：分类可拖到其他组件库，组件可拖到其他分类

### 新增按钮
- 树底部：新建组件库、导入组件库
- 组件库行内：+ 新建分类
- 分类行内：+ 新建组件

## 右侧编辑区

### 组件库编辑（两个 Tab）
| Tab | Icon | 内容 |
|-----|------|------|
| 属性 | 📋 | name、description、version、author 可编辑表单 |
| 代码 | 📝 | metadata 的 key-value 文本编辑 |

### 分类编辑（两个 Tab）
| Tab | Icon | 内容 |
|-----|------|------|
| 属性 | 📋 | name、id 可编辑表单 |
| 代码 | 📝 | 分类的 key-value 文本编辑 |

### 组件编辑（三个 Tab）
| Tab | Icon | 内容 |
|-----|------|------|
| 属性 | 🔧 | id、name、description、categoryId 可编辑表单 |
| 可视化 | 🎨 | SolarWire 可视化编辑 + 预览 |
| 代码 | 💻 | 仅该组件的 SolarWire 代码编辑 |

## 删除分类
- 组件移到虚拟"未分类"（`categoryId = null`）
- 存在未分类组件时，在树中显示"📁 未分类"节点

## 新建组件库
- 弹窗表单：name（必填）、id（自动生成可修改）、description、version、author
- 生成空的 categories 和 components 数组

## 数据流

### Store 新增方法
- `createLibrary(metadata)`: 新建空组件库
- `moveCategory(categoryId, targetId, position)`: 移动分类
- `moveComponent(componentId, targetCategoryId, position)`: 移动组件
- `deleteCategory(categoryId)`: 删除分类（组件移到未分类）
- `createCategory(libraryId, category)`: 新建分类
- `createComponent(libraryId, categoryId, component)`: 新建组件

### 拖拽数据处理
```typescript
interface DropTarget {
  targetType: 'library' | 'category' | 'component';
  targetId: string;
  position: 'before' | 'after' | 'inside';
}
```

## 文件变更清单
1. `ComponentLibraryManagerModal.tsx` - 完全重写布局和交互
2. `ComponentLibraryManagerModal.css` - 新样式
3. `componentLibraryStore.ts` - 新增 CRUD 方法
4. `ComponentLibraryManager.ts` - 新增移动、删除分类等方法
5. `component.ts` - 可能需要调整 Category 类型（移除 order）

## 不变更的文件
- `ComponentLibrary.tsx` - 面板组件不变
- `swc-parser.ts` - 解析器不变
- `thumbnail-generator.ts` - 缩略图生成不变
