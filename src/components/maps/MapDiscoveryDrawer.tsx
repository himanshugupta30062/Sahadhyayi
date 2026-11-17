import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import type { ExploreMapItem, MapMode, SelectedMapMarker } from '@/types/mapExplore';

interface MapDiscoveryDrawerProps {
  mode: MapMode;
  items: ExploreMapItem[];
  readers: Array<{
    user_id: string;
    latitude: number | null;
    longitude: number | null;
    avatar_img_url?: string | null;
    profiles?: { full_name: string | null; username: string | null };
    distance?: number;
    book_title?: string;
  }>;
  onSelectItem: (marker: SelectedMapMarker) => void;
}

const getExploreItemIcon = (item: ExploreMapItem): string => {
  if (item.item_type === 'literary_event') return '🎭';
  if (item.category === 'library') return '🏛️';
  if (item.category === 'bookstore') return '📚';
  if (item.category === 'cafe') return '☕';
  return '📍';
};

const getExploreItemLabel = (item: ExploreMapItem): string => {
  if (item.item_type === 'literary_event') return 'Literary event';
  if (item.category === 'library') return 'Library';
  if (item.category === 'bookstore') return 'Bookstore';
  if (item.category === 'cafe') return 'Café · verify reading suitability';
  return 'Reading spot';
};

export const MapDiscoveryDrawer: React.FC<MapDiscoveryDrawerProps> = ({
  mode,
  items,
  readers,
  onSelectItem,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const hasContent = mode === 'explore' ? items.length > 0 : readers.length > 0;
  if (!hasContent) return null;

  return (
    <div className="fixed inset-x-0 bottom-4 z-30 px-3 sm:px-4 max-w-2xl mx-auto pointer-events-auto select-none">
      <div className="bg-white/90 dark:bg-[#111614]/90 backdrop-blur-xl border border-[#E5DED2] dark:border-[#29332D] rounded-3xl p-3 shadow-xl space-y-2">
        {/* Header Toggle */}
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="w-full flex items-center justify-between px-2 text-xs font-bold text-[#1C442D] dark:text-[#D5B16D] cursor-pointer"
        >
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#D5B16D]" />
            <span className="uppercase tracking-wider">
              {mode === 'explore'
                ? `Explore Nearby (${items.length})`
                : mode === 'readers'
                  ? `Active Readers (${readers.length})`
                  : 'Friends on Map'}
            </span>
          </div>
          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>

        {/* Carousel items */}
        {isExpanded && (
          <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar pt-1 pb-1">
            {mode === 'explore' &&
              items.slice(0, 10).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() =>
                    onSelectItem({
                      type: item.item_type === 'literary_event' ? 'event' : 'spot',
                      id: item.id,
                      title: item.title,
                      category: item.category,
                      imageUrl: item.image_url,
                      lat: item.latitude,
                      lng: item.longitude,
                      address: item.address,
                      city: item.city ?? undefined,
                      distanceKm: item.distance_km ?? undefined,
                      description: item.description ?? undefined,
                      ...(item.item_type === 'literary_event' ? {} : {
                        websiteUrl: (item.extra_meta as Record<string, unknown> | undefined)?.website_url as string | undefined,
                        openingHours: (item.extra_meta as Record<string, unknown> | undefined)?.opening_hours as string | undefined,
                        phone: (item.extra_meta as Record<string, unknown> | undefined)?.phone as string | undefined,
                        source: (item.extra_meta as Record<string, unknown> | undefined)?.source as string | undefined,
                        sourceUrl: (item.extra_meta as Record<string, unknown> | undefined)?.osm_url as string | undefined,
                        isSaveable: (item.extra_meta as Record<string, unknown> | undefined)?.source !== 'OpenStreetMap',
                      }),
                      startAt: (item.extra_meta as Record<string, unknown> | undefined)?.start_at as string | undefined,
                      priceType: (item.extra_meta as Record<string, unknown> | undefined)?.price_type as string | undefined,
                      registrationUrl: (item.extra_meta as Record<string, unknown> | undefined)?.registration_url as string | undefined,
                    })
                  }
                  className="flex items-center gap-2.5 p-2 rounded-2xl border border-[#E5DED2] dark:border-[#29332D] bg-[#FAF7F2] dark:bg-[#161D19] shrink-0 w-52 text-left hover:border-[#1C442D] dark:hover:border-[#D5B16D] transition shadow-2xs cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 bg-[#E8EFE9] dark:bg-[#1C3024] flex items-center justify-center font-bold text-sm">
                    {item.image_url ? (
                      <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      getExploreItemIcon(item)
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-[#1C201D] dark:text-[#F3F0E7] truncate">
                      {item.title}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {item.distance_km != null ? `${getExploreItemLabel(item)} · ${item.distance_km} km away` : `${getExploreItemLabel(item)}${item.city ? ` · ${item.city}` : ''}`}
                    </p>
                  </div>
                </button>
              ))}

            {mode === 'readers' &&
              readers.map((reader) => (
                <button
                  key={reader.user_id}
                  type="button"
                  onClick={() => {
                    if (reader.latitude != null && reader.longitude != null) {
                      onSelectItem({
                        type: 'user',
                        id: reader.user_id,
                        userId: reader.user_id,
                        title: reader.profiles?.full_name || reader.profiles?.username || 'Reader',
                        avatarUrl: reader.avatar_img_url,
                        lat: reader.latitude,
                        lng: reader.longitude,
                        distanceKm: reader.distance,
                        readingActivity: reader.book_title || 'Reading this book',
                      });
                    }
                  }}
                  className="flex items-center gap-2.5 p-2 rounded-2xl border border-[#E5DED2] dark:border-[#29332D] bg-[#FAF7F2] dark:bg-[#161D19] shrink-0 w-48 text-left hover:border-[#1C442D] transition shadow-2xs cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-amber-400 bg-[#E8EFE9] dark:bg-[#1C3024] flex items-center justify-center font-bold text-xs text-[#1C442D] dark:text-[#D5B16D]">
                    {reader.avatar_img_url ? (
                      <img src={reader.avatar_img_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      (reader.profiles?.full_name || 'R').charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-[#1C201D] dark:text-[#F3F0E7] truncate">
                      {reader.profiles?.full_name || 'Reader'}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {reader.distance != null ? `${reader.distance.toFixed(1)} km away` : 'Nearby'}
                    </p>
                  </div>
                </button>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};
