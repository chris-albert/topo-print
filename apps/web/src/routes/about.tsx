import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/about')({
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-slate-900 rounded-xl shadow-sm border border-slate-800 p-8">
        <h1 className="text-3xl font-bold text-gray-100 mb-6">About Topo Print</h1>

        <div className="space-y-4 text-slate-400">
          <p>
            Topo Print lets you create 3D-printable topographic terrain models from any
            location on Earth. Simply search for a place, select an area on the map, and
            download an STL file ready for your 3D printer.
          </p>

          <h2 className="text-xl font-semibold text-gray-100 pt-4">How It Works</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>Search for a location or navigate the map to your area of interest</li>
            <li>Click and drag on the map to draw a selection rectangle</li>
            <li>Adjust the grid resolution and export settings</li>
            <li>Click "Fetch Elevation Data" to retrieve terrain heights</li>
            <li>Preview the 3D terrain model</li>
            <li>Download the STL file and load it into your slicer</li>
          </ol>

          <h2 className="text-xl font-semibold text-gray-100 pt-4">Data Sources</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>
              <strong>Map tiles</strong>: OpenStreetMap contributors
            </li>
            <li>
              <strong>Elevation data</strong>: Open-Meteo Elevation API (90m resolution DEM)
            </li>
            <li>
              <strong>Geocoding</strong>: OpenStreetMap Nominatim
            </li>
          </ul>

          <h2 className="text-xl font-semibold text-gray-100 pt-4">Limitations</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>Elevation data is based on a 90-meter resolution digital elevation model</li>
            <li>Very small areas may have limited terrain detail</li>
            <li>Maximum grid resolution is 100x100 points per fetch</li>
            <li>All processing happens in your browser - no data is sent to external servers (except API queries)</li>
          </ul>

          <h2 className="text-xl font-semibold text-gray-100 pt-4">Print Tips</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>Use a vertical exaggeration of 1.5x - 3x for best visual results</li>
            <li>A base height of at least 2mm ensures structural integrity</li>
            <li>100mm model width works well for desktop display pieces</li>
            <li>PLA or PETG filaments work great for terrain models</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
