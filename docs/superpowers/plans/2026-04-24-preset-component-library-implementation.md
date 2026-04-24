# SolarWire 预设组件库实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 `presets/` 目录下创建 6 套设计语言的完整组件库文件，每套包含 Web + Mobile 双平台，遵循统一的 28 分类体系。

**Architecture:** 每个设计语言独立一个 `.swc` 文件，文件内 `platforms.web` 和 `platforms.mobile` 完全独立，无跨平台引用。沿用现有 `ant-design.swc` 的 Markdown + solarwire 代码块格式。

**Tech Stack:** SolarWire DSL、`.swc` 文件格式（Markdown 风格）

---

## 交付物清单

| 文件 | 设计语言 | 平台数 | 分类数 |
|------|----------|--------|--------|
| 组件库-ant-design.swc | Ant Design | Web + Mobile | 28 |
| 组件库-material-design.swc | Material Design | Web + Mobile | 28 |
| 组件库-shadcn-ui.swc | shadcn/ui | Web + Mobile | 28 |
| 组件库-linear.swc | Linear | Web + Mobile | 28 |
| 组件库-semi-design.swc | Semi Design | Web + Mobile | 28 |
| 组件库-tailwind-ui.swc | Tailwind UI | Web + Mobile | 28 |

---

## 文件格式模板

每个 `.swc` 文件遵循以下结构：

```markdown
# {设计语言名称}
id: {风格-id}
$schema: solarwire-component-library-v1
description: {描述}
version: 1.0.0
author: SolarWire
createdAt: 2026-04-24T00:00:00Z
updatedAt: 2026-04-24T00:00:00Z

## Web-通用
id: web-general
platform: web

### 主按钮
id: btn-primary
name: 主按钮
description: {描述}
categoryId: web-general
platform: web
createdAt: 2026-04-24T00:00:00Z
updatedAt: 2026-04-24T00:00:00Z

```solarwire
// 组件代码
```

---

## 实施任务

### Task 1: 创建 `组件库-ant-design.swc`（参考实现）

**文件：** 创建 `editor/src/lib/components/presets/组件库-ant-design.swc`

- [ ] **Step 1: 创建文件头部**

```markdown
# Ant Design 组件库
id: ant-design
$schema: solarwire-component-library-v1
description: 企业中后台设计语言，成熟生态、组件丰富
version: 1.0.0
author: SolarWire
createdAt: 2026-04-24T00:00:00Z
updatedAt: 2026-04-24T00:00:00Z
platforms:
  web:
    categories: []
  mobile:
    categories: []
```

- [ ] **Step 2: 填充 Web-通用（web-general）分类**

约 13 个组件：主按钮、默认按钮、危险按钮、幽灵按钮、文字按钮、图标按钮、按钮组、胶囊按钮、头像、徽标、标签、分割线、工具提示

```markdown
## Web-通用
id: web-general
platform: web

### 主按钮
id: web-btn-primary
name: 主按钮
description: 用于主要操作的高亮按钮
categoryId: web-general
platform: web
createdAt: 2026-04-24T00:00:00Z
updatedAt: 2026-04-24T00:00:00Z

```solarwire
("主按钮") @(10, 10) w=120 h=36 bg=#1890ff c=#ffffff size=14 r=6
```

### 默认按钮
id: web-btn-default
name: 默认按钮
description: 用于一般操作的默认按钮
categoryId: web-general
platform: web
createdAt: 2026-04-24T00:00:00Z
updatedAt: 2026-04-24T00:00:00Z

```solarwire
("默认按钮") @(10, 10) w=120 h=36 bg=#ffffff c=#000000 size=14 s=1 r=6
```

...（其余 11 个组件类似格式）
```

- [ ] **Step 3: 填充 Web-表单（web-form）分类**

约 15 个组件：输入框、带标签输入框、多行文本框、下拉选择、日期选择、日期范围选择、单选框、复选框、开关、滑块、评分、颜色选择、文件上传、级联选择、穿梭框

- [ ] **Step 4: 填充 Web-表格（web-table）分类**

约 12 个组件：基础表格、带边框表格、斑马纹表格、可选中表格、可展开表格、固定表头表格、固定列表格、排序表格、筛选表格、分页表格、合并单元格表格、虚拟滚动表格

- [ ] **Step 5: 填充 Web-列表（web-list）分类**

约 9 个组件：基础列表、可操作列表、图文列表、带头像列表、消息列表、评论列表、卡片列表、瀑布流列表、虚拟列表

- [ ] **Step 6: 填充 Web-卡片（web-card）分类**

约 7 个组件：基础卡片、图文卡片、带有操作栏的卡片、卡片组、网格卡片、预约卡片、统计数据卡片

- [ ] **Step 7: 填充 Web-图表（web-chart）分类**

约 11 个组件：折线图、柱状图、饼图、面积图、雷达图、漏斗图、散点图、地图、热力图、仪表盘、K线图

- [ ] **Step 8: 填充 Web-搜索（web-search）分类**

约 7 个组件：搜索框、搜索历史、热门搜索、筛选面板、高级筛选、标签筛选、日期范围筛选

- [ ] **Step 9: 填充 Web-导航（web-navigation）分类**

约 11 个组件：面包屑、分页器、步骤条、顶部导航、侧边导航、胶囊导航、锚点导航、标签页切换、下拉菜单、tab切换、快捷导航

- [ ] **Step 10: 填充 Web-认证（web-auth）分类**

约 8 个组件：登录页、注册页、找回密码页、验证码登录、第三方登录、手机号登录、用户协议、隐私政策

- [ ] **Step 11: 填充 Web-反馈（web-feedback）分类**

约 14 个组件：成功提示、错误提示、警告提示、信息提示、模态对话框、抽屉、侧边面板、徽章通知、加载状态、骨架屏、空状态、结果页、确认提示、删除确认

- [ ] **Step 12: 填充 Web-媒体（web-media）分类**

约 7 个组件：图片展示、图片画廊、图片预览、视频播放、音频播放、文件展示、PDF预览

- [ ] **Step 13: 填充 Web-编辑器（web-editor）分类**

约 6 个组件：富文本编辑器、Markdown编辑器、代码编辑器、表格编辑器、在线图表编辑器、JSON编辑器

- [ ] **Step 14: 填充 Web-电商（web-commerce）分类**

约 11 个组件：商品卡片、商品列表、商品详情、购物车、结算页、优惠券、订单列表、订单详情、物流跟踪、售后服务

- [ ] **Step 15: 填充 Web-布局（web-layout）分类**

约 9 个组件：页面布局、栅格系统、间距容器、分割线、Flex布局、卡片容器、响应式布局、订阅布局、仪表盘布局

- [ ] **Step 16: 填充 Mobile-通用（mobile-general）分类**

约 9 个组件：主按钮、默认按钮、危险按钮、图标按钮、胶囊按钮、头像、徽标、标签、文案

- [ ] **Step 17: 填充 Mobile-表单（mobile-form）分类**

约 12 个组件：输入框、多行文本、下拉选择、日期选择、单选框、复选框、开关、滑块、评分、验证码、实名认证

- [ ] **Step 18: 填充 Mobile-列表（mobile-list）分类**

约 8 个组件：列表项、带图标列表项、多图列表项、消息列表、聊天列表、索引列表、折叠列表、可展开列表

- [ ] **Step 19: 填充 Mobile-滑动操作（mobile-swipe）分类**

约 6 个组件：左滑操作、右滑操作、滑动删除、滑动编辑、滑动收藏、堆叠卡片

- [ ] **Step 20: 填充 Mobile-卡片（mobile-card）分类**

约 5 个组件：横向滚动卡片、瀑布流卡片、胶囊卡片、评价卡片、商品卡片

- [ ] **Step 21: 填充 Mobile-导航（mobile-navigation）分类**

约 6 个组件：底部Tab、顶部导航栏、返回导航、分段器、胶囊菜单、列表导航

- [ ] **Step 22: 填充 Mobile-搜索（mobile-search）分类**

约 6 个组件：搜索框、搜索历史、热门搜索、搜索建议、搜索结果、空结果

- [ ] **Step 23: 填充 Mobile-个人中心（mobile-profile）分类**

约 6 个组件：用户卡片、设置列表、设置项、会员卡片、签到卡片、等级展示

- [ ] **Step 24: 填充 Mobile-聊天（mobile-chat）分类**

约 7 个组件：聊天消息、气泡样式、表情面板、语音消息、系统消息、输入工具栏

- [ ] **Step 25: 填充 Mobile-媒体（mobile-media）分类**

约 5 个组件：图片预览、图片选择、视频播放、音频播放、媒体上传

- [ ] **Step 26: 填充 Mobile-定位（mobile-location）分类**

约 4 个组件：地图展示、位置选择、地址列表、距离展示

- [ ] **Step 27: 填充 Mobile-反馈（mobile-feedback）分类**

约 9 个组件：成功提示、错误提示、警告提示、信息提示、加载状态、下拉刷新、上拉加载、空状态、轻提示Toast、操作菜单

- [ ] **Step 28: 填充 Mobile-电商（mobile-commerce）分类**

约 7 个组件：商品卡片、商品列表、商品详情、购物车、优惠券、订单状态、物流跟踪

- [ ] **Step 29: 填充 Mobile-布局（mobile-layout）分类**

约 5 个组件：页面布局、间距容器、分割线、Flex布局、卡片容器

- [ ] **Step 30: 验证 `组件库-ant-design.swc` 格式**

运行验证脚本确保文件格式正确，solarwire 代码块可解析。

---

### Task 2: 创建 `组件库-material-design.swc`

**文件：** 创建 `editor/src/lib/components/presets/组件库-material-design.swc`

继承 Task 1 的结构，替换设计语言为 Material Design：
- 主色：`#6200EE`
- 设计关键词：卡片式、阴影层次、Material You 圆润风格

