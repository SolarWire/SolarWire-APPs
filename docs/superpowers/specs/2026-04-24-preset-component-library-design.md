# SolarWire 预设组件库设计方案

**日期：** 2026-04-24
**状态：** 已确认

---

## 一、目标

建立 SolarWire 可视化编辑器的完整预设组件库体系，覆盖：
- **6 套设计语言**：Ant Design、Material Design、shadcn/ui、Linear、Semi Design、Tailwind UI
- **2 个平台**：Web、Mobile
- **Phase 2（后续）**：行业模板库（电商 SaaS、企业 ERP、CMS 内容管理、数据大屏、移动 App 壳、B2B 平台、社区/社交）× 设计语言 × 平台

---

## 二、文件结构

```
presets/
├── 组件库-ant-design.swc
├── 组件库-material-design.swc
├── 组件库-shadcn-ui.swc
├── 组件库-linear.swc
├── 组件库-semi-design.swc
└── 组件库-tailwind-ui.swc
```

**命名规范：** `组件库-{风格}.swc`

---

## 三、文件内部结构

以 `组件库-ant-design.swc` 为例：

```yaml
id: ant-design
name: Ant Design
description: 企业中后台设计语言，成熟生态、组件丰富
platforms:
  web:
    categories:
      - id: web-general
        name: Web-通用
        components: [...]
      - id: web-form
        name: Web-表单
        components: [...]
      ...
  mobile:
    categories:
      - id: mobile-general
        name: Mobile-通用
        components: [...]
      - id: mobile-form
        name: Mobile-表单
        components: [...]
      ...
```

**平台完全独立，无跨平台组件引用。**

---

## 四、分类体系

### Web 分类（14 个）

| # | 分类 ID | 分类名 | 包含组件 |
|---|---------|--------|----------|
| 1 | web-general | Web-通用 | 主按钮、默认按钮、危险按钮、幽灵按钮、文字按钮、图标按钮、按钮组、胶囊按钮、头像、徽标、标签、分割线、工具提示 |
| 2 | web-form | Web-表单 | 输入框、带标签输入框、多行文本框、下拉选择、日期选择、日期范围选择、单选框、复选框、开关、滑块、评分、颜色选择、文件上传、级联选择、穿梭框 |
| 3 | web-table | Web-表格 | 基础表格、带边框表格、斑马纹表格、可选中表格、可展开表格、固定表头表格、固定列表格、排序表格、筛选表格、分页表格、合并单元格表格、虚拟滚动表格 |
| 4 | web-list | Web-列表 | 基础列表、可操作列表、图文列表、带头像列表、消息列表、评论列表、卡片列表、瀑布流列表、虚拟列表 |
| 5 | web-card | Web-卡片 | 基础卡片、图文卡片、带有操作栏的卡片、卡片组、网格卡片、预约卡片、统计数据卡片 |
| 6 | web-chart | Web-图表 | 折线图、柱状图、饼图、面积图、雷达图、漏斗图、散点图、地图、热力图、仪表盘、K线图 |
| 7 | web-search | Web-搜索 | 搜索框、搜索历史、热门搜索、筛选面板、高级筛选、标签筛选、日期范围筛选 |
| 8 | web-navigation | Web-导航 | 面包屑、分页器、步骤条、顶部导航、侧边导航、胶囊导航、锚点导航、标签页切换、下拉菜单、tab切换、快捷导航 |
| 9 | web-auth | Web-认证 | 登录页、注册页、找回密码页、验证码登录、第三方登录、手机号登录、用户协议、隐私政策 |
| 10 | web-feedback | Web-反馈 | 成功提示、错误提示、警告提示、信息提示、模态对话框、抽屉、侧边面板、徽章通知、加载状态、骨架屏、空状态、结果页、确认提示、删除确认 |
| 11 | web-media | Web-媒体 | 图片展示、图片画廊、图片预览、视频播放、音频播放、文件展示、PDF预览 |
| 12 | web-editor | Web-编辑器 | 富文本编辑器、Markdown编辑器、代码编辑器、表格编辑器、在线图表编辑器、JSON编辑器 |
| 13 | web-commerce | Web-电商 | 商品卡片、商品列表、商品详情、购物车、结算页、优惠券、订单列表、订单详情、物流跟踪、售后服务 |
| 14 | web-layout | Web-布局 | 页面布局、栅格系统、间距容器、分割线、Flex布局、卡片容器、响应式布局、订阅布局、仪表盘布局 |

### Mobile 分类（14 个）

