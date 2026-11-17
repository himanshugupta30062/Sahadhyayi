import React from 'react';
import { Link } from 'react-router-dom';
import {
  Bookmark,
  BookmarkCheck,
  Calendar,
  ExternalLink,
  MapPin,
  MessageCircle,
  Navigation,
  Share2,
  User,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { SelectedMapMarker } from '@/types/mapExplore';
import { useSavedMapPlaces } from '@/hooks/useExploreSpots';
import { toast } from 'sonner';

interface MapBottomSheetPreviewProps {
  marker: SelectedMapMarker | null;
  onClose: () => void;
}

export const MapBottomSheetPreview: React.FC<MapBottomSheetPreviewProps> = ({
  marker,
  onClose,
}) => {
  const { isSaved, savePlace, removePlace, isSaving } = useSavedMapPlaces();

  if (!marker) return null;

  const handleToggleSave = async () => {
    if (marker.type !== 'spot') return;
    try {
      if (isSaved(marker.id)) {
        await removePlace({ spotId: marker.id });
        toast.success(`Removed ${marker.title} from your saved places.`);
      } else {
        await savePlace({ spotId: marker.id });
        toast.success(`Saved ${marker.title} to your favorite reading spots!`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update saved place.');
    }
  };

  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${marker.lat},${marker.lng}`;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 p-3 sm:p-4 max-w-xl mx-auto pointer-events-auto transition-transform duration-300 ease-out animate-in slide-in-from-bottom-6">
      <div className="bg-white/95 dark:bg-[#111614]/95 backdrop-blur-xl border border-[#E5DED2] dark:border-[#29332D] rounded-3xl p-4 sm:p-5 shadow-2xl space-y-4">
        {/* Drag Handle Bar & Close */}
        <div className="flex items-center justify-between -mt-1">
          <div className="w-12 h-1.5 bg-neutral-300 dark:bg-neutral-700 rounded-full mx-auto" />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close preview"
            className="p-1 rounded-full text-muted-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800 transition -mr-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Header */}
        <div className="flex items-start gap-3.5">
          {/* Avatar / Place Image */}
          <div className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-2xl overflow-hidden shrink-0 border border-[#E5DED2] dark:border-[#29332D] bg-[#F7F4EE] dark:bg-[#1A221E] shadow-xs">
            {marker.type === 'user' || marker.type === 'self' ? (
              marker.avatarUrl ? (
                <img src={marker.avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-bold text-lg text-[#1C442D] dark:text-[#D5B16D]">
                  {(marker.title.trim().charAt(0) || 'R').toUpperCase()}
                </div>
              )
            ) : marker.imageUrl ? (
              <img src={marker.imageUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl">
                {marker.type === 'spot' ? '🏛️' : '🎭'}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                variant="outline"
                className="text-[10px] font-bold uppercase tracking-wider border-[#D5B16D] text-[#8F681C] dark:text-[#D5B16D] bg-amber-50/50 dark:bg-amber-950/20"
              >
                {marker.type === 'self'
                  ? 'Your Location'
                  : marker.type === 'user'
                    ? 'Reader'
                    : marker.type === 'spot'
                      ? marker.category
                      : 'Literary Event'}
              </Badge>
              {marker.distanceKm != null && (
                <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                  {marker.distanceKm.toFixed(1)} km away
                </span>
              )}
            </div>

            <h3 className="text-base sm:text-lg font-serif font-bold text-[#1C201D] dark:text-[#F3F0E7] truncate leading-tight">
              {marker.title}
            </h3>

            {marker.type === 'user' && marker.readingActivity && (
              <p className="text-xs text-[#636B65] dark:text-[#A5ADA6] line-clamp-1">
                📖 {marker.readingActivity}
              </p>
            )}

            {marker.type === 'spot' && marker.address && (
              <p className="text-xs text-[#636B65] dark:text-[#A5ADA6] line-clamp-1 flex items-center gap-1">
                <MapPin className="w-3 h-3 shrink-0" />
                <span>{marker.address}{marker.city ? `, ${marker.city}` : ''}</span>
              </p>
            )}

            {marker.type === 'event' && marker.startAt && (
              <p className="text-xs text-[#636B65] dark:text-[#A5ADA6] line-clamp-1 flex items-center gap-1">
                <Calendar className="w-3 h-3 shrink-0 text-purple-600 dark:text-purple-400" />
                <span>{new Date(marker.startAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                {marker.priceType && <span className="opacity-75 font-medium">({marker.priceType})</span>}
              </p>
            )}
          </div>
        </div>

        {marker.type === 'spot' && (marker.openingHours || marker.phone || marker.source) && (
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[#636B65] dark:text-[#A5ADA6]">
            {marker.openingHours && <span>Hours: {marker.openingHours}</span>}
            {marker.phone && <a href={`tel:${marker.phone}`} className="underline underline-offset-2">{marker.phone}</a>}
            {marker.source && <span>Source: {marker.source}</span>}
            {marker.sourceUrl && <a href={marker.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">View map data</a>}
          </div>
        )}

        {/* Description snippet if present */}
        {marker.type !== 'user' && marker.type !== 'self' && marker.description && (
          <p className="text-xs text-[#4F5751] dark:text-[#CBD5CD] line-clamp-2 leading-relaxed">
            {marker.description}
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-1 border-t border-[#EAE3D6] dark:border-[#222A25]">
          {marker.type === 'user' && marker.userId && (
            <>
              <Link to={`/messages?recipient=${marker.userId}`} className="flex-1">
                <Button size="sm" className="w-full gap-1.5 rounded-xl bg-[#1C442D] hover:bg-[#153422] text-white text-xs h-9">
                  <MessageCircle className="w-3.5 h-3.5" />
                  Say Hello
                </Button>
              </Link>
              <Link to={`/authors`} className="flex-1">
                <Button size="sm" variant="outline" className="w-full gap-1.5 rounded-xl text-xs h-9 border-[#DCD5C9] dark:border-[#29332D]">
                  <User className="w-3.5 h-3.5" />
                  View Profile
                </Button>
              </Link>
            </>
          )}

          {marker.type === 'spot' && (
            <>
              {marker.isSaveable !== false && (
              <Button
                size="sm"
                variant={isSaved(marker.id) ? 'default' : 'outline'}
                onClick={handleToggleSave}
                disabled={isSaving}
                className="flex-1 gap-1.5 rounded-xl text-xs h-9"
              >
                {isSaved(marker.id) ? (
                  <>
                    <BookmarkCheck className="w-3.5 h-3.5" />
                    Saved
                  </>
                ) : (
                  <>
                    <Bookmark className="w-3.5 h-3.5" />
                    Save Place
                  </>
                )}
              </Button>
              )}
              <a
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1"
              >
                <Button size="sm" className="w-full gap-1.5 rounded-xl bg-[#1C442D] hover:bg-[#153422] text-white text-xs h-9">
                  <Navigation className="w-3.5 h-3.5" />
                  Directions
                </Button>
              </a>
              {marker.websiteUrl && (
                <a
                  href={marker.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0"
                >
                  <Button size="sm" variant="outline" className="rounded-xl h-9 w-9 p-0 border-[#DCD5C9] dark:border-[#29332D]" title="Visit official website">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Button>
                </a>
              )}
            </>
          )}

          {marker.type === 'event' && (
            <>
              <a
                href={marker.registrationUrl || directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1"
              >
                <Button size="sm" className="w-full gap-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs h-9">
                  <Calendar className="w-3.5 h-3.5" />
                  {marker.registrationUrl ? 'Register / Details' : 'View Location'}
                </Button>
              </a>
              <a
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1"
              >
                <Button size="sm" variant="outline" className="w-full gap-1.5 rounded-xl text-xs h-9 border-[#DCD5C9] dark:border-[#29332D]">
                  <Navigation className="w-3.5 h-3.5" />
                  Directions
                </Button>
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
