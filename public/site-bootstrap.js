/* Same-origin startup code: compatible with a strict script-src CSP. */
(function () {
  'use strict';

  // Apply the saved/system theme before the page paints when storage is available.
  try {
    var savedTheme = window.localStorage.getItem('sahadhyayi-theme');
    var prefersDark = window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.classList.toggle(
      'dark',
      savedTheme === 'dark' || (!savedTheme && Boolean(prefersDark))
    );
  } catch (error) {
    // Theme persistence is optional; never block application startup.
  }

  // Preserve the GitHub Pages SPA redirect convention and legacy redirect key.
  function applyLocalPath(path) {
    if (typeof path !== 'string' || !path.startsWith('/') || path.startsWith('//')) {
      return;
    }
    try {
      window.history.replaceState(null, '', path);
    } catch (error) {
      // A malformed or unsupported redirect must not prevent the app from loading.
    }
  }

  try {
    var queryPath = new URLSearchParams(window.location.search).get('p');
    if (queryPath) applyLocalPath(queryPath);
  } catch (error) {
    // Ignore invalid redirect query parameters.
  }

  try {
    var legacyPath = window.sessionStorage.getItem('redirectPath');
    if (legacyPath) {
      window.sessionStorage.removeItem('redirectPath');
      applyLocalPath(legacyPath);
    }
  } catch (error) {
    // Session storage can be unavailable in restricted browser contexts.
  }

  // Remove the static overlay independently of React. If the app bundle fails,
  // the loader should not conceal the page and make the failure look like a hang.
  function hideInitialLoader() {
    var loader = document.getElementById('loader');
    if (loader) {
      loader.style.display = 'none';
      loader.setAttribute('aria-hidden', 'true');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', hideInitialLoader, { once: true });
  } else {
    hideInitialLoader();
  }
  window.addEventListener('load', hideInitialLoader, { once: true });

  // Make a failed startup visible instead of leaving a blank page if the app
  // module fails before React mounts (for example, a missing/stale JS chunk).
  var startupErrorMessage = '';
  window.addEventListener('error', function (event) {
    if (event instanceof ErrorEvent) {
      startupErrorMessage = String(event.message || event.error && event.error.message || '').slice(0, 180);
    }
  }, true);
  window.addEventListener('unhandledrejection', function (event) {
    var reason = event.reason;
    startupErrorMessage = String(reason && reason.message || reason || '').slice(0, 180);
  }, true);

  function showStartupFailureIfUnrendered() {
    var root = document.getElementById('root');
    if (!root || root.childElementCount > 0) return;

    var panel = document.createElement('main');
    panel.setAttribute('role', 'alert');
    panel.style.cssText = 'box-sizing:border-box;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;background:#f8fafc;color:#0f172a;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;';
    var card = document.createElement('section');
    card.style.cssText = 'width:100%;max-width:560px;border:1px solid #cbd5e1;border-radius:16px;background:#fff;padding:28px;box-shadow:0 12px 40px rgba(15,23,42,.08);';
    var heading = document.createElement('h1');
    heading.textContent = 'Sahadhyayi could not start';
    heading.style.cssText = 'margin:0 0 12px;font-size:24px;line-height:1.25;';
    var message = document.createElement('p');
    message.textContent = 'The website shell loaded, but the application did not finish starting. Reload the page. If this repeats, the browser may be unable to load a required JavaScript asset.';
    message.style.cssText = 'margin:0 0 16px;line-height:1.6;';
    card.appendChild(heading);
    card.appendChild(message);

    if (startupErrorMessage) {
      var details = document.createElement('p');
      details.textContent = 'Startup diagnostic: ' + startupErrorMessage;
      details.style.cssText = 'margin:0 0 18px;font-size:12px;line-height:1.5;color:#475569;overflow-wrap:anywhere;';
      card.appendChild(details);
    }

    var button = document.createElement('button');
    button.type = 'button';
    button.textContent = 'Reload website';
    button.style.cssText = 'border:0;border-radius:8px;background:#0f172a;color:#fff;padding:10px 16px;font:inherit;font-weight:600;cursor:pointer;';
    button.addEventListener('click', function () { window.location.reload(); });
    card.appendChild(button);
    panel.appendChild(card);
    root.replaceChildren(panel);
  }

  // Start independently of the load event: a stalled module request can delay
  // window.load, but users still need a visible recovery path.
  window.setTimeout(showStartupFailureIfUnrendered, 12000);

})();
