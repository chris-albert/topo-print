import { useEffect, useRef, useState } from 'react';
import { useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import type { Bounds } from '../../routes/index';

interface SelectionRectangleProps {
  bounds: Bounds | null;
  onBoundsChange: (bounds: Bounds) => void;
}

export function SelectionRectangle({ bounds, onBoundsChange }: SelectionRectangleProps) {
  const [drawing, setDrawing] = useState(false);
  const startPoint = useRef<L.LatLng | null>(null);
  const rectangleRef = useRef<L.Rectangle | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  const map = useMapEvents({
    mousedown(e) {
      if (e.originalEvent.shiftKey) {
        map.dragging.disable();
        setDrawing(true);
        startPoint.current = e.latlng;

        if (rectangleRef.current) {
          rectangleRef.current.remove();
        }
      }
    },
    mousemove(e) {
      if (drawing && startPoint.current) {
        const bounds = L.latLngBounds(startPoint.current, e.latlng);

        if (rectangleRef.current) {
          rectangleRef.current.setBounds(bounds);
        } else {
          rectangleRef.current = L.rectangle(bounds, {
            color: '#2563eb',
            weight: 2,
            fillOpacity: 0.15,
            fillColor: '#3b82f6',
          }).addTo(map);
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
      }
    },
  });

  mapRef.current = map;

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
        rectangleRef.current = L.rectangle(latLngBounds, {
          color: '#2563eb',
          weight: 2,
          fillOpacity: 0.15,
          fillColor: '#3b82f6',
        }).addTo(mapRef.current);
      }
    }
  }, [bounds]);

  return null;
}
