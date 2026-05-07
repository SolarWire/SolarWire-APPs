# SolarWire 语法规则与组件库生成技能设计

> 创建日期：2026-04-21
> 状态：待审核

## 背景与目标

### 问题陈述

当前项目存在两个关键需求：

1. **AI 生成 SolarWire 代码时容易出错** - 需要一份完整的语法规则文档，让 AI 充分理解语法，避免生成渲染错误的代码
2. **组件库文件格式和语法错误** - 现有 .swc.json 文件使用了错误的语法（相对坐标简化语法）和错误的文件后缀（应为 .swc）

### 目标

创建两个 Skill 文件：

1. **solarwire-basic** - SolarWire 语法规则，包含完整的语法说明和自动校验脚本
2. **solarwire-component-generator** - SolarWire 组件库生成规则，用于生成/修改 .swc 格式组件库文件

---

## 设计概述

### 文件结构

```
editor-skills/
├── solarwire-prd/              # 现有技能（保持不变）
│   ├── SKILL.md
│   ├── README.md
│   ├── EXAMPLES.md
│   ├── lib/parser/             # 解析器
│   ├── lib/renderer-svg/       # SVG 渲染器
│   └── generate-svg.js
├── solarwire-basic/            # 新技能：语法规则
│   └── SKILL.md
└── solarwire-component-generator/  # 新技能：组件库生成
    └── SKILL.md
```

### 关键设计决策

#### 1. 语法规则覆盖范围

**决策：只覆盖 PRD 语法**

- solarwire-basic 只定义 PRD 语法（绝对坐标 `@(x,y)`，属性格式 `w=`, `h=`, `bg=` 等）
- 组件库中现有的简化语法（`rectangle 20 10 120 36 #1677ff 0 0 6`）是错误的，不使用

#### 2. 解析器和渲染器来源

**决策：直接引用 editor/src/lib 中的源码**

- solarwire-basic 的校验脚本使用 `editor/src/lib/parser/` 和 `editor/src/lib/renderer/` 中的源码
- 不复制代码，而是在 SKILL.md 中说明引用路径
- AI 需要知道脚本的相对路径：`../../editor/src/lib/`

#### 3. 技能间关联

**决策：solarwire-component-generator 引用 solarwire-basic**

- solarwire-component-generator 不在内部复制语法规则
- 在 SKILL.md 中明确引用 solarwire-basic 获取语法信息
- 保持单一数据源，避免规则不一致

#### 4. .swc 文件格式

**决策：.swc 是 JSON 格式，但使用 .swc 后缀**

- 文件内容仍是标准 JSON
- 使用 `.swc` 后缀（不是 `.swc.json`）
- 组件的 `code` 字段使用 PRD 语法的 SolarWire 代码

---

## 详细设计

### 一、solarwire-basic SKILL.md

#### 1. 技能概述

```markdown
# SolarWire 语法规则 (solarwire-basic)

帮助 AI 理解和正确生成 SolarWire 线框图代码的规则和工具。
```

#### 2. 核心内容结构

##### 2.1 语法总览

**元素类型语法**：

| 元素类型 | 语法格式 | 用途 |
|---------|---------|------|
| 矩形元素 | `["文本"] @(x,y) w=100 h=40` | 按钮、输入框、容器 |
| 圆角矩形 | `("文本") @(x,y) w=100 h=40 r=8` | 卡片、圆角容器 |
| 圆形元素 | `(("文本")) @(x,y) w=40` | 头像、圆形图标 |
| 纯文本 | `"文本" @(x,y) size=13` | 标签、标题 |
| 占位符 | `[?"文本"] @(x,y) w=100 h=40` | 待确定区域 |
| 图片 | `<https://url> @(x,y) w=100 h=100` | 图片展示 |
| 线条 | `-- "标签" -- @(x1,y1)->(x2,y2)` | 分割线、连接线 |
| 表格 | `## @(x,y) w=500` | 表格容器 |
| 表格行 | `  # @(x,y) w=400` | 表格行（需缩进） |

##### 2.2 坐标系统

**绝对坐标**：`@(x,y)`
- `@(100,50)` 表示元素左上角在画布 100x50 位置
- **推荐使用**：始终使用绝对坐标

**边缘引用坐标**：`@(L+10,T+5)` 等
- **不推荐使用** - AI 应避免使用边缘引用坐标，容易出错
- 包括：`@(L+10,T+5)`、`@(R-10,B+0)`、`@(C+0,C+0)` 等

