import React from 'react';
import { AreaMetrics, LandDetails, RoomRequirement } from '../types';
import { BarChart3, ArrowRight, ShieldAlert } from 'lucide-react';
import { calculateRoomArea } from '../services/areaCalculator';

interface StepAreaSummaryProps {
  land: LandDetails;
  rooms: RoomRequirement[];
  metrics: AreaMetrics;
  onNext: () => void;
  onGoToSuggestions: () => void;
}

export const StepAreaSummary: React.FC<StepAreaSummaryProps> = ({
  rooms,
  metrics,
  onNext,
  onGoToSuggestions,
}) => {
  const isOverflow = metrics.excessArea > 0;

  return (
    <div className="space-y-6">
      {/* Title Header Card */}
      <div className="bg-white border border-[#E5E7EB] rounded-[8px] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 bg-[#0F2747] text-white rounded-md flex items-center justify-center shrink-0 shadow-xs">
            <BarChart3 className="w-5 h-5 text-cyan-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 font-mono">
                STEP 05
              </span>
              <h2 className="text-xl font-bold text-[#172033] tracking-tight">Area Calculation Summary</h2>
            </div>
            <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
              Comprehensive mathematical breakdown of room square footages, structural walls, and circulation corridors.
            </p>
          </div>
        </div>
      </div>

      {/* Overflow Alert Banner if Invalid */}
      {isOverflow && (
        <div className="bg-[#FFFBEB] border border-[#F59E0B] rounded-[8px] p-5 shadow-[0_1px_2px_rgba(245,158,11,0.05)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-[#FEF3C7] text-[#92400E] rounded-[6px] flex items-center justify-center shrink-0 border border-[#FDE68A]">
              <ShieldAlert className="w-4 h-4 text-[#F59E0B]" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-[#92400E]">
                Area Requirement Exceeds Plot Capacity
              </h3>
              <p className="text-xs text-[#B45309] mt-0.5 leading-relaxed">
                Required footprint of <strong className="text-[#111827] font-semibold">{metrics.finalRequiredArea} sq.ft</strong> exceeds available land area of <strong className="text-[#111827] font-semibold">{metrics.totalLandArea} sq.ft</strong> by <strong className="text-[#DC2626] font-bold">{metrics.excessArea} sq.ft</strong>.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onGoToSuggestions}
            className="h-9 px-4 bg-[#0F2747] hover:bg-[#173866] text-white font-semibold text-[10px] uppercase tracking-wider font-mono rounded-lg shadow-xs transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            Review AI Optimization →
          </button>
        </div>
      )}

      {/* Live Table & Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table Column */}
        <div className="lg:col-span-2 bg-white border border-[#E5E7EB] rounded-[8px] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-[#111827] uppercase tracking-wider">
              Individual Space Breakdown
            </h3>
            <span className="text-xs text-[#6B7280] font-mono font-medium">{rooms.length} Rooms Allocated</span>
          </div>

          <div className="overflow-x-auto rounded-[6px] border border-[#E5E7EB]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F9FC] text-[#4B5563] uppercase tracking-wider border-b border-[#E5E7EB] font-semibold text-[10px]">
                <tr>
                  <th className="py-2.5 px-3.5">Space Name</th>
                  <th className="py-2.5 px-3.5 text-right">Length</th>
                  <th className="py-2.5 px-3.5 text-right">Breadth</th>
                  <th className="py-2.5 px-3.5 text-right">Calculated Area</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] text-[#111827] font-mono text-xs">
                {rooms.map((r) => {
                  const roomArea = calculateRoomArea(r.length, r.breadth);

                  return (
                    <tr key={r.id} className="hover:bg-[#F7F9FC]/60 transition-colors">
                      <td className="py-2.5 px-3.5 font-semibold text-[#111827] font-sans">{r.name}</td>
                      <td className="py-2.5 px-3.5 text-right text-[#4B5563]">{r.length} ft</td>
                      <td className="py-2.5 px-3.5 text-right text-[#4B5563]">{r.breadth} ft</td>
                      <td className="py-2.5 px-3.5 text-right font-bold text-[#111827]">
                        {roomArea} sq.ft
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Calculation Summary Box */}
        <div className="bg-white border border-[#E5E7EB] rounded-[8px] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-[#111827] uppercase tracking-wider mb-3">
              Area Equation & Allowances
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-[#E5E7EB] text-[#4B5563]">
                <span>Total Land Area</span>
                <span className="font-bold text-[#111827] font-mono">{metrics.totalLandArea} sq.ft</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-[#E5E7EB] text-[#4B5563]">
                <span>Sum of Room Areas</span>
                <span className="font-bold text-[#111827] font-mono">{metrics.totalRoomArea} sq.ft</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-[#E5E7EB] text-[#6B7280]">
                <span>Wall Allowance ({metrics.wallPercentage}%)</span>
                <span className="font-medium text-[#111827] font-mono">+{metrics.wallAllowance} sq.ft</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-[#E5E7EB] text-[#6B7280]">
                <span>Circulation Allowance ({metrics.circulationPercentage}%)</span>
                <span className="font-medium text-[#111827] font-mono">+{metrics.circulationAllowance} sq.ft</span>
              </div>

              <div className="flex justify-between py-2.5 bg-[#F7F9FC] p-3 rounded-[6px] border border-[#E5E7EB] text-xs font-semibold">
                <span className="text-[#111827]">Final Required Footprint</span>
                <span className={`font-mono ${isOverflow ? 'text-[#DC2626] font-bold' : 'text-[#111827] font-bold'}`}>
                  {metrics.finalRequiredArea} sq.ft
                </span>
              </div>

              {isOverflow ? (
                <div className="p-2.5 bg-[#FFFBEB] border border-[#FDE68A] rounded-[6px] text-[#92400E] text-xs text-center font-semibold font-mono">
                  Excess Footprint: +{metrics.excessArea} sq.ft
                </div>
              ) : (
                <div className="p-2.5 bg-[#F0FDF4] border border-[#86EFAC] rounded-[6px] text-[#166534] text-xs text-center font-semibold font-mono">
                  Remaining Margin: {metrics.remainingArea} sq.ft
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-[#E5E7EB]">
            {isOverflow ? (
              <button
                type="button"
                onClick={onGoToSuggestions}
                className="w-full h-10 px-4 bg-[#0F2747] hover:bg-[#173866] text-white font-semibold uppercase tracking-wider font-mono rounded-lg shadow-xs transition-colors cursor-pointer text-xs"
              >
                Resolve via AI Suggestions →
              </button>
            ) : (
              <button
                type="button"
                onClick={onNext}
                className="w-full h-10 px-4 bg-[#0F2747] hover:bg-[#173866] text-white font-semibold uppercase tracking-wider font-mono rounded-lg shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer text-xs"
              >
                <span>Proceed to Validation Gate</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};



