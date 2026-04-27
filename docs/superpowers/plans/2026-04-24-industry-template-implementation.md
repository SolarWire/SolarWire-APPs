# 行业模板库实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 创建 19 个行业模板文件，包含通用页面模板和 8 个行业的专属组件+页面模板

**Architecture:** 每个模板文件为 .swc 格式（Markdown + solarwire 代码块），文件内按 `## Web-功能模块组件` / `## Web-页面模板` / `## Mobile-功能模块组件` / `## Mobile-页面模板` 组织。页面模板由功能模块组件拼装，功能模块组件由基础组件拼装。

**Tech Stack:** SolarWire DSL（solarwire 代码块）、.swc 文件格式

**设计文档:** `docs/superpowers/specs/2026-04-24-industry-template-design.md`

---

## 文件清单

| # | 文件路径 | 设计语言 |
|---|---------|---------|
| 1 | `editor/src/lib/components/presets/通用模板-ant-design.swc` | Ant Design |
| 2 | `editor/src/lib/components/presets/通用模板-shadcn-ui.swc` | shadcn/ui |
| 3 | `editor/src/lib/components/presets/通用模板-material-design.swc` | Material Design |
| 4 | `editor/src/lib/components/presets/行业模板-电商SaaS-ant-design.swc` | Ant Design |
| 5 | `editor/src/lib/components/presets/行业模板-电商SaaS-semi-design.swc` | Semi Design |
| 6 | `editor/src/lib/components/presets/行业模板-企业ERP-ant-design.swc` | Ant Design |
| 7 | `editor/src/lib/components/presets/行业模板-企业ERP-shadcn-ui.swc` | shadcn/ui |
| 8 | `editor/src/lib/components/presets/行业模板-财务系统-semi-design.swc` | Semi Design |
| 9 | `editor/src/lib/components/presets/行业模板-财务系统-shadcn-ui.swc` | shadcn/ui |
| 10 | `editor/src/lib/components/presets/行业模板-仓储系统-ant-design.swc` | Ant Design |
| 11 | `editor/src/lib/components/presets/行业模板-仓储系统-material-design.swc` | Material Design |
| 12 | `editor/src/lib/components/presets/行业模板-供应链系统-ant-design.swc` | Ant Design |
| 13 | `editor/src/lib/components/presets/行业模板-供应链系统-semi-design.swc` | Semi Design |
| 14 | `editor/src/lib/components/presets/行业模板-数据大屏-linear.swc` | Linear |
| 15 | `editor/src/lib/components/presets/行业模板-数据大屏-tailwind-ui.swc` | Tailwind UI |
| 16 | `editor/src/lib/components/presets/行业模板-移动APP-material-design.swc` | Material Design |
| 17 | `editor/src/lib/components/presets/行业模板-移动APP-semi-design.swc` | Semi Design |
| 18 | `editor/src/lib/components/presets/行业模板-社区社交-shadcn-ui.swc` | shadcn/ui |
| 19 | `editor/src/lib/components/presets/行业模板-社区社交-tailwind-ui.swc` | Tailwind UI |

---

## Task 1: 通用模板 - Ant Design 风格

**Files:**
- Create: `editor/src/lib/components/presets/通用模板-ant-design.swc`

**设计语言参数:** 主色 #1890ff，圆角 r=6，企业中后台风格

**内容：**
- 文件头：id=common-ant-design, description=通用页面模板
- Web 功能模块组件（26个）：搜索筛选栏、筛选面板、统计卡片区、操作工具栏、标准数据表、带筛选数据表、表单分组、分步表单步骤、详情头部、详情Tab区、侧边导航、顶部导航栏、面包屑操作栏、表单弹窗、确认弹窗、详情弹窗、表单抽屉、详情抽屉、空状态、分页栏、图表区域、操作日志时间线、用户信息卡、文件上传区、图片画廊、通知栏
- Web 页面模板（18个）：登录页、注册页、找回密码页、仪表盘、标准列表页、带筛选列表页、卡片列表页、标准详情页、标准表单页、分步表单页、设置页、个人中心、空白后台页、搜索结果页、弹窗组合页、404、403、500
- Mobile 功能模块组件（19个）：顶部导航栏、搜索栏、底部Tab栏、筛选芯片组、列表区块、卡片流、底部操作栏、表单区块、空状态、底部弹窗、居中弹窗、下拉刷新、骨架加载、用户头部卡、滑动操作、通知红点、图片选择器、倒计时按钮、步骤指示器
- Mobile 页面模板（16个）：启动页、引导页、登录页、注册页、Tab首页、信息流首页、标准列表页、标准详情页、标准表单页、个人中心、消息中心、搜索页、设置页、弹窗组合页、关于页、404

- [ ] **Step 1: 创建文件头部 + Web 功能模块组件**
- [ ] **Step 2: 追加 Web 页面模板**
- [ ] **Step 3: 追加 Mobile 功能模块组件**
- [ ] **Step 4: 追加 Mobile 页面模板**

---

## Task 2: 通用模板 - shadcn/ui 风格

**Files:**
- Create: `editor/src/lib/components/presets/通用模板-shadcn-ui.swc`

**设计语言参数:** 主色 #0f172a，圆角 r=6，极简黑白灰、细边框

**内容：** 与 Task 1 相同结构，但使用 shadcn/ui 视觉风格（深色主色、slate 灰色系、细边框 s=1）

- [ ] **Step 1: 创建文件头部 + Web 功能模块组件**
- [ ] **Step 2: 追加 Web 页面模板**
- [ ] **Step 3: 追加 Mobile 功能模块组件**
- [ ] **Step 4: 追加 Mobile 页面模板**

---

## Task 3: 通用模板 - Material Design 风格

**Files:**
- Create: `editor/src/lib/components/presets/通用模板-material-design.swc`

**设计语言参数:** 主色 #6200ee，圆角 r=20（按钮）/r=12（卡片），Elevation 阴影层次

**内容：** 与 Task 1 相同结构，但使用 Material Design 视觉风格（紫色主色、大圆角、阴影层次 s=2）

- [ ] **Step 1: 创建文件头部 + Web 功能模块组件**
- [ ] **Step 2: 追加 Web 页面模板**
- [ ] **Step 3: 追加 Mobile 功能模块组件**
- [ ] **Step 4: 追加 Mobile 页面模板**

---

## Task 4: 电商 SaaS 模板 - Ant Design 风格

**Files:**
- Create: `editor/src/lib/components/presets/行业模板-电商SaaS-ant-design.swc`

**设计语言参数:** 主色 #1890ff，圆角 r=6

**内容：**
- 文件头：id=industry-ecommerce-ant-design
- Web 行业组件（14个）：SKU选择器、促销倒计时、库存状态标签、价格区间筛选、物流进度条、优惠券选择器、店铺评分、评价摘要、购物车计数器、订单状态时间线、商品网格、分类导航、Banner轮播、限时秒杀区、推荐商品区
- Web 页面模板（9个）：电商首页、商品列表页、商品详情页、购物车页、订单列表页、订单详情页、后台商品管理、后台订单管理、后台数据看板
- Mobile 行业组件（5个）：SKU弹窗、快捷支付栏、瀑布流商品卡、分类标签、秒杀商品卡
- Mobile 页面模板（5个）：电商首页、商品详情页、购物车页、订单列表页、个人中心页

- [ ] **Step 1: 创建文件头部 + Web 行业组件**
- [ ] **Step 2: 追加 Web 页面模板**
- [ ] **Step 3: 追加 Mobile 行业组件 + 页面模板**

---

## Task 5: 电商 SaaS 模板 - Semi Design 风格

**Files:**
- Create: `editor/src/lib/components/presets/行业模板-电商SaaS-semi-design.swc`

**设计语言参数:** 主色 #0091ff，圆角 r=8，柔和圆角

**内容：** 与 Task 4 相同结构，使用 Semi Design 视觉风格

- [ ] **Step 1: 创建文件头部 + Web 行业组件**
- [ ] **Step 2: 追加 Web 页面模板**
- [ ] **Step 3: 追加 Mobile 行业组件 + 页面模板**

---

## Task 6: 企业 ERP 模板 - Ant Design 风格

**Files:**
- Create: `editor/src/lib/components/presets/行业模板-企业ERP-ant-design.swc`

**设计语言参数:** 主色 #1890ff，圆角 r=6

**内容：**
- Web 行业组件（11个）：审批流程图、组织架构树、工作流状态标签、人员选择器、部门选择器、权限配置矩阵、甘特图、资源占用图、待办卡片、快捷入口、日历视图
- Web 页面模板（7个）：工作台、审批列表页、审批详情页、组织架构页、项目管理页、报表中心、权限管理页
- Mobile 行业组件（3个）：审批状态卡片、快捷审批按钮、人员头像列表
- Mobile 页面模板（4个）：工作台、审批列表、审批详情、消息中心

- [ ] **Step 1: 创建文件头部 + Web 行业组件**
- [ ] **Step 2: 追加 Web 页面模板**
- [ ] **Step 3: 追加 Mobile 行业组件 + 页面模板**

---

## Task 7: 企业 ERP 模板 - shadcn/ui 风格

**Files:**
- Create: `editor/src/lib/components/presets/行业模板-企业ERP-shadcn-ui.swc`

**设计语言参数:** 主色 #0f172a，圆角 r=6

**内容：** 与 Task 6 相同结构，使用 shadcn/ui 视觉风格

- [ ] **Step 1: 创建文件头部 + Web 行业组件**
- [ ] **Step 2: 追加 Web 页面模板**
- [ ] **Step 3: 追加 Mobile 行业组件 + 页面模板**

---

## Task 8: 财务系统模板 - Semi Design 风格

**Files:**
- Create: `editor/src/lib/components/presets/行业模板-财务系统-semi-design.swc`

**设计语言参数:** 主色 #0091ff，圆角 r=8

**内容：**
- Web 行业组件（10个）：凭证分录编辑器、会计科目选择器、发票信息卡、报销明细表、预算进度条、账龄分析图、税率选择器、币种转换器、余额表、现金流图
- Web 页面模板（6个）：财务仪表盘、凭证列表页、凭证录入页、账簿查询页、报表中心、报销管理页
- Mobile 行业组件（3个）：报销金额输入、发票拍照上传、审批快捷操作
- Mobile 页面模板（3个）：报销申请页、审批列表页、财务看板

- [ ] **Step 1: 创建文件头部 + Web 行业组件**
- [ ] **Step 2: 追加 Web 页面模板**
- [ ] **Step 3: 追加 Mobile 行业组件 + 页面模板**

---

## Task 9: 财务系统模板 - shadcn/ui 风格

**Files:**
- Create: `editor/src/lib/components/presets/行业模板-财务系统-shadcn-ui.swc`

**设计语言参数:** 主色 #0f172a，圆角 r=6

**内容：** 与 Task 8 相同结构，使用 shadcn/ui 视觉风格

- [ ] **Step 1: 创建文件头部 + Web 行业组件**
- [ ] **Step 2: 追加 Web 页面模板**
- [ ] **Step 3: 追加 Mobile 行业组件 + 页面模板**

---

## Task 10: 仓储系统模板 - Ant Design 风格

**Files:**
- Create: `editor/src/lib/components/presets/行业模板-仓储系统-ant-design.swc`

**设计语言参数:** 主色 #1890ff，圆角 r=6

**内容：**
- Web 行业组件（9个）：库位可视化、批次追溯链、库存预警标签、扫码输入框、仓库平面图、货架标签、入库明细行、拣货清单、盘点任务卡
- Web 页面模板（6个）：仓库看板、入库单页、出库单页、库存查询页、盘点管理页、库位管理页
- Mobile 行业组件（3个）：扫码组件、库位导航、快捷入库/出库
- Mobile 页面模板（4个）：扫码入库、出库确认、库存查询、盘点页

- [ ] **Step 1: 创建文件头部 + Web 行业组件**
- [ ] **Step 2: 追加 Web 页面模板**
- [ ] **Step 3: 追加 Mobile 行业组件 + 页面模板**

---

## Task 11: 仓储系统模板 - Material Design 风格

**Files:**
- Create: `editor/src/lib/components/presets/行业模板-仓储系统-material-design.swc`

**设计语言参数:** 主色 #6200ee，圆角 r=12

**内容：** 与 Task 10 相同结构，使用 Material Design 视觉风格

- [ ] **Step 1: 创建文件头部 + Web 行业组件**
- [ ] **Step 2: 追加 Web 页面模板**
- [ ] **Step 3: 追加 Mobile 行业组件 + 页面模板**

---

## Task 12: 供应链系统模板 - Ant Design 风格

**Files:**
- Create: `editor/src/lib/components/presets/行业模板-供应链系统-ant-design.swc`

**设计语言参数:** 主色 #1890ff，圆角 r=6

**内容：**
- Web 行业组件（7个）：供应商评分卡、采购进度条、物流路线图、需求预测图表、供应链节点图、合同状态标签、价格对比表
- Web 页面模板（6个）：供应链看板、采购订单页、供应商管理页、物流跟踪页、需求预测页、合同管理页
- Mobile 行业组件（3个）：采购审批卡片、物流状态追踪、供应商评分简版
- Mobile 页面模板（3个）：采购审批、物流跟踪、供应商查询

- [ ] **Step 1: 创建文件头部 + Web 行业组件**
- [ ] **Step 2: 追加 Web 页面模板**
- [ ] **Step 3: 追加 Mobile 行业组件 + 页面模板**

---

## Task 13: 供应链系统模板 - Semi Design 风格

**Files:**
- Create: `editor/src/lib/components/presets/行业模板-供应链系统-semi-design.swc`

**设计语言参数:** 主色 #0091ff，圆角 r=8

**内容：** 与 Task 12 相同结构，使用 Semi Design 视觉风格

- [ ] **Step 1: 创建文件头部 + Web 行业组件**
- [ ] **Step 2: 追加 Web 页面模板**
- [ ] **Step 3: 追加 Mobile 行业组件 + 页面模板**

---

## Task 14: 数据大屏模板 - Linear 风格

