import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

const BACKTICK = "`";

export function registerAcceptanceCriteriaPrompt(server: McpServer) {
  server.prompt(
    "acceptance-criteria",
    {
      userStory: z.string().describe("用户故事内容"),
    },
    ({ userStory }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `请帮我完善这个用户故事的验收标准。

用户故事：${userStory}`,
          },
        },
        {
          role: "assistant",
          content: {
            type: "text",
            text: `好的，我来帮你制定完整的验收标准。

## 验收标准模板

### Given-When-Then 格式

#### 场景 1：主流程（Happy Path）
${BACKTICK}${BACKTICK}${BACKTICK}gherkin
Feature: 功能名称

  Scenario: 正常操作流程
    Given 前置条件
      And 用户已完成某些准备操作
    When 用户执行核心操作
    Then 系统应该产生预期结果
      And 数据应该被正确保存
${BACKTICK}${BACKTICK}${BACKTICK}

#### 场景 2：替代流程
${BACKTICK}${BACKTICK}${BACKTICK}gherkin
  Scenario: 用户选择不同选项
    Given 前置条件
    When 用户选择其他选项
    Then 系统应该相应处理
${BACKTICK}${BACKTICK}${BACKTICK}

#### 场景 3：边界情况
${BACKTICK}${BACKTICK}${BACKTICK}gherkin
  Scenario: 输入边界值
    Given 某些边界条件
    When 用户输入边界值
    Then 系统应该正确处理
${BACKTICK}${BACKTICK}${BACKTICK}

#### 场景 4：异常情况
${BACKTICK}${BACKTICK}${BACKTICK}gherkin
  Scenario: 网络错误或数据无效
    Given 异常条件
    When 用户尝试操作
    Then 系统应该显示错误提示
      And 不应该产生副作用
${BACKTICK}${BACKTICK}${BACKTICK}

## 验收标准检查清单

- [ ] 是否覆盖所有正常流程？
- [ ] 是否考虑边界情况？
- [ ] 是否处理异常场景？
- [ ] 是否有明确的判断标准？
- [ ] 是否可测试？

需要我针对具体用户故事细化吗？`,
          },
        },
      ],
    })
  );
}
