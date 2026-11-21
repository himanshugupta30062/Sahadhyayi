/**
 * Dynamic loader for PDF.js library to ensure zero-bundle-bloat on initial page load.
 */

const PDFJS_CDN_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
const PDFJS_WORKER_CDN_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
const PDFJS_INTEGRITY = 'sha512-q+4liFwdPC/bNdhUpZx6aXDx/h77yEQtn4I1slHydcbZK34nLaR3cAeYSJshoxIOq3mjEf7xJE8YWIUHMn+oCQ==';
const SCRIPT_LOAD_TIMEOUT_MS = 10000;

let pdfJsPromise: Promise<any> | null = null;

export const isPdfJsLoaded = (): boolean => {
  return typeof window !== 'undefined' && Boolean((window as any).pdfjsLib);
};

export const resetPdfJsPromiseForTesting = (): void => {
  pdfJsPromise = null;
};

export const loadPdfJs = async (): Promise<any> => {
  if (typeof window === 'undefined') return null;

  if ((window as any).pdfjsLib) {
    const pdfjs = (window as any).pdfjsLib;
    if (pdfjs.GlobalWorkerOptions && !pdfjs.GlobalWorkerOptions.workerSrc) {
      pdfjs.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_CDN_URL;
    }
    return pdfjs;
  }

  if (pdfJsPromise !== null) return pdfJsPromise;

  pdfJsPromise = new Promise((resolve, reject) => {
    let timeoutId: any = null;
    let pollInterval: any = null;

    const cleanup = () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (pollInterval) clearInterval(pollInterval);
    };

    const handleSuccess = (lib: any) => {
      cleanup();
      try {
        if (lib?.GlobalWorkerOptions && !lib.GlobalWorkerOptions.workerSrc) {
          lib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_CDN_URL;
        }
      } catch {
        // ignore
      }
      resolve(lib);
    };

    const handleError = (err: Error) => {
      cleanup();
      pdfJsPromise = null;
      reject(err);
    };

    // Watchdog timeout to prevent indefinite hanging
    timeoutId = setTimeout(() => {
      handleError(new Error('Failed to load PDF.js script from CDN (timeout)'));
    }, SCRIPT_LOAD_TIMEOUT_MS);

    // Check if script tag already exists
    const existingScript = document.querySelector(`script[src*="pdf.min.js"]`) as HTMLScriptElement | null;
    if (existingScript) {
      // Check if library already loaded in window
      if ((window as any).pdfjsLib) {
        handleSuccess((window as any).pdfjsLib);
        return;
      }

      // Poll periodically in case script has finished executing but load event already passed
      pollInterval = setInterval(() => {
        if ((window as any).pdfjsLib) {
          handleSuccess((window as any).pdfjsLib);
        }
      }, 50);

      existingScript.addEventListener('load', () => {
        handleSuccess((window as any).pdfjsLib);
      });
      existingScript.addEventListener('error', () => {
        handleError(new Error('Failed to load PDF.js script from CDN'));
      });
      return;
    }

    const script = document.createElement('script');
    script.src = PDFJS_CDN_URL;
    script.integrity = PDFJS_INTEGRITY;
    script.crossOrigin = 'anonymous';
    script.referrerPolicy = 'no-referrer';

    script.onload = () => {
      handleSuccess((window as any).pdfjsLib);
    };

    script.onerror = () => {
      handleError(new Error('Failed to load PDF.js script from CDN'));
    };

    document.head.appendChild(script);
  });

  return pdfJsPromise;
};
