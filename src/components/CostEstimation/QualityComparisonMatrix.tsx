import React from 'react';
import { QualityComparisonItem, ConstructionQuality } from '../../types/costEstimation';
import {
  Check,
  Sparkles,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Layers,
} from 'lucide-react';

interface QualityComparisonMatrixProps {
  currentQuality: ConstructionQuality;
  comparisonItems: QualityComparisonItem[];
  onSelectQualityTier: (quality: ConstructionQuality) => void;
}

export const QualityComparisonMatrix: React.FC<QualityComparisonMatrixProps> = ({
  currentQuality,
  comparisonItems,
  onSelectQualityTier,
}) => {
  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 lg:p-7 shadow-xs space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#E2E8F0] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-[#EFF6FF] text-[#2563EB] text-[10px] font-mono font-bold uppercase tracking-wider rounded">
              Specification Matrix
            </span>
            <span className="text-[10px] font-mono text-[#64748B] uppercase">
              Economy to Luxury
            </span>
          </div>
          <h3 className="text-base font-bold text-[#0F172A] font-sans mt-1">
            Construction Quality Tier Comparison
          </h3>
          <p className="text-xs text-[#64748B] mt-0.5">
            Compare material finish specifications, unit rates, and total projected expenditure.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {comparisonItems.map((item) => {
          const isSelected = item.quality === currentQuality;

          return (
            <div
              key={`qual-${item.quality}`}
              className={`rounded-xl p-4.5 border flex flex-col justify-between transition-all ${
                isSelected
                  ? 'bg-[#F8FAFC] border-[#2563EB] ring-2 ring-[#2563EB]/20 shadow-xs'
                  : 'bg-white border-[#E2E8F0] hover:border-[#CBD5E1]'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span
                    className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                      isSelected
                        ? 'bg-[#2563EB] text-white'
                        : 'bg-[#F1F5F9] text-[#475569]'
                    }`}
                  >
                    {item.quality}
                  </span>

                  {isSelected && (
                    <span className="text-[10px] font-mono font-bold text-[#2563EB] flex items-center gap-1">
                      <Check className="w-3 h-3" /> Selected
                    </span>
                  )}
                </div>

                <div>
                  <div className="text-xl font-bold text-[#0F172A] font-sans">
                    ₹ {item.costInLakhs.toFixed(2)} L
                  </div>
                  <div className="text-xs font-mono text-[#64748B] mt-0.5">
                    ₹ {formatINR(item.costPerSqft)} / sq.ft
                  </div>
                </div>

                {/* Difference from Current Badge */}
                {!isSelected && (
                  <div
                    className={`text-[10px] font-mono font-semibold px-2 py-1 rounded flex items-center gap-1 ${
                      item.differenceFromCurrent > 0
                        ? 'bg-[#FEF2F2] text-[#DC2626]'
                        : 'bg-[#F0FDF4] text-[#16A34A]'
                    }`}
                  >
                    {item.differenceFromCurrent > 0 ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    <span>
                      {item.differenceFromCurrent > 0 ? '+' : ''}
                      ₹{(Math.abs(item.differenceFromCurrent) / 100000).toFixed(2)}L (
                      {item.percentageDiffFromCurrent > 0 ? '+' : ''}
                      {item.percentageDiffFromCurrent}%)
                    </span>
                  </div>
                )}

                {/* Key Features Bullet Points */}
                <div className="pt-2 border-t border-[#E2E8F0] space-y-1.5 text-[11px] text-[#475569]">
                  {item.keyFeatures.map((feat, fIdx) => (
                    <div key={`feat-${fIdx}`} className="leading-tight">
                      • {feat}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-3">
                <button
                  type="button"
                  onClick={() => onSelectQualityTier(item.quality)}
                  disabled={isSelected}
                  className={`w-full py-1.5 px-3 rounded text-xs font-mono font-semibold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-[#E2E8F0] text-[#64748B] cursor-default'
                      : 'bg-[#0F2747] hover:bg-[#1E3A8A] text-white'
                  }`}
                >
                  <span>{isSelected ? 'Current Tier' : `Switch to ${item.quality}`}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
