import { createFileRoute } from '@tanstack/react-router';
import { useState, useCallback, useEffect } from 'react';
import { MapView } from '../components/map/MapView';
import { CoordinateInputs } from '../components/controls/CoordinateInputs';
import { ExportSettings } from '../components/controls/ExportSettings';
import { MapboxTokenInput, getStoredMapboxToken } from '../components/controls/MapboxTokenInput';
import { TerrainPreview } from '../components/preview/TerrainPreview';
import { useElevationData } from '../hooks/useElevationData';
import { useStlGeneration } from '../hooks/useStlGeneration';

export interface Bounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export const Route = createFileRoute('/')({
  component: HomePage,
});

function HomePage() {
  const [bounds, setBounds] = useState<Bounds | null>(null);
  const [drawMode, setDrawMode] = useState(false);
  const [gridSize, setGridSize] = useState(50);
  const [modelWidth, setModelWidth] = useState(100);
  const [verticalScale, setVerticalScale] = useState(1.5);
  const [baseHeight, setBaseHeight] = useState(2);
  const [mapboxToken, setMapboxToken] = useState(getStoredMapboxToken);
  const [showBuildings, setShowBuildings] = useState(false);
  const [showRoads, setShowRoads] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const {
    data: elevationData,
    buildings,
    roads,
    isLoading: isFetchingElevation,
    error: elevationError,
    progress: fetchProgress,
    fetch: fetchElevation,
  } = useElevationData();

  const { generate, isGenerating } = useStlGeneration();

  // Auto-switch to 3D preview when elevation data loads
  useEffect(() => {
    if (elevationData) setShowPreview(true);
  }, [elevationData]);

  const handleFetchElevation = useCallback(() => {
    if (bounds && mapboxToken) {
      fetchElevation(bounds, gridSize, mapboxToken, showBuildings, showRoads);
    }
  }, [bounds, gridSize, mapboxToken, showBuildings, showRoads, fetchElevation]);

  const handleDownloadSTL = useCallback(() => {
    if (elevationData) {
      generate(
        elevationData,
        { width: modelWidth, verticalScale, baseHeight },
        { buildings, roads, bounds, elevationGrid: elevationData },
      );
    }
  }, [elevationData, modelWidth, verticalScale, baseHeight, buildings, roads, bounds, generate]);

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-6 max-w-[1600px] mx-auto">
      {/* Left Column - Map / 3D Preview */}
      <div className="flex-1 min-w-0">
        {showPreview && elevationData ? (
          <div className="bg-slate-900 rounded-xl shadow-sm border border-slate-800 overflow-hidden ring-1 ring-primary-500/20">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-100">3D Preview</h2>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500">Scroll to zoom · Drag to rotate · Right-drag to pan</span>
                <button
                  onClick={() => setShowPreview(false)}
                  className="px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 shrink-0 bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  Back to Map
                </button>
              </div>
            </div>
            <div className="h-[500px] lg:h-[600px]">
              <TerrainPreview
                elevationData={elevationData}
                modelWidth={modelWidth}
                verticalScale={verticalScale}
                baseHeight={baseHeight}
                buildings={buildings}
                roads={roads}
                bounds={bounds}
              />
            </div>
          </div>
        ) : (
          <div className="bg-slate-900 rounded-xl shadow-sm border border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-100">Select Region</h2>
                <p className="text-sm text-slate-400 mt-1">
                  Search for a location, then click "Draw Selection" and drag on the map
                </p>
              </div>
              <div className="flex items-center gap-2">
                {elevationData && (
                  <button
                    onClick={() => setShowPreview(true)}
                    className="px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 shrink-0 bg-primary-600 text-white hover:bg-primary-700"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
                    </svg>
                    View 3D
                  </button>
                )}
                <button
                  onClick={() => setDrawMode(!drawMode)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 shrink-0 ${
                    drawMode
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                  </svg>
                  {drawMode ? 'Drawing...' : 'Draw Selection'}
                </button>
              </div>
            </div>
            <div className="h-[500px] lg:h-[600px]">
              <MapView
                bounds={bounds}
                onBoundsChange={setBounds}
                drawMode={drawMode}
                onDrawComplete={() => setDrawMode(false)}
              />
            </div>
            <div className="p-4 border-t border-slate-800">
              <CoordinateInputs bounds={bounds} onBoundsChange={setBounds} />
            </div>
          </div>
        )}
      </div>

      {/* Right Column - Controls */}
      <div className="w-full lg:w-[400px] flex flex-col gap-4">
        {/* Mapbox Token */}
        <div className="bg-slate-900 rounded-xl shadow-sm border border-slate-800 p-4">
          <MapboxTokenInput token={mapboxToken} onTokenChange={setMapboxToken} />
        </div>

        {/* Export Settings */}
        <div className="bg-slate-900 rounded-xl shadow-sm border border-slate-800 p-4">
          <h2 className="text-lg font-semibold text-gray-100 mb-4">Export Settings</h2>
          <ExportSettings
            gridSize={gridSize}
            onGridSizeChange={setGridSize}
            modelWidth={modelWidth}
            onModelWidthChange={setModelWidth}
            verticalScale={verticalScale}
            onVerticalScaleChange={setVerticalScale}
            baseHeight={baseHeight}
            onBaseHeightChange={setBaseHeight}
            showBuildings={showBuildings}
            onShowBuildingsChange={setShowBuildings}
            showRoads={showRoads}
            onShowRoadsChange={setShowRoads}
          />
        </div>

        {/* Fetch Elevation */}
        <button
          onClick={handleFetchElevation}
          disabled={!bounds || !mapboxToken || isFetchingElevation}
          className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
        >
          {isFetchingElevation
            ? `Fetching Elevation... ${Math.round(fetchProgress)}%`
            : 'Fetch Elevation Data'}
        </button>

        {elevationError && (
          <div className="bg-red-900/30 border border-red-800 text-red-400 rounded-lg p-3 text-sm">
            {elevationError}
          </div>
        )}

        {/* Download STL */}
        <button
          onClick={handleDownloadSTL}
          disabled={!elevationData || isGenerating}
          className="w-full py-3 px-4 bg-slate-100 hover:bg-white disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-slate-900 font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          {isGenerating ? 'Generating STL...' : 'Download STL'}
        </button>

        {!bounds && (
          <div className="bg-blue-900/30 border border-blue-800 text-blue-400 rounded-lg p-3 text-sm">
            Click "Draw Selection" above the map, then drag to select an area. Or enter coordinates manually.
          </div>
        )}
      </div>
    </div>
  );
}
