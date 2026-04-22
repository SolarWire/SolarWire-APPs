import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import fs from "fs";
import path from "path";
import { logger } from "../middleware/logger.js";

export function registerGenerateComponentTool(server: McpServer) {
  server.tool(
    "generate-component-library",
    "Generate or modify .swc component library files and save to disk",
    {
      libraryName: z.string().describe("Component library name"),
      libraryDescription: z.string().optional().default("").describe("Component library description"),
      components: z.array(
        z.object({
          id: z.string().describe("Component unique ID"),
          name: z.string().describe("Component name"),
          description: z.string().describe("Component description"),
          categoryId: z.string().describe("Category ID"),
          code: z.string().describe("SolarWire code for this component"),
        })
      ).describe("Components to add"),
      categories: z.array(
        z.object({
          id: z.string().describe("Category unique ID"),
          name: z.string().describe("Category name"),
          parentId: z.string().nullable().default(null).describe("Parent category ID or null"),
          order: z.number().describe("Sort order"),
        })
      ).describe("Categories"),
      existingLibrary: z.string().optional().describe("Existing .swc file path for modification"),
      outputPath: z.string().optional().default("./output").describe("Output directory for .swc file"),
    },
    async ({ libraryName, libraryDescription, components, categories, existingLibrary, outputPath }) => {
      try {
        logger.info("Generating component library", { libraryName });

        let libraryData: any;

        if (existingLibrary) {
          // Load existing library
          const existingPath = path.resolve(existingLibrary);
          if (!fs.existsSync(existingPath)) {
            return {
              content: [{ type: "text", text: `Error: Existing library file not found: ${existingPath}` }],
              isError: true,
            };
          }
          libraryData = JSON.parse(fs.readFileSync(existingPath, "utf-8"));
          // Merge new components
          libraryData.metadata.updatedAt = new Date().toISOString();
          libraryData.categories = [...(libraryData.categories || []), ...categories];
          libraryData.components = [...(libraryData.components || []), ...components];
        } else {
          // Create new library
          const outputDir = path.resolve(outputPath);
          if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
          }

          libraryData = {
            $schema: "solarwire-component-library-v1",
            metadata: {
              id: crypto.randomUUID(),
              name: libraryName,
              description: libraryDescription || "",
              version: "1.0.0",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            categories,
            components,
          };

          // Save .swc file
          const outputFile = path.join(outputDir, `${libraryName.toLowerCase().replace(/\s+/g, "-")}.swc`);
          fs.writeFileSync(outputFile, JSON.stringify(libraryData, null, 2), "utf-8");
          logger.info(`Component library saved to: ${outputFile}`);
        }

        const result = {
          success: true,
          message: existingLibrary ? "Component library updated successfully" : "Component library generated successfully",
          library: {
            name: libraryData.metadata.name,
            version: libraryData.metadata.version,
            categoryCount: libraryData.categories.length,
            componentCount: libraryData.components.length,
            file: existingLibrary || undefined,
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
        logger.error("Component library generation failed", { error });
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
