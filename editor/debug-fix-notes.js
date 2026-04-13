// 测试 fix notes 函数的问题
const testContent = `["Test"] note="Hello"`;
console.log('Input:', JSON.stringify(testContent));

function convertDoubleQuoteNotesToTriple(content) {
  const lines = content.split(/\r?\n/);
  const result = [];
  
  for (const line of lines) {
    let newLine = '';
    let pos = 0;
    
    console.log('\nProcessing line:', JSON.stringify(line));
    
    while (true) {
      const noteIndex = line.indexOf('note=', pos);
      if (noteIndex === -1) {
        newLine += line.substring(pos);
        break;
      }
      
      newLine += line.substring(pos, noteIndex);
      console.log('  Added before:', JSON.stringify(newLine));
      
      const afterNote = noteIndex + 5;
      if (afterNote >= line.length) {
        newLine += 'note=';
        break;
      }
      
      console.log('  afterNote:', afterNote, 'char:', JSON.stringify(line[afterNote]));
      
      if (afterNote + 2 < line.length && 
          line[afterNote] === '"' && 
          line[afterNote + 1] === '"' && 
          line[afterNote + 2] === '"') {
        newLine += 'note="""';
        pos = afterNote + 3;
        continue;
      }
      
      if (line[afterNote] === '"') {
        console.log('  Found double quote, converting...');
        newLine += 'note="""';
        
        const valueStart = afterNote + 1;
        let valueEnd = -1;
        for (let i = valueStart; i < line.length; i++) {
          if (line[i] === '"') {
            valueEnd = i;
            break;
          }
        }
        
        console.log('  valueStart:', valueStart, 'valueEnd:', valueEnd);
        
        if (valueEnd === -1) {
          newLine += line.substring(valueStart);
          break;
        }
        
        const noteValue = line.substring(valueStart, valueEnd);
        console.log('  noteValue:', JSON.stringify(noteValue));
        
        newLine += noteValue;
        newLine += '"""';
        
        console.log('  newLine so far:', JSON.stringify(newLine));
        
        pos = valueEnd + 1;
        continue;
      }
      
      newLine += 'note=';
      pos = afterNote;
    }
    
    result.push(newLine);
  }
  
  return result.join('\n');
}

const result = convertDoubleQuoteNotesToTriple(testContent);
console.log('\nFinal result:', JSON.stringify(result));
console.log('Expected:     ["Test"] note="""Hello"""');