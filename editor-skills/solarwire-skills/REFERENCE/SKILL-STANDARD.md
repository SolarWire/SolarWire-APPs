# SolarWire 技能标准

本文档定义了 SolarWire 技能包的设计标准，所有技能必须遵循此规范。

---

## 1. 文件结构

```
editor-skills/solarwire-skills/
├── using-solarwire/                 # 统一入口
│   └── SKILL.md
├── solarwire-syntax/                # 语法规则
│   ├── SKILL.md
│   └── validate.js
├── solarwire-prd/                   # PRD 生成
│   ├── SKILL.md
│   ├── REFERENCE.md
│   ├── NOTE-WRITING.md
│   ├── SCENARIO-SPEC.md
│   └── EXAMPLES.md
├── solarwire-prd-review/            # PRD 评审
│   └── SKILL.md
├── solarwire-code-to-prd/           # 代码转 PRD
│   ├── SKILL.md
│   └── EXAMPLES.md
├── solarwire-prd-to-testcase/       # PRD 转测试
│   ├── SKILL.md
│   └── lib/
├── solarwire-component-generator/   # 组件生成
│   └── SKILL.md
├── shared/                          # 共享库
│   ├── parser/
│   └── renderer-svg/
└── REFERENCE/                       # 参考文档（可选）
```

---

## 2. Frontmatter 规范

每个 SKILL.md 必须以 YAML frontmatter 开始：

```yaml
---
name: skill-name
description: <仅描述触发条件，≤200字符>
---
```

**description 必须包含：**
- (1) 做什么
- (2) 何时触发

**禁止在 description 中：**
- 描述工作流步骤
- 列出使用场景
- 包含交叉引用信息

---

## 3. Section 结构

所有技能必须按以下顺序组织章节：

| 章节 | 必填 | 说明 |
|------|------|------|
| Overview | ✅ | 一句话说明技能职责 |
| When to Use | ✅ | 症状/场景 + 反模式 |
| Core Pattern/Workflow | ✅ | 核心流程或模式 |
| Quick Reference | ❌ | 快速参考表（可选） |
| Implementation | ❌ | 详细实现说明（可选） |
| Common Mistakes | ✅ | 常见错误对照表 |
| Red Flags | ✅ | 防自我合理化表格 |
| Real-World Impact | ❌ | 实际价值说明（可选） |

---

## 4. 交叉引用

技能间引用使用 `solarwire: skill-name` 格式：

```markdown
语法规则由 `solarwire: solarwire-syntax` 定义
```

引用 Superpower 技能使用 `superpowers: skill-name` 格式：

```markdown
使用 `superpowers: brainstorming` 探索需求
```

---

## 5. Red Flags 表格格式

```markdown
## Red Flags

| Thought | Reality |
|---------|---------|
| "技能会自己验证" | 必须手动调用验证脚本 |
```

每个技能至少包含 3 条针对该技能特定场景的 Red Flags。

---

## 6. Token 效率

| 文件 | 最大行数 | 说明 |
|------|---------|------|
| SKILL.md | ≤300 行 | 核心工作流和必要信息 |
| REFERENCE.md | 不限 | 详细语法参考 |
| EXAMPLES.md | 不限 | 示例集合 |

超过 300 行的内容应拆分为独立参考文件。

---

## 7. 共享库

禁止在技能目录中重复放置 parser 或 renderer 代码。

所有共享代码必须放在 `shared/` 目录，技能通过相对路径引用：

```javascript
const sharedDir = path.join(__dirname, '..', 'shared');
const parserPath = path.join(sharedDir, 'parser', 'index.js');
```