import { marked } from 'marked'
import { MarkdownRenderer } from './MarkdownRenderer'
import { SolarWireRenderer } from './SolarWireRenderer'
import { MermaidRenderer, getMermaidExtension } from './MermaidRenderer'
import { GraphvizRenderer, extractGraphvizBlocks } from './GraphvizRenderer'
import { ImageLoader } from '../ImageLoader'

marked.use({ extensions: [getMermaidExtension()] })

export interface RenderProgress {
  stage: string
  progress: number
}

export interface RenderOutput {
  html: string
  errors: Error[]
}

export class RenderCoordinator {
  private markdownRenderer = new MarkdownRenderer()
  private solarWireRenderer = new SolarWireRenderer()
  private mermaidRenderer = new MermaidRenderer()
  private graphvizRenderer = new GraphvizRenderer()
  private imageLoader = new ImageLoader()

  private abortController: AbortController | null = null
  private currentVersion = 0

  getImageUrlResolver(): (path: string) => string {
    return this.imageLoader.getImageUrlResolver()
  }

  async render(
    contentToRender: string,
    mdDir: string,
    api: any,
    onProgress?: (progress: RenderProgress) => void
  ): Promise<RenderOutput> {
    this.currentVersion++
    const currentVersion = this.currentVersion

    if (this.abortController) {
      this.abortController.abort()
    }
    this.abortController = new AbortController()
    const signal = this.abortController.signal

    const errors: Error[] = []

    try {
      const solarwireBlocks: { match: string; code: string }[] = []
      const solarwirePlaceholder = contentToRender.replace(
        /```solarwire\s*([\s\S]*?)```/g,
        (match: string, code: string) => {
          solarwireBlocks.push({ match, code })
          return `<<<SOLARWIRE_PLACEHOLDER_${solarwireBlocks.length - 1}>>>`
        }
      )

      if (currentVersion !== this.currentVersion) return { html: contentToRender, errors }
      onProgress?.({ stage: 'extracting_solarwire', progress: 10 })

      await this.solarWireRenderer.preloadImages(solarwireBlocks, this.imageLoader.getCache(), api, mdDir)

      if (currentVersion !== this.currentVersion) return { html: contentToRender, errors }
      onProgress?.({ stage: 'preloading_images', progress: 25 })

      const { processed: graphvizProcessed } = extractGraphvizBlocks(solarwirePlaceholder)

      if (currentVersion !== this.currentVersion) return { html: contentToRender, errors }
      onProgress?.({ stage: 'extracting_graphviz', progress: 35 })

      const imageUrlResolver = this.getImageUrlResolver()

      let finalProcessed: string
      try {
        finalProcessed = await this.solarWireRenderer.renderBlocks(solarwireBlocks, graphvizProcessed, imageUrlResolver)
      } catch (solarWireError) {
        console.error('Failed to render SolarWire blocks:', solarWireError)
        errors.push(solarWireError as Error)
        finalProcessed = graphvizProcessed
      }

      if (currentVersion !== this.currentVersion) return { html: contentToRender, errors }
      onProgress?.({ stage: 'rendering_solarwire', progress: 50 })

      let renderedHtml: string
      try {
        renderedHtml = await this.markdownRenderer.render(finalProcessed)
      } catch (markdownError) {
        console.error('Failed to render Markdown:', markdownError)
        errors.push(markdownError as Error)
        renderedHtml = `<pre><code>${this.escapeHtml(contentToRender)}</code></pre>`
      }

      if (currentVersion !== this.currentVersion) return { html: contentToRender, errors }
      onProgress?.({ stage: 'rendering_markdown', progress: 60 })

      let mermaidHtml: string
      try {
        mermaidHtml = await this.mermaidRenderer.renderPlaceholders(renderedHtml)
      } catch (mermaidError) {
        console.error('Failed to render Mermaid blocks:', mermaidError)
        errors.push(mermaidError as Error)
        mermaidHtml = renderedHtml
      }

      if (currentVersion !== this.currentVersion) return { html: contentToRender, errors }
      onProgress?.({ stage: 'rendering_mermaid', progress: 75 })

      let graphvizHtml: string
      try {
        graphvizHtml = await this.graphvizRenderer.renderPlaceholders(mermaidHtml)
      } catch (graphvizError) {
        console.error('Failed to render Graphviz blocks:', graphvizError)
        errors.push(graphvizError as Error)
        graphvizHtml = mermaidHtml
      }

      if (currentVersion !== this.currentVersion) return { html: contentToRender, errors }
      onProgress?.({ stage: 'rendering_graphviz', progress: 90 })

      let finalHtml: string
      try {
        finalHtml = await this.imageLoader.loadImages(graphvizHtml, mdDir, api)
      } catch (imageError) {
        console.error('Failed to load images:', imageError)
        errors.push(imageError as Error)
        finalHtml = graphvizHtml
      }

      if (currentVersion !== this.currentVersion) return { html: contentToRender, errors }
      onProgress?.({ stage: 'completed', progress: 100 })

      return { html: finalHtml, errors }
    } catch (error) {
      if (signal.aborted) return { html: contentToRender, errors }

      console.error('Critical error in markdown rendering:', error)
      errors.push(error as Error)
      return {
        html: `<div class="markdown-error">Markdown 渲染出现严重错误</div><pre><code>${this.escapeHtml(contentToRender)}</code></pre>`,
        errors,
      }
    }
  }

  cancel(): void {
    if (this.abortController) {
      this.abortController.abort()
    }
  }

  clearCache(): void {
    this.imageLoader.clearCache()
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
  }
}