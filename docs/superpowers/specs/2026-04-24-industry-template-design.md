# SolarWire 行业模板库设计方案

**日期：** 2026-04-24
**状态：** 待确认

---

## 一、核心原则

**页面 = 可复用组件 × 布局组合**

每个完整页面模板由多个功能模块组件拼装而成。组件是原子单位，可跨页面复用；页面模板是组件的组合方案。

三层结构：
1. **基础组件**（已在 Phase 1 组件库中完成）— 按钮、输入框、表格等
2. **功能模块组件**（本次新增）— 搜索栏+筛选、统计卡片区、操作工具栏等可复用组合
3. **完整页面模板**（本次新增）— 由功能模块组件拼装的完整业务页面

---

## 二、文件组织

**方案 B：按行业×设计语言分文件**

```
presets/
├── 组件库-ant-design.swc              (Phase 1 已完成)
├── 组件库-material-design.swc         (Phase 1 已完成)
├── 组件库-shadcn-ui.swc               (Phase 1 已完成)
├── 组件库-linear.swc                  (Phase 1 已完成)
├── 组件库-semi-design.swc             (Phase 1 已完成)
├── 组件库-tailwind-ui.swc             (Phase 1 已完成)
│
├── 通用模板-ant-design.swc
├── 通用模板-shadcn-ui.swc
├── 通用模板-material-design.swc
│
├── 行业模板-电商SaaS-ant-design.swc
├── 行业模板-电商SaaS-semi-design.swc
├── 行业模板-企业ERP-ant-design.swc
├── 行业模板-企业ERP-shadcn-ui.swc
├── 行业模板-财务系统-semi-design.swc
├── 行业模板-财务系统-shadcn-ui.swc
├── 行业模板-仓储系统-ant-design.swc
├── 行业模板-仓储系统-material-design.swc
├── 行业模板-供应链系统-ant-design.swc
├── 行业模板-供应链系统-semi-design.swc
├── 行业模板-数据大屏-linear.swc
├── 行业模板-数据大屏-tailwind-ui.swc
├── 行业模板-移动APP-material-design.swc
├── 行业模板-移动APP-semi-design.swc
├── 行业模板-社区社交-shadcn-ui.swc
└── 行业模板-社区社交-tailwind-ui.swc
```

**命名规范：** `通用模板-{设计语言}.swc` / `行业模板-{行业名}-{设计语言}.swc`

---

## 三、通用页面模板

### 3.1 行业×设计语言映射

| 行业 | 匹配设计语言 | 匹配理由 |
|------|-------------|---------|
| 通用模板 | Ant Design + shadcn/ui + Material Design | 覆盖三大主流风格 |
| 电商 SaaS | Ant Design + Semi Design | 企业中后台 + 抖音电商生态 |
| 企业 ERP | Ant Design + shadcn/ui | 复杂表单 + 现代简约 |
| 财务系统 | Semi Design + shadcn/ui | 数据友好 + 精确严谨 |
| 仓储系统 | Ant Design + Material Design | 复杂表格 + 移动端扫码 |
| 供应链系统 | Ant Design + Semi Design | 多角色协作 + 数据可视化 |
| 数据大屏 | Linear + Tailwind UI | 暗色科技感 + 营销展示 |
| 移动 APP | Material Design + Semi Design | Material 移动规范 + 国内移动端 |
| 社区/社交 | shadcn/ui + Tailwind UI | 现代社交 + 营销增长 |

### 3.2 通用模板 — Web 功能模块组件

这些是跨页面可复用的组合组件，由基础组件拼装：

