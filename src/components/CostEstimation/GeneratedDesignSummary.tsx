import React from 'react';
import { LayoutData } from '../../types';
import { CostEstimationRequest } from '../../types/costEstimation';
import {
  Maximize2,
  Home,
  Bed,
  Bath,
  Layers,
  Sparkles,
} from 'lucide-react';

interface GeneratedDesignSummaryProps {
  inputs: CostEstimationRequest;
  layoutData: LayoutData;
}

export const GeneratedDesignSummary: React.FC<GeneratedDesignSummaryProps> = ({
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

  const plotArea = inputs.plotAreaSqft || layoutData.land?.totalArea || 0;
  const builtupArea = inputs.builtupAreaSqft || 0;

  const items = [
    {
      label: 'Plot Area',
      value: `${plotArea.toLocaleString()} sq.ft`,
      icon: <Maximize2 className="w-4 h-4 text-[#2563EB]" />,
    },
    {
      label: 'Built-up Area',
      value: `${builtupArea.toLocaleString()} sq.ft`,
      icon: <Home className="w-4 h-4 text-[#2563EB]" />,
      highlight: true,
    },
    {
      label: 'Bedrooms',
      value: `${inputs.bedroomCount || 0}`,
      icon: <Bed className="w-4 h-4 text-[#2563EB]" />,
    },
    {
      label: 'Bathrooms',
      value: `${inputs.bathroomCount || 0}`,
      icon: <Bath className="w-4 h-4 text-[#2563EB]" />,
    },
    {
      label: 'Floors',
      value: `${inputs.numberOfFloors || 1}`,
      icon: <Layers className="w-4 h-4 text-[#2563EB]" />,
    },
    {
      label: 'Total Spaces',
      value: `${totalSpaces}`,
      icon: <Sparkles className="w-4 h-4 text-[#2563EB]" />,
    },
  ];

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 lg:p-6 shadow-2xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E2E8F0] pb-3">
        <div>
          <h3 className="text-base font-bold text-[#0F172A] font-sans">
            Generated Design Summary
          </h3>
          <p className="text-xs text-[#64748B] mt-0.5">
            Architectural parameters extracted directly from the current generated blueprint.
          </p>
        </div>
        <span className="text-[11px] font-mono text-[#2563EB] bg-[#EFF6FF] px-2.5 py-1 rounded-md self-start sm:self-auto font-medium">
          Source: Active Project
        </span>
      </div>

      {/* Compact Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {items.map((item, idx) => (
          <div
            key={`sum-${idx}`}
            className={`p-3.5 rounded-lg border transition-colors ${
              item.highlight
                ? 'bg-[#EFF6FF] border-[#BFDBFE]'
                : 'bg-[#F8FAFC] border-[#E2E8F0]'
            }`}
          >
            <div className="flex items-center gap-1.5 text-[#64748B]">
              {item.icon}
              <span className="text-[11px] font-mono uppercase font-semibold text-[#64748B]">
                {item.label}
              </span>
            </div>
            <div
              className={`text-base font-bold font-mono mt-1.5 ${
                item.highlight ? 'text-[#1D4ED8]' : 'text-[#0F172A]'
              }`}
            >
              {item.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
