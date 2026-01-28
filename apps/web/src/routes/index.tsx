import { createFileRoute } from '@tanstack/react-router';
import { useState, useCallback } from 'react';
import { MapView } from '../components/map/MapView';
import { CoordinateInputs } from '../components/controls/CoordinateInputs';
import { ExportSettings } from '../components/controls/ExportSettings';
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

  const {
    data: elevationData,
    isLoading: isFetchingElevation,
    error: elevationError,
    progress: fetchProgress,
    fetch: fetchElevation,
  } = useElevationData();

  const { generate, isGenerating } = useStlGeneration();

  const handleFetchElevation = useCallback(() => {
    if (bounds) {
      fetchElevation(bounds, gridSize);
    }
  }, [bounds, gridSize, fetchElevation]);

  const handleDownloadSTL = useCallback(() => {
    if (elevationData) {
      generate(elevationData, { width: modelWidth, verticalScale, baseHeight });
    }
  }, [elevationData, modelWidth, verticalScale, baseHeight, generate]);

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-6 max-w-[1600px] mx-auto">
      {/* Left Column - Map */}
      <div className="flex-1 min-w-0">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Select Region</h2>
              <p className="text-sm text-gray-500 mt-1">
                Search for a location, then click "Draw Selection" and drag on the map
              </p>
            </div>
            <button
              onClick={() => setDrawMode(!drawMode)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 shrink-0 ${
                drawMode
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
              </svg>
              {drawMode ? 'Drawing...' : 'Draw Selection'}
            </button>
          </div>
          <div className="h-[500px] lg:h-[600px]">
            <MapView
              bounds={bounds}
              onBoundsChange={setBounds}
              drawMode={drawMode}
              onDrawComplete={() => setDrawMode(false)}
            />
          </div>
          <div className="p-4 border-t border-gray-100">
            <CoordinateInputs bounds={bounds} onBoundsChange={setBounds} />
          </div>
        </div>
      </div>

      {/* Right Column - Controls */}
      <div className="w-full lg:w-[400px] flex flex-col gap-4">
        {/* Export Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Export Settings</h2>
          <ExportSettings
            gridSize={gridSize}
            onGridSizeChange={setGridSize}
            modelWidth={modelWidth}
            onModelWidthChange={setModelWidth}
            verticalScale={verticalScale}
            onVerticalScaleChange={setVerticalScale}
            baseHeight={baseHeight}
            onBaseHeightChange={setBaseHeight}
          />
        </div>

        {/* Fetch Elevation */}
        <button
          onClick={handleFetchElevation}
          disabled={!bounds || isFetchingElevation}
          className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
        >
          {isFetchingElevation
            ? `Fetching Elevation... ${Math.round(fetchProgress)}%`
            : 'Fetch Elevation Data'}
        </button>

        {elevationError && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
            {elevationError}
          </div>
        )}

        {/* 3D Preview */}
        {elevationData && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">3D Preview</h2>
            </div>
            <div className="h-[300px]">
              <TerrainPreview
                elevationData={elevationData}
                modelWidth={modelWidth}
                verticalScale={verticalScale}
                baseHeight={baseHeight}
              />
            </div>
          </div>
        )}

        {/* Download STL */}
        <button
          onClick={handleDownloadSTL}
          disabled={!elevationData || isGenerating}
          className="w-full py-3 px-4 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          {isGenerating ? 'Generating STL...' : 'Download STL'}
        </button>

        {!bounds && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 rounded-lg p-3 text-sm">
            Click "Draw Selection" above the map, then drag to select an area. Or enter coordinates manually.
          </div>
        )}
      </div>
    </div>
  );
}
