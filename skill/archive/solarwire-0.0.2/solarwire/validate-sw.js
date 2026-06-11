const { parse } = require('./lib/parser');
const fs = require('fs');
const path = require('path');

const filePath = process.argv[2];

if (!filePath) {
  console.error('Usage: node validate-sw.js <solarwire-file-or-dir>');
  process.exit(1);
}

function extractSolarWireBlocks(content) {
  const blocks = [];
  const regex = /```solarwire\n([\s\S]*?)```/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    blocks.push({
      content: match[1],
      startOffset: match.index,
      fullMatch: match[0]
    });
  }
  return blocks;
}

function validateBlock(block, source, blockIndex) {
  try {
    parse(block.content);
    const warnings = semanticCheck(block.content, source, blockIndex);
    if (warnings.length > 0) {
      return { valid: true, source, blockIndex, warnings };
    }
    return { valid: true, source, blockIndex };
  } catch (e) {
    return { valid: false, source, blockIndex, error: e.message };
  }
}

function semanticCheck(blockContent, source, blockIndex) {
  const warnings = [];
  const lines = blockContent.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith('"') && line.includes('bg=')) {
      warnings.push({
        line: i + 1,
        code: 'TEXT_BG',
        message: 'Text element should not have bg= attribute'
      });
    }

    const rectMatch = line.match(/^\["[^"]*"\]\s*@/);
    if (rectMatch && !line.includes('w=') && !line.startsWith('[') === false) {
      if (line.includes('note=') || line.includes('align=') || line.includes('vertical-align=')) {
        warnings.push({
          line: i + 1,
          code: 'RECT_SIZE',
          message: 'Rectangle with text content should have w= and h= attributes'
        });
      }
    }
  }

  return warnings;
}

function validateFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  
  if (ext === '.md' || ext === '.swc') {
    const content = fs.readFileSync(filePath, 'utf-8');
    const blocks = extractSolarWireBlocks(content);
    
    if (blocks.length === 0) {
      return [{ valid: true, source: filePath, blockIndex: 0, warning: 'No solarwire code blocks found' }];
    }
    
    return blocks.map((block, i) => validateBlock(block, filePath, i));
  } else if (ext === '.sw' || ext === '.solarwire') {
    const content = fs.readFileSync(filePath, 'utf-8');
    return [validateBlock({ content }, filePath, 0)];
  } else {
    return [{ valid: true, source: filePath, blockIndex: 0, warning: 'Unsupported file type, skipped' }];
  }
}

function processPath(targetPath) {
  const stat = fs.statSync(targetPath);
  
  if (stat.isFile()) {
    return validateFile(targetPath);
  } else if (stat.isDirectory()) {
    const results = [];
    const entries = fs.readdirSync(targetPath, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === 'archive' || entry.name === 'node_modules') continue;
      const fullPath = path.join(targetPath, entry.name);
      if (entry.isFile() && /\.(md|sw|solarwire|swc)$/.test(entry.name)) {
        results.push(...validateFile(fullPath));
      } else if (entry.isDirectory()) {
        results.push(...processPath(fullPath));
      }
    }
    return results;
  }
  
  return [];
}

const results = processPath(path.resolve(filePath));

let hasErrors = false;
let totalBlocks = 0;
let validBlocks = 0;

for (const result of results) {
  totalBlocks++;
  
  if (result.warning) {
    console.log(`⚠ ${result.source}: ${result.warning}`);
    validBlocks++;
    continue;
  }
  
  if (result.valid) {
    if (result.warnings && result.warnings.length > 0) {
      console.log(`⚠ ${result.source} (block ${result.blockIndex + 1}): OK with ${result.warnings.length} semantic warning(s)`);
      for (const w of result.warnings) {
        console.log(`  Line ${w.line} [${w.code}]: ${w.message}`);
      }
    } else {
      console.log(`✓ ${result.source} (block ${result.blockIndex + 1}): OK`);
    }
    validBlocks++;
  } else {
    hasErrors = true;
    console.error(`✗ ${result.source} (block ${result.blockIndex + 1}): PARSE ERROR`);
    console.error(result.error);
    console.error('');
  }
}

console.log('');
console.log(`Total: ${totalBlocks} blocks, ${validBlocks} valid, ${totalBlocks - validBlocks} errors`);

if (hasErrors) {
  process.exit(1);
}
