import type { Document } from './types';

export declare function parse(input: string, options?: { startRule?: string }): Document;
export declare const StartRules: string[];
export declare class SyntaxError extends Error {
  location: { start: { line: number; column: number; offset: number }; end: { line: number; column: number; offset: number } };
  expected: any[];
  found: string | null;
}
