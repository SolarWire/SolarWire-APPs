import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

const BACKTICK = "`";

export function registerUserStoryPrompt(server: McpServer) {
  server.prompt(
    "user-story",
    {
      feature: z.string().describe("功能特性描述"),
      userRole: z.string().describe("用户角色（如：普通用户、管理员、访客等）"),
      goal: z.string().describe("用户想要达成的目标"),
    },
    ({ feature, userRole, goal }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `请帮我编写用户故事和验收标准。

功能：${feature}
用户角色：${userRole}
用户目标：${goal}`,
          },
        },
        {
          role: "assistant",
          content: {
            type: "text",
            text: `好的，我来帮你编写标准的用户故事和验收标准。

## 用户故事

**作为** ${userRole}
**我想要** ${feature}
**以便于** ${goal}

## 验收标准（Gherkin 格式）

### 场景 1：正常流程
${BACKTICK}${BACKTICK}${BACKTICK}gherkin
Given 我是 ${userRole}
When 我执行某个操作
Then 我应该看到预期结果
${BACKTICK}${BACKTICK}${BACKTICK}

### 场景 2：边界情况
${BACKTICK}${BACKTICK}${BACKTICK}gherkin
Given 某些前置条件
When 我执行某个操作
Then 系统应该正确处理
${BACKTICK}${BACKTICK}${BACKTICK}

### 场景 3：异常情况
${BACKTICK}${BACKTICK}${BACKTICK}gherkin
Given 某些异常条件
When 我尝试执行操作
Then 系统应该给出合理的错误提示
${BACKTICK}${BACKTICK}${BACKTICK}

## 补充说明

- **优先级**：这个用户故事的优先级如何？
- **复杂度**：预计开发难度（小/中/大）
- **依赖**：是否有其他功能依赖或前置条件？

需要调整或补充吗？`,
          },
        },
      ],
    })
  );
}
