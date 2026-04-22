import { ComponentLibrary, Component, ComponentCategory } from '../../shared/types/component';

export interface SWCParseResult {
  library: ComponentLibrary;
  errors: SWCParseError[];
}

export interface SWCParseError {
  componentId?: string;
  componentName?: string;
  line: number;
  message: string;
}

export interface SWCExportOptions {
  pretty?: boolean;
}

export function parseSWC(content: string): SWCParseResult {
  const lines = content.split('\n');
  const errors: SWCParseError[] = [];

  let metadata: Record<string, string> = {};
  let categories: ComponentCategory[] = [];
  let components: Component[] = [];

  let currentSection: 'metadata' | 'category' | 'component' | 'none' = 'none';
  let currentCategory: ComponentCategory | null = null;
  let currentComponent: Partial<Component> | null = null;
  let inCodeBlock = false;
  let codeBuffer = '';
  let codeBlockStarted = false;

  const now = new Date().toISOString();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;
    const trimmed = line.trim();

    // Handle code block end
    if (inCodeBlock) {
      if (trimmed === '```') {
        inCodeBlock = false;
        if (currentComponent) {
          currentComponent.code = codeBuffer.trimEnd();
          codeBuffer = '';
          codeBlockStarted = false;
        }
        continue;
      }
      codeBuffer += line + '\n';
      continue;
    }

    // Handle code block start
    if (trimmed === '```solarwire') {
      inCodeBlock = true;
      codeBlockStarted = true;
      continue;
    }

    // Skip empty lines
    if (trimmed === '') continue;

    // Handle component declaration (###)
    if (trimmed.startsWith('### ')) {
      // Save previous component if exists
      if (currentComponent) {
        finalizeComponent(currentComponent, currentCategory?.id || null, now);
        if (currentComponent.id) {
          components.push(currentComponent as Component);
        } else {
          errors.push({ line: lineNum, message: '组件缺少 id 属性' });
        }
      }
      currentComponent = { name: trimmed.slice(4).trim() };
      currentSection = 'component';
      continue;
    }

    // Handle category declaration (##)
    if (trimmed.startsWith('## ')) {
      if (currentCategory && currentCategory.id && !categories.find(c => c.id === currentCategory!.id)) {
        categories.push(currentCategory);
      }

      if (currentComponent) {
        finalizeComponent(currentComponent, currentCategory?.id || null, now);
        if (currentComponent.id) {
          components.push(currentComponent as Component);
        }
        currentComponent = null;
      }

      currentCategory = { id: '', name: trimmed.slice(3).trim(), parentId: null };
      currentSection = 'category';
      continue;
    }

    // Handle library declaration (#)
    if (trimmed.startsWith('# ')) {
      // Save previous component if exists
      if (currentComponent) {
        finalizeComponent(currentComponent, currentCategory?.id || null, now);
        if (currentComponent.id) {
          components.push(currentComponent as Component);
        }
        currentComponent = null;
      }

      metadata.name = trimmed.slice(2).trim();
      currentSection = 'metadata';
      continue;
    }

    // Handle key-value properties
    const kvMatch = trimmed.match(/^(\w[\w-]*):\s*(.*)$/);
    if (kvMatch) {
      const key = kvMatch[1];
      const value = kvMatch[2].trim();

      if (currentSection === 'metadata') {
        metadata[key] = value;
      } else if (currentSection === 'category' && currentCategory) {
        if (key === 'id') currentCategory.id = value;
        else if (key === 'name') currentCategory.name = value;
        else if (key === 'parentId') currentCategory.parentId = value || null;
        else {
          (currentCategory as any)[key] = value;
        }
      } else if (currentSection === 'component' && currentComponent) {
        if (key === 'id') currentComponent.id = value;
        else if (key === 'name') currentComponent.name = value;
        else if (key === 'description') currentComponent.description = value || undefined;
        else if (key === 'categoryId') currentComponent.categoryId = value || undefined;
        else if (key === 'thumbnail') currentComponent.thumbnail = value;
        else if (key === 'code') currentComponent.code = value;
        else if (key === 'createdAt') currentComponent.createdAt = value;
        else if (key === 'updatedAt') currentComponent.updatedAt = value;
        else (currentComponent as any)[key] = value;
      }
    }
  }

  // Handle code block not closed
  if (inCodeBlock && currentComponent) {
    currentComponent.code = codeBuffer.trimEnd();
    errors.push({
      componentId: currentComponent.id,
      componentName: currentComponent.name,
      line: lines.length,
      message: '代码块未正确关闭（缺少 ```）'
    });
  }

  // Save last component
  if (currentComponent) {
    finalizeComponent(currentComponent, currentCategory?.id || null, now);
    if (currentComponent.id) {
      components.push(currentComponent as Component);
    } else {
      errors.push({ line: lines.length, message: '组件缺少 id 属性' });
    }
  }

  // Save last category
  if (currentCategory && !categories.find(c => c.id === currentCategory.id)) {
    categories.push(currentCategory);
  }

  const library: ComponentLibrary = {
    $schema: (metadata.$schema as any) || 'solarwire-component-library-v1',
    metadata: {
      id: metadata.id || '',
      name: metadata.name || '未命名组件库',
      description: metadata.description || undefined,
      version: metadata.version || '1.0.0',
      author: metadata.author || undefined,
      createdAt: metadata.createdAt || now,
      updatedAt: metadata.updatedAt || now,
    },
    categories,
    components,
  };

  return { library, errors };
}

function finalizeComponent(comp: Partial<Component>, defaultCategoryId: string | null, now: string) {
  if (!comp.id) return;
  if (!comp.name) comp.name = comp.id;
  if (!comp.categoryId) comp.categoryId = defaultCategoryId || undefined;
  if (!comp.code) comp.code = '';
  // thumbnail is now optional
  if (!comp.createdAt) comp.createdAt = now;
  if (!comp.updatedAt) comp.updatedAt = now;
}

export function serializeSWC(library: ComponentLibrary): string {
  let output = '';

  // Library declaration
  output += `# ${library.metadata.name}\n`;
  output += `id: ${library.metadata.id}\n`;
  if (library.$schema) output += `$schema: ${library.$schema}\n`;
  if (library.metadata.description) output += `description: ${library.metadata.description}\n`;
  output += `version: ${library.metadata.version}\n`;
  if (library.metadata.author) output += `author: ${library.metadata.author}\n`;
  output += `createdAt: ${library.metadata.createdAt}\n`;
  output += `updatedAt: ${library.metadata.updatedAt}\n`;

  for (const category of library.categories) {
    output += `\n## ${category.name}\n`;
    output += `id: ${category.id}\n`;
    if (category.parentId) output += `parentId: ${category.parentId}\n`;

    const categoryComponents = library.components.filter(c => c.categoryId === category.id);
    for (const component of categoryComponents) {
      output += `\n### ${component.name}\n`;
      output += `id: ${component.id}\n`;
      if (component.description) output += `description: ${component.description}\n`;
      if (component.categoryId) output += `categoryId: ${component.categoryId}\n`;
      if (component.createdAt) output += `createdAt: ${component.createdAt}\n`;
      if (component.updatedAt) output += `updatedAt: ${component.updatedAt}\n`;

      if (component.code) {
        output += '\n```solarwire\n';
        output += component.code + '\n';
        output += '```\n';
      }
    }
  }

  const categoryIds = new Set(library.categories.map(c => c.id));
  const uncategorizedComponents = library.components.filter(c => !c.categoryId || !categoryIds.has(c.categoryId));
  if (uncategorizedComponents.length > 0) {
    output += '\n## 未分类\n';
    output += `id: uncategorized\n`;
    for (const component of uncategorizedComponents) {
      output += `\n### ${component.name}\n`;
      output += `id: ${component.id}\n`;
      if (component.description) output += `description: ${component.description}\n`;
      if (component.createdAt) output += `createdAt: ${component.createdAt}\n`;
      if (component.updatedAt) output += `updatedAt: ${component.updatedAt}\n`;

      if (component.code) {
        output += '\n```solarwire\n';
        output += component.code + '\n';
        output += '```\n';
      }
    }
  }

  return output;
}
