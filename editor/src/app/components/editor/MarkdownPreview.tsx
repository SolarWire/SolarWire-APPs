import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useEditorStore } from '../../stores/editorStore'
import { useFileStore } from '../../stores/fileStore'
import { useAppStore } from '../../stores/appStore'
import { useSelectionStore } from '../../stores/selectionStore'
import { Scrollbar } from '../ui/Scrollbar'
import LoadingOverlay from '../ui/LoadingOverlay'
import { RenderCoordinator } from '../../services/renderers/RenderCoordinator'
import { debounce } from '../../../shared/utils/debounce'
import './MarkdownPreview.css'

function MarkdownPreview(): React.ReactElement {
  const { content, setMode, setContent } = useEditorStore()
  const { selectedFile, fullFileContent } = useFileStore()
  const { setCurrentView } = useAppStore()
  const { setSelection } = useSelectionStore()

  const [html, setHtml] = useState<string>('')
  const [isRendering, setIsRendering] = useState<boolean>(false)
  const [renderProgress, setRenderProgress] = useState<number>(0)

  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const isRenderingRef = useRef(false)
  const renderTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const coordinatorRef = useRef<RenderCoordinator | null>(null)

  useEffect(() => {
    coordinatorRef.current = new RenderCoordinator()
    return () => {
      coordinatorRef.current?.cancel()
    }
  }, [])

  const handleScroll = useCallback(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.dataset.scrollTop = scrollContainerRef.current.scrollTop.toString()
    }
  }, [])

  const handleSolarWireEditClick = useCallback(async (e: MouseEvent) => {
    const target = e.target as HTMLElement
    if (target.classList.contains('solarwire-edit-button')) {
      const encodedCode = target.getAttribute('data-code')
      if (encodedCode) {
        const code = decodeURIComponent(encodedCode)
        setContent(code)
        setMode('solarwire')

        setCurrentView('file')

        if (selectedFile && selectedFile.path) {
          try {
            const api = (window as any).api
            if (api && typeof api.collectSolarWireSnippets === 'function') {
              const currentPath = selectedFile.path.replace(/[\\/][^\\/]*$/, '')
              const snippets = await api.collectSolarWireSnippets(currentPath)

              const matchingSnippet = snippets.find((snippet: any) => {
                const snippetCode = snippet.code.trim()
                return snippetCode === code.trim()
              })

              if (matchingSnippet) {
                const fileStoreState = useFileStore.getState()
                if (fileStoreState.openSolarWireSnippet) {
                  await fileStoreState.openSolarWireSnippet(matchingSnippet)
                  setSelection('file', matchingSnippet.sourceFile, matchingSnippet.id)
                }
              } else {
                setSelection('file', selectedFile.path)
              }
            }
          } catch (err) {
            console.error('Failed to find matching snippet:', err)
            setSelection('file', selectedFile.path)
          }
        }
      }
    }
  }, [setContent, setMode, setCurrentView, setSelection, selectedFile])

  useEffect(() => {
    const container = scrollContainerRef.current
    if (container) {
      container.addEventListener('click', handleSolarWireEditClick)
      return () => {
        container.removeEventListener('click', handleSolarWireEditClick)
      }
    }
  }, [handleSolarWireEditClick])

  useEffect(() => {
    if (scrollContainerRef.current) {
      const savedScroll = scrollContainerRef.current.dataset.scrollTop
      if (savedScroll) {
        scrollContainerRef.current.scrollTop = parseInt(savedScroll)
      }
    }
  }, [html])

  const performRender = useCallback(async () => {
    if (isRenderingRef.current) return

    if (renderTimeoutRef.current) {
      clearTimeout(renderTimeoutRef.current)
    }

    renderTimeoutRef.current = setTimeout(async () => {
      let contentToRender = content
      if (!contentToRender || contentToRender === '') {
        contentToRender = fullFileContent
      }

      if (!contentToRender) return

      isRenderingRef.current = true
      setIsRendering(true)
      setRenderProgress(0)

      try {
        const coordinator = coordinatorRef.current!
        const mdDir = selectedFile?.path?.replace(/[\\/][^\\/]*$/, '') || ''
        const api = (window as any).api

        const { html: finalHtml, errors } = await coordinator.render(
          contentToRender,
          mdDir,
          api,
          (progress) => {
            setRenderProgress(progress.progress)
          }
        )

        setHtml(finalHtml)

        if (errors.length > 0) {
          console.warn('Rendering completed with errors:', errors)
        }
      } catch (error) {
        console.error('Critical error in markdown rendering:', error)
        setHtml(`<div class="markdown-error">Markdown 渲染出现严重错误</div><pre><code>${contentToRender}</code></pre>`)
        setRenderProgress(100)
      } finally {
        isRenderingRef.current = false
        setTimeout(() => setIsRendering(false), 300)
      }
    }, 300)
  }, [content, fullFileContent, selectedFile])

  const renderContent = useCallback(
    debounce(() => {
      performRender()
    }, 50),
    [performRender]
  )

  useEffect(() => {
    renderContent()
    return () => {
      if (renderTimeoutRef.current) {
        clearTimeout(renderTimeoutRef.current)
      }
    }
  }, [renderContent])

  return (
    <div className="markdown-preview-container">
      <LoadingOverlay
        visible={isRendering}
        icon="📝"
        text="正在渲染预览..."
        progress={renderProgress}
      />
      <Scrollbar className="markdown-preview" ref={scrollContainerRef} onScroll={handleScroll}>
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </Scrollbar>
    </div>
  )
}

export default MarkdownPreview