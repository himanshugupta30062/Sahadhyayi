// HeroAtomicRings3D.tsx — 3D animated orbits for the Sahadhyayi reading ecosystem.
// Uses React Three Fiber (@react-three/fiber) with @react-three/drei for proper 3D rendering.

import React, { useEffect, useId, useRef, useMemo, useState } from 'react';
import type { ReactNode, KeyboardEvent as ReactKeyboardEvent } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import * as THREE from 'three';

// Reuse the same orbit configuration from the 2D version
const toRadTop = (deg: number) => (deg - 90) * (Math.PI / 180);
const norm = (angle: number) => ((angle % 360) + 360) % 360;

type OrbitIcon = 'book' | 'quill' | 'people' | 'article' | 'games';

interface OrbitConfig {
  id: string;
  label: string;
  href: string;
  icon: OrbitIcon;
  radius: number;        // in 3D world units (was pixels, now scaled)
  strokeWidth: number;   // tube radius for the orbit ring
  atomRadius: number;    // size of the moving atom
  labelWidth: number;    // not used in 3D, kept for compatibility
  atomColor: string;     // hex color for the atom
  gradientColors: [string, string, string, string]; // for the ring gradient
  start: number;         // start angle in degrees
  duration: number;      // orbit period in seconds
  direction: 1 | -1;     // rotation direction
  initialProgress: number; // atom initial progress along arc (degrees)
}

const ORBITS: OrbitConfig[] = [
  {
    id: 'library',
    label: 'Library',
    href: '/library',
    icon: 'book',
    radius: 8.5,         // scaled from 285px
    strokeWidth: 0.18,   // scaled from 20px
    atomRadius: 0.55,    // scaled from 17px
    labelWidth: 92,
    atomColor: '#ef4444',
    gradientColors: ['#ff9ecf', '#ff4d8d', '#ff1f5a', '#be123c'],
    start: -18,
    duration: 42,
    direction: 1,
    initialProgress: 48,
  },
  {
    id: 'authors',
    label: 'Authors',
    href: '/authors',
    icon: 'quill',
    radius: 7.6,         // scaled from 255px
    strokeWidth: 0.13,   // scaled from 14px
    atomRadius: 0.5,     // scaled from 16px
    labelWidth: 88,
    atomColor: '#22c55e',
    gradientColors: ['#86efac', '#4ade80', '#22c55e', '#166534'],
    start: 12,
    duration: 37,
    direction: -1,
    initialProgress: 112,
  },
  {
    id: 'social',
    label: 'Social Media',
    href: '/social',
    icon: 'people',
    radius: 6.7,         // scaled from 225px
    strokeWidth: 0.09,   // scaled from 10px
    atomRadius: 0.5,     // scaled from 16px
    labelWidth: 128,
    atomColor: '#3b82f6',
    gradientColors: ['#93c5fd', '#60a5fa', '#3b82f6', '#1e3a8a'],
    start: -36,
    duration: 32,
    direction: 1,
    initialProgress: 190,
  },
  {
    id: 'articles',
    label: 'Articles',
    href: '/articles',
    icon: 'article',
    radius: 6.3,         // scaled from 210px
    strokeWidth: 0.07,   // scaled from 8px
    atomRadius: 0.47,    // scaled from 15px
    labelWidth: 92,
    atomColor: '#d99a24',
    gradientColors: ['#f8d887', '#eab545', '#d99a24', '#986515'],
    start: 24,
    duration: 28,
    direction: -1,
    initialProgress: 84,
  },
  {
    id: 'games',
    label: 'Games',
    href: '/games',
    icon: 'games',
    radius: 5.9,         // scaled from 198px
    strokeWidth: 0.05,   // scaled from 6px
    atomRadius: 0.47,    // scaled from 15px
    labelWidth: 78,
    atomColor: '#8b5cf6',
    gradientColors: ['#c4b5fd', '#a78bfa', '#8b5cf6', '#5b21b6'],
    start: -8,
    duration: 24,
    direction: 1,
    initialProgress: 150,
  },
];

const COVERAGE = 0.65;
const SWEEP_DEG = 360 * COVERAGE;        // 234 degrees
const ATOM_SPEED = 30;                   // degrees per second along arc
const ATOM_FADE_ANGLE = 18;              // fade near gap edges

// 3D Icon components using simple Three.js geometries
const OrbitIcon3D = ({ icon, size = 0.35, color = '#ffffff' }: { icon: OrbitIcon; size?: number; color?: string }) => {
  const iconRef = useRef<React.RefObject<THREE.Group>>(null);

  // We'll use simple geometric representations for each icon
  switch (icon) {
    case 'book':
      return (
        <group>
          {/* Book cover */}
          <mesh position={[0, 0, 0.05]} rotation={[-Math.PI / 2, 0, 0]}>
            <boxGeometry args={[size * 1.4, size * 1.8, size * 0.15]} />
            <meshStandardMaterial color={color} metalness={0.1} roughness={0.8} />
          </mesh>
          {/* Book pages */}
          <mesh position={[0, 0, -0.05]} rotation={[-Math.PI / 2, 0, 0]}>
            <boxGeometry args={[size * 1.2, size * 1.6, size * 0.1]} />
            <meshStandardMaterial color="#ffffff" metalness={0} roughness={1} opacity={0.9} transparent />
          </mesh>
          {/* Spine */}
          <mesh position={[-size * 0.7, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[size * 0.12, size * 0.12, size * 1.8, 8]} />
            <meshStandardMaterial color={color} metalness={0.1} roughness={0.8} />
          </mesh>
        </group>
      );
    case 'quill':
      return (
        <group rotation={[-Math.PI / 4, 0, 0]}>
          {/* Quill shaft */}
          <mesh>
            <cylinderGeometry args={[size * 0.06, size * 0.02, size * 2.2, 6]} />
            <meshStandardMaterial color="#8b7355" metalness={0.1} roughness={0.9} />
          </mesh>
          {/* Feather barbs */}
          <mesh position={[0, size * 0.8, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <coneGeometry args={[size * 0.6, size * 1.2, 8]} />
            <meshStandardMaterial color={color} metalness={0} roughness={1} opacity={0.8} transparent side={2} />
          </mesh>
          <mesh position={[0, size * 0.4, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <coneGeometry args={[size * 0.5, size * 1.0, 8]} />
            <meshStandardMaterial color={color} metalness={0} roughness={1} opacity={0.6} transparent side={2} />
          </mesh>
        </group>
      );
    case 'people':
      return (
        <group>
          {/* Person 1 */}
          <group position={[-size * 0.5, 0, 0]}>
            <mesh position={[0, size * 0.6, 0]}>
              <sphereGeometry args={[size * 0.3, 16, 16]} />
              <meshStandardMaterial color={color} metalness={0.1} roughness={0.8} />
            </mesh>
            <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[size * 0.35, size * 0.2, size * 0.9, 8]} />
              <meshStandardMaterial color={color} metalness={0.1} roughness={0.8} opacity={0.9} transparent />
            </mesh>
          </group>
          {/* Person 2 */}
          <group position={[size * 0.5, 0, 0]}>
            <mesh position={[0, size * 0.5, 0]}>
              <sphereGeometry args={[size * 0.25, 16, 16]} />
              <meshStandardMaterial color={color} metalness={0.1} roughness={0.8} />
            </mesh>
            <mesh position={[0, -size * 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[size * 0.3, size * 0.15, size * 0.8, 8]} />
              <meshStandardMaterial color={color} metalness={0.1} roughness={0.8} opacity={0.9} transparent />
            </mesh>
          </group>
        </group>
      );
    case 'article':
      return (
        <group rotation={[-Math.PI / 2, 0, 0]}>
          {/* Document sheet */}
          <mesh position={[0, 0, 0.03]}>
            <boxGeometry args={[size * 1.6, size * 2.0, size * 0.06]} />
            <meshStandardMaterial color="#ffffff" metalness={0} roughness={1} />
          </mesh>
          {/* Text lines */}
          <mesh position={[0, -size * 0.5, 0.05]}>
            <boxGeometry args={[size * 1.2, size * 0.08, size * 0.02]} />
            <meshStandardMaterial color={color} metalness={0} roughness={1} />
          </mesh>
          <mesh position={[0, -size * 0.15, 0.05]}>
            <boxGeometry args={[size * 1.0, size * 0.08, size * 0.02]} />
            <meshStandardMaterial color={color} metalness={0} roughness={1} />
          </mesh>
          <mesh position={[0, size * 0.2, 0.05]}>
            <boxGeometry args={[size * 1.3, size * 0.08, size * 0.02]} />
            <meshStandardMaterial color={color} metalness={0} roughness={1} />
          </mesh>
          <mesh position={[0, size * 0.55, 0.05]}>
            <boxGeometry args={[size * 0.9, size * 0.08, size * 0.02]} />
            <meshStandardMaterial color={color} metalness={0} roughness={1} />
          </mesh>
        </group>
      );
    case 'games':
      return (
        <group>
          {/* Game controller base */}
          <mesh position={[0, 0, -size * 0.1]} rotation={[-Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[size * 0.9, size * 1.1, size * 0.4, 16]} />
            <meshStandardMaterial color="#2d2d2d" metalness={0.3} roughness={0.7} />
          </mesh>
          {/* D-pad */}
          <group position={[0, -size * 0.4, size * 0.15]}>
            <mesh>
              <boxGeometry args={[size * 0.35, size * 0.35, size * 0.08]} />
              <meshStandardMaterial color="#444" metalness={0.2} roughness={0.6} />
            </mesh>
            <mesh position={[0, 0, size * 0.05]}>
              <boxGeometry args={[size * 0.12, size * 0.3, size * 0.05]} />
              <meshStandardMaterial color="#666" metalness={0.1} roughness={0.8} />
            </mesh>
            <mesh position={[0, 0, size * 0.05]} rotation={[0, 0, Math.PI / 2]}>
              <boxGeometry args={[size * 0.12, size * 0.3, size * 0.05]} />
              <meshStandardMaterial color="#666" metalness={0.1} roughness={0.8} />
            </mesh>
          </group>
          {/* Action buttons */}
          <group position={[size * 0.5, size * 0.2, size * 0.15]}>
            {['#ef4444', '#3b82f6', '#22c55e', '#f59e0b'].map((btnColor, i) => (
              <mesh key={i} position={[
                (i % 2) * size * 0.35 - size * 0.175,
                Math.floor(i / 2) * size * 0.35 - size * 0.175,
                size * 0.08
              ]}>
                <sphereGeometry args={[size * 0.14, 12, 12]} />
                <meshStandardMaterial color={btnColor} metalness={0.5} roughness={0.5} emissive={btnColor} emissiveIntensity={0.2} />
              </mesh>
            ))}
          </group>
        </group>
      );
  }
};

// Single Orbit Ring with moving Atom
const OrbitRing3D: React.FC<{ config: OrbitConfig; index: number; paused: boolean }> = ({
  config,
  index,
  paused,
}) => {
  const navigate = useNavigate();
  const ringRef = useRef<THREE.Group>(null);
  const atomRef = useRef<THREE.Group>(null);
  const labelRef = useRef<HTMLDivElement>(null);

  // Create gradient texture for the ring
  const gradientTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 16;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createLinearGradient(0, 0, 512, 0);
    config.gradientColors.forEach((color, i) => {
      gradient.addColorStop(i / (config.gradientColors.length - 1), color);
    });
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 16);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    return texture;
  }, [config.gradientColors]);

  // Ring geometry - a partial torus (arc)
  useFrame((state, delta) => {
    if (paused) return;

    // Rotate the entire ring
    if (ringRef.current) {
      const rotationSpeed = (Math.PI * 2 / config.duration) * config.direction;
      ringRef.current.rotation.z += rotationSpeed * delta;
    }

    // Move atom along the arc
    if (atomRef.current) {
      // Atom progresses along the arc independently
      const arcProgress = (atomRef.current.userData.progress || config.initialProgress) + ATOM_SPEED * delta;
      atomRef.current.userData.progress = arcProgress % SWEEP_DEG;

      const angleDeg = norm(config.start + (ringRef.current?.rotation.z * 180 / Math.PI || 0) + atomRef.current.userData.progress);
      const angleRad = toRadTop(angleDeg);

      // Position on the ring (in ring's local space, then transformed by ring rotation)
      const x = config.radius * Math.cos(angleRad);
      const y = config.radius * Math.sin(angleRad);
      atomRef.current.position.set(x, y, 0);

      // Fade near edges of arc
      const distanceFromEdge = Math.min(atomRef.current.userData.progress, SWEEP_DEG - atomRef.current.userData.progress);
      const opacity = Math.max(0, Math.min(1, distanceFromEdge / ATOM_FADE_ANGLE));
      atomRef.current.traverse((obj) => {
        if (obj instanceof THREE.Mesh && obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach(m => m.opacity = opacity);
          } else {
            obj.material.opacity = opacity;
          }
          if (obj.material.transparent === undefined) obj.material.transparent = true;
        }
      });
    }
  });

  const handleClick = () => navigate(config.href);
  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      navigate(config.href);
    }
  };

  return (
    <group ref={ringRef} rotation={[-Math.PI / 2, 0, 0]}> {/* Lay flat on XZ plane */}
      {/* Background full circle (subtle) */}
      <mesh>
        <torusGeometry args={[config.radius, config.strokeWidth * 0.3, 16, 128]} />
        <meshBasicMaterial
          color="#000000"
          opacity={0.06}
          transparent
          depthWrite={false}
        />
      </mesh>

      {/* Colored arc (the visible orbit path) */}
      <mesh>
        <torusGeometry args={[config.radius, config.strokeWidth, 8, 64], Math.PI, Math.PI * COVERAGE} />
        <meshBasicMaterial
          map={gradientTexture}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Moving Atom */}
      <group
        ref={atomRef}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
        aria-label={`Explore ${config.label}`}
        style={{ cursor: 'pointer' }}
      >
        {/* Atom glow/sphere */}
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[config.atomRadius, 32, 32]} />
          <meshStandardMaterial
            color={config.atomColor}
            metalness={0.3}
            roughness={0.4}
            emissive={config.atomColor}
            emissiveIntensity={0.4}
            transparent
            opacity={1}
          />
        </mesh>
        {/* Icon inside atom */}
        <OrbitIcon3D icon={config.icon} size={config.atomRadius * 0.6} color="#ffffff" />
        {/* Focus ring */}
        <mesh>
          <torusGeometry args={[config.atomRadius + 0.15, 0.03, 8, 32]} />
          <meshBasicMaterial
            color={config.atomColor}
            opacity={0}
            transparent
          />
        </mesh>
      </group>
    </group>
  );
};

// HTML overlay labels that follow 3D positions
const OrbitLabels: React.FC<{ orbits: OrbitConfig[]; paused: boolean }> = ({ orbits, paused }) => {
  const { camera } = useThree();
  const labelPositions = useRef<Map<string, THREE.Vector3>>(new Map());

  return (
    <group>
      {orbits.map((orbit, index) => (
        <Html
          key={orbit.id}
          position={labelPositions.current.get(orbit.id) || new THREE.Vector3()}
          prepend
          center
          fullscreen
          zIndexRange={[100, 200]}
        >
          <motion.div
            className="hero-orbit-label-3d"
            style={{
              pointerEvents: 'none',
              transform: 'translate(-50%, -50%)',
              opacity: 0,
              transition: 'opacity 0.3s ease',
            }}
            animate={{ opacity: 1 }}
            initial={{ opacity: 0 }}
          >
            <div
              className="hero-orbit-label-badge"
              style={{
                background: 'rgba(250, 250, 248, 0.97)',
                color: '#1C201D',
                border: `1.5px solid ${orbit.atomColor}`,
                borderRadius: '999px',
                padding: '4px 14px',
                fontSize: '14px',
                fontWeight: '700',
                letterSpacing: '0.15px',
                whiteSpace: 'nowrap',
                boxShadow: '0 4px 16px rgba(28, 32, 29, 0.12)',
                backdropFilter: 'blur(8px)',
              }}
            >
              {orbit.label}
            </div>
          </motion.div>
        </Html>
      ))}
    </group>
  );
};

// Main 3D Scene Component
const HeroAtomicRings3DScene: React.FC<{ paused: boolean; children?: ReactNode }> = ({ paused, children }) => {
  const generatedId = useId().replace(/:/g, '');
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle keyboard pause for accessibility
  const setKeyboardPause = (paused: boolean) => {
    // Could use a context or state, but for now we'll use the passed prop
  };

  return (
    <Canvas
      ref={containerRef}
      camera={{ position: [0, 0, 25], fov: 45 }}
      gl={{ antialias: true, alpha: true, preserveDrawingBuffer: false }}
      style={{ width: '100%', height: '100%', display: 'block' }}
      onCreated={({ gl }) => {
        gl.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      }}
    >
      <color attach="background" args={['#FAF9F5', 0]} /> {/* Transparent background */}

      {/* Lights */}
      <ambientLight intensity={0.8} color="#FAF9F5" />
      <directionalLight position={[10, 15, 10]} intensity={1.2} color="#ffffff" castShadow />
      <directionalLight position={[-10, 10, -5]} intensity={0.6} color="#ffecd2" />
      <hemisphereLight groundColor="#1C201D" skyColor="#FAF9F5" intensity={0.4} />

      {/* Orbits */}
      <group>
        {ORBITS.map((orbit, index) => (
          <OrbitRing3D key={orbit.id} config={orbit} index={index} paused={paused} />
        ))}
      </group>

      {/* HTML Overlay Labels - positioned via CSS 3D transform */}
      <Html fullscreen prepend center zIndexRange={[100, 200]} style={{ pointerEvents: 'none' }}>
        <OrbitLabelOverlays orbits={ORBITS} paused={paused} />
      </Html>

      {/* Center content area for children */}
      {children && (
        <Html fullscreen center zIndexRange={[50, 100]} style={{ pointerEvents: 'auto' }}>
          <div className="absolute inset-0 flex items-center justify-center z-10 w-full max-w-[92%] sm:max-w-[88%]">
            {children}
          </div>
        </Html>
      )}
    </Canvas>
  );
};

// CSS-based label overlays that track 3D positions
const OrbitLabelOverlays: React.FC<{ orbits: OrbitConfig[]; paused: boolean }> = ({ orbits, paused }) => {
  const { camera, gl } = useThree();
  const labelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const ringAngles = useRef(ORBITS.map(() => 0));
  const atomProgress = useRef(ORBITS.map((orbit) => orbit.initialProgress));

  useFrame((state, delta) => {
    if (paused) return;

    // Update ring angles
    ringAngles.current = ringAngles.current.map((angle, index) =>
      norm(angle + (360 / ORBITS[index].duration) * ORBITS[index].direction * delta * 60), // delta is in seconds, convert to per-frame
    );

    // Update atom progress
    atomProgress.current = atomProgress.current.map(
      (progress) => (progress + ATOM_SPEED * delta) % SWEEP_DEG,
    );

    // Project 3D positions to 2D screen coordinates for HTML labels
    orbits.forEach((orbit, index) => {
      const angle = norm(orbit.start + ringAngles.current[index] + atomProgress.current[index]);
      const angleRad = toRadTop(angle);

      // 3D position on ring (ring is rotated -PI/2 on X, so it lies on XZ plane)
      const x = orbit.radius * Math.cos(angleRad);
      const z = orbit.radius * Math.sin(angleRad);
      const y = 0;

      const vector = new THREE.Vector3(x, y, z);
      vector.project(camera);

      // Convert to CSS coordinates
      const width = gl.domElement.clientWidth;
      const height = gl.domElement.clientHeight;
      const cssX = (vector.x * 0.5 + 0.5) * width;
      const cssY = (-vector.y * 0.5 + 0.5) * height;

      // Offset label outward from atom
      const labelOffset = 0.8; // world units
      const labelVector = new THREE.Vector3(
        x + Math.cos(angleRad) * labelOffset,
        0,
        z + Math.sin(angleRad) * labelOffset
      );
      labelVector.project(camera);
      const labelCssX = (labelVector.x * 0.5 + 0.5) * width;
      const labelCssY = (-labelVector.y * 0.5 + 0.5) * height;

      if (labelRefs.current[index]) {
        labelRefs.current[index]!.style.left = `${labelCssX}px`;
        labelRefs.current[index]!.style.top = `${labelCssY}px`;
      }
    });
  });

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ overflow: 'visible' }}>
      {orbits.map((orbit, index) => (
        <div
          key={orbit.id}
          ref={(el) => { labelRefs.current[index] = el; }}
          className="hero-orbit-label-3d absolute"
          style={{
            pointerEvents: 'none',
            transform: 'translate(-50%, -50%)',
            opacity: 1,
            transition: 'opacity 0.3s ease',
            zIndex: 100,
          }}
        >
          <div
            className="hero-orbit-label-badge"
            style={{
              background: 'rgba(250, 250, 248, 0.97)',
              color: '#1C201D',
              border: `1.5px solid ${orbit.atomColor}`,
              borderRadius: '999px',
              padding: '4px 14px',
              fontSize: '14px',
              fontWeight: '700',
              letterSpacing: '0.15px',
              whiteSpace: 'nowrap',
              boxShadow: '0 4px 16px rgba(28, 32, 29, 0.12)',
              backdropFilter: 'blur(8px)',
            }}
          >
            {orbit.label}
          </div>
        </div>
      ))}
    </div>
  );
};

// Main exported component matching the original HeroAtomicRings interface
interface HeroAtomicRings3DProps {
  size?: number | string;
  className?: string;
  children?: ReactNode;
}

export default function HeroAtomicRings3D({ size = 720, className = '', children }: HeroAtomicRings3DProps) {
  const navigate = useNavigate();
  const generatedId = useId().replace(/:/g, '');
  const containerRef = useRef<HTMLDivElement>(null);
  const [pausedForKeyboard, setPausedForKeyboard] = React.useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false);
  const [isInViewport, setIsInViewport] = React.useState(true);

  // Handle reduced motion
  useEffect(() => {
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(motionQuery.matches);
    const handler = (event: MediaQueryListEvent) => setPrefersReducedMotion(event.matches);
    motionQuery.addEventListener?.('change', handler);
    return () => motionQuery.removeEventListener?.('change', handler);
  }, []);

  // Handle viewport visibility
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsInViewport(entry.isIntersecting),
      { rootMargin: '100px' }
    );
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Handle document visibility
  useEffect(() => {
    const onVisibilityChange = () => {
      // Could pause/resume based on visibility
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, []);

  const isPaused = prefersReducedMotion || pausedForKeyboard || !isInViewport;

  const handleNodeKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>, href: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      navigate(href);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full aspect-square flex items-center justify-center ${className}`}
      style={
        typeof size === 'number'
          ? { width: size, height: size }
          : typeof size === 'string' && size !== '100%'
          ? { width: size, height: size }
          : { width: '100%', height: '100%' }
      }
      role="group"
      aria-label="Explore Sahadhyayi through the Library, Authors, Social Media, Articles, and Games orbits"
    >
      <HeroAtomicRings3DScene paused={isPaused} children={children} />

      {/* Keyboard-accessible fallback links (screen reader only) */}
      <div className="sr-only" aria-live="polite">
        {ORBITS.map((orbit) => (
          <button
            key={orbit.id}
            onClick={() => navigate(orbit.href)}
            onKeyDown={(e) => handleNodeKeyDown(e, orbit.href)}
            className="focus-visible:not-sr-only focus-visible:absolute focus-visible:z-50 focus-visible:p-4 focus-visible:bg-white focus-visible:rounded-lg focus-visible:shadow-lg"
          >
            Explore {orbit.label}
          </button>
        ))}
      </div>
    </div>
  );
}