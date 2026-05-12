const fs = require('fs');
const path = require('path');

const inputFile = process.argv[2] || path.resolve(__dirname, '../swc-backup/组件库-ant-design.swc');
const rawContent = fs.readFileSync(inputFile, 'utf-8');
const content = rawContent.replace(/\r\n/g, '\n');
const lines = content.split('\n');

const CATEGORY_MAP = {
  'web-general': 'cat-web-general',
  'web-form': 'cat-web-form',
  'web-table': 'cat-web-table',
  'web-list': 'cat-web-list',
  'web-card': 'cat-web-card',
  'web-chart': 'cat-web-chart',
  'web-search': 'cat-web-search',
  'web-navigation': 'cat-web-navigation',
  'web-auth': 'cat-web-auth',
  'web-feedback': 'cat-web-feedback',
  'web-media': 'cat-web-media',
  'web-editor': 'cat-web-editor',
  'web-commerce': 'cat-web-commerce',
  'web-layout': 'cat-web-layout',
  'mobile-general': 'cat-mobile-general',
  'mobile-form': 'cat-mobile-form',
  'mobile-list': 'cat-mobile-list',
  'mobile-swipe': 'cat-mobile-swipe',
  'mobile-card': 'cat-mobile-card',
  'mobile-navigation': 'cat-mobile-navigation',
  'mobile-search': 'cat-mobile-search',
  'mobile-profile': 'cat-mobile-profile',
  'mobile-chat': 'cat-mobile-chat',
  'mobile-media': 'cat-mobile-media',
  'mobile-location': 'cat-mobile-location',
  'mobile-feedback': 'cat-mobile-feedback',
  'mobile-commerce': 'cat-mobile-commerce',
  'mobile-layout': 'cat-mobile-layout',
};

const CATEGORY_NAMES = {
  'cat-web-general': 'Web-通用',
  'cat-web-form': 'Web-表单',
  'cat-web-table': 'Web-表格',
  'cat-web-list': 'Web-列表',
  'cat-web-card': 'Web-卡片',
  'cat-web-chart': 'Web-图表',
  'cat-web-search': 'Web-搜索',
  'cat-web-navigation': 'Web-导航',
  'cat-web-auth': 'Web-认证',
  'cat-web-feedback': 'Web-反馈',
  'cat-web-media': 'Web-媒体',
  'cat-web-editor': 'Web-编辑器',
  'cat-web-commerce': 'Web-电商',
  'cat-web-layout': 'Web-布局',
  'cat-mobile-general': 'Mobile-通用',
  'cat-mobile-form': 'Mobile-表单',
  'cat-mobile-list': 'Mobile-列表',
  'cat-mobile-swipe': 'Mobile-滑动操作',
  'cat-mobile-card': 'Mobile-卡片',
  'cat-mobile-navigation': 'Mobile-导航',
  'cat-mobile-search': 'Mobile-搜索',
  'cat-mobile-profile': 'Mobile-个人中心',
  'cat-mobile-chat': 'Mobile-聊天',
  'cat-mobile-media': 'Mobile-媒体',
  'cat-mobile-location': 'Mobile-定位',
  'cat-mobile-feedback': 'Mobile-反馈',
  'cat-mobile-commerce': 'Mobile-电商',
  'cat-mobile-layout': 'Mobile-布局',
};

const AVATAR_CHARS = new Set(['张','李','王','赵','刘','陈','杨','黄','周','吴','徐','孙','马','朱','胡','郭','林','何','高','罗','郑','梁','谢','宋','唐']);
const CIRCLE_CHARS = new Set(['+','−','−','●','○','★','☆','▶','📍','🔍','🔔','📁','📄','📑','✓','✕','×','🎵','🔊','💬','🎁','🏠','📊','💰','🛒','📦','💳','🎯','❤️','👍','⭐','🔥','📱','💻','🖼️','🎨','⚙️','🔑','🛡️','📋','✅','❌','⚠️','ℹ️']);

let inCodeBlock = false;
let codeBlockLines = [];
let currentCategoryId = '';
let currentPlatform = '';
let addedTopLevelCats = new Set();
let output = [];
let componentCodeLines = [];
let collectingCode = false;

function extractAllCoords(text) {
  const coords = [];
  const arrowRe = /@\((\d+),\s*(\d+)\)->\((\d+),\s*(\d+)\)/g;
  let m;
  while ((m = arrowRe.exec(text)) !== null) {
    coords.push({ x: parseInt(m[1]), y: parseInt(m[2]) });
    coords.push({ x: parseInt(m[3]), y: parseInt(m[4]) });
  }
  const arrowPositions = new Set();
  let m2;
  while ((m2 = arrowRe.exec(text)) !== null) {
    arrowPositions.add(m2.index);
  }
  const simpleRe = /@\((\d+),\s*(\d+)\)/g;
  while ((m = simpleRe.exec(text)) !== null) {
    let isPartOfArrow = false;
    for (const pos of arrowPositions) {
      if (m.index >= pos && m.index < pos + 50) {
        isPartOfArrow = true;
        break;
      }
    }
    if (!isPartOfArrow) {
      coords.push({ x: parseInt(m[1]), y: parseInt(m[2]) });
    }
  }
  return coords;
}

function shiftCoordsInText(text, minX, minY) {
  if (minX === 0 && minY === 0) return text;
  
  let result = text;
  
  result = result.replace(/@\((\d+),\s*(\d+)\)->\((\d+),\s*(\d+)\)/g, (match, x1, y1, x2, y2) => {
    return `@(${parseInt(x1)-minX},${parseInt(y1)-minY})->(${parseInt(x2)-minX},${parseInt(y2)-minY})`;
  });
  
  result = result.replace(/@\((\d+),\s*(\d+)\)(?!->)/g, (match, x, y) => {
    return `@(${parseInt(x)-minX},${parseInt(y)-minY})`;
  });
  
  return result;
}

function isButtonContent(content) {
  const btnPatterns = [
    '按钮', '操作', '取消', '确认', '确定', '删除', '提交', '保存', '登录', '注册',
    '搜索', '重置', '下一步', '返回', '编辑', '查看', '下载', '上传', '添加', '创建',
    '立即购买', '加入购物车', '领取', '订阅', '获取验证码', '去付款', '主要操作', '次要操作',
    '立即注册', '返回首页', '展开', '收起', '更多', '筛选',
    '退货', '换货', '退款', '微信', 'QQ', '微博',
    '折线图', '柱状图', '饼图', '收藏',
    '推荐', '热门', '最新', '首页', '上一页', '下一页', '末页',
    '点击上传文件', '创建数据',
    '全部', '数据系列',
  ];
  if (btnPatterns.some(p => content.includes(p))) return true;
  if (/^[\d<>.…]+$/.test(content.trim())) return true;
  if (content === '✓' || content === '✕' || content === '×') return true;
  return false;
}

function isInputContent(content) {
  const inputPatterns = ['请输入', '请选择', '选择日期', '省/市/区', '开始日期', '结束日期',
    '2026-', '在此输入', '请输入关键词', '输入邮箱', '请输入真实姓名', '请输入身份证号',
    '请输入手机号', '请输入验证码', '请输入备注', '请输入内容', '请输入用户名', '请输入密码',
    '请设置密码', '请输入问题描述', '搜索关键词', '搜索'];
  return inputPatterns.some(p => content.includes(p));
}

function isTagContent(content) {
  const tagPatterns = ['标签', '热搜词', '历史关键词', '选项', '分类', '价格'];
  if (tagPatterns.some(p => content.includes(p))) return true;
  if (content.length <= 6 && !content.includes('按钮') && !content.includes('操作')) return true;
  return false;
}

function isAlertContent(content) {
  return content.includes('提示') || content.includes('成功') || content.includes('失败') || 
         content.includes('警告') || content.includes('确认删除') || content.includes('确认操作');
}

function needsCenterAlign(content, line) {
  if (isButtonContent(content)) return true;
  if (isAlertContent(content)) return true;
  if (isTagContent(content) && !isInputContent(content)) return true;
  if (content.includes('卡片') && content.length <= 4) return true;
  if (content === '页面内容区域') return true;
  if (/^(桌面端|平板端|移动端)/.test(content)) return true;
  return false;
}

function needsLeftAlign(content, line) {
  if (isInputContent(content)) return true;
  return false;
}

function fixCodeLine(line, isInTable, isTableCell) {
  let result = line;
  
  // Skip line elements (--) - they should not be processed as text
  if (result.trim().startsWith('-- @')) {
    return result;
  }
  
  // Fix syntax errors first
  // Fix mixed brackets: ("张"] -> ("张") - only for element brackets, not coordinate brackets
  result = result.replace(/\("([^"]{1,3})"\]/g, '("$1")');
  result = result.replace(/\["([^"]{1,3})"\)/g, '["$1"]');
  
  // Fix missing closing bracket: ["展开的详细内容区域" @( -> ["展开的详细内容区域"] @(
  result = result.replace(/\["([^"]+)"\s+@\(/g, '["$1"] @(');
  
  // Fix broken empty rect: ["] -> [""]
  result = result.replace(/\["\]/g, '[""]');
  
  // Fix bg=linear() - not supported, replace with first color
  result = result.replace(/bg=linear\([^)]+\)/g, (match) => {
    const colorMatch = match.match(/#([0-9a-fA-F]{6})/);
    return colorMatch ? `bg=#${colorMatch[1]}` : 'bg=#333333';
  });
  
  // Fix escaped quotes in text elements for code/JSON editors
  // \" inside text content -> replace with '
  // Handle patterns like: "  \"name\":" -> "  'name':"
  // Handle patterns like: "\"hello\"" -> "'hello'"
  // Handle patterns like: "\"张三\"" -> "'张三'"
  result = result.replace(/\\"/g, "'");
  
  // Fix boolean attributes
  result = result.replace(/\s+bold=true(?=\s|$)/g, ' bold');
  result = result.replace(/\s+italic=true(?=\s|$)/g, ' italic');
  
  // Remove r=0
  result = result.replace(/\s+r=0(?=\s|$)/g, '');
  
  // Convert to Circle syntax for avatars and circular elements
  // Pattern: ["X"] where X is a single avatar char or circular icon char
  result = result.replace(/\["([^"]{1,2})"\]/g, (match, content) => {
    if (AVATAR_CHARS.has(content)) return `("${content}")`;
    if (CIRCLE_CHARS.has(content)) return `("${content}")`;
    if (/^[+−\-]$/.test(content)) return `("${content}")`;
    if (content === '(v)' || content === '( )' || content === '(>)') return `("${content}")`;
    return match;
  });
  
  // Table cell fixes
  if (isTableCell) {
    // Convert "text" to ["text"] in cells
    result = result.replace(/^(\s*)"([^"]+)"(\s*)$/g, (match, pre, text, post) => {
      return `${pre}["${text}"]${post}`;
    });
    // Remove @(x,y), w, h from cells
    result = result.replace(/\s*@\(\d+,\s*\d+\)/g, '');
    result = result.replace(/\s+w=\d+/g, '');
    result = result.replace(/\s+h=\d+/g, '');
    // Remove note from rows
    result = result.replace(/\s*note="[^"]*"/g, '');
    return result;
  }
  
  // Fix specific table header issues
  // "年龄 ^" @(75, 0) c=#1890ff -> ["年龄 ^"] c=#1890ff
  result = result.replace(/"([^"]+\s[\^v])"\s*@\(\d+,\s*\d+\)\s*/g, '["$1"] ');
  // "状态 v" @(75, 0) c=#666666 size=11 -> ["状态 v"] c=#666666 size=11
  result = result.replace(/"([^"]+\s[v^])"\s*@\(\d+,\s*\d+\)\s*/g, '["$1"] ');
  
  // Fix (v) checkbox in table: "(v)" @(15, 5) w=16 h=16 bg=#1890ff c=#ffffff size=10 -> ("(v)")
  result = result.replace(/"\(v\)"\s*@\(\d+,\s*\d+\)\s*w=\d+\s*h=\d+\s*bg=[^\s]+\s*c=[^\s]+\s*size=\d+/g, '("(v)")');
  result = result.replace(/"\( \)"\s*@\(\d+,\s*\d+\)\s*w=\d+\s*h=\d+\s*bg=[^\s]+\s*c=[^\s]+\s*size=\d+/g, '("( )")');
  result = result.replace(/"\(>\)"\s*@\(\d+,\s*\d+\)\s*w=\d+\s*h=\d+\s*bg=[^\s]+\s*c=[^\s]+\s*size=\d+/g, '("(>)")');
  
  // Add alignment to rectangles with visible text
  const rectMatch = result.match(/\["([^"]*)"\]/);
  if (rectMatch && !result.includes('align=') && !result.includes('vertical-align=')) {
    const content = rectMatch[1];
    if (content !== '') {
      if (needsCenterAlign(content, result)) {
        // Find the last attribute to insert before
        const lastAttrMatch = result.match(/(\s+r=\d+)$/);
        if (lastAttrMatch) {
          result = result.replace(/(\s+r=\d+)$/, ` align=c vertical-align=m$1`);
        } else {
          result = result + ' align=c vertical-align=m';
        }
      } else if (needsLeftAlign(content, result)) {
        const lastAttrMatch = result.match(/(\s+r=\d+)$/);
        if (lastAttrMatch) {
          result = result.replace(/(\s+r=\d+)$/, ` align=l vertical-align=m$1`);
        } else {
          result = result + ' align=l vertical-align=m';
        }
      }
    }
  }
  
  return result;
}

function processCodeBlock(codeLines) {
  // First pass: collect all coordinates to find the base offset
  const allText = codeLines.join('\n');
  const allCoords = extractAllCoords(allText);
  
  let minX = 0, minY = 0;
  if (allCoords.length > 0) {
    minX = Math.min(...allCoords.map(c => c.x));
    minY = Math.min(...allCoords.map(c => c.y));
  }
  
  // Second pass: fix each line
  let isInTable = false;
  let isTableCell = false;
  const result = [];
  
  for (let i = 0; i < codeLines.length; i++) {
    let line = codeLines[i];
    const trimmed = line.trim();
    
    // Check if this is a table header
    if (trimmed.startsWith('## ')) {
      isInTable = true;
      isTableCell = false;
    }
    
    // Check if this is a table row
    if (trimmed.startsWith('# ')) {
      isTableCell = false; // Row marker itself, not a cell
    }
    
    // Detect table cells (indented content after # or ##)
    if (isInTable && !trimmed.startsWith('#') && !trimmed.startsWith('```') && trimmed !== '') {
      isTableCell = true;
    } else if (trimmed.startsWith('# ') || trimmed.startsWith('## ')) {
      isTableCell = false;
    }
    
    // Skip code block markers
    if (trimmed.startsWith('```')) {
      result.push(line);
      continue;
    }
    
    // Apply fixes
    line = fixCodeLine(line, isInTable, isTableCell);
    
    // Shift coordinates
    if (minX > 0 || minY > 0) {
      line = shiftCoordsInText(line, minX, minY);
    }
    
    result.push(line);
  }
  
  return result;
}

// Main processing loop
let i = 0;
while (i < lines.length) {
  const line = lines[i];
  const trimmed = line.trim();
  
  // Handle code blocks
  if (trimmed.startsWith('```solarwire')) {
    collectingCode = true;
    componentCodeLines = [line];
    i++;
    continue;
  }
  
  if (collectingCode && trimmed === '```') {
    componentCodeLines.push(line);
    collectingCode = false;
    
    // Process the code block
    const fixedLines = processCodeBlock(componentCodeLines);
    for (const fl of fixedLines) {
      output.push(fl);
    }
    
    i++;
    continue;
  }
  
  if (collectingCode) {
    componentCodeLines.push(line);
    i++;
    continue;
  }
  
  // Handle header (# Ant Design 组件库)
  if (trimmed.startsWith('# ') && !trimmed.startsWith('## ')) {
    output.push(line);
    i++;
    // Read header metadata
    while (i < lines.length) {
      const metaLine = lines[i];
      const metaTrimmed = metaLine.trim();
      if (metaTrimmed.startsWith('id:') || metaTrimmed.startsWith('$schema:') || 
          metaTrimmed.startsWith('description:') || metaTrimmed.startsWith('version:') ||
          metaTrimmed.startsWith('author:')) {
        if (metaTrimmed.startsWith('id:')) output.push(metaTrimmed);
        else if (metaTrimmed.startsWith('$schema:')) output.push(metaTrimmed);
        else if (metaTrimmed.startsWith('description:')) output.push(metaTrimmed);
        else if (metaTrimmed.startsWith('version:')) output.push(metaTrimmed);
        else if (metaTrimmed.startsWith('author:')) output.push(metaTrimmed);
        i++;
      } else if (metaTrimmed.startsWith('createdAt:') || metaTrimmed.startsWith('updatedAt:')) {
        i++; // Skip old timestamps
      } else if (metaTrimmed === '') {
        break;
      } else {
        break;
      }
    }
    output.push('createdAt: 2026-05-12T00:00:00Z');
    output.push('updatedAt: 2026-05-12T00:00:00Z');
    output.push('');
    continue;
  }
  
  // Handle category (## ...)
  if (trimmed.startsWith('## ') && !trimmed.startsWith('### ')) {
    // Read category metadata
    let catId = '';
    let catPlatform = '';
    let catName = trimmed.replace(/^## /, '');
    let j = i + 1;
    while (j < lines.length) {
      const metaLine = lines[j].trim();
      if (metaLine.startsWith('id:')) {
        catId = metaLine.replace('id:', '').trim();
        j++;
      } else if (metaLine.startsWith('platform:')) {
        catPlatform = metaLine.replace('platform:', '').trim();
        j++;
      } else if (metaLine === '') {
        j++;
        break;
      } else {
        break;
      }
    }
    
    const newCatId = CATEGORY_MAP[catId] || catId;
    currentCategoryId = newCatId;
    currentPlatform = catPlatform;
    
    // Add top-level category if needed
    if (catPlatform === 'web' && !addedTopLevelCats.has('cat-web')) {
      output.push('## Web');
      output.push('id: cat-web');
      output.push('parentId: null');
      output.push('');
      addedTopLevelCats.add('cat-web');
    } else if (catPlatform === 'mobile' && !addedTopLevelCats.has('cat-mobile')) {
      output.push('## Mobile');
      output.push('id: cat-mobile');
      output.push('parentId: null');
      output.push('');
      addedTopLevelCats.add('cat-mobile');
    }
    
    const parentCat = newCatId.startsWith('cat-web-') ? 'cat-web' : 
                       newCatId.startsWith('cat-mobile-') ? 'cat-mobile' : 'null';
    const displayName = CATEGORY_NAMES[newCatId] || catName;
    
    output.push(`## ${displayName}`);
    output.push(`id: ${newCatId}`);
    output.push(`parentId: ${parentCat}`);
    output.push('');
    
    i = j;
    continue;
  }
  
  // Handle component (### ...)
  if (trimmed.startsWith('### ')) {
    let compId = '';
    let compName = trimmed.replace(/^### /, '');
    let compDesc = '';
    let compCategoryId = '';
    let j = i + 1;
    while (j < lines.length) {
      const metaLine = lines[j].trim();
      if (metaLine.startsWith('id:')) {
        compId = metaLine.replace('id:', '').trim();
        j++;
      } else if (metaLine.startsWith('name:')) {
        compName = metaLine.replace('name:', '').trim();
        j++;
      } else if (metaLine.startsWith('description:')) {
        compDesc = metaLine.replace('description:', '').trim();
        j++;
      } else if (metaLine.startsWith('categoryId:')) {
        compCategoryId = metaLine.replace('categoryId:', '').trim();
        j++;
      } else if (metaLine.startsWith('createdAt:') || metaLine.startsWith('updatedAt:')) {
        j++; // Skip old timestamps
      } else if (metaLine === '') {
        j++;
        break;
      } else {
        break;
      }
    }
    
    const newCategoryId = CATEGORY_MAP[compCategoryId] || compCategoryId;
    
    output.push(trimmed);
    output.push(`id: ${compId}`);
    output.push(`name: ${compName}`);
    output.push(`description: ${compDesc}`);
    output.push(`categoryId: ${newCategoryId}`);
    output.push('createdAt: 2026-05-12T00:00:00Z');
    output.push('updatedAt: 2026-05-12T00:00:00Z');
    output.push('');
    
    i = j;
    continue;
  }
  
  // Handle separator
  if (trimmed === '---') {
    output.push('---');
    output.push('');
    i++;
    continue;
  }
  
  // Handle footer
  if (trimmed.startsWith('*') && trimmed.endsWith('*')) {
    output.push('*组件库完成 - Ant Design Web+Mobile 组件库，共 30 个分类，约 232 个组件*');
    i++;
    continue;
  }
  
  // Skip other lines (old metadata, empty lines between sections, etc.)
  i++;
}

const result = output.join('\n');
fs.writeFileSync(inputFile, result, 'utf-8');
console.log('File rewritten successfully!');
console.log(`Output lines: ${output.length}`);
