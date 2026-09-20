import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ChevronLeft, ChevronRight, Maximize, Minus, PanelLeft, Plus,
} from 'lucide-react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

const MIN_SCALE = 0.5
const MAX_SCALE = 3
const SCALE_STEP = 0.25
const PAGE_RENDER_BUFFER = 2
const INITIAL_PAGE_WINDOW = 3
const MAX_DEVICE_PIXEL_RATIO = 2
const DEVICE_PIXEL_RATIO = typeof window === 'undefined'
  ? 1
  : Math.min(window.devicePixelRatio || 1, MAX_DEVICE_PIXEL_RATIO)

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function getRenderRange(page, pages, buffer = PAGE_RENDER_BUFFER) {
  const safePage = clamp(page, 1, pages || 1)
  return {
    start: Math.max(1, safePage - buffer),
    end: Math.min(pages || 1, safePage + buffer),
  }
}

function PageSkeleton() {
  return (
    <div className="flex h-64 w-full flex-col items-center justify-center gap-3 rounded bg-soft-stone p-4">
      <div className="h-3 w-16 rounded bg-surface-strong skeleton-shimmer" />
      <div className="h-40 w-2/3 rounded bg-surface-strong skeleton-shimmer" />
      <div className="h-3 w-1/2 rounded bg-surface-strong skeleton-shimmer" />
    </div>
  )
}

function PdfSkeleton({ progress = 0 }) {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-soft-stone/60 p-5">
      <div className="flex w-full max-w-xl flex-col items-center gap-5">
        <div className="w-full max-w-sm space-y-3">
          <div className="h-4 w-32 rounded bg-surface-strong skeleton-shimmer" />
          <div className="h-3 w-48 rounded bg-surface-strong skeleton-shimmer" />
        </div>
        <div className="w-full rounded-lg border border-hairline bg-white p-3 shadow-sm">
          <div className="aspect-[1/1.35] w-full max-w-xs rounded bg-soft-stone skeleton-shimmer" />
        </div>
        <div className="h-1.5 w-full max-w-sm overflow-hidden rounded-full bg-surface-strong">
          <div
            className="h-full bg-primary transition-[width] duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="font-mono text-[11px] uppercase tracking-wide text-muted">
          Preparing PDF {progress > 0 ? `${progress}%` : ''}
        </p>
      </div>
    </div>
  )
}

export default function PdfViewer({ file, onReady }) {
  const scrollRef = useRef(null)
  const pageRefs = useRef({})
  const navigationTarget = useRef(null)
  const visiblePage = useRef(1)
  const readyReported = useRef(false)
  const [numPages, setNumPages] = useState(0)
  const [pageNumber, setPageNumber] = useState(1)
  const [pageInput, setPageInput] = useState('1')
  const [scale, setScale] = useState(1)
  const [fitMode, setFitMode] = useState('width')
  const [renderRange, setRenderRange] = useState({
    start: 1,
    end: INITIAL_PAGE_WINDOW,
  })
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })
  const [firstPageSize, setFirstPageSize] = useState(null)
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')

  useEffect(() => {
    const element = scrollRef.current
    if (!element) return undefined

    const updateSize = () => {
      const rect = element.getBoundingClientRect()
      setContainerSize({
        width: Math.max(0, rect.width),
        height: Math.max(0, rect.height),
      })
    }

    updateSize()
    const observer = new ResizeObserver(updateSize)
    observer.observe(element)
    window.addEventListener('resize', updateSize)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', updateSize)
    }
  }, [])

  useEffect(() => {
    setPageNumber(1)
    setPageInput('1')
    setScale(1)
    setFitMode('width')
    setNumPages(0)
    setRenderRange({ start: 1, end: INITIAL_PAGE_WINDOW })
    setFirstPageSize(null)
    setLoading(Boolean(file))
    setProgress(0)
    setError('')
    visiblePage.current = 1
    readyReported.current = false
    navigationTarget.current = null
    Object.keys(pageRefs.current).forEach(key => delete pageRefs.current[key])
    if (scrollRef.current) scrollRef.current.scrollTop = 0
  }, [file])

  useEffect(() => {
    setPageInput(String(pageNumber))
  }, [pageNumber])

  useEffect(() => {
    const targetPage = navigationTarget.current
    if (targetPage === null || targetPage !== pageNumber) return
    navigationTarget.current = null
    const target = pageRefs.current[pageNumber]
    if (!target) return
    const frame = requestAnimationFrame(() => {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
    return () => cancelAnimationFrame(frame)
  }, [pageNumber])

  useEffect(() => {
    if (!numPages) return undefined

    const observer = new IntersectionObserver((entries) => {
      const visibleEntry = entries
        .filter(entry => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]

      if (!visibleEntry) return
      const nextPage = Number(visibleEntry.target.dataset.page)
      if (!Number.isFinite(nextPage) || visiblePage.current === nextPage) return
      visiblePage.current = nextPage
      setPageNumber(nextPage)
      setRenderRange(getRenderRange(nextPage, numPages))
    }, {
      root: scrollRef.current,
      threshold: [0.2, 0.4, 0.6, 0.8],
    })

    Object.values(pageRefs.current).forEach(element => {
      if (element) observer.observe(element)
    })

    return () => observer.disconnect()
  }, [numPages])

  const pageWidth = useMemo(() => {
    if (!containerSize.width) return undefined

    const availableWidth = Math.max(240, containerSize.width - 32)
    const availableHeight = Math.max(240, containerSize.height - 32)
    const aspectRatio = firstPageSize?.width && firstPageSize?.height
      ? firstPageSize.width / firstPageSize.height
      : 0.707

    const fittedWidth = fitMode === 'page'
      ? Math.min(availableWidth, availableHeight * aspectRatio)
      : Math.min(availableWidth, 920)

    return clamp(fittedWidth * scale, 160, 1600)
  }, [containerSize, firstPageSize, fitMode, scale])

  const estimatedPageHeight = useMemo(() => {
    if (!pageWidth) return 680
    const aspectRatio = firstPageSize?.width && firstPageSize?.height
      ? firstPageSize.width / firstPageSize.height
      : 0.707
    return pageWidth / aspectRatio
  }, [firstPageSize, pageWidth])

  const pdfOptions = useMemo(() => ({
    disableAutoFetch: false,
    enableXfa: true,
    isOffscreenCanvasSupported: true,
    maxImageSize: 12000000,
    rangeChunkSize: 65536,
  }), [])

  const handleDocumentLoad = ({ numPages: pages }) => {
    setNumPages(pages)
    setPageNumber(1)
    setPageInput('1')
    setRenderRange(getRenderRange(1, pages))
    setLoading(false)
    setError('')
  }

  const handleDocumentProgress = ({ loaded, total }) => {
    if (!total) return
    setProgress(clamp(Math.round((loaded / total) * 100), 0, 100))
  }

  const handleDocumentError = (loadError) => {
    setLoading(false)
    setError(loadError.message || 'Unable to load this PDF.')
  }

  const handleFirstPageLoad = ({ width, height }) => {
    setFirstPageSize({ width, height })
    if (!readyReported.current) {
      readyReported.current = true
      onReady?.()
    }
  }

  const goToPage = (nextPage) => {
    if (!numPages) return
    const safePage = clamp(Math.round(nextPage), 1, numPages)
    navigationTarget.current = safePage
    setPageNumber(safePage)
    setRenderRange(getRenderRange(safePage, numPages))
  }

  const handlePageInputCommit = () => {
    const parsedPage = Number.parseInt(pageInput, 10)
    if (!Number.isFinite(parsedPage)) {
      setPageInput(String(pageNumber))
      return
    }
    goToPage(parsedPage)
  }

  const changeScale = (amount) => {
    setScale(current => clamp(Number((current + amount).toFixed(2)), MIN_SCALE, MAX_SCALE))
  }

  const setFit = (mode) => {
    setFitMode(mode)
    setScale(1)
  }

  return (
    <div className="relative flex h-full min-h-0 flex-col bg-soft-stone/40">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-2 border-b border-hairline bg-white px-3 py-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => goToPage(pageNumber - 1)}
            disabled={!numPages || pageNumber <= 1}
            aria-label="Previous page"
            title="Previous page"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-hairline bg-white text-ink transition-colors hover:bg-soft-stone disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="px-1 font-mono text-[11px] uppercase tracking-wide text-muted">Page</span>
          <input
            value={pageInput}
            onChange={(event) => setPageInput(event.target.value.replace(/[^0-9]/g, ''))}
            onBlur={handlePageInputCommit}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.currentTarget.blur()
              }
            }}
            aria-label="Current page"
            className="h-8 w-12 rounded-lg border border-hairline bg-white px-1 text-center font-mono text-[12px] text-ink outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
          <span className="font-mono text-[12px] text-muted">/ {numPages || '—'}</span>
          <button
            type="button"
            onClick={() => goToPage(pageNumber + 1)}
            disabled={!numPages || pageNumber >= numPages}
            aria-label="Next page"
            title="Next page"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-hairline bg-white text-ink transition-colors hover:bg-soft-stone disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={() => setFit('width')}
            aria-label="Fit width"
            title="Fit width"
            className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${fitMode === 'width' ? 'border-primary bg-primary/10 text-primary' : 'border-hairline bg-white text-ink hover:bg-soft-stone'}`}
          >
            <PanelLeft size={16} />
          </button>
          <button
            type="button"
            onClick={() => setFit('page')}
            aria-label="Fit page"
            title="Fit page"
            className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${fitMode === 'page' ? 'border-primary bg-primary/10 text-primary' : 'border-hairline bg-white text-ink hover:bg-soft-stone'}`}
          >
            <Maximize size={16} />
          </button>
          <button
            type="button"
            onClick={() => changeScale(-SCALE_STEP)}
            disabled={!numPages || scale <= MIN_SCALE}
            aria-label="Zoom out"
            title="Zoom out"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-hairline bg-white text-ink transition-colors hover:bg-soft-stone disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Minus size={16} />
          </button>
          <span className="min-w-10 text-center font-mono text-[12px] text-muted">{Math.round(scale * 100)}%</span>
          <button
            type="button"
            onClick={() => changeScale(SCALE_STEP)}
            disabled={!numPages || scale >= MAX_SCALE}
            aria-label="Zoom in"
            title="Zoom in"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-hairline bg-white text-ink transition-colors hover:bg-soft-stone disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="relative min-h-0 flex-1 overflow-auto overscroll-contain">
        {loading && <PdfSkeleton progress={progress} />}

        {error && (
          <div className="absolute inset-0 z-10 flex items-center justify-center p-6 bg-soft-stone/40">
            <div className="max-w-sm rounded-xl border border-hairline bg-white p-6 text-center shadow-sm">
              <p className="font-sans text-[15px] font-medium text-ink">Unable to load this PDF</p>
              <p className="mt-2 font-sans text-[13px] text-body-muted">{error}</p>
            </div>
          </div>
        )}

        {file && (
          <Document
            file={file}
            loading={null}
            noData={null}
            error={null}
            options={pdfOptions}
            onLoadProgress={handleDocumentProgress}
            onLoadSuccess={handleDocumentLoad}
            onLoadError={handleDocumentError}
            onSourceError={handleDocumentError}
          >
            <div className="flex min-h-full flex-col items-center gap-4 px-3 py-4">
              {Array.from({ length: numPages }, (_, index) => index + 1).map(page => {
                const shouldRender = page >= renderRange.start && page <= renderRange.end
                return (
                  <div
                    key={page}
                    ref={(element) => {
                      if (element) pageRefs.current[page] = element
                      else delete pageRefs.current[page]
                    }}
                    data-page={page}
                    className="rounded-lg border border-hairline bg-white p-2 shadow-sm"
                    style={{ minHeight: estimatedPageHeight + 16 }}
                  >
                    {shouldRender && pageWidth ? (
                      <Page
                        pageNumber={page}
                        width={pageWidth}
                        devicePixelRatio={DEVICE_PIXEL_RATIO}
                        renderTextLayer={page === pageNumber}
                        renderAnnotationLayer={page === pageNumber}
                        renderForms={page === pageNumber}
                        loading={<PageSkeleton />}
                        onLoadSuccess={page === 1 ? handleFirstPageLoad : undefined}
                        className="pdf-page"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center rounded border border-dashed border-hairline bg-white/40">
                        <span className="font-mono text-[11px] text-muted">Page {page}</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </Document>
        )}
      </div>
    </div>
  )
}
