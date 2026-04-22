import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import path from "path";
import { fileURLToPath } from "url";
import { logger } from "../middleware/logger.js";

export function registerValidateCodeTool(server: McpServer) {
  server.tool(
    "validate-solarwire-code",
    "Validate SolarWire wireframe code syntax and renderability",
    {
      code: z.string().describe("SolarWire code to validate"),
      generateSvg: z.boolean().optional().default(true).describe("Whether to generate SVG files"),
      outputDir: z.string().optional().default("./output").describe("Output directory for SVG files"),
    },
    async ({ code, generateSvg, outputDir }) => {
      try {
        logger.info("Validating SolarWire code");

        const __dirname = path.dirname(fileURLToPath(import.meta.url));
        const parserPath = path.join(__dirname, "..", "engines", "solarwire-parser", "index.js");
        const rendererPath = path.join(__dirname, "..", "engines", "solarwire-renderer", "index.js");

        const { parse } = await import(parserPath);
        const { render } = await import(rendererPath);

        // Step 1: Parse
        const ast = parse(code);

        // Step 2: Render
        const svgWithNotes = render(ast, { disableNotes: false });
        const svgWithoutNotes = render(ast, { disableNotes: true });

        const result = {
          valid: true,
          message: "SolarWire code is valid and can be rendered successfully",
          svg: generateSvg
            ? {
                withNotes: svgWithNotes.substring(0, 200) + "...",
                withoutNotes: svgWithoutNotes.substring(0, 200) + "...",
              }
            : null,
        };

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        logger.error("Validation failed", { error });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  valid: false,
                  message: "SolarWire code validation failed",
                  error: error instanceof Error ? error.message : String(error),
                },
                null,
                2
              ),
            },
          ],
          isError: true,
        };
      }
    }
  );
}
