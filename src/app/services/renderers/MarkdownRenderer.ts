import { marked } from 'marked'

export class MarkdownRenderer {
  async render(content: string): Promise<string> {
    return marked(content, {
      breaks: true,
      gfm: true,
    })
  }
}