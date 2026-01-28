import { useEffect, useRef, useState } from 'react';
import { useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import type { Bounds } from '../../routes/index';

interface SelectionRectangleProps {
  bounds: Bounds | null;
  onBoundsChange: (bounds: Bounds) => void;
  drawMode: boolean;
  onDrawComplete: () => void;
}

const RECT_STYLE = {
  color: '#2563eb',
  weight: 2,
  fillOpacity: 0.15,
  fillColor: '#3b82f6',
};

export function SelectionRectangle({ bounds, onBoundsChange, drawMode, onDrawComplete }: SelectionRectangleProps) {
  const [drawing, setDrawing] = useState(false);
  const startPoint = useRef<L.LatLng | null>(null);
  const rectangleRef = useRef<L.Rectangle | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  const map = useMapEvents({
    mousedown(e) {
      if (!drawMode) return;
      map.dragging.disable();
      setDrawing(true);
      startPoint.current = e.latlng;

      if (rectangleRef.current) {
        rectangleRef.current.remove();
        rectangleRef.current = null;
      }
    },
    mousemove(e) {
      if (drawing && startPoint.current) {
        const b = L.latLngBounds(startPoint.current, e.latlng);

        if (rectangleRef.current) {
          rectangleRef.current.setBounds(b);
        } else {
          rectangleRef.current = L.rectangle(b, RECT_STYLE).addTo(map);
        }
      }
    },
    mouseup(e) {
      if (drawing && startPoint.current) {
        map.dragging.enable();
        setDrawing(false);

        const latBounds = L.latLngBounds(startPoint.current, e.latlng);
        onBoundsChange({
          north: latBounds.getNorth(),
          south: latBounds.getSouth(),
          east: latBounds.getEast(),
          west: latBounds.getWest(),
        });

        startPoint.current = null;
        onDrawComplete();
      }
    },
  });

  mapRef.current = map;

  // Toggle cursor style and dragging based on drawMode
  useEffect(() => {
    const container = map.getContainer();
    if (drawMode) {
      container.style.cursor = 'crosshair';
      map.dragging.disable();
    } else {
      container.style.cursor = '';
      map.dragging.enable();
    }
    return () => {
      container.style.cursor = '';
    };
  }, [drawMode, map]);

  // Sync rectangle when bounds change externally (e.g., from coordinate inputs)
  useEffect(() => {
    if (!mapRef.current) return;

    if (bounds) {
      const latLngBounds = L.latLngBounds(
        [bounds.south, bounds.west],
        [bounds.north, bounds.east],
      );

      if (rectangleRef.current) {
        rectangleRef.current.setBounds(latLngBounds);
      } else {
        rectangleRef.current = L.rectangle(latLngBounds, RECT_STYLE).addTo(mapRef.current);
      }
    }
  }, [bounds]);

  return null;
}
