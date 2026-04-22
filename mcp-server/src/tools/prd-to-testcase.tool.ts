import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import fs from "fs";
import path from "path";
import ExcelJS from "exceljs";
import { logger } from "../middleware/logger.js";

interface TestCase {
  id: string;
  type: string;
  module: string;
  scenario: string;
  precondition: string;
  steps: string;
  expected: string;
  priority: string;
}

function parsePrdToTestCases(prdContent: string): TestCase[] {
  const testCases: TestCase[] = [];
  let caseCounter = 0;

  const addTestCase = (tc: Omit<TestCase, "id">) => {
    caseCounter++;
    testCases.push({
      ...tc,
      id: `TC-${String(caseCounter).padStart(3, "0")}`,
    });
  };

  // 1. Extract User Stories from table
  const userStoryRegex = /\| (US-\d+) \| (.+?) \| (.+?) \| (P\d+) \|/g;
  let match;
  while ((match = userStoryRegex.exec(prdContent)) !== null) {
    const [, id, story, criteria, priority] = match;
    addTestCase({
      type: "user_story",
      module: "User Story",
      scenario: `Verify: ${story.trim()}`,
      precondition: "User is logged in",
      steps: `1. Perform action: ${story.trim()}\n2. Verify outcome`,
      expected: criteria.trim(),
      priority,
    });
  }

  // 2. Extract Feature List
  const featureRegex = /\| [^|]+ \| (.+?) \| (P\d+) \| (.+?) \|/g;
  const featureSection = prdContent.match(/## 2\.1 Feature List([\s\S]*?)###/);
  if (featureSection) {
    let featureMatch;
    const tempRegex = /\| [^|]+ \| (.+?) \| (P\d+) \| (.+?) \|/g;
    while ((featureMatch = tempRegex.exec(featureSection[1])) !== null) {
      const [, feature, priority, desc] = featureMatch;
      if (feature.trim() !== "Feature" && feature.trim() !== "模块") {
        addTestCase({
          type: "feature",
          module: feature.trim(),
          scenario: `Verify feature: ${feature.trim()}`,
          precondition: "System is initialized",
          steps: `1. Navigate to ${feature.trim()}\n2. Verify functionality`,
          expected: desc.trim(),
          priority,
        });
      }
    }
  }

  // 3. Extract Page Details (SolarWire sections)
  const pageRegex = /### \d+\.\d+ ([^\n]+)[\s\S]*?```solarwire([\s\S]*?)```/g;
  let pageMatch;
  while ((pageMatch = pageRegex.exec(prdContent)) !== null) {
    const [, pageName] = pageMatch;
    addTestCase({
      type: "ui",
      module: "Page",
      scenario: `Verify ${pageName.trim()} renders correctly`,
      precondition: "User navigates to the page",
      steps: "1. Open the page\n2. Verify all elements are displayed\n3. Check layout and alignment",
      expected: "All UI elements render as specified in wireframe",
      priority: "P1",
    });
  }

  // 4. Extract Non-functional Requirements
  const nfrRegex = /- (.+?): (.+)/g;
  const nfrSection = prdContent.match(/## 6\. Non-functional Requirements([\s\S]*?)## 7/);
  if (nfrSection) {
    let nfrMatch;
    while ((nfrMatch = nfrRegex.exec(nfrSection[1])) !== null) {
      const [, req, value] = nfrMatch;
      addTestCase({
        type: "non_functional",
        module: req.trim(),
        scenario: `Verify ${req.trim()}: ${value.trim()}`,
        precondition: "System is running",
        steps: `1. Measure ${req.trim()}\n2. Compare against requirement`,
        expected: value.trim(),
        priority: "P2",
      });
    }
  }

  return testCases;
}

async function generateExcel(testCases: TestCase[], outputPath: string): Promise<string> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Test Cases");

  // Header
  worksheet.addRow(["ID", "Type", "Module", "Scenario", "Precondition", "Steps", "Expected Result", "Priority"]);

  // Style header
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF4472C4" },
  };
  worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };

  // Add data
  testCases.forEach((tc) => {
    worksheet.addRow([tc.id, tc.type, tc.module, tc.scenario, tc.precondition, tc.steps, tc.expected, tc.priority]);
  });

  // Auto-width columns
  worksheet.columns.forEach((col, i) => {
    let maxLength = 0;
    col.eachCell?.({ includeEmpty: true }, (cell) => {
      const length = cell.value ? String(cell.value).length : 10;
      if (length > maxLength) maxLength = length;
    });
    col.width = Math.min(Math.max(maxLength + 2, 15), 50);
  });

  // Write file
  if (!fs.existsSync(path.dirname(outputPath))) {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  }
  await workbook.xlsx.writeFile(outputPath);
  return outputPath;
}

export function registerPrdToTestcaseTool(server: McpServer) {
  server.tool(
    "prd-to-testcase",
    "Generate detailed test cases from PRD document. Parses user stories, features, UI pages, and non-functional requirements. Supports JSON and Excel output.",
    {
      prdContent: z.string().describe("PRD document content in markdown format"),
      outputFormat: z.enum(["json", "excel"]).default("json").describe("Output format"),
      outputPath: z.string().optional().default("./output").describe("Output directory for Excel file"),
    },
    async ({ prdContent, outputFormat, outputPath }) => {
      try {
        logger.info("Generating test cases from PRD");

        const testCases = parsePrdToTestCases(prdContent);

        if (outputFormat === "excel") {
          const excelFile = path.resolve(outputPath, "test-cases.xlsx");
          await generateExcel(testCases, excelFile);
          logger.info(`Excel file saved to: ${excelFile}`);

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  success: true,
                  message: `Generated ${testCases.length} test cases and saved to Excel`,
                  file: excelFile,
                  testCaseCount: testCases.length,
                }, null, 2),
              },
            ],
          };
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                message: `Generated ${testCases.length} test cases`,
                testCases,
              }, null, 2),
            },
          ],
        };
      } catch (error) {
        logger.error("Test case generation failed", { error });
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
