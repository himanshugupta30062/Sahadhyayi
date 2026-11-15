import React from 'react';
import { Compass, Locate, Minus, Plus } from 'lucide-react';

interface MapFloatingControlsProps {
  onRecenter: () => void;
  onResetView: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  hasUserLocation: boolean;
}

export const MapFloatingControls: React.FC<MapFloatingControlsProps> = ({
  onRecenter,
  onResetView,
  onZoomIn,
  onZoomOut,
  hasUserLocation,
}) => {
  return (
    <div className="absolute right-3 sm:right-4 bottom-24 sm:bottom-28 z-30 flex flex-col gap-2 pointer-events-auto select-none">
      {/* Recenter My Location */}
      <button
        type="button"
        onClick={onRecenter}
        title={hasUserLocation ? 'Recenter on my location' : 'Turn on location to center on yourself'}
        className="w-10 h-10 rounded-2xl bg-white/95 dark:bg-[#111614]/95 backdrop-blur-md border border-[#E5DED2] dark:border-[#29332D] shadow-md flex items-center justify-center text-[#1C442D] dark:text-[#D5B16D] transition active:scale-95 hover:bg-[#FAF7F2] dark:hover:bg-[#1A221E] cursor-pointer"
      >
        <Locate className="w-5 h-5" />
      </button>

      {/* Recenter / Reset View (India / All Markers) */}
      <button
        type="button"
        onClick={onResetView}
        title="Fit all markers in view"
        className="w-10 h-10 rounded-2xl bg-white/95 dark:bg-[#111614]/95 backdrop-blur-md border border-[#E5DED2] dark:border-[#29332D] shadow-md flex items-center justify-center text-[#3F4842] dark:text-[#CBD5CD] transition active:scale-95 hover:bg-[#FAF7F2] dark:hover:bg-[#1A221E] cursor-pointer"
      >
        <Compass className="w-5 h-5" />
      </button>

      {/* Zoom In & Zoom Out group if handlers provided */}
      {onZoomIn && onZoomOut && (
        <div className="flex flex-col rounded-2xl overflow-hidden bg-white/95 dark:bg-[#111614]/95 backdrop-blur-md border border-[#E5DED2] dark:border-[#29332D] shadow-md">
          <button
            type="button"
            onClick={onZoomIn}
            title="Zoom In"
            className="w-10 h-10 flex items-center justify-center text-[#3F4842] dark:text-[#CBD5CD] hover:bg-[#FAF7F2] dark:hover:bg-[#1A221E] transition active:scale-95 cursor-pointer border-b border-[#E5DED2] dark:border-[#29332D]"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onZoomOut}
            title="Zoom Out"
            className="w-10 h-10 flex items-center justify-center text-[#3F4842] dark:text-[#CBD5CD] hover:bg-[#FAF7F2] dark:hover:bg-[#1A221E] transition active:scale-95 cursor-pointer"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
