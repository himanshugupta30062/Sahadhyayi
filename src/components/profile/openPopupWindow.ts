
/**
 * Opens a given URL in a small centered popup window.
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
  window.open(
    url,
    title,
    `width=${width},height=${height},left=${left},top=${top},toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes`
  );
}
