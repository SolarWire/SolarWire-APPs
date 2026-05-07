# SolarWire Editor UI 重设计技术实施指南

## 1. 项目概述

本指南基于 `2026-04-14-solarwire-editor-ui-redesign.md` 文档，详细说明如何实现 SolarWire Editor 的 UI 重设计。指南包含具体的技术实现步骤、代码结构和最佳实践。

## 2. 技术栈配置

### 2.1 安装依赖

```bash
# 安装 shadcn UI
npx shadcn-ui@latest init

# 安装必要依赖
npm install tailwindcss postcss autoprefixer @radix-ui/react-icons

# 安装基础组件
npx shadcn-ui@latest add button card input tabs dialog dropdown-menu alert skeleton loading
```

### 2.2 配置文件

#### 2.2.1 tailwind.config.js

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
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

#### 2.2.2 src/styles/globals.css

```css
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

## 3. 图标系统实现

### 3.1 创建图标组件

#### 3.1.1 src/components/ui/icon.tsx

```tsx
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

### 3.2 图标使用示例

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

## 4. 布局实现

### 4.1 三栏布局

#### 4.1.1 src/components/layout/AppLayout.tsx

```tsx
import React from 'react';
import TopMenuBar from './TopMenuBar';
import MainContent from './MainContent';
import StatusBar from './StatusBar';
import './AppLayout.css';

const AppLayout: React.FC = () => {
  return (
    <div className="app-layout flex flex-col h-screen">
      <TopMenuBar />
      <MainContent />
      <StatusBar />
    </div>
  );
};

export default AppLayout;
```

#### 4.1.2 src/components/layout/MainContent.tsx

```tsx
import React, { useState } from 'react';
import LeftPanel from './LeftPanel';
import RightPanel from './RightPanel';
import ResizableDivider from '../ui/ResizableDivider';
import './MainContent.css';

const MainContent: React.FC = () => {
  const [leftPanelWidth, setLeftPanelWidth] = useState(300);
  const [rightPanelWidth, setRightPanelWidth] = useState(400);

  const handleLeftPanelResize = (newWidth: number) => {
    setLeftPanelWidth(newWidth);
  };

  const handleRightPanelResize = (newWidth: number) => {
    setRightPanelWidth(newWidth);
  };

  return (
    <div className="main-content flex flex-1 overflow-hidden">
      <div className="left-panel-container" style={{ width: `${leftPanelWidth}px` }}>
        <LeftPanel />
      </div>
      <ResizableDivider
        orientation="vertical"
        onResize={handleLeftPanelResize}
        currentSize={leftPanelWidth}
        minSize={200}
        maxSize={800}
      />
      <div className="center-panel-container flex-1 overflow-auto">
        {/* 中间编辑区内容 */}
      </div>
      <ResizableDivider
        orientation="vertical"
        onResize={handleRightPanelResize}
        currentSize={rightPanelWidth}
        minSize={200}
        maxSize={800}
      />
      <div className="right-panel-container" style={{ width: `${rightPanelWidth}px` }}>
        <RightPanel />
      </div>
    </div>
  );
};

export default MainContent;
```

## 5. 左侧栏实现

### 5.1 视图标签页

#### 5.1.1 src/components/views/ViewTabs.tsx

```tsx
import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import FileView from './FileView';
import RequirementView from './RequirementView';
import SolarWireView from './SolarWireView';
import GitView from './GitView';
import './ViewTabs.css';

const ViewTabs: React.FC = () => {
  return (
    <Tabs defaultValue="files" className="w-full h-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="files">Files</TabsTrigger>
        <TabsTrigger value="requirements">Requirements</TabsTrigger>
        <TabsTrigger value="solarwire">SolarWire</TabsTrigger>
        <TabsTrigger value="git">Git</TabsTrigger>
      </TabsList>
      <TabsContent value="files" className="h-[calc(100%-40px)] overflow-auto">
        <FileView />
      </TabsContent>
      <TabsContent value="requirements" className="h-[calc(100%-40px)] overflow-auto">
        <RequirementView />
      </TabsContent>
      <TabsContent value="solarwire" className="h-[calc(100%-40px)] overflow-auto">
        <SolarWireView />
      </TabsContent>
      <TabsContent value="git" className="h-[calc(100%-40px)] overflow-auto">
        <GitView />
      </TabsContent>
    </Tabs>
  );
};

export default ViewTabs;
```

### 5.2 文件视图

#### 5.2.1 src/components/views/FileView.tsx

```tsx
import React from 'react';
import { useFileStore } from '../../stores/fileStore';
import FileTree from '../editor/FileTree';
import { Button } from '@/components/ui/button';
import Icon from '../ui/icon';
import './FileView.css';

const FileView: React.FC = () => {
  const {
    fileTree,
    selectedFile,
    toggleDirectory,
    openFileAtPath,
    openDirectoryAtPath
  } = useFileStore();

  const handleOpen = async (): Promise<void> => {
    try {
      const api = (window as any).api;
      if (!api || !api.openFileDialog) {
        console.warn('File dialog not available in current environment');
        alert('File dialog is only available in the Electron app');
        return;
      }

      const paths: string[] = await api.openFileDialog({
        properties: ['openFile', 'openDirectory', 'multiSelections'],
      });

      if (paths && paths.length > 0) {
        const path = paths[0];

        try {
          if (openDirectoryAtPath) {
            await openDirectoryAtPath(path);
          }
        } catch (err) {
          if (openFileAtPath) {
            try {
              await openFileAtPath(path);
            } catch (fileErr) {
              console.error('Failed to open as file or directory', fileErr);
            }
          }
        }
      }
    } catch (err) {
      console.error('Open dialog failed', err);
    }
  };

  const handleSelectFile = async (file: any) => {
    if (openFileAtPath) {
      await openFileAtPath(file.path);
    }
  };

  const renderFileTree = () => {
    if (fileTree.length === 0 && !selectedFile) {
      return (
        <div className="file-tree-container h-full flex flex-col">
          <div className="file-tree-header p-4 border-b flex justify-between items-center">
            <h3 className="text-lg font-semibold">Files</h3>
            <Button size="sm" onClick={handleOpen}>
              <Icon name="FolderOpen" size={16} className="mr-2" />
              Open
            </Button>
          </div>
          <div className="file-tree flex-1 flex flex-col items-center justify-center p-8">
            <div className="empty-icon mb-4">
              <Icon name="FolderOpen" size={48} className="text-muted-foreground" />
            </div>
            <div className="empty-text text-muted-foreground mb-6 text-center">
              Open a file or folder to get started
            </div>
            <Button onClick={handleOpen}>
              <Icon name="FolderOpen" size={16} className="mr-2" />
              Open File
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="file-tree-container h-full flex flex-col">
        <div className="file-tree-header p-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold">Files</h3>
          <Button size="sm" onClick={handleOpen}>
            <Icon name="FolderOpen" size={16} className="mr-2" />
            Open
          </Button>
        </div>
        <FileTree
          nodes={fileTree}
          selectedFile={selectedFile}
          onToggleDirectory={toggleDirectory!}
          onSelectFile={handleSelectFile}
        />
      </div>
    );
  };

  return (
    <div className="file-view h-full">
      {renderFileTree()}
    </div>
  );
};

export default FileView;
```

## 6. 中间栏实现

### 6.1 编辑器组件

#### 6.1.1 src/components/editor/MonacoEditor.tsx

```tsx
import React from 'react';
import Editor from '@monaco-editor/react';
import { useEditorStore } from '../../stores/editorStore';
import './MonacoEditor.css';

const MonacoEditor: React.FC = () => {
  const {
    currentFile,
    content,
    setContent,
    language
  } = useEditorStore();

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setContent(value);
    }
  };

  return (
    <div className="monaco-editor-container h-full">
      {currentFile ? (
        <Editor
          height="100%"
          defaultLanguage={language}
          value={content}
          onChange={handleEditorChange}
          options={{
            minimap: { enabled: true },
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            automaticLayout: true
          }}
        />
      ) : (
        <div className="empty-editor flex items-center justify-center h-full text-muted-foreground">
          Select a file to edit
        </div>
      )}
    </div>
  );
};

export default MonacoEditor;
```

## 7. 右侧栏实现

### 7.1 预览模式

#### 7.1.1 src/components/editor/MarkdownPreview.tsx

