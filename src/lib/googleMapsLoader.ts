export const loadGoogleMaps = (apiKey: string): Promise<void> => {
  if (typeof window === 'undefined') return Promise.reject(new Error('No window'));

  if ((window as any).google && (window as any).google.maps) {
    return Promise.resolve();
  }

  if ((window as any).googleMapsLoadingPromise) {
    return (window as any).googleMapsLoadingPromise;
  }

  (window as any).googleMapsLoadingPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector('script[data-google-maps]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve());
      existingScript.addEventListener('error', () => reject(new Error('Failed to load script')));
      return;
    }
    (window as any).initGoogleMaps = () => {
      resolve();
    };
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initGoogleMaps`;
    script.async = true;
    script.defer = true;
    script.dataset.googleMaps = 'true';
    script.onerror = () => reject(new Error('Failed to load Google Maps'));
    document.head.appendChild(script);
  });

  return (window as any).googleMapsLoadingPromise;
};