| 组件 ID | 组件名 | 组成 | 复用场景 |
|---------|--------|------|---------|
| web-mod-search-bar | 搜索筛选栏 | 搜索输入 + 筛选按钮 + 刷新 | 列表页、管理页 |
| web-mod-filter-panel | 筛选面板 | 筛选条件组 + 重置/确认按钮 | 列表页侧边 |
| web-mod-stat-cards | 统计卡片区 | 3-4个统计卡片横排 | 仪表盘、首页 |
| web-mod-toolbar | 操作工具栏 | 批量操作按钮 + 更多操作下拉 | 列表页顶部 |
| web-mod-table-standard | 标准数据表 | 搜索 + 表格 + 分页 | CRUD 列表页 |
| web-mod-table-with-filter | 带筛选数据表 | 筛选面板 + 表格 + 分页 | 高级列表页 |
| web-mod-form-group | 表单分组 | 标题 + 表单项 + 操作按钮 | 表单页 |
| web-mod-form-step | 分步表单步骤 | 步骤条 + 当前步骤表单 | 分步表单页 |
| web-mod-detail-header | 详情头部 | 返回 + 标题 + 状态 + 操作按钮 | 详情页 |
| web-mod-detail-tabs | 详情Tab区 | Tab切换 + 内容区 | 详情页 |
| web-mod-sidebar-nav | 侧边导航 | Logo + 菜单树 + 折叠 | 后台布局 |
| web-mod-top-header | 顶部导航栏 | Logo + 菜单 + 搜索 + 用户 | 后台布局 |
| web-mod-breadcrumb-bar | 面包屑操作栏 | 面包屑 + 页面标题 + 操作按钮 | 页面顶部 |
| web-mod-modal-form | 表单弹窗 | 弹窗容器 + 表单 + 确认/取消 | 新建/编辑 |
| web-mod-modal-confirm | 确认弹窗 | 弹窗容器 + 提示文案 + 按钮 | 删除/确认 |
| web-mod-modal-detail | 详情弹窗 | 弹窗容器 + 详情内容 | 快速查看 |
| web-mod-drawer-form | 表单抽屉 | 抽屉容器 + 表单 + 操作 | 侧边编辑 |
| web-mod-drawer-detail | 详情抽屉 | 抽屉容器 + 详情内容 | 侧边查看 |
| web-mod-empty-state | 空状态 | 插图 + 文案 + 操作按钮 | 无数据 |
| web-mod-pagination-bar | 分页栏 | 页码 + 跳转 + 每页条数 | 列表底部 |
| web-mod-chart-section | 图表区域 | 标题 + 时间筛选 + 图表 | 仪表盘 |
| web-mod-log-timeline | 操作日志时间线 | 时间线 + 操作记录 | 详情页底部 |
| web-mod-user-card | 用户信息卡 | 头像 + 名称 + 角色 + 操作 | 人员管理 |
| web-mod-file-upload-zone | 文件上传区 | 拖拽区 + 文件列表 + 按钮 | 表单页 |
| web-mod-image-gallery | 图片画廊 | 缩略图网格 + 预览 | 媒体管理 |
| web-mod-notification-bar | 通知栏 | 图标 + 消息 + 关闭 | 页面顶部 |

### 3.3 通用模板 — Web 页面模板

每个页面标注由哪些功能模块组件组成：

| 页面 ID | 页面名 | 组成模块 |
|---------|--------|---------|
| web-page-login | 登录页 | Logo区 + 登录表单 + 第三方登录 |
| web-page-register | 注册页 | Logo区 + 注册表单 + 协议勾选 |
| web-page-forgot-password | 找回密码页 | Logo区 + 邮箱/手机表单 + 验证码 |
| web-page-dashboard | 仪表盘 | sidebar-nav + top-header + stat-cards + chart-section × 2 |
| web-page-list-standard | 标准列表页 | sidebar-nav + top-header + breadcrumb-bar + search-bar + toolbar + table-standard |
| web-page-list-filter | 带筛选列表页 | sidebar-nav + top-header + breadcrumb-bar + filter-panel + table-with-filter |
| web-page-list-card | 卡片列表页 | sidebar-nav + top-header + breadcrumb-bar + search-bar + 卡片网格 + pagination-bar |
| web-page-detail | 标准详情页 | sidebar-nav + top-header + detail-header + detail-tabs + log-timeline |
| web-page-form | 标准表单页 | sidebar-nav + top-header + breadcrumb-bar + form-group |
| web-page-form-step | 分步表单页 | sidebar-nav + top-header + breadcrumb-bar + form-step |
| web-page-settings | 设置页 | sidebar-nav + top-header + 侧边Tab + form-group × N |
| web-page-profile | 个人中心 | sidebar-nav + top-header + user-card + 信息编辑表单 |
| web-page-blank | 空白后台页 | sidebar-nav + top-header + 内容区 |
| web-page-search-result | 搜索结果页 | top-header + search-bar + filter-panel + 结果列表 + pagination-bar |
| web-page-modal-demo | 弹窗组合页 | 触发按钮 + modal-form + modal-confirm + modal-detail + drawer-form + drawer-detail |
| web-page-404 | 404页面 | 插图 + 文案 + 返回按钮 |
| web-page-403 | 403页面 | 插图 + 文案 + 返回按钮 |
| web-page-500 | 500页面 | 插图 + 文案 + 重试按钮 |

### 3.4 通用模板 — Mobile 功能模块组件

| 组件 ID | 组件名 | 组成 | 复用场景 |
|---------|--------|------|---------|
| mob-mod-top-bar | 顶部导航栏 | 返回 + 标题 + 右侧操作 | 几乎所有页面 |
| mob-mod-search-bar | 搜索栏 | 搜索输入 + 取消 | 搜索页、列表页 |
| mob-mod-tab-bar | 底部Tab栏 | 3-5个Tab图标+文字 | 首页类页面 |
| mob-mod-filter-chips | 筛选芯片组 | 横向滚动芯片 | 列表页 |
| mob-mod-list-section | 列表区块 | 标题 + 列表项 + 更多 | 首页、发现页 |
| mob-mod-card-flow | 卡片流 | 卡片列表 + 上拉加载 | 信息流 |
| mob-mod-action-bar | 底部操作栏 | 主按钮 + 次按钮 | 详情页、表单页 |
| mob-mod-form-section | 表单区块 | 标题 + 表单项组 | 表单页 |
| mob-mod-empty-state | 空状态 | 插图 + 文案 + 按钮 | 无数据 |
| mob-mod-modal-sheet | 底部弹窗 | 弹窗容器 + 内容 + 操作 | 选择、确认 |
| mob-mod-modal-center | 居中弹窗 | 弹窗容器 + 内容 + 按钮 | 确认、提示 |
| mob-mod-pull-refresh | 下拉刷新 | 下拉指示 + 内容 | 列表页 |
| mob-mod-skeleton-load | 骨架加载 | 骨架屏占位 | 加载中 |
| mob-mod-user-header | 用户头部卡 | 头像 + 名称 + 统计 | 个人中心 |
| mob-mod-swipe-action | 滑动操作 | 内容 + 侧滑按钮 | 列表项 |
| mob-mod-notify-badge | 通知红点 | 图标 + 红点数字 | Tab栏、消息 |
| mob-mod-image-picker | 图片选择器 | 图片网格 + 添加按钮 | 发帖、表单 |
| mob-mod-countdown-btn | 倒计时按钮 | 按钮 + 倒计时 | 验证码 |
| mob-mod-step-indicator | 步骤指示器 | 步骤点 + 连线 | 注册、流程 |

### 3.5 通用模板 — Mobile 页面模板

| 页面 ID | 页面名 | 组成模块 |
|---------|--------|---------|
| mob-page-splash | 启动页 | Logo + 品牌名 + 版本号 |
| mob-page-onboarding | 引导页 | 插图 + 标题 + 描述 + 指示器 + 跳过/下一步 |
| mob-page-login | 登录页 | Logo + form-section + 第三方登录 |
| mob-page-register | 注册页 | form-section + countdown-btn + 协议 |
| mob-page-home-tab | Tab首页 | top-bar + 搜索 + Banner + 功能入口 + list-section + tab-bar |
| mob-page-home-flow | 信息流首页 | top-bar + card-flow + tab-bar |
| mob-page-list | 标准列表页 | top-bar + search-bar + filter-chips + 列表 + pull-refresh |
| mob-page-detail | 标准详情页 | top-bar + 内容区 + action-bar |
| mob-page-form | 标准表单页 | top-bar + form-section + action-bar |
| mob-page-profile | 个人中心 | user-header + 功能列表 + 设置入口 |
| mob-page-messages | 消息中心 | top-bar + Tab + 消息列表 + notify-badge |
| mob-page-search | 搜索页 | search-bar + 热门/历史 + 搜索结果 |
| mob-page-settings | 设置页 | top-bar + 设置项列表 |
| mob-page-modal-demo | 弹窗组合页 | 触发按钮 + modal-sheet + modal-center |
| mob-page-about | 关于页 | Logo + 版本 + 信息列表 |
| mob-page-404 | 404页面 | 插图 + 文案 + 返回 |

---

## 四、行业模板详细规划

### 4.1 电商 SaaS（Ant Design + Semi Design）

#### Web 行业组件

| 组件 ID | 组件名 | 组成 |
|---------|--------|------|
| ecom-mod-sku-selector | SKU选择器 | 规格标签组 + 价格 + 库存 + 数量选择 |
| ecom-mod-promo-countdown | 促销倒计时 | 活动标签 + 倒计时数字 + 进度条 |
| ecom-mod-stock-tag | 库存状态标签 | 状态图标 + 文案 + 颜色 |
| ecom-mod-price-filter | 价格区间筛选 | 双滑块 + 输入框 |
| ecom-mod-logistics-track | 物流进度条 | 步骤条 + 节点信息 + 时间 |
| ecom-mod-coupon-picker | 优惠券选择器 | 优惠券列表 + 选中状态 + 优惠金额 |
| ecom-mod-shop-rating | 店铺评分 | 星级 + 评分数字 + 评价数 |
| ecom-mod-review-summary | 评价摘要 | 评分分布 + 标签 + 好评率 |
| ecom-mod-cart-counter | 购物车计数器 | 减号 + 数量 + 加号 + 库存限制 |
| ecom-mod-order-timeline | 订单状态时间线 | 时间线 + 状态节点 + 操作 |
| ecom-mod-product-grid | 商品网格 | 商品卡片 × N + 分页 |
| ecom-mod-category-nav | 分类导航 | 分类树/标签 + 选中态 |
| ecom-mod-banner-carousel | Banner轮播 | 轮播图 + 指示器 + 自动播放 |
| ecom-mod-seckill-section | 限时秒杀区 | 倒计时 + 商品横排 + 进度 |
| ecom-mod-recommend-section | 推荐商品区 | 标题 + 商品卡片横滚 |

#### Web 页面模板

| 页面 ID | 页面名 | 组成模块 |
|---------|--------|---------|
| ecom-web-homepage | 电商首页 | top-header + banner-carousel + category-nav + seckill-section + recommend-section |
| ecom-web-product-list | 商品列表页 | sidebar-nav + top-header + category-nav + price-filter + product-grid + pagination-bar |
| ecom-web-product-detail | 商品详情页 | top-header + 商品图区 + sku-selector + review-summary + recommend-section |
| ecom-web-cart | 购物车页 | top-header + 商品列表(含cart-counter) + coupon-picker + 结算栏 |
| ecom-web-order-list | 订单列表页 | sidebar-nav + top-header + Tab状态筛选 + 订单卡片(含order-timeline) |
| ecom-web-order-detail | 订单详情页 | top-header + 订单信息 + logistics-track + 商品清单 |
| ecom-web-admin-products | 后台-商品管理 | sidebar-nav + top-header + search-bar + toolbar + table-standard |
| ecom-web-admin-orders | 后台-订单管理 | sidebar-nav + top-header + search-bar + filter-panel + table-with-filter |
| ecom-web-admin-dashboard | 后台-数据看板 | sidebar-nav + top-header + stat-cards + chart-section × 3 |

#### Mobile 行业组件

| 组件 ID | 组件名 | 组成 |
|---------|--------|------|
| ecom-mob-sku-popup | SKU弹窗 | modal-sheet + 规格选择 + 数量 + 确认 |
| ecom-mob-pay-bar | 快捷支付栏 | 价格 + 立即购买 + 加入购物车 |
| ecom-mob-product-card-waterfall | 瀑布流商品卡 | 图片 + 价格 + 标题 |
| ecom-mob-category-tabs | 分类标签 | 横向滚动分类 + 选中态 |
| ecom-mob-seckill-card | 秒杀商品卡 | 图片 + 价格 + 进度 + 倒计时 |

#### Mobile 页面模板

| 页面 ID | 页面名 | 组成模块 |
|---------|--------|---------|
| ecom-mob-homepage | 电商首页 | top-bar + search-bar + banner + category-tabs + seckill-card + product-card-waterfall + tab-bar |
| ecom-mob-product-detail | 商品详情页 | top-bar + 轮播图 + 商品信息 + sku-popup触发 + pay-bar |
| ecom-mob-cart | 购物车页 | top-bar + 商品列表 + 优惠 + 结算栏 |
| ecom-mob-order-list | 订单列表页 | top-bar + Tab + 订单卡片 |
| ecom-mob-profile | 个人中心 | user-header + 订单入口 + 功能列表 + tab-bar |

---

### 4.2 企业 ERP（Ant Design + shadcn/ui）

#### Web 行业组件

| 组件 ID | 组件名 | 组成 |
|---------|--------|------|
| erp-mod-approval-flow | 审批流程图 | 流程节点 + 连线 + 当前节点高亮 |
| erp-mod-org-tree | 组织架构树 | 树形结构 + 展开/折叠 + 人员数 |
| erp-mod-workflow-status | 工作流状态标签 | 状态图标 + 文案 + 颜色 |
| erp-mod-person-selector | 人员选择器 | 搜索 + 组织树 + 已选人员标签 |
| erp-mod-dept-selector | 部门选择器 | 树形下拉 + 多选 |
| erp-mod-permission-matrix | 权限配置矩阵 | 角色行 × 功能列 + 勾选矩阵 |
| erp-mod-gantt-chart | 甘特图 | 时间轴 + 任务条 + 依赖线 |
| erp-mod-resource-usage | 资源占用图 | 资源名 + 占用条 + 利用率 |
| erp-mod-todo-card | 待办卡片 | 类型图标 + 标题 + 发起人 + 时限 |
| erp-mod-quick-entry | 快捷入口 | 图标网格 + 标签 |
| erp-mod-calendar-view | 日历视图 | 月历 + 事件标记 + 日程列表 |

#### Web 页面模板

| 页面 ID | 页面名 | 组成模块 |
|---------|--------|---------|
| erp-web-workspace | 工作台 | sidebar-nav + top-header + todo-card + quick-entry + calendar-view + 通知 |
| erp-web-approval-list | 审批列表页 | sidebar-nav + top-header + Tab分类 + search-bar + 审批卡片列表 |
| erp-web-approval-detail | 审批详情页 | sidebar-nav + top-header + detail-header + 审批表单 + approval-flow + 审批意见 |
| erp-web-org-structure | 组织架构页 | sidebar-nav + top-header + org-tree + 人员列表 + detail-tabs |
| erp-web-project-mgmt | 项目管理页 | sidebar-nav + top-header + 项目卡片 + gantt-chart + 成员列表 |
| erp-web-report-center | 报表中心 | sidebar-nav + top-header + 报表分类 + 报表列表 + 预览 |
| erp-web-permission-mgmt | 权限管理页 | sidebar-nav + top-header + 角色列表 + permission-matrix |

#### Mobile 行业组件

| 组件 ID | 组件名 | 组成 |
|---------|--------|------|
| erp-mob-approval-card | 审批状态卡片 | 类型图标 + 标题 + 状态 + 发起人 |
| erp-mob-quick-approve | 快捷审批按钮 | 同意/拒绝按钮组 |
| erp-mob-member-list | 人员头像列表 | 头像横排 + 更多 |

#### Mobile 页面模板

