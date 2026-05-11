interface DiagramBlock {
  index: number
  code: string
}

export function extractGraphvizBlocks(content: string): { processed: string; blocks: DiagramBlock[] } {
  const blocks: DiagramBlock[] = []
  let index = 0

  const processed = content.replace(
    /```(?:graphviz|dot)\s*\n?([\s\S]*?)```/g,
    (_match, code) => {
      blocks.push({ index: index++, code: code.trim() })
      return `<div class="graphviz-placeholder" data-code="${encodeURIComponent(code)}"></div>`
    }
  )

  return { processed, blocks }
}

export class GraphvizRenderer {
  async renderPlaceholders(html: string): Promise<string> {
    const placeholders = html.match(/<div class="graphviz-placeholder"[^>]*>/g) || []
    if (placeholders.length === 0) return html

    const renderPromises = placeholders.map(async (placeholder) => {
      const codeMatch = placeholder.match(/data-code="([^"]+)"/)
      if (!codeMatch) return null

      const code = decodeURIComponent(codeMatch[1])
      try {
        const viz = await import('@viz-js/viz').then((m) => m.instance())
        const result = (await viz.render(code, { format: 'svg' })) as { output: string }
        return {
          placeholder,
          replacement: `<div class="graphviz-container">${result.output}</div>`,
        }
      } catch (error) {
        console.error('Graphviz render error:', error)
        return {
          placeholder,
          replacement: `<div class="graphviz-error">Graphviz 渲染失败</div>`,
        }
      }
    })

    const results = await Promise.all(renderPromises)
    let finalHtml = html
    results.forEach((result) => {
      if (result) {
        finalHtml = finalHtml.replace(result.placeholder, result.replacement)
      }
    })

    return finalHtml
  }
}