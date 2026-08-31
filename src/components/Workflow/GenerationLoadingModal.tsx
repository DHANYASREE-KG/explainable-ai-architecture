import React, { useEffect, useState } from 'react';
import { Sparkles, CheckCircle2, Loader2 } from 'lucide-react';

export type GenerationPhase = 'idle' | '2d' | '3d' | 'all';

export interface GenerationLoadingModalProps {
  isOpen: boolean;
  onComplete: () => void;
  targetMode?: '2d' | '3d' | 'all';
}

const PHASES_2D = [
  'Analyzing Plot Geometry & Setbacks...',
  'Calculating Buildable Footprint Area...',
  'Optimizing Room Adjacency & Zoning Graph...',
  'Running Architectural Constraint Validation...',
  'Drafting Deterministic 2D CAD Blueprint...',
  'Compiling Explainable AI Reasoning Matrix...',
];

const PHASES_3D = [
  'Generating Volumetric Room Enclosures...',
  'Constructing Partition Walls & Openings...',
  'Applying Realistic Textures & Finishes...',
  'Computing Daylight & Shadows Simulation...',
  'Building Interactive 3D Spatial Walkthrough...',
];

export const GenerationLoadingModal: React.FC<GenerationLoadingModalProps> = ({
  isOpen,
  onComplete,
  targetMode = '2d',
}) => {
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState<number>(0);
  const phases = targetMode === '3d' ? PHASES_3D : PHASES_2D;

  useEffect(() => {
    if (!isOpen) {
      setCurrentPhaseIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setCurrentPhaseIndex((prev) => {
        if (prev < phases.length - 1) {
          return prev + 1;
        } else {
          clearInterval(interval);
          setTimeout(() => {
            onComplete();
          }, 350);
          return prev;
        }
      });
    }, 450);

    return () => clearInterval(interval);
  }, [isOpen, phases, onComplete]);

  if (!isOpen) return null;

  const progressPercent = Math.round(((currentPhaseIndex + 1) / phases.length) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-xl max-w-md w-full p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#2563EB] flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#0F172A]">
              {targetMode === '3d' ? 'Generating 3D Spatial Model' : 'Synthesizing Architecture'}
            </h3>
            <p className="text-xs text-[#64748B]">
              Executing AI spatial algorithms and quality constraints
            </p>
          </div>
        </div>

        {/* Current Active Step */}
        <div className="bg-slate-50 border border-[#E2E8F0] rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-[#2563EB]">{phases[currentPhaseIndex]}</span>
            <span className="text-[#64748B] font-mono">{progressPercent}%</span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-[#2563EB] h-full transition-all duration-300 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Phase List */}
        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {phases.map((phase, idx) => {
            const isDone = idx < currentPhaseIndex;
            const isCurrent = idx === currentPhaseIndex;

            return (
              <div
                key={phase}
                className={`flex items-center gap-2.5 text-xs py-1 transition-opacity ${
                  isDone
                    ? 'text-[#16A34A] font-medium'
                    : isCurrent
                    ? 'text-[#0F172A] font-semibold'
                    : 'text-slate-400 opacity-60'
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A] shrink-0" />
                ) : isCurrent ? (
                  <Loader2 className="w-3.5 h-3.5 text-[#2563EB] animate-spin shrink-0" />
                ) : (
                  <div className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" />
                )}
                <span className="truncate">{phase}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
