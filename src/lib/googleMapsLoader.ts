
declare global {
  interface Window {
    google: any;
    initGoogleMaps?: () => void;
    googleMapsLoadingPromise?: Promise<void>;
  }
}

export const loadGoogleMaps = (apiKey: string): Promise<void> => {
  // Return existing promise if maps are already loading
  if (window.googleMapsLoadingPromise) {
    return window.googleMapsLoadingPromise;
  }

  // Return resolved promise if maps are already loaded
  if (window.google && window.google.maps) {
    return Promise.resolve();
  }

  // Create new loading promise
  window.googleMapsLoadingPromise = new Promise((resolve, reject) => {
    // Create callback function name
    const callbackName = 'initGoogleMaps';
    
    // Set up callback
    window[callbackName] = () => {
      resolve();
      // Clean up
      delete window[callbackName];
    };

    // Create script element
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=${callbackName}`;
    script.async = true;
    script.defer = true;
    
    script.onerror = () => {
      reject(new Error('Failed to load Google Maps API'));
      delete window[callbackName];
      delete window.googleMapsLoadingPromise;
    };

    // Append script to head
    document.head.appendChild(script);
  });

  return window.googleMapsLoadingPromise;
};
