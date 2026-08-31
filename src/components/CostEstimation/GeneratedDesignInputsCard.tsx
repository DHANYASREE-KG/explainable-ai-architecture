import React from 'react';
import { CostEstimationRequest } from '../../types/costEstimation';
import { LayoutData } from '../../types';
import {
  Home,
  Maximize2,
  Layers,
  Bed,
  Bath,
  Utensils,
  Tv,
  Compass,
  Car,
  TreePine,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  Box,
} from 'lucide-react';

interface GeneratedDesignInputsCardProps {
  inputs: CostEstimationRequest;
  layoutData: LayoutData;
}

export const GeneratedDesignInputsCard: React.FC<GeneratedDesignInputsCardProps> = ({
  inputs,
  layoutData,
}) => {
  const totalSpaces =
    (inputs.bedroomCount || 0) +
    (inputs.bathroomCount || 0) +
    (inputs.hallCount || 0) +
    (inputs.kitchenCount || 0) +
    (inputs.diningRooms || 0) +
    (inputs.utilityAreas || 0) +
    (inputs.prayerRooms || 0) +
    (inputs.balconyAreas || 0) +
    (layoutData.parking ? 1 : 0) +
    (layoutData.garden ? 1 : 0);

  // Collect other generated spaces from layoutData
  const otherSpaces: { label: string; count: number | string; icon: React.ReactNode }[] = [];

  if (inputs.diningRooms && inputs.diningRooms > 0) {
    otherSpaces.push({
      label: 'Dining Room',
      count: `${inputs.diningRooms} Space`,
      icon: <Utensils className="w-3.5 h-3.5 text-[#2563EB]" />,
    });
  }

  if (inputs.utilityAreas && inputs.utilityAreas > 0) {
    otherSpaces.push({
      label: 'Utility & Storage',
      count: `${inputs.utilityAreas} Area${inputs.utilityAreas > 1 ? 's' : ''}`,
      icon: <Box className="w-3.5 h-3.5 text-[#2563EB]" />,
    });
  }

  if (inputs.prayerRooms && inputs.prayerRooms > 0) {
    otherSpaces.push({
      label: 'Pooja / Prayer Room',
      count: `${inputs.prayerRooms} Space`,
      icon: <Sparkles className="w-3.5 h-3.5 text-[#D97706]" />,
    });
  }

  if (inputs.balconyAreas && inputs.balconyAreas > 0) {
    otherSpaces.push({
      label: 'Balcony / Sit-out',
      count: `${inputs.balconyAreas} Area${inputs.balconyAreas > 1 ? 's' : ''}`,
      icon: <Layers className="w-3.5 h-3.5 text-[#2563EB]" />,
    });
  }

  if (layoutData.parking || (inputs.parkingAreas && inputs.parkingAreas > 0)) {
    otherSpaces.push({
      label: 'Parking / Porch',
      count: 'Included',
      icon: <Car className="w-3.5 h-3.5 text-[#2563EB]" />,
    });
  }

  if (layoutData.garden) {
    otherSpaces.push({
      label: 'Garden Landscape',
      count: 'Planned',
      icon: <TreePine className="w-3.5 h-3.5 text-[#16A34A]" />,
    });
  }

  if (layoutData.compoundWall) {
    otherSpaces.push({
      label: 'Compound Wall',
      count: 'Included',
      icon: <ShieldAlert className="w-3.5 h-3.5 text-[#475569]" />,
    });
  }

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 lg:p-7 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#E2E8F0] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-[#EFF6FF] text-[#2563EB] text-[10px] font-mono font-bold uppercase tracking-wider rounded">
              Design Geometry
            </span>
            <span className="px-2 py-0.5 bg-[#F0FDF4] text-[#166534] text-[10px] font-mono font-bold uppercase tracking-wider rounded flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-[#16A34A]" /> Auto-Extracted
            </span>
          </div>
          <h3 className="text-base font-bold text-[#0F172A] font-sans mt-1">
            Generated Design Inputs
          </h3>
          <p className="text-xs text-[#64748B] mt-0.5">
            Architectural parameters extracted directly from the currently validated 2D/3D blueprint.
          </p>
        </div>

        <div className="text-[11px] font-mono text-[#64748B] bg-[#F8FAFC] border border-[#E2E8F0] px-3 py-1 rounded-lg">
          Building Envelope: {inputs.plotShape || 'Rectangular'} Plot
        </div>
      </div>

      {/* Primary Blueprint Parameters Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Built-up Area */}
        <div className="p-3.5 bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg">
          <div className="text-[10px] uppercase font-mono text-[#1E40AF] font-bold flex items-center gap-1">
            <Home className="w-3 h-3 text-[#2563EB]" /> Built-up Area
          </div>
          <div className="text-base font-black text-[#2563EB] font-mono mt-1">
            {(inputs?.builtupAreaSqft ?? 0).toLocaleString()} <span className="text-xs font-normal text-[#1E40AF]">sq.ft</span>
          </div>
          <div className="text-[11px] text-[#1E40AF] mt-0.5 font-medium">
            Footprint + Walls
          </div>
        </div>

        {/* Bedrooms */}
        <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
          <div className="text-[10px] uppercase font-mono text-[#64748B] font-semibold flex items-center gap-1">
            <Bed className="w-3 h-3 text-[#2563EB]" /> Bedrooms
          </div>
          <div className="text-base font-black text-[#0F172A] font-mono mt-1">
            {inputs.bedroomCount} <span className="text-xs font-normal text-[#64748B]">BHK</span>
          </div>
          <div className="text-[11px] text-[#64748B] mt-0.5">
            {inputs.bedroomCount} Bedroom{inputs.bedroomCount > 1 ? 's' : ''}
          </div>
        </div>

        {/* Bathrooms */}
        <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
          <div className="text-[10px] uppercase font-mono text-[#64748B] font-semibold flex items-center gap-1">
            <Bath className="w-3 h-3 text-[#2563EB]" /> Bathrooms
          </div>
          <div className="text-base font-black text-[#0F172A] font-mono mt-1">
            {inputs.bathroomCount} <span className="text-xs font-normal text-[#64748B]">Baths</span>
          </div>
          <div className="text-[11px] text-[#64748B] mt-0.5">
            {inputs.attachedBathrooms ? `${inputs.attachedBathrooms} Att.` : ''}
            {inputs.attachedBathrooms && inputs.commonBathrooms ? ', ' : ''}
            {inputs.commonBathrooms ? `${inputs.commonBathrooms} Com.` : ''}
            {!inputs.attachedBathrooms && !inputs.commonBathrooms ? 'Standard' : ''}
          </div>
        </div>

        {/* Floors */}
        <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
          <div className="text-[10px] uppercase font-mono text-[#64748B] font-semibold flex items-center gap-1">
            <Layers className="w-3 h-3 text-[#2563EB]" /> Floors
          </div>
          <div className="text-base font-black text-[#0F172A] font-mono mt-1">
            {inputs.numberOfFloors} <span className="text-xs font-normal text-[#64748B]">Floor{inputs.numberOfFloors > 1 ? 's' : ''}</span>
          </div>
          <div className="text-[11px] text-[#64748B] mt-0.5">
            Ground {inputs.numberOfFloors > 1 ? `+ ${inputs.numberOfFloors - 1} Levels` : 'Only'}
          </div>
        </div>

        {/* Total Spaces */}
        <div className="p-3.5 bg-[#F0FDF4] border border-[#DCFCE7] rounded-lg">
          <div className="text-[10px] uppercase font-mono text-[#166534] font-semibold flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#16A34A]" /> Total Spaces
          </div>
          <div className="text-base font-black text-[#15803D] font-mono mt-1">
            {totalSpaces} <span className="text-xs font-normal text-[#166534]">Spaces</span>
          </div>
          <div className="text-[11px] text-[#166534] mt-0.5">
            Programmed areas
          </div>
        </div>
      </div>

      {/* Other Generated Spaces */}
      {otherSpaces.length > 0 && (
        <div className="pt-2 border-t border-[#E2E8F0]">
          <div className="text-xs font-bold text-[#0F172A] font-sans mb-2.5">
            Other Generated Spaces & Ancillary Provisions
          </div>
          <div className="flex flex-wrap gap-2">
            {otherSpaces.map((space, idx) => (
              <div
                key={`space-${idx}`}
                className="px-3 py-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg flex items-center gap-2 text-xs"
              >
                {space.icon}
                <span className="font-semibold text-[#0F172A]">{space.label}:</span>
                <span className="font-mono text-[#64748B]">{space.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
