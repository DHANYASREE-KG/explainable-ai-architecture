import React, { useState } from 'react';
import { LandDetails, FacingDirection, PlotType, PolygonPoint } from '../types';
import { PolygonPlotCanvas } from './PolygonPlotCanvas';
import {
  calculatePolygonArea,
  getPolygonBounds,
  isSimplePolygon,
  PRESET_IRREGULAR_PLOTS,
} from '../services/polygonUtils';
import {
  ArrowRight,
  Ruler,
  Square,
  RectangleHorizontal,
  Hexagon,
  Compass,
  Layers,
  Sparkles,
} from 'lucide-react';

interface StepLandDetailsProps {
  land: LandDetails;
  onChangeLand: (land: LandDetails) => void;
  onNext: () => void;
  facingDirection?: FacingDirection;
}

export const StepLandDetails: React.FC<StepLandDetailsProps> = ({
  land,
  onChangeLand,
  onNext,
  facingDirection = 'North',
}) => {
  const [unit, setUnit] = useState<'ft' | 'm'>('ft');
  const plotType: PlotType = land.plotType || 'rectangle';

  const rectanglePresets = [
    { label: '30 × 40 ft', length: 30, breadth: 40, desc: '1,200 sq.ft' },
    { label: '30 × 50 ft', length: 30, breadth: 50, desc: '1,500 sq.ft' },
    { label: '40 × 50 ft', length: 40, breadth: 50, desc: '2,000 sq.ft' },
    { label: '40 × 60 ft', length: 40, breadth: 60, desc: '2,400 sq.ft' },
    { label: '50 × 60 ft', length: 50, breadth: 60, desc: '3,000 sq.ft' },
    { label: '60 × 80 ft', length: 60, breadth: 80, desc: '4,800 sq.ft' },
  ];

  const squarePresets = [
    { label: '30 × 30 ft', side: 30, desc: '900 sq.ft' },
    { label: '35 × 35 ft', side: 35, desc: '1,225 sq.ft' },
    { label: '40 × 40 ft', side: 40, desc: '1,600 sq.ft' },
    { label: '50 × 50 ft', side: 50, desc: '2,500 sq.ft' },
  ];

  const handlePlotTypeChange = (newType: PlotType) => {
    if (newType === 'polygon') {
      const initialPoints =
        land.polygonPoints && land.polygonPoints.length >= 3
          ? land.polygonPoints
          : PRESET_IRREGULAR_PLOTS[0].points;
      const bounds = getPolygonBounds(initialPoints);
      const area = calculatePolygonArea(initialPoints);
      onChangeLand({
        ...land,
        plotType: 'polygon',
        length: bounds.width,
        breadth: bounds.height,
        totalArea: area,
        polygonPoints: initialPoints,
      });
    } else if (newType === 'square') {
      const side = land.length > 0 ? land.length : 40;
      onChangeLand({
        ...land,
        plotType: 'square',
        length: side,
        breadth: side,
        totalArea: side * side,
      });
    } else {
      const len = land.length > 0 ? land.length : 30;
      const br = land.breadth > 0 ? land.breadth : 40;
      onChangeLand({
        ...land,
        plotType: 'rectangle',
        length: len,
        breadth: br,
        totalArea: len * br,
      });
    }
  };

  const handleRectanglePreset = (len: number, br: number) => {
    onChangeLand({
      ...land,
      plotType: 'rectangle',
      length: len,
      breadth: br,
      totalArea: len * br,
    });
  };

  const handleSquarePreset = (side: number) => {
    onChangeLand({
      ...land,
      plotType: 'square',
      length: side,
      breadth: side,
      totalArea: side * side,
    });
  };

  const handleDimensionChange = (key: 'length' | 'breadth', value: number) => {
    const validVal = Math.max(0, value);
    if (plotType === 'square') {
      onChangeLand({
        ...land,
        plotType: 'square',
        length: validVal,
        breadth: validVal,
        totalArea: validVal * validVal,
      });
    } else {
      const updated = {
        ...land,
        plotType: 'rectangle' as PlotType,
        [key]: validVal,
      };
      updated.totalArea = updated.length * updated.breadth;
      onChangeLand(updated);
    }
  };

  const handlePolygonPointsChange = (newPoints: PolygonPoint[]) => {
    const bounds = getPolygonBounds(newPoints);
    const area = calculatePolygonArea(newPoints);
    onChangeLand({
      ...land,
      plotType: 'polygon',
      length: bounds.width,
      breadth: bounds.height,
      totalArea: area,
      polygonPoints: newPoints,
    });
  };

  let isValid = false;
  if (plotType === 'polygon') {
    const polyCheck = isSimplePolygon(land.polygonPoints || []);
    isValid = polyCheck.valid && land.totalArea > 0;
  } else {
    isValid = land.length > 0 && land.breadth > 0 && land.totalArea > 0;
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto py-4">
      {/* Global Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-6 border-b border-[#E2E8F0]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#2563EB] bg-[#EFF6FF] px-2.5 py-0.5 rounded-md border border-[#DBEAFE]">
              01 • SITE PLANNING
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#0F172A] tracking-tight">
            Plot Dimensions
          </h2>
          <p className="text-sm text-[#64748B] mt-1 max-w-2xl">
            Define the size, shape, and boundary geometry of your site.
          </p>
        </div>

        {/* Unit Selector */}
        <div className="flex items-center bg-[#F1F5F9] p-1 rounded-lg border border-[#E2E8F0] shrink-0">
          <button
            type="button"
            onClick={() => setUnit('ft')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              unit === 'ft'
                ? 'bg-[#FFFFFF] text-[#0F172A] shadow-xs'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            Feet (ft)
          </button>
          <button
            type="button"
            onClick={() => setUnit('m')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              unit === 'm'
                ? 'bg-[#FFFFFF] text-[#0F172A] shadow-xs'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            Meters (m)
          </button>
        </div>
      </div>

      {/* Main 2-Column Architectural Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        
        {/* Left: Input Form (7 cols for rect/square, 5 cols for polygon) */}
        <div className={`${plotType === 'polygon' ? 'lg:col-span-5' : 'lg:col-span-7'} space-y-6`}>
          
          {/* 1. Plot Shape Selection */}
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider font-mono text-[#0F172A]">
              1. Site Geometry Shape
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => handlePlotTypeChange('rectangle')}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-2 relative ${
                  plotType === 'rectangle'
                    ? 'border-[#2563EB] bg-[#EFF6FF] shadow-xs'
                    : 'border-[#E2E8F0] bg-[#FFFFFF] hover:border-[#CBD5E1] hover:bg-[#F8FAFC]'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    plotType === 'rectangle'
                      ? 'bg-[#2563EB] text-white'
                      : 'bg-[#F1F5F9] text-[#64748B]'
                  }`}
                >
                  <RectangleHorizontal className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-semibold text-[#0F172A]">
                    Rectangular
                  </div>
                  <p className="text-[11px] text-[#64748B] mt-0.5">
                    Width × Depth
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handlePlotTypeChange('square')}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-2 relative ${
                  plotType === 'square'
                    ? 'border-[#2563EB] bg-[#EFF6FF] shadow-xs'
                    : 'border-[#E2E8F0] bg-[#FFFFFF] hover:border-[#CBD5E1] hover:bg-[#F8FAFC]'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    plotType === 'square'
                      ? 'bg-[#2563EB] text-white'
                      : 'bg-[#F1F5F9] text-[#64748B]'
                  }`}
                >
                  <Square className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-semibold text-[#0F172A]">
                    Square
                  </div>
                  <p className="text-[11px] text-[#64748B] mt-0.5">
                    Equal sides
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handlePlotTypeChange('polygon')}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-2 relative ${
                  plotType === 'polygon'
                    ? 'border-[#2563EB] bg-[#EFF6FF] shadow-xs'
                    : 'border-[#E2E8F0] bg-[#FFFFFF] hover:border-[#CBD5E1] hover:bg-[#F8FAFC]'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    plotType === 'polygon'
                      ? 'bg-[#2563EB] text-white'
                      : 'bg-[#F1F5F9] text-[#64748B]'
                  }`}
                >
                  <Hexagon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-semibold text-[#0F172A]">
                    Irregular
                  </div>
                  <p className="text-[11px] text-[#64748B] mt-0.5">
                    Custom Polygon
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* 2. Dimensions Form */}
          {plotType === 'rectangle' && (
            <div className="space-y-4 bg-[#FFFFFF] p-5 rounded-xl border border-[#E2E8F0] shadow-xs">
              <label className="block text-xs font-bold uppercase tracking-wider font-mono text-[#0F172A]">
                2. Boundary Measurements
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#64748B] mb-1.5">
                    Plot Width / Frontage ({unit})
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="10"
                      max="500"
                      value={land.length || ''}
                      onChange={(e) =>
                        handleDimensionChange('length', parseFloat(e.target.value) || 0)
                      }
                      placeholder="30"
                      className="arch-input pr-12 font-mono text-sm font-semibold"
                    />
                    <span className="absolute right-3.5 top-[12px] text-xs text-[#94A3B8] font-mono">
                      {unit}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#64748B] mb-1.5">
                    Plot Depth / Length ({unit})
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="10"
                      max="500"
                      value={land.breadth || ''}
                      onChange={(e) =>
                        handleDimensionChange('breadth', parseFloat(e.target.value) || 0)
                      }
                      placeholder="40"
                      className="arch-input pr-12 font-mono text-sm font-semibold"
                    />
                    <span className="absolute right-3.5 top-[12px] text-xs text-[#94A3B8] font-mono">
                      {unit}
                    </span>
                  </div>
                </div>
              </div>

              {/* Standard Presets */}
              <div className="pt-2">
                <div className="text-[11px] font-semibold text-[#64748B] mb-2 font-mono uppercase tracking-wider">
                  Popular Site Sizes
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                  {rectanglePresets.map((preset) => {
                    const isSelected =
                      land.length === preset.length && land.breadth === preset.breadth;
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() =>
                          handleRectanglePreset(preset.length, preset.breadth)
                        }
                        className={`px-2 py-1.5 rounded-lg border text-center transition-all cursor-pointer text-xs font-mono ${
                          isSelected
                            ? 'border-[#2563EB] bg-[#2563EB] text-white font-bold shadow-xs'
                            : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#334155] hover:border-[#CBD5E1]'
                        }`}
                      >
                        {preset.length}×{preset.breadth}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {plotType === 'square' && (
            <div className="space-y-4 bg-[#FFFFFF] p-5 rounded-xl border border-[#E2E8F0] shadow-xs">
              <label className="block text-xs font-bold uppercase tracking-wider font-mono text-[#0F172A]">
                2. Boundary Measurements
              </label>
              <div className="max-w-xs">
                <label className="block text-xs font-medium text-[#64748B] mb-1.5">
                  Side Length ({unit})
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="10"
                    max="500"
                    value={land.length || ''}
                    onChange={(e) =>
                      handleDimensionChange('length', parseFloat(e.target.value) || 0)
                    }
                    placeholder="40"
                    className="arch-input pr-12 font-mono text-sm font-semibold"
                  />
                  <span className="absolute right-3.5 top-[12px] text-xs text-[#94A3B8] font-mono">
                    {unit}
                  </span>
                </div>
              </div>

              {/* Standard Presets */}
              <div className="pt-2">
                <div className="text-[11px] font-semibold text-[#64748B] mb-2 font-mono uppercase tracking-wider">
                  Popular Square Sizes
                </div>
                <div className="flex flex-wrap gap-2">
                  {squarePresets.map((preset) => {
                    const isSelected = land.length === preset.side;
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => handleSquarePreset(preset.side)}
                        className={`px-3 py-1.5 rounded-lg border text-center transition-all cursor-pointer text-xs font-mono ${
                          isSelected
                            ? 'border-[#2563EB] bg-[#2563EB] text-white font-bold shadow-xs'
                            : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#334155] hover:border-[#CBD5E1]'
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {plotType === 'polygon' && (
            <div className="space-y-4 bg-[#FFFFFF] p-5 rounded-xl border border-[#E2E8F0] shadow-xs">
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                <label className="block text-xs font-bold uppercase tracking-wider font-mono text-[#0F172A]">
                  2. Boundary Configuration
                </label>
                <span className="text-[10px] font-mono bg-[#EFF6FF] text-[#2563EB] px-2 py-0.5 rounded border border-[#DBEAFE] font-semibold">
                  Custom Vertices
                </span>
              </div>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Use the CAD Interactive Boundary Editor on the right to modify vertices, adjust edge lengths, snap to grid, or select architectural presets.
              </p>
              <div className="pt-2 border-t border-[#F1F5F9] grid grid-cols-2 gap-3 text-xs">
                <div className="bg-[#F8FAFC] p-3 rounded-lg border border-[#E2E8F0]">
                  <div className="text-[11px] font-mono text-[#64748B] uppercase">Vertices Defined</div>
                  <div className="text-base font-bold font-mono text-[#0F172A] mt-0.5">
                    {land.polygonPoints?.length || 0} Points
                  </div>
                </div>
                <div className="bg-[#F8FAFC] p-3 rounded-lg border border-[#E2E8F0]">
                  <div className="text-[11px] font-mono text-[#64748B] uppercase">Boundary Status</div>
                  <div className="text-base font-bold font-mono text-[#10B981] mt-0.5 flex items-center gap-1">
                    {isValid ? 'Valid Shape' : 'Invalid Polygon'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Site Area Summary Metric Card */}
          <div className="bg-[#FFFFFF] p-4 rounded-xl border border-[#E2E8F0] flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center border border-[#DBEAFE]">
                <Ruler className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-[#64748B] font-mono">
                  Gross Site Area
                </div>
                <div className="text-xs text-[#94A3B8]">
                  Total bounded envelope footprint
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold font-mono text-[#0F172A]">
                {(land?.totalArea ?? 0).toLocaleString()}{' '}
                <span className="text-xs font-normal text-[#64748B]">sq.ft</span>
              </div>
              <div className="text-[11px] text-[#64748B] font-mono">
                {((land?.totalArea ?? 0) / 9).toFixed(1)} sq.yards (
                {((land?.totalArea ?? 0) * 0.092903).toFixed(1)} m²)
              </div>
            </div>
          </div>
        </div>

        {/* Right: Conditional Workspace (5 cols for rect/square, 7 cols for polygon) */}
        <div className={`${plotType === 'polygon' ? 'lg:col-span-7' : 'lg:col-span-5'} space-y-4`}>
          {plotType !== 'polygon' ? (
            /* Live Site Preview for Rectangular & Square */
            <div className="bg-[#FFFFFF] rounded-xl border border-[#E2E8F0] p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-[#2563EB]" />
                  <span className="text-xs font-bold font-mono uppercase tracking-wider text-[#0F172A]">
                    Live Site Preview
                  </span>
                </div>
                <span className="text-[10px] font-mono bg-[#F1F5F9] text-[#475569] px-2 py-0.5 rounded border border-[#E2E8F0]">
                  Scale 1:100
                </span>
              </div>

              {/* Live Plot Graphic */}
              <div className="aspect-4/3 bg-[#F8FAFC] arch-grid-bg rounded-lg border border-[#E2E8F0] relative flex items-center justify-center p-6 overflow-hidden">
                
                {/* Orientation Compass Mini */}
                <div className="absolute top-3 right-3 bg-[#FFFFFF]/90 backdrop-blur-xs px-2 py-1 rounded-md border border-[#E2E8F0] shadow-2xs flex items-center gap-1.5 text-[10px] font-mono font-bold text-[#0F172A]">
                  <div className="w-2 h-2 rounded-full bg-[#EF4444]" />
                  <span>N</span>
                </div>

                {/* Dynamic SVG Plot Visualizer */}
                <div className="w-full h-full flex flex-col items-center justify-center relative">
                  <div
                    className="relative border-2 border-dashed border-[#2563EB] bg-[#EFF6FF]/60 rounded-md flex flex-col items-center justify-center p-4 transition-all duration-300 shadow-xs"
                    style={{
                      width: `${Math.min(220, Math.max(120, (land.length / Math.max(land.length, land.breadth, 1)) * 200))}px`,
                      height: `${Math.min(180, Math.max(100, (land.breadth / Math.max(land.length, land.breadth, 1)) * 180))}px`,
                    }}
                  >
                    {/* Width tag */}
                    <div className="absolute -top-5 text-[11px] font-mono font-bold text-[#2563EB] bg-[#FFFFFF] px-1.5 py-0.5 rounded border border-[#DBEAFE]">
                      {land.length} ft
                    </div>

                    {/* Height tag */}
                    <div className="absolute -right-12 text-[11px] font-mono font-bold text-[#2563EB] bg-[#FFFFFF] px-1.5 py-0.5 rounded border border-[#DBEAFE]">
                      {land.breadth} ft
                    </div>

                    <div className="text-center">
                      <div className="text-xs font-bold text-[#0F172A] font-mono">
                        {(land?.totalArea ?? 0).toLocaleString()} SQ.FT
                      </div>
                      <div className="text-[10px] text-[#64748B] font-mono uppercase mt-0.5">
                        {plotType} Plot
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Site Constraints Checklist */}
              <div className="space-y-1.5 text-xs text-[#475569]">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-[#64748B]">Frontage Road Access:</span>
                  <span className="font-semibold text-[#0F172A]">Primary Boundary</span>
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-[#64748B]">Default Setbacks:</span>
                  <span className="font-semibold text-[#0F172A]">Front 3ft, Sides 2.5ft</span>
                </div>
              </div>
            </div>
          ) : (
            /* Irregular Polygon Vertices Editor for Irregular Shape */
            <div className="space-y-3 bg-[#FFFFFF] p-5 rounded-xl border border-[#E2E8F0] shadow-xs">
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                <div className="flex items-center gap-2">
                  <Hexagon className="w-4 h-4 text-[#2563EB]" />
                  <span className="text-xs font-bold font-mono uppercase tracking-wider text-[#0F172A]">
                    Irregular Polygon Vertices Editor
                  </span>
                </div>
                <span className="text-[10px] font-mono bg-[#EFF6FF] text-[#2563EB] px-2 py-0.5 rounded border border-[#DBEAFE] font-semibold">
                  CAD Interactive
                </span>
              </div>
              <div className="border border-[#E2E8F0] rounded-xl overflow-hidden bg-[#F8FAFC]">
                <PolygonPlotCanvas
                  points={land.polygonPoints || PRESET_IRREGULAR_PLOTS[0].points}
                  onChangePoints={handlePolygonPointsChange}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Process Navigation Bar */}
      <div className="pt-6 border-t border-[#E2E8F0] flex items-center justify-between">
        <div className="text-xs text-[#64748B]">
          Stage 1 of 7 • Site geometry established
        </div>

        <button
          type="button"
          onClick={onNext}
          disabled={!isValid}
          className="btn-primary"
        >
          <span>Continue to Orientation</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

