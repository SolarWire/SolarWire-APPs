import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function registerCompetitorAnalysisPrompt(server: McpServer) {
  server.prompt(
    "competitor-analysis",
    {
      product: z.string().describe("产品名称或描述"),
      category: z.string().describe("产品类别（如：电商、社交、工具等）"),
    },
    ({ product, category }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `我需要做竞品分析，请帮我分析。

产品：${product}
类别：${category}`,
          },
        },
        {
          role: "assistant",
          content: {
            type: "text",
            text: `好的，让我们进行竞品分析。

## 竞品分析框架

### 1. 市场概况
- 目标市场规模和趋势
- 用户画像和需求痛点
- 市场机会和空白

### 2. 竞品识别
- 直接竞品（同类产品）
- 间接竞品（替代方案）
- 潜在竞品（跨界进入者）

### 3. 功能对比矩阵
| 功能维度 | 我们的产品 | 竞品 A | 竞品 B | 竞品 C |
|----------|-----------|--------|--------|--------|
| 核心功能 |           |        |        |        |
| 用户体验 |           |        |        |        |
| 技术优势 |           |        |        |        |
| 商业模式 |           |        |        |        |
| 价格策略 |           |        |        |        |

### 4. 差异化分析
- 我们的独特价值主张（UVP）
- 与竞品相比的优势
- 需要弥补的劣势

### 5. 机会点
- 竞品未满足的用户需求
- 可以突破的功能空白
- 差异化竞争策略

请提供具体的竞品信息，我可以深入分析。`,
          },
        },
      ],
    })
  );
}
