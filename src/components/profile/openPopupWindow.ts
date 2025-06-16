
/**
 * Opens a given URL in a small centered popup window.
 * Falls back to opening in a new tab if popup is blocked.
 *
 * @param url The URL to open.
 * @param title The window title.
 */
export function openPopupWindow(
  url: string,
  title: string = "My Life Stories"
) {
  const width = 600;
  const height = 700;
  const left = window.screenX + (window.outerWidth - width) / 2;
  const top = window.screenY + (window.outerHeight - height) / 2;
  
  try {
    const popup = window.open(
      url,
      title,
      `width=${width},height=${height},left=${left},top=${top},toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes`
    );
    
    // If popup was blocked, fallback to new tab
    if (!popup || popup.closed || typeof popup.closed === 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      popup.focus();
    }
  } catch (error) {
    // Fallback to new tab if popup fails
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
