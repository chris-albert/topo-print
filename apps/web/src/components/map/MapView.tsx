import { MapContainer, TileLayer } from 'react-leaflet';
import { SearchControl } from './SearchControl';
import { SelectionRectangle } from './SelectionRectangle';
import type { Bounds } from '../../routes/index';

interface MapViewProps {
  bounds: Bounds | null;
  onBoundsChange: (bounds: Bounds | null) => void;
  drawMode: boolean;
  onDrawComplete: () => void;
}

export function MapView({ bounds, onBoundsChange, drawMode, onDrawComplete }: MapViewProps) {
  return (
    <MapContainer
      center={[37.77, -122.43]}
      zoom={12}
      className="h-full w-full"
      zoomControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <SearchControl />
      <SelectionRectangle
        bounds={bounds}
        onBoundsChange={onBoundsChange}
        drawMode={drawMode}
        onDrawComplete={onDrawComplete}
      />
    </MapContainer>
  );
}