**重复 Task 1 的 Step 2 - Step 30**，共 29 个步骤。

---

### Task 3: 创建 `组件库-shadcn-ui.swc`

**文件：** 创建 `editor/src/lib/components/presets/组件库-shadcn-ui.swc`

继承 Task 1 的结构，替换设计语言为 shadcn/ui：
- 主色：`#09090b`（zinc-900）
- 设计关键词：深灰/slate、清爽、现代、精致感

**重复 Task 1 的 Step 2 - Step 30**，共 29 个步骤。

---

### Task 4: 创建 `组件库-linear.swc`

**文件：** 创建 `editor/src/lib/components/presets/组件库-linear.swc`

继承 Task 1 的结构，替换设计语言为 Linear：
- 主色：`#5E6AD2`（Linear 紫）
- 设计关键词：暗色背景、科技感、精致微动效、模糊效果

**重复 Task 1 的 Step 2 - Step 30**，共 29 个步骤。

---

### Task 5: 创建 `组件库-semi-design.swc`

**文件：** 创建 `editor/src/lib/components/presets/组件库-semi-design.swc`

继承 Task 1 的结构，替换设计语言为 Semi Design：
- 主色：`#4C8BF5`
- 设计关键词：字节跳动、数据友好、双层卡片、图表友好

**重复 Task 1 的 Step 2 - Step 30**，共 29 个步骤。

---

### Task 6: 创建 `组件库-tailwind-ui.swc`

**文件：** 创建 `editor/src/lib/components/presets/组件库-tailwind-ui.swc`

继承 Task 1 的结构，替换设计语言为 Tailwind UI：
- 主色：`#3B82F6`（blue-500）
- 设计关键词：多彩、灵活、组合式、快速原型

**重复 Task 1 的 Step 2 - Step 30**，共 29 个步骤。

---

## 设计语言特色参考表

| 设计语言 | 主色 | 圆角风格 | 阴影风格 | 字体大小 |
|----------|------|----------|----------|----------|
| Ant Design | #1890ff | 6px | 轻微 | 14px 基准 |
| Material Design | #6200ee | 4px / 8px / 12px | 层次阴影（elevation） | Roboto |
| shadcn/ui | #09090b | 6px | 无阴影/边框分隔 | 14px 基准 |
| Linear | #5e6ad2 | 6px | 模糊毛玻璃 | 13px 基准 |
| Semi Design | #4c8bf5 | 8px | 双层卡片 | 14px 基准 |
| Tailwind UI | #3b82f6 | 6px / 8px | 可变阴影 | 14px 基准 |

---

## 总工作量

| Task | 文件 | 步骤数 |
|------|------|--------|
| Task 1 | 组件库-ant-design.swc | 30 |
| Task 2 | 组件库-material-design.swc | 29 |
| Task 3 | 组件库-shadcn-ui.swc | 29 |
| Task 4 | 组件库-linear.swc | 29 |
| Task 5 | 组件库-shadcn-ui.swc | 29 |
| Task 6 | 组件库-tailwind-ui.swc | 29 |
| **合计** | **6 文件** | **175 步骤** |

**Phase 1 完成后开始 Phase 2：行业模板库（电商 SaaS × 设计语言 × 平台）。**
