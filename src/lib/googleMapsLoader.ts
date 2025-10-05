
declare global {
  interface Window {
    google: any;
    initGoogleMaps?: () => void;
    googleMapsLoadingPromise?: Promise<void>;
  }
}

export const loadGoogleMaps = (apiKey: string): Promise<void> => {
  // Validate API key
  if (!apiKey || apiKey.trim() === '' || apiKey.length < 20) {
    console.error('Invalid Google Maps API key:', apiKey ? 'too short' : 'missing');
    return Promise.reject(new Error('Invalid Google Maps API key. Please check your configuration.'));
  }

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
      console.log('Google Maps loaded successfully');
      resolve();
      // Clean up
      delete window[callbackName];
    };

    // Create script element
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=${callbackName}`;
    script.async = true;
    script.defer = true;
    
    script.onerror = (error) => {
      console.error('Failed to load Google Maps script:', error);
      const errorMessage = 'Failed to load Google Maps. Please check: 1) API key is valid, 2) Maps JavaScript API is enabled, 3) Domain is whitelisted in Google Cloud Console.';
      reject(new Error(errorMessage));
      delete window[callbackName];
      delete window.googleMapsLoadingPromise;
    };

    // Append script to head
    document.head.appendChild(script);
  });

  return window.googleMapsLoadingPromise;
};
