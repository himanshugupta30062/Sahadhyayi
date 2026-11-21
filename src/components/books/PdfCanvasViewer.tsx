import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, ZoomIn, ZoomOut, Maximize2, AlertCircle, RefreshCw } from 'lucide-react';
import { loadPdfJs } from '@/utils/pdfLoader';
import { getProxiedPdfUrl, isCorsRestrictedPdf } from '@/utils/pdfProxyHelper';

interface PdfCanvasViewerProps {
  url: string;
  currentPage: number;
  readerTheme: 'light' | 'sepia' | 'dark';
  isFullscreen?: boolean;
  onTotalPagesDetected: (total: number) => void;
  onPageChange: (newPage: number) => void;
  onBlocked: () => void;
  onLoaded?: (docInfo: { numPages: number }) => void;
  onTextSelected?: (text: string) => void;
}

const DIRECT_LOAD_TIMEOUT_MS = 10000;
const PROXY_LOAD_TIMEOUT_MS = 12000;

function withTimeout<T>(promise: Promise<T>, ms: number, errorMessage: string): Promise<T> {
  let timer: any = null;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timer = setTimeout(() => reject(new Error(errorMessage)), ms);
  });
  return Promise.race([
    promise.then((res) => {
      if (timer) clearTimeout(timer);
      return res;
    }),
    timeoutPromise,
  ]);
}

export const PdfCanvasViewer: React.FC<PdfCanvasViewerProps> = ({
  url,
  currentPage,
  readerTheme,
  isFullscreen = false,
  onTotalPagesDetected,
  onPageChange,
  onBlocked,
  onLoaded,
  onTextSelected,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<any>(null);
  const activeLoadingTaskRef = useRef<any>(null);

  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [scale, setScale] = useState<number>(1.15);
  const [renderStatus, setRenderStatus] = useState<'loading' | 'rendering' | 'ready' | 'error'>('loading');
  const [statusMessage, setStatusMessage] = useState<string>('Initializing PDF reader...');
  const [triedProxy, setTriedProxy] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Load PDF Document via PDF.js with proxy fallback and strict timeouts
  useEffect(() => {
    let isCancelled = false;
    setRenderStatus('loading');
    setStatusMessage('Loading PDF document...');
    setTriedProxy(false);

    const loadDocument = async () => {
      try {
        const pdfjs = await loadPdfJs();
        if (!pdfjs) {
          throw new Error('PDF.js library could not be loaded.');
        }

        // Determine candidate URL: direct first, or proxy if known CORS
        const targetUrl = url;
        let loadedDoc = null;

        try {
          const loadingTask = pdfjs.getDocument({
            url: targetUrl,
            withCredentials: false,
            // Fetch only the pages/chunks the reader needs. This is essential for
            // large catalog PDFs and avoids downloading the complete file up front.
            disableStream: true,
            disableAutoFetch: true,
            rangeChunkSize: 64 * 1024,
          });
          activeLoadingTaskRef.current = loadingTask;
          loadedDoc = await withTimeout(
            loadingTask.promise,
            DIRECT_LOAD_TIMEOUT_MS,
            'Direct PDF load timed out'
          );
        } catch (directErr) {
          console.warn('Direct PDF load failed, attempting via Supabase proxy:', directErr);
          const proxiedUrl = getProxiedPdfUrl(url);
          if (proxiedUrl && proxiedUrl !== url) {
            setTriedProxy(true);
            setStatusMessage('Streaming PDF via secure proxy...');
            const proxyTask = pdfjs.getDocument({
              url: proxiedUrl,
              withCredentials: false,
              // The proxy preserves 206 + Content-Range for progressive reading.
              disableStream: true,
              disableAutoFetch: true,
              rangeChunkSize: 64 * 1024,
            });
            activeLoadingTaskRef.current = proxyTask;
            loadedDoc = await withTimeout(
              proxyTask.promise,
              PROXY_LOAD_TIMEOUT_MS,
              'Proxy streaming request timed out'
            );
          } else {
            throw directErr;
          }
        }

        if (isCancelled) return;

        if (loadedDoc) {
          setPdfDoc(loadedDoc);
          if (typeof loadedDoc.numPages === 'number') {
            onTotalPagesDetected(loadedDoc.numPages);
            onLoaded?.({ numPages: loadedDoc.numPages });
          }
          setRenderStatus('ready');
        }
      } catch (err: any) {
        if (isCancelled) return;
        console.error('Failed to load PDF document:', err);
        setRenderStatus('error');
        const readableMessage =
          err?.name === 'InvalidPDFException'
            ? 'The file format is invalid or not a valid PDF document.'
            : err?.message?.includes('timed out')
            ? 'Connecting to the PDF stream timed out.'
            : err?.message?.includes('CORS')
            ? 'The host restricts cross-origin PDF viewing.'
            : err?.message || 'Unable to open PDF stream.';
        setStatusMessage(readableMessage);
        onBlocked();
      }
    };

    void loadDocument();

    return () => {
      isCancelled = true;
      if (activeLoadingTaskRef.current) {
        try {
          if (typeof activeLoadingTaskRef.current.destroy === 'function') {
            activeLoadingTaskRef.current.destroy();
          }
        } catch {
          // ignore
        }
      }
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {
          // ignore
        }
      }
    };
  }, [url, retryCount, onTotalPagesDetected, onBlocked, onLoaded]);

  // Render active page onto Canvas
  const renderCurrentPage = useCallback(async () => {
    if (!pdfDoc || !canvasRef.current) return;

    if (typeof pdfDoc.getPage !== 'function') {
      setRenderStatus('ready');
      return;
    }

    if (renderTaskRef.current) {
      try {
        renderTaskRef.current.cancel();
      } catch {
        // cancellation is normal when changing pages quickly
      }
    }

    setRenderStatus('rendering');
    try {
      const page = await pdfDoc.getPage(currentPage);
      const canvas = canvasRef.current;
      if (!canvas) return;

      const viewport = page.getViewport({ scale });
      const context = canvas.getContext('2d');
      if (!context) return;

      const pixelRatio = window.devicePixelRatio || 1;
      canvas.width = Math.floor(viewport.width * pixelRatio);
      canvas.height = Math.floor(viewport.height * pixelRatio);
      canvas.style.width = `${Math.floor(viewport.width)}px`;
      canvas.style.height = `${Math.floor(viewport.height)}px`;

      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

      const renderContext = {
        canvasContext: context,
        viewport,
      };

      const task = page.render(renderContext);
      renderTaskRef.current = task;
      await task.promise;
      setRenderStatus('ready');
    } catch (err: any) {
      if (err?.name !== 'RenderingCancelledException') {
        console.error('Error rendering page:', err);
        setRenderStatus('error');
      }
    }
  }, [pdfDoc, currentPage, scale]);

  useEffect(() => {
    if (pdfDoc) {
      void renderCurrentPage();
    }
  }, [pdfDoc, currentPage, scale, renderCurrentPage]);

  // Capture text selection for Quotes & Margin notes
  useEffect(() => {
    const handleSelectionEnd = () => {
      const selection = window.getSelection();
      const text = selection ? selection.toString().trim() : '';
      if (text && onTextSelected && containerRef.current && selection?.anchorNode && containerRef.current.contains(selection.anchorNode)) {
        onTextSelected(text);
      }
    };

    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('mouseup', handleSelectionEnd);
    container.addEventListener('touchend', handleSelectionEnd);

    return () => {
      container.removeEventListener('mouseup', handleSelectionEnd);
      container.removeEventListener('touchend', handleSelectionEnd);
    };
  }, [onTextSelected]);

  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.2, 2.5));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.2, 0.6));
  const handleFitWidth = () => {
    if (containerRef.current && pdfDoc && typeof pdfDoc.getPage === 'function') {
      pdfDoc.getPage(currentPage).then((page: any) => {
        const unscaled = page.getViewport({ scale: 1.0 });
        const availWidth = (containerRef.current?.clientWidth || 700) - 48;
        const newScale = Math.max(0.6, Math.min(availWidth / unscaled.width, 2.2));
        setScale(newScale);
      }).catch(() => setScale(1.0));
    } else {
      setScale(1.0);
    }
  };

  const backdropBg =
    readerTheme === 'dark'
      ? 'bg-gray-900 text-gray-100'
      : readerTheme === 'sepia'
      ? 'bg-[#f5ebd7] text-[#4a3c28]'
      : 'bg-muted/30 text-gray-900';

  return (
    <div
      ref={containerRef}
      className={`relative w-full flex flex-col items-center justify-start rounded-2xl border border-border shadow-sm overflow-hidden select-text ${backdropBg} ${
        isFullscreen ? 'min-h-screen py-6' : 'min-h-[650px] py-4'
      }`}
    >
      {/* Quick In-Viewer Canvas Controls */}
      <div className="sticky top-2 z-20 mb-3 px-3 py-1.5 rounded-full bg-background/90 backdrop-blur border border-border/80 shadow-sm flex items-center gap-1 text-xs">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleZoomOut}
          disabled={scale <= 0.6}
          className="h-7 w-7 p-0 rounded-full"
          title="Zoom out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </Button>
        <span className="font-mono text-[11px] px-1 text-muted-foreground w-12 text-center">
          {Math.round(scale * 100)}%
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleZoomIn}
          disabled={scale >= 2.5}
          className="h-7 w-7 p-0 rounded-full"
          title="Zoom in"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </Button>
        <span className="h-3 w-px bg-border mx-1" />
        <Button
          variant="ghost"
          size="sm"
          onClick={handleFitWidth}
          className="h-7 px-2 text-[11px] rounded-full"
          title="Fit width"
        >
          Fit Width
        </Button>
      </div>

      {/* Loading & Rendering Indicators */}
      {(renderStatus === 'loading' || renderStatus === 'rendering') && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 bg-background/80 backdrop-blur-sm">
          <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
          <p className="text-xs sm:text-sm font-medium">{statusMessage}</p>
          <p className="text-[11px] text-muted-foreground mt-1">Page {currentPage}</p>
        </div>
      )}

      {/* Error Fallback with Switch to Native Embed & Retry */}
      {renderStatus === 'error' && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 bg-background/95 backdrop-blur-sm text-center">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h4 className="text-sm sm:text-base font-serif font-bold mb-1">
            Inline PDF Preview Restricted
          </h4>
          <p className="text-xs text-muted-foreground max-w-sm mb-4 leading-relaxed">
            {statusMessage}
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            <Button
              variant="default"
              size="sm"
              onClick={onBlocked}
              className="text-xs"
            >
              Switch to Native Embed
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRetryCount((prev) => prev + 1)}
              className="text-xs gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry
            </Button>
            {url && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
                className="text-xs"
              >
                Open in New Window ↗
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Canvas Element */}
      <div className="w-full flex justify-center overflow-x-auto px-2 pb-6">
        <canvas
          ref={canvasRef}
          className="shadow-2xl rounded-md bg-white border border-border/60 transition-transform duration-100"
          style={{ maxWidth: '100%' }}
        />
      </div>
    </div>
  );
};
