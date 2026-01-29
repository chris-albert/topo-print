interface ExportSettingsProps {
  gridSize: number;
  onGridSizeChange: (size: number) => void;
  modelWidth: number;
  onModelWidthChange: (width: number) => void;
  verticalScale: number;
  onVerticalScaleChange: (scale: number) => void;
  baseHeight: number;
  onBaseHeightChange: (height: number) => void;
  showBuildings: boolean;
  onShowBuildingsChange: (show: boolean) => void;
  buildingScale: number;
  onBuildingScaleChange: (scale: number) => void;
  buildingAddress: string;
  onBuildingAddressChange: (address: string) => void;
  buildingAddressError?: string | null;
  buildingMatchCount?: number | null;
  houseShape: boolean;
  onHouseShapeChange: (on: boolean) => void;
  footprintScale: number;
  onFootprintScaleChange: (scale: number) => void;
  showRoads: boolean;
  onShowRoadsChange: (show: boolean) => void;
}

export function ExportSettings({
  gridSize,
  onGridSizeChange,
  modelWidth,
  onModelWidthChange,
  verticalScale,
  onVerticalScaleChange,
  baseHeight,
  onBaseHeightChange,
  showBuildings,
  onShowBuildingsChange,
  buildingScale,
  onBuildingScaleChange,
  buildingAddress,
  onBuildingAddressChange,
  buildingAddressError,
  buildingMatchCount,
  houseShape,
  onHouseShapeChange,
  footprintScale,
  onFootprintScaleChange,
  showRoads,
  onShowRoadsChange,
}: ExportSettingsProps) {
  return (
    <div className="space-y-4">
      {/* Grid Resolution */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <label className="text-sm font-medium text-slate-300">Grid Resolution</label>
          <span className="text-sm text-slate-400">{gridSize} x {gridSize}</span>
        </div>
        <input
          type="range"
          min="10"
          max="250"
          step="5"
          value={gridSize}
          onChange={(e) => onGridSizeChange(Number(e.target.value))}
          className="w-full accent-primary-600"
        />
        <div className="flex justify-between text-xs text-slate-500 mt-1">
          <span>Low (10)</span>
          <span>High (250)</span>
        </div>
      </div>

      {/* Model Width */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <label className="text-sm font-medium text-slate-300">Model Width</label>
          <span className="text-sm text-slate-400">{modelWidth}mm</span>
        </div>
        <input
          type="range"
          min="50"
          max="300"
          step="10"
          value={modelWidth}
          onChange={(e) => onModelWidthChange(Number(e.target.value))}
          className="w-full accent-primary-600"
        />
        <div className="flex justify-between text-xs text-slate-500 mt-1">
          <span>50mm</span>
          <span>300mm</span>
        </div>
      </div>

      {/* Vertical Scale */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <label className="text-sm font-medium text-slate-300">Vertical Exaggeration</label>
          <span className="text-sm text-slate-400">{verticalScale.toFixed(1)}x</span>
        </div>
        <input
          type="range"
          min="0.5"
          max="5"
          step="0.1"
          value={verticalScale}
          onChange={(e) => onVerticalScaleChange(Number(e.target.value))}
          className="w-full accent-primary-600"
        />
        <div className="flex justify-between text-xs text-slate-500 mt-1">
          <span>0.5x</span>
          <span>5.0x</span>
        </div>
      </div>

      {/* Base Height */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <label className="text-sm font-medium text-slate-300">Base Height</label>
          <span className="text-sm text-slate-400">{baseHeight}mm</span>
        </div>
        <input
          type="range"
          min="1"
          max="10"
          step="0.5"
          value={baseHeight}
          onChange={(e) => onBaseHeightChange(Number(e.target.value))}
          className="w-full accent-primary-600"
        />
        <div className="flex justify-between text-xs text-slate-500 mt-1">
          <span>1mm</span>
          <span>10mm</span>
        </div>
      </div>

      {/* Feature Overlays */}
      <div className="border-t border-slate-700 pt-4">
        <label className="text-sm font-medium text-slate-300 block mb-3">3D Features</label>
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={showBuildings}
              onChange={(e) => onShowBuildingsChange(e.target.checked)}
              className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-primary-600 focus:ring-primary-500 focus:ring-offset-0"
            />
            <span className="text-sm text-slate-300">Buildings</span>
          </label>
          {showBuildings && (
            <div className="ml-7 space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1">Single Building Address</label>
                <input
                  type="text"
                  value={buildingAddress}
                  onChange={(e) => onBuildingAddressChange(e.target.value)}
                  placeholder="Leave empty for all buildings"
                  className="w-full px-3 py-1.5 text-sm bg-slate-800 border border-slate-700 text-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none placeholder-slate-600"
                />
                {buildingAddressError && (
                  <p className="text-xs text-amber-400 mt-1">{buildingAddressError}</p>
                )}
                {buildingAddress.trim() && !buildingAddressError && buildingMatchCount != null && buildingMatchCount > 0 && (
                  <p className="text-xs text-green-400 mt-1">Building found</p>
                )}
              </div>
              {buildingAddress.trim() && buildingMatchCount != null && buildingMatchCount > 0 && (
                <>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={houseShape}
                      onChange={(e) => onHouseShapeChange(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-primary-600 focus:ring-primary-500 focus:ring-offset-0"
                    />
                    <span className="text-xs text-slate-300">House shape (gabled roof)</span>
                  </label>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-medium text-slate-400">Footprint Scale</label>
                      <span className="text-xs text-slate-500">{footprintScale.toFixed(1)}x</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      step="0.5"
                      value={footprintScale}
                      onChange={(e) => onFootprintScaleChange(Number(e.target.value))}
                      className="w-full accent-primary-600"
                    />
                    <div className="flex justify-between text-xs text-slate-600 mt-0.5">
                      <span>1x</span>
                      <span>10x</span>
                    </div>
                  </div>
                </>
              )}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-medium text-slate-400">Building Scale</label>
                  <span className="text-xs text-slate-500">{buildingScale.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="10"
                  step="0.5"
                  value={buildingScale}
                  onChange={(e) => onBuildingScaleChange(Number(e.target.value))}
                  className="w-full accent-primary-600"
                />
                <div className="flex justify-between text-xs text-slate-600 mt-0.5">
                  <span>0.5x</span>
                  <span>10x</span>
                </div>
              </div>
            </div>
          )}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={showRoads}
              onChange={(e) => onShowRoadsChange(e.target.checked)}
              className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-primary-600 focus:ring-primary-500 focus:ring-offset-0"
            />
            <span className="text-sm text-slate-300">Roads</span>
          </label>
        </div>
      </div>
    </div>
  );
}