**Files:**
- Create: `editor/src/lib/components/presets/行业模板-数据大屏-linear.swc`

**设计语言参数:** 主色 #5b6abf，暗色背景 #1c1e2a，圆角 r=8

**内容：**
- Web 行业组件（10个）：数字翻牌器、环形进度图、地图热力层、实时数据流、大屏指标卡、时间轴播放器、告警闪烁标签、排行榜、设备状态矩阵、拓扑图
- Web 页面模板（4个）：电商大屏、社交大屏、医疗大屏、监控大屏
- 无 Mobile 端

- [ ] **Step 1: 创建文件头部 + Web 行业组件**
- [ ] **Step 2: 追加 Web 页面模板**

---

## Task 15: 数据大屏模板 - Tailwind UI 风格

**Files:**
- Create: `editor/src/lib/components/presets/行业模板-数据大屏-tailwind-ui.swc`

**设计语言参数:** 主色 #4f46e5，圆角 r=8

**内容：** 与 Task 14 相同结构，使用 Tailwind UI 视觉风格

- [ ] **Step 1: 创建文件头部 + Web 行业组件**
- [ ] **Step 2: 追加 Web 页面模板**

---

## Task 16: 移动 APP 模板 - Material Design 风格

**Files:**
- Create: `editor/src/lib/components/presets/行业模板-移动APP-material-design.swc`

**设计语言参数:** 主色 #6200ee，圆角 r=20（按钮）/r=16（卡片）

**内容：**
- 无 Web 端
- Mobile 行业组件（14个）：底部弹窗选择器、侧滑操作、下拉刷新、骨架加载、空状态插画、浮动操作按钮、消息红点、引导遮罩层、倒计时按钮、步骤指示器、Banner轮播、功能入口网格、通知公告栏、头像叠加组
- Mobile 页面模板（11个）：启动页、引导页、登录页、注册页、Tab首页、信息流首页、发现页、消息页、个人中心、设置页、关于页

- [ ] **Step 1: 创建文件头部 + Mobile 行业组件**
- [ ] **Step 2: 追加 Mobile 页面模板**

---

## Task 17: 移动 APP 模板 - Semi Design 风格

**Files:**
- Create: `editor/src/lib/components/presets/行业模板-移动APP-semi-design.swc`

**设计语言参数:** 主色 #0091ff，圆角 r=22（按钮）/r=16（卡片）

**内容：** 与 Task 16 相同结构，使用 Semi Design 视觉风格

- [ ] **Step 1: 创建文件头部 + Mobile 行业组件**
- [ ] **Step 2: 追加 Mobile 页面模板**

---

## Task 18: 社区/社交模板 - shadcn/ui 风格

**Files:**
- Create: `editor/src/lib/components/presets/行业模板-社区社交-shadcn-ui.swc`

**设计语言参数:** 主色 #0f172a，圆角 r=6

**内容：**
- Web 行业组件（12个）：帖子卡片、评论组件、点赞收藏按钮、用户关注卡片、话题标签、通知徽章、内容编辑器、分享按钮组、热门话题排行、用户等级标签、侧边热门推荐、媒体网格
- Web 页面模板（6个）：社区首页、帖子详情页、用户主页、话题页、发布页、后台管理
- Mobile 行业组件（5个）：帖子卡片(移动版)、评论输入框、表情面板、图片选择器、分享面板
- Mobile 页面模板（6个）：动态流、发帖页、帖子详情、消息页、个人主页、搜索页

- [ ] **Step 1: 创建文件头部 + Web 行业组件**
- [ ] **Step 2: 追加 Web 页面模板**
- [ ] **Step 3: 追加 Mobile 行业组件 + 页面模板**

---

## Task 19: 社区/社交模板 - Tailwind UI 风格

**Files:**
- Create: `editor/src/lib/components/presets/行业模板-社区社交-tailwind-ui.swc`

**设计语言参数:** 主色 #4f46e5，圆角 r=8

**内容：** 与 Task 18 相同结构，使用 Tailwind UI 视觉风格

- [ ] **Step 1: 创建文件头部 + Web 行业组件**
- [ ] **Step 2: 追加 Web 页面模板**
- [ ] **Step 3: 追加 Mobile 行业组件 + 页面模板**

---

## 实施顺序

按优先级分 5 批执行：

**第1批（基础）：** Task 1, 2, 3 — 通用模板
**第2批（高频行业）：** Task 4, 5, 6, 7 — 电商SaaS + 企业ERP
**第3批（视觉冲击）：** Task 14, 15, 16, 17 — 数据大屏 + 移动APP
**第4批（C端）：** Task 18, 19 — 社区/社交
**第5批（专业领域）：** Task 8, 9, 10, 11, 12, 13 — 财务 + 仓储 + 供应链