| 页面 ID | 页面名 | 组成模块 |
|---------|--------|---------|
| erp-mob-workspace | 工作台 | top-bar + todo-card + quick-entry + 通知 |
| erp-mob-approval-list | 审批列表 | top-bar + Tab + approval-card列表 |
| erp-mob-approval-detail | 审批详情 | top-bar + 表单 + approval-flow + quick-approve |
| erp-mob-messages | 消息中心 | top-bar + Tab + 消息列表 + notify-badge |

---

### 4.3 财务系统（Semi Design + shadcn/ui）

#### Web 行业组件

| 组件 ID | 组件名 | 组成 |
|---------|--------|------|
| fin-mod-entry-editor | 凭证分录编辑器 | 分录行(摘要+科目+借贷金额) + 增删行 |
| fin-mod-account-selector | 会计科目选择器 | 科目树 + 搜索 + 选中态 |
| fin-mod-invoice-card | 发票信息卡 | 发票类型 + 号码 + 金额 + 状态 |
| fin-mod-expense-table | 报销明细表 | 费用明细行 + 合计 + 附件 |
| fin-mod-budget-progress | 预算进度条 | 预算额度 + 已用 + 百分比 + 预警 |
| fin-mod-aging-chart | 账龄分析图 | 账龄区间 + 金额柱 + 占比 |
| fin-mod-tax-selector | 税率选择器 | 税种 + 税率下拉 + 计算 |
| fin-mod-currency-converter | 币种转换器 | 源币种 + 汇率 + 目标币种 |
| fin-mod-balance-sheet | 余额表 | 科目 + 期初 + 借方 + 贷方 + 期末 |
| fin-mod-cash-flow-chart | 现金流图 | 流入/流出柱 + 净流量线 |

#### Web 页面模板

| 页面 ID | 页面名 | 组成模块 |
|---------|--------|---------|
| fin-web-dashboard | 财务仪表盘 | sidebar-nav + top-header + stat-cards + cash-flow-chart + aging-chart + budget-progress |
| fin-web-voucher-list | 凭证列表页 | sidebar-nav + top-header + search-bar + filter-panel + 凭证表格 + pagination-bar |
| fin-web-voucher-entry | 凭证录入页 | sidebar-nav + top-header + breadcrumb-bar + entry-editor + account-selector |
| fin-web-ledger-query | 账簿查询页 | sidebar-nav + top-header + account-selector + balance-sheet |
| fin-web-report-center | 报表中心 | sidebar-nav + top-header + 报表Tab + 报表预览 |
| fin-web-expense-mgmt | 报销管理页 | sidebar-nav + top-header + search-bar + expense-table + 审批流 |

#### Mobile 行业组件

| 组件 ID | 组件名 | 组成 |
|---------|--------|------|
| fin-mob-expense-input | 报销金额输入 | 费用类型 + 金额 + 备注 |
| fin-mob-invoice-upload | 发票拍照上传 | 拍照/相册 + 识别结果 + 确认 |
| fin-mob-quick-approve | 审批快捷操作 | 同意/拒绝 + 意见输入 |

#### Mobile 页面模板

| 页面 ID | 页面名 | 组成模块 |
|---------|--------|---------|
| fin-mob-expense-apply | 报销申请页 | top-bar + expense-input + invoice-upload + action-bar |
| fin-mob-approval-list | 审批列表 | top-bar + Tab + 审批卡片 |
| fin-mob-dashboard | 财务看板 | top-bar + stat-cards + 趋势图 |

---

### 4.4 仓储系统（Ant Design + Material Design）

#### Web 行业组件

| 组件 ID | 组件名 | 组成 |
|---------|--------|------|
| whs-mod-location-visual | 库位可视化 | 仓库平面图 + 货架 + 库位状态色块 |
| whs-mod-batch-trace | 批次追溯链 | 时间线 + 批次节点 + 操作记录 |
| whs-mod-stock-alert | 库存预警标签 | 预警级别 + 数量 + 颜色 |
| whs-mod-scan-input | 扫码输入框 | 扫码图标 + 输入框 + 确认 |
| whs-mod-warehouse-map | 仓库平面图 | 区域划分 + 货架编号 + 通道 |
| whs-mod-shelf-tag | 货架标签 | 编号 + 容量 + 状态 |
| whs-mod-inbound-item | 入库明细行 | 商品 + 数量 + 库位 + 批次 |
| whs-mod-outbound-pick | 拣货清单 | 拣货路径 + 商品 + 数量 + 库位 |
| whs-mod-stocktake-task | 盘点任务卡 | 任务编号 + 区域 + 状态 + 进度 |

#### Web 页面模板

| 页面 ID | 页面名 | 组成模块 |
|---------|--------|---------|
| whs-web-dashboard | 仓库看板 | sidebar-nav + top-header + stat-cards + 库存预警列表 + 出入库统计图 |
| whs-web-inbound | 入库单页 | sidebar-nav + top-header + breadcrumb-bar + 单据信息 + inbound-item + location-visual |
| whs-web-outbound | 出库单页 | sidebar-nav + top-header + breadcrumb-bar + 单据信息 + outbound-pick + 确认发货 |
| whs-web-stock-query | 库存查询页 | sidebar-nav + top-header + search-bar + filter-panel + 库存表格 + stock-alert |
| whs-web-stocktake | 盘点管理页 | sidebar-nav + top-header + stocktake-task列表 + 差异处理 |
| whs-web-location-mgmt | 库位管理页 | sidebar-nav + top-header + warehouse-map + shelf-tag + 库位详情 |

