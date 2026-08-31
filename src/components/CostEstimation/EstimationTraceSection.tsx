import React, { useState } from 'react';
import {
  Grid3X3,
  Maximize2,
  Layers,
  Home,
  Package,
  Cpu,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  ArrowDown,
} from 'lucide-react';

export const EstimationTraceSection: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  const pipelineSteps = [
    {
      step: 1,
      title: 'Generated 2D Blueprint',
      desc: 'Plot boundary, orientation, setback constraints & spatial layout.',
      icon: <Grid3X3 className="w-4 h-4 text-[#2563EB]" />,
    },
    {
      step: 2,
      title: 'Building Footprint',
      desc: 'Ground coverage polygon, outer boundary perimeter & setbacks.',
      icon: <Maximize2 className="w-4 h-4 text-[#2563EB]" />,
    },
    {
      step: 3,
      title: 'Built-up Area',
      desc: 'Total carpet area + external/internal walls + circulation corridors.',
      icon: <Layers className="w-4 h-4 text-[#2563EB]" />,
    },
    {
      step: 4,
      title: 'Room & Space Count',
      desc: 'Categorized bedrooms, attached/common bathrooms, kitchen & halls.',
      icon: <Home className="w-4 h-4 text-[#2563EB]" />,
    },
    {
      step: 5,
      title: 'Quantity Estimation',
      desc: 'Bill of quantities: cement bags, steel tonnage, sand/aggregate & trade labor.',
      icon: <Package className="w-4 h-4 text-[#D97706]" />,
    },
    {
      step: 6,
      title: 'Feature Engineering',
      desc: 'Normalized area ratios, room densities, and structural complexity indicators.',
      icon: <Cpu className="w-4 h-4 text-[#2563EB]" />,
    },
    {
      step: 7,
      title: 'Trained XGBoost Model',
      desc: 'Inference on trained ensemble tree model with cross-validated weights.',
      icon: <Cpu className="w-4 h-4 text-[#7C3AED]" />,
    },
    {
      step: 8,
      title: 'Estimated Cost',
      desc: 'Final construction cost in ₹, cost per sq.ft & indicative planning bounds.',
      icon: <TrendingUp className="w-4 h-4 text-[#16A34A]" />,
    },
  ];

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 lg:p-7 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] flex items-center justify-center">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-[#0F172A] font-sans">
                How was this estimate generated? (Estimation Trace)
              </h3>
              <span className="px-2 py-0.5 bg-[#F0FDF4] text-[#166534] text-[10px] font-mono font-bold uppercase rounded">
                Deterministic Lineage
              </span>
            </div>
            <p className="text-xs text-[#64748B] mt-0.5">
              Technical pipeline connecting your AI-generated architectural blueprint to the XGBoost cost prediction.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs text-[#2563EB] hover:text-[#1D4ED8] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
        >
          <span>{isExpanded ? 'Collapse' : 'Expand Flow'}</span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Pipeline Steps Flow */}
      {isExpanded && (
        <div className="space-y-4 pt-2">
          {/* Horizontal / Grid Flow */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {pipelineSteps.map((s, idx) => (
              <div
                key={`pipe-step-${s.step}`}
                className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg flex flex-col justify-between hover:border-[#BFDBFE] transition-colors relative group"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-[#2563EB] bg-white px-2 py-0.5 border border-[#E2E8F0] rounded">
                      STEP 0{s.step}
                    </span>
                    <div className="p-1 rounded bg-white border border-[#E2E8F0]">
                      {s.icon}
                    </div>
                  </div>

                  <h4 className="text-xs font-bold text-[#0F172A] mt-2 font-sans">
                    {s.title}
                  </h4>
                  <p className="text-[11px] text-[#64748B] mt-1 leading-relaxed">
                    {s.desc}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-[#E2E8F0] flex items-center justify-between text-[10px] font-mono text-[#64748B]">
                  <span>Phase 0{s.step}</span>
                  {idx < pipelineSteps.length - 1 ? (
                    <ArrowRight className="w-3 h-3 text-[#94A3B8]" />
                  ) : (
                    <span className="text-[#16A34A] font-bold">● Output</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Simple Linear Summary Banner */}
          <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs font-mono text-[#475569] flex items-center justify-center flex-wrap gap-2 text-center">
            <span className="font-bold text-[#0F172A]">Blueprint</span>
            <span className="text-[#94A3B8]">→</span>
            <span className="font-bold text-[#0F172A]">Building Geometry</span>
            <span className="text-[#94A3B8]">→</span>
            <span className="font-bold text-[#0F172A]">Built-up Area</span>
            <span className="text-[#94A3B8]">→</span>
            <span className="font-bold text-[#0F172A]">Room & Space Count</span>
            <span className="text-[#94A3B8]">→</span>
            <span className="font-bold text-[#0F172A]">Quantity Takeoff</span>
            <span className="text-[#94A3B8]">→</span>
            <span className="font-bold text-[#0F172A]">Feature Vectors</span>
            <span className="text-[#94A3B8]">→</span>
            <span className="font-bold text-[#2563EB]">XGBoost Regressor</span>
            <span className="text-[#94A3B8]">→</span>
            <span className="font-bold text-[#16A34A]">Estimated Construction Cost</span>
          </div>
        </div>
      )}
    </div>
  );
};
