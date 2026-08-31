import React from 'react';
import { RoomPlacement } from '../../types';
import { X, Sparkles, Layers, Move, Maximize2, Compass, ShieldCheck } from 'lucide-react';

interface BlueprintRoomPanelProps {
  room: RoomPlacement;
  isEditMode: boolean;
  onClose: () => void;
  onSelectForXAI: (roomId: string) => void;
  onUpdateRoomDimension?: (id: string, width: number, height: number) => void;
  onUpdateRoomPosition?: (id: string, x: number, y: number) => void;
}

export const BlueprintRoomPanel: React.FC<BlueprintRoomPanelProps> = ({
  room,
  isEditMode,
  onClose,
  onSelectForXAI,
  onUpdateRoomDimension,
  onUpdateRoomPosition,
}) => {
  return (
    <div className="bg-white/95 border border-slate-200 rounded-xl p-5 shadow-xl backdrop-blur-md w-80 space-y-4 font-sans text-xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <span className="text-[10px] text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200 font-mono font-bold uppercase">
            {room.zone}
          </span>
          <h3 className="text-sm font-bold text-slate-900 mt-1 uppercase font-sans tracking-wide">
            {room.name}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Metrics Card */}
      <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-100 font-mono">
        <div>
          <span className="text-[10px] text-slate-400 uppercase">Dimensions</span>
          <p className="text-xs font-bold text-slate-900 mt-0.5">
            {room.width} FT × {room.height} FT
          </p>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 uppercase">Total Area</span>
          <p className="text-xs font-bold text-sky-700 mt-0.5">
            {room.area} SQ.FT
          </p>
        </div>
      </div>

      {/* Coordinates / Position */}
      <div className="space-y-1.5 font-mono">
        <div className="flex items-center justify-between text-slate-600">
          <span className="flex items-center gap-1">
            <Move className="w-3.5 h-3.5 text-slate-400" />
            <span>Position Coordinates:</span>
          </span>
          <span className="font-bold text-slate-900">
            X: {room.x} FT, Y: {room.y} FT
          </span>
        </div>
      </div>

      {/* Direct Numeric Controls in Edit Mode */}
      {isEditMode && (
        <div className="p-3 bg-[#0F2747] text-white rounded-lg space-y-3 font-mono shadow-xs">
          <div className="flex items-center gap-1.5 text-cyan-300 font-bold text-[11px] uppercase tracking-wider">
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Top-Down Edit Controls</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <label className="text-[10px] text-[#94A3B8] block mb-1">Length (FT)</label>
              <input
                type="number"
                min="4"
                max="80"
                value={room.width}
                onChange={(e) => {
                  const val = Math.max(4, Number(e.target.value));
                  if (onUpdateRoomDimension) onUpdateRoomDimension(room.id, val, room.height);
                }}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white font-bold"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Breadth (FT)</label>
              <input
                type="number"
                min="4"
                max="80"
                value={room.height}
                onChange={(e) => {
                  const val = Math.max(4, Number(e.target.value));
                  if (onUpdateRoomDimension) onUpdateRoomDimension(room.id, room.width, val);
                }}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Position X (FT)</label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={room.x}
                onChange={(e) => {
                  const val = Math.max(0, Number(e.target.value));
                  if (onUpdateRoomPosition) onUpdateRoomPosition(room.id, val, room.y);
                }}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white font-bold"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Position Y (FT)</label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={room.y}
                onChange={(e) => {
                  const val = Math.max(0, Number(e.target.value));
                  if (onUpdateRoomPosition) onUpdateRoomPosition(room.id, room.x, val);
                }}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white font-bold"
              />
            </div>
          </div>
        </div>
      )}

      {/* Architectural Fixtures Detail */}
      <div className="space-y-2 border-t border-slate-100 pt-3">
        <h4 className="text-[11px] font-bold text-slate-700 uppercase font-mono flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-sky-600" />
          <span>Architectural Fixtures</span>
        </h4>

        <div className="space-y-1 text-[11px] text-slate-600 font-mono">
          <div className="flex justify-between">
            <span>Doors ({room.doors.length}):</span>
            <span className="font-semibold text-slate-800">
              {room.doors.map((d) => `${d.wall.toUpperCase()} (${d.width} FT)`).join(', ') || 'Internal Access'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Windows ({room.windows.length}):</span>
            <span className="font-semibold text-slate-800">
              {room.windows.map((w) => `${w.wall.toUpperCase()} (${w.width} FT)`).join(', ') || 'Interior Ventilation'}
            </span>
          </div>
        </div>
      </div>

      {/* XAI Button */}
      <button
        onClick={() => onSelectForXAI(room.id)}
        className="w-full py-2.5 px-3 bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-200 font-mono font-bold text-xs uppercase rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
      >
        <Sparkles className="w-4 h-4 text-sky-600" />
        <span>Explain Room Logic (XAI)</span>
      </button>
    </div>
  );
};
