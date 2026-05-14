export class ImageLoader {
  private cache = new Map<string, string>()

  getCache(): Map<string, string> {
    return this.cache
  }

  getFromCache(path: string): string | undefined {
    return this.cache.get(path)
  }

  getImageUrlResolver(): (path: string) => string {
    return (relativePath: string): string => {
      return this.cache.get(relativePath) || relativePath
    }
  }

  addToCache(path: string, base64: string): void {
    this.cache.set(path, base64)
  }

  async loadImages(html: string, mdDir: string, api: any): Promise<string> {
    const imgSrcRegex = /<img\s+([^>]*?)src="(assets\/[^"]+)"([^>]*?)>/gi
    const imgMatches = [...html.matchAll(imgSrcRegex)]

    if (imgMatches.length === 0 || !mdDir) return html
    if (!api?.readImageAsBase64) return html

    const loadPromises = imgMatches.map(async (match) => {
      const fullMatch = match[0]
      const before = match[1]
      const src = match[2]
      const after = match[3]

      if (this.cache.has(src)) {
        return {
          fullMatch,
          replacement: `<img ${before}src="${this.cache.get(src)}"${after}>`,
        }
      }

      try {
        const absolutePath = `${mdDir}/${src}`.replace(/\\/g, '/')
        const base64 = await api.readImageAsBase64(absolutePath)
        if (base64) {
          this.cache.set(src, base64)
          return {
            fullMatch,
            replacement: `<img ${before}src="${base64}"${after}>`,
          }
        }
      } catch (e) {
        console.warn(`Failed to load image in markdown: ${src}`, e)
      }

      return null
    })

    const results = await Promise.all(loadPromises)
    let finalHtml = html
    results.forEach((result) => {
      if (result) {
        finalHtml = finalHtml.replace(result.fullMatch, result.replacement)
      }
    })

    return finalHtml
  }

  clearCache(): void {
    this.cache.clear()
  }
}