#!/usr/bin/env node

/**
 * SolarWire Syntax Validator
 * 
 * Validates SolarWire code by parsing and rendering it.
 * References shared parser and renderer from ../shared/ directory.
 * 
 * Usage:
 *   node validate.js <path-to-solarwire-code-file>
 *   node validate.js --code "['Button'] @(100,50) w=120 h=40"
 *   node validate.js --stdin
 * 
 * Exit codes:
 *   0 - Validation passed (code is valid)
 *   1 - Validation failed (code has errors)
 *   2 - Invalid arguments or file not found
 */

const fs = require('fs');
const path = require('path');

let parse, render;

try {
  const sharedDir = path.join(__dirname, '..', 'shared');
  const parserPath = path.join(sharedDir, 'parser', 'index.js');
  const rendererPath = path.join(sharedDir, 'renderer-svg', 'index.js');
  
  if (!fs.existsSync(parserPath)) {
    throw new Error(`Parser not found at: ${parserPath}`);
  }
  if (!fs.existsSync(rendererPath)) {
    throw new Error(`Renderer not found at: ${rendererPath}`);
  }
  
  parse = require(parserPath).parse;
  render = require(rendererPath).render;
} catch (e) {
  console.error('Error loading SolarWire shared packages:', e.message);
  console.error('');
  console.error('Please ensure the shared/ directory contains:');
  console.error('  - shared/parser/        (from @solarwire/parser dist)');
  console.error('  - shared/renderer-svg/  (from @solarwire/renderer-svg dist)');
  process.exit(2);
}

function validateCode(code, options = {}) {
  const { generateSvg = false, outputDir = '.' } = options;
  const result = {
    valid: false,
    errors: [],
    warnings: [],
    svg: null
  };

  try {
    const ast = parse(code);
    
    const svgWithNotes = render(ast, { disableNotes: false });
    result.svg = { withNotes: svgWithNotes };

    const svgWithoutNotes = render(ast, { disableNotes: true });
    result.svg.withoutNotes = svgWithoutNotes;

    result.valid = true;

    if (generateSvg && outputDir) {
      const pageTitle = extractPageTitle(code);
      const safeName = pageTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const baseName = `${safeName || 'untitled'}`;
      
      const withNotesPath = path.join(outputDir, `${baseName}-with-notes.svg`);
      fs.writeFileSync(withNotesPath, svgWithNotes);
      
      const withoutNotesPath = path.join(outputDir, `${baseName}-without-notes.svg`);
      fs.writeFileSync(withoutNotesPath, svgWithoutNotes);
      
      result.svgFiles = {
        withNotes: withNotesPath,
        withoutNotes: withoutNotesPath
      };
    }

  } catch (e) {
    result.valid = false;
    result.errors.push({
      message: e.message,
      location: e.location || null
    });
  }

  return result;
}

function extractPageTitle(code) {
  const titleMatch = code.match(/!title="([^"]+)"/);
  return titleMatch ? titleMatch[1] : 'untitled';
}

function formatValidationResult(result, code) {
  const separator = '═'.repeat(60);
  
  if (result.valid) {
    console.log(separator);
    console.log('✓ VALIDATION PASSED');
    console.log(separator);
    console.log('');
    console.log('The SolarWire code is valid and can be rendered successfully.');
    console.log('');
    
    if (result.svgFiles) {
      console.log('SVG files generated:');
      console.log(`  - ${result.svgFiles.withNotes}`);
      console.log(`  - ${result.svgFiles.withoutNotes}`);
      console.log('');
    }
    
    return true;
  } else {
    console.log(separator);
    console.log('✗ VALIDATION FAILED');
    console.log(separator);
    console.log('');
    console.log('The SolarWire code contains errors:');
    console.log('');
    
    result.errors.forEach((error, index) => {
      console.log(`Error ${index + 1}:`);
      console.log(error.message);
      console.log('');
    });
    
    console.log(separator);
    console.log('');
    console.log('Code being validated:');
    console.log('─'.repeat(60));
    
    const lines = code.split('\n');
    lines.forEach((line, index) => {
      const lineNum = (index + 1).toString().padStart(4, ' ');
      console.log(`  ${lineNum} | ${line}`);
    });
    
    console.log('─'.repeat(60));
    console.log('');
    
    return false;
  }
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('SolarWire Syntax Validator');
    console.log('');
    console.log('Usage:');
    console.log('  node validate.js <path-to-solarwire-code-file>');
    console.log('  node validate.js --code "[\'Button\'] @(100,50) w=120 h=40"');
    console.log('  node validate.js --stdin');
    console.log('');
    console.log('Options:');
    console.log('  --code <code>    Validate inline SolarWire code');
    console.log('  --stdin          Read code from stdin');
    console.log('  --output <dir>   Output directory for SVG files');
    console.log('  --no-svg         Disable SVG file generation');
    console.log('');
    console.log('Exit codes:');
    console.log('  0 - Validation passed');
    console.log('  1 - Validation failed');
    console.log('  2 - Invalid arguments');
    console.log('');
    process.exit(0);
  }
  
  let code = null;
  let outputDir = '.';
  let generateSvg = true;
  
  let i = 0;
  while (i < args.length) {
    const arg = args[i];
    
    if (arg === '--code') {
      i++;
      code = args[i];
    } else if (arg === '--stdin') {
      const readline = require('readline');
      const rl = readline.createInterface({ input: process.stdin });
      const lines = [];
      
      rl.on('line', (line) => lines.push(line));
      rl.on('close', () => {
        code = lines.join('\n');
        runValidation(code, generateSvg, outputDir);
      });
      return;
    } else if (arg === '--output') {
      i++;
      outputDir = args[i];
    } else if (arg === '--no-svg') {
      generateSvg = false;
    } else if (arg.startsWith('-')) {
      console.error(`Unknown option: ${arg}`);
      process.exit(2);
    } else if (!code) {
      const filePath = path.resolve(arg);
      
      if (!fs.existsSync(filePath)) {
        console.error(`Error: File not found: ${filePath}`);
        process.exit(2);
      }
      
      code = fs.readFileSync(filePath, 'utf-8');
    }
    
    i++;
  }
  
  if (!code) {
    console.error('Error: No code provided');
    process.exit(2);
  }
  
  runValidation(code, generateSvg, outputDir);
}

function runValidation(code, generateSvg, outputDir) {
  const result = validateCode(code, { generateSvg, outputDir });
  const isValid = formatValidationResult(result, code);
  
  process.exit(isValid ? 0 : 1);
}

module.exports = { validateCode };

if (require.main === module) {
  main();
}