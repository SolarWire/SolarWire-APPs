import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('SolarWire Parser Engine', () => {
  let parse: (code: string) => any;

  beforeAll(async () => {
    const parserPath = path.join(__dirname, '../../src/engines/solarwire-parser/index.js');
    const module = await import(parserPath);
    parse = module.parse;
  });

  test('should parse basic rectangle element', () => {
    const code = '["按钮"] @(100,50) w=120 h=40 bg=#3B82F6 c=#FFFFFF';
    const ast = parse(code);
    
    expect(ast).toBeDefined();
    expect(ast.elements).toBeDefined();
    expect(ast.elements.length).toBe(1);
  });

  test('should parse text element', () => {
    const code = '"标题" @(100,50) size=24 bold';
    const ast = parse(code);
    
    expect(ast.elements.length).toBe(1);
  });

  test('should fail on invalid syntax', () => {
    const code = 'invalid code without proper syntax';
    
    expect(() => parse(code)).toThrow();
  });
});
