# SolarWire MCP Server

产品经理工程化工具 - Model Context Protocol 服务器

## 功能

- 📄 **generate-prd** - 生成包含 SolarWire 线框图的完整 PRD 文档
- 🔄 **code-to-prd** - 从现有代码逆向工程生成 PRD 文档
- ✅ **validate-solarwire-code** - 校验 SolarWire 代码语法和可渲染性
- 🎨 **render-svg** - 将 SolarWire 代码渲染为 SVG 图片
- 📦 **generate-component-library** - 生成或修改 .swc 组件库文件
- 🧪 **prd-to-testcase** - 从 PRD 文档生成详细测试用例

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

### 构建

```bash
npm run build
```

### 运行

```bash
npm start
```

## 架构

```
mcp-server/
├── src/
│   ├── server.ts                    # MCP Server 核心
│   ├── tools/                       # MCP Tools
│   │   ├── generate-prd.tool.ts
│   │   ├── code-to-prd.tool.ts
│   │   ├── validate-code.tool.ts
│   │   ├── render-svg.tool.ts
│   │   ├── generate-component.tool.ts
│   │   └── prd-to-testcase.tool.ts
│   ├── engines/                     # 核心引擎（单一副本）
│   │   ├── solarwire-parser/
│   │   └── solarwire-renderer/
│   ├── resources/                   # MCP Resources
│   ├── prompts/                     # MCP Prompts
│   └── middleware/                  # 中间件
│       └── logger.ts
├── tests/                           # 单元测试
├── output/                          # 输出目录
├── package.json
└── tsconfig.json
```

## MCP 工具说明

### generate-prd

生成完整 PRD 文档，包括：
- 产品概述
- 用户故事
- 功能列表
- SolarWire 线框图
- Mermaid 流程图

### code-to-prd

从现有代码逆向工程生成 PRD：
- 前端分析（提取 UI 结构、组件、交互）
- 后端分析（提取 API、数据模型、业务逻辑）
- 自动生成 SolarWire 线框图
- 支持增量分析（仅前端/仅后端/全栈）
- 输出到 `.solarwire/[project-name]/solarwire-prd.md`

### validate-solarwire-code

校验 SolarWire 代码：
- 语法正确性
- 坐标系统验证
- 属性格式检查
- 可渲染性确认

### render-svg

将 SolarWire 代码渲染为 SVG：
- 带注释版本（with-notes）
- 不带注释版本（without-notes）

### generate-component-library

生成 .swc 组件库文件：
- 定义分类结构
- 添加组件（使用 SolarWire 代码）
- 支持修改现有组件库

### prd-to-testcase

从 PRD 生成测试用例：
- 解析用户故事
- 生成 Given-When-Then 测试
- 支持 JSON/CSV/Excel 输出格式

## MCP Prompts

预置的产品经理常用对话模板：

- **brainstorm** - 头脑风暴，引导需求收集（目标用户、核心问题、关键功能等）
- **requirements-analysis** - 需求分析，从多维度评估需求（问题理解、用户场景、优先级、可行性）
- **user-story** - 用户故事编写，生成标准格式和验收标准
- **acceptance-criteria** - 验收标准制定，Given-When-Then 格式
- **competitor-analysis** - 竞品分析框架（市场概况、功能对比、差异化分析）

## 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| PORT | 3000 | 服务器端口 |
| LOG_LEVEL | info | 日志级别 |
| SKILLS_DIR | ../editor-skills | Skills 目录路径 |
| OUTPUT_DIR | ./output | 输出目录路径 |

## 参考

现有 Skills 目录保留作为文档参考：
- `../editor-skills/solarwire-basic` - 语法规则
- `../editor-skills/solarwire-prd` - PRD 生成
- `../editor-skills/solarwire-component-generator` - 组件库生成
- `../editor-skills/solarwire-prd-to-testcase` - 测试用例生成
- `../editor-skills/solarwire-code-to-prd` - 代码逆向分析
