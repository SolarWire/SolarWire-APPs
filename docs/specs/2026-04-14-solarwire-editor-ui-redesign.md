# SolarWire Editor UI 重构设计方案

## 1. 项目背景与目标

### 1.1 项目背景
SolarWire Editor 是一个基于 Electron 的本地桌面编辑器应用，用于可视化编辑 SolarWire 格式的文档。当前版本已实现基本的编辑功能，但需要根据 Figma 设计规范进行全面的 UI 重构，以提供更专业、直观的用户体验。

### 1.2 设计目标
- 实现三栏式布局，提供清晰的功能分区
- 优化左侧栏的视图切换机制，支持文件、需求、SolarWire和Git四种视图
- 增强中间编辑区的功能，支持Markdown和SolarWire代码块编辑
- 完善右侧预览区，提供实时预览和可视化编辑功能
- 实现响应式设计，适配不同屏幕尺寸
- 确保所有UI元素符合Figma设计规范的视觉风格

## 2. 整体布局架构

### 2.1 布局结构
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             Top Menu Bar                                  │
├─────────────┬──────────────────────────────┬───────────────────────────────┤
│             │                              │                               │
│  Left Panel │        Main Content          │         Right Panel           │
│  (200-800px)│       (自适应宽度)          │        (200-800px)            │
│             │                              │                               │
├─────────────┴──────────────────────────────┴───────────────────────────────┤
│                             Status Bar                                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 响应式设计策略
| 屏幕宽度 | 布局模式 | 行为描述 |
|---------|---------|----------|
| ≥ 1440px | 三栏完整显示 | 左侧、中间、右侧栏同时完整显示 |
| 1024px - 1439px | 可折叠模式 | 可通过折叠按钮临时隐藏左侧或右侧栏 |
| < 1024px | 单栏模式 | 默认只显示中间编辑区，左侧和右侧栏通过顶部切换按钮显示/隐藏 |

## 3. 左侧栏（目录树区域）设计

### 3.1 视图模式切换
- 顶部标签页切换：文件视图（默认）、需求视图、SolarWire视图、Git视图
- 标签页样式：采用Figma设计规范中的标签页样式，当前激活标签页有明显视觉突出

### 3.2 文件视图

#### 3.2.1 未选择文件夹状态
- 居中显示视觉突出的"打开文件夹"主按钮
- 按钮样式：采用Figma设计规范中的主色调与按钮样式
- 按钮大小：180px × 48px
- 按钮文字："打开文件夹"
- 点击行为：弹出文件选择对话框，选择后切换到已选择文件夹状态

#### 3.2.2 已选择文件夹状态
- 层级树状结构展示文件夹内所有文件及子文件夹
- 支持展开/折叠操作，点击文件夹名称或展开/折叠图标
- 文件类型通过不同图标区分：
  - 文件夹：`FolderOpen`（Radix Icons）
  - Markdown文件：`FileText`（Radix Icons）
  - SolarWire文件：`Code`（Radix Icons）
  - 其他文件：`FileText`（Radix Icons）
- 选中文件时，文件名高亮显示
- 支持拖拽文件重新排序

### 3.3 需求视图

#### 3.3.1 功能限制
- 仅在成功打开文件夹后可切换
- 未打开文件夹时，显示提示信息："请先打开一个文件夹以查看需求"

#### 3.3.2 内容展示
- 以卡片网格布局展示当前文件夹及所有子文件夹中的.md文档
- 卡片尺寸：280px × 120px
- 卡片间距：16px

#### 3.3.3 卡片信息规范
- 大标题：采用16px粗体字显示.md文件所属文件夹名称（作为需求名称）
- 副标题：采用12px常规字显示文件最新git版本号（前8位哈希值）、提交时间（格式：YYYY-MM-DD HH:MM）及当前git状态（如：已修改、已暂存、未修改）
- 状态标签：根据git状态显示不同颜色的标签
  - 已修改：橙色
  - 已暂存：蓝色
  - 未修改：绿色

#### 3.3.4 交互行为
- 点击选中.md文件后，在卡片下方展开显示该文件的所有git提交历史记录
- 提交历史按时间倒序排列，最多显示10条
- 每条历史记录包含：提交者名称、提交信息、提交时间、版本号

### 3.4 SolarWire视图

#### 3.4.1 功能限制
- 仅在成功打开文件夹后可切换
- 未打开文件夹时，显示提示信息："请先打开一个文件夹以查看SolarWire代码块"

#### 3.4.2 内容展示
- 以卡片列表布局展示当前文件夹及所有子文件夹中.md文档内解析出的SolarWire代码块
- 卡片尺寸：宽度自适应左侧栏，高度根据内容调整
- 卡片间距：8px

#### 3.4.3 卡片信息规范
- 大标题：从代码块的!title=标记后提取页面名称，采用14px粗体字显示
- 副标题：采用12px常规字显示该代码块所属.md文件的文件夹名称（作为需求名称）
- 代码块预览：显示代码块的前3行内容，超出部分显示省略号

### 3.5 Git视图

#### 3.5.1 功能限制
- 仅在成功打开文件夹后可切换
- 未打开文件夹时，显示提示信息："请先打开一个文件夹以查看Git历史"

#### 3.5.2 界面组成
- 顶部操作区：
  - "Commit"主按钮（采用Figma设计规范中的主要按钮样式）
  - 按钮大小：120px × 36px
  - 点击行为：弹出提交对话框
- 历史记录区：
  - 以卡片形式按时间倒序（最新在前）展示该文件夹的所有git历史版本记录
  - 每条记录包含：提交者头像、名称、提交信息、时间戳及版本号
  - 卡片尺寸：宽度自适应左侧栏，高度根据内容调整
  - 卡片间距：8px

## 4. 中间栏（编辑区域）设计

### 4.1 内容动态显示规则
- 选中.md文件时：显示完整的.md文件内容，提供完整编辑功能
- 选中SolarWire代码块时：仅显示该代码块内容，提供针对性编辑功能

### 4.2 编辑器核心功能
- **Markdown语法高亮显示**：支持标题、列表、链接、代码块等Markdown语法的高亮
- **自动保存机制**：基于内容变化的自动保存，间隔不超过30秒
- **基本编辑功能**：
  - 撤销/重做
  - 复制/粘贴
  - 查找/替换
  - 全选
- **代码块语法高亮**：
  - JavaScript
  - HTML
  - CSS
  - SolarWire
  - 其他常用编程语言

### 4.3 编辑工具栏
- 位于编辑器顶部
- 包含：
  - 撤销/重做按钮
  - 格式工具栏（粗体、斜体、列表、链接等）
  - 代码块插入按钮
  - 查找/替换按钮
- 工具栏样式：采用Figma设计规范中的工具栏样式

## 5. 右侧栏（预览/可视化编辑区）设计

### 5.1 模式切换
- 两种动态切换的模式：
  - MD预览模式（仅在选中.md文件时激活）
  - SolarWire可视化编辑模式（仅在选中SolarWire代码块时激活）

### 5.2 MD预览模式
- **实时渲染**：实时渲染markdown内容，延迟不超过500ms
- **特殊内容支持**：
  - 完整支持mermaid图表渲染（包含流程图、时序图、甘特图等）
  - 支持SolarWire代码块的渲染预览
- **预览质量**：保持与最终输出一致的渲染效果

### 5.3 SolarWire可视化编辑模式
- **所见即所得**：提供直观的可视化编辑界面
- **功能操作区**：
  - 元素选中模式切换按钮（单选/框选）
  - 笔记(note)显示/隐藏切换开关
  - 视图缩放控制（包含+/-按钮及百分比显示）
  - 元素对齐方式调整工具（左对齐、居中对齐、右对齐、两端对齐）
  - 元素层级调整按钮（置顶、置底）
  - 拖拽式元素添加工具栏（包含基础元素库）
  - 属性编辑面板（选中单个元素时显示，支持编辑元素各项属性）

## 6. 整体布局与交互规范

### 6.1 三栏宽度调整
- 各栏之间通过可拖拽分隔线进行宽度调整
- 最小宽度限制：200px
- 最大宽度限制：800px
- 拖拽时显示宽度提示

### 6.2 滚动机制
- 各区域高度自适应窗口大小
- 内容超出时提供独立的垂直滚动条
- 滚动不影响其他区域
- 滚动条样式：采用Figma设计规范中的滚动条样式

### 6.3 交互反馈
- **悬停状态**：鼠标悬停在可交互元素上时，显示视觉反馈
- **点击状态**：点击按钮时显示按下效果
- **选中状态**：选中元素时显示高亮边框
- **拖拽状态**：拖拽元素时显示拖拽指示器

