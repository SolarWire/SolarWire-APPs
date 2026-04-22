#!/usr/bin/env node

/**
 * SolarWire MCP Server
 * 
 * Product Manager Engineering Tool - Model Context Protocol Server
 * 
 * Provides tools for:
 * - PRD generation with SolarWire wireframes
 * - SolarWire code validation
 * - SVG rendering
 * - Component library management
 * - Test case generation
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerGeneratePrdTool } from "./tools/generate-prd.tool.js";
import { registerValidateCodeTool } from "./tools/validate-code.tool.js";
import { registerRenderSvgTool } from "./tools/render-svg.tool.js";
import { registerGenerateComponentTool } from "./tools/generate-component.tool.js";
import { registerPrdToTestcaseTool } from "./tools/prd-to-testcase.tool.js";
import { registerCodeToPrdTool } from "./tools/code-to-prd.tool.js";
import {
  registerBrainstormPrompt,
  registerRequirementsAnalysisPrompt,
  registerUserStoryPrompt,
  registerAcceptanceCriteriaPrompt,
  registerCompetitorAnalysisPrompt,
} from "./prompts/index.js";
import { logger } from "./middleware/logger.js";

// Create MCP Server instance
const server = new McpServer({
  name: "SolarWire MCP Server",
  version: "1.0.0",
});

// Register Tools
registerGeneratePrdTool(server);
registerValidateCodeTool(server);
registerRenderSvgTool(server);
registerGenerateComponentTool(server);
registerPrdToTestcaseTool(server);
registerCodeToPrdTool(server);

// Resources
server.resource(
  "syntax-rules",
  "file:///solarwire/syntax-rules",
  async (uri) => {
    const fs = await import("fs");
    const path = await import("path");
    const skillsDir = process.env.SKILLS_DIR || "../editor-skills";
    const skillPath = path.join(skillsDir, "solarwire-basic/SKILL.md");
    const content = fs.readFileSync(skillPath, "utf-8");
    return {
      contents: [
        {
          uri: uri.href,
          mimeType: "text/markdown",
          text: content,
        },
      ],
    };
  }
);

server.resource(
  "component-library-template",
  "file:///solarwire/component-library-template",
  async (uri) => {
    const template = {
      $schema: "solarwire-component-library-v1",
      metadata: {
        id: "generate-uuid-here",
        name: "组件库名称",
        description: "组件库描述",
        version: "1.0.0",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      categories: [],
      components: [],
    };
    return {
      contents: [
        {
          uri: uri.href,
          mimeType: "application/json",
          text: JSON.stringify(template, null, 2),
        },
      ],
    };
  }
);

// Prompts
registerBrainstormPrompt(server);
registerRequirementsAnalysisPrompt(server);
registerUserStoryPrompt(server);
registerAcceptanceCriteriaPrompt(server);
registerCompetitorAnalysisPrompt(server);

// Server startup
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info("SolarWire MCP Server started");
  logger.info("Listening on stdio");
}

main().catch((error) => {
  logger.error("Server startup failed:", error);
  process.exit(1);
});
