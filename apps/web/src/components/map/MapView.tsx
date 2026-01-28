import { MapContainer, TileLayer } from 'react-leaflet';
import { SearchControl } from './SearchControl';
import { SelectionRectangle } from './SelectionRectangle';
import type { Bounds } from '../../routes/index';

interface MapViewProps {
  bounds: Bounds | null;
  onBoundsChange: (bounds: Bounds | null) => void;
}

export function MapView({ bounds, onBoundsChange }: MapViewProps) {
  return (
    <MapContainer
      center={[36.1, -112.1]}
      zoom={10}
      className="h-full w-full"
      zoomControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <SearchControl />
      <SelectionRectangle bounds={bounds} onBoundsChange={onBoundsChange} />
    </MapContainer>
  );
}
