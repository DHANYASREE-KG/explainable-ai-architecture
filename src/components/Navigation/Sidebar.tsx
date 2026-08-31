import React from 'react';
import {
  MapPin,
  Compass,
  Layers,
  PenTool,
  Sparkles,
  Grid3X3,
  Box,
  Calculator,
  X,
  Check,
  Lock,
  RotateCcw,
  Building2,
} from 'lucide-react';
import { FacingDirection, LandDetails } from '../../types';

export type NavTabId =
  | 'plot'
  | 'orientation'
  | 'program'
  | 'dimensions'
  | 'ai'
  | '2d'
  | '3d'
  | 'cost';

interface SidebarProps {
  activeTab: NavTabId;
  onSelectTab: (tab: NavTabId) => void;
  completedSteps: Record<NavTabId, boolean>;
  unlockedSteps: Record<NavTabId, boolean>;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onStartNewProject: () => void;
  land?: LandDetails;
  facingDirection?: FacingDirection;
  roomsCount?: number;
  isValid?: boolean;
}

interface NavItem {
  id: NavTabId;
  number: string;
  label: string;
  subtitle: string;
  icon: React.ReactNode;
}

export const Sidebar: React.FC<SidebarProps> = React.memo(({
  activeTab,
  onSelectTab,
  completedSteps,
  unlockedSteps,
  mobileOpen,
  onCloseMobile,
  onStartNewProject,
  land,
  facingDirection,
  roomsCount = 0,
  isValid = false,
}) => {
  const navItems: NavItem[] = [
    {
      id: 'plot',
      number: '01',
      label: 'Plot Dimensions',
      subtitle: 'Site Geometry & Area',
      icon: <MapPin className="w-4 h-4" />,
    },
    {
      id: 'orientation',
      number: '02',
      label: 'Orientation',
      subtitle: 'Sun Path & Road Access',
      icon: <Compass className="w-4 h-4" />,
    },
    {
      id: 'program',
      number: '03',
      label: 'Space Programming',
      subtitle: 'Room Requirements',
      icon: <Layers className="w-4 h-4" />,
    },
    {
      id: 'dimensions',
      number: '04',
      label: 'Room Dimensions',
      subtitle: 'Proportions & Scale',
      icon: <PenTool className="w-4 h-4" />,
    },
    {
      id: 'ai',
      number: '05',
      label: 'AI Optimization',
      subtitle: 'Spatial Efficiency',
      icon: <Sparkles className="w-4 h-4" />,
    },
    {
      id: '2d',
      number: '06',
      label: '2D Architectural Blueprint',
      subtitle: 'Floor Plan & Corridors',
      icon: <Grid3X3 className="w-4 h-4" />,
    },
    {
      id: '3d',
      number: '07',
      label: '3D House Design',
      subtitle: 'Volumetric Visualization',
      icon: <Box className="w-4 h-4" />,
    },
    {
      id: 'cost',
      number: '08',
      label: 'Construction Cost',
      subtitle: 'XGBoost AI Estimation',
      icon: <Calculator className="w-4 h-4" />,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#0F172A]/40 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-72 bg-[#FFFFFF] border-r border-[#E2E8F0] flex flex-col transition-transform duration-200 ease-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-5 border-b border-[#E2E8F0] flex items-center justify-between shrink-0 bg-[#FFFFFF]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#0F172A] text-white flex items-center justify-center shadow-xs">
              <Building2 className="w-5 h-5 text-[#38BDF8]" />
            </div>
            <div>
              <div className="text-[#0F172A] font-bold tracking-tight text-sm flex items-center gap-1.5">
                AI ARCHITECT
              </div>
              <div className="text-[10px] uppercase tracking-wider font-mono text-[#64748B]">
                Spatial Design Suite
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Workflow Title & Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3.5 py-5 space-y-1.5">
          <div className="px-2.5 pb-2.5 text-[11px] font-semibold uppercase tracking-wider text-[#64748B] font-mono">
            Design Process
          </div>

          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            const isUnlocked = unlockedSteps[item.id];
            const isCompleted = completedSteps[item.id];

            return (
              <button
                key={item.id}
                type="button"
                disabled={!isUnlocked}
                onClick={() => {
                  if (isUnlocked) {
                    onSelectTab(item.id);
                    onCloseMobile();
                  }
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left group relative ${
                  isActive
                    ? 'bg-[#EFF6FF] text-[#2563EB] shadow-xs'
                    : !isUnlocked
                    ? 'text-[#94A3B8] cursor-not-allowed opacity-70'
                    : 'text-[#0F172A] hover:bg-[#F8FAFC] cursor-pointer'
                }`}
              >
                {/* Active Left Indicator */}
                {isActive && (
                  <div className="absolute left-0 top-2 bottom-2 w-1 bg-[#2563EB] rounded-r-full" />
                )}

                {/* State Badge / Icon */}
                <div
                  className={`flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-lg text-xs font-mono transition-colors ${
                    isCompleted && !isActive
                      ? 'bg-[#F0FDF4] text-[#16A34A] border border-[#DCFCE7]'
                      : isActive
                      ? 'bg-[#2563EB] text-white'
                      : !isUnlocked
                      ? 'bg-[#F1F5F9] text-[#94A3B8] border border-[#E2E8F0]'
                      : 'bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0] group-hover:border-[#CBD5E1]'
                  }`}
                >
                  {isCompleted && !isActive ? (
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  ) : !isUnlocked ? (
                    <Lock className="w-3 h-3" />
                  ) : (
                    <span>{item.number}</span>
                  )}
                </div>

                {/* Title & Subtitle */}
                <div className="flex flex-col flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span
                      className={`truncate text-[13px] ${
                        isActive
                          ? 'font-semibold text-[#1E40AF]'
                          : isCompleted
                          ? 'font-medium text-[#0F172A]'
                          : !isUnlocked
                          ? 'text-[#94A3B8]'
                          : 'text-[#334155]'
                      }`}
                    >
                      {item.label}
                    </span>
                  </div>
                  <span
                    className={`text-[11px] truncate leading-tight ${
                      isActive ? 'text-[#3B82F6]' : 'text-[#94A3B8]'
                    }`}
                  >
                    {item.subtitle}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Compact Project Summary Card & New Project Action */}
        <div className="p-3.5 border-t border-[#E2E8F0] bg-[#F8FAFC] shrink-0 space-y-2.5">
          {land && (
            <div className="bg-[#FFFFFF] p-3 rounded-lg border border-[#E2E8F0] text-xs space-y-1.5">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B] font-mono flex items-center justify-between">
                <span>Active Project</span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                    isValid
                      ? 'bg-[#F0FDF4] text-[#16A34A]'
                      : 'bg-[#FFFBEB] text-[#D97706]'
                  }`}
                >
                  {isValid ? 'VALID' : 'DRAFT'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1 text-[11px] text-[#475569] font-mono">
                <div>
                  Plot:{' '}
                  <span className="text-[#0F172A] font-semibold">
                    {land.length}×{land.breadth}ft
                  </span>
                </div>
                <div>
                  Facing:{' '}
                  <span className="text-[#0F172A] font-semibold">
                    {facingDirection || 'North'}
                  </span>
                </div>
                <div>
                  Area:{' '}
                  <span className="text-[#0F172A] font-semibold">
                    {land.totalArea || land.length * land.breadth} sq.ft
                  </span>
                </div>
                <div>
                  Rooms:{' '}
                  <span className="text-[#0F172A] font-semibold">
                    {roomsCount}
                  </span>
                </div>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={onStartNewProject}
            className="w-full py-2 px-3 bg-[#FFFFFF] border border-[#E2E8F0] hover:border-[#CBD5E1] hover:bg-[#F8FAFC] text-[#475569] hover:text-[#0F172A] text-xs font-medium rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-2xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Start New Design</span>
          </button>
        </div>
      </aside>
    </>
  );
});