**线条相对终点**：
- `@(100,50)->(+200,+0)` - 起点绝对，终点相对

##### 2.3 属性系统

**常用属性**：

| 属性 | 说明 | 示例 |
|------|------|------|
| `w` | 宽度 | `w=120` |
| `h` | 高度 | `h=40` |
| `bg` | 背景色 | `bg=#3B82F6` 或 `bg=#3B82F620`（含透明度） |
| `c` | 文字颜色 | `c=#FFFFFF` |
| `size` | 字体大小 | `size=14` |
| `bold` | 粗体 | `bold` 或 `bold=false` |
| `align` | 对齐方式 | `align=center` |
| `r` | 圆角半径 | `r=8` |
| `stroke` | 边框颜色 | `stroke=#CCCCCC` |
| `strokeWidth` | 边框宽度 | `strokeWidth=2` |
| `padding` | 内边距 | `padding=16` |
| `multiline` | 多行文本 | `multiline` |
| `truncate` | 截断文本 | `truncate` |

**属性格式**：`key=value` 或单独 `key`（表示 true）

##### 2.4 容器嵌套规则

- 表格 `##` 和表格行 `#` 是容器元素
- 子元素必须比父元素多缩进（至少 2 个空格）
- 缩进使用空格，不使用 Tab

##### 2.5 声明语法

- `!key=value` - 文档级声明
- `!key` - 布尔声明（值为 true）
- 例如：`!primaryColor=#3B82F6`

##### 2.6 注释语法

- `// 注释内容` - 单行注释

##### 2.7 Note 元素（多行文本注释）

**语法**：使用三引号 `"""内容"""`

- 支持代码内换行
- 用于添加多行注释或说明
- 示例：
  ```solarwire
  """这是一个登录按钮
  用于用户登录操作
  点击后跳转到登录页面""" @(100,50) w=120 h=40
  ```

#### 3. 校验脚本说明

**位置引用**：`../../editor/src/lib/`

**校验流程**：

```
生成 SolarWire 代码
    ↓
使用 parser/index.ts 解析代码
    ↓
解析成功 → 使用 renderer/index.ts 生成 SVG
    ↓
SVG 生成成功 → 代码正确
    ↓
任何步骤失败 → 根据错误信息修正代码
```

**校验命令示例**（AI 在脑海中模拟执行）：

