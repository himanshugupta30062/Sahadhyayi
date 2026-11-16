import React from 'react';
import { Compass, Locate, Minus, Plus } from 'lucide-react';

interface MapFloatingControlsProps {
  onRecenter: () => void;
  onResetView: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  is3D?: boolean;
  onToggle3D?: () => void;
  hasUserLocation: boolean;
}

export const MapFloatingControls: React.FC<MapFloatingControlsProps> = ({
  onRecenter,
  onResetView,
  onZoomIn,
  onZoomOut,
  is3D = false,
  onToggle3D,
  hasUserLocation,
}) => {
  return (
    <div className="absolute right-3 sm:right-4 bottom-24 sm:bottom-28 z-30 flex flex-col gap-2 pointer-events-auto select-none">
      {/* 3D / 2D Perspective Toggle */}
      {onToggle3D && (
        <button
          type="button"
          onClick={onToggle3D}
          title={is3D ? 'Switch to flat 2D map view' : 'Switch to 3D perspective map view'}
          aria-label={is3D ? 'Switch to 2D view' : 'Switch to 3D view'}
          className={`w-10 h-10 rounded-2xl backdrop-blur-md border shadow-md flex items-center justify-center font-black text-xs tracking-tight transition active:scale-95 cursor-pointer ${
            is3D
              ? 'bg-[#1C442D] text-white border-[#1C442D] dark:bg-[#D5B16D] dark:text-[#111614] dark:border-[#D5B16D] shadow-emerald-900/30 ring-2 ring-emerald-500/30'
              : 'bg-white/95 dark:bg-[#111614]/95 text-[#3F4842] dark:text-[#CBD5CD] border-[#E5DED2] dark:border-[#29332D] hover:bg-[#FAF7F2] dark:hover:bg-[#1A221E]'
          }`}
        >
          {is3D ? '2D' : '3D'}
        </button>
      )}

      {/* Recenter My Location */}
      <button
        type="button"
        onClick={onRecenter}
        title={hasUserLocation ? 'Recenter on my location' : 'Turn on location to center on yourself'}
        aria-label="Recenter on my location"
        className="w-10 h-10 rounded-2xl bg-white/95 dark:bg-[#111614]/95 backdrop-blur-md border border-[#E5DED2] dark:border-[#29332D] shadow-md flex items-center justify-center text-[#1C442D] dark:text-[#D5B16D] transition active:scale-95 hover:bg-[#FAF7F2] dark:hover:bg-[#1A221E] cursor-pointer"
      >
        <Locate className="w-5 h-5" />
      </button>

      {/* Recenter / Reset View (India / All Markers) */}
      <button
        type="button"
        onClick={onResetView}
        title="Reset North & fit all markers in view"
        aria-label="Reset North and fit all markers in view"
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
            aria-label="Zoom In"
            className="w-10 h-10 flex items-center justify-center text-[#3F4842] dark:text-[#CBD5CD] hover:bg-[#FAF7F2] dark:hover:bg-[#1A221E] transition active:scale-95 cursor-pointer border-b border-[#E5DED2] dark:border-[#29332D]"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onZoomOut}
            title="Zoom Out"
            aria-label="Zoom Out"
            className="w-10 h-10 flex items-center justify-center text-[#3F4842] dark:text-[#CBD5CD] hover:bg-[#FAF7F2] dark:hover:bg-[#1A221E] transition active:scale-95 cursor-pointer"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
