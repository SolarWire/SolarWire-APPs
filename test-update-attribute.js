import { updateLineAttribute } from './editor/src/shared/utils/solarwire-utils';

console.log('测试 updateLineAttribute 函数\n');

// 测试 1: ["已有文本"] -> ["新文本"]
const test1 = `["旧文本"] @(100, 200) w=100 h=50`;
const result1 = updateLineAttribute(test1, 1, 'text', '新内容');
console.log('测试 1 - ["已有文本"] -> ["新文本"]');
console.log('输入:', test1);
console.log('输出:', result1);
console.log('期望: ["新内容"] @(100, 200) w=100 h=50');
console.log('通过:', result1 === `["新内容"] @(100, 200) w=100 h=50` ? '✓' : '✗');
console.log();

// 测试 2: [""] -> ["新文本"]
const test2 = `[""] @(100, 200) w=100 h=50`;
const result2 = updateLineAttribute(test2, 1, 'text', '新内容');
console.log('测试 2 - [""] -> ["新文本"]');
console.log('输入:', test2);
console.log('输出:', result2);
console.log('期望: ["新内容"] @(100, 200) w=100 h=50');
console.log('通过:', result2 === `["新内容"] @(100, 200) w=100 h=50` ? '✓' : '✗');
console.log();

// 测试 3: [] -> ["新文本"]
const test3 = `[] @(100, 200) w=100 h=50`;
const result3 = updateLineAttribute(test3, 1, 'text', '新内容');
console.log('测试 3 - [] -> ["新文本"]');
console.log('输入:', test3);
console.log('输出:', result3);
console.log('期望: ["新内容"] @(100, 200) w=100 h=50');
console.log('通过:', result3 === `["新内容"] @(100, 200) w=100 h=50` ? '✓' : '✗');
console.log();

// 测试 4: () -> ("新文本")
const test4 = `() @(100, 200) w=100 h=50`;
const result4 = updateLineAttribute(test4, 1, 'text', '新内容');
console.log('测试 4 - () -> ("新文本")');
console.log('输入:', test4);
console.log('输出:', result4);
console.log('期望: ("新内容") @(100, 200) w=100 h=50');
console.log('通过:', result4 === `("新内容") @(100, 200) w=100 h=50` ? '✓' : '✗');
console.log();

// 测试 5: (()) -> (("新文本"))
const test5 = `(()) @(100, 200) w=100 h=50`;
const result5 = updateLineAttribute(test5, 1, 'text', '新内容');
console.log('测试 5 - (()) -> (("新文本"))');
console.log('输入:', test5);
console.log('输出:', result5);
console.log('期望: (("新内容")) @(100, 200) w=100 h=50');
console.log('通过:', result5 === `(("新内容")) @(100, 200) w=100 h=50` ? '✓' : '✗');
console.log();

// 测试 6: [?] -> [?"新文本"]
const test6 = `[?] @(100, 200)`;
const result6 = updateLineAttribute(test6, 1, 'text', '新内容');
console.log('测试 6 - [?] -> [?"新文本"]');
console.log('输入:', test6);
console.log('输出:', result6);
console.log('期望: [?"新内容"] @(100, 200)');
console.log('通过:', result6 === `[?"新内容"] @(100, 200)` ? '✓' : '✗');
console.log();

// 测试 7: "已有文本" -> "新文本"
const test7 = `"旧文本" @(100, 200)`;
const result7 = updateLineAttribute(test7, 1, 'text', '新内容');
console.log('测试 7 - "已有文本" -> "新文本"');
console.log('输入:', test7);
console.log('输出:', result7);
console.log('期望: "新内容" @(100, 200)');
console.log('通过:', result7 === `"新内容" @(100, 200)` ? '✓' : '✗');
