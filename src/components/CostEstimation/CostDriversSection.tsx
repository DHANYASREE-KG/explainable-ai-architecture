import React from 'react';
import { CostEstimationRequest } from '../../types/costEstimation';
import {
  Maximize2,
  Layers,
  Bed,
  Bath,
  Home,
  Hammer,
} from 'lucide-react';

interface CostDriversSectionProps {
  inputs: CostEstimationRequest;
}

export const CostDriversSection: React.FC<CostDriversSectionProps> = ({ inputs }) => {
  const totalRooms =
    (inputs.bedroomCount || 0) +
    (inputs.bathroomCount || 0) +
    (inputs.hallCount || 0) +
    (inputs.kitchenCount || 0) +
    (inputs.diningRooms || 0) +
    (inputs.utilityAreas || 0) +
    (inputs.prayerRooms || 0);

  const builtup = inputs?.builtupAreaSqft ?? 0;

  const drivers = [
    {
      title: 'Built-up Area',
      metric: `${builtup.toLocaleString()} sq.ft`,
      icon: <Maximize2 className="w-4 h-4 text-[#2563EB]" />,
      explanation: `Total enclosed constructed area (${builtup.toLocaleString()} sq.ft) directly dictating concrete volume, masonry work, and surface finishes.`,
    },
    {
      title: 'Room Count',
      metric: `${totalRooms} Total Spaces`,
      icon: <Home className="w-4 h-4 text-[#2563EB]" />,
      explanation: `Layout configuration of ${totalRooms} programmed spaces, determining internal partition walls, doors, and electrical conduit routing.`,
    },
    {
      title: 'Bedrooms',
      metric: `${inputs.bedroomCount} BHK`,
      icon: <Bed className="w-4 h-4 text-[#2563EB]" />,
      explanation: `${inputs.bedroomCount} private bedroom chamber${inputs.bedroomCount > 1 ? 's' : ''}, driving dedicated wardrobe alcoves, premium flooring, and lighting points.`,
    },
    {
      title: 'Bathrooms',
      metric: `${inputs.bathroomCount} Baths`,
      icon: <Bath className="w-4 h-4 text-[#2563EB]" />,
      explanation: `${inputs.bathroomCount} bathroom${inputs.bathroomCount > 1 ? 's' : ''} (${inputs.attachedBathrooms ? `${inputs.attachedBathrooms} attached` : ''}${inputs.attachedBathrooms && inputs.commonBathrooms ? ', ' : ''}${inputs.commonBathrooms ? `${inputs.commonBathrooms} common` : ''}), requiring plumbing stacks, sanitary ware, and waterproof tiling.`,
    },
    {
      title: 'Number of Floors',
      metric: `${inputs.numberOfFloors} Floor${inputs.numberOfFloors > 1 ? 's' : ''} (G+${inputs.numberOfFloors - 1})`,
      icon: <Layers className="w-4 h-4 text-[#2563EB]" />,
      explanation: `${inputs.numberOfFloors} structural floor${inputs.numberOfFloors > 1 ? 's' : ''}, determining foundation load capacity and vertical RCC column reinforcement.`,
    },
    {
      title: 'Construction Requirements',
      metric: `${inputs.houseType}`,
      icon: <Hammer className="w-4 h-4 text-[#2563EB]" />,
      explanation: `Material specifications and structural type (${inputs.constructionQuality || 'Standard'} grade), establishing base commodity rates.`,
    },
  ];

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 lg:p-7 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#E2E8F0] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-[#EFF6FF] text-[#2563EB] text-[10px] font-mono font-bold uppercase tracking-wider rounded">
              Architectural Factors
            </span>
            <span className="px-2 py-0.5 bg-[#F8FAFC] text-[#64748B] text-[10px] font-mono font-bold uppercase tracking-wider rounded">
              Blueprint Extraction
            </span>
          </div>
          <h3 className="text-base font-bold text-[#0F172A] font-sans mt-1">
            Cost Drivers
          </h3>
          <p className="text-xs text-[#64748B] mt-0.5">
            Key architectural design parameters influencing the estimated construction cost for this blueprint.
          </p>
        </div>
      </div>

      {/* 6 Clean Cost Driver Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {drivers.map((driver, idx) => (
          <div
            key={`driver-${idx}`}
            className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-2 hover:border-[#BFDBFE] transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-white border border-[#E2E8F0]">
                  {driver.icon}
                </div>
                <span className="text-xs font-bold text-[#0F172A] font-sans">
                  {driver.title}
                </span>
              </div>
              <span className="text-xs font-mono font-bold text-[#2563EB] bg-white px-2 py-0.5 border border-[#BFDBFE] rounded">
                {driver.metric}
              </span>
            </div>
            <p className="text-xs text-[#64748B] leading-relaxed">
              {driver.explanation}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
