import React from 'react';
import { FurnitureType } from '../../types';
import { Armchair, Tv, BedDouble, Flower2, Grid, RotateCw, Trash2, X, Plus } from 'lucide-react';

interface BlueprintFurnitureLibraryProps {
  onAddFurniture: (type: FurnitureType) => void;
  onClose: () => void;
}

const PRESET_FURNITURE: {
  type: FurnitureType;
  name: string;
  size: string;
  icon: React.ReactNode;
}[] = [
  { type: 'sofa_3', name: 'Three-Seater Sofa', size: '6.0 × 3.0 FT', icon: <Armchair className="w-4 h-4 text-sky-600" /> },
  { type: 'sofa_2', name: 'Two-Seater Sofa', size: '4.5 × 3.0 FT', icon: <Armchair className="w-4 h-4 text-sky-600" /> },
  { type: 'chair', name: 'Armchair / Chair', size: '3.0 × 3.0 FT', icon: <Armchair className="w-4 h-4 text-sky-600" /> },
  { type: 'tv', name: 'TV / Console Unit', size: '5.0 × 1.5 FT', icon: <Tv className="w-4 h-4 text-slate-700" /> },
  { type: 'rug', name: 'Rectangular Rug', size: '8.0 × 5.0 FT', icon: <Grid className="w-4 h-4 text-amber-600" /> },
  { type: 'bed_queen', name: 'Queen Size Bed', size: '6.5 × 5.0 FT', icon: <BedDouble className="w-4 h-4 text-purple-600" /> },
  { type: 'plant_floor', name: 'Floor Plant Pot', size: '2.0 × 2.0 FT', icon: <Flower2 className="w-4 h-4 text-emerald-600" /> },
  { type: 'plant_hanging', name: 'Hanging Plant Pot', size: '1.5 × 1.5 FT', icon: <Flower2 className="w-4 h-4 text-emerald-600" /> },
];

export const BlueprintFurnitureLibrary: React.FC<BlueprintFurnitureLibraryProps> = ({
  onAddFurniture,
  onClose,
}) => {
  return (
    <div className="bg-white/95 border border-slate-200 rounded-xl p-5 shadow-xl backdrop-blur-md w-72 space-y-4 font-sans text-xs">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <h3 className="text-xs font-bold text-slate-900 uppercase font-mono tracking-wide">
          Add Top-Down Fixtures
        </h3>
        <button
          onClick={onClose}
          className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
        {PRESET_FURNITURE.map((item) => (
          <button
            key={item.type}
            onClick={() => onAddFurniture(item.type)}
            className="w-full p-2.5 bg-slate-50 hover:bg-sky-50 border border-slate-200 hover:border-sky-300 rounded-lg flex items-center justify-between transition-all cursor-pointer group text-left"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-white rounded border border-slate-200 shadow-2xs group-hover:border-sky-300">
                {item.icon}
              </div>
              <div>
                <p className="font-bold text-slate-900 group-hover:text-sky-900 text-[11px]">
                  {item.name}
                </p>
                <p className="text-[10px] text-slate-500 font-mono">
                  {item.size}
                </p>
              </div>
            </div>
            <Plus className="w-4 h-4 text-slate-400 group-hover:text-sky-600 transition-transform group-hover:scale-110" />
          </button>
        ))}
      </div>
    </div>
  );
};
