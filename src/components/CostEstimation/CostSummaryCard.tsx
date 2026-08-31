import React from 'react';
import { LayoutData } from '../../types';
import {
  CostEstimationRequest,
} from '../../types/costEstimation';
import {
  CheckCircle2,
  AlertTriangle,
  RotateCw,
} from 'lucide-react';

interface CostSummaryCardProps {
  inputs: CostEstimationRequest;
  layoutData: LayoutData;
  isOutdated: boolean;
  onRecalculate: () => void;
}

export const CostSummaryCard: React.FC<CostSummaryCardProps> = ({
  inputs,
  isOutdated,
  onRecalculate,
}) => {
  const builtupArea = inputs.builtupAreaSqft || 0;
  const baseRate = 2500; // Base Construction Rate: ₹2,500 / sq.ft
  const totalCostINR = builtupArea * baseRate;
  const costLakhs = (totalCostINR / 100000).toFixed(2);

  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="space-y-3">
      {/* Design Outdated Alert Banner */}
      {isOutdated && (
        <div className="p-4 bg-[#FFFBEB] border border-[#FDE68A] rounded-xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-[#D97706] shrink-0" />
            <div>
              <div className="text-xs font-bold text-[#92400E]">
                Design Updated — Recalculate Cost
              </div>
              <div className="text-[11px] text-[#B45309]">
                Architectural blueprint modifications detected. Refresh to recalculate with new built-up area.
              </div>
            </div>
          </div>
          <button
            onClick={onRecalculate}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-mono font-bold rounded-lg transition-colors cursor-pointer shrink-0"
          >
            <RotateCw className="w-3.5 h-3.5" />
            Recalculate
          </button>
        </div>
      )}

      {/* Primary Result Card */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 lg:p-8 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#2563EB] bg-[#EFF6FF] px-2.5 py-0.5 rounded border border-[#BFDBFE]">
                Estimated Construction Cost
              </span>
              <span className="flex items-center gap-1 text-[11px] font-medium text-[#166534] bg-[#F0FDF4] px-2.5 py-0.5 rounded border border-[#BBF7D0]">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A]" />
                Based on Current Generated Blueprint
              </span>
            </div>

            <div className="flex flex-wrap items-baseline gap-3 pt-1">
              <span className="text-3xl sm:text-4xl lg:text-5xl font-black font-mono text-[#0F172A] tracking-tight">
                ₹ {formatINR(totalCostINR)}
              </span>
              <span className="text-lg sm:text-xl font-bold font-mono text-[#2563EB]">
                (₹ {costLakhs} Lakhs)
              </span>
            </div>

            <p className="text-xs text-[#64748B] pt-0.5">
              Calculated for the current generated architectural design at the base benchmark rate.
            </p>
          </div>

          {/* Right Metrics: Built-up Area & Base Rate */}
          <div className="flex sm:flex-row md:flex-col gap-3 shrink-0 border-t md:border-t-0 md:border-l border-[#E2E8F0] pt-4 md:pt-0 md:pl-6">
            <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg min-w-[170px]">
              <span className="text-[10px] uppercase font-mono text-[#64748B] block font-semibold">
                Built-up Area
              </span>
              <span className="text-base font-bold font-mono text-[#0F172A]">
                {builtupArea.toLocaleString()} sq.ft
              </span>
            </div>

            <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg min-w-[170px]">
              <span className="text-[10px] uppercase font-mono text-[#64748B] block font-semibold">
                Base Rate
              </span>
              <span className="text-base font-bold font-mono text-[#2563EB]">
                ₹ 2,500 / sq.ft
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
