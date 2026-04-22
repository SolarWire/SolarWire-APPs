import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function registerBrainstormPrompt(server: McpServer) {
  server.prompt(
    "brainstorm",
    {
      productType: z.string().describe("产品类型（Mobile App / Web / Dashboard 等）"),
    },
    ({ productType }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `我需要设计一个${productType}产品，请帮我进行需求收集和头脑风暴。`,
          },
        },
        {
          role: "assistant",
          content: {
            type: "text",
            text: `好的！让我们开始头脑风暴。为了充分理解你的需求，我会问一些问题：

1. **目标用户**：这个产品的目标用户是谁？
2. **核心问题**：这个产品要解决什么问题？
3. **关键功能**：你认为必须有的核心功能是什么？
4. **使用场景**：用户在什么场景下会使用这个产品？
5. **成功标准**：如何衡量这个产品是否成功？

请告诉我你的想法。`,
          },
        },
      ],
    })
  );
}