### 6.4 加载状态
- 各视图切换及内容加载过程中显示适当的加载指示器
- 加载时间超过1秒时显示进度提示
- 加载完成后平滑过渡到新内容

## 7. 视觉设计规范

### 7.1 shadcn UI 设计规范

#### 7.1.1 核心原则
- **组件驱动**：基于可复用组件构建界面
- **设计系统**：统一的设计语言和视觉风格
- **可访问性**：符合WCAG 2.1标准
- **响应式**：适配不同屏幕尺寸
- **主题支持**：内置明暗主题切换

#### 7.1.2 组件使用标准
- **按钮**：使用shadcn Button组件，支持primary、secondary、ghost等变体
- **卡片**：使用shadcn Card组件，包含header、content、footer结构
- **输入框**：使用shadcn Input组件，支持label、placeholder、error状态
- **标签页**：使用shadcn Tabs组件，支持激活状态和键盘导航
- **下拉菜单**：使用shadcn Dropdown Menu组件，支持嵌套和快捷键
- **模态框**：使用shadcn Dialog组件，支持标题、内容、操作按钮

#### 7.1.3 布局指南
- **容器**：使用shadcn Container组件，提供一致的最大宽度
- **网格**：使用CSS Grid或Flexbox实现布局
- **间距**：使用shadcn的spacing系统，确保一致的间距
- **响应式**：使用Tailwind CSS的响应式类

#### 7.1.4 交互模式
- **悬停效果**：所有可交互元素都有悬停状态
- **点击反馈**：按钮点击时有按下效果
- **焦点状态**：使用outline或ring实现清晰的焦点状态
- **加载状态**：使用shadcn Skeleton或Loading组件
- **错误状态**：使用shadcn Alert组件显示错误信息

### 7.2 颜色方案
- **主色调**：采用Figma设计规范中的主色调，通过shadcn的tailwind.config.js配置
- **辅助色**：用于状态提示、按钮等
- **中性色**：用于背景、文本等，遵循shadcn的中性色系统
- **功能色**：用于错误、警告、成功等状态

### 7.3 字体规范
- **标题字体**：16px粗体
- **副标题字体**：14px半粗体
- **正文字体**：12px常规
- **代码字体**：等宽字体，12px
- **字体系统**：使用shadcn的font system，确保跨平台一致性

### 7.4 间距规范
- **内边距**：16px（标准）
- **外边距**：8px（标准）
- **组件间距**：12px（标准）
- **间距系统**：使用shadcn的spacing scale，确保一致的间距

### 7.5 阴影与圆角
- **卡片阴影**：采用shadcn的shadow系统，支持不同层级的阴影
- **按钮圆角**：4px（标准）
- **卡片圆角**：8px（标准）
- **圆角系统**：使用shadcn的radius scale，确保一致的圆角

### 7.6 图标解决方案

#### 7.6.1 问题分析
- **当前问题**：使用emoji作为图标，视觉风格不统一，缺乏专业感
- **需求**：专业、统一的图标系统，支持明暗主题切换，可根据主色配置动态调整

#### 7.6.2 推荐图标库

##### 7.6.2.1 Radix Icons
- **优势**：
  - 与shadcn UI完美集成
  - 轻量级，专为设计系统打造
  - 支持24x24和16x16两种尺寸
  - 提供TypeScript类型支持
  - 支持树摇，减小包体积
- **使用方式**：
  ```bash
  npm install @radix-ui/react-icons
  ```

#### 7.6.3 图标使用规范

##### 7.6.3.1 尺寸规范
- **小型图标**：16x16px（用于按钮、输入框）
- **中型图标**：20x20px（用于导航、菜单）
- **大型图标**：24x24px（用于空状态、标题）

##### 7.6.3.2 颜色规范
- **默认图标**：使用中性色（neutral-500）
- **强调图标**：使用主色调
- **成功图标**：使用绿色（success-500）
- **警告图标**：使用黄色（warning-500）
- **错误图标**：使用红色（destructive-500）

##### 7.6.3.3 图标映射

| 功能 | Radix Icons |
|------|------------|
| 文件夹 | FolderOpen |
| 文件 | FileText |
| Markdown文件 | FileText |
| SolarWire文件 | Code |
| 打开 | FolderOpen |
| 保存 | Save |
| 编辑 | Edit |
| 删除 | TrashCan |
| Git提交 | GitCommit |
| Git历史 | GitBranch |
| 搜索 | Search |
| 设置 | Settings |
| 帮助 | HelpCircle |
| 关闭 | X |
| 展开 | ChevronDown |
| 折叠 | ChevronRight |

#### 7.6.4 主题支持
- **明暗主题**：图标颜色会根据当前主题自动调整
- **主色配置**：图标颜色可根据项目主色配置动态调整
- **实现方式**：使用CSS变量和Tailwind的theme()函数

#### 7.6.5 图标组件封装

```tsx
// components/ui/icon.tsx
import * as RadixIcons from '@radix-ui/react-icons';

interface IconProps {
  name: keyof typeof RadixIcons;
  size?: number;
  className?: string;
  color?: string;
}

const Icon: React.FC<IconProps> = ({ name, size = 20, className = '', color = 'currentColor' }) => {
  if (RadixIcons[name]) {
    const IconComponent = RadixIcons[name];
    return <IconComponent className={className} style={{ width: size, height: size, color }} />;
  }
  
  return null;
};

export default Icon;
```

## 8. 技术实现方案

### 8.1 shadcn UI 集成方案

#### 8.1.1 安装与配置
- **安装shadcn UI**：
  ```bash
  npx shadcn-ui@latest init
  ```
- **安装必要依赖**：
  ```bash
  npm install tailwindcss postcss autoprefixer @radix-ui/react-icons
  ```
- **配置tailwind.config.js**：
  ```js
  /** @type {import('tailwindcss').Config} */
  module.exports = {
    darkMode: ["class"],
    content: [
      './pages/**/*.{ts,tsx}',
      './components/**/*.{ts,tsx}',
      './app/**/*.{ts,tsx}',
      './src/**/*.{ts,tsx}',
    ],
    theme: {
      container: {
        center: true,
        padding: "2rem",
        screens: {
          "2xl": "1400px",
        },
      },
      extend: {
        colors: {
          border: "hsl(var(--border))",
          input: "hsl(var(--input))",
          ring: "hsl(var(--ring))",
          background: "hsl(var(--background))",
          foreground: "hsl(var(--foreground))",
          primary: {
            DEFAULT: "hsl(var(--primary))",
            foreground: "hsl(var(--primary-foreground))",
          },
          secondary: {
            DEFAULT: "hsl(var(--secondary))",
            foreground: "hsl(var(--secondary-foreground))",
          },
          destructive: {
            DEFAULT: "hsl(var(--destructive))",
            foreground: "hsl(var(--destructive-foreground))",
          },
          muted: {
            DEFAULT: "hsl(var(--muted))",
            foreground: "hsl(var(--muted-foreground))",
          },
          accent: {
            DEFAULT: "hsl(var(--accent))",
            foreground: "hsl(var(--accent-foreground))",
          },
          popover: {
            DEFAULT: "hsl(var(--popover))",
            foreground: "hsl(var(--popover-foreground))",
          },
          card: {
            DEFAULT: "hsl(var(--card))",
            foreground: "hsl(var(--card-foreground))",
          },
        },
        borderRadius: {
          lg: "var(--radius)",
          md: "calc(var(--radius) - 2px)",
          sm: "calc(var(--radius) - 4px)",
        },
        keyframes: {
          "accordion-down": {
            from: { height: 0 },
            to: { height: "var(--radix-accordion-content-height)" },
          },
          "accordion-up": {
            from: { height: "var(--radix-accordion-content-height)" },
            to: { height: 0 },
          },
        },
        animation: {
          "accordion-down": "accordion-down 0.2s ease-out",
          "accordion-up": "accordion-up 0.2s ease-out",
        },
      },
    },
    plugins: [require("tailwindcss-animate")],
  }
  ```