```tsx
import React, { useEffect, useState } from 'react';
import { useEditorStore } from '../../stores/editorStore';
import { marked } from 'marked';
import mermaid from 'mermaid';
import './MarkdownPreview.css';

const MarkdownPreview: React.FC = () => {
  const { content, currentFile } = useEditorStore();
  const [preview, setPreview] = useState('');

  useEffect(() => {
    if (content) {
      // 配置marked
      marked.setOptions({
        breaks: true,
        gfm: true
      });

      // 处理mermaid图表
      const renderer = new marked.Renderer();
      renderer.code = (code: string, language: string | undefined) => {
        if (language === 'mermaid') {
          return `<div class="mermaid">${code}</div>`;
        }
        return `<pre><code class="language-${language}">${code}</code></pre>`;
      };

      marked.use({
        renderer
      });

      const html = marked(content);
      setPreview(html);

      // 渲染mermaid图表
      setTimeout(() => {
        mermaid.init();
      }, 0);
    } else {
      setPreview('');
    }
  }, [content]);

  return (
    <div className="markdown-preview-container h-full overflow-auto p-4">
      {currentFile ? (
        <div className="markdown-content" dangerouslySetInnerHTML={{ __html: preview }} />
      ) : (
        <div className="empty-preview flex items-center justify-center h-full text-muted-foreground">
          Select a file to preview
        </div>
      )}
    </div>
  );
};

export default MarkdownPreview;
```

## 8. 主题切换

### 8.1 主题管理

#### 8.1.1 src/stores/themeStore.ts

```ts
import { create } from 'zustand';

interface ThemeStore {
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (isDark: boolean) => void;
}

export const useThemeStore = create<ThemeStore>((set) => ({
  isDark: false,
  toggleTheme: () => set((state) => ({
    isDark: !state.isDark
  })),
  setTheme: (isDark) => set({ isDark })
}));
```

#### 8.1.2 src/App.tsx

```tsx
import React, { useEffect } from 'react';
import AppLayout from './components/layout/AppLayout';
import { useThemeStore } from './stores/themeStore';
import './styles/globals.css';

const App: React.FC = () => {
  const { isDark } = useThemeStore();

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  return (
    <div className="app">
      <AppLayout />
    </div>
  );
};

export default App;
```

## 9. 性能优化

### 9.1 代码分割

```tsx
// 使用动态导入
const SolarWireView = React.lazy(() => import('./views/SolarWireView'));
const GitView = React.lazy(() => import('./views/GitView'));

// 在组件中使用
<React.Suspense fallback={<div>Loading...</div>}>
  <SolarWireView />
</React.Suspense>
```

### 9.2 虚拟滚动

对于长列表，使用虚拟滚动以提高性能：

```bash
npm install react-window
```

```tsx
import { FixedSizeList as List } from 'react-window';

const FileTreeList = ({ items }) => (
  <List
    height={400}
    itemCount={items.length}
    itemSize={40}
    width="100%"
  >
    {({ index, style, isScrolling }) => (
      <div style={style}>
        {items[index].name}
      </div>
    )}
  </List>
);
```

## 10. 测试策略

### 10.1 单元测试

```bash
# 运行单元测试
npm run test

# 运行测试覆盖率
npm run test:coverage
```

### 10.2 E2E测试

```bash
# 运行E2E测试
npm run test:e2e

# 运行E2E测试（UI模式）
npm run test:e2e:ui
```

## 11. 部署流程

### 11.1 构建生产版本

```bash
# 构建生产版本
npm run build

# 构建并发布
npm run publish
```

### 11.2 发布说明

发布前，更新 `RELEASE.md` 文件，包含以下内容：

- 版本号
- 发布日期
- 主要变更
- 修复的问题
- 新功能

## 12. 维护与支持

### 12.1 代码规范

```bash
# 运行ESLint
npm run lint

# 运行Prettier
npm run format

# TypeScript类型检查
npx tsc --noEmit
```

### 12.2 常见问题排查

- **图标不显示**：检查Radix Icons安装和导入
- **主题切换不生效**：检查CSS变量和class应用
- **布局问题**：检查flexbox/grid配置
- **性能问题**：检查虚拟滚动和代码分割

## 13. 结论

本技术实施指南提供了 SolarWire Editor UI 重设计的详细实现步骤。通过遵循本指南，可以确保实现一个符合 Figma 设计规范、使用 shadcn UI 和 Radix Icons 的现代化、专业的编辑器界面。

实施过程中，应严格遵循项目计划中的时间节点和质量要求，确保按时交付高质量的产品。