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
  onTextSelected?: (text: string) => void;
}

export const PdfCanvasViewer: React.FC<PdfCanvasViewerProps> = ({
  url,
  currentPage,
  readerTheme,
  isFullscreen = false,
  onTotalPagesDetected,
  onPageChange,
  onBlocked,
  onTextSelected,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<any>(null);

  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [scale, setScale] = useState<number>(1.15);
  const [renderStatus, setRenderStatus] = useState<'loading' | 'rendering' | 'ready' | 'error'>('loading');
  const [statusMessage, setStatusMessage] = useState<string>('Initializing PDF reader...');
  const [triedProxy, setTriedProxy] = useState(false);

  // Load PDF Document via PDF.js with proxy fallback
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
          });
          loadedDoc = await loadingTask.promise;
        } catch (directErr) {
          console.warn('Direct PDF load failed, attempting via Supabase proxy:', directErr);
          if (isCorsRestrictedPdf(url)) {
            const proxiedUrl = getProxiedPdfUrl(url);
            if (proxiedUrl && proxiedUrl !== url) {
              setTriedProxy(true);
              setStatusMessage('Streaming PDF via secure proxy...');
              const proxyTask = pdfjs.getDocument({
                url: proxiedUrl,
                withCredentials: false,
              });
              loadedDoc = await proxyTask.promise;
            } else {
              throw directErr;
            }
          } else {
            throw directErr;
          }
        }

        if (isCancelled) return;

        if (loadedDoc) {
          setPdfDoc(loadedDoc);
          if (typeof loadedDoc.numPages === 'number') {
            onTotalPagesDetected(loadedDoc.numPages);
          }
          setRenderStatus('ready');
        }
      } catch (err: any) {
        if (isCancelled) return;
        console.error('Failed to load PDF document:', err);
        setRenderStatus('error');
        setStatusMessage(err?.message || 'Unable to open PDF stream.');
        onBlocked();
      }
    };

    void loadDocument();

    return () => {
      isCancelled = true;
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {
          // ignore
        }
      }
    };
  }, [url, onTotalPagesDetected, onBlocked]);

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
    if (pdfDoc && renderStatus !== 'loading') {
      void renderCurrentPage();
    }
  }, [pdfDoc, currentPage, scale, renderStatus, renderCurrentPage]);

  // Capture text selection for Quotes & Margin notes
  const handleMouseUp = () => {
    const selection = window.getSelection();
    const text = selection ? selection.toString().trim() : '';
    if (text && onTextSelected) {
      onTextSelected(text);
    }
  };

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
      onMouseUp={handleMouseUp}
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
