#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const TEMP_FILE = '.testcases-temp.ndjson';

function parseArgs() {
  const args = { command: '', params: {} };
  const argv = process.argv.slice(2);

  if (argv.length === 0) {
    return args;
  }

  args.command = argv[0];

  for (let i = 1; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      const key = argv[i].substring(2);
      if (i + 1 < argv.length && !argv[i + 1].startsWith('--')) {
        args.params[key] = argv[i + 1];
        i++;
      } else {
        args.params[key] = true;
      }
    }
  }

  return args;
}

function getTempFilePath(dir) {
  return path.join(dir, TEMP_FILE);
}

function appendToTemp(dir, data) {
  const tempFile = getTempFilePath(dir);
  const lines = data.map(tc => JSON.stringify(tc)).join('\n') + '\n';
  fs.appendFileSync(tempFile, lines, 'utf-8');
}

function readTestCases(dir) {
  const tempFile = getTempFilePath(dir);

  if (!fs.existsSync(tempFile)) {
    return [];
  }

  const content = fs.readFileSync(tempFile, 'utf-8');
  const lines = content.trim().split('\n').filter(line => line.trim());

  return lines.map(line => {
    try {
      return JSON.parse(line);
    } catch (e) {
      return null;
    }
  }).filter(tc => tc !== null);
}

function parseMarkdownTable(mdContent) {
  const lines = mdContent.split('\n');
  const testCases = [];
  let currentModule = '';
  let inTable = false;
  let headers = [];

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('### ') && !trimmed.startsWith('####')) {
      currentModule = trimmed.replace(/^###\s+/, '');
      continue;
    }

    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      const cells = trimmed.split('|').slice(1, -1).map(c => c.trim());

      if (cells.every(c => /^[-:]+$/.test(c))) {
        inTable = true;
        continue;
      }

      if (!inTable) {
        headers = cells;
        inTable = true;
        continue;
      }

      const tc = {};
      headers.forEach((h, i) => {
        tc[h.toLowerCase().replace(/\s+/g, '_')] = cells[i] || '';
      });

      if (tc.id || tc.name) {
        if (!tc.module && currentModule) {
          tc.module = currentModule;
        }
        testCases.push(tc);
      }
    } else if (trimmed && !trimmed.startsWith('|')) {
      inTable = false;
    }
  }

  return testCases;
}

function groupByModule(testCases) {
  const modules = new Map();

  for (const tc of testCases) {
    const module = tc.module || 'Unknown';
    if (!modules.has(module)) {
      modules.set(module, []);
    }
    modules.get(module).push(tc);
  }

  return modules;
}

function calculateStats(testCases, modules) {
  const stats = {
    total: testCases.length,
    p0: testCases.filter(tc => tc.priority === 'P0').length,
    p1: testCases.filter(tc => tc.priority === 'P1').length,
    p2: testCases.filter(tc => tc.priority === 'P2').length,
    byType: {},
    byModule: {}
  };

  for (const tc of testCases) {
    const type = tc.type || 'Unknown';
    stats.byType[type] = (stats.byType[type] || 0) + 1;
  }

  for (const [module, cases] of modules) {
    stats.byModule[module] = cases.length;
  }

  return stats;
}

async function createWorkbook() {
  const ExcelJS = require('exceljs');
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'SolarWire Test Case Generator';
  workbook.created = new Date();
  return workbook;
}

const COLUMNS = [
  { header: 'ID', key: 'id', width: 10 },
  { header: 'Module', key: 'module', width: 18 },
  { header: 'Name', key: 'name', width: 40 },
  { header: 'Type', key: 'type', width: 15 },
  { header: 'Precondition', key: 'precondition', width: 45 },
  { header: 'Steps', key: 'steps', width: 60 },
  { header: 'Test Data', key: 'test_data', width: 25 },
  { header: 'Expected Result', key: 'expected', width: 50 },
  { header: 'Priority', key: 'priority', width: 10 },
  { header: 'Related', key: 'related', width: 12 },
  { header: 'Boundary', key: 'boundary', width: 25 },
  { header: 'Exception', key: 'exception', width: 25 },
  { header: 'Remark', key: 'remark', width: 20 }
];

const TC_KEYS = ['id', 'module', 'name', 'type', 'precondition', 'steps', 'test_data', 'expected', 'priority', 'related', 'boundary', 'exception', 'remark'];

function styleHeaderRow(sheet, rowNumber) {
  const row = sheet.getRow(rowNumber);
  row.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  row.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1890FF' }
  };
  row.alignment = { vertical: 'middle', horizontal: 'center' };
}

function addDataRow(sheet, tc) {
  const values = TC_KEYS.map(key => {
    const val = tc[key] || tc[key.replace(/_/g, ' ')] || '';
    return val;
  });
  sheet.addRow(values);
}

async function createSummarySheet(workbook, testCases) {
  const sheet = workbook.addWorksheet('Test Cases');

  sheet.columns = COLUMNS;

  styleHeaderRow(sheet, 1);

  for (const col of sheet.columns) {
    col.alignment = { vertical: 'top', wrapText: true };
  }

  for (const tc of testCases) {
    addDataRow(sheet, tc);
  }

  for (let i = 2; i <= testCases.length + 1; i++) {
    const row = sheet.getRow(i);
    const priority = row.getCell(9).value;
    if (priority === 'P0') {
      row.getCell(9).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE0E0' } };
    } else if (priority === 'P1') {
      row.getCell(9).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF3E0' } };
    }
  }
}

async function createModuleSheet(workbook, modules) {
  const sheet = workbook.addWorksheet('By Module');

  sheet.columns = COLUMNS;

  for (const col of sheet.columns) {
    col.alignment = { vertical: 'top', wrapText: true };
  }

  for (const [module, cases] of modules) {
    const moduleHeaderRow = sheet.addRow([module, '', '', '', '', '', '', '', '', '', '', '', '']);
    moduleHeaderRow.font = { bold: true, size: 13 };
    sheet.mergeCells(`A${moduleHeaderRow.number}:M${moduleHeaderRow.number}`);
    moduleHeaderRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    const colHeaderRow = sheet.addRow(COLUMNS.map(c => c.header));
    colHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    colHeaderRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1890FF' }
    };

    for (const tc of cases) {
      addDataRow(sheet, tc);
    }

    sheet.addRow([]);
  }
}

async function createStatsSheet(workbook, stats) {
  const sheet = workbook.addWorksheet('Statistics');

  sheet.columns = [
    { header: 'Item', key: 'item', width: 25 },
    { header: 'Count', key: 'count', width: 15 }
  ];

  styleHeaderRow(sheet, 1);

  sheet.addRow(['Total', stats.total]);
  sheet.addRow(['P0', stats.p0]);
  sheet.addRow(['P1', stats.p1]);
  sheet.addRow(['P2', stats.p2]);
  sheet.addRow([]);
  sheet.addRow(['By Type', '']);
  for (const [type, count] of Object.entries(stats.byType)) {
    sheet.addRow([type, count]);
  }
  sheet.addRow([]);
  sheet.addRow(['By Module', '']);
  for (const [module, count] of Object.entries(stats.byModule)) {
    sheet.addRow([module, count]);
  }
}

async function commandCreate(params) {
  if (!params.output) {
    console.error('Error: --output parameter required');
    process.exit(1);
  }

  const dir = path.dirname(params.output);
  const tempFile = getTempFilePath(dir);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (fs.existsSync(tempFile)) {
    fs.unlinkSync(tempFile);
  }

  console.log(`Ready: ${tempFile}`);
}

async function commandAppendBatch(params) {
  if (!params.file) {
    console.error('Error: --file parameter required');
    process.exit(1);
  }

  if (!params.data && !params['json-file']) {
    console.error('Error: --data or --json-file parameter required');
    process.exit(1);
  }

  const dir = path.dirname(params.file);

  let testCases;
  try {
    let jsonStr;
    if (params['json-file']) {
      jsonStr = fs.readFileSync(params['json-file'], 'utf-8');
    } else {
      jsonStr = params.data;
    }
    testCases = JSON.parse(jsonStr);
    if (!Array.isArray(testCases)) {
      testCases = [testCases];
    }
  } catch (e) {
    console.error('Error: Invalid JSON data -', e.message);
    process.exit(1);
  }

  appendToTemp(dir, testCases);

  const currentCount = readTestCases(dir).length;
  console.log(`Appended ${testCases.length} test cases. Total: ${currentCount}`);
}

async function commandFinalize(params) {
  if (!params.file) {
    console.error('Error: --file parameter required');
    process.exit(1);
  }

  const dir = path.dirname(params.file);
  const testCases = readTestCases(dir);

  if (testCases.length === 0) {
    console.error('Error: No test cases found');
    process.exit(1);
  }

  console.log(`Generating Excel with ${testCases.length} test cases...`);

  const modules = groupByModule(testCases);
  const stats = calculateStats(testCases, modules);

  const workbook = await createWorkbook();
  await createSummarySheet(workbook, testCases);
  await createModuleSheet(workbook, modules);
  await createStatsSheet(workbook, stats);

  const outputDir = path.dirname(params.file);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  await workbook.xlsx.writeFile(params.file);

  const tempFile = getTempFilePath(dir);
  if (fs.existsSync(tempFile)) {
    fs.unlinkSync(tempFile);
  }

  console.log(`\nExcel generated: ${params.file}`);
  console.log(`Total: ${stats.total}, P0: ${stats.p0}, P1: ${stats.p1}, P2: ${stats.p2}`);
}

async function commandFromMd(params) {
  if (!params.input) {
    console.error('Error: --input parameter required (markdown file path)');
    process.exit(1);
  }
  if (!params.output) {
    console.error('Error: --output parameter required (xlsx file path)');
    process.exit(1);
  }

  const mdContent = fs.readFileSync(params.input, 'utf-8');
  const testCases = parseMarkdownTable(mdContent);

  if (testCases.length === 0) {
    console.error('Error: No test cases found in markdown file');
    process.exit(1);
  }

  console.log(`Parsed ${testCases.length} test cases from markdown`);

  const modules = groupByModule(testCases);
  const stats = calculateStats(testCases, modules);

  const workbook = await createWorkbook();
  await createSummarySheet(workbook, testCases);
  await createModuleSheet(workbook, modules);
  await createStatsSheet(workbook, stats);

  const outputDir = path.dirname(params.output);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  await workbook.xlsx.writeFile(params.output);

  console.log(`\nExcel generated: ${params.output}`);
  console.log(`Total: ${stats.total}, P0: ${stats.p0}, P1: ${stats.p1}, P2: ${stats.p2}`);
}

function printUsage() {
  console.log(`
Usage: node generate-excel.js <command> [options]

Commands:
  create              Initialize temp storage for batch mode
  append-batch        Append a batch of test cases (JSON)
  finalize            Generate final xlsx from temp storage
  from-md             Convert markdown test cases to xlsx

Options:
  create:
    --output <path>   Output xlsx file path

  append-batch:
    --file <path>     xlsx file path (to determine directory)
    --data <json>     JSON array of test cases
    --json-file <path> Read JSON from file (avoids shell quoting issues)

  finalize:
    --file <path>     xlsx file path to generate

  from-md:
    --input <path>    Input markdown file path
    --output <path>   Output xlsx file path

Examples:
  # Batch mode (for AI generation):
  node generate-excel.js create --output .solarwire/my-project/test-cases.xlsx
  node generate-excel.js append-batch --file .solarwire/my-project/test-cases.xlsx --data '[{"id":"TC-001","module":"Login Page","name":"Login Success","type":"Functional Test","precondition":"...","steps":"...","test_data":"...","expected":"...","priority":"P0"}]'
  node generate-excel.js finalize --file .solarwire/my-project/test-cases.xlsx

  # One-shot from markdown:
  node generate-excel.js from-md --input .solarwire/my-project/test-cases.md --output .solarwire/my-project/test-cases.xlsx
`);
}

async function main() {
  const { command, params } = parseArgs();

  switch (command) {
    case 'create':
      await commandCreate(params);
      break;
    case 'append-batch':
      await commandAppendBatch(params);
      break;
    case 'finalize':
      await commandFinalize(params);
      break;
    case 'from-md':
      await commandFromMd(params);
      break;
    default:
      printUsage();
      process.exit(command ? 1 : 0);
  }
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
