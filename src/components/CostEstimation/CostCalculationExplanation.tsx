import React, { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle, ArrowDown } from 'lucide-react';

interface CostCalculationExplanationProps {
  builtupAreaSqft: number;
}

export const CostCalculationExplanation: React.FC<CostCalculationExplanationProps> = ({
  builtupAreaSqft,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const baseRate = 2500;
  const totalCost = builtupAreaSqft * baseRate;
  const lakhs = (totalCost / 100000).toFixed(2);

  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-2xs">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 sm:p-5 text-left hover:bg-[#F8FAFC] transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] flex items-center justify-center">
            <HelpCircle className="w-4 h-4" />
          </div>
          <div>
            <span className="text-sm font-bold text-[#0F172A] font-sans block">
              How is the cost calculated?
            </span>
            <span className="text-xs text-[#64748B]">
              Step-by-step arithmetic derivation for this house
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-mono text-[#2563EB]">
          <span>{isOpen ? 'Hide Details' : 'View Step'}</span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {isOpen && (
        <div className="p-5 sm:p-6 border-t border-[#E2E8F0] bg-[#F8FAFC] space-y-5">
          {/* Step Sequence Flow */}
          <div className="flex flex-col items-center max-w-md mx-auto space-y-2">
            <div className="w-full p-3 bg-white border border-[#E2E8F0] rounded-lg text-center shadow-xs">
              <span className="text-[10px] uppercase font-mono font-bold text-[#64748B] block">Step 1</span>
              <span className="text-xs font-semibold text-[#0F172A]">Current Generated Blueprint</span>
            </div>

            <ArrowDown className="w-4 h-4 text-[#2563EB]" />

            <div className="w-full p-3 bg-white border border-[#E2E8F0] rounded-lg text-center shadow-xs">
              <span className="text-[10px] uppercase font-mono font-bold text-[#64748B] block">Step 2</span>
              <span className="text-xs font-semibold text-[#0F172A]">
                Actual Built-up Area: <span className="font-bold text-[#2563EB] font-mono">{builtupAreaSqft.toLocaleString()} sq.ft</span>
              </span>
            </div>

            <ArrowDown className="w-4 h-4 text-[#2563EB]" />

            <div className="w-full p-3 bg-white border border-[#E2E8F0] rounded-lg text-center shadow-xs">
              <span className="text-[10px] uppercase font-mono font-bold text-[#64748B] block">Step 3</span>
              <span className="text-xs font-semibold text-[#0F172A]">
                Base Construction Rate: <span className="font-bold text-[#2563EB] font-mono">₹ 2,500 / sq.ft</span>
              </span>
            </div>

            <ArrowDown className="w-4 h-4 text-[#2563EB]" />

            <div className="w-full p-3.5 bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg text-center shadow-xs">
              <span className="text-[10px] uppercase font-mono font-bold text-[#1E40AF] block">Step 4 • Result</span>
              <span className="text-sm font-bold text-[#1D4ED8] font-mono">
                {builtupAreaSqft.toLocaleString()} sq.ft × ₹2,500/sq.ft = ₹ {formatINR(totalCost)} (₹ {lakhs} Lakhs)
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
