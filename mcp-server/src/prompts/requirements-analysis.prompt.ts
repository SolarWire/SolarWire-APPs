import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function registerRequirementsAnalysisPrompt(server: McpServer) {
  server.prompt(
    "requirements-analysis",
    {
      problem: z.string().describe("用户问题或需求描述"),
      userSegment: z.string().optional().describe("目标用户群体（可选）"),
    },
    ({ problem, userSegment }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `我收到了一个需求，请帮我进行需求分析。

问题描述：${problem}
${userSegment ? `目标用户：${userSegment}` : ""}`,
          },
        },
        {
          role: "assistant",
          content: {
            type: "text",
            text: `好的，让我们从多个维度分析这个需求：

## 1. 问题理解
- 这个需求背后的真实问题是什么？
- 用户真正想要达到什么目标？

## 2. 用户场景分析
- 谁会遇到这个问题？（用户画像）
- 在什么场景下会遇到？（触发条件）
- 当前用户是如何解决这个问题的？（现有方案）

## 3. 需求优先级评估
- 这个需求对用户价值有多大？
- 不解决会有什么后果？
- 有多少用户受此影响？

## 4. 可行性分析
- 技术上是否可行？
- 需要多少开发资源？
- 有无技术风险或依赖？

## 5. 成功指标
- 如何衡量需求是否被满足？
- 关键指标是什么？

请提供更多上下文，我可以帮你深入分析。`,
          },
        },
      ],
    })
  );
}
