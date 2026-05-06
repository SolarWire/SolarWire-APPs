# 保存逻辑重构设计

## 问题根因

当前保存逻辑存在 5 个深层问题，共同导致"md 文件内容被完全替换"和"内容重复"的 bug：

1. **`currentSnippet` 保存后被清空**：首次保存后 `set({ currentSnippet: null })`，导致第二次保存走 `else` 分支，用 snippet 代码覆盖整个 md 文件
2. **SolarWireMode 的有害 useEffect**：每次 `editorStore.content` 变化都把 snippet 代码写入 `fileContent`，覆盖了完整的 md 内容
3. **`fileContent` 语义混乱**：md 模式下存完整 md，solarwire 模式下存 snippet 代码，两个语义共用一个字段
4. **模式切换时内容丢失**：从 md 模式切换到 solarwire 模式，`fileContent` 被替换为 snippet 代码，完整 md 无处可寻
5. **`editorStore.content` 和 `fileContent` 双源混乱**：两者都存"内容"但语义不同步

## 核心原则

**`fullFileContent` 是完整文件的唯一内存真相。**

- solarwire 模式下的编辑实时同步到 `fullFileContent`（替换代码块部分）
- 保存 = 写 `fullFileContent` 到磁盘
- 撤销/重做也实时同步到 `fullFileContent`

## 数据模型变更

### 新增 `fullFileContent`

```typescript
// fileStore
fullFileContent: string    // 始终保存完整文件内容，与当前编辑状态同步
```

### 废弃 `fileContent`

`fileContent` 是 bug 的核心来源，用 `fullFileContent` 替代。迁移映射：

| 使用场景 | 当前行为 | 迁移为 |
|---------|---------|--------|
| MarkdownMode 读取文件内容 | `setContent(fileContent)` | `setContent(fullFileContent)` |
| SolarWireMode 同步文件内容 | `setContent(fileContent)` | `setContent(fullFileContent)` |
| MarkdownPreview 渲染回退 | `contentToRender = fileContent` | `contentToRender = fullFileContent` |
| saveFile 读取内容 | `editorContent \|\| fileContent` | 直接用 `fullFileContent` |
| openFileAtPath 设置 | `set({ fileContent: content })` | `set({ fullFileContent: content })` |
| openSolarWireSnippet 设置 | `set({ fileContent: latestCode })` | `set({ fullFileContent: 磁盘完整md })` |

### 删除 `setFileContent` 和 `updateFileContent`

- `setFileContent`：被 SolarWireMode 的有害 useEffect 调用，删除
- `updateFileContent`：无任何调用方，删除

### `editorStore.content` 与 `fullFileContent` 的关系

| 模式 | `editorStore.content` | `fullFileContent` |
|------|----------------------|-------------------|
| md 模式 | 完整 md 内容（用户编辑） | = `editorContent` |
| solarwire snippet 模式 | 代码块内容（用户编辑） | 完整 md（代码块部分实时同步） |
| solarwire 独立文件模式 | 完整 sw 内容（用户编辑） | = `editorContent` |

## 各场景详细行为

### 场景 1：md 模式保存

```
1. 校验：editorStore.mode === 'markdown'，editorContent 应为完整 md 文件
2. fullFileContent = editorContent
3. 写 fullFileContent 到磁盘
4. 重新解析该 md 文件中的所有 solarwire snippet，更新 snippet 元数据
5. 重置 isModified = false
```

### 场景 2：solarwire snippet 模式保存

```
1. 校验：editorStore.mode === 'solarwire'，currentSnippet 存在，editorContent 应为代码块内容
2. fullFileContent 已通过实时同步包含最新编辑，直接写 fullFileContent 到磁盘
3. 重新解析该 md 文件中的所有 solarwire snippet，更新 snippet 元数据
4. 保持当前编辑状态（editorContent 不变，currentSnippet 不变）
5. 重置 isModified = false
```

### 场景 3：solarwire 独立文件模式保存

```
1. 校验：editorStore.mode === 'solarwire'，currentSnippet 为 null
2. fullFileContent = editorContent
3. 写 fullFileContent 到磁盘
4. 重置 isModified = false
```

### 场景 4：solarwire 编辑实时同步 fullFileContent

在 SolarWireMode 的 `handleContentChange` 中：

```
1. setContent(newContent)          // 更新编辑器内容
2. 如果 currentSnippet 存在：
   fullFileContent = replaceSolarWireSnippetInMarkdown(fullFileContent, snippetIndex, newContent)
3. 如果 currentSnippet 不存在（独立文件）：
   fullFileContent = newContent
```

### 场景 5：撤销/重做实时同步 fullFileContent

监听 `editorStore.content` 的所有变化（包括撤销/重做），统一同步到 `fullFileContent`：

