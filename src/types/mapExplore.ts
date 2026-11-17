export type MapMode = 'friends' | 'readers' | 'explore';

export type ExploreCategory =
  | 'all'
  | 'places'
  | 'library'
  | 'bookstore'
  | 'cafe'
  | 'events';

export interface ReadingSpot {
  id: string;
  name: string;
  slug: string;
  category: 'library' | 'bookstore' | 'cafe' | 'park' | 'study_space';
  address: string;
  city: string;
  state?: string | null;
  country: string;
  latitude: number;
  longitude: number;
  image_url?: string | null;
  description?: string | null;
  amenities?: string[] | null;
  is_verified: boolean;
  website_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ExploreMapItem {
  id: string;
  item_type: 'reading_spot' | 'literary_event' | 'book_community';
  title: string;
  slug: string;
  category: string;
  latitude: number;
  longitude: number;
  address: string;
  city?: string | null;
  image_url?: string | null;
  description?: string | null;
  distance_km?: number | null;
  extra_meta?: Record<string, unknown> | null;
}

export interface SavedMapPlace {
  id: string;
  user_id: string;
  spot_id: string;
  notes?: string | null;
  created_at: string;
  spot?: ReadingSpot;
}

export type SelectedMapMarker =
  | {
      type: 'user' | 'self';
      id: string;
      title: string;
      subtitle?: string;
      avatarUrl?: string | null;
      imageUrl?: string | null;
      description?: string;
      lat: number;
      lng: number;
      distanceKm?: number;
      readingActivity?: string;
      freshness?: string;
      userId?: string;
    }
  | {
      type: 'spot';
      id: string;
      title: string;
      subtitle?: string;
      category: string;
      imageUrl?: string | null;
      avatarUrl?: string | null;
      lat: number;
      lng: number;
      address: string;
      city?: string;
      distanceKm?: number;
      description?: string;
      amenities?: string[];
      websiteUrl?: string;
      openingHours?: string;
      phone?: string;
      source?: string;
      sourceUrl?: string;
      isSaveable?: boolean;
      isSaved?: boolean;
    }
  | {
      type: 'event';
      id: string;
      title: string;
      subtitle?: string;
      category: string;
      imageUrl?: string | null;
      avatarUrl?: string | null;
      lat: number;
      lng: number;
      address: string;
      city?: string;
      distanceKm?: number;
      description?: string;
      startAt?: string;
      priceType?: string;
      registrationUrl?: string;
      organizerName?: string;
    };