- **配置CSS变量**：
  ```css
  /* src/styles/globals.css */
  @tailwind base;
  @tailwind components;
  @tailwind utilities;
  
  @layer base {
    :root {
      --background: 0 0% 100%;
      --foreground: 222.2 84% 4.9%;
      
      --card: 0 0% 100%;
      --card-foreground: 222.2 84% 4.9%;
      
      --popover: 0 0% 100%;
      --popover-foreground: 222.2 84% 4.9%;
      
      --primary: 222.2 47.4% 11.2%;
      --primary-foreground: 210 40% 98%;
      
      --secondary: 210 40% 96.1%;
      --secondary-foreground: 222.2 47.4% 11.2%;
      
      --muted: 210 40% 96.1%;
      --muted-foreground: 215.4 16.3% 46.9%;
      
      --accent: 210 40% 96.1%;
      --accent-foreground: 222.2 47.4% 11.2%;
      
      --destructive: 0 84.2% 60.2%;
      --destructive-foreground: 210 40% 98%;
      
      --border: 214.3 31.8% 91.4%;
      --input: 214.3 31.8% 91.4%;
      --ring: 222.2 84% 4.9%;
      
      --radius: 0.5rem;
    }
    
    .dark {
      --background: 222.2 84% 4.9%;
      --foreground: 210 40% 98%;
      
      --card: 222.2 84% 4.9%;
      --card-foreground: 210 40% 98%;
      
      --popover: 222.2 84% 4.9%;
      --popover-foreground: 210 40% 98%;
      
      --primary: 210 40% 98%;
      --primary-foreground: 222.2 47.4% 11.2%;
      
      --secondary: 217.2 32.6% 17.5%;
      --secondary-foreground: 210 40% 98%;
      
      --muted: 217.2 32.6% 17.5%;
      --muted-foreground: 215 20.2% 65.1%;
      
      --accent: 217.2 32.6% 17.5%;
      --accent-foreground: 210 40% 98%;
      
      --destructive: 0 62.8% 30.6%;
      --destructive-foreground: 210 40% 98%;
      
      --border: 217.2 32.6% 17.5%;
      --input: 217.2 32.6% 17.5%;
      --ring: 212.7 26.8% 83.9%;
    }
  }
  
  @layer base {
    * {
      @apply border-border;
    }
    body {
      @apply bg-background text-foreground;
    }
  }
  ```

#### 8.1.2 组件安装
- **安装基础组件**：
  ```bash
  npx shadcn-ui@latest add button card input tabs dialog dropdown-menu alert skeleton loading
  ```

### 8.2 布局实现
- **三栏布局**：使用CSS Grid实现
- **可拖拽分隔线**：使用React Resizable或shadcn的Resizable组件
- **响应式设计**：使用Tailwind CSS的响应式类

### 8.3 图标系统实现

#### 8.3.1 安装图标库
- **Radix Icons**：
  ```bash
  npm install @radix-ui/react-icons
  ```

#### 8.3.2 图标组件封装
- **创建图标组件**：`components/ui/icon.tsx`
- **实现主题支持**：通过CSS变量实现明暗主题切换
- **实现主色适配**：通过Tailwind的theme()函数实现主色动态调整

#### 8.3.3 图标使用示例

```tsx
// 文件视图中的图标使用
import Icon from '../ui/icon';

// 文件夹图标
<Icon name="FolderOpen" size={16} className="mr-2" />

// 文件图标
<Icon name="FileText" size={16} className="mr-2" />

// 按钮图标
<Button>
  <Icon name="Save" size={16} className="mr-2" />
  Save
</Button>
```

### 8.4 状态管理
- **继续使用Zustand**进行状态管理
- **扩展现有store**，添加UI相关状态
- **实现主题切换**：添加主题状态和切换功能
- **实现布局状态**：管理三栏宽度和折叠状态

### 8.5 编辑器集成
- **继续使用Monaco Editor**作为代码编辑器
- **集成Markdown-it或Remark**进行Markdown渲染
- **集成Mermaid.js**进行图表渲染
- **集成现有的SolarWire解析和渲染**功能

### 8.6 Git集成
- **继续使用simple-git库**进行Git操作
- **实现Git状态监控和显示**
- **提供Git提交、分支管理等功能**
- **使用shadcn组件**实现Git相关UI

## 9. 实现步骤

### 9.1 准备阶段：shadcn UI集成
1. **安装shadcn UI**：执行初始化命令
2. **安装必要依赖**：Tailwind CSS、图标库等
3. **配置项目**：设置tailwind.config.js和CSS变量
4. **安装基础组件**：按钮、卡片、输入框等

### 9.2 第一阶段：图标系统实现
1. **安装图标库**：Radix Icons
2. **创建图标组件**：封装Icon组件，支持主题切换
3. **替换现有图标**：将emoji图标替换为专业图标
4. **实现图标映射**：根据功能映射到合适的图标

### 9.3 第二阶段：布局重构
1. **重构AppLayout组件**：实现三栏布局
2. **实现可拖拽分隔线**：使用React Resizable
3. **实现响应式布局**：使用Tailwind CSS的响应式类
4. **应用shadcn样式**：统一视觉风格

### 9.4 第三阶段：左侧栏重构
1. **实现视图标签页**：使用shadcn Tabs组件
2. **实现文件视图**：树状结构，使用专业图标
3. **实现需求视图**：卡片网格布局
4. **实现SolarWire视图**：卡片列表布局
5. **实现Git视图**：历史记录和操作界面

### 9.5 第四阶段：中间栏增强
1. **集成Monaco Editor**：保持现有功能
2. **实现Markdown语法高亮**：使用shadcn样式
3. **实现自动保存机制**：保持现有功能
4. **实现编辑工具栏**：使用shadcn Button组件

### 9.6 第五阶段：右侧栏实现
1. **实现MD预览模式**：实时渲染
2. **集成Mermaid图表渲染**：保持现有功能
3. **实现SolarWire可视化编辑**：使用shadcn组件
4. **实现属性编辑面板**：使用shadcn Input组件

### 9.7 第六阶段：主题与交互优化
1. **实现主题切换**：支持明暗主题
2. **实现主色配置**：动态调整图标颜色
3. **优化交互反馈**：悬停、点击、焦点状态
4. **优化加载状态**：使用shadcn Loading组件
5. **进行性能优化**：确保流畅体验

## 10. 测试计划

### 10.1 功能测试
- **shadcn UI组件测试**：测试所有shadcn组件的功能
- **图标系统测试**：测试图标显示、主题切换和主色适配
- **视图切换测试**：测试所有视图的切换功能
- **文件操作测试**：测试文件的打开、保存、编辑功能
- **编辑功能测试**：测试Monaco Editor的所有功能
- **预览功能测试**：测试Markdown和SolarWire预览
- **Git操作测试**：测试Git提交、历史记录等功能

### 10.2 响应式测试
- **屏幕尺寸适配**：测试不同屏幕尺寸的布局
- **折叠/展开功能**：测试左侧和右侧栏的折叠功能
- **移动端适配**：测试小屏幕设备的适配
- **断点测试**：测试Tailwind CSS断点的正确性

### 10.3 主题测试
- **明暗主题切换**：测试主题切换功能
- **图标颜色适配**：测试图标在不同主题下的颜色
- **主色配置测试**：测试主色变更时的图标颜色调整
- **CSS变量测试**：测试CSS变量的正确应用

### 10.4 性能测试
- **大文件编辑性能**：测试大文件的编辑响应速度
- **实时预览性能**：测试预览的渲染速度
- **Git操作性能**：测试Git操作的响应时间
- **布局调整性能**：测试拖拽调整的流畅度
- **图标加载性能**：测试图标加载和渲染性能

### 10.5 兼容性测试
- **操作系统兼容性**：测试不同操作系统
- **Electron版本兼容性**：测试不同Electron版本
- **分辨率兼容性**：测试不同屏幕分辨率
- **浏览器兼容性**：测试Web版本的兼容性

### 10.6 可访问性测试
- **WCAG合规性**：测试符合WCAG 2.1标准
- **键盘导航**：测试键盘导航功能
- **屏幕阅读器**：测试屏幕阅读器兼容性
- **色彩对比度**：测试色彩对比度合规性

## 11. 结论

本设计方案基于Figma设计规范和shadcn UI设计系统，对SolarWire Editor进行了全面的UI重构规划。通过实现三栏式布局、集成shadcn UI组件、实现专业图标系统、增强编辑功能、完善预览体验，以及实现响应式设计，将显著提升用户体验。

### 核心改进

1. **专业图标系统**：替换了原有的emoji图标，使用Radix Icons，实现了统一、专业的视觉风格
2. **shadcn UI集成**：采用现代的组件库，提供一致的设计语言和交互体验
3. **主题支持**：实现了明暗主题切换，图标颜色会根据主题自动调整
4. **响应式设计**：适配不同屏幕尺寸，提供最佳的视觉体验
5. **性能优化**：确保流畅的编辑和预览体验

### 实施价值

- **提升专业感**：通过专业图标和统一的设计系统，提升应用的专业形象
- **改善用户体验**：直观的布局和流畅的交互，提高用户的工作效率
- **增强可维护性**：使用shadcn UI的组件化设计，提高代码的可维护性
- **支持扩展性**：模块化的设计，便于未来功能的扩展

实施本方案后，SolarWire Editor将成为一个更加专业、直观、高效的文档编辑工具，为用户提供更好的编辑体验。同时，保持了与现有功能的兼容性，确保平滑过渡。