import type { Bounds } from '../../routes/index';

interface CoordinateInputsProps {
  bounds: Bounds | null;
  onBoundsChange: (bounds: Bounds) => void;
}

export function CoordinateInputs({ bounds, onBoundsChange }: CoordinateInputsProps) {
  const handleChange = (field: keyof Bounds, value: string) => {
    const num = parseFloat(value);
    if (isNaN(num)) return;

    const current = bounds || { north: 0, south: 0, east: 0, west: 0 };
    onBoundsChange({ ...current, [field]: num });
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">North</label>
        <input
          type="number"
          step="0.001"
          min="-90"
          max="90"
          value={bounds?.north.toFixed(4) ?? ''}
          onChange={(e) => handleChange('north', e.target.value)}
          placeholder="Latitude"
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">South</label>
        <input
          type="number"
          step="0.001"
          min="-90"
          max="90"
          value={bounds?.south.toFixed(4) ?? ''}
          onChange={(e) => handleChange('south', e.target.value)}
          placeholder="Latitude"
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">East</label>
        <input
          type="number"
          step="0.001"
          min="-180"
          max="180"
          value={bounds?.east.toFixed(4) ?? ''}
          onChange={(e) => handleChange('east', e.target.value)}
          placeholder="Longitude"
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">West</label>
        <input
          type="number"
          step="0.001"
          min="-180"
          max="180"
          value={bounds?.west.toFixed(4) ?? ''}
          onChange={(e) => handleChange('west', e.target.value)}
          placeholder="Longitude"
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
        />
      </div>
    </div>
  );
}
