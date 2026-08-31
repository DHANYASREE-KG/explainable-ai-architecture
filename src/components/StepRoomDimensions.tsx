import React, { useState } from 'react';
import {
  FacingDirection,
  LandDetails,
  RoomRequirement,
  ScaleSize,
  ValidationResult,
} from '../types';
import {
  ArrowRight,
  ArrowLeft,
  Layers,
  Ruler,
  CheckCircle2,
  AlertCircle,
  Check,
  Sofa,
  UtensilsCrossed,
  Bed,
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
  Sparkles,
} from 'lucide-react';
import { calculateRoomArea } from '../services/areaCalculator';

interface StepRoomDimensionsProps {
  land: LandDetails;
  facingDirection: FacingDirection;
  rooms: RoomRequirement[];
  scaleSize?: ScaleSize;
  isValid: boolean;
  validationResult: ValidationResult;
  onChangeRoomDimension: (id: string, length: number, breadth: number) => void;
  onRenameRoom?: (id: string, newName: string) => void;
  onApplyPreset: (presetType: ScaleSize) => void;
  onValidateAndContinue: () => void;
  onGenerate2D: () => void;
  onBack: () => void;
}

function getRoomIcon(name: string): React.ReactNode {
  const lower = name.toLowerCase();
  if (lower.includes('living') || lower.includes('hall'))
    return <Sofa className="w-4 h-4 text-[#2563EB]" />;
  if (lower.includes('dining'))
    return <UtensilsCrossed className="w-4 h-4 text-[#2563EB]" />;
  if (lower.includes('bed'))
    return <Bed className="w-4 h-4 text-[#2563EB]" />;
  if (lower.includes('kitchen'))
    return <UtensilsCrossed className="w-4 h-4 text-[#2563EB]" />;
  if (lower.includes('bath') || lower.includes('toilet'))
    return <Bath className="w-4 h-4 text-[#2563EB]" />;
  if (lower.includes('park') || lower.includes('car'))
    return <Car className="w-4 h-4 text-[#2563EB]" />;
  if (lower.includes('garden') || lower.includes('lawn'))
    return <Trees className="w-4 h-4 text-[#2563EB]" />;
  if (lower.includes('balcony') || lower.includes('terrace'))
    return <Sun className="w-4 h-4 text-[#2563EB]" />;
  if (lower.includes('stair'))
    return <Footprints className="w-4 h-4 text-[#2563EB]" />;
  if (lower.includes('pooja') || lower.includes('prayer'))
    return <Sparkles className="w-4 h-4 text-[#2563EB]" />;
  if (lower.includes('study'))
    return <BookOpen className="w-4 h-4 text-[#2563EB]" />;
  if (lower.includes('office'))
    return <Laptop className="w-4 h-4 text-[#2563EB]" />;
  if (lower.includes('store'))
    return <Boxes className="w-4 h-4 text-[#2563EB]" />;
  if (lower.includes('util'))
    return <Wrench className="w-4 h-4 text-[#2563EB]" />;
  if (lower.includes('laundry'))
    return <WashingMachine className="w-4 h-4 text-[#2563EB]" />;
  return <Layers className="w-4 h-4 text-[#2563EB]" />;
}

export const StepRoomDimensions: React.FC<StepRoomDimensionsProps> = ({
  land,
  rooms,
  scaleSize = 'standard',
  validationResult,
  onChangeRoomDimension,
  onRenameRoom,
  onApplyPreset,
  onValidateAndContinue,
  onBack,
}) => {
  const [activeFilter, setActiveFilter] = useState<
    'all' | 'living' | 'private' | 'service' | 'outdoor'
  >('all');

  const getSectionKey = (
    r: RoomRequirement
  ): 'living' | 'private' | 'service' | 'structural' | 'outdoor' => {
    const name = r.name.toLowerCase();
    if (name.includes('staircase')) return 'structural';
    if (
      name.includes('parking') ||
      name.includes('garden') ||
      name.includes('balcony')
    )
      return 'outdoor';
    if (
      name.includes('hall') ||
      name.includes('living') ||
      name.includes('dining')
    )
      return 'living';
    if (
      name.includes('bedroom') ||
      name.includes('guest') ||
      name.includes('study') ||
      name.includes('office') ||
      name.includes('pooja') ||
      name.includes('prayer')
    )
      return 'private';
    return 'service';
  };

  const sections = [
    {
      key: 'living',
      title: 'Living & Social Spaces',
      rooms: rooms.filter((r) => getSectionKey(r) === 'living'),
    },
    {
      key: 'private',
      title: 'Bedrooms & Study Areas',
      rooms: rooms.filter((r) => getSectionKey(r) === 'private'),
    },
    {
      key: 'service',
      title: 'Kitchen & Bathrooms',
      rooms: rooms.filter((r) => getSectionKey(r) === 'service'),
    },
    {
      key: 'structural',
      title: 'Circulation & Staircase',
      rooms: rooms.filter((r) => getSectionKey(r) === 'structural'),
    },
    {
      key: 'outdoor',
      title: 'Outdoor & Parking Amenities',
      rooms: rooms.filter((r) => getSectionKey(r) === 'outdoor'),
    },
  ];

  const filteredSections =
    activeFilter === 'all'
      ? sections.filter((s) => s.rooms.length > 0)
      : sections.filter(
          (s) =>
            (s.key === activeFilter ||
              (activeFilter === 'outdoor' && s.key === 'structural')) &&
            s.rooms.length > 0
        );

  const allFilled =
    rooms.length > 0 && rooms.every((r) => r.length > 0 && r.breadth > 0);

  const buildablePassed =
    (validationResult?.metrics?.excessArea ?? 0) === 0 &&
    (land?.totalArea ?? 0) > 0;
  const inputRule = validationResult?.rules?.find(
    (r) => r.id === 'rule-input' || r.category === 'input'
  );
  const dimensionsPassed =
    allFilled && (!inputRule || inputRule.status === 'passed');

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-4">
      {/* Global Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-6 border-b border-[#E2E8F0]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#2563EB] bg-[#EFF6FF] px-2.5 py-0.5 rounded-md border border-[#DBEAFE]">
              04 • SIZING & METROLOGY
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#0F172A] tracking-tight">
            Room Dimensions
          </h2>
          <p className="text-sm text-[#64748B] mt-1 max-w-2xl">
            Configure internal room sizes, apply comfort scale presets, and verify spatial allowance.
          </p>
        </div>

        {/* Comfort Scale Preset Pills */}
        <div className="flex items-center bg-[#F1F5F9] p-1 rounded-xl border border-[#E2E8F0] shrink-0">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#64748B] px-2 font-bold hidden sm:inline">
            Scale:
          </span>
          <button
            type="button"
            onClick={() => onApplyPreset('compact')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              scaleSize === 'compact'
                ? 'bg-[#FFFFFF] text-[#0F172A] shadow-xs'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            Compact
          </button>
          <button
            type="button"
            onClick={() => onApplyPreset('standard')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              scaleSize === 'standard'
                ? 'bg-[#FFFFFF] text-[#0F172A] shadow-xs'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            Standard
          </button>
          <button
            type="button"
            onClick={() => onApplyPreset('spacious')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              scaleSize === 'spacious'
                ? 'bg-[#FFFFFF] text-[#0F172A] shadow-xs'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            Spacious
          </button>
        </div>
      </div>

      {/* 4 Architectural Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Card 1: Capacity */}
        <div
          className={`p-4 rounded-xl border flex flex-col justify-between shadow-2xs ${
            buildablePassed
              ? 'bg-[#FFFFFF] border-[#E2E8F0]'
              : 'bg-[#FEF2F2] border-[#F87171]'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-[#64748B]">
              Site Capacity
            </span>
            {buildablePassed ? (
              <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
            ) : (
              <AlertCircle className="w-4 h-4 text-[#DC2626]" />
            )}
          </div>
          <div className="text-lg font-bold font-mono text-[#0F172A]">
            {validationResult.metrics.finalRequiredArea}{' '}
            <span className="text-xs font-normal text-[#64748B]">
              / {validationResult.metrics.totalLandArea} sq.ft
            </span>
          </div>
          <div
            className={`text-xs mt-1 font-medium ${
              buildablePassed ? 'text-[#16A34A]' : 'text-[#DC2626]'
            }`}
          >
            {buildablePassed
              ? 'Within allowable footprint'
              : `+${validationResult.metrics.excessArea} sq.ft over`}
          </div>
        </div>

        {/* Card 2: Spaces */}
        <div className="p-4 rounded-xl border border-[#E2E8F0] bg-[#FFFFFF] flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-[#64748B]">
              Total Spaces
            </span>
            <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
          </div>
          <div className="text-lg font-bold font-mono text-[#0F172A]">
            {rooms.length} Configured
          </div>
          <div className="text-xs text-[#64748B] mt-1">
            {dimensionsPassed ? 'All dimensions set' : 'Review dimensions'}
          </div>
        </div>

        {/* Card 3: Wall Allowance */}
        <div className="p-4 rounded-xl border border-[#E2E8F0] bg-[#FFFFFF] flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-[#64748B]">
              Wall Core (15%)
            </span>
            <Check className="w-3.5 h-3.5 text-[#2563EB]" />
          </div>
          <div className="text-lg font-bold font-mono text-[#0F172A]">
            +{validationResult.metrics.wallAllowance}{' '}
            <span className="text-xs font-normal text-[#64748B]">sq.ft</span>
          </div>
          <div className="text-xs text-[#64748B] mt-1">
            Masonry & envelope thickness
          </div>
        </div>

        {/* Card 4: Circulation */}
        <div className="p-4 rounded-xl border border-[#E2E8F0] bg-[#FFFFFF] flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-[#64748B]">
              Circulation (10%)
            </span>
            <Check className="w-3.5 h-3.5 text-[#2563EB]" />
          </div>
          <div className="text-lg font-bold font-mono text-[#0F172A]">
            +{validationResult.metrics.circulationAllowance}{' '}
            <span className="text-xs font-normal text-[#64748B]">sq.ft</span>
          </div>
          <div className="text-xs text-[#64748B] mt-1">
            Corridors, lobby & passages
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[#E2E8F0] pb-2">
        {[
          { id: 'all', label: `All Rooms (${rooms.length})` },
          { id: 'living', label: 'Living' },
          { id: 'private', label: 'Bedrooms' },
          { id: 'service', label: 'Kitchen & Baths' },
          { id: 'outdoor', label: 'Outdoor & Cores' },
        ].map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setActiveFilter(f.id as any)}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeFilter === f.id
                ? 'bg-[#2563EB] text-white shadow-xs'
                : 'text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Room Dimensions Grid */}
      <div className="space-y-6">
        {filteredSections.map((sec) => (
          <div key={sec.key} className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[#0F172A]">
                {sec.title}
              </h3>
              <span className="text-[11px] font-mono text-[#64748B] bg-[#F1F5F9] px-2 py-0.5 rounded">
                {sec.rooms.length} space{sec.rooms.length > 1 ? 's' : ''}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sec.rooms.map((room) => {
                const roomArea = calculateRoomArea(room.length, room.breadth);
                return (
                  <div
                    key={room.id}
                    className="p-4 rounded-xl border border-[#E2E8F0] bg-[#FFFFFF] hover:border-[#CBD5E1] transition-all shadow-xs flex flex-col justify-between gap-4"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#EFF6FF] text-[#2563EB] border border-[#DBEAFE] shrink-0">
                          {getRoomIcon(room.name)}
                        </div>
                        {onRenameRoom ? (
                          <input
                            type="text"
                            value={room.name}
                            onChange={(e) =>
                              onRenameRoom(room.id, e.target.value)
                            }
                            className="text-sm font-bold text-[#0F172A] bg-transparent border-b border-transparent hover:border-[#CBD5E1] focus:border-[#2563EB] focus:outline-none w-full truncate"
                          />
                        ) : (
                          <span className="text-sm font-bold text-[#0F172A] truncate">
                            {room.name}
                          </span>
                        )}
                      </div>

                      <span className="text-xs font-mono font-bold text-[#2563EB] bg-[#EFF6FF] px-2.5 py-1 rounded-lg border border-[#DBEAFE] shrink-0">
                        {roomArea} sq.ft
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1 border-t border-[#F1F5F9]">
                      <div>
                        <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1 font-mono">
                          Width / Length (ft)
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="3"
                            max="80"
                            value={room.length || ''}
                            onChange={(e) =>
                              onChangeRoomDimension(
                                room.id,
                                parseFloat(e.target.value) || 0,
                                room.breadth
                              )
                            }
                            className="arch-input h-9 pr-8 text-xs font-mono font-semibold"
                          />
                          <span className="absolute right-2.5 top-[8px] text-[10px] text-[#94A3B8] font-mono">
                            ft
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1 font-mono">
                          Depth / Breadth (ft)
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="3"
                            max="80"
                            value={room.breadth || ''}
                            onChange={(e) =>
                              onChangeRoomDimension(
                                room.id,
                                room.length,
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="arch-input h-9 pr-8 text-xs font-mono font-semibold"
                          />
                          <span className="absolute right-2.5 top-[8px] text-[10px] text-[#94A3B8] font-mono">
                            ft
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Process Navigation Bar */}
      <div className="pt-6 border-t border-[#E2E8F0] flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="btn-outline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <button
          type="button"
          onClick={onValidateAndContinue}
          disabled={!allFilled}
          className="btn-primary"
        >
          <span>Continue to AI Suggestions</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

