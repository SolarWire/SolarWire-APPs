const { hasDoubleQuoteNotes, convertDoubleQuoteNotesToTriple } = require('./dist/renderer/utils/solarwire-utils');

// 测试用例
const testCases = [
  {
    name: '单个双引号 note',
    input: '["Test"] note="Hello"',
    expectedOutput: '["Test"] note="""Hello"""'
  },
  {
    name: '多个双引号 note',
    input: '["Test1"] note="Hello"\n["Test2"] note="World"',
    expectedOutput: '["Test1"] note="""Hello"""\n["Test2"] note="""World"""'
  },
  {
    name: '混合有三引号和双引号的 note',
    input: '["Test1"] note="""Hello"""\n["Test2"] note="World"',
    expectedOutput: '["Test1"] note="""Hello"""\n["Test2"] note="""World"""'
  },
  {
    name: '没有 note 的情况',
    input: '["Test"]',
    expectedOutput: '["Test"]'
  },
  {
    name: '带空格的 note',
    input: '["Test"]   note="Hello World"',
    expectedOutput: '["Test"]   note="""Hello World"""'
  }
];

console.log('Testing fix notes functionality...\n');

let passed = 0;
let failed = 0;

testCases.forEach((testCase, index) => {
  console.log(`Test ${index + 1}: ${testCase.name}`);
  
  try {
    // 测试检测功能
    const hasOldNotes = hasDoubleQuoteNotes(testCase.input);
    console.log(`  hasDoubleQuoteNotes: ${hasOldNotes}`);
    
    // 测试转换功能
    const output = convertDoubleQuoteNotesToTriple(testCase.input);
    console.log(`  Input:  ${JSON.stringify(testCase.input)}`);
    console.log(`  Output: ${JSON.stringify(output)}`);
    console.log(`  Expected: ${JSON.stringify(testCase.expectedOutput)}`);
    
    if (output === testCase.expectedOutput) {
      console.log('  ✅ PASSED\n');
      passed++;
    } else {
      console.log('  ❌ FAILED - Output does not match expected\n');
      failed++;
    }
  } catch (error) {
    console.log(`  ❌ ERROR: ${error}\n`);
    failed++;
  }
});

console.log('\n=== Summary ===');
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Total: ${testCases.length}`);