import React from 'react';
import {
  MapPin,
  Maximize2,
  Layers,
  Package,
  Cpu,
  TrendingUp,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';

interface TraceabilityStep {
  stepNumber: number;
  title: string;
  description: string;
  valueDerived: string;
}

interface TraceabilityFlowProps {
  steps: TraceabilityStep[];
}

export const TraceabilityFlow: React.FC<TraceabilityFlowProps> = ({ steps }) => {
  const getStepIcon = (num: number) => {
    switch (num) {
      case 1: return <MapPin className="w-4 h-4 text-[#2563EB]" />;
      case 2: return <Maximize2 className="w-4 h-4 text-[#0F2747]" />;
      case 3: return <Layers className="w-4 h-4 text-[#2563EB]" />;
      case 4: return <Package className="w-4 h-4 text-[#D97706]" />;
      case 5: return <Cpu className="w-4 h-4 text-[#2563EB]" />;
      case 6: return <TrendingUp className="w-4 h-4 text-[#16A34A]" />;
      case 7: return <ShieldCheck className="w-4 h-4 text-[#2563EB]" />;
      default: return <Layers className="w-4 h-4 text-[#64748B]" />;
    }
  };

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 lg:p-7 shadow-xs space-y-5">
      <div className="border-b border-[#E2E8F0] pb-3">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 bg-[#EFF6FF] text-[#2563EB] text-[10px] font-mono font-bold uppercase tracking-wider rounded">
            Architectural Traceability
          </span>
          <span className="text-[10px] font-mono text-[#64748B] uppercase">
            End-to-End Lineage
          </span>
        </div>
        <h3 className="text-base font-bold text-[#0F172A] font-sans mt-1">
          Architectural Design → Cost Estimation Pipeline Trace
        </h3>
        <p className="text-xs text-[#64748B] mt-0.5">
          Step-by-step verification showing how architectural geometry directly drives the ML prediction.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {steps.map((step) => (
          <div
            key={`step-trace-${step.stepNumber}`}
            className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg flex flex-col justify-between hover:border-[#BFDBFE] transition-colors"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-[#2563EB] bg-white px-2 py-0.5 border border-[#E2E8F0] rounded">
                  STEP 0{step.stepNumber}
                </span>
                <div className="p-1 rounded bg-white border border-[#E2E8F0]">
                  {getStepIcon(step.stepNumber)}
                </div>
              </div>

              <h4 className="text-xs font-bold text-[#0F172A] mt-2 font-sans">
                {step.title}
              </h4>
              <p className="text-[11px] text-[#64748B] mt-1 leading-relaxed">
                {step.description}
              </p>
            </div>

            <div className="mt-3 pt-2.5 border-t border-[#E2E8F0]">
              <div className="text-[9px] uppercase font-mono text-[#94A3B8] font-bold">Derived Metric</div>
              <div className="text-xs font-bold font-mono text-[#0F172A] truncate mt-0.5">
                {step.valueDerived}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
