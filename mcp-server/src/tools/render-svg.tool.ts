import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { logger } from "../middleware/logger.js";

export function registerRenderSvgTool(server: McpServer) {
  server.tool(
    "render-svg",
    "Render SolarWire code to SVG files (with notes and without notes versions)",
    {
      code: z.string().describe("SolarWire code to render"),
      outputFileName: z.string().describe("Output file name (without extension)"),
      outputDir: z.string().optional().default("./output").describe("Output directory"),
    },
    async ({ code, outputFileName, outputDir }) => {
      try {
        logger.info("Rendering SVG", { outputFileName });

        const __dirname = path.dirname(fileURLToPath(import.meta.url));
        const parserPath = path.join(__dirname, "..", "engines", "solarwire-parser", "index.js");
        const rendererPath = path.join(__dirname, "..", "engines", "solarwire-renderer", "index.js");

        const { parse } = await import(parserPath);
        const { render } = await import(rendererPath);

        const ast = parse(code);
        const svgWithNotes = render(ast, { disableNotes: false });
        const svgWithoutNotes = render(ast, { disableNotes: true });

        // Ensure output directory exists
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }

        const withNotesPath = path.join(outputDir, `${outputFileName}-with-notes.svg`);
        const withoutNotesPath = path.join(outputDir, `${outputFileName}-without-notes.svg`);

        fs.writeFileSync(withNotesPath, svgWithNotes);
        fs.writeFileSync(withoutNotesPath, svgWithoutNotes);

        const result = {
          success: true,
          message: "SVG files generated successfully",
          files: {
            withNotes: withNotesPath,
            withoutNotes: withoutNotesPath,
          },
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
        logger.error("SVG rendering failed", { error });
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