```
editorStore.content 变化
  → 如果 currentSnippet 存在：
    fullFileContent = replaceSolarWireSnippetInMarkdown(fullFileContent, snippetIndex, editorContent)
  → 如果 currentSnippet 不存在：
    fullFileContent = editorContent
```

### 场景 6：模式切换

**md 模式 → solarwire snippet 模式**（点击 snippet）：

```
1. 如果当前是 md 模式且有未保存的编辑：
   fullFileContent = editorContent    // 先同步 md 编辑到 fullFileContent
2. 从 fullFileContent 中提取 snippet 代码
3. editorContent = 提取的代码
4. 设置 currentSnippet
5. 切换模式为 solarwire
```

**solarwire snippet 模式 → md 模式**（点击文件树中的 md 文件）：

```
1. fullFileContent 已通过实时同步包含最新编辑
2. editorContent = fullFileContent
3. 清除 currentSnippet
4. 切换模式为 markdown
```

**solarwire snippet A → snippet B**：

```
1. fullFileContent 已通过实时同步包含 snippet A 的编辑
2. 从 fullFileContent 中提取 snippet B 代码
3. editorContent = 提取的代码
4. 更新 currentSnippet 为 snippet B
5. clearHistory()
```

### 场景 7：打开文件

**打开 md 文件**：

```
1. 从磁盘读取完整内容
2. fullFileContent = 磁盘内容
3. editorContent = 磁盘内容
4. currentSnippet = null
5. 切换模式为 markdown
```

**打开 solarwire snippet**：

```
1. 从磁盘读取完整 md 内容
2. fullFileContent = 磁盘完整 md 内容
3. 从 fullFileContent 中提取 snippet 代码
4. editorContent = 提取的代码
5. 设置 currentSnippet
6. 切换模式为 solarwire
```

**打开独立 solarwire 文件**：

```
1. 从磁盘读取内容
2. fullFileContent = 磁盘内容
3. editorContent = 磁盘内容
4. currentSnippet = null
5. 切换模式为 solarwire
```

## 保存校验规则

保存前进行防御性校验，确保不会写入错误内容：

| 模式 | 校验内容 | 失败处理 |
|------|---------|---------|
| md 模式 | `editorContent` 不为空，且包含完整 md 结构 | 提示"内容为空"或"内容格式异常" |
| solarwire snippet | `currentSnippet` 存在，`editorContent` 不为空，`fullFileContent` 不为空 | 提示对应错误 |
| solarwire 独立文件 | `editorContent` 不为空 | 提示"内容为空" |

## 删除的代码

| 文件 | 代码 | 原因 |
|------|------|------|
| SolarWireMode.tsx:141-146 | `useEffect` 同步 `editorContent` 到 `fileContent` | 内容重复的根因 |
| SolarWireMode.tsx:132-138 | `useEffect` 同步 `fileContent` 到 `editorContent` | 用 `fullFileContent` 替代 |
| fileStore.ts:362 | `set({ currentSnippet: null })` | 保存后不应清空 snippet |
| fileStore.ts | `setFileContent` 方法 | 不再需要 |
| fileStore.ts | `updateFileContent` 方法 | 无调用方 |
| file.ts | `fileContent` 字段 | 用 `fullFileContent` 替代 |
| file.ts | `setFileContent` 声明 | 不再需要 |
| file.ts | `updateFileContent` 声明 | 不再需要 |

## 修改的文件清单

| 文件 | 修改内容 |
|------|---------|
| `shared/types/file.ts` | `fileContent` → `fullFileContent`，删除 `setFileContent`/`updateFileContent` |
| `stores/fileStore.ts` | 重写 `saveFile`、`openFileAtPath`、`openSolarWireSnippet`，删除 `setFileContent`/`updateFileContent` |
| `components/editor-modes/SolarWireMode.tsx` | 删除有害 useEffect，`handleContentChange` 增加实时同步 `fullFileContent` 逻辑，增加撤销同步 |
| `components/editor-modes/MarkdownMode.tsx` | `fileContent` → `fullFileContent` |
| `components/editor/MarkdownPreview.tsx` | `fileContent` → `fullFileContent` |
| `stores/editorStore.ts` | 可能需要增加内容变化回调机制以支持撤销同步 |

## 性能评估

`replaceSolarWireSnippetInMarkdown` 是 O(n) 正则扫描，n = md 文件大小：

| 文件大小 | 正则替换耗时 | 可视化编辑器渲染耗时 |
|----------|-------------|-------------------|
| 10KB | < 0.1ms | 5-20ms |
| 100KB | < 0.5ms | 5-20ms |
| 1MB | < 3ms | 5-20ms |

正则替换的耗时远小于可视化编辑器的渲染耗时，性能影响可忽略。
