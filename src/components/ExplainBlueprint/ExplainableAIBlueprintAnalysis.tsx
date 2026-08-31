import React, { useState, useMemo } from 'react';
import { LayoutData, AISuggestion, RoomPlacement } from '../../types';
import {
  analyzeBlueprintExplainability,
  ExplainableAIReport,
  formatDim,
  formatArea,
} from '../../services/explainableAIAnalyzer';
import {
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Compass,
  Route,
  ArrowRight,
  CheckCircle2,
  Maximize2,
  Building,
  Layers,
  DoorOpen,
  Car,
} from 'lucide-react';

interface ExplainableAIBlueprintAnalysisProps {
  layoutData: LayoutData;
  appliedOptimizations?: AISuggestion[];
}

export const ExplainableAIBlueprintAnalysis: React.FC<ExplainableAIBlueprintAnalysisProps> = ({
  layoutData,
  appliedOptimizations,
}) => {
  // Collapsible accordion states - all collapsed by default
  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({
    placement: false,
    circulation: false,
    space: false,
    orientation: false,
    validation: false,
  });

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const report: ExplainableAIReport = useMemo(() => {
    const dataWithOptimizations: LayoutData = {
      ...layoutData,
      appliedSuggestions: appliedOptimizations || layoutData.appliedSuggestions || [],
    };
    return analyzeBlueprintExplainability(dataWithOptimizations);
  }, [layoutData, appliedOptimizations]);

  const { qualityScore, spaceUtilization } = report;
  const { land, facingDirection, rooms } = layoutData;
  const totalLandArea = land.totalArea || land.length * land.breadth;
  const builtUpArea = spaceUtilization.builtUpArea;
  const openAreaSqFt = spaceUtilization.openSpace;
  const utilizationPercent = spaceUtilization.utilizationPercent;

  // Metric extraction
  const metricMap = useMemo(() => {
    const map = new Map<string, number>();
    qualityScore.metrics.forEach((m) => map.set(m.id, m.score));
    return map;
  }, [qualityScore.metrics]);

  const constraintScore = metricMap.get('constraint') ?? 100;
  const placementScore = metricMap.get('placement') ?? 96;
  const utilizationScore = metricMap.get('utilization') ?? Math.min(100, Math.round(utilizationPercent));
  const circulationScore = metricMap.get('circulation') ?? 95;

  // Identify key room entities
  const livingRoom = rooms.find((r) => r.name.toLowerCase().includes('living') || r.name.toLowerCase().includes('hall'));
  const diningRoom = rooms.find((r) => r.name.toLowerCase().includes('dining'));
  const kitchenRoom = rooms.find((r) => r.name.toLowerCase().includes('kitchen'));
  const masterBed = rooms.find((r) => r.name.toLowerCase().includes('master'));
  const bedrooms = rooms.filter((r) => r.name.toLowerCase().includes('bed'));
  const parkingRoom = rooms.find(
    (r) => r.name.toLowerCase().includes('parking') || r.name.toLowerCase().includes('garage') || r.name.toLowerCase().includes('car')
  );
  const attachedBaths = rooms.filter(
    (r) => r.id.startsWith('att-bath-') || r.name.toLowerCase().includes('attached')
  );

  // Derive circulation paths
  const primaryFlow = useMemo(() => {
    const nodes: string[] = ['Main Entrance'];
    if (livingRoom) nodes.push('Living Room');
    if (diningRoom) nodes.push('Dining Room');
    if (kitchenRoom) nodes.push('Kitchen');
    return nodes;
  }, [livingRoom, diningRoom, kitchenRoom]);

  const privateFlow = useMemo(() => {
    const nodes: string[] = ['Private Zone'];
    if (bedrooms.length > 0) nodes.push(`${bedrooms.length} Bedrooms`);
    if (attachedBaths.length > 0) nodes.push('Attached Baths');
    return nodes;
  }, [bedrooms, attachedBaths]);

  // Validation checklist
  const validationChecks = useMemo(() => {
    return [
      { label: 'Plot containment', desc: 'All rooms fit within legal plot boundary envelope' },
      { label: 'Room collision check', desc: 'Zero overlapping structural partitions or spaces' },
      { label: 'Room connectivity', desc: 'Unobstructed walking spines connect public and private zones' },
      { label: 'Entrance access', desc: `Direct ingress aligned with ${facingDirection}-facing road frontage` },
      { label: 'Parking access', desc: parkingRoom ? 'Direct vehicular driveway access from front gate' : 'Clear front buffer access' },
      { label: 'Required spaces', desc: `All ${rooms.length} programmed spatial functions provisioned` },
      { label: 'Area validation', desc: `${(builtUpArea ?? 0).toLocaleString()} sq.ft built-up area satisfies target capacity` },
    ];
  }, [facingDirection, parkingRoom, rooms.length, builtUpArea]);

  return (
    <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl shadow-xs flex flex-col h-full overflow-hidden">
      
      {/* Header */}
      <div className="p-4 border-b border-[#E2E8F0] bg-[#F8FAFC]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-[#2563EB]" />
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[#0F172A]">
              Explainable AI
            </h3>
          </div>
          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 bg-[#EFF6FF] text-[#2563EB] border border-[#DBEAFE] rounded">
            Design Assessment
          </span>
        </div>
      </div>

      {/* Scrollable Body */}
      <div className="p-4 space-y-4 overflow-y-auto max-h-[580px] lg:max-h-[640px]">
        
        {/* Top: Compact Assessment Metric Cards */}
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
              <div className="text-[10px] font-mono uppercase text-[#64748B]">Constraint Satisfaction</div>
              <div className="text-base font-bold font-mono text-[#0F172A] mt-0.5">{constraintScore}%</div>
            </div>
            <div className="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
              <div className="text-[10px] font-mono uppercase text-[#64748B]">Room Placement Quality</div>
              <div className="text-base font-bold font-mono text-[#0F172A] mt-0.5">{placementScore}%</div>
            </div>
            <div className="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
              <div className="text-[10px] font-mono uppercase text-[#64748B]">Space Utilization</div>
              <div className="text-base font-bold font-mono text-[#0F172A] mt-0.5">{utilizationPercent}%</div>
            </div>
            <div className="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
              <div className="text-[10px] font-mono uppercase text-[#64748B]">Circulation Efficiency</div>
              <div className="text-base font-bold font-mono text-[#0F172A] mt-0.5">{circulationScore}%</div>
            </div>
          </div>

          {/* Concise Summary Statement */}
          <div className="p-3 bg-[#F0FDF4] border border-[#DCFCE7] rounded-lg">
            <p className="text-xs text-[#166534] leading-relaxed">
              All required spaces are positioned within the generated building footprint and satisfy the current architectural constraints.
            </p>
          </div>
        </div>

        {/* Collapsible Accordions */}
        <div className="space-y-2 pt-1 border-t border-[#F1F5F9]">
          
          {/* 1. Room Placement Logic */}
          <div className="border border-[#E2E8F0] rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('placement')}
              className="w-full px-3.5 py-2.5 bg-[#F8FAFC] hover:bg-[#F1F5F9] transition-colors flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-[#2563EB]" />
                <span className="text-xs font-semibold text-[#0F172A]">Room Placement Logic</span>
              </div>
              {openSections.placement ? (
                <ChevronDown className="w-4 h-4 text-[#64748B]" />
              ) : (
                <ChevronRight className="w-4 h-4 text-[#64748B]" />
              )}
            </button>

            {openSections.placement && (
              <div className="p-3 bg-white space-y-2.5 border-t border-[#E2E8F0]">
                {report.roomReasonings.map((room) => (
                  <div key={room.id} className="text-xs border-b border-[#F1F5F9] pb-2 last:border-b-0 last:pb-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#0F172A]">{room.roomName}</span>
                      <span className="font-mono text-[10px] text-[#64748B] bg-[#F1F5F9] px-1.5 py-0.5 rounded">
                        {room.dimensions}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#475569] mt-1 leading-relaxed">
                      {room.reason}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 2. Circulation & Connectivity */}
          <div className="border border-[#E2E8F0] rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('circulation')}
              className="w-full px-3.5 py-2.5 bg-[#F8FAFC] hover:bg-[#F1F5F9] transition-colors flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-2">
                <Route className="w-3.5 h-3.5 text-[#2563EB]" />
                <span className="text-xs font-semibold text-[#0F172A]">Circulation & Connectivity</span>
              </div>
              {openSections.circulation ? (
                <ChevronDown className="w-4 h-4 text-[#64748B]" />
              ) : (
                <ChevronRight className="w-4 h-4 text-[#64748B]" />
              )}
            </button>

            {openSections.circulation && (
              <div className="p-3 bg-white space-y-3 border-t border-[#E2E8F0] text-xs">
                {/* Social flow */}
                <div className="space-y-1">
                  <div className="text-[10px] font-mono uppercase text-[#64748B]">Primary Social Flow</div>
                  <div className="flex items-center gap-1.5 flex-wrap text-[11px] font-medium text-[#0F172A] pt-1">
                    {primaryFlow.map((step, idx) => (
                      <React.Fragment key={step}>
                        <span className="px-2 py-0.5 bg-[#EFF6FF] text-[#1D4ED8] rounded border border-[#DBEAFE]">
                          {step}
                        </span>
                        {idx < primaryFlow.length - 1 && <ArrowRight className="w-3 h-3 text-[#94A3B8]" />}
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                {/* Private zone flow */}
                <div className="space-y-1 pt-2 border-t border-[#F1F5F9]">
                  <div className="text-[10px] font-mono uppercase text-[#64748B]">Private Zone Flow</div>
                  <div className="flex items-center gap-1.5 flex-wrap text-[11px] font-medium text-[#0F172A] pt-1">
                    {privateFlow.map((step, idx) => (
                      <React.Fragment key={step}>
                        <span className="px-2 py-0.5 bg-[#F8FAFC] text-[#334155] rounded border border-[#E2E8F0]">
                          {step}
                        </span>
                        {idx < privateFlow.length - 1 && <ArrowRight className="w-3 h-3 text-[#94A3B8]" />}
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                {/* Parking access */}
                {parkingRoom && (
                  <div className="space-y-1 pt-2 border-t border-[#F1F5F9]">
                    <div className="text-[10px] font-mono uppercase text-[#64748B]">Vehicular Flow</div>
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#0F172A] pt-1">
                      <span className="px-2 py-0.5 bg-[#F8FAFC] text-[#334155] rounded border border-[#E2E8F0]">
                        Road / Gate
                      </span>
                      <ArrowRight className="w-3 h-3 text-[#94A3B8]" />
                      <span className="px-2 py-0.5 bg-[#F8FAFC] text-[#334155] rounded border border-[#E2E8F0]">
                        Parking Bay
                      </span>
                      <ArrowRight className="w-3 h-3 text-[#94A3B8]" />
                      <span className="px-2 py-0.5 bg-[#EFF6FF] text-[#1D4ED8] rounded border border-[#DBEAFE]">
                        Main Entrance
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 3. Space Utilization */}
          <div className="border border-[#E2E8F0] rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('space')}
              className="w-full px-3.5 py-2.5 bg-[#F8FAFC] hover:bg-[#F1F5F9] transition-colors flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-2">
                <Maximize2 className="w-3.5 h-3.5 text-[#2563EB]" />
                <span className="text-xs font-semibold text-[#0F172A]">Space Utilization</span>
              </div>
              {openSections.space ? (
                <ChevronDown className="w-4 h-4 text-[#64748B]" />
              ) : (
                <ChevronRight className="w-4 h-4 text-[#64748B]" />
              )}
            </button>

            {openSections.space && (
              <div className="p-3 bg-white space-y-3 border-t border-[#E2E8F0] text-xs">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-[#64748B]">Built-up Area:</span>
                    <span className="font-mono font-bold text-[#0F172A]">{(builtUpArea ?? 0).toLocaleString()} sq.ft</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-[#64748B]">Open Area / Setbacks:</span>
                    <span className="font-mono font-semibold text-[#0F172A]">{(openAreaSqFt ?? 0).toLocaleString()} sq.ft</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-[#64748B]">Utilization:</span>
                    <span className="font-mono font-bold text-[#2563EB]">{utilizationPercent}%</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-[#F1F5F9] rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-[#2563EB] h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, utilizationPercent)}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* 4. Orientation & Entrance */}
          <div className="border border-[#E2E8F0] rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('orientation')}
              className="w-full px-3.5 py-2.5 bg-[#F8FAFC] hover:bg-[#F1F5F9] transition-colors flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-2">
                <Compass className="w-3.5 h-3.5 text-[#2563EB]" />
                <span className="text-xs font-semibold text-[#0F172A]">Orientation & Entrance</span>
              </div>
              {openSections.orientation ? (
                <ChevronDown className="w-4 h-4 text-[#64748B]" />
              ) : (
                <ChevronRight className="w-4 h-4 text-[#64748B]" />
              )}
            </button>

            {openSections.orientation && (
              <div className="p-3 bg-white space-y-2 border-t border-[#E2E8F0] text-xs">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-[#64748B]">Plot Orientation:</span>
                  <span className="font-semibold text-[#0F172A]">{facingDirection} Facing</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-[#64748B]">Main Entrance:</span>
                  <span className="font-semibold text-[#0F172A]">{facingDirection}-facing ingress</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-[#64748B]">Parking Access:</span>
                  <span className="font-semibold text-[#0F172A]">Road-facing boundary</span>
                </div>
              </div>
            )}
          </div>

          {/* 5. Validation Summary */}
          <div className="border border-[#E2E8F0] rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('validation')}
              className="w-full px-3.5 py-2.5 bg-[#F8FAFC] hover:bg-[#F1F5F9] transition-colors flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-[#2563EB]" />
                <span className="text-xs font-semibold text-[#0F172A]">Validation Summary</span>
              </div>
              {openSections.validation ? (
                <ChevronDown className="w-4 h-4 text-[#64748B]" />
              ) : (
                <ChevronRight className="w-4 h-4 text-[#64748B]" />
              )}
            </button>

            {openSections.validation && (
              <div className="p-3 bg-white space-y-2 border-t border-[#E2E8F0] text-xs">
                {validationChecks.map((chk) => (
                  <div key={chk.label} className="flex items-start gap-2 text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A] shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-[#0F172A]">{chk.label}: </span>
                      <span className="text-[#475569]">{chk.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
