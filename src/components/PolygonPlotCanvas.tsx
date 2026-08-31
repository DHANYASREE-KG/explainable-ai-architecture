import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { PolygonPoint } from '../types';
import {
  calculatePolygonArea,
  calculateEdgeLengths,
  getPolygonBounds,
  isSimplePolygon,
  normalizePolygonPoints,
  updateEdgeLength,
  computeInnerBuildablePolygon,
  getDefaultSetbacks,
  PRESET_IRREGULAR_PLOTS,
} from '../services/polygonUtils';
import {
  Plus,
  Trash2,
  RotateCcw,
  Undo2,
  Redo2,
  CheckCircle2,
  AlertCircle,
  Compass,
} from 'lucide-react';

interface PolygonPlotCanvasProps {
  points: PolygonPoint[];
  onChangePoints: (newPoints: PolygonPoint[]) => void;
  unit?: 'ft' | 'm';
}

const DEFAULT_IRREGULAR_SHAPE: PolygonPoint[] = [
  { x: 0, y: 0 },
  { x: 36, y: 0 },
  { x: 42, y: 32 },
  { x: 0, y: 28 },
];

export const PolygonPlotCanvas: React.FC<PolygonPlotCanvasProps> = React.memo(({
  points,
  onChangePoints,
  unit = 'ft',
}) => {
  const [localPoints, setLocalPoints] = useState<PolygonPoint[]>(
    points && points.length >= 3 ? points : DEFAULT_IRREGULAR_SHAPE
  );
  const [selectedPointIdx, setSelectedPointIdx] = useState<number | null>(null);
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
  const [hoveredPointIdx, setHoveredPointIdx] = useState<number | null>(null);
  const [hoveredEdgeIdx, setHoveredEdgeIdx] = useState<number | null>(null);
  const [editingEdgeValues, setEditingEdgeValues] = useState<{ [key: number]: string }>({});
  const [snapToGrid, setSnapToGrid] = useState<boolean>(true);
  const [showBuildableZone, setShowBuildableZone] = useState<boolean>(true);

  const [history, setHistory] = useState<PolygonPoint[][]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const dragStartSnapshotRef = useRef<PolygonPoint[] | null>(null);
  const isDraggingRef = useRef<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!isDraggingRef.current && points && points.length >= 3) {
      setLocalPoints(points);
    }
  }, [points]);

  useEffect(() => {
    if (history.length === 0 && localPoints.length >= 3) {
      setHistory([localPoints]);
      setHistoryIndex(0);
    }
  }, []);

  const validation = useMemo(() => isSimplePolygon(localPoints), [localPoints]);
  const totalArea = useMemo(() => calculatePolygonArea(localPoints), [localPoints]);
  const edges = useMemo(() => calculateEdgeLengths(localPoints), [localPoints]);
  const bounds = useMemo(() => getPolygonBounds(localPoints), [localPoints]);
  const perimeter = useMemo(() => edges.reduce((acc, e) => acc + e.length, 0), [edges]);

  const setbacks = useMemo(() => getDefaultSetbacks(totalArea), [totalArea]);
  const buildablePolygon = useMemo(
    () => (validation.valid ? computeInnerBuildablePolygon(localPoints, setbacks.left) : []),
    [localPoints, setbacks.left, validation.valid]
  );
  const buildableArea = useMemo(() => calculatePolygonArea(buildablePolygon), [buildablePolygon]);

  const centroid = useMemo(() => {
    return {
      x: localPoints.reduce((sum, p) => sum + p.x, 0) / localPoints.length,
      y: localPoints.reduce((sum, p) => sum + p.y, 0) / localPoints.length,
    };
  }, [localPoints]);

  const padding = 18;
  const vbMinX = Math.floor(bounds.minX) - padding;
  const vbMinY = Math.floor(bounds.minY) - padding;
  const vbWidth = Math.max(bounds.width + padding * 2, 54);
  const vbHeight = Math.max(bounds.height + padding * 2, 44);

  const pushToHistory = useCallback(
    (newPts: PolygonPoint[]) => {
      setHistory((prev) => {
        const nextHist = prev.slice(0, historyIndex + 1);
        return [...nextHist, newPts];
      });
      setHistoryIndex((prev) => prev + 1);
    },
    [historyIndex]
  );

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const prevPts = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      setLocalPoints(prevPts);
      onChangePoints(prevPts);
      setSelectedPointIdx(null);
    }
  }, [history, historyIndex, onChangePoints]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextPts = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      setLocalPoints(nextPts);
      onChangePoints(nextPts);
      setSelectedPointIdx(null);
    }
  }, [history, historyIndex, onChangePoints]);

  const getSvgCoordinates = useCallback(
    (clientX: number, clientY: number): { x: number; y: number } | null => {
      if (!svgRef.current) return null;
      const svg = svgRef.current;
      const pt = svg.createSVGPoint();
      pt.x = clientX;
      pt.y = clientY;

      const ctm = svg.getScreenCTM();
      if (!ctm) return null;
      const transformed = pt.matrixTransform(ctm.inverse());

      if (snapToGrid) {
        return {
          x: Math.round(transformed.x * 2) / 2,
          y: Math.round(transformed.y * 2) / 2,
        };
      }
      return {
        x: Math.round(transformed.x * 10) / 10,
        y: Math.round(transformed.y * 10) / 10,
      };
    },
    [snapToGrid]
  );

  const handleCornerPointerDown = (idx: number, e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    setSelectedPointIdx(idx);
    setDraggingIdx(idx);
    isDraggingRef.current = true;
    dragStartSnapshotRef.current = [...localPoints];
  };

  const handleGlobalPointerMove = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (draggingIdx === null) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;

      const coords = getSvgCoordinates(clientX, clientY);
      if (!coords) return;

      setLocalPoints((prev) => {
        const next = [...prev];
        next[draggingIdx] = {
          x: Math.max(0, coords.x),
          y: Math.max(0, coords.y),
        };
        return next;
      });
    },
    [draggingIdx, getSvgCoordinates]
  );

  const handleGlobalPointerUp = useCallback(() => {
    if (draggingIdx !== null) {
      setDraggingIdx(null);
      isDraggingRef.current = false;

      setLocalPoints((currentPts) => {
        if (dragStartSnapshotRef.current) {
          const start = dragStartSnapshotRef.current;
          const hasChanged = currentPts.some(
            (p, i) => !start[i] || p.x !== start[i].x || p.y !== start[i].y
          );
          if (hasChanged) {
            pushToHistory(currentPts);
            onChangePoints(currentPts);
          }
        }
        return currentPts;
      });
      dragStartSnapshotRef.current = null;
    }
  }, [draggingIdx, onChangePoints, pushToHistory]);

  useEffect(() => {
    if (draggingIdx !== null) {
      window.addEventListener('mousemove', handleGlobalPointerMove);
      window.addEventListener('mouseup', handleGlobalPointerUp);
      window.addEventListener('touchmove', handleGlobalPointerMove, { passive: false });
      window.addEventListener('touchend', handleGlobalPointerUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleGlobalPointerMove);
      window.removeEventListener('mouseup', handleGlobalPointerUp);
      window.removeEventListener('touchmove', handleGlobalPointerMove);
      window.removeEventListener('touchend', handleGlobalPointerUp);
    };
  }, [draggingIdx, handleGlobalPointerMove, handleGlobalPointerUp]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedPointIdx !== null) {
        if (
          document.activeElement &&
          (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')
        ) {
          return;
        }
        if (localPoints.length > 3) {
          handleRemoveCorner();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo, selectedPointIdx, localPoints]);

  const handleEdgeInputChange = (edgeIndex: number, val: string) => {
    setEditingEdgeValues((prev) => ({ ...prev, [edgeIndex]: val }));
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) {
      const updated = updateEdgeLength(localPoints, edgeIndex, num);
      setLocalPoints(updated);
    }
  };

  const handleEdgeInputBlur = (edgeIndex: number) => {
    const rawVal = editingEdgeValues[edgeIndex];
    if (rawVal !== undefined) {
      const num = parseFloat(rawVal);
      if (isNaN(num) || num <= 0) {
        setEditingEdgeValues((prev) => {
          const copy = { ...prev };
          delete copy[edgeIndex];
          return copy;
        });
      } else {
        const updated = updateEdgeLength(localPoints, edgeIndex, num);
        const normalized = normalizePolygonPoints(updated);
        setLocalPoints(normalized);
        onChangePoints(normalized);
        pushToHistory(normalized);
        setEditingEdgeValues((prev) => {
          const copy = { ...prev };
          delete copy[edgeIndex];
          return copy;
        });
      }
    }
  };

  const handleAddCorner = () => {
    const newPoints = [...localPoints];
    if (selectedPointIdx !== null && selectedPointIdx < newPoints.length) {
      const p1 = newPoints[selectedPointIdx];
      const p2 = newPoints[(selectedPointIdx + 1) % newPoints.length];
      const midX = Math.round(((p1.x + p2.x) / 2) * 2) / 2;
      const midY = Math.round(((p1.y + p2.y) / 2) * 2) / 2;
      newPoints.splice(selectedPointIdx + 1, 0, { x: midX, y: midY });
      setLocalPoints(newPoints);
      onChangePoints(newPoints);
      pushToHistory(newPoints);
      setSelectedPointIdx(selectedPointIdx + 1);
    } else {
      let maxLen = -1;
      let maxIdx = 0;
      for (let i = 0; i < edges.length; i++) {
        if (edges[i].length > maxLen) {
          maxLen = edges[i].length;
          maxIdx = i;
        }
      }
      const p1 = newPoints[maxIdx];
      const p2 = newPoints[(maxIdx + 1) % newPoints.length];
      const midX = Math.round(((p1.x + p2.x) / 2) * 2) / 2;
      const midY = Math.round(((p1.y + p2.y) / 2) * 2) / 2;
      newPoints.splice(maxIdx + 1, 0, { x: midX, y: midY });
      setLocalPoints(newPoints);
      onChangePoints(newPoints);
      pushToHistory(newPoints);
      setSelectedPointIdx(maxIdx + 1);
    }
  };

  const handleSplitEdge = (edgeIdx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const newPoints = [...localPoints];
    const p1 = newPoints[edgeIdx];
    const p2 = newPoints[(edgeIdx + 1) % newPoints.length];
    const midX = Math.round(((p1.x + p2.x) / 2) * 2) / 2;
    const midY = Math.round(((p1.y + p2.y) / 2) * 2) / 2;
    newPoints.splice(edgeIdx + 1, 0, { x: midX, y: midY });
    setLocalPoints(newPoints);
    onChangePoints(newPoints);
    pushToHistory(newPoints);
    setSelectedPointIdx(edgeIdx + 1);
  };

  const handleRemoveCorner = () => {
    if (localPoints.length <= 3) return;
    const targetIdx = selectedPointIdx !== null ? selectedPointIdx : localPoints.length - 1;
    const newPoints = localPoints.filter((_, i) => i !== targetIdx);
    const normalized = normalizePolygonPoints(newPoints);
    setLocalPoints(normalized);
    onChangePoints(normalized);
    pushToHistory(normalized);
    setSelectedPointIdx(null);
  };

  const handleResetShape = () => {
    setLocalPoints(DEFAULT_IRREGULAR_SHAPE);
    onChangePoints(DEFAULT_IRREGULAR_SHAPE);
    pushToHistory(DEFAULT_IRREGULAR_SHAPE);
    setSelectedPointIdx(null);
    setEditingEdgeValues({});
  };

  const handleApplyPreset = (presetPoints: PolygonPoint[]) => {
    const normalized = normalizePolygonPoints(presetPoints);
    setLocalPoints(normalized);
    onChangePoints(normalized);
    pushToHistory(normalized);
    setSelectedPointIdx(null);
    setEditingEdgeValues({});
  };

  const polygonPointsStr = useMemo(() => localPoints.map((p) => `${p.x},${p.y}`).join(' '), [localPoints]);
  const buildablePointsStr = useMemo(
    () =>
      buildablePolygon && buildablePolygon.length >= 3
        ? buildablePolygon.map((p) => `${p.x},${p.y}`).join(' ')
        : '',
    [buildablePolygon]
  );

  const getVertexLabel = (idx: number) => String.fromCharCode(65 + (idx % 26));

  const activeIdx = draggingIdx !== null ? draggingIdx : selectedPointIdx;
  const isEdgeConnectedToActive = (edgeIndex: number) => {
    if (activeIdx === null) return false;
    const n = localPoints.length;
    const prevEdgeIdx = (activeIdx - 1 + n) % n;
    return edgeIndex === activeIdx || edgeIndex === prevEdgeIdx;
  };

  return (
    <div className="space-y-6">
      {/* Top Info Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center shrink-0">
            <Compass className="w-5 h-5 text-[#0F172A]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#0F172A] font-sans">CAD Interactive Boundary Editor</h3>
            <p className="text-xs text-[#64748B] font-sans">Drag corners to shape the plot boundary</p>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-[#F8FAFC] px-4 py-2 border border-[#E2E8F0]">
          <div>
            <span className="text-[10px] uppercase font-bold text-[#64748B] block font-mono">Area</span>
            <span className="text-sm font-bold text-[#0F172A] font-mono">{(totalArea ?? 0).toLocaleString()} <span className="text-[10px] text-[#64748B]">sq.{unit}</span></span>
          </div>
          <div className="w-px h-6 bg-[#E2E8F0]" />
          <div>
            <span className="text-[10px] uppercase font-bold text-[#64748B] block font-mono">Buildable</span>
            <span className="text-sm font-bold text-[#0F172A] font-mono">{(buildableArea ?? 0).toLocaleString()} <span className="text-[10px] text-[#64748B]">sq.{unit}</span></span>
          </div>
        </div>
      </div>

      {/* Presets */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2">
        <span className="text-[10px] font-bold text-[#64748B] shrink-0 font-mono uppercase tracking-wider">Presets:</span>
        {PRESET_IRREGULAR_PLOTS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => handleApplyPreset(preset.points)}
            className="px-3 py-1 bg-white border border-[#E2E8F0] hover:border-[#0F172A] hover:bg-[#F8FAFC] text-[#0F172A] transition-colors cursor-pointer shrink-0 text-xs font-mono"
          >
            {preset.name}
          </button>
        ))}
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className="relative bg-[#0F172A] rounded-xl overflow-hidden min-h-[420px] flex items-center justify-center select-none shadow-inner"
      >
        <div className="absolute top-4 right-4 z-30 flex items-center gap-4 bg-[#0F172A] px-3 py-2 border border-[#0F2747] text-xs text-[#E2E8F0]">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={snapToGrid}
              onChange={(e) => setSnapToGrid(e.target.checked)}
              className="accent-[#F8FAFC] w-3 h-3"
            />
            <span className="text-[10px] font-mono uppercase tracking-wider">Snap</span>
          </label>
          <div className="h-4 w-px bg-[#0F2747]" />
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showBuildableZone}
              onChange={(e) => setShowBuildableZone(e.target.checked)}
              className="accent-[#F8FAFC] w-3 h-3"
            />
            <span className="text-[10px] font-mono uppercase tracking-wider">Zone</span>
          </label>
        </div>

        <svg
          ref={svgRef}
          viewBox={`${vbMinX} ${vbMinY} ${vbWidth} ${vbHeight}`}
          className="w-full h-full max-h-[440px] overflow-visible"
          style={{ touchAction: 'none' }}
        >
          <defs>
            <pattern id="cad-grid-opt" width="5" height="5" patternUnits="userSpaceOnUse">
              <path d="M 5 0 L 0 0 0 5" fill="none" stroke="#0F2747" strokeWidth="0.1" />
            </pattern>
            <pattern id="cad-grid-major-opt" width="20" height="20" patternUnits="userSpaceOnUse">
              <rect width="20" height="20" fill="url(#cad-grid-opt)" />
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#444444" strokeWidth="0.2" />
            </pattern>
          </defs>

          <rect x={vbMinX} y={vbMinY} width={vbWidth} height={vbHeight} fill="url(#cad-grid-major-opt)" />

          <polygon
            points={polygonPointsStr}
            fill={validation.valid ? '#2A2621' : '#4A1C1C'}
            fillOpacity="0.8"
            stroke={validation.valid ? '#E2E8F0' : '#F87171'}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />

          {showBuildableZone && validation.valid && buildablePointsStr && (
            <g>
              <polygon
                points={buildablePointsStr}
                fill="#F8FAFC"
                fillOpacity="0.1"
                stroke="#F8FAFC"
                strokeWidth="1"
                strokeDasharray="2 2"
                strokeLinejoin="round"
              />
              <text
                x={centroid.x}
                y={centroid.y}
                textAnchor="middle"
                dominantBaseline="central"
                fill="#F8FAFC"
                fontSize="2"
                fontWeight="bold"
                fontFamily="monospace"
                opacity="0.5"
              >
                BUILDABLE ({buildableArea} sq.ft)
              </text>
            </g>
          )}

          {edges.map((edge) => {
            if (!isEdgeConnectedToActive(edge.index)) return null;
            return (
              <line
                key={`hl-${edge.index}`}
                x1={edge.from.x}
                y1={edge.from.y}
                x2={edge.to.x}
                y2={edge.to.y}
                stroke="#FFFFFF"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            );
          })}

          {edges.map((edge) => (
            <line
              key={`split-${edge.index}`}
              x1={edge.from.x}
              y1={edge.from.y}
              x2={edge.to.x}
              y2={edge.to.y}
              stroke="transparent"
              strokeWidth="5"
              className="cursor-pointer"
              onClick={(e) => handleSplitEdge(edge.index, e)}
              onMouseEnter={() => setHoveredEdgeIdx(edge.index)}
              onMouseLeave={() => setHoveredEdgeIdx(null)}
            />
          ))}

          {localPoints.map((pt, idx) => {
            const isSelected = selectedPointIdx === idx;
            const isDragging = draggingIdx === idx;
            const isHovered = hoveredPointIdx === idx;
            const label = getVertexLabel(idx);

            return (
              <g
                key={idx}
                transform={`translate(${pt.x}, ${pt.y})`}
                className="cursor-grab active:cursor-grabbing"
                onMouseDown={(e) => handleCornerPointerDown(idx, e)}
                onTouchStart={(e) => handleCornerPointerDown(idx, e)}
                onMouseEnter={() => setHoveredPointIdx(idx)}
                onMouseLeave={() => setHoveredPointIdx(null)}
              >
                <circle r="6" fill="transparent" />
                <circle
                  r="3"
                  fill={isDragging ? '#FFFFFF' : isSelected ? '#FFFFFF' : '#888888'}
                  stroke="#0F172A"
                  strokeWidth="1.5"
                />
                <text
                  x="0"
                  y="-4.5"
                  textAnchor="middle"
                  fill="#F8FAFC"
                  fontSize="2"
                  fontFamily="monospace"
                  className="select-none pointer-events-none"
                >
                  {label}
                </text>
              </g>
            );
          })}
        </svg>

        {edges.map((edge) => {
          const p1 = edge.from;
          const p2 = edge.to;
          const midX = (p1.x + p2.x) / 2;
          const midY = (p1.y + p2.y) / 2;

          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const len = Math.hypot(dx, dy);
          let nx = 0;
          let ny = -1;
          if (len > 0.001) {
            nx = dy / len;
            ny = -dx / len;
          }

          const toCentroidX = centroid.x - midX;
          const toCentroidY = centroid.y - midY;
          if (nx * toCentroidX + ny * toCentroidY > 0) {
            nx = -nx;
            ny = -ny;
          }

          const badgeX = midX + nx * 4;
          const badgeY = midY + ny * 4;

          const pctX = ((badgeX - vbMinX) / vbWidth) * 100;
          const pctY = ((badgeY - vbMinY) / vbHeight) * 100;

          const rawInput = editingEdgeValues[edge.index];
          const displayVal = rawInput !== undefined ? rawInput : edge.length.toString();
          const isConnected = isEdgeConnectedToActive(edge.index);

          return (
            <div
              key={edge.index}
              style={{
                position: 'absolute',
                left: `${pctX}%`,
                top: `${pctY}%`,
                transform: 'translate(-50%, -50%)',
                zIndex: 20,
              }}
              className="pointer-events-auto"
            >
              <div
                className={`flex items-center gap-1 px-2 py-1 border ${
                  isConnected
                    ? 'bg-[#F8FAFC] border-[#0F172A] text-[#0F172A]'
                    : 'bg-[#0F172A] border-[#0F2747] text-[#F8FAFC]'
                }`}
              >
                <span className="text-[9px] font-bold font-mono opacity-60 select-none">
                  {edge.label}:
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={displayVal}
                  onChange={(e) => handleEdgeInputChange(edge.index, e.target.value)}
                  onBlur={() => handleEdgeInputBlur(edge.index)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      (e.target as HTMLInputElement).blur();
                    }
                  }}
                  className="w-12 text-center text-[10px] font-bold font-mono bg-transparent focus:outline-none"
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {!validation.valid ? (
          <div className="bg-[#0F172A] text-[#F87171] px-4 py-2 border border-[#F87171] text-xs font-mono flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Invalid geometry (edges crossing).</span>
          </div>
        ) : (
          <div className="bg-white border border-[#E2E8F0] px-4 py-2 text-xs font-mono text-[#0F172A] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Valid. Perim: {perimeter.toFixed(1)} {unit}</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <button type="button" onClick={handleAddCorner} className="premium-btn-outline px-3 py-1.5 text-xs flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" /> <span>Add</span>
          </button>
          <button type="button" onClick={handleRemoveCorner} disabled={localPoints.length <= 3} className="premium-btn-outline px-3 py-1.5 text-xs flex items-center gap-1.5 disabled:opacity-50">
            <Trash2 className="w-3.5 h-3.5" /> <span>Delete</span>
          </button>
          <div className="h-4 w-px bg-[#E2E8F0] mx-1" />
          <button type="button" onClick={handleUndo} disabled={historyIndex <= 0} className="premium-btn-outline px-3 py-1.5 text-xs disabled:opacity-50">
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button type="button" onClick={handleRedo} disabled={historyIndex >= history.length - 1} className="premium-btn-outline px-3 py-1.5 text-xs disabled:opacity-50">
            <Redo2 className="w-3.5 h-3.5" />
          </button>
          <div className="h-4 w-px bg-[#E2E8F0] mx-1" />
          <button type="button" onClick={handleResetShape} className="premium-btn-outline px-3 py-1.5 text-xs flex items-center gap-1.5">
            <RotateCcw className="w-3.5 h-3.5" /> <span>Reset</span>
          </button>
        </div>
      </div>
    </div>
  );
});
