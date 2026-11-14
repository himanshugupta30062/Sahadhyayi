/**
 * Dynamic loader for PDF.js library to ensure zero-bundle-bloat on initial page load.
 */

const PDFJS_CDN_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
const PDFJS_WORKER_CDN_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
const PDFJS_INTEGRITY = 'sha512-q+4liFwdPC/bNdhUpZx6aXDx/h77yEQtn4I1slHydcbZK34nLaR3cAeYSJshoxIOq3mjEf7xJE8YWIUHMn+oCQ==';

let pdfJsPromise: Promise<any> | null = null;

export const isPdfJsLoaded = (): boolean => {
  return typeof window !== 'undefined' && Boolean((window as any).pdfjsLib);
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

  if (pdfJsPromise) return pdfJsPromise;

  pdfJsPromise = new Promise((resolve, reject) => {
    // Check if script tag already exists
    const existingScript = document.querySelector(`script[src*="pdf.min.js"]`) as HTMLScriptElement | null;
    if (existingScript) {
      existingScript.addEventListener('load', () => {
        const lib = (window as any).pdfjsLib;
        if (lib?.GlobalWorkerOptions) {
          lib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_CDN_URL;
        }
        resolve(lib);
      });
      existingScript.addEventListener('error', (e) => reject(e));
      return;
    }

    const script = document.createElement('script');
    script.src = PDFJS_CDN_URL;
    script.integrity = PDFJS_INTEGRITY;
    script.crossOrigin = 'anonymous';
    script.referrerPolicy = 'no-referrer';

    script.onload = () => {
      try {
        const lib = (window as any).pdfjsLib;
        if (lib?.GlobalWorkerOptions) {
          lib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_CDN_URL;
        }
        resolve(lib);
      } catch (err) {
        resolve((window as any).pdfjsLib);
      }
    };

    script.onerror = (err) => {
      pdfJsPromise = null;
      reject(err);
    };

    document.head.appendChild(script);
  });

  return pdfJsPromise;
};
