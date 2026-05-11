import { parse } from '../../../lib/parser'
import { render as renderSvg } from '../../../lib/renderer'

export class SolarWireRenderer {
  async preloadImages(
    blocks: { match: string; code: string }[],
    cache: Map<string, string>,
    api: any,
    mdDir: string
  ): Promise<void> {
    if (!api?.readImageAsBase64 || !mdDir) return

    const imagePromises: Promise<void>[] = []
    for (const block of blocks) {
      const imageMatches = [...block.code.matchAll(/<([^>]+\.(?:png|jpg|jpeg|gif|webp|svg))>/gi)]
      for (const match of imageMatches) {
        const path = match[1]
        if (!cache.has(path)) {
          imagePromises.push(
            (async () => {
              try {
                const absolutePath = `${mdDir}/${path}`.replace(/\\/g, '/')
                const base64 = await api.readImageAsBase64(absolutePath)
                cache.set(path, base64)
              } catch (e) {
                console.warn(`Failed to load image: ${path}`, e)
              }
            })()
          )
        }
      }
    }
    await Promise.all(imagePromises)
  }

  async renderBlocks(
    blocks: { match: string; code: string }[],
    processed: string,
    imageUrlResolver: (path: string) => string
  ): Promise<string> {
    let finalProcessed = processed

    const renderPromises = blocks.map(async (block, i) => {
      try {
        const ast = parse(block.code.trim())
        const svg = renderSvg(ast, { imageUrlResolver })
        const encodedCode = encodeURIComponent(block.code)
        return {
          index: i,
          replacement: `<div class="solarwire-code-block">
            <button
              class="solarwire-edit-button"
              title="在 SolarWire 视图中编辑"
              data-code="${encodedCode}"
            >✏️ 编辑</button>
            ${svg}
          </div>`,
        }
      } catch (error) {
        console.error(`Failed to render SolarWire block ${i}:`, error)
        const encodedCode = encodeURIComponent(block.code)
        const escapedCode = block.match.replace(/</g, '&lt;').replace(/>/g, '&gt;')
        return {
          index: i,
          replacement: `<div class="solarwire-code-block solarwire-error-block">
            <button
              class="solarwire-edit-button"
              title="在 SolarWire 视图中编辑"
              data-code="${encodedCode}"
            >✏️ 编辑</button>
            <div class="solarwire-error-message">SolarWire 渲染失败</div>
            <pre><code>${escapedCode}</code></pre>
          </div>`,
        }
      }
    })

    const results = await Promise.allSettled(renderPromises)
    const successfulResults = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value
      } else {
        console.error(`SolarWire block ${index} failed completely:`, result.reason)
        const block = blocks[index]
        const encodedCode = encodeURIComponent(block.code)
        const escapedCode = block.match.replace(/</g, '&lt;').replace(/>/g, '&gt;')
        return {
          index,
          replacement: `<div class="solarwire-code-block solarwire-error-block">
            <button
              class="solarwire-edit-button"
              title="在 SolarWire 视图中编辑"
              data-code="${encodedCode}"
            >✏️ 编辑</button>
            <div class="solarwire-error-message">SolarWire 渲染失败</div>
            <pre><code>${escapedCode}</code></pre>
          </div>`,
        }
      }
    })

    successfulResults.forEach(({ index, replacement }) => {
      finalProcessed = finalProcessed.replace(
        `<<<SOLARWIRE_PLACEHOLDER_${index}>>>`,
        replacement
      )
    })

    return finalProcessed
  }
}