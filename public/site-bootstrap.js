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
})();
