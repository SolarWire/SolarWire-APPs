import { parse } from '../parser';
import { render } from '../renderer';

/**
 * 生成组件缩略图
 * @param code - SolarWire DSL 代码
 * @param width - 缩略图宽度
 * @param height - 缩略图高度
 * @returns SVG 格式的缩略图
 */
export async function generateThumbnail(code: string, width: number = 150, height: number = 100, disableNotes: boolean = true): Promise<string> {
  try {
    const ast = parse(code);
    const result = render(ast, { disableNotes }, true);

    let svgContent: string;
    let contentWidth = 400;
    let contentHeight = 300;

    // 处理 render 函数的不同返回类型
    if (typeof result === 'string') {
      // 如果返回字符串，直接使用
      svgContent = result;
    } else if (result && typeof result === 'object') {
      // 如果返回对象，提取 svg 和 viewBox
      svgContent = result.svg;
      const vb = result.viewBox;
      contentWidth = vb.width || 400;
      contentHeight = vb.height || 300;
    } else {
      // 返回值无效，返回错误缩略图
      return createErrorThumbnail();
    }

    // 清理 SVG 内容 - 移除外层 SVG 标签和 XML 声明
    // XML声明在HTML中可能导致渲染问题，特别是在Electron环境下
    let cleanSvgContent = svgContent.replace(/<\?xml[^>]*\?>/, '').replace(/<svg[^>]*>/, '').replace(/<\/svg>/, '');

    // 检查清理后的内容是否为空
    if (!cleanSvgContent || cleanSvgContent.trim() === '') {
      return createErrorThumbnail();
    }

    // 计算缩放比例，使内容适应缩略图尺寸
    const scale = Math.min(width / contentWidth, height / contentHeight);
    const scaledWidth = contentWidth * scale;
    const scaledHeight = contentHeight * scale;
    const offsetX = (width - scaledWidth) / 2;
    const offsetY = (height - scaledHeight) / 2;

    // 生成最终的缩略图 SVG
    const thumbnailSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect width="${width}" height="${height}" fill="#fafafa"/>
      <g transform="translate(${offsetX}, ${offsetY}) scale(${scale})">
        ${cleanSvgContent}
      </g>
    </svg>`;

    return thumbnailSvg;
  } catch (error) {
    // 缩略图生成失败时返回错误缩略图，不输出错误日志
    // 错误已通过UI中的修复按钮处理，避免控制台报错干扰用户
    return createErrorThumbnail();
  }
}

/**
 * 创建错误缩略图
 * 当缩略图生成失败时显示
 */
function createErrorThumbnail(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="150" height="100" viewBox="0 0 150 100">
    <rect width="150" height="100" fill="#f5f5f5"/>
    <text x="75" y="55" font-size="14" text-anchor="middle" fill="#999">&#10060; Error</text>
  </svg>`;
}

/**
 * 检查缩略图是否生成失败
 */
function isThumbnailFailed(thumbnail: string): boolean {
  return thumbnail.includes('&#10060;') || thumbnail.includes('❌') || thumbnail.includes('Error');
}

/**
 * 批量生成组件缩略图
 * @param components - 组件列表，包含内部 ID 和代码
 * @param onProgress - 进度回调函数
 * @param width - 缩略图宽度
 * @param height - 缩略图高度
 * @returns 组件 ID 到缩略图 SVG 的映射
 */
export async function generateThumbnailBatch(
  components: Array<{ internalId: string; code: string }>,
  onProgress?: (completed: number, total: number, componentInternalId: string, success: boolean) => void,
  width: number = 150,
  height: number = 100
): Promise<Map<string, string>> {
  const thumbnails = new Map<string, string>();
  const total = components.length;

  // 逐个生成缩略图
  for (let i = 0; i < components.length; i++) {
    const component = components[i];
    const thumbnail = await generateThumbnail(component.code, width, height);
    thumbnails.set(component.internalId, thumbnail);

    // 检查是否生成成功（不包含错误标记）
    const success = !thumbnail.includes('&#10060;');
    onProgress?.(i + 1, total, component.internalId, success);

    // 每 5 个组件让出一次控制权，避免阻塞 UI
    if (i % 5 === 4) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }

  return thumbnails;
}
