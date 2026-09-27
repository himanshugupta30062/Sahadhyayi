// Google Maps API Configuration
// This is a publishable key that's meant to be used in the browser
// Make sure to restrict it to your domain in Google Cloud Console

// Note: For production, configure this key in your environment and restrict it
// in the Google Cloud Console to only work on your domains
export const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

// Instructions to get your API key:
// 1. Go to https://console.cloud.google.com/
// 2. Create a new project or select existing one
// 3. Enable "Maps JavaScript API"
// 4. Create credentials (API Key)
// 5. Restrict the key to your domain (sahadhyayi.com and lovable.app domains)
// 6. Add the key to your environment as VITE_GOOGLE_MAPS_API_KEY
