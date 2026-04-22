// 验证脚本：测试所有组件的 SolarWire 代码能否正确解析和渲染
const fs = require('fs');
const path = require('path');

// 导入解析器和渲染器
const { parse } = require('./parser');
const { render } = require('./renderer');

// 读取组件库文件
const componentLibraryPath = path.join(__dirname, 'components/presets/ant-design.swc.json');
const library = JSON.parse(fs.readFileSync(componentLibraryPath, 'utf8'));

console.log('='.repeat(60));
console.log(`验证组件库: ${library.metadata.name}`);
console.log(`版本: ${library.metadata.version}`);
console.log(`组件数量: ${library.components.length}`);
console.log('='.repeat(60));

let successCount = 0;
let failureCount = 0;
const errors = [];

// 逐个测试组件
library.components.forEach((component, index) => {
  console.log(`\n[${index + 1}/${library.components.length}] 测试: ${component.name} (${component.id})`);
  
  // 测试解析
  try {
    const ast = parse(component.code);
    console.log(`  ✓ 解析成功: ${ast.elements.length} 个元素`);
    
    // 测试渲染
    try {
      const svg = render(ast, { disableNotes: true });
      console.log(`  ✓ 渲染成功: SVG 长度 ${svg.length} 字符`);
      successCount++;
    } catch (renderError) {
      console.log(`  ✗ 渲染失败: ${renderError.message.split('\n')[0]}`);
      failureCount++;
      errors.push({
        component: component.name,
        id: component.id,
        type: 'render',
        error: renderError.message
      });
    }
  } catch (parseError) {
    console.log(`  ✗ 解析失败: ${parseError.message.split('\n')[0]}`);
    failureCount++;
    errors.push({
      component: component.name,
      id: component.id,
      type: 'parse',
      error: parseError.message
    });
  }
});

// 输出总结
console.log('\n' + '='.repeat(60));
console.log('验证结果汇总');
console.log('='.repeat(60));
console.log(`总计: ${library.components.length} 个组件`);
console.log(`成功: ${successCount} 个`);
console.log(`失败: ${failureCount} 个`);

if (errors.length > 0) {
  console.log('\n错误详情:');
  errors.forEach((err, i) => {
    console.log(`\n${i + 1}. [${err.type.toUpperCase()}] ${err.name} (${err.id})`);
    console.log(`   ${err.error.split('\n')[0]}`);
  });
}

// 导出错误列表供修复脚本使用
module.exports = { errors, successCount, failureCount };
