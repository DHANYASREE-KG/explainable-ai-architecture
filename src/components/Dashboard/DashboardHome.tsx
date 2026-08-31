import React from 'react';
import {
  MapPin,
  Hexagon,
  ArrowRight,
  FolderOpen,
  Sparkles,
  Building2,
  CheckCircle2,
} from 'lucide-react';
import { LandDetails, FacingDirection } from '../../types';

interface DashboardHomeProps {
  onStartRegularPlot: () => void;
  onStartIrregularPlot: () => void;
  land: LandDetails;
  facingDirection: FacingDirection;
  roomsCount: number;
  isValid: boolean;
  has2D: boolean;
  has3D: boolean;
  onContinueCurrentProject: () => void;
}

export const DashboardHome: React.FC<DashboardHomeProps> = ({
  onStartRegularPlot,
  onStartIrregularPlot,
  land,
  onContinueCurrentProject,
}) => {
  const isLandDefined = (land?.length ?? 0) > 0 && (land?.breadth ?? 0) > 0 && (land?.totalArea ?? 0) > 0;

  return (
    <div className="max-w-4xl mx-auto py-8 md:py-16 space-y-10 animate-in fade-in duration-300">
      {/* Hero Header */}
      <div className="space-y-4 text-center sm:text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#EFF6FF] border border-[#DBEAFE] rounded-md text-xs font-mono font-bold text-[#2563EB]">
          <Sparkles className="w-3.5 h-3.5" />
          <span>PARAMETRIC ARCHITECTURAL ENGINE</span>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#0F172A] tracking-tight">
          Intelligent Architecture.
        </h1>
        <p className="text-base sm:text-lg text-[#64748B] max-w-2xl leading-relaxed">
          Generate structurally compliant 2D CAD floor plans and realistic 3D architectural models with physical door voids, window assemblies, and algorithmic space planning.
        </p>
      </div>

      {/* Mode Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4">
        <button
          type="button"
          onClick={onStartRegularPlot}
          className="group flex flex-col items-start p-7 bg-[#FFFFFF] border border-[#E2E8F0] hover:border-[#2563EB] rounded-2xl shadow-xs hover:shadow-md transition-all cursor-pointer text-left"
        >
          <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-[#EFF6FF] text-[#2563EB] mb-5 group-hover:scale-105 transition-transform">
            <MapPin className="w-6 h-6" />
          </div>
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#2563EB] mb-1">
            STANDARD SITE
          </span>
          <h2 className="text-lg font-bold text-[#0F172A] mb-2">Rectilinear Plot</h2>
          <p className="text-xs text-[#64748B] leading-relaxed mb-6">
            Standard rectangular or square sites with fixed orthogonal boundaries, setbacks, and road frontage.
          </p>
          <div className="mt-auto flex items-center gap-2 text-xs font-bold text-[#2563EB]">
            <span>Configure Site</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

        <button
          type="button"
          onClick={onStartIrregularPlot}
          className="group flex flex-col items-start p-7 bg-[#FFFFFF] border border-[#E2E8F0] hover:border-[#2563EB] rounded-2xl shadow-xs hover:shadow-md transition-all cursor-pointer text-left"
        >
          <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-[#EFF6FF] text-[#2563EB] mb-5 group-hover:scale-105 transition-transform">
            <Hexagon className="w-6 h-6" />
          </div>
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#2563EB] mb-1">
            CUSTOM GEOMETRY
          </span>
          <h2 className="text-lg font-bold text-[#0F172A] mb-2">Polygon Plot Editor</h2>
          <p className="text-xs text-[#64748B] leading-relaxed mb-6">
            Custom corner coordinates, irregular boundaries, angled plot edges, and interactive vertex editing.
          </p>
          <div className="mt-auto flex items-center gap-2 text-xs font-bold text-[#2563EB]">
            <span>Draw Polygon</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>
      </div>

      {isLandDefined && (
        <div className="pt-2">
          <button
            type="button"
            onClick={onContinueCurrentProject}
            className="flex items-center justify-center gap-3 px-6 py-3.5 btn-outline w-full rounded-xl"
          >
            <FolderOpen className="w-4 h-4 text-[#2563EB]" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider">
              Resume Active Project ({land?.length ?? 0} × {land?.breadth ?? 0} ft • {(land?.totalArea ?? 0).toLocaleString()} sq.ft)
            </span>
          </button>
        </div>
      )}
    </div>
  );
};