```typescript
import { parse } from '../../editor/src/lib/parser';
import { generateSVG } from '../../editor/src/lib/renderer';

const code = `[\"Login\"] @(100,50) w=120 h=40 bg=#3B82F6 c=#FFFFFF`;

// 步骤1：解析
const doc = parse(code);

// 步骤2：渲染
const svg = generateSVG(doc.elements);

// 如果都成功，代码正确
```

**常见错误类型**：

1. **语法格式错误** - 括号不匹配、缺少坐标等
2. **属性格式错误** - 属性名错误、值格式不对
3. **缩进错误** - 表格行缩进不足
4. **坐标错误** - 使用了不存在的坐标格式

#### 4. 最佳实践

- 每个元素独立一行
- 使用有意义的文本内容
- 合理设置元素尺寸
- 注意颜色对比度
- 避免元素重叠（除非有意为之）

---

### 二、solarwire-component-generator SKILL.md

#### 1. 技能概述

```markdown
# SolarWire 组件库生成 (solarwire-component-generator)

根据用户需求生成或修改 .swc 格式的 SolarWire 组件库文件。
```

#### 2. 核心内容结构

##### 2.1 组件库文件结构

```json
{
  "$schema": "solarwire-component-library-v1",
  "metadata": {
    "id": "unique-uuid",
    "name": "组件库名称",
    "description": "组件库描述",
    "version": "1.0.0",
    "createdAt": "2026-04-21T00:00:00Z",
    "updatedAt": "2026-04-21T00:00:00Z"
  },
  "categories": [
    {
      "id": "cat-general",
      "name": "通用",
      "parentId": null,
      "order": 1
    }
  ],
  "components": [
    {
      "id": "btn-primary",
      "name": "主按钮",
      "description": "用于主要操作的高亮按钮",
      "categoryId": "cat-general",
      "code": "[\"按钮\"] @(0,0) w=120 h=40 bg=#1677ff c=#ffffff r=6"
    }
  ]
}
```

##### 2.2 字段说明

**metadata 字段**：
- `id` - 唯一标识（UUID 格式）
- `name` - 组件库名称
- `description` - 组件库描述（可选）
- `version` - 版本号（语义化版本）
- `createdAt` - 创建时间
- `updatedAt` - 更新时间

**categories 字段**：
- `id` - 分类唯一标识
- `name` - 分类名称
- `parentId` - 父分类 ID（null 表示顶级分类）
- `order` - 排序序号

**components 字段**：
- `id` - 组件唯一标识
- `name` - 组件名称
- `description` - 组件描述
- `categoryId` - 所属分类 ID
- `code` - SolarWire 代码（使用 PRD 语法）

##### 2.3 语法规则引用

**重要：本技能不定义语法规则**

- SolarWire 语法规请参考 `../solarwire-basic/SKILL.md`
- 组件的 `code` 字段必须遵循 solarwire-basic 定义的语法
- 生成代码后，应使用 solarwire-basic 的校验流程验证代码正确性

##### 2.4 组件代码规范

**允许的语法元素**：
- 矩形 `["文本"]`
- 圆角矩形 `("文本")`
- 圆形 `(("文本"))`
- 纯文本 `"文本"`
- 占位符 `[?"文本"]`
- 线条 `--`
- 表格 `##` 和表格行 `#`

**避免使用的语法元素**：
- 图片 `<url>` - 组件库不包含图片组件

##### 2.5 组件生成规则

**根据用户需求生成组件**：

1. 理解用户描述的组件类型和样式
2. 确定组件的视觉结构（使用哪些元素）
3. 编写符合 PRD 语法的 SolarWire 代码
4. 使用 solarwire-basic 的校验流程验证代码
5. 生成完整的 .swc 文件结构

**组件示例：主按钮**

```json
{
  "id": "btn-primary",
  "name": "主按钮",
  "description": "用于主要操作的高亮按钮",
  "categoryId": "cat-button",
  "code": "[\"按钮\"] @(0,0) w=120 h=40 bg=#1677ff c=#ffffff r=6"
}
```

**组件示例：输入框**

```json
{
  "id": "input-default",
  "name": "默认输入框",
  "description": "单行文本输入框",
  "categoryId": "cat-input",
  "code": "[\"请输入...\"] @(0,0) w=200 h=40 bg=#ffffff stroke=#d9d9d9 strokeWidth=1 r=6"
}
```

##### 2.6 组件库生成流程

**新建组件库**：

1. 确定组件库名称和描述
2. 生成 metadata（id, version, 时间）
3. 定义分类结构（categories）
4. 根据需求逐个生成组件
5. 验证所有组件代码（使用 solarwire-basic 校验流程）
6. 输出完整的 .swc JSON 文件

**修改现有组件库**：

1. 读取现有 .swc 文件
2. 理解修改需求（新增/修改/删除组件）
3. 执行修改操作
4. 验证新增/修改的组件代码
5. 更新 updatedAt 时间
6. 输出更新后的 .swc 文件

---

## 实施计划

### 阶段一：创建 solarwire-basic SKILL.md

1. 创建 `editor-skills/solarwire-basic/SKILL.md`
2. 编写完整的语法规则文档（基于 solarwire-prd/SKILL.md 和 editor/src/lib/parser/grammar.pegjs）
3. 添加校验脚本说明（引用 editor/src/lib/ 路径）
4. 添加最佳实践和常见错误说明

### 阶段二：创建 solarwire-component-generator SKILL.md

1. 创建 `editor-skills/solarwire-component-generator/SKILL.md`
2. 编写组件库文件结构说明
3. 添加语法规则引用（指向 solarwire-basic）
4. 添加组件生成规则和示例
5. 添加组件库生成/修改流程说明

### 阶段三：验证

1. 检查两个技能文件的完整性
2. 验证语法描述的准确性
3. 确认路径引用的正确性
4. 审查文档结构和可读性

---

## 关键约束

1. **solarwire-basic 只定义 PRD 语法** - 不使用简化语法
2. **解析器/渲染器引用 editor/src/lib/** - 不复制代码
3. **solarwire-component-generator 引用 solarwire-basic** - 不重复语法规则
4. **.swc 文件使用 .swc 后缀** - 不是 .swc.json
5. **组件代码避免使用 image 元素** - 组件库不包含图片
6. **组件库不保留 thumbnail 字段** - 简化结构

---

## 自审清单

- [x] 无占位符或 TBD
- [x] 内部逻辑一致，无矛盾
- [x] 范围明确，聚焦两个技能文件
- [x] 需求无歧义，已明确语法、结构、关联关系
