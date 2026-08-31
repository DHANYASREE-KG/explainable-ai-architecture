import React, { useState, useRef, useEffect } from 'react';
import {
  RotateCcw,
  Menu,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  FolderOpen,
  ChevronDown,
  Edit2,
  Check,
} from 'lucide-react';
import { FacingDirection, LandDetails } from '../types';

interface HeaderProps {
  projectName?: string;
  onUpdateProjectName?: (name: string) => void;
  onReset: () => void;
  onLoadPreset?: (preset: 'urban30x40' | 'villa40x60' | 'starter30x50') => void;
  statusText?: string;
  isReady?: boolean;
  land?: LandDetails;
  facingDirection?: FacingDirection;
  roomsCount?: number;
  onToggleMobileMenu?: () => void;
  onQuickGenerate?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  projectName = 'Modern Residential Villa',
  onUpdateProjectName,
  onReset,
  onLoadPreset,
  statusText,
  isReady,
  land,
  facingDirection,
  roomsCount = 0,
  onToggleMobileMenu,
}) => {
  const [showPresetsMenu, setShowPresetsMenu] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(projectName);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTempName(projectName);
  }, [projectName]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowPresetsMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSaveName = () => {
    setIsEditingName(false);
    if (onUpdateProjectName && tempName.trim()) {
      onUpdateProjectName(tempName.trim());
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 h-14 flex items-center shadow-xs">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Mobile Toggle & Brand Logo & Editable Project Name */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={onToggleMobileMenu}
              className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors border border-slate-200 cursor-pointer"
              title="Toggle Navigation"
              aria-label="Toggle Menu"
            >
              <Menu className="w-4 h-4" />
            </button>

            {/* Brand Logo & Name */}
            <div className="flex items-center gap-2.5 shrink-0 border-r border-slate-200 pr-3 mr-1">
              <div className="w-8 h-8 rounded-lg bg-[#0F172A] flex items-center justify-center text-white shrink-0 shadow-xs">
                <Sparkles className="w-4 h-4 text-blue-400" />
              </div>
              <div className="hidden sm:flex items-center gap-1.5">
                <span className="text-xs font-bold tracking-wider text-[#0F172A] uppercase font-mono">
                  AI ARCHITECT
                </span>
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-200/60 px-1.5 py-0.2 rounded font-mono">
                  PRO
                </span>
              </div>
            </div>

            {/* Editable Project Name */}
            <div className="min-w-0 flex items-center">
              {isEditingName ? (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveName();
                      if (e.key === 'Escape') {
                        setTempName(projectName);
                        setIsEditingName(false);
                      }
                    }}
                    autoFocus
                    className="text-xs sm:text-sm font-semibold text-[#0F172A] bg-white border border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 rounded px-2 py-0.5 max-w-[200px] sm:max-w-[280px]"
                    placeholder="Project Name"
                  />
                  <button
                    type="button"
                    onClick={handleSaveName}
                    className="p-1 text-emerald-600 hover:bg-emerald-50 rounded cursor-pointer"
                    title="Save"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditingName(true)}
                  className="group flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#0F172A] hover:text-blue-600 rounded px-2 py-1 transition-colors cursor-pointer text-left truncate max-w-[180px] sm:max-w-[280px]"
                  title="Click to rename project"
                >
                  <span className="truncate">{projectName}</span>
                  <Edit2 className="w-3 h-3 text-slate-400 group-hover:text-blue-500 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              )}
            </div>
          </div>

          {/* Right: Presets Dropdown, Validation Status Badge & Reset Action */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Quick Templates Preset Selector */}
            {onLoadPreset && (
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setShowPresetsMenu(!showPresetsMenu)}
                  className="h-8 px-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-[#0F172A] border border-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Load a sample blueprint"
                >
                  <FolderOpen className="w-3.5 h-3.5 text-slate-500" />
                  <span className="hidden md:inline">Presets</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {showPresetsMenu && (
                  <div className="absolute right-0 mt-1.5 w-60 bg-white border border-slate-200 rounded-lg shadow-lg py-1.5 z-50 text-xs animate-in fade-in slide-in-from-top-1">
                    <div className="px-3 py-1.5 text-[10px] font-bold text-slate-700 uppercase tracking-wider font-mono">
                      Architectural Presets
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onLoadPreset('urban30x40');
                        setShowPresetsMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between text-slate-700 hover:text-blue-600 transition-colors cursor-pointer"
                    >
                      <div>
                        <div className="font-semibold">30 × 40 Urban Villa (1,200 sq.ft)</div>
                        <div className="text-[11px] text-slate-600">2BHK • North Facing • Compact</div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onLoadPreset('villa40x60');
                        setShowPresetsMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between text-slate-700 hover:text-blue-600 transition-colors cursor-pointer"
                    >
                      <div>
                        <div className="font-semibold">40 × 60 Luxury Estate (2,400 sq.ft)</div>
                        <div className="text-[11px] text-slate-600">3BHK • East Facing • Garden + Car</div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onLoadPreset('starter30x50');
                        setShowPresetsMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between text-slate-700 hover:text-blue-600 transition-colors cursor-pointer"
                    >
                      <div>
                        <div className="font-semibold">30 × 50 Irregular Plot (1,400 sq.ft)</div>
                        <div className="text-[11px] text-slate-600">2BHK • Polygon Plot with Setbacks</div>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Validation Status Badge */}
            {statusText && (
              <div className="hidden sm:flex items-center">
                {isReady ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/80">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    {statusText}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200/80">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    {statusText}
                  </span>
                )}
              </div>
            )}

            {/* Reset / New Plan Button */}
            <button
              type="button"
              onClick={onReset}
              className="h-8 px-3 rounded-lg bg-white hover:bg-slate-50 text-slate-700 hover:text-[#0F172A] border border-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              title="Start a new floor plan"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">New Plan</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

