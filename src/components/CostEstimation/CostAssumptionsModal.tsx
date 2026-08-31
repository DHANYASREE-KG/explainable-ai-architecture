import React, { useState } from 'react';
import { MaterialRates } from '../../types/costEstimation';
import { DEFAULT_MATERIAL_RATES } from '../../../server/costEstimationML';
import {
  X,
  SlidersHorizontal,
  RotateCcw,
  Check,
  Package,
  HardHat,
} from 'lucide-react';

interface CostAssumptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRates: MaterialRates;
  onSaveRates: (newRates: MaterialRates) => void;
}

export const CostAssumptionsModal: React.FC<CostAssumptionsModalProps> = ({
  isOpen,
  onClose,
  currentRates,
  onSaveRates,
}) => {
  const [rates, setRates] = useState<MaterialRates>({ ...currentRates });

  if (!isOpen) return null;

  const handleChange = (field: keyof MaterialRates, value: number) => {
    setRates((prev) => ({
      ...prev,
      [field]: Math.max(0, value),
    }));
  };

  const handleResetToDefault = () => {
    setRates({ ...DEFAULT_MATERIAL_RATES });
  };

  const handleSave = () => {
    onSaveRates(rates);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0F172A]/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-[#E2E8F0] rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-[#E2E8F0] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#0F172A] font-sans">
                Material & Labour Rate Assumptions
              </h3>
              <p className="text-xs text-[#64748B]">
                Configure regional unit benchmark prices to recalibrate the model.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 overflow-y-auto space-y-6 text-xs">
          {/* Section 1: Materials */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[#0F172A] font-mono uppercase tracking-wider">
              <Package className="w-4 h-4 text-[#2563EB]" />
              <span>1. Structural Materials Unit Rates</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#475569] mb-1 font-mono">
                  Cement Rate (₹ / 50kg Bag)
                </label>
                <input
                  type="number"
                  value={rates.cementRatePerBag}
                  onChange={(e) => handleChange('cementRatePerBag', Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg font-mono font-bold text-[#0F172A] focus:bg-white focus:outline-hidden focus:border-[#2563EB]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#475569] mb-1 font-mono">
                  Steel Rebar Rate (₹ / kg)
                </label>
                <input
                  type="number"
                  value={rates.steelRatePerKg}
                  onChange={(e) => handleChange('steelRatePerKg', Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg font-mono font-bold text-[#0F172A] focus:bg-white focus:outline-hidden focus:border-[#2563EB]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#475569] mb-1 font-mono">
                  M-Sand Rate (₹ / m³)
                </label>
                <input
                  type="number"
                  value={rates.sandRatePerM3}
                  onChange={(e) => handleChange('sandRatePerM3', Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg font-mono font-bold text-[#0F172A] focus:bg-white focus:outline-hidden focus:border-[#2563EB]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#475569] mb-1 font-mono">
                  Clay Bricks / Blocks (₹ / 1000 Units)
                </label>
                <input
                  type="number"
                  value={rates.brickRatePer1000}
                  onChange={(e) => handleChange('brickRatePer1000', Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg font-mono font-bold text-[#0F172A] focus:bg-white focus:outline-hidden focus:border-[#2563EB]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#475569] mb-1 font-mono">
                  Coarse Aggregate (₹ / m³)
                </label>
                <input
                  type="number"
                  value={rates.aggregateRatePerM3}
                  onChange={(e) => handleChange('aggregateRatePerM3', Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg font-mono font-bold text-[#0F172A] focus:bg-white focus:outline-hidden focus:border-[#2563EB]"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Labour Daily Rates */}
          <div className="space-y-3 pt-3 border-t border-[#E2E8F0]">
            <div className="flex items-center gap-2 text-xs font-bold text-[#0F172A] font-mono uppercase tracking-wider">
              <HardHat className="w-4 h-4 text-[#0F2747]" />
              <span>2. Trade Labour Day Rates (8-hr Shift)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#475569] mb-1 font-mono">
                  Mason Rate (₹/day)
                </label>
                <input
                  type="number"
                  value={rates.masonRatePerDay}
                  onChange={(e) => handleChange('masonRatePerDay', Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg font-mono font-bold text-[#0F172A] focus:bg-white focus:outline-hidden focus:border-[#2563EB]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#475569] mb-1 font-mono">
                  Carpenter Rate (₹/day)
                </label>
                <input
                  type="number"
                  value={rates.carpenterRatePerDay}
                  onChange={(e) => handleChange('carpenterRatePerDay', Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg font-mono font-bold text-[#0F172A] focus:bg-white focus:outline-hidden focus:border-[#2563EB]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#475569] mb-1 font-mono">
                  Electrician Rate (₹/day)
                </label>
                <input
                  type="number"
                  value={rates.electricianRatePerDay}
                  onChange={(e) => handleChange('electricianRatePerDay', Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg font-mono font-bold text-[#0F172A] focus:bg-white focus:outline-hidden focus:border-[#2563EB]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#475569] mb-1 font-mono">
                  Plumber Rate (₹/day)
                </label>
                <input
                  type="number"
                  value={rates.plumberRatePerDay}
                  onChange={(e) => handleChange('plumberRatePerDay', Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg font-mono font-bold text-[#0F172A] focus:bg-white focus:outline-hidden focus:border-[#2563EB]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#475569] mb-1 font-mono">
                  Painter Rate (₹/day)
                </label>
                <input
                  type="number"
                  value={rates.painterRatePerDay}
                  onChange={(e) => handleChange('painterRatePerDay', Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg font-mono font-bold text-[#0F172A] focus:bg-white focus:outline-hidden focus:border-[#2563EB]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#475569] mb-1 font-mono">
                  Helper / Unskilled (₹/day)
                </label>
                <input
                  type="number"
                  value={rates.unskilledRatePerDay}
                  onChange={(e) => handleChange('unskilledRatePerDay', Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg font-mono font-bold text-[#0F172A] focus:bg-white focus:outline-hidden focus:border-[#2563EB]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#E2E8F0] bg-[#F8FAFC] rounded-b-2xl flex items-center justify-between">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="px-3 py-1.5 text-xs text-[#64748B] hover:text-[#0F172A] flex items-center gap-1.5 font-semibold cursor-pointer transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-semibold text-[#475569] hover:text-[#0F172A] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-1.5 bg-[#0F2747] hover:bg-[#1E3A8A] text-white rounded-lg text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Apply & Recalculate</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
