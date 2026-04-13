// 手动测试脚本
function hasDoubleQuoteNotes(content) {
  const lines = content.split(/\r?\n/);
  for (const line of lines) {
    console.log('Checking line:', JSON.stringify(line));
    console.log('  line.includes("note=\""):', line.includes('note="'));
    console.log('  line.includes("note=\"\"\""):', line.includes('note="""'));
    if (line.includes('note="') && !line.includes('note="""')) {
      console.log('  ✅ Found double quote note!');
      return true;
    }
  }
  console.log('  ❌ No double quote notes found');
  return false;
}

function convertDoubleQuoteNotesToTriple(content) {
  console.log('\n=== convertDoubleQuoteNotesToTriple ===');
  console.log('Input:', JSON.stringify(content));
  
  const lines = content.split(/\r?\n/);
  const result = [];
  let i = 0;
  
  while (i < lines.length) {
    let line = lines[i];
    console.log(`\nProcessing line ${i + 1}:`, JSON.stringify(line));
    
    let modifiedLine = line;
    let hasMatch = false;
    
    const noteDoubleQuoteRegex = /note="(?!"")([^"]*)"/g;
    let match;
    
    const matches = [];
    while ((match = noteDoubleQuoteRegex.exec(line)) !== null) {
      console.log('  Match found at:', match.index, 'value:', JSON.stringify(match[1]));
      matches.push({
        start: match.index,
        end: match.index + match[0].length,
        value: match[1]
      });
    }
    
    console.log('  Matches found:', matches.length);
    
    for (let j = matches.length - 1; j >= 0; j--) {
      const m = matches[j];
      console.log(`  Replacing at ${m.start}-${m.end}:`, JSON.stringify(m.value));
      modifiedLine = modifiedLine.substring(0, m.start) + 
                     `note="""${m.value}"""` + 
                     modifiedLine.substring(m.end);
      hasMatch = true;
    }
    
    console.log('  Modified line:', JSON.stringify(modifiedLine));
    result.push(modifiedLine);
    i++;
  }
  
  const finalResult = result.join('\n');
  console.log('\nFinal result:', JSON.stringify(finalResult));
  return finalResult;
}

// 测试用例
console.log('========================================');
console.log('TEST 1: Basic double quote note');
console.log('========================================');
const test1 = '["Test"] note="Hello"';
console.log('hasDoubleQuoteNotes:', hasDoubleQuoteNotes(test1));
const result1 = convertDoubleQuoteNotesToTriple(test1);
const expected1 = '["Test"] note="""Hello"""';
console.log('Result:', result1 === expected1 ? '✅ PASS' : '❌ FAIL');

console.log('\n========================================');
console.log('TEST 2: Note with other attributes');
console.log('========================================');
const test2 = '["Test"] note="Hello" w=100 c=red';
console.log('hasDoubleQuoteNotes:', hasDoubleQuoteNotes(test2));
const result2 = convertDoubleQuoteNotesToTriple(test2);
const expected2 = '["Test"] note="""Hello""" w=100 c=red';
console.log('Result:', result2 === expected2 ? '✅ PASS' : '❌ FAIL');

console.log('\n========================================');
console.log('TEST 3: Triple quote note (should not change)');
console.log('========================================');
const test3 = '["Test"] note="""Hello"""';
console.log('hasDoubleQuoteNotes:', hasDoubleQuoteNotes(test3));
const result3 = convertDoubleQuoteNotesToTriple(test3);
console.log('Result:', result3 === test3 ? '✅ PASS' : '❌ FAIL');

console.log('\n========================================');
console.log('TEST 4: Mixed notes');
console.log('========================================');
const test4 = '["Test1"] note="""Hello"""\n["Test2"] note="World"';
console.log('hasDoubleQuoteNotes:', hasDoubleQuoteNotes(test4));
const result4 = convertDoubleQuoteNotesToTriple(test4);
const expected4 = '["Test1"] note="""Hello"""\n["Test2"] note="""World"""';
console.log('Result:', result4 === expected4 ? '✅ PASS' : '❌ FAIL');