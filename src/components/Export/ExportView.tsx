import React from 'react';
import {
  Printer,
  FileCode,
  Layers,
  CheckCircle2,
  Grid3X3,
  Box,
} from 'lucide-react';
import { LayoutData } from '../../types';
import { analyzeBlueprintExplainability } from '../../services/explainableAIAnalyzer';

interface ExportViewProps {
  layoutData: LayoutData;
  onNavigateTo2D: () => void;
  onNavigateTo3D: () => void;
}

export const ExportView: React.FC<ExportViewProps> = ({
  layoutData,
  onNavigateTo2D,
  onNavigateTo3D,
}) => {
  const { land, facingDirection, rooms } = layoutData;
  const report = analyzeBlueprintExplainability(layoutData);
  const { qualityScore } = report;

  const totalBuiltUp = rooms.reduce((sum, p) => sum + p.width * p.height, 0);
  const coveragePercent = land.totalArea > 0 ? Math.round((totalBuiltUp / land.totalArea) * 100) : 0;

  const handleDownloadJSON = () => {
    const dataStr = JSON.stringify(layoutData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `blueprint_${land.length}x${land.breadth}ft.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-4 animate-in fade-in duration-300">
      {/* Global Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-6 border-b border-[#E2E8F0]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#2563EB] bg-[#EFF6FF] px-2.5 py-0.5 rounded-md border border-[#DBEAFE]">
              EXPORT & DOCUMENTATION
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#0F172A] tracking-tight">
            Project Specification Sheet
          </h2>
          <p className="text-sm text-[#64748B] mt-1 max-w-2xl">
            Complete architectural schedules, space metrics, and production-ready code files.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleDownloadJSON}
            className="btn-outline text-xs"
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Download JSON</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="btn-primary text-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Specs</span>
          </button>
        </div>
      </div>

      {/* Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#FFFFFF] border border-[#E2E8F0] p-5 rounded-xl shadow-2xs space-y-1.5">
          <div className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider font-mono">Total Plot Area</div>
          <div className="text-2xl font-bold text-[#0F172A] font-mono">{(land?.totalArea ?? 0).toLocaleString()} <span className="text-xs text-[#64748B] font-normal">sq.ft</span></div>
          <div className="text-[11px] text-[#64748B] font-mono">{land?.length ?? 0} ft frontage × {land?.breadth ?? 0} ft depth</div>
        </div>

        <div className="bg-[#FFFFFF] border border-[#E2E8F0] p-5 rounded-xl shadow-2xs space-y-1.5">
          <div className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider font-mono">Total Built-Up</div>
          <div className="text-2xl font-bold text-[#0F172A] font-mono">{(totalBuiltUp ?? 0).toLocaleString()} <span className="text-xs text-[#64748B] font-normal">sq.ft</span></div>
          <div className="text-[11px] text-[#64748B] font-mono">{coveragePercent}% ground coverage</div>
        </div>

        <div className="bg-[#FFFFFF] border border-[#E2E8F0] p-5 rounded-xl shadow-2xs space-y-1.5">
          <div className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider font-mono">Orientation</div>
          <div className="text-2xl font-bold text-[#0F172A]">{facingDirection}</div>
          <div className="text-[11px] text-[#16A34A] flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Main entrance on frontage</span>
          </div>
        </div>

        <div className="bg-[#EFF6FF] border border-[#DBEAFE] p-5 rounded-xl shadow-2xs space-y-1.5">
          <div className="text-[10px] font-bold text-[#2563EB] uppercase tracking-wider font-mono">AI Quality Rating</div>
          <div className="text-2xl font-bold text-[#1D4ED8] font-mono">
            {qualityScore.overallScore}/100
          </div>
          <div className="text-[11px] text-[#2563EB]">{qualityScore.ratingText} ({qualityScore.reasons.length} checks)</div>
        </div>
      </div>

      {/* Room Schedule Table */}
      <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl overflow-hidden shadow-2xs">
        <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
          <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-[#0F172A] flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#2563EB]" />
            Room Dimension Schedule
          </h3>
          <span className="text-[11px] font-bold text-[#64748B] font-mono">{rooms.length} planned spaces</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-bold uppercase tracking-wider text-[10px] font-mono">
              <tr>
                <th className="px-6 py-3.5">Space Name</th>
                <th className="px-6 py-3.5">Dimensions (L × B)</th>
                <th className="px-6 py-3.5">Carpet Area</th>
                <th className="px-6 py-3.5">Zone</th>
                <th className="px-6 py-3.5">Coordinate Pos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9] text-[#0F172A] text-xs">
              {rooms.map((room) => {
                const area = room.width * room.height;
                const name = room.name.toLowerCase();
                let zone = 'Living / Social';
                if (name.includes('bed') || name.includes('study') || name.includes('pooja')) zone = 'Private Zone';
                else if (name.includes('bath') || name.includes('kitchen') || name.includes('util')) zone = 'Service Zone';
                else if (name.includes('park') || name.includes('garden') || name.includes('balcony')) zone = 'Outdoor';

                return (
                  <tr key={room.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="px-6 py-3.5 font-bold text-[#0F172A]">{room.name}</td>
                    <td className="px-6 py-3.5 font-mono text-[#64748B]">{room.width} ft × {room.height} ft</td>
                    <td className="px-6 py-3.5 font-mono font-bold text-[#0F172A]">{area} sq.ft</td>
                    <td className="px-6 py-3.5">
                      <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-[#F8FAFC] border border-[#E2E8F0] text-[#64748B] rounded font-mono">
                        {zone}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-[#64748B] font-mono text-[11px]">
                      X: {room.x} ft, Y: {room.y} ft
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          type="button"
          onClick={onNavigateTo2D}
          className="bg-[#FFFFFF] border border-[#E2E8F0] hover:border-[#2563EB] p-5 rounded-xl text-left transition-all cursor-pointer group shadow-2xs hover:shadow-xs"
        >
          <div className="w-9 h-9 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center mb-3">
            <Grid3X3 className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-[#0F172A] group-hover:text-[#2563EB] transition-colors">View 2D Blueprint & Explainable AI</h3>
          <p className="text-xs text-[#64748B] mt-1">Interactive floor plan with embedded spatial reasoning and SVG/PNG vector downloads.</p>
        </button>

        <button
          type="button"
          onClick={onNavigateTo3D}
          className="bg-[#FFFFFF] border border-[#E2E8F0] hover:border-[#2563EB] p-5 rounded-xl text-left transition-all cursor-pointer group shadow-2xs hover:shadow-xs"
        >
          <div className="w-9 h-9 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center mb-3">
            <Box className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-[#0F172A] group-hover:text-[#2563EB] transition-colors">View 3D Architectural Model</h3>
          <p className="text-xs text-[#64748B] mt-1">Interactive 3D model with realistic door voids, window frames, lintels, and lighting.</p>
        </button>
      </div>
    </div>
  );
};

