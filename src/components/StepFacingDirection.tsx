import React from 'react';
import { FacingDirection } from '../types';
import {
  Compass,
  ArrowRight,
  ArrowLeft,
  Sun,
  Wind,
  Sunrise,
  Sunset,
  Check,
  Sparkles,
} from 'lucide-react';

interface StepFacingDirectionProps {
  facingDirection: FacingDirection;
  onChangeFacingDirection: (direction: FacingDirection) => void;
  onNext: () => void;
  onBack?: () => void;
}

export const StepFacingDirection: React.FC<StepFacingDirectionProps> = ({
  facingDirection,
  onChangeFacingDirection,
  onNext,
  onBack,
}) => {
  const directions: {
    key: FacingDirection;
    label: string;
    solarTag: string;
    daylightSummary: string;
    description: string;
    recommendedRooms: string;
    icon: React.ReactNode;
    colorClass: string;
  }[] = [
    {
      key: 'North',
      label: 'North Facing',
      solarTag: 'DIFFUSE LIGHT',
      daylightSummary: 'Consistent, Glare-Free Ambient Light',
      description:
        'Provides stable indirect daylight without intense thermal gain. Excellent for workspaces, living spaces, and creative studios.',
      recommendedRooms: 'Living Lounge, Study / Office, Balcony, Main Entry',
      icon: <Wind className="w-5 h-5" />,
      colorClass: 'text-[#2563EB] bg-[#EFF6FF] border-[#DBEAFE]',
    },
    {
      key: 'East',
      label: 'East Facing',
      solarTag: 'MORNING SUN',
      daylightSummary: 'Vibrant Sunrise & Cooler Afternoons',
      description:
        'Captures energizing morning light with minimal late-afternoon heat. Ideal for bedrooms, breakfast dining, and sacred spaces.',
      recommendedRooms: 'Master Bedrooms, Kitchen & Dining, Entrance Foyer, Meditation',
      icon: <Sunrise className="w-5 h-5" />,
      colorClass: 'text-[#D97706] bg-[#FFFBEB] border-[#FEF3C7]',
    },
    {
      key: 'South',
      label: 'South Facing',
      solarTag: 'HIGH SOLAR INGRESS',
      daylightSummary: 'Maximum Sun & Solar Energy Yield',
      description:
        'Receives prolonged solar exposure throughout the day. Perfect for solar PV arrays, winter thermal comfort, and bright social hubs.',
      recommendedRooms: 'Family Living, Courtyard, Solar Terrace, Utility',
      icon: <Sun className="w-5 h-5" />,
      colorClass: 'text-[#EA580C] bg-[#FFF7ED] border-[#FFEDD5]',
    },
    {
      key: 'West',
      label: 'West Facing',
      solarTag: 'WARM AFTERNOONS',
      daylightSummary: 'Golden Hour & Evening Warmth',
      description:
        'Experiences afternoon thermal peaks. Best positioned with service zones, circulation buffers, and architectural shading fins.',
      recommendedRooms: 'Garage / Parking, Stairwell, Storage, Utility, Dining',
      icon: <Sunset className="w-5 h-5" />,
      colorClass: 'text-[#7C3AED] bg-[#F5F3FF] border-[#DDD6FE]',
    },
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-4">
      {/* Global Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-6 border-b border-[#E2E8F0]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#2563EB] bg-[#EFF6FF] px-2.5 py-0.5 rounded-md border border-[#DBEAFE]">
              02 • SOLAR & MICROCLIMATE
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#0F172A] tracking-tight">
            Orientation & Facing
          </h2>
          <p className="text-sm text-[#64748B] mt-1 max-w-2xl">
            Select the primary road access and frontage to compute passive daylighting, wind flow, and room zoning.
          </p>
        </div>

        {/* Orientation Compass Visual Badge */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[#FFFFFF] rounded-xl border border-[#E2E8F0] shadow-2xs">
          <Compass className="w-5 h-5 text-[#2563EB] animate-spin-slow" />
          <div className="text-xs font-mono">
            <span className="text-[#64748B]">Active: </span>
            <span className="font-bold text-[#0F172A]">{facingDirection.toUpperCase()}</span>
          </div>
        </div>
      </div>

      {/* 4 Cardinal Directions Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {directions.map((dir) => {
          const isSelected = facingDirection === dir.key;

          return (
            <div
              key={dir.key}
              onClick={() => onChangeFacingDirection(dir.key)}
              className={`p-6 rounded-xl border transition-all cursor-pointer flex flex-col justify-between relative shadow-xs ${
                isSelected
                  ? 'bg-[#EFF6FF]/60 border-[#2563EB] ring-2 ring-[#2563EB]/20'
                  : 'bg-[#FFFFFF] border-[#E2E8F0] hover:border-[#CBD5E1] hover:bg-[#F8FAFC]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center border ${dir.colorClass}`}
                    >
                      {dir.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-[#0F172A]">
                          {dir.label}
                        </h3>
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#F1F5F9] text-[#475569]">
                          {dir.solarTag}
                        </span>
                      </div>
                      <span className="text-xs text-[#64748B] font-medium block mt-0.5">
                        {dir.daylightSummary}
                      </span>
                    </div>
                  </div>

                  <div
                    className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors shrink-0 ${
                      isSelected
                        ? 'border-[#2563EB] bg-[#2563EB] text-white'
                        : 'border-[#CBD5E1] bg-white'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-[#475569] leading-relaxed mb-5">
                  {dir.description}
                </p>
              </div>

              <div className="pt-3.5 border-t border-[#E2E8F0] text-xs text-[#64748B] flex items-start gap-1.5">
                <span className="font-bold text-[#0F172A] font-mono text-[11px] uppercase tracking-wider shrink-0">
                  Recommended:
                </span>
                <span className="text-[#334155]">{dir.recommendedRooms}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Process Navigation Bar */}
      <div className="pt-6 border-t border-[#E2E8F0] flex items-center justify-between">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="btn-outline"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
        ) : (
          <div />
        )}

        <button
          type="button"
          onClick={onNext}
          className="btn-primary"
        >
          <span>Continue to Space Programming</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

