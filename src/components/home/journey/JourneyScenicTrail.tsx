import React, { useEffect, useRef } from 'react';
import { MapPin, Route, ArrowDown } from 'lucide-react';
import { JourneyLandmarkArt } from './JourneyLandmarkArt';
import { JourneyScenery } from './JourneyScenery';
import { StudentCyclist } from './StudentCyclist';
import { JOURNEY_DESTINATIONS } from './journeyData';
import './journey-scenic-trail.css';

interface JourneyScenicTrailProps {
  activeStopIndex: number;
  onSelect: (index: number) => void;
}

interface LandmarkPosition {
  index: number;
  side: 'left' | 'right';
  top: number;
  shortDescription: string;
}

const LANDMARK_POSITIONS: LandmarkPosition[] = [
  { index: 1, side: 'left', top: 9.4, shortDescription: 'Explore books and research' },
  { index: 2, side: 'right', top: 21, shortDescription: 'Build your reading life' },
  { index: 3, side: 'left', top: 32.6, shortDescription: 'Meet fellow readers' },
  { index: 4, side: 'right', top: 44.2, shortDescription: 'Read and discuss together' },
  { index: 5, side: 'left', top: 55.8, shortDescription: 'Read and write stories' },
  { index: 6, side: 'right', top: 67.4, shortDescription: 'Meet authors and critics' },
  { index: 7, side: 'left', top: 79, shortDescription: 'Play, learn and join events' },
  { index: 8, side: 'right', top: 90.6, shortDescription: 'Ask your Book Expert AI' },
];

const DESKTOP_TRAIL_PATH =
  'M 500 130 C 620 110 780 120 900 290 C 1160 430 760 470 500 450 C 250 430 480 600 900 610 C 1160 620 760 790 500 770 C 250 750 480 920 900 930 C 1160 940 760 1110 500 1090 C 250 1070 480 1240 900 1250';

const MOBILE_TRAIL_PATH =
  'M 125 130 C 195 110 205 170 145 290 C 85 410 70 410 125 450 C 180 490 195 540 145 610 C 95 680 75 700 125 770 C 175 840 195 860 145 930 C 95 1000 75 1020 125 1090 C 175 1160 195 1190 145 1250';

export const JourneyScenicTrail: React.FC<JourneyScenicTrailProps> = ({
  activeStopIndex,
  onSelect,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const desktopPathRef = useRef<SVGPathElement>(null);
  const mobilePathRef = useRef<SVGPathElement>(null);
  const cyclistRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);

  useEffect(() => {
    const svg = svgRef.current;
    const map = mapRef.current;
    const cyclist = cyclistRef.current;
    if (!svg || !map || !cyclist) return;

    const getActivePath = () => {
      const isMobile = typeof window.matchMedia === 'function' &&
        window.matchMedia('(max-width: 760px)').matches;
      return isMobile ? mobilePathRef.current : desktopPathRef.current;
    };

    let path = getActivePath();
    if (!path || typeof path.getTotalLength !== 'function') return;

    let animationFrame = 0;
    let startTime = 0;
    let pathLength = 0;
    const startProgress = progressRef.current;

    const getPathLength = (activePath: SVGPathElement) => {
      try {
        return activePath.getTotalLength();
      } catch {
        return 0;
      }
    };

    pathLength = getPathLength(path);
    if (!pathLength) return;

    const getStopProgress = (activePath: SVGPathElement, length: number, index: number) => {
      const isMobilePath = activePath === mobilePathRef.current;
      const stopPoints = isMobilePath
        ? [
            { x: 125, y: 130 }, { x: 145, y: 290 }, { x: 125, y: 450 }, { x: 145, y: 610 },
            { x: 125, y: 770 }, { x: 145, y: 930 }, { x: 125, y: 1090 }, { x: 145, y: 1250 },
          ]
        : [
            { x: 500, y: 130 }, { x: 900, y: 290 }, { x: 500, y: 450 }, { x: 900, y: 610 },
            { x: 500, y: 770 }, { x: 900, y: 930 }, { x: 500, y: 1090 }, { x: 900, y: 1250 },
          ];
      const target = stopPoints[Math.max(0, Math.min(stopPoints.length - 1, index - 1))];
      let closestProgress = 0;
      let closestDistance = Number.POSITIVE_INFINITY;

      for (let sample = 0; sample <= 500; sample += 1) {
        const progress = sample / 500;
        const point = activePath.getPointAtLength(length * progress);
        const dx = point.x - target.x;
        const dy = point.y - target.y;
        const distance = dx * dx + dy * dy;
        if (distance < closestDistance) {
          closestDistance = distance;
          closestProgress = progress;
        }
      }

      return closestProgress;
    };

    const drawAt = (progress: number) => {
      if (!path || !pathLength) return;
      const distance = Math.max(0, Math.min(pathLength, pathLength * progress));
      const point = path.getPointAtLength(distance);
      const before = path.getPointAtLength(Math.max(0, distance - 2));
      const after = path.getPointAtLength(Math.min(pathLength, distance + 2));
      const matrix = svg.getScreenCTM();
      if (!matrix) return;

      const screenPoint = svg.createSVGPoint();
      screenPoint.x = point.x;
      screenPoint.y = point.y;
      const screen = screenPoint.matrixTransform(matrix);
      const bounds = map.getBoundingClientRect();
      const angle = Math.atan2(after.y - before.y, after.x - before.x) * (180 / Math.PI);
      const bankAngle = Math.max(-12, Math.min(12, angle * 0.16));

      cyclist.style.left = (screen.x - bounds.left) + 'px';
      cyclist.style.top = (screen.y - bounds.top) + 'px';
      cyclist.style.transform = 'translate(-50%, -56%) rotate(' + bankAngle + 'deg)';
      progressRef.current = progress;
    };

    let targetProgress = getStopProgress(path, pathLength, activeStopIndex);
    const prefersReducedMotion = typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const duration = prefersReducedMotion
      ? 0
      : Math.max(700, Math.min(1900, Math.abs(targetProgress - startProgress) * 2700));

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const rawProgress = Math.min(1, (timestamp - startTime) / duration);
      const easedProgress = 1 - Math.pow(1 - rawProgress, 3);
      const nextProgress = startProgress + (targetProgress - startProgress) * easedProgress;

      drawAt(nextProgress);

      if (rawProgress < 1) {
        animationFrame = window.requestAnimationFrame(animate);
      } else {
        drawAt(targetProgress);
      }
    };

    if (duration === 0) {
      drawAt(targetProgress);
    } else {
      drawAt(startProgress);
      animationFrame = window.requestAnimationFrame(animate);
    }

    const handleResize = () => {
      const responsivePath = getActivePath();
      if (responsivePath && responsivePath !== path && typeof responsivePath.getTotalLength === 'function') {
        path = responsivePath;
        pathLength = getPathLength(path);
        targetProgress = getStopProgress(path, pathLength, activeStopIndex);
        progressRef.current = targetProgress;
      }
      drawAt(progressRef.current);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize', handleResize);
    };
  }, [activeStopIndex]);

  return (
    <div className="journey-scenic-world" aria-label="Interactive scenic cycling route">
      <div className="journey-scenic-world__legend">
        <span><Route className="h-3.5 w-3.5" /> 8 places to discover</span>
        <span><MapPin className="h-3.5 w-3.5" /> Choose a place to see its menu</span>
      </div>

      <div ref={mapRef} className="journey-scenic-trail" data-testid="journey-scenic-trail">
        <JourneyScenery />
        <div className="journey-scenic-trail__sun" aria-hidden="true" />
        <div className="journey-scenic-trail__hill journey-scenic-trail__hill--one" aria-hidden="true" />
        <div className="journey-scenic-trail__hill journey-scenic-trail__hill--two" aria-hidden="true" />
        <div className="journey-scenic-trail__hill journey-scenic-trail__hill--three" aria-hidden="true" />
        <div className="journey-scenic-trail__cloud journey-scenic-trail__cloud--one" aria-hidden="true" />
        <div className="journey-scenic-trail__cloud journey-scenic-trail__cloud--two" aria-hidden="true" />

        <svg
          ref={svgRef}
          className="journey-scenic-trail__svg"
          viewBox="0 0 1400 1380"
          preserveAspectRatio="none"
          role="img"
          aria-label="A winding road connects eight Sahadhyayi destinations"
        >
          <defs>
            <linearGradient id="sahadhyayi-trail-road" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#B99868" />
              <stop offset="50%" stopColor="#D2B98F" />
              <stop offset="100%" stopColor="#AE8E61" />
            </linearGradient>
          </defs>
          <g className="journey-scenic-trail__desktop-route">
            <path d={DESKTOP_TRAIL_PATH} className="journey-scenic-trail__road-shadow" />
            <path d={DESKTOP_TRAIL_PATH} className="journey-scenic-trail__road-edge" />
            <path d={DESKTOP_TRAIL_PATH} stroke="url(#sahadhyayi-trail-road)" strokeWidth="58" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <path d={DESKTOP_TRAIL_PATH} className="journey-scenic-trail__road-markings" />
            <path d={DESKTOP_TRAIL_PATH} ref={desktopPathRef} className="journey-scenic-trail__path-measure" />
          </g>
          <g className="journey-scenic-trail__mobile-route">
            <path d={MOBILE_TRAIL_PATH} className="journey-scenic-trail__road-shadow" />
            <path d={MOBILE_TRAIL_PATH} className="journey-scenic-trail__road-edge" />
            <path d={MOBILE_TRAIL_PATH} stroke="url(#sahadhyayi-trail-road)" strokeWidth="58" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <path d={MOBILE_TRAIL_PATH} className="journey-scenic-trail__road-markings" />
            <path d={MOBILE_TRAIL_PATH} ref={mobilePathRef} className="journey-scenic-trail__path-measure" />
          </g>
          <g className="journey-scenic-trail__scenery" aria-hidden="true">
            <path d="M35 250 Q95 180 165 245 Q220 175 300 250" />
            <path d="M1080 490 Q1150 420 1230 490 Q1300 410 1370 485" />
            <path d="M35 850 Q110 775 190 850 Q260 780 330 850" />
            <path d="M1060 1110 Q1150 1035 1230 1110 Q1300 1040 1380 1110" />
          </g>
        </svg>

        {LANDMARK_POSITIONS.map((position) => {
          const destination = JOURNEY_DESTINATIONS.find((item) => item.index === position.index);
          if (!destination) return null;

          const isActive = activeStopIndex === destination.index;
          const menuTarget = 'journey-detail-' + destination.index;

          return (
            <div
              key={destination.id}
              id={'journey-node-' + destination.index}
              className={
                'journey-scenic-stop journey-scenic-stop--' + position.side +
                (isActive ? ' is-active' : '')
              }
              style={{
                top: position.top + '%',
                '--journey-accent': destination.accentColor,
              } as React.CSSProperties}
              data-testid={'journey-landmark-' + destination.index}
            >
              <button
                type="button"
                className="journey-scenic-stop__trigger"
                onClick={() => onSelect(destination.index)}
                aria-label={'Explore ' + destination.title + ' — ' + position.shortDescription}
                aria-pressed={isActive}
                aria-expanded={isActive}
                aria-controls={isActive ? menuTarget : undefined}
              >
                <span className="journey-scenic-stop__art">
                  <JourneyLandmarkArt id={destination.id} isCurrent={isActive} />
                </span>
                <span className="journey-scenic-stop__label">
                  <span className="journey-scenic-stop__number">{String(destination.index).padStart(2, '0')}</span>
                  <span className="journey-scenic-stop__title">{destination.title}</span>
                  <span className="journey-scenic-stop__hint">{position.shortDescription}</span>
                  <span className="journey-scenic-stop__menu-preview">{destination.menuPreview}</span>
                  <span className="journey-scenic-stop__menu-cue">
                    View {destination.menuItems.length} {destination.menuItems.length === 1 ? 'option' : 'options'} <ArrowDown className="h-3 w-3" />
                  </span>
                </span>
              </button>
            </div>
          );
        })}

        <div className="journey-scenic-trail__cyclist" ref={cyclistRef} aria-hidden="true">
          <span className="journey-scenic-trail__cyclist-glow" />
          <StudentCyclist size={116} isPedaling={true} accentColor="#1C442D" />
        </div>

        <div className="journey-scenic-trail__start-label" aria-hidden="true">START</div>
        <div className="journey-scenic-trail__finish-label" aria-hidden="true">THE JOURNEY CONTINUES</div>
      </div>
    </div>
  );
};
