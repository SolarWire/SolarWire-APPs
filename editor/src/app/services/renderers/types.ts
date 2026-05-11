export interface RenderResult {
  html: string
  error?: Error
}

export interface RendererContext {
  imageUrlResolver?: (path: string) => string
  preloadedImages?: Map<string, string>
}

export interface BlockInfo {
  placeholder: string
  match: string
  code: string
}