import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MapFloatingControls } from './MapFloatingControls';

describe('MapFloatingControls', () => {
  it('renders all buttons and triggers 3D, zoom, recenter, and reset actions', () => {
    const onRecenter = vi.fn();
    const onResetView = vi.fn();
    const onZoomIn = vi.fn();
    const onZoomOut = vi.fn();
    const onToggle3D = vi.fn();

    const { rerender } = render(
      <MapFloatingControls
        hasUserLocation={true}
        is3D={false}
        onToggle3D={onToggle3D}
        onZoomIn={onZoomIn}
        onZoomOut={onZoomOut}
        onRecenter={onRecenter}
        onResetView={onResetView}
      />
    );

    // 1. 3D button in 2D mode displays '3D'
    const btn3D = screen.getByRole('button', { name: /switch to 3d view/i });
    expect(btn3D).toHaveTextContent('3D');
    fireEvent.click(btn3D);
    expect(onToggle3D).toHaveBeenCalledTimes(1);

    // 2. 3D button when is3D=true displays '2D'
    rerender(
      <MapFloatingControls
        hasUserLocation={true}
        is3D={true}
        onToggle3D={onToggle3D}
        onZoomIn={onZoomIn}
        onZoomOut={onZoomOut}
        onRecenter={onRecenter}
        onResetView={onResetView}
      />
    );
    const btn2D = screen.getByRole('button', { name: /switch to 2d view/i });
    expect(btn2D).toHaveTextContent('2D');

    // 3. Zoom In (+)
    const zoomInBtn = screen.getByRole('button', { name: /zoom in/i });
    fireEvent.click(zoomInBtn);
    expect(onZoomIn).toHaveBeenCalledTimes(1);

    // 4. Zoom Out (-)
    const zoomOutBtn = screen.getByRole('button', { name: /zoom out/i });
    fireEvent.click(zoomOutBtn);
    expect(onZoomOut).toHaveBeenCalledTimes(1);

    // 5. Recenter
    const recenterBtn = screen.getByRole('button', { name: /recenter on my location/i });
    fireEvent.click(recenterBtn);
    expect(onRecenter).toHaveBeenCalledTimes(1);

    // 6. Reset View
    const resetBtn = screen.getByRole('button', { name: /reset north and fit all markers/i });
    fireEvent.click(resetBtn);
    expect(onResetView).toHaveBeenCalledTimes(1);
  });

  it('renders gracefully without zoom or 3D handlers when omitted', () => {
    const onRecenter = vi.fn();
    const onResetView = vi.fn();

    render(
      <MapFloatingControls
        hasUserLocation={false}
        onRecenter={onRecenter}
        onResetView={onResetView}
      />
    );

    expect(screen.queryByRole('button', { name: /3d/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /zoom in/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /zoom out/i })).toBeNull();
    expect(screen.getByRole('button', { name: /recenter/i })).toBeInTheDocument();
  });
});
