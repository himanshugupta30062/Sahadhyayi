import * as htmlToImage from 'html-to-image';
import JSZip from 'jszip';

export interface ExportProgressCallback {
  (current: number, total: number, message: string): void;
}

/**
 * Downloads a Blob directly to the client browser.
 */
export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Converts a DOM element to a high-DPI (2x retina) PNG data URL.
 */
export async function renderElementToPngDataUrl(
  element: HTMLElement,
  pixelRatio: number = 2
): Promise<string> {
  return htmlToImage.toPng(element, {
    pixelRatio,
    cacheBust: true,
    quality: 0.98,
    filter: (node) => {
      // Exclude interactive overlay tools if any
      if (node instanceof HTMLElement && node.dataset.exportIgnore === 'true') {
        return false;
      }
      return true;
    },
  });
}

/**
 * Exports a single slide to a PNG file download.
 */
export async function exportSlideToPng(
  element: HTMLElement,
  fileName: string = 'sahadhyayi-post.png'
): Promise<void> {
  const dataUrl = await renderElementToPngDataUrl(element, 2);
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  downloadBlob(blob, fileName);
}

/**
 * Copies a rendered canvas slide directly to the user's clipboard.
 */
export async function copySlideToClipboard(element: HTMLElement): Promise<boolean> {
  try {
    const dataUrl = await renderElementToPngDataUrl(element, 2);
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
      const item = new ClipboardItem({ 'image/png': blob });
      await navigator.clipboard.write([item]);
      return true;
    }
    return false;
  } catch (err) {
    console.error('Failed to copy image to clipboard:', err);
    return false;
  }
}

/**
 * Shares the rendered slide using the Mobile Web Share API.
 */
export async function shareSlideViaWebShare(
  element: HTMLElement,
  title: string,
  text: string,
  fileName: string = 'sahadhyayi-post.png'
): Promise<boolean> {
  try {
    const dataUrl = await renderElementToPngDataUrl(element, 2);
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const file = new File([blob], fileName, { type: 'image/png' });

    if (
      typeof navigator !== 'undefined' &&
      navigator.canShare &&
      navigator.canShare({ files: [file] })
    ) {
      await navigator.share({
        files: [file],
        title,
        text,
      });
      return true;
    }
    return false;
  } catch (err) {
    if ((err as Error)?.name === 'AbortError') {
      return false; // User dismissed share sheet
    }
    console.error('Web share failed:', err);
    return false;
  }
}

/**
 * Renders multiple slides and bundles them into a ZIP archive along with caption text.
 */
export async function exportCarouselToZip(
  renderSlideAtIndex: (index: number) => Promise<HTMLElement | null>,
  totalSlides: number,
  captionText: string,
  baseFileName: string = 'sahadhyayi-carousel',
  onProgress?: ExportProgressCallback
): Promise<void> {
  const zip = new JSZip();

  for (let i = 0; i < totalSlides; i++) {
    onProgress?.(i + 1, totalSlides, `Rendering slide ${i + 1} of ${totalSlides}...`);
    const element = await renderSlideAtIndex(i);
    if (!element) continue;

    // Small delay to allow react DOM paint
    await new Promise((resolve) => setTimeout(resolve, 80));

    const dataUrl = await renderElementToPngDataUrl(element, 2);
    const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
    const slideNumber = String(i + 1).padStart(2, '0');
    zip.file(`slide-${slideNumber}.png`, base64Data, { base64: true });
  }

  // Include caption and hashtags text file
  if (captionText) {
    zip.file('caption-and-hashtags.txt', captionText);
  }

  onProgress?.(totalSlides, totalSlides, 'Compressing carousel ZIP...');
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  downloadBlob(zipBlob, `${baseFileName}.zip`);
}
