import React from 'react';
import { BasicRequirementsConfig } from '../types';
import {
  ArrowRight,
  ArrowLeft,
  Plus,
  Minus,
  Check,
  Layers,
  Bed,
  UtensilsCrossed,
  Bath,
  Car,
  Trees,
  Sun,
  Laptop,
  BookOpen,
  Boxes,
  WashingMachine,
  Wrench,
  Footprints,
  Sofa,
  Sparkles,
  Home,
} from 'lucide-react';

interface StepHousingRequirementsProps {
  config: BasicRequirementsConfig;
  onChangeConfig: (config: BasicRequirementsConfig) => void;
  onNext: () => void;
  onBack?: () => void;
}

export const StepHousingRequirements: React.FC<StepHousingRequirementsProps> = ({
  config,
  onChangeConfig,
  onNext,
  onBack,
}) => {
  const updateCount = (key: keyof BasicRequirementsConfig, delta: number) => {
    const current = config[key] as number;
    const val = Math.max(0, Math.min(10, current + delta));
    onChangeConfig({ ...config, [key]: val });
  };

  const toggleBool = (key: keyof BasicRequirementsConfig) => {
    onChangeConfig({ ...config, [key]: !config[key] });
  };

  const toggleOptional = (key: keyof BasicRequirementsConfig['optionalRooms']) => {
    onChangeConfig({
      ...config,
      optionalRooms: {
        ...config.optionalRooms,
        [key]: !config.optionalRooms[key],
      },
    });
  };

  const applyProgramPreset = (preset: '2bhk' | '3bhk' | '4bhk_duplex') => {
    if (preset === '2bhk') {
      onChangeConfig({
        ...config,
        halls: 1,
        diningRooms: 1,
        bedrooms: 2,
        kitchens: 1,
        bathrooms: 1,
        attachedBathrooms: 1,
        hasParking: true,
        hasBalcony: true,
        hasGarden: false,
        hasStaircase: false,
        optionalRooms: {
          studyRoom: false,
          prayerRoom: true,
          guestRoom: false,
          storeRoom: false,
          homeOffice: false,
          utilityRoom: true,
          laundryRoom: false,
        },
      });
    } else if (preset === '3bhk') {
      onChangeConfig({
        ...config,
        halls: 1,
        diningRooms: 1,
        bedrooms: 3,
        kitchens: 1,
        bathrooms: 1,
        attachedBathrooms: 2,
        hasParking: true,
        hasBalcony: true,
        hasGarden: true,
        hasStaircase: true,
        optionalRooms: {
          studyRoom: true,
          prayerRoom: true,
          guestRoom: false,
          storeRoom: true,
          homeOffice: false,
          utilityRoom: true,
          laundryRoom: false,
        },
      });
    } else if (preset === '4bhk_duplex') {
      onChangeConfig({
        ...config,
        halls: 1,
        diningRooms: 1,
        bedrooms: 4,
        kitchens: 1,
        bathrooms: 2,
        attachedBathrooms: 3,
        hasParking: true,
        hasBalcony: true,
        hasGarden: true,
        hasStaircase: true,
        optionalRooms: {
          studyRoom: true,
          prayerRoom: true,
          guestRoom: true,
          storeRoom: true,
          homeOffice: true,
          utilityRoom: true,
          laundryRoom: true,
        },
      });
    }
  };

  const countControls: {
    key: keyof BasicRequirementsConfig;
    label: string;
    desc: string;
    icon: React.ReactNode;
  }[] = [
    {
      key: 'halls',
      label: 'Living Room',
      desc: 'Main family reception & lounge',
      icon: <Sofa className="w-5 h-5" />,
    },
    {
      key: 'diningRooms',
      label: 'Dining Room',
      desc: 'Dedicated meal space & buffet',
      icon: <UtensilsCrossed className="w-5 h-5" />,
    },
    {
      key: 'bedrooms',
      label: 'Bedrooms',
      desc: 'Private master & secondary suites',
      icon: <Bed className="w-5 h-5" />,
    },
    {
      key: 'kitchens',
      label: 'Kitchen',
      desc: 'Culinary preparation & pantry zone',
      icon: <UtensilsCrossed className="w-5 h-5" />,
    },
    {
      key: 'bathrooms',
      label: 'Common Bath',
      desc: 'Powder room & guest sanitary',
      icon: <Bath className="w-5 h-5" />,
    },
    {
      key: 'attachedBathrooms',
      label: 'Attached Bath',
      desc: 'En-suite private bathrooms',
      icon: <Bath className="w-5 h-5" />,
    },
  ];

  const amenityToggles: {
    key: keyof BasicRequirementsConfig;
    label: string;
    desc: string;
    icon: React.ReactNode;
  }[] = [
    {
      key: 'hasParking',
      label: 'Covered Parking',
      desc: 'Dedicated driveway bay for car / 2W',
      icon: <Car className="w-5 h-5" />,
    },
    {
      key: 'hasGarden',
      label: 'Landscaped Garden',
      desc: 'Front/rear green setback lawn',
      icon: <Trees className="w-5 h-5" />,
    },
    {
      key: 'hasBalcony',
      label: 'Balcony / Sit-out',
      desc: 'Open-air ventilation terrace',
      icon: <Sun className="w-5 h-5" />,
    },
    {
      key: 'hasStaircase',
      label: 'Staircase Core',
      desc: 'Vertical circulation to upper levels',
      icon: <Footprints className="w-5 h-5" />,
    },
  ];

  const optionalRoomToggles: {
    key: keyof BasicRequirementsConfig['optionalRooms'];
    label: string;
    desc: string;
    icon: React.ReactNode;
  }[] = [
    {
      key: 'prayerRoom',
      label: 'Prayer Sanctuary',
      desc: 'Quiet meditation space',
      icon: <Sparkles className="w-4 h-4" />,
    },
    {
      key: 'studyRoom',
      label: 'Study Room',
      desc: 'Quiet reading & library',
      icon: <BookOpen className="w-4 h-4" />,
    },
    {
      key: 'homeOffice',
      label: 'Home Office',
      desc: 'Professional work station',
      icon: <Laptop className="w-4 h-4" />,
    },
    {
      key: 'guestRoom',
      label: 'Guest Bedroom',
      desc: 'Additional visitor suite',
      icon: <Bed className="w-4 h-4" />,
    },
    {
      key: 'storeRoom',
      label: 'Store Room',
      desc: 'Secured household storage',
      icon: <Boxes className="w-4 h-4" />,
    },
    {
      key: 'utilityRoom',
      label: 'Utility Yard',
      desc: 'Kitchen wash & service deck',
      icon: <Wrench className="w-4 h-4" />,
    },
    {
      key: 'laundryRoom',
      label: 'Laundry Room',
      desc: 'Washing & ironing station',
      icon: <WashingMachine className="w-4 h-4" />,
    },
  ];

  // Calculate total room items
  const totalRooms =
    (config.halls || 0) +
    (config.diningRooms || 0) +
    (config.bedrooms || 0) +
    (config.kitchens || 0) +
    (config.bathrooms || 0) +
    (config.attachedBathrooms || 0) +
    Object.values(config.optionalRooms).filter(Boolean).length;

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-4">
      {/* Global Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-6 border-b border-[#E2E8F0]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#2563EB] bg-[#EFF6FF] px-2.5 py-0.5 rounded-md border border-[#DBEAFE]">
              03 • PROGRAMMING
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#0F172A] tracking-tight">
            Space Programming
          </h2>
          <p className="text-sm text-[#64748B] mt-1 max-w-2xl">
            Select room requirements, amenities, and specialized zones for your floor plan.
          </p>
        </div>

        {/* Total Space Count Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#FFFFFF] rounded-xl border border-[#E2E8F0] shadow-2xs shrink-0">
          <Layers className="w-4 h-4 text-[#2563EB]" />
          <span className="text-xs font-mono font-bold text-[#0F172A]">
            {totalRooms} Total Spaces
          </span>
        </div>
      </div>

      {/* Program Presets */}
      <div className="flex flex-wrap items-center gap-2.5 bg-[#FFFFFF] p-3.5 rounded-xl border border-[#E2E8F0] shadow-2xs">
        <span className="text-xs font-bold uppercase tracking-wider font-mono text-[#64748B] mr-2">
          Templates:
        </span>
        <button
          type="button"
          onClick={() => applyProgramPreset('2bhk')}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] hover:border-[#2563EB] hover:bg-[#EFF6FF] text-[#334155] transition-colors cursor-pointer"
        >
          2BHK Compact
        </button>
        <button
          type="button"
          onClick={() => applyProgramPreset('3bhk')}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-[#2563EB] bg-[#EFF6FF] text-[#1D4ED8] font-bold transition-colors cursor-pointer shadow-2xs"
        >
          3BHK Standard
        </button>
        <button
          type="button"
          onClick={() => applyProgramPreset('4bhk_duplex')}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] hover:border-[#2563EB] hover:bg-[#EFF6FF] text-[#334155] transition-colors cursor-pointer"
        >
          4BHK Luxury Duplex
        </button>
      </div>

      <div className="space-y-8">
        {/* 1. Primary Room Counts */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider font-mono">
            1. Core Living Volumes
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {countControls.map((item) => {
              const count = config[item.key] as number;
              return (
                <div
                  key={item.key}
                  className="p-4 rounded-xl border border-[#E2E8F0] bg-[#FFFFFF] flex items-center justify-between gap-4 hover:border-[#CBD5E1] transition-all shadow-xs"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-[#EFF6FF] text-[#2563EB] border border-[#DBEAFE]">
                      {item.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-[#0F172A] truncate">
                        {item.label}
                      </div>
                      <div className="text-xs text-[#64748B] truncate mt-0.5">
                        {item.desc}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 bg-[#F8FAFC] p-1 rounded-lg border border-[#E2E8F0]">
                    <button
                      type="button"
                      onClick={() => updateCount(item.key, -1)}
                      disabled={count === 0}
                      className="w-7 h-7 flex items-center justify-center rounded bg-[#FFFFFF] border border-[#E2E8F0] text-[#0F172A] hover:bg-[#F1F5F9] disabled:opacity-30 cursor-pointer transition-colors"
                      aria-label={`Decrease ${item.label}`}
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-6 text-center font-mono text-sm font-bold text-[#0F172A]">
                      {count}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateCount(item.key, 1)}
                      disabled={count >= 10}
                      className="w-7 h-7 flex items-center justify-center rounded bg-[#FFFFFF] border border-[#E2E8F0] text-[#0F172A] hover:bg-[#F1F5F9] disabled:opacity-30 cursor-pointer transition-colors"
                      aria-label={`Increase ${item.label}`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Structural & Exterior Features */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider font-mono">
            2. Cores & Exterior Amenities
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {amenityToggles.map((amenity) => {
              const active = config[amenity.key] as boolean;
              return (
                <button
                  key={amenity.key}
                  type="button"
                  onClick={() => toggleBool(amenity.key)}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-4 shadow-xs ${
                    active
                      ? 'bg-[#EFF6FF]/60 border-[#2563EB] ring-1 ring-[#2563EB]'
                      : 'bg-[#FFFFFF] border-[#E2E8F0] hover:border-[#CBD5E1] hover:bg-[#F8FAFC]'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border ${
                        active
                          ? 'bg-[#2563EB] text-white border-[#2563EB]'
                          : 'bg-[#F1F5F9] text-[#64748B] border-[#E2E8F0]'
                      }`}
                    >
                      {amenity.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-[#0F172A] truncate">
                        {amenity.label}
                      </div>
                      <div className="text-xs text-[#64748B] truncate mt-0.5">
                        {amenity.desc}
                      </div>
                    </div>
                  </div>

                  <div
                    className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                      active
                        ? 'border-[#2563EB] bg-[#2563EB] text-white'
                        : 'border-[#CBD5E1] bg-white'
                    }`}
                  >
                    {active && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Optional Specialized Rooms */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider font-mono">
            3. Specialized Functional Zones
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {optionalRoomToggles.map((opt) => {
              const active = config.optionalRooms[opt.key];
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => toggleOptional(opt.key)}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 shadow-2xs ${
                    active
                      ? 'bg-[#EFF6FF]/60 border-[#2563EB] ring-1 ring-[#2563EB]'
                      : 'bg-[#FFFFFF] border-[#E2E8F0] hover:border-[#CBD5E1] hover:bg-[#F8FAFC]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                        active
                          ? 'bg-[#2563EB] text-white border-[#2563EB]'
                          : 'bg-[#F1F5F9] text-[#64748B] border-[#E2E8F0]'
                      }`}
                    >
                      {opt.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-[#0F172A] truncate">
                        {opt.label}
                      </div>
                      <div className="text-[11px] text-[#64748B] truncate">
                        {opt.desc}
                      </div>
                    </div>
                  </div>

                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                      active
                        ? 'border-[#2563EB] bg-[#2563EB] text-white'
                        : 'border-[#CBD5E1] bg-white'
                    }`}
                  >
                    {active && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
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
          <span>Continue to Room Sizing</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

