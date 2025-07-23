import React from 'react';
import { MapPin, User } from 'lucide-react';

export interface MarkerConfig {
  position: { lat: number; lng: number };
  title: string;
  isCurrentUser?: boolean;
  avatarUrl?: string;
  userName?: string;
  distance?: number;
  bookTitle?: string;
  isFriend?: boolean;
}

export const createCustomMarker = (config: MarkerConfig, isReadersMap: boolean = false) => {
  if (!window.google) return null;

  const { position, title, isCurrentUser, avatarUrl, userName, distance, bookTitle, isFriend } = config;

  // Create marker based on type
  let markerIcon;
  
  if (isCurrentUser) {
    if (isReadersMap) {
      // Normal pointer for current user in readers map
      markerIcon = {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 20,
        fillColor: '#3b82f6',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 4,
        anchor: new window.google.maps.Point(0, 0),
      };
    } else {
      // Bitmoji/avatar for current user in friends map
      markerIcon = avatarUrl ? {
        url: avatarUrl,
        scaledSize: new window.google.maps.Size(60, 60),
        anchor: new window.google.maps.Point(30, 30),
        origin: new window.google.maps.Point(0, 0),
      } : {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 25,
        fillColor: '#3b82f6',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 4,
        anchor: new window.google.maps.Point(0, 0),
      };
    }
  } else {
    // Other users
    if (avatarUrl) {
      markerIcon = {
        url: avatarUrl,
        scaledSize: new window.google.maps.Size(50, 50),
        anchor: new window.google.maps.Point(25, 25),
        origin: new window.google.maps.Point(0, 0),
      };
    } else {
      markerIcon = {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 15,
        fillColor: isFriend ? '#10b981' : '#f97316',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 3,
        anchor: new window.google.maps.Point(0, 0),
      };
    }
  }

  return markerIcon;
};

export const createTooltipContent = (config: MarkerConfig, isReadersMap: boolean = false) => {
  const { userName, distance, bookTitle, isCurrentUser, isFriend } = config;

  if (isCurrentUser) {
    return `
      <div style="
        padding: 12px;
        background: linear-gradient(135deg, #3b82f6, #1d4ed8);
        color: white;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.2);
        font-family: system-ui, -apple-system, sans-serif;
        min-width: 200px;
        text-align: center;
        border: 2px solid #ffffff;
      ">
        <div style="display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 8px;">
          <div style="width: 12px; height: 12px; background: #ffffff; border-radius: 50%; animation: pulse 2s infinite;"></div>
          <span style="font-weight: 600; font-size: 16px;">📍 Your Location</span>
        </div>
        <div style="font-size: 14px; opacity: 0.9;">
          ${isReadersMap ? 'Looking for nearby readers' : 'Connected with friends'}
        </div>
        <div style="font-size: 12px; opacity: 0.7; margin-top: 4px;">
          Location sharing: Active
        </div>
      </div>
    `;
  }

  const statusColor = isFriend ? '#10b981' : '#f97316';
  const statusText = isFriend ? 'Friend' : 'Reader';
  const statusIcon = isFriend ? '👥' : '📚';

  return `
    <div style="
      padding: 16px;
      background: white;
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.15);
      font-family: system-ui, -apple-system, sans-serif;
      min-width: 250px;
      max-width: 300px;
      border: 2px solid ${statusColor};
    ">
      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
        <div style="
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, ${statusColor}, ${statusColor}dd);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 18px;
          border: 3px solid white;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        ">
          ${userName ? userName.charAt(0).toUpperCase() : '?'}
        </div>
        <div style="flex: 1;">
          <div style="font-weight: 600; font-size: 16px; color: #1f2937; margin-bottom: 4px;">
            ${userName || 'Anonymous User'}
          </div>
          <div style="
            display: inline-flex;
            align-items: center;
            gap: 4px;
            background: ${statusColor}20;
            color: ${statusColor};
            font-size: 12px;
            font-weight: 500;
            padding: 4px 8px;
            border-radius: 20px;
            border: 1px solid ${statusColor}40;
          ">
            <span>${statusIcon}</span>
            <span>${statusText}</span>
          </div>
        </div>
      </div>
      
      <div style="border-top: 1px solid #e5e7eb; padding-top: 12px; margin-top: 12px;">
        ${distance !== undefined ? `
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
            <span style="font-size: 14px;">📍</span>
            <span style="font-size: 14px; color: #6b7280;">
              <strong>${distance.toFixed(1)} km</strong> away
            </span>
          </div>
        ` : ''}
        
        ${bookTitle ? `
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
            <span style="font-size: 14px;">📖</span>
            <span style="font-size: 14px; color: #374151;">
              Currently reading: <strong style="color: ${statusColor};">${bookTitle}</strong>
            </span>
          </div>
        ` : ''}
        
        <div style="display: flex; align-items: center; gap: 8px; margin-top: 8px;">
          <div style="width: 8px; height: 8px; background: #10b981; border-radius: 50%; animation: pulse 2s infinite;"></div>
          <span style="font-size: 12px; color: #10b981; font-weight: 500;">Active now</span>
        </div>
      </div>
    </div>
  `;
};

export const createHoverTooltip = (config: MarkerConfig, isReadersMap: boolean = false) => {
  const { userName, distance, bookTitle, isCurrentUser, isFriend } = config;

  if (isCurrentUser) {
    return `
      <div style="
        padding: 8px 12px;
        background: rgba(59, 130, 246, 0.95);
        color: white;
        border-radius: 8px;
        font-family: system-ui;
        font-size: 12px;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        border: 1px solid rgba(255,255,255,0.2);
      ">
        📍 Your Location
      </div>
    `;
  }

  const statusIcon = isFriend ? '👥' : '📚';
  const statusColor = isFriend ? '#10b981' : '#f97316';

  return `
    <div style="
      padding: 10px 12px;
      background: white;
      border-radius: 8px;
      font-family: system-ui;
      font-size: 13px;
      box-shadow: 0 6px 20px rgba(0,0,0,0.15);
      border: 2px solid ${statusColor};
      max-width: 200px;
    ">
      <div style="font-weight: 600; color: #1f2937; margin-bottom: 4px;">
        ${statusIcon} ${userName || 'Anonymous User'}
      </div>
      ${distance !== undefined ? `
        <div style="color: #6b7280; font-size: 12px; margin-bottom: 2px;">
          📍 ${distance.toFixed(1)} km away
        </div>
      ` : ''}
      ${bookTitle ? `
        <div style="color: #374151; font-size: 12px;">
          📖 ${bookTitle}
        </div>
      ` : ''}
    </div>
  `;
};