#### Mobile 行业组件

| 组件 ID | 组件名 | 组成 |
|---------|--------|------|
| whs-mob-scan-component | 扫码组件 | 扫码框 + 结果显示 + 确认 |
| whs-mob-location-nav | 库位导航 | 仓库图 + 路径指示 + 目标库位 |
| whs-mob-quick-inout | 快捷入库/出库 | 扫码 + 商品确认 + 数量 + 库位 |

#### Mobile 页面模板

| 页面 ID | 页面名 | 组成模块 |
|---------|--------|---------|
| whs-mob-scan-inbound | 扫码入库 | top-bar + scan-component + 商品确认 + location-nav + action-bar |
| whs-mob-outbound-confirm | 出库确认 | top-bar + outbound-pick + scan-component + action-bar |
| whs-mob-stock-query | 库存查询 | top-bar + search-bar + 库存详情 |
| whs-mob-stocktake | 盘点页 | top-bar + stocktake-task + scan-component + 差异 |

---

### 4.5 供应链系统（Ant Design + Semi Design）

#### Web 行业组件

| 组件 ID | 组件名 | 组成 |
|---------|--------|------|
| scm-mod-supplier-score | 供应商评分卡 | 综合评分 + 维度雷达图 + 等级 |
| scm-mod-purchase-progress | 采购进度条 | 阶段节点 + 当前进度 + 预计完成 |
| scm-mod-logistics-route | 物流路线图 | 起终点 + 路径 + 中转节点 + 预计到达 |
| scm-mod-demand-forecast | 需求预测图表 | 历史曲线 + 预测区间 + 建议采购量 |
| scm-mod-supply-chain-node | 供应链节点图 | 节点(采购→生产→仓储→配送) + 连线 + 状态 |
| scm-mod-contract-status | 合同状态标签 | 状态 + 到期日 + 操作 |
| scm-mod-pr-comparison | 价格对比表 | 供应商 × 物料 + 报价 + 选中 |

#### Web 页面模板

| 页面 ID | 页面名 | 组成模块 |
|---------|--------|---------|
| scm-web-dashboard | 供应链看板 | sidebar-nav + top-header + supply-chain-node + stat-cards + chart-section |
| scm-web-purchase-order | 采购订单页 | sidebar-nav + top-header + search-bar + filter-panel + 订单表格 + purchase-progress |
| scm-web-supplier-mgmt | 供应商管理页 | sidebar-nav + top-header + search-bar + supplier-score列表 + pr-comparison |
| scm-web-logistics-track | 物流跟踪页 | sidebar-nav + top-header + 运单列表 + logistics-route + 状态详情 |
| scm-web-demand-forecast | 需求预测页 | sidebar-nav + top-header + demand-forecast + 建议列表 |
| scm-web-contract-mgmt | 合同管理页 | sidebar-nav + top-header + search-bar + contract-status列表 + 详情 |

#### Mobile 行业组件

| 组件 ID | 组件名 | 组成 |
|---------|--------|------|
| scm-mob-purchase-approve | 采购审批卡片 | 订单摘要 + 金额 + 审批按钮 |
| scm-mob-logistics-status | 物流状态追踪 | 运单号 + 路线摘要 + 预计到达 |
| scm-mob-supplier-score-mini | 供应商评分简版 | 评分 + 等级 + 关键指标 |

#### Mobile 页面模板

| 页面 ID | 页面名 | 组成模块 |
|---------|--------|---------|
| scm-mob-purchase-approve | 采购审批 | top-bar + purchase-approve列表 + 审批详情 + action-bar |
| scm-mob-logistics | 物流跟踪 | top-bar + logistics-status + 路线详情 |
| scm-mob-supplier-query | 供应商查询 | top-bar + search-bar + supplier-score-mini |

---

### 4.6 数据大屏（Linear + Tailwind UI）

#### Web 行业组件

| 组件 ID | 组件名 | 组成 |
|---------|--------|------|
| screen-mod-number-flip | 数字翻牌器 | 大数字 + 趋势箭头 + 单位 |
| screen-mod-ring-progress | 环形进度图 | 环形 + 百分比 + 标签 |
| screen-mod-map-heatmap | 地图热力层 | 地图底图 + 区域色块 + 图例 |
| screen-mod-realtime-stream | 实时数据流 | 滚动数据行 + 时间戳 + 高亮 |
| screen-mod-metric-card-lg | 大屏指标卡 | 大数字 + 标签 + 迷你图 |
| screen-mod-timeline-player | 时间轴播放器 | 时间轴 + 播放/暂停 + 速度控制 |
| screen-mod-alert-flash | 告警闪烁标签 | 告警级别 + 闪烁效果 + 详情 |
| screen-mod-ranking-list | 排行榜 | 排名 + 名称 + 数值 + 进度条 |
| screen-mod-device-status | 设备状态矩阵 | 设备网格 + 状态色块 + 统计 |
| screen-mod-topo-graph | 拓扑图 | 节点 + 连线 + 状态 |