| # | 分类 ID | 分类名 | 包含组件 |
|---|---------|--------|----------|
| 1 | mobile-general | Mobile-通用 | 主按钮、默认按钮、危险按钮、图标按钮、胶囊按钮、头像、徽标、标签、文案 |
| 2 | mobile-form | Mobile-表单 | 输入框、多行文本、下拉选择、日期选择、单选框、复选框、开关、滑块、评分、验证码、实名认证 |
| 3 | mobile-list | Mobile-列表 | 列表项、带图标列表项、多图列表项、消息列表、聊天列表、索引列表、折叠列表、可展开列表 |
| 4 | mobile-swipe | Mobile-滑动操作 | 左滑操作、右滑操作、滑动删除、滑动编辑、滑动收藏、堆叠卡片 |
| 5 | mobile-card | Mobile-卡片 | 横向滚动卡片、瀑布流卡片、胶囊卡片、评价卡片、商品卡片 |
| 6 | mobile-navigation | Mobile-导航 | 底部Tab、顶部导航栏、返回导航、分段器、胶囊菜单、列表导航 |
| 7 | mobile-search | Mobile-搜索 | 搜索框、搜索历史、热门搜索、搜索建议、搜索结果、空结果 |
| 8 | mobile-profile | Mobile-个人中心 | 用户卡片、设置列表、设置项、会员卡片、签到卡片、等级展示 |
| 9 | mobile-chat | Mobile-聊天 | 聊天消息、气泡样式、表情面板、语音消息、系统消息、输入工具栏 |
| 10 | mobile-media | Mobile-媒体 | 图片预览、图片选择、视频播放、音频播放、媒体上传 |
| 11 | mobile-location | Mobile-定位 | 地图展示、位置选择、地址列表、距离展示 |
| 12 | mobile-feedback | Mobile-反馈 | 成功提示、错误提示、警告提示、信息提示、加载状态、下拉刷新、上拉加载、空状态、轻提示Toast、操作菜单 |
| 13 | mobile-commerce | Mobile-电商 | 商品卡片、商品列表、商品详情、购物车、优惠券、订单状态、物流跟踪 |
| 14 | mobile-layout | Mobile-布局 | 页面布局、间距容器、分割线、Flex布局、卡片容器 |

---

## 五、设计语言特色

| 设计语言 | 特色 | 视觉关键词 |
|----------|------|------------|
| Ant Design | 企业中后台、成熟生态 | #1890FF、规整、层级分明 |
| Material Design | Google 设计语言、卡片式 | #6200EE、阴影层次、圆润 |
| shadcn/ui | 现代简约、精致感 | 深灰/slate、清爽、现代 |
| Linear | 科技感、暗色系、微动效 | 暗色背景、紫色强调、精致的圆角 |
| Semi Design | 字节跳动、数据友好 | #4C8BF5、双层卡片、图表友好 |
| Tailwind UI | 实用主义、快速原型 | 多彩、灵活、组合式 |

---

## 六、实施计划

### Phase 1：组件库（当前阶段）

**执行顺序：**
1. 每套设计语言独立文件，Web + Mobile 共存于同一文件
2. 每套设计语言按 28 个分类（14 Web + 14 Mobile）填充组件
3. 平台完全独立，无跨平台引用

**工作量估算：**
- 6 套设计语言 × 28 个分类 = 168 个分类
- 每套设计语言预计 150-300 个组件（视平台而定）
- 总计约 1000-1800 个组件

### Phase 2：行业模板（后续阶段）

每个模板是完整的业务页面，涵盖列表页、详情页、表单页等。

---

## 七、组件文件格式

沿用现有 `ant-design.swc` 的 `.swc` 格式（Markdown 风格 + solarwire 代码块）。

### SolarWire 元素语法规范

| 元素 | 语法 | 说明 |
|------|------|------|
| Rectangle | `["text"]` | 矩形，不支持 `r` 设置圆角 |
| Rounded Rectangle | `("text")` | 圆角矩形，用 `r=X` 设置圆角半径，`r=0` 可变为矩形 |
| Circle | `(("text"))` | 圆形 |
| Plain Text | `"text"` | 纯文本标签 |
| Placeholder | `[?"text"]` | 占位符（图标/图片） |
| Line | `--` | 分割线 |

### 示例

```markdown
## Web-通用
id: web-general

### 主按钮
id: web-btn-primary
name: 主按钮
description: 用于主要操作的高亮按钮
categoryId: web-general
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
createdAt: 2026-04-24T00:00:00Z
updatedAt: 2026-04-24T00:00:00Z

```solarwire
("默认按钮") @(10, 10) w=120 h=36 bg=#ffffff c=#000000 size=14 s=1 r=6
```
```

每个组件包含：
- `id`：唯一标识
- `name`：显示名称
- `description`：描述
- `categoryId`：所属分类
- `createdAt` / `updatedAt`：时间戳
- solarwire 代码块：组件的 DSL 定义

---

## 八、Phase 1 交付物清单

| 文件 | 平台 | 分类数 | 预计组件数 |
|------|------|--------|------------|
| 组件库-ant-design.swc | Web + Mobile | 28 | ~300 |
| 组件库-material-design.swc | Web + Mobile | 28 | ~250 |
| 组件库-shadcn-ui.swc | Web + Mobile | 28 | ~250 |
| 组件库-linear.swc | Web + Mobile | 28 | ~250 |
| 组件库-semi-design.swc | Web + Mobile | 28 | ~250 |
| 组件库-tailwind-ui.swc | Web + Mobile | 28 | ~250 |

**Phase 1 完成后开始 Phase 2：行业模板库。**
