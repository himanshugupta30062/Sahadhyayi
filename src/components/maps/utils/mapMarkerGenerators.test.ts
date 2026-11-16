import { describe, expect, it } from 'vitest';
import {
  createAvatarMarkerHtml,
  createBookCoverMarkerHtml,
  createEventMarkerHtml,
  createPlaceMarkerHtml,
  generateMarkerHtml,
  getSafeMediaUrl,
} from './mapMarkerGenerators';

describe('mapMarkerGenerators', () => {
  describe('getSafeMediaUrl', () => {
    it('allows valid https and http URLs', () => {
      expect(getSafeMediaUrl('https://images.example.com/photo.jpg')).toBe('https://images.example.com/photo.jpg');
      expect(getSafeMediaUrl('http://images.example.com/photo.png')).toBe('http://images.example.com/photo.png');
    });

    it('rejects unsafe script protocols', () => {
      expect(getSafeMediaUrl('javascript:alert(1)')).toBeNull();
      expect(getSafeMediaUrl('vbscript:msgbox(1)')).toBeNull();
    });

    it('allows valid data URIs for images', () => {
      const validPng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
      expect(getSafeMediaUrl(validPng)).toBe(validPng);
    });

    it('encodes SVG text into safe base64 data URIs', () => {
      const svg = '<svg xmlns="http://www.w3.org/2000/svg"><circle r="10"/></svg>';
      const safe = getSafeMediaUrl(svg);
      expect(safe).toContain('data:image/svg+xml;base64,');
    });
  });

  describe('createAvatarMarkerHtml', () => {
    it('creates circular avatar marker with YOU badge for self', () => {
      const html = createAvatarMarkerHtml({
        id: 'self',
        lat: 28.5,
        lng: 77.2,
        title: 'Myself',
        avatarUrl: 'https://cdn.example.com/me.webp',
      });

      expect(html).toContain('sahadhyayi-marker-self');
      expect(html).toContain('YOU');
      expect(html).toContain('src="https://cdn.example.com/me.webp"');
      expect(html).toContain('data-sahadhyayi-avatar="true"');
    });

    it('creates an illustrated face when avatarUrl is missing', () => {
      const html = createAvatarMarkerHtml({
        id: 'user-1',
        lat: 28.6,
        lng: 77.3,
        title: 'Ananya Roy',
        avatarUrl: null,
      });

      expect(html).toContain('sahadhyayi-marker-peer');
      expect(html).not.toContain('YOU');
      expect(html).toContain('sahadhyayi-default-avatar');
      expect(html).toContain('data-face-shape=');
      expect(html).not.toContain('<img');
    });
  });

  describe('createPlaceMarkerHtml', () => {
    it('renders library place pin with library emoji and navy theme', () => {
      const html = createPlaceMarkerHtml({
        id: 'spot-1',
        lat: 22.5,
        lng: 88.3,
        title: 'National Library',
        category: 'library',
      });

      expect(html).toContain('sahadhyayi-place-marker');
      expect(html).toContain('🏛️');
      expect(html).toContain('#1E3A8A');
    });

    it('renders bookstore pin with bookstore emoji and amber theme', () => {
      const html = createPlaceMarkerHtml({
        id: 'spot-2',
        lat: 18.9,
        lng: 72.8,
        title: 'Kitab Khana',
        category: 'bookstore',
      });

      expect(html).toContain('sahadhyayi-place-marker');
      expect(html).toContain('📖');
      expect(html).toContain('#B45309');
    });

    it('renders cafe pin with coffee emoji and warm mocha theme', () => {
      const html = createPlaceMarkerHtml({
        id: 'spot-3',
        lat: 28.5,
        lng: 77.2,
        title: 'Kunzum Books & Cafe',
        category: 'cafe',
      });

      expect(html).toContain('sahadhyayi-place-marker');
      expect(html).toContain('☕');
      expect(html).toContain('#78350F');
    });
  });

  describe('createEventMarkerHtml', () => {
    it('renders literary event pin with purple theme and EVENT badge', () => {
      const html = createEventMarkerHtml({
        id: 'ev-1',
        lat: 26.8,
        lng: 75.8,
        title: 'Jaipur Literature Festival',
        markerType: 'event',
      });

      expect(html).toContain('sahadhyayi-event-marker');
      expect(html).toContain('🎭');
      expect(html).toContain('EVENT');
      expect(html).toContain('#9333EA');
    });
  });

  describe('createBookCoverMarkerHtml', () => {
    it('renders book cover marker with image when available', () => {
      const html = createBookCoverMarkerHtml({
        id: 'b-1',
        lat: 28.5,
        lng: 77.2,
        title: 'Godan',
        avatarUrl: 'https://cdn.example.com/godan.jpg',
        markerType: 'book',
      });

      expect(html).toContain('sahadhyayi-book-marker');
      expect(html).toContain('src="https://cdn.example.com/godan.jpg"');
    });
  });

  describe('generateMarkerHtml', () => {
    it('dispatches to correct generator based on markerType', () => {
      const avatarHtml = generateMarkerHtml({ id: 'u1', lat: 0, lng: 0, title: 'Reader', markerType: 'avatar' });
      expect(avatarHtml).toContain('sahadhyayi-reader-map-marker');

      const placeHtml = generateMarkerHtml({ id: 'p1', lat: 0, lng: 0, title: 'Library', markerType: 'place', category: 'library' });
      expect(placeHtml).toContain('sahadhyayi-place-marker');

      const eventHtml = generateMarkerHtml({ id: 'e1', lat: 0, lng: 0, title: 'Book Fair', markerType: 'event' });
      expect(eventHtml).toContain('sahadhyayi-event-marker');

      const bookHtml = generateMarkerHtml({ id: 'b1', lat: 0, lng: 0, title: 'Book', markerType: 'book' });
      expect(bookHtml).toContain('sahadhyayi-book-marker');
    });
  });
});
