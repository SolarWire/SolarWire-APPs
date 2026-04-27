import { parse } from '../parser';
import { render } from '../renderer';

export async function generateThumbnail(code: string, width: number = 150, height: number = 100): Promise<string> {
  try {
    const ast = parse(code);
    const result = render(ast, undefined, true);

    const vb = result.viewBox;
    const contentWidth = vb.width || 400;
    const contentHeight = vb.height || 300;

    const scale = Math.min(width / contentWidth, height / contentHeight);
    const scaledWidth = contentWidth * scale;
    const scaledHeight = contentHeight * scale;
    const offsetX = (width - scaledWidth) / 2;
    const offsetY = (height - scaledHeight) / 2;

    const svgContent = result.svg;
    const thumbnailSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect width="${width}" height="${height}" fill="#fafafa"/>
      <g transform="translate(${offsetX}, ${offsetY}) scale(${scale})">
        ${svgContent.replace(/<svg[^>]*>/, '').replace(/<\/svg>/, '')}
      </g>
    </svg>`;

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect width="${width}" height="${height}" fill="#fafafa"/>
      <g transform="translate(${offsetX}, ${offsetY}) scale(${scale})">
        ${svgContent.replace(/<svg[^>]*>/, '').replace(/<\/svg>/, '')}
      </g>
    </svg>`;
  } catch (error) {
    return createErrorThumbnail();
  }
}

function createErrorThumbnail(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="150" height="100" viewBox="0 0 150 100">
    <rect width="150" height="100" fill="#f5f5f5"/>
    <text x="75" y="55" font-size="14" text-anchor="middle" fill="#999">Error</text>
  </svg>`;
}

export async function generateThumbnailBatch(
  components: Array<{ internalId: string; code: string }>,
  onProgress?: (completed: number, total: number, componentInternalId: string, success: boolean) => void,
  width: number = 150,
  height: number = 100
): Promise<Map<string, string>> {
  const thumbnails = new Map<string, string>();
  const total = components.length;

  for (let i = 0; i < components.length; i++) {
    const component = components[i];
    const thumbnail = await generateThumbnail(component.code, width, height);
    thumbnails.set(component.internalId, thumbnail);

    const success = !thumbnail.includes('&#10060;');
    onProgress?.(i + 1, total, component.internalId, success);

    if (i % 5 === 4) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }

  return thumbnails;
}
