import { Tokens } from 'marked'
import mermaid from 'mermaid'

mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
})

let idCounter = 0

export function getMermaidExtension() {
  return {
    name: 'mermaid',
    level: 'block' as const,
    start(src: string) {
      return src.match(/```mermaid/)?.index
    },
    tokenizer(src: string): Tokens.Generic | void {
      const match = src.match(/^```mermaid\s*\n?([\s\S]*?)```/)
      if (match) {
        return {
          type: 'mermaid',
          raw: match[0],
          code: match[1].trim(),
        }
      }
    },
    renderer(token: Tokens.Generic): string {
      return `<div class="mermaid-placeholder" data-code="${encodeURIComponent(token.code)}"></div>`
    },
  }
}

export class MermaidRenderer {
  async renderPlaceholders(html: string): Promise<string> {
    const placeholders = html.match(/<div class="mermaid-placeholder"[^>]*>/g) || []
    if (placeholders.length === 0) return html

    const renderPromises = placeholders.map(async (placeholder) => {
      const codeMatch = placeholder.match(/data-code="([^"]+)"/)
      if (!codeMatch) return null

      const code = decodeURIComponent(codeMatch[1])
      try {
        const id = `mermaid-${Date.now()}-${(idCounter++).toString(36)}`
        const { svg } = await mermaid.render(id, code)
        return {
          placeholder,
          replacement: `<div class="mermaid-container">${svg}</div>`,
        }
      } catch (error) {
        console.error('Mermaid render error:', error)
        return {
          placeholder,
          replacement: `<div class="mermaid-error">Mermaid 渲染失败</div>`,
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