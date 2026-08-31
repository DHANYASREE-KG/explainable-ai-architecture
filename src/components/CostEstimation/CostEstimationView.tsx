import React, { useState, useEffect, useCallback } from 'react';
import { LayoutData } from '../../types';
import {
  CostEstimationRequest,
  CostEstimationResponse,
} from '../../types/costEstimation';
import {
  extractArchitecturalInputs,
  fetchCostEstimation,
} from '../../services/costEstimationService';
import { CostSummaryCard } from './CostSummaryCard';
import { GeneratedDesignSummary } from './GeneratedDesignSummary';
import { CostBreakdownSection } from './CostBreakdownSection';
import { ModelPerformanceSection } from './ModelPerformanceSection';
import { CostCalculationExplanation } from './CostCalculationExplanation';
import {
  Calculator,
  Grid3X3,
  Box,
  Printer,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';

interface CostEstimationViewProps {
  layoutData: LayoutData;
  onBackTo3D: () => void;
  onBackTo2D: () => void;
}

export const CostEstimationView: React.FC<CostEstimationViewProps> = ({
  layoutData,
  onBackTo3D,
  onBackTo2D,
}) => {
  const [estimation, setEstimation] = useState<CostEstimationResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Track layout snapshot hash to detect if architecture changed in earlier stages (01-07)
  const [lastCalculatedLayoutHash, setLastCalculatedLayoutHash] = useState<string>('');

  const currentLayoutHash = JSON.stringify({
    land: {
      length: layoutData.land?.length,
      breadth: layoutData.land?.breadth,
      totalArea: layoutData.land?.totalArea,
      plotType: layoutData.land?.plotType,
      polygonPoints: layoutData.land?.polygonPoints,
    },
    rooms: layoutData.rooms?.map((r) => ({
      id: r.id,
      name: r.name,
      width: r.width,
      height: r.height,
      attachedBathroom: (r as any).attachedBathroom,
      hasAttachedBath: (r as any).hasAttachedBath,
    })) || [],
    facingDirection: layoutData.facingDirection,
    parking: layoutData.parking,
    garden: layoutData.garden,
    compoundWall: layoutData.compoundWall,
    roofType: (layoutData as any).roofType,
    floors: (layoutData as any).floors || (layoutData as any).floorCount || 1,
  });

  const isOutdated = !!lastCalculatedLayoutHash && lastCalculatedLayoutHash !== currentLayoutHash;

  // Load / Recalculate Estimation automatically for the current generated design
  const loadEstimation = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const inputs: CostEstimationRequest = extractArchitecturalInputs(layoutData);
      const response = await fetchCostEstimation(inputs);
      setEstimation(response);
      setLastCalculatedLayoutHash(currentLayoutHash);
    } catch (err: any) {
      console.error('Error fetching cost estimation:', err);
      setErrorMessage(err.message || 'Cost estimation model is currently unavailable.');
    } finally {
      setIsLoading(false);
    }
  }, [layoutData, currentLayoutHash]);

  useEffect(() => {
    loadEstimation();
  }, [loadEstimation]);

  const handlePrint = () => {
    window.print();
  };

  const builtupArea = estimation?.inputs?.builtupAreaSqft ?? 0;
  const baseRate = 2500;
  const totalCostINR = builtupArea * baseRate;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-4 bg-white p-5 rounded-xl border shadow-2xs">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#0F2747] text-white flex items-center justify-center shadow-xs">
            <Calculator className="w-6 h-6 text-[#38BDF8]" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#2563EB] font-mono bg-[#EFF6FF] px-2 py-0.5 rounded">
                STEP 08 • FINAL STAGE
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#166534] font-mono bg-[#F0FDF4] px-2 py-0.5 rounded border border-[#BBF7D0]">
                TRAINED XGBOOST ENGINE
              </span>
            </div>
            <h2 className="text-xl lg:text-2xl font-bold text-[#0F172A] font-sans mt-0.5">
              AI Construction Cost Estimation
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Estimated construction cost based on the current generated architectural design.
            </p>
          </div>
        </div>

        {/* Global Action Controls */}
        <div className="flex items-center gap-2 flex-wrap self-stretch sm:self-auto">
          <button
            onClick={onBackTo2D}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-mono font-medium text-[#0F172A] bg-white border border-[#CBD5E1] rounded-lg hover:bg-[#F8FAFC] transition-colors cursor-pointer"
            title="Inspect 2D Blueprint"
          >
            <Grid3X3 className="w-3.5 h-3.5 text-[#2563EB]" />
            2D Blueprint
          </button>

          <button
            onClick={onBackTo3D}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-mono font-medium text-[#0F172A] bg-white border border-[#CBD5E1] rounded-lg hover:bg-[#F8FAFC] transition-colors cursor-pointer"
            title="Inspect 3D Perspective"
          >
            <Box className="w-3.5 h-3.5 text-[#2563EB]" />
            3D View
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-mono font-semibold text-[#0F172A] bg-[#F1F5F9] border border-[#CBD5E1] rounded-lg hover:bg-[#E2E8F0] transition-colors cursor-pointer"
            title="Print or Export Cost Summary"
          >
            <Printer className="w-3.5 h-3.5 text-[#475569]" />
            Print Report
          </button>
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-12 text-center space-y-4 shadow-2xs">
          <RefreshCw className="w-8 h-8 text-[#2563EB] animate-spin mx-auto" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-[#0F172A] font-sans">
              Calculating Construction Cost from Blueprint...
            </h3>
            <p className="text-xs text-[#64748B] font-mono">
              Extracting built-up dimensions and engineering quantities
            </p>
          </div>
        </div>
      )}

      {/* Error Display */}
      {!isLoading && errorMessage && (
        <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-xl p-6 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-[#DC2626] mx-auto" />
          <div className="text-sm font-bold text-[#991B1B]">
            {errorMessage}
          </div>
          <button
            onClick={loadEstimation}
            className="px-4 py-2 bg-[#DC2626] text-white text-xs font-mono font-bold rounded-lg hover:bg-[#B91C1C] transition-colors cursor-pointer"
          >
            Retry Estimation
          </button>
        </div>
      )}

      {/* Main Content Sections */}
      {!isLoading && estimation && (
        <div className="space-y-6">
          {/* 1. PRIMARY RESULT CARD: ESTIMATED CONSTRUCTION COST */}
          <CostSummaryCard
            inputs={estimation.inputs}
            layoutData={layoutData}
            isOutdated={isOutdated}
            onRecalculate={loadEstimation}
          />

          {/* 2. GENERATED DESIGN SUMMARY */}
          <GeneratedDesignSummary
            inputs={estimation.inputs}
            layoutData={layoutData}
          />

          {/* 3. DETAILED CONSTRUCTION BREAKDOWN */}
          <CostBreakdownSection
            totalCostINR={totalCostINR}
          />

          {/* 4 & 5. HISTORICAL MODEL PERFORMANCE & ACTUAL VS PREDICTED GRAPH */}
          <ModelPerformanceSection
            testSamples={estimation.testSamples}
          />

          {/* 6. HOW IS THE COST CALCULATED? (Simple Expandable Section) */}
          <CostCalculationExplanation
            builtupAreaSqft={builtupArea}
          />
        </div>
      )}
    </div>
  );
};
