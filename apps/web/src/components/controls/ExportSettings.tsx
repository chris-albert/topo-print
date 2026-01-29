interface ExportSettingsProps {
  gridSize: number;
  onGridSizeChange: (size: number) => void;
  modelWidth: number;
  onModelWidthChange: (width: number) => void;
  verticalScale: number;
  onVerticalScaleChange: (scale: number) => void;
  baseHeight: number;
  onBaseHeightChange: (height: number) => void;
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
    </div>
  );
}
