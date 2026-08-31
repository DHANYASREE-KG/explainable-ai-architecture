import React from 'react';
import {
  MapPin,
  Compass,
  Layers,
  Sparkles,
  Grid,
  Home,
  Check,
  Building2,
  X,
  ChevronRight,
  Sliders,
} from 'lucide-react';
import { FacingDirection, LandDetails, RoomRequirement } from '../types';

interface StepperProps {
  currentStep: number;
  onSelectStep: (step: number) => void;
  land: LandDetails;
  facingDirection: FacingDirection;
  rooms: RoomRequirement[];
  isValid: boolean;
  has2D: boolean;
  has3D: boolean;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

interface StepItem {
  id: number;
  code: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
}

export const Stepper: React.FC<StepperProps> = ({
  currentStep,
  onSelectStep,
  land,
  facingDirection,
  rooms,
  isValid,
  has2D,
  has3D,
  mobileOpen = false,
  onCloseMobile,
}) => {
  const isLandCompleted = land.length > 0 && land.breadth > 0 && land.totalArea > 0;
  const isFacingCompleted = Boolean(facingDirection);
  const isRoomsSelected = rooms.length > 0;
  const isDimensionsSet = isRoomsSelected && rooms.every((r) => r.length > 0 && r.breadth > 0);

  const steps: StepItem[] = [
    {
      id: 1,
      code: '01',
      title: 'Plot Details',
      subtitle: isLandCompleted ? `${land.length} × ${land.breadth} ft (${land.totalArea} sq.ft)` : 'Plot boundary & area',
      icon: <MapPin className="w-4 h-4" />,
    },
    {
      id: 2,
      code: '02',
      title: 'Facing Direction',
      subtitle: isFacingCompleted ? `${facingDirection} Facing` : 'Road & access orientation',
      icon: <Compass className="w-4 h-4" />,
    },
    {
      id: 3,
      code: '03',
      title: 'Room Program',
      subtitle: isRoomsSelected ? `${rooms.length} spaces chosen` : 'Select living spaces',
      icon: <Layers className="w-4 h-4" />,
    },
    {
      id: 4,
      code: '04',
      title: 'Dimensions & Scale',
      subtitle: isDimensionsSet ? (isValid ? 'Dimensions balanced' : 'Adjust room sizing') : 'Room dimensions (L × B)',
      icon: <Sliders className="w-4 h-4" />,
    },
    {
      id: 5,
      code: '05',
      title: 'AI Optimization',
      subtitle: 'Spatial balance & zoning',
      icon: <Sparkles className="w-4 h-4" />,
    },
    {
      id: 6,
      code: '06',
      title: '2D CAD Blueprint',
      subtitle: has2D ? 'Floor plan & Explainable AI' : 'Architectural CAD drafting',
      icon: <Grid className="w-4 h-4" />,
    },
    {
      id: 7,
      code: '07',
      title: '3D Spatial Model',
      subtitle: has3D ? 'Interactive 3D walkthrough' : '3D elevation & tour',
      icon: <Home className="w-4 h-4" />,
    },
  ];

  const isStepCompleted = (stepId: number): boolean => {
    if (!isLandCompleted) return false;

    switch (stepId) {
      case 1:
        return isLandCompleted;
      case 2:
        return isLandCompleted && isFacingCompleted && (currentStep > 2 || has2D || has3D);
      case 3:
        return isLandCompleted && isRoomsSelected && (currentStep > 3 || has2D || has3D);
      case 4:
        return isLandCompleted && isDimensionsSet && (currentStep > 4 || has2D || has3D);
      case 5:
        return isLandCompleted && isValid && (currentStep > 5 || has2D || has3D);
      case 6:
        return has2D;
      case 7:
        return has3D;
      default:
        return false;
    }
  };

  const isStepUnlocked = (stepId: number): boolean => {
    if (stepId === 1) return true;
    if (stepId === 2) return isLandCompleted;
    if (stepId === 3) return isLandCompleted;
    if (stepId === 4) return isLandCompleted && isRoomsSelected;
    if (stepId === 5) return isLandCompleted && isRoomsSelected;
    if (stepId === 6) return isLandCompleted && isRoomsSelected && isValid;
    if (stepId === 7) return has2D;
    return false;
  };

  // Real Progress Calculation
  let realProgress = 0;
  if (!isLandCompleted) {
    realProgress = 0;
  } else if (has3D) {
    realProgress = 100;
  } else if (has2D) {
    realProgress = 90;
  } else if (isValid) {
    realProgress = 75;
  } else if (isDimensionsSet) {
    realProgress = 50;
  } else if (isRoomsSelected) {
    realProgress = 35;
  } else if (isFacingCompleted) {
    realProgress = 25;
  } else {
    realProgress = 15;
  }

  const sidebarContent = (
    <aside className="w-72 bg-white border-r border-slate-200 flex flex-col h-full select-none">
      {/* Platform Branding Header */}
      <div className="h-14 px-5 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#0F172A] text-white flex items-center justify-center font-semibold text-xs shadow-xs shrink-0">
            <Building2 className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-xs font-bold text-[#0F172A] tracking-wider uppercase font-mono">
                AI ARCHITECT
              </h1>
              <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-1 py-0.2 rounded font-mono">
                SaaS
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium leading-none mt-0.5">
              Automated Planning Suite
            </p>
          </div>
        </div>

        {mobileOpen && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Real Progress Indicator */}
      <div className="px-5 py-3 border-b border-slate-200 bg-[#F8FAFC] shrink-0">
        <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
          <span className="text-slate-600 text-xs">
            Progress: <strong className="text-[#0F172A] font-mono">{realProgress}%</strong>
          </span>
          <span className="text-[11px] text-slate-500 font-mono">
            Stage {currentStep}/7
          </span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-[#2563EB] h-full rounded-full transition-all duration-300 ease-out"
            style={{ width: `${realProgress}%` }}
          />
        </div>
      </div>

      {/* Step Navigation List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
          Design Workflow
        </div>

        {steps.map((step) => {
          const isCurrent = currentStep === step.id;
          const completed = isStepCompleted(step.id);
          const unlocked = isStepUnlocked(step.id);

          return (
            <button
              key={step.id}
              type="button"
              onClick={() => {
                if (unlocked) {
                  onSelectStep(step.id);
                  onCloseMobile?.();
                }
              }}
              disabled={!unlocked}
              className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-3 transition-colors relative cursor-pointer border ${
                isCurrent
                  ? 'bg-blue-50/70 border-blue-500/80 text-[#0F172A] shadow-xs'
                  : completed
                  ? 'bg-white border-transparent text-slate-800 hover:bg-slate-50 hover:border-slate-200'
                  : unlocked
                  ? 'bg-white border-transparent text-slate-700 hover:bg-slate-50 hover:border-slate-200'
                  : 'bg-transparent border-transparent text-slate-400 opacity-60 cursor-not-allowed'
              }`}
            >
              {/* Step Numeral / Status Icon */}
              <div
                className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 text-xs transition-colors ${
                  isCurrent
                    ? 'bg-[#0F172A] text-white font-bold shadow-xs'
                    : completed
                    ? 'bg-emerald-100 text-emerald-800 font-bold'
                    : unlocked
                    ? 'bg-slate-100 text-slate-700 border border-slate-200 font-medium'
                    : 'bg-slate-100 text-slate-400 font-medium'
                }`}
              >
                {completed && !isCurrent ? (
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                ) : (
                  <span className="text-[10px] font-mono font-semibold">{step.code}</span>
                )}
              </div>

              {/* Title & Subtitle */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className={`text-xs truncate ${isCurrent ? 'font-bold text-[#0F172A]' : 'font-medium text-slate-800'}`}>
                    {step.title}
                  </span>
                </div>
                <p className="text-[11px] truncate text-slate-500 leading-tight mt-0.5">
                  {step.subtitle}
                </p>
              </div>

              {isCurrent && (
                <ChevronRight className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-200 bg-[#F8FAFC] text-[11px] text-slate-500 flex items-center justify-between shrink-0">
        <span className="font-mono text-[10px] text-slate-500">v2.6 Enterprise</span>
        <span className="flex items-center gap-1.5 text-slate-600 text-[11px]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Engine Online
        </span>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <div className="hidden lg:block h-screen sticky top-0 shrink-0">
        {sidebarContent}
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white shadow-xl">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};

