import React, { useState, useRef, useEffect, useMemo } from 'react';
import { LayoutData, RoomPlacement } from '../../types';
import { ExplainableAIBlueprintAnalysis } from '../ExplainBlueprint/ExplainableAIBlueprintAnalysis';
import { calculateEdgeLengths, computeInnerBuildablePolygon } from '../../services/polygonUtils';
import { formatDim } from '../../services/explainableAIAnalyzer';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  FileImage,
  FileCode,
  ArrowRight,
  Grid3X3,
  Box,
} from 'lucide-react';

interface Blueprint2DCanvasProps {
  layoutData: LayoutData;
  onGenerate3D: () => void;
  has3D?: boolean;
  onSwitchView?: (view: '2d' | '3d') => void;
}

export const Blueprint2DCanvas: React.FC<Blueprint2DCanvasProps> = ({
  layoutData,
  onGenerate3D,
  has3D = false,
  onSwitchView,
}) => {
  // Zoom & Pan state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const landW = layoutData.land.length;
  const landH = layoutData.land.breadth;
  const facing = layoutData.facingDirection || 'North';

  const isPolygonPlot =
    layoutData.land.plotType === 'polygon' &&
    !!layoutData.land.polygonPoints &&
    layoutData.land.polygonPoints.length >= 3;

  // Base scale (20 SVG pixels per architectural foot)
  const baseScale = 20;

  // 1. Calculate dynamic tight bounding box for the actual visible blueprint drawing
  const {
    bboxLeft,
    bboxTop,
    svgWidth,
    svgHeight,
    offsetX,
    offsetY,
  } = useMemo(() => {
    let minX = 0;
    let minY = 0;
    let maxX = landW;
    let maxY = landH;

    if (isPolygonPlot && layoutData.land.polygonPoints) {
      const xs = layoutData.land.polygonPoints.map((p) => p.x);
      const ys = layoutData.land.polygonPoints.map((p) => p.y);
      minX = Math.min(...xs);
      minY = Math.min(...ys);
      maxX = Math.max(...xs);
      maxY = Math.max(...ys);
    }

    // Precise architectural margins in feet (strictly sized for annotations & road)
    const roadMargin = 2.4; // Road lane lines and text
    const dimMargin = 1.1; // Dimension extension lines & measurement callouts
    const edgeMargin = 0.4; // Clean border breathing margin

    const bLeft = minX - (facing === 'West' ? roadMargin : isPolygonPlot ? edgeMargin : dimMargin);
    const bRight = maxX + (facing === 'East' ? roadMargin : edgeMargin);
    const bTop = minY - (facing === 'North' ? roadMargin : isPolygonPlot ? edgeMargin : dimMargin);
    const bBottom = maxY + (facing === 'South' ? roadMargin : edgeMargin);

    const pad = 0.25; // 5px crisp display margin
    const finalLeft = bLeft - pad;
    const finalRight = bRight + pad;
    const finalTop = bTop - pad;
    const finalBottom = bBottom + pad;

    const wFt = Math.max(6, finalRight - finalLeft);
    const hFt = Math.max(6, finalBottom - finalTop);

    const sWidth = Math.round(wFt * baseScale);
    const sHeight = Math.round(hFt * baseScale);

    // Offset in SVG pixels to map world (0,0) accurately to SVG canvas
    const offX = -finalLeft * baseScale;
    const offY = -finalTop * baseScale;

    return {
      bboxLeft: finalLeft,
      bboxTop: finalTop,
      svgWidth: sWidth,
      svgHeight: sHeight,
      offsetX: offX,
      offsetY: offY,
    };
  }, [landW, landH, isPolygonPlot, layoutData.land.polygonPoints, facing]);

  const polygonPointsStr = isPolygonPlot
    ? layoutData.land.polygonPoints!.map((p) => `${offsetX + p.x * baseScale},${offsetY + p.y * baseScale}`).join(' ')
    : '';
  const polygonEdges = isPolygonPlot ? calculateEdgeLengths(layoutData.land.polygonPoints!) : [];
  const buildablePoly = isPolygonPlot
    ? computeInnerBuildablePolygon(layoutData.land.polygonPoints!, 2.5)
    : null;
  const buildablePointsStr = buildablePoly
    ? buildablePoly.map((p) => `${offsetX + p.x * baseScale},${offsetY + p.y * baseScale}`).join(' ')
    : '';

  // Fit to screen: tightly fits the entire blueprint drawing within the viewport with small professional margin
  const handleFitToScreen = () => {
    if (!containerRef.current) return;
    const cw = containerRef.current.clientWidth;
    const ch = containerRef.current.clientHeight;
    if (cw <= 0 || ch <= 0 || svgWidth <= 0 || svgHeight <= 0) return;

    const marginPx = cw < 640 ? 16 : 24; // 16-24px clean professional boundary margin
    const availW = Math.max(50, cw - marginPx * 2);
    const availH = Math.max(50, ch - marginPx * 2);

    const scaleX = availW / svgWidth;
    const scaleY = availH / svgHeight;
    const fitZoom = Math.min(scaleX, scaleY);

    setZoom(fitZoom);
    setPan({ x: 0, y: 0 });
  };

  useEffect(() => {
    handleFitToScreen();
    // Auto-fit on resize using ResizeObserver
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      handleFitToScreen();
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [svgWidth, svgHeight]);

  const handleZoomIn = () => setZoom((z) => Math.min(4.0, z * 1.18));
  const handleZoomOut = () => setZoom((z) => Math.max(0.2, z / 1.18));
  const handleResetView = () => {
    handleFitToScreen();
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setZoom((z) => Math.min(4.0, z * 1.08));
    } else {
      setZoom((z) => Math.max(0.2, z / 1.08));
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    setIsPanning(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isPanning) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handlePointerUp = () => {
    setIsPanning(false);
  };

  const handleDownloadSvg = () => {
    if (!svgRef.current) return;
    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(svgRef.current);
    if (!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
      source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `blueprint_${landW}x${landH}ft.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPng = () => {
    if (!svgRef.current) return;
    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(svgRef.current);
    if (!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
      source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    const svgBlob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const scaleFactor = 2;
      canvas.width = svgWidth * scaleFactor;
      canvas.height = svgHeight * scaleFactor;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const pngUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = pngUrl;
        link.download = `blueprint_${landW}x${landH}ft.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const getSimpleRoomFill = (room: RoomPlacement) => {
    const name = room.name.toLowerCase();
    if (name.includes('garden') || name.includes('lawn')) return '#E2E8F0';
    if (name.includes('parking') || name.includes('car') || name.includes('garage')) return '#F8FAFC';
    return '#FFFFFF';
  };

  return (
    <div className="space-y-6">
      {/* 2D Blueprint Header & View Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-[#0F172A] font-sans">2D Architectural Blueprint</h2>
            {/* Sibling View Switcher */}
            <div className="hidden sm:inline-flex p-0.5 bg-[#F1F5F9] rounded-lg border border-[#E2E8F0] shadow-2xs">
              <button
                type="button"
                className="px-3 py-1 rounded-md text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 bg-[#2563EB] text-white shadow-xs cursor-default"
              >
                <Grid3X3 className="w-3.5 h-3.5" />
                <span>2D Blueprint</span>
              </button>
              <button
                type="button"
                onClick={onGenerate3D}
                className="px-3 py-1 rounded-md text-xs font-mono font-semibold uppercase tracking-wider flex items-center gap-1.5 text-[#64748B] hover:text-[#0F172A] hover:bg-white/80 transition-all cursor-pointer"
              >
                <Box className="w-3.5 h-3.5" />
                <span>3D House</span>
              </button>
            </div>
          </div>
          <p className="text-xs text-[#64748B] font-sans mt-1">Dimensionally accurate technical drawing.</p>
        </div>
      </div>

      {/* Main Content Layout: Side-by-Side Blueprint & Explainable AI */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Blueprint Workspace (70% on desktop) */}
        <div className="lg:col-span-8 space-y-3">
          
          {/* Minimal Controls Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#F8FAFC] p-2 rounded-lg border border-[#E2E8F0]">
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleZoomIn}
                title="Zoom In"
                className="p-1.5 bg-white border border-[#E2E8F0] hover:bg-[#F1F5F9] rounded text-[#0F172A] text-xs flex items-center gap-1 transition-colors"
              >
                <ZoomIn className="w-3.5 h-3.5" />
                <span className="hidden sm:inline font-mono">Zoom In</span>
              </button>
              <button
                onClick={handleZoomOut}
                title="Zoom Out"
                className="p-1.5 bg-white border border-[#E2E8F0] hover:bg-[#F1F5F9] rounded text-[#0F172A] text-xs flex items-center gap-1 transition-colors"
              >
                <ZoomOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline font-mono">Zoom Out</span>
              </button>
              <button
                onClick={handleFitToScreen}
                title="Fit to Screen"
                className="p-1.5 bg-white border border-[#E2E8F0] hover:bg-[#F1F5F9] rounded text-[#0F172A] text-xs flex items-center gap-1 transition-colors"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span className="font-mono">Fit</span>
              </button>
              <button
                onClick={handleResetView}
                title="Reset View"
                className="p-1.5 bg-white border border-[#E2E8F0] hover:bg-[#F1F5F9] rounded text-[#0F172A] text-xs flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="font-mono">Reset</span>
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleDownloadPng}
                className="p-1.5 bg-white border border-[#E2E8F0] hover:bg-[#F1F5F9] rounded text-[#0F172A] text-xs flex items-center gap-1 transition-colors"
              >
                <FileImage className="w-3.5 h-3.5 text-[#2563EB]" />
                <span className="font-mono">PNG</span>
              </button>
              <button
                onClick={handleDownloadSvg}
                className="p-1.5 bg-white border border-[#E2E8F0] hover:bg-[#F1F5F9] rounded text-[#0F172A] text-xs flex items-center gap-1 transition-colors"
              >
                <FileCode className="w-3.5 h-3.5 text-[#2563EB]" />
                <span className="font-mono">SVG</span>
              </button>
            </div>
          </div>

          {/* Blueprint Viewer Workspace Canvas */}
          <div className="bg-[#0F172A] p-2.5 rounded-xl border border-[#0F2747] shadow-inner relative">
            <div
              ref={containerRef}
              onWheel={handleWheel}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              className={`h-[520px] sm:h-[580px] lg:h-[620px] relative overflow-hidden flex items-center justify-center bg-white rounded-lg ${
                isPanning ? 'cursor-grabbing' : 'cursor-grab'
              }`}
            >
              <div
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                  transformOrigin: 'center center',
                  transition: isPanning ? 'none' : 'transform 0.1s ease-out',
                }}
                className="flex items-center justify-center"
              >
                <svg
                  ref={svgRef}
                  width={svgWidth}
                  height={svgHeight}
                  viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                  className="select-none overflow-visible"
                  style={{ background: '#FFFFFF' }}
                >
                  {/* Grid Background Pattern */}
                  <defs>
                    <pattern id="blueprint-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#F8FAFC" strokeWidth="0.5" />
                    </pattern>
                    <pattern id="blueprint-grid-major" width="100" height="100" patternUnits="userSpaceOnUse">
                      <rect width="100" height="100" fill="url(#blueprint-grid)" />
                      <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#E2E8F0" strokeWidth="1" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#blueprint-grid-major)" />

                  {/* ROAD */}
                  {(() => {
                    const roadColor = '#94A3B8';
                    const roadText = '#475569';

                    if (facing === 'North') {
                      return (
                        <g opacity="0.8">
                          <line x1={offsetX - 20} y1={offsetY - 8} x2={offsetX + landW * baseScale + 20} y2={offsetY - 8} stroke={roadColor} strokeWidth="1.5" />
                          <line x1={offsetX - 20} y1={offsetY - 48} x2={offsetX + landW * baseScale + 20} y2={offsetY - 48} stroke={roadColor} strokeWidth="1.5" />
                          <line x1={offsetX - 20} y1={offsetY - 28} x2={offsetX + landW * baseScale + 20} y2={offsetY - 28} stroke={roadColor} strokeWidth="1" strokeDasharray="10,10" />
                          <text x={offsetX + (landW * baseScale) / 2} y={offsetY - 24} fill={roadText} fontSize="11" fontWeight="700" fontFamily="sans-serif" textAnchor="middle" letterSpacing="5">ROAD</text>
                        </g>
                      );
                    } else if (facing === 'South') {
                      return (
                        <g opacity="0.8">
                          <line x1={offsetX - 20} y1={offsetY + landH * baseScale + 8} x2={offsetX + landW * baseScale + 20} y2={offsetY + landH * baseScale + 8} stroke={roadColor} strokeWidth="1.5" />
                          <line x1={offsetX - 20} y1={offsetY + landH * baseScale + 48} x2={offsetX + landW * baseScale + 20} y2={offsetY + landH * baseScale + 48} stroke={roadColor} strokeWidth="1.5" />
                          <line x1={offsetX - 20} y1={offsetY + landH * baseScale + 28} x2={offsetX + landW * baseScale + 20} y2={offsetY + landH * baseScale + 28} stroke={roadColor} strokeWidth="1" strokeDasharray="10,10" />
                          <text x={offsetX + (landW * baseScale) / 2} y={offsetY + landH * baseScale + 32} fill={roadText} fontSize="11" fontWeight="700" fontFamily="sans-serif" textAnchor="middle" letterSpacing="5">ROAD</text>
                        </g>
                      );
                    } else if (facing === 'East') {
                      return (
                        <g opacity="0.8">
                          <line x1={offsetX + landW * baseScale + 8} y1={offsetY - 20} x2={offsetX + landW * baseScale + 8} y2={offsetY + landH * baseScale + 20} stroke={roadColor} strokeWidth="1.5" />
                          <line x1={offsetX + landW * baseScale + 48} y1={offsetY - 20} x2={offsetX + landW * baseScale + 48} y2={offsetY + landH * baseScale + 20} stroke={roadColor} strokeWidth="1.5" />
                          <line x1={offsetX + landW * baseScale + 28} y1={offsetY - 20} x2={offsetX + landW * baseScale + 28} y2={offsetY + landH * baseScale + 20} stroke={roadColor} strokeWidth="1" strokeDasharray="10,10" />
                          <text x={offsetX + landW * baseScale + 32} y={offsetY + (landH * baseScale) / 2} fill={roadText} fontSize="11" fontWeight="700" fontFamily="sans-serif" textAnchor="middle" letterSpacing="5" transform={`rotate(90, ${offsetX + landW * baseScale + 32}, ${offsetY + (landH * baseScale) / 2})`}>ROAD</text>
                        </g>
                      );
                    } else {
                      return (
                        <g opacity="0.8">
                          <line x1={offsetX - 8} y1={offsetY - 20} x2={offsetX - 8} y2={offsetY + landH * baseScale + 20} stroke={roadColor} strokeWidth="1.5" />
                          <line x1={offsetX - 48} y1={offsetY - 20} x2={offsetX - 48} y2={offsetY + landH * baseScale + 20} stroke={roadColor} strokeWidth="1.5" />
                          <line x1={offsetX - 28} y1={offsetY - 20} x2={offsetX - 28} y2={offsetY + landH * baseScale + 20} stroke={roadColor} strokeWidth="1" strokeDasharray="10,10" />
                          <text x={offsetX - 24} y={offsetY + (landH * baseScale) / 2} fill={roadText} fontSize="11" fontWeight="700" fontFamily="sans-serif" textAnchor="middle" letterSpacing="5" transform={`rotate(-90, ${offsetX - 24}, ${offsetY + (landH * baseScale) / 2})`}>ROAD</text>
                        </g>
                      );
                    }
                  })()}

                  {/* BOUNDARY */}
                  {isPolygonPlot ? (
                    <g>
                      <polygon points={polygonPointsStr} fill="#FFFFFF" stroke="#0F172A" strokeWidth="1.5" />
                      {polygonEdges.map((edge) => {
                        const mx = offsetX + ((edge.from.x + edge.to.x) / 2) * baseScale;
                        const my = offsetY + ((edge.from.y + edge.to.y) / 2) * baseScale;
                        return (
                          <g key={`edge-${edge.index}`}>
                            <rect x={mx - 16} y={my - 6} width={32} height={12} rx={2} fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
                            <text x={mx} y={my + 3} fill="#0F172A" fontSize="7" fontWeight="600" fontFamily="monospace" textAnchor="middle">{formatDim(edge.length)}'</text>
                          </g>
                        );
                      })}
                      {buildablePointsStr && (
                        <polygon points={buildablePointsStr} fill="#FFFFFF" stroke="#64748B" strokeWidth="0.8" strokeDasharray="6,4" />
                      )}
                    </g>
                  ) : (
                    <g>
                      <rect x={offsetX} y={offsetY} width={landW * baseScale} height={landH * baseScale} fill="#FFFFFF" stroke="#0F172A" strokeWidth="1.5" />
                      
                      {/* Top Dimension */}
                      <line x1={offsetX} y1={offsetY - 12} x2={offsetX + landW * baseScale} y2={offsetY - 12} stroke="#475569" strokeWidth="1" />
                      <line x1={offsetX} y1={offsetY - 16} x2={offsetX} y2={offsetY - 2} stroke="#475569" strokeWidth="1" />
                      <line x1={offsetX + landW * baseScale} y1={offsetY - 16} x2={offsetX + landW * baseScale} y2={offsetY - 2} stroke="#475569" strokeWidth="1" />
                      <polygon points={`${offsetX},${offsetY-12} ${offsetX+4},${offsetY-14} ${offsetX+4},${offsetY-10}`} fill="#475569" />
                      <polygon points={`${offsetX+landW*baseScale},${offsetY-12} ${offsetX+landW*baseScale-4},${offsetY-14} ${offsetX+landW*baseScale-4},${offsetY-10}`} fill="#475569" />
                      
                      {/* Left Dimension */}
                      <line x1={offsetX - 12} y1={offsetY} x2={offsetX - 12} y2={offsetY + landH * baseScale} stroke="#475569" strokeWidth="1" />
                      <line x1={offsetX - 16} y1={offsetY} x2={offsetX - 2} y2={offsetY} stroke="#475569" strokeWidth="1" />
                      <line x1={offsetX - 16} y1={offsetY + landH * baseScale} x2={offsetX - 2} y2={offsetY + landH * baseScale} stroke="#475569" strokeWidth="1" />
                      <polygon points={`${offsetX-12},${offsetY} ${offsetX-14},${offsetY+4} ${offsetX-10},${offsetY+4}`} fill="#475569" />
                      <polygon points={`${offsetX-12},${offsetY+landH*baseScale} ${offsetX-14},${offsetY+landH*baseScale-4} ${offsetX-10},${offsetY+landH*baseScale-4}`} fill="#475569" />
                      
                      <g fill="#0F172A" fontSize="8.5" fontFamily="sans-serif" fontWeight="600">
                        <rect x={offsetX + (landW * baseScale) / 2 - 18} y={offsetY - 19} width={36} height={14} fill="#FFFFFF" />
                        <text x={offsetX + (landW * baseScale) / 2} y={offsetY - 9} textAnchor="middle">{formatDim(landW)} ft</text>
                        
                        <rect x={offsetX - 20} y={offsetY + (landH * baseScale) / 2 - 18} width={14} height={36} fill="#FFFFFF" />
                        <text x={offsetX - 9} y={offsetY + (landH * baseScale) / 2} textAnchor="middle" transform={`rotate(-90, ${offsetX - 9}, ${offsetY + (landH * baseScale) / 2})`}>{formatDim(landH)} ft</text>
                      </g>
                    </g>
                  )}

                  {/* COMPASS */}
                  <g transform={`translate(${offsetX + landW * baseScale - 24}, ${offsetY + 24})`}>
                    <circle cx="0" cy="0" r="10" fill="#FFFFFF" stroke="#0F172A" strokeWidth="1.2" />
                    <polygon points="0,-7 2.5,0 0,-1 -2.5,0" fill="#0F172A" />
                    <polygon points="0,7 2.5,0 0,1 -2.5,0" fill="#F8FAFC" stroke="#0F172A" strokeWidth="0.8" />
                    <text x="0" y="-10" fill="#0F172A" fontSize="7" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">N</text>
                  </g>

                  {/* MAIN GATE */}
                  {layoutData.sitePlan?.entranceGate && (
                    <g>
                      {(() => {
                        const eg = layoutData.sitePlan.entranceGate;
                        const gx = offsetX + eg.x * baseScale;
                        const gy = offsetY + eg.y * baseScale;
                        const gw = (eg.width || 5.0) * baseScale;
                        const gateColor = "#0F172A";

                        if (eg.wall === 'north' || eg.wall === 'south') {
                          return (
                            <g>
                              <line x1={gx - gw / 2} y1={gy} x2={gx + gw / 2} y2={gy} stroke={gateColor} strokeWidth="3.5" />
                              <text x={gx} y={gy + (eg.wall === 'north' ? -6 : 12)} fill={gateColor} fontSize="7" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">GATE</text>
                            </g>
                          );
                        } else {
                          return (
                            <g>
                              <line x1={gx} y1={gy - gw / 2} x2={gx} y2={gy + gw / 2} stroke={gateColor} strokeWidth="3.5" />
                              <text x={gx + (eg.wall === 'east' ? 8 : -8)} y={gy} fill={gateColor} fontSize="7" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">GATE</text>
                            </g>
                          );
                        }
                      })()}
                    </g>
                  )}

                  {/* ROOMS BACKGROUND FILLS & FURNITURE */}
                  {layoutData.rooms.map((room) => {
                    const rx = offsetX + room.x * baseScale;
                    const ry = offsetY + room.y * baseScale;
                    const rw = room.width * baseScale;
                    const rh = room.height * baseScale;
                    const fill = getSimpleRoomFill(room);
                    const isPark = room.name.toLowerCase().includes('parking');

                    const drawBed = (rx: number, ry: number, rw: number, rh: number) => {
                      const bw = Math.min(5.5 * baseScale, rw * 0.6);
                      const bh = Math.min(6.0 * baseScale, rh * 0.6);
                      const cx = rx + rw / 2;
                      const cy = ry + rh / 2;
                      return (
                        <g transform={`translate(${cx}, ${cy})`} opacity="0.65">
                          <rect x={-bw / 2} y={-bh / 2} width={bw} height={bh} rx={2} fill="none" stroke="#64748B" strokeWidth="0.8"/>
                          <rect x={-bw / 2} y={-bh / 2} width={bw} height={bh * 0.15} fill="none" stroke="#64748B" strokeWidth="0.8"/>
                        </g>
                      );
                    };

                    const drawLiving = (rx: number, ry: number, rw: number, rh: number) => {
                      const sw = Math.min(6.5 * baseScale, rw * 0.7);
                      const sh = Math.min(2.8 * baseScale, rh * 0.3);
                      const cx = rx + rw / 2;
                      const cy = ry + rh / 2 + rh * 0.1;
                      return (
                        <g transform={`translate(${cx}, ${cy})`} opacity="0.65">
                          <rect x={-sw / 2} y={-sh / 2} width={sw} height={sh} rx={2} fill="none" stroke="#64748B" strokeWidth="0.8"/>
                        </g>
                      );
                    };

                    const drawCar = (rx: number, ry: number, rw: number, rh: number) => {
                      const cw = Math.min(5.5 * baseScale, rw * 0.7);
                      const ch = Math.min(11 * baseScale, rh * 0.8);
                      const cx = rx + rw / 2;
                      const cy = ry + rh / 2;
                      return (
                        <g transform={`translate(${cx}, ${cy})`} opacity="0.6">
                          <rect x={-cw / 2} y={-ch / 2} width={cw} height={ch} rx={3} fill="none" stroke="#64748B" strokeWidth="1"/>
                          <rect x={-cw * 0.4} y={-ch * 0.25} width={cw * 0.8} height={ch * 0.15} fill="none" stroke="#64748B" strokeWidth="0.7"/>
                        </g>
                      );
                    };

                    const nameLower = room.name.toLowerCase();
                    const isBed = nameLower.includes('bed');
                    const isLiving = nameLower.includes('living') || nameLower.includes('hall');

                    return (
                      <g key={`fill-${room.id}`}>
                        <rect x={rx} y={ry} width={rw} height={rh} fill={fill} />
                        {isPark && drawCar(rx, ry, rw, rh)}
                        {isBed && drawBed(rx, ry, rw, rh)}
                        {isLiving && drawLiving(rx, ry, rw, rh)}
                      </g>
                    );
                  })}

                  {/* ROOM WALLS */}
                  {layoutData.rooms.map((room) => {
                    const rx = offsetX + room.x * baseScale;
                    const ry = offsetY + room.y * baseScale;
                    const rw = room.width * baseScale;
                    const rh = room.height * baseScale;
                    return (
                      <rect
                        key={`wall-${room.id}`}
                        x={rx}
                        y={ry}
                        width={rw}
                        height={rh}
                        fill="none"
                        stroke="#0F172A"
                        strokeWidth="2.5"
                      />
                    );
                  })}

                  {/* DOORS */}
                  {layoutData.rooms.map((room) => {
                    if (!room.doors || room.doors.length === 0) return null;
                    const rx = offsetX + room.x * baseScale;
                    const ry = offsetY + room.y * baseScale;
                    const rw = room.width * baseScale;
                    const rh = room.height * baseScale;

                    return (
                      <g key={`doors-${room.id}`}>
                        {room.doors.map((door, dIdx) => {
                          const dW = (door.width || 3.0) * baseScale;
                          const dOff = (door.offset || 1.0) * baseScale;
                          return (
                            <g key={`d-${room.id}-${dIdx}`}>
                              {door.wall === 'north' && (
                                <>
                                  <line x1={rx + dOff} y1={ry} x2={rx + dOff + dW} y2={ry} stroke="#FFFFFF" strokeWidth="3.5" />
                                  <path d={`M ${rx + dOff} ${ry} A ${dW} ${dW} 0 0 1 ${rx + dOff + dW} ${ry + dW}`} fill="none" stroke="#0F172A" strokeWidth="0.8" strokeDasharray="2,2"/>
                                  <line x1={rx + dOff} y1={ry} x2={rx + dOff} y2={ry + dW} stroke="#0F172A" strokeWidth="1.2" />
                                </>
                              )}
                              {door.wall === 'south' && (
                                <>
                                  <line x1={rx + dOff} y1={ry + rh} x2={rx + dOff + dW} y2={ry + rh} stroke="#FFFFFF" strokeWidth="3.5" />
                                  <path d={`M ${rx + dOff} ${ry + rh} A ${dW} ${dW} 0 0 0 ${rx + dOff + dW} ${ry + rh - dW}`} fill="none" stroke="#0F172A" strokeWidth="0.8" strokeDasharray="2,2"/>
                                  <line x1={rx + dOff} y1={ry + rh} x2={rx + dOff} y2={ry + rh - dW} stroke="#0F172A" strokeWidth="1.2" />
                                </>
                              )}
                              {door.wall === 'west' && (
                                <>
                                  <line x1={rx} y1={ry + dOff} x2={rx} y2={ry + dOff + dW} stroke="#FFFFFF" strokeWidth="3.5" />
                                  <path d={`M ${rx} ${ry + dOff} A ${dW} ${dW} 0 0 1 ${rx + dW} ${ry + dOff + dW}`} fill="none" stroke="#0F172A" strokeWidth="0.8" strokeDasharray="2,2"/>
                                  <line x1={rx} y1={ry + dOff} x2={rx + dW} y2={ry + dOff} stroke="#0F172A" strokeWidth="1.2" />
                                </>
                              )}
                              {door.wall === 'east' && (
                                <>
                                  <line x1={rx + rw} y1={ry + dOff} x2={rx + rw} y2={ry + dOff + dW} stroke="#FFFFFF" strokeWidth="3.5" />
                                  <path d={`M ${rx + rw} ${ry + dOff} A ${dW} ${dW} 0 0 0 ${rx + rw - dW} ${ry + dOff + dW}`} fill="none" stroke="#0F172A" strokeWidth="0.8" strokeDasharray="2,2"/>
                                  <line x1={rx + rw} y1={ry + dOff} x2={rx + rw - dW} y2={ry + dOff} stroke="#0F172A" strokeWidth="1.2" />
                                </>
                              )}
                            </g>
                          );
                        })}
                      </g>
                    );
                  })}

                  {/* WINDOWS */}
                  {layoutData.rooms.map((room) => {
                    if (!room.windows || room.windows.length === 0) return null;
                    const rx = offsetX + room.x * baseScale;
                    const ry = offsetY + room.y * baseScale;
                    const rw = room.width * baseScale;
                    const rh = room.height * baseScale;

                    return (
                      <g key={`win-${room.id}`}>
                        {room.windows.map((win, wIdx) => {
                          const wW = (win.width || 3.5) * baseScale;
                          const wOff = (win.offset || 1.5) * baseScale;
                          return (
                            <g key={`w-${room.id}-${wIdx}`}>
                              {win.wall === 'north' && (
                                <>
                                  <rect x={rx + wOff} y={ry - 2} width={wW} height="4" fill="#FFFFFF"/>
                                  <line x1={rx + wOff} y1={ry - 2} x2={rx + wOff + wW} y2={ry - 2} stroke="#64748B" strokeWidth="1"/>
                                  <line x1={rx + wOff} y1={ry + 2} x2={rx + wOff + wW} y2={ry + 2} stroke="#64748B" strokeWidth="1"/>
                                </>
                              )}
                              {win.wall === 'south' && (
                                <>
                                  <rect x={rx + wOff} y={ry + rh - 2} width={wW} height="4" fill="#FFFFFF"/>
                                  <line x1={rx + wOff} y1={ry + rh - 2} x2={rx + wOff + wW} y2={ry + rh - 2} stroke="#64748B" strokeWidth="1"/>
                                  <line x1={rx + wOff} y1={ry + rh + 2} x2={rx + wOff + wW} y2={ry + rh + 2} stroke="#64748B" strokeWidth="1"/>
                                </>
                              )}
                              {win.wall === 'west' && (
                                <>
                                  <rect x={rx - 2} y={ry + wOff} width="4" height={wW} fill="#FFFFFF"/>
                                  <line x1={rx - 2} y1={ry + wOff} x2={rx - 2} y2={ry + wOff + wW} stroke="#64748B" strokeWidth="1"/>
                                  <line x1={rx + 2} y1={ry + wOff} x2={rx + 2} y2={ry + wOff + wW} stroke="#64748B" strokeWidth="1"/>
                                </>
                              )}
                              {win.wall === 'east' && (
                                <>
                                  <rect x={rx + rw - 2} y={ry + wOff} width="4" height={wW} fill="#FFFFFF"/>
                                  <line x1={rx + rw - 2} y1={ry + wOff} x2={rx + rw - 2} y2={ry + wOff + wW} stroke="#64748B" strokeWidth="1"/>
                                  <line x1={rx + rw + 2} y1={ry + wOff} x2={rx + rw + 2} y2={ry + wOff + wW} stroke="#64748B" strokeWidth="1"/>
                                </>
                              )}
                            </g>
                          );
                        })}
                      </g>
                    );
                  })}

                  {/* ROOM LABELS */}
                  {layoutData.rooms.map((room) => {
                    const rx = offsetX + room.x * baseScale;
                    const ry = offsetY + room.y * baseScale;
                    const rw = room.width * baseScale;
                    const rh = room.height * baseScale;
                    const minDim = Math.min(rw, rh);
                    const titleFontSize = Math.max(8.5, Math.min(11, minDim / 4.2));
                    const dimFontSize = Math.max(7, Math.min(8.5, titleFontSize - 1.5));
                    const areaFontSize = Math.max(6, Math.min(7.5, dimFontSize - 1));
                    const lineSpacing = titleFontSize * 1.05;

                    let displayName = room.name.toUpperCase();
                    if (displayName.includes('LIVING')) displayName = 'LIVING ROOM';
                    else if (displayName.includes('MASTER')) displayName = 'MASTER BEDROOM';
                    else if (displayName.includes('BEDROOM')) displayName = displayName;
                    else if (displayName.includes('DINING')) displayName = 'DINING ROOM';
                    else if (displayName.includes('KITCHEN')) displayName = 'KITCHEN';
                    else if (displayName.includes('COMMON_BATH')) displayName = 'COMMON BATH';
                    else if (displayName.includes('ATTACHED_BATH')) displayName = 'ATTACHED BATH';
                    else if (displayName.includes('UTILITY')) displayName = 'UTILITY';
                    else if (displayName.includes('STAIR')) displayName = 'STAIRCASE';
                    else if (displayName.includes('BALCONY')) displayName = 'BALCONY';
                    else if (displayName.includes('PARK')) displayName = 'PARKING';

                    let labelY = ry + rh / 2 - lineSpacing * 0.8;
                    if (displayName === 'PARKING') labelY = ry + rh - 22;

                    const area = (room.width * room.height).toFixed(0);

                    return (
                      <g key={`l-${room.id}`} className="select-none pointer-events-none">
                        <text
                          x={rx + rw / 2}
                          y={labelY}
                          fill="#0F172A"
                          fontSize={titleFontSize}
                          fontWeight="700"
                          textAnchor="middle"
                          fontFamily="sans-serif"
                        >
                          {displayName}
                        </text>
                        <text
                          x={rx + rw / 2}
                          y={labelY + lineSpacing}
                          fill="#475569"
                          fontSize={dimFontSize}
                          fontFamily="monospace"
                          fontWeight="500"
                          textAnchor="middle"
                        >
                          {formatDim(room.width)}' × {formatDim(room.height)}'
                        </text>
                        <text
                          x={rx + rw / 2}
                          y={labelY + lineSpacing * 1.9}
                          fill="#64748B"
                          fontSize={areaFontSize}
                          fontFamily="sans-serif"
                          fontWeight="500"
                          textAnchor="middle"
                        >
                          {area} SQ.FT
                        </text>
                      </g>
                    );
                  })}

                  {/* ENTRANCE ARROW */}
                  {(() => {
                    let entX = offsetX + (layoutData.entrance?.x || landW / 2 - 2) * baseScale;
                    let entY = offsetY + (layoutData.entrance?.y || 0) * baseScale;
                    let rotate = 0;
                    if (facing === 'North') {
                      entY = offsetY;
                      rotate = 0;
                    } else if (facing === 'South') {
                      entY = offsetY + landH * baseScale;
                      rotate = 180;
                    } else if (facing === 'East') {
                      entX = offsetX + landW * baseScale;
                      entY = offsetY + (landH / 2) * baseScale;
                      rotate = 90;
                    } else if (facing === 'West') {
                      entX = offsetX;
                      entY = offsetY + (landH / 2) * baseScale;
                      rotate = 270;
                    }
                    return (
                      <g transform={`translate(${entX}, ${entY}) rotate(${rotate})`}>
                        <line x1="-8" y1="0" x2="8" y2="0" stroke="#0F172A" strokeWidth="1.5" />
                        <g transform="translate(0, -8)" className="select-none pointer-events-none">
                          <polygon points="0,0 -3,-4 3,-4" fill="#0F172A" />
                          <text x="0" y="-6" fill="#0F172A" fontSize="7" fontWeight="700" textAnchor="middle" fontFamily="sans-serif">
                            MAIN ENTRANCE
                          </text>
                        </g>
                      </g>
                    );
                  })()}

                </svg>
              </div>
            </div>

            {/* Subtle floating technical badge */}
            <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-xs px-2.5 py-1.5 border border-[#E2E8F0] rounded shadow-xs pointer-events-none select-none hidden sm:flex items-center gap-3 text-[10px] font-mono text-[#475569]">
              <span><strong className="text-[#0F172A]">FACING:</strong> {facing.toUpperCase()}</span>
              <span><strong className="text-[#0F172A]">PLOT:</strong> {formatDim(landW)}' × {formatDim(landH)}'</span>
              <span><strong className="text-[#0F172A]">SCALE:</strong> 1:100</span>
            </div>
          </div>
        </div>

        {/* Right Column: Explainable AI Panel (30% on desktop) */}
        <div className="lg:col-span-4 h-full">
          <ExplainableAIBlueprintAnalysis layoutData={layoutData} />
        </div>

      </div>

      {/* Bottom Action Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-4 border-t border-[#E2E8F0]">
        <p className="text-xs text-[#64748B] font-sans text-center md:text-left">
          Validated 2D Blueprint is fully synchronized with the 3D Generation Engine.
        </p>
        <button
          onClick={onGenerate3D}
          className="premium-btn px-6 py-2.5 w-full md:w-auto font-mono text-xs uppercase tracking-widest flex items-center justify-center gap-2"
        >
          <span>{has3D ? 'View 3D House Design' : 'Generate 3D Visual'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