#### Web 页面模板

| 页面 ID | 页面名 | 组成模块 |
|---------|--------|---------|
| screen-web-ecommerce | 电商大屏 | number-flip × 4 + 实时交易流 + map-heatmap + 品类饼图 + ranking-list |
| screen-web-social | 社交大屏 | metric-card-lg × 4 + 热点话题流 + 用户分布图 + 互动趋势图 |
| screen-web-medical | 医疗大屏 | metric-card-lg × 4 + 床位占用环形图 + 科室分布 + alert-flash + 趋势图 |
| screen-web-monitor | 监控大屏 | device-status + topo-graph + alert-flash列表 + 资源占用图 + 日志流 |

**无 Mobile 端**（数据大屏为 Web 展示专用）

---

### 4.7 移动 APP（Material Design + Semi Design）

**无 Web 端**（纯移动端行业）

#### Mobile 行业组件

| 组件 ID | 组件名 | 组成 |
|---------|--------|------|
| app-mod-bottom-sheet-picker | 底部弹窗选择器 | modal-sheet + 选项列表 + 取消 |
| app-mod-swipe-action | 侧滑操作 | 内容 + 侧滑按钮(删除/编辑/收藏) |
| app-mod-pull-refresh | 下拉刷新 | 下拉指示 + 内容区 |
| app-mod-skeleton-loading | 骨架加载 | 骨架屏占位 |
| app-mod-empty-illustration | 空状态插画 | 插图 + 文案 + 操作按钮 |
| app-mod-fab | 浮动操作按钮 | 圆形按钮 + 图标 + 阴影 |
| app-mod-badge-dot | 消息红点 | 图标 + 红点/数字 |
| app-mod-guide-mask | 引导遮罩层 | 半透明遮罩 + 高亮区 + 提示文案 |
| app-mod-countdown-btn | 倒计时按钮 | 按钮 + 倒计时秒数 |
| app-mod-step-indicator | 步骤指示器 | 步骤圆点 + 连线 + 标签 |
| app-mod-banner-swiper | Banner轮播 | 图片轮播 + 指示器 |
| app-mod-feature-grid | 功能入口网格 | 图标 + 文字 × N |
| app-mod-notice-bar | 通知公告栏 | 图标 + 滚动文字 + 关闭 |
| app-mod-avatar-stack | 头像叠加组 | 头像横排叠加 + 数量 |

#### Mobile 页面模板

| 页面 ID | 页面名 | 组成模块 |
|---------|--------|---------|
| app-mob-splash | 启动页 | Logo + 品牌名 + 版本号 |
| app-mob-onboarding | 引导页(3步) | 插图 + 标题 + 描述 + step-indicator + 跳过/下一步 |
| app-mob-login | 登录页 | Logo + form-section + 第三方登录 |
| app-mob-register | 注册页 | form-section + countdown-btn + 协议勾选 |
| app-mob-home-tab | Tab首页 | top-bar + search-bar + banner-swiper + feature-grid + list-section + tab-bar |
| app-mob-home-flow | 信息流首页 | top-bar + notice-bar + card-flow + fab + tab-bar |
| app-mob-discover | 发现页 | top-bar + search-bar + feature-grid + 推荐卡片流 |
| app-mob-messages | 消息页 | top-bar + Tab + 消息列表 + badge-dot |
| app-mob-profile | 个人中心 | user-header + 功能网格 + 设置列表 + tab-bar |
| app-mob-settings | 设置页 | top-bar + 设置项列表 + 退出登录 |
| app-mob-about | 关于页 | Logo + 版本 + 信息列表 |

---

### 4.8 社区/社交（shadcn/ui + Tailwind UI）

#### Web 行业组件

| 组件 ID | 组件名 | 组成 |
|---------|--------|------|
| social-mod-post-card | 帖子卡片 | 用户信息 + 内容 + 图片 + 点赞/评论/分享 |
| social-mod-comment-thread | 评论组件 | 评论列表 + 回复 + 折叠 |
| social-mod-like-favorite | 点赞收藏按钮 | 图标 + 计数 + 动效 |
| social-mod-follow-card | 用户关注卡片 | 头像 + 名称 + 简介 + 关注按钮 |
| social-mod-topic-tag | 话题标签 | #标签 + 讨论数 |
| social-mod-notify-badge | 通知徽章 | 图标 + 未读数 |
| social-mod-content-editor | 内容编辑器 | 富文本 + 图片上传 + 话题选择 + 发布 |
| social-mod-share-buttons | 分享按钮组 | 分享渠道图标 × N |
| social-mod-hot-topics | 热门话题排行 | 排名 + 话题 + 热度 |
| social-mod-user-level | 用户等级标签 | 等级图标 + 名称 |
| social-mod-sidebar-trending | 侧边热门推荐 | 标题 + 推荐用户/话题列表 |
| social-mod-media-grid | 媒体网格 | 图片/视频网格 + 预览 |

#### Web 页面模板

| 页面 ID | 页面名 | 组成模块 |
|---------|--------|---------|
| social-web-home | 社区首页 | top-header + 话题导航 + post-card流 + sidebar-trending |
| social-web-post-detail | 帖子详情页 | top-header + post-card + comment-thread + 相关推荐 |
| social-web-user-profile | 用户主页 | 用户封面 + 统计 + post-card列表 + follow-card |
| social-web-topic | 话题页 | 话题头 + 统计 + post-card流 |
| social-web-compose | 发布页 | content-editor + 预览 + 发布 |
| social-web-admin | 后台管理 | sidebar-nav + top-header + 内容审核 + 用户管理 + 举报处理 |

#### Mobile 行业组件

| 组件 ID | 组件名 | 组成 |
|---------|--------|------|
| social-mob-post-card | 帖子卡片(移动版) | 用户行 + 内容 + 图片 + 操作栏 |
| social-mob-comment-input | 评论输入框 | 输入框 + 表情 + 发送 |
| social-mob-emoji-panel | 表情面板 | emoji网格 + 分类Tab |
| social-mob-image-picker | 图片选择器 | 图片网格 + 添加按钮 |
| social-mob-share-sheet | 分享面板 | modal-sheet + 分享渠道 + 取消 |

#### Mobile 页面模板

| 页面 ID | 页面名 | 组成模块 |
|---------|--------|---------|
| social-mob-feed | 动态流 | top-bar + post-card流 + pull-refresh + tab-bar |
| social-mob-compose | 发帖页 | top-bar + 输入区 + image-picker + 话题 + 发布 |
| social-mob-post-detail | 帖子详情 | top-bar + post-card + comment-thread + comment-input + action-bar |
| social-mob-messages | 消息页 | top-bar + Tab + 聊天列表 + notify-badge |
| social-mob-profile | 个人主页 | user-header + 统计 + post-card流 + tab-bar |
| social-mob-search | 搜索页 | search-bar + 热门话题 + 用户推荐 |

---

## 五、文件总清单

共 **19** 个模板文件：

| # | 文件名 | 设计语言 | Web模块 | Web页面 | Mobile模块 | Mobile页面 |
|---|--------|---------|---------|---------|-----------|-----------|
| 1 | 通用模板-ant-design.swc | Ant Design | 26 | 18 | 19 | 16 |
| 2 | 通用模板-shadcn-ui.swc | shadcn/ui | 26 | 18 | 19 | 16 |
| 3 | 通用模板-material-design.swc | Material Design | 26 | 18 | 19 | 16 |
| 4 | 行业模板-电商SaaS-ant-design.swc | Ant Design | 14 | 9 | 5 | 5 |
| 5 | 行业模板-电商SaaS-semi-design.swc | Semi Design | 14 | 9 | 5 | 5 |
| 6 | 行业模板-企业ERP-ant-design.swc | Ant Design | 11 | 7 | 3 | 4 |
| 7 | 行业模板-企业ERP-shadcn-ui.swc | shadcn/ui | 11 | 7 | 3 | 4 |
| 8 | 行业模板-财务系统-semi-design.swc | Semi Design | 10 | 6 | 3 | 3 |
| 9 | 行业模板-财务系统-shadcn-ui.swc | shadcn/ui | 10 | 6 | 3 | 3 |
| 10 | 行业模板-仓储系统-ant-design.swc | Ant Design | 9 | 6 | 3 | 4 |
| 11 | 行业模板-仓储系统-material-design.swc | Material Design | 9 | 6 | 3 | 4 |
| 12 | 行业模板-供应链系统-ant-design.swc | Ant Design | 7 | 6 | 3 | 3 |
| 13 | 行业模板-供应链系统-semi-design.swc | Semi Design | 7 | 6 | 3 | 3 |
| 14 | 行业模板-数据大屏-linear.swc | Linear | 10 | 4 | — | — |
| 15 | 行业模板-数据大屏-tailwind-ui.swc | Tailwind UI | 10 | 4 | — | — |
| 16 | 行业模板-移动APP-material-design.swc | Material Design | — | — | 14 | 11 |
| 17 | 行业模板-移动APP-semi-design.swc | Semi Design | — | — | 14 | 11 |
| 18 | 行业模板-社区社交-shadcn-ui.swc | shadcn/ui | 12 | 6 | 5 | 6 |
| 19 | 行业模板-社区社交-tailwind-ui.swc | Tailwind UI | 12 | 6 | 5 | 6 |

---

## 六、实施优先级

1. **通用模板**（3个文件）— 所有行业的基础
2. **电商 SaaS**（2个文件）— 最高频行业
3. **企业 ERP**（2个文件）— 企业级刚需
4. **数据大屏**（2个文件）— 视觉冲击力强
5. **移动 APP**（2个文件）— 移动端基础
6. **社区/社交**（2个文件）— C端常见
7. **财务系统**（2个文件）
8. **仓储系统**（2个文件）
9. **供应链系统**（2个文件）
