import React, { useState, useEffect } from 'react';
import { CostEstimationRequest, CostEstimationResponse, ConstructionQuality, FoundationType } from '../../types/costEstimation';
import { computeScenarioAnalysis } from '../../services/costEstimationService';
import {
  SlidersHorizontal,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Sparkles,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';

interface ScenarioAnalysisProps {
  baselineRequest: CostEstimationRequest;
  baselineEstimate: CostEstimationResponse;
}

export const ScenarioAnalysis: React.FC<ScenarioAnalysisProps> = ({
  baselineRequest,
  baselineEstimate,
}) => {
  const [scenarioInput, setScenarioInput] = useState<CostEstimationRequest>({
    ...baselineRequest,
  });

  const [scenarioResult, setScenarioResult] = useState<{
    scenarioCostINR: number;
    scenarioCostPerSqft: number;
    costDifferenceINR: number;
    percentageDifference: number;
  } | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Sync with baseline on change
  useEffect(() => {
    setScenarioInput({ ...baselineRequest });
  }, [baselineRequest]);

  // Compute live scenario whenever input changes
  useEffect(() => {
    let isCancelled = false;
    const runCalculation = async () => {
      setIsLoading(true);
      try {
        const res = await computeScenarioAnalysis(baselineRequest, scenarioInput);
        if (!isCancelled) {
          setScenarioResult({
            scenarioCostINR: res.scenarioCostINR,
            scenarioCostPerSqft: res.scenarioCostPerSqft,
            costDifferenceINR: res.costDifferenceINR,
            percentageDifference: res.percentageDifference,
          });
        }
      } catch (e) {
        console.error('Scenario calculation error:', e);
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    };

    runCalculation();
    return () => {
      isCancelled = true;
    };
  }, [scenarioInput, baselineRequest]);

  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleResetScenario = () => {
    setScenarioInput({ ...baselineRequest });
  };

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 lg:p-7 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#E2E8F0] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-[#EFF6FF] text-[#2563EB] text-[10px] font-mono font-bold uppercase tracking-wider rounded">
              Interactive What-If Sandbox
            </span>
            <span className="text-[10px] font-mono text-[#64748B] uppercase">
              Sensitivity Analysis
            </span>
          </div>
          <h3 className="text-base font-bold text-[#0F172A] font-sans mt-1">
            Cost Scenario Simulation & Impact Estimator
          </h3>
          <p className="text-xs text-[#64748B] mt-0.5">
            Test different built-up areas, floor counts, quality grades, and future years to observe live budget impact.
          </p>
        </div>

        <button
          type="button"
          onClick={handleResetScenario}
          className="text-xs text-[#64748B] hover:text-[#0F172A] flex items-center gap-1 font-semibold cursor-pointer transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset to Current Baseline</span>
        </button>
      </div>

      {/* Comparison Scoreboard Header */}
      {scenarioResult && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl font-mono">
          <div className="p-3 bg-white border border-[#E2E8F0] rounded-lg">
            <div className="text-[10px] uppercase text-[#64748B] font-bold">Current Baseline</div>
            <div className="text-xl font-black text-[#0F172A] mt-1">
              ₹ {(baselineEstimate.primaryEstimate.totalCostINR / 100000).toFixed(2)} Lakhs
            </div>
            <div className="text-[11px] text-[#64748B] mt-0.5">
              ₹ {formatINR(baselineEstimate.primaryEstimate.costPerSqftINR)} / sq.ft
            </div>
          </div>

          <div className="p-3 bg-white border border-[#2563EB] ring-1 ring-[#2563EB]/20 rounded-lg">
            <div className="text-[10px] uppercase text-[#2563EB] font-bold flex items-center justify-between">
              <span>Simulated Scenario</span>
              {isLoading && <RefreshCw className="w-3 h-3 animate-spin text-[#2563EB]" />}
            </div>
            <div className="text-xl font-black text-[#2563EB] mt-1">
              ₹ {(scenarioResult.scenarioCostINR / 100000).toFixed(2)} Lakhs
            </div>
            <div className="text-[11px] text-[#64748B] mt-0.5">
              ₹ {formatINR(scenarioResult.scenarioCostPerSqft)} / sq.ft
            </div>
          </div>

          <div className="p-3 bg-white border border-[#E2E8F0] rounded-lg">
            <div className="text-[10px] uppercase text-[#64748B] font-bold">Budget Difference</div>
            <div
              className={`text-xl font-black mt-1 flex items-center gap-1.5 ${
                scenarioResult.costDifferenceINR > 0
                  ? 'text-[#DC2626]'
                  : scenarioResult.costDifferenceINR < 0
                  ? 'text-[#16A34A]'
                  : 'text-[#64748B]'
              }`}
            >
              {scenarioResult.costDifferenceINR > 0 ? (
                <TrendingUp className="w-4 h-4" />
              ) : scenarioResult.costDifferenceINR < 0 ? (
                <TrendingDown className="w-4 h-4" />
              ) : null}
              <span>
                {scenarioResult.costDifferenceINR > 0 ? '+' : ''}
                ₹ {(scenarioResult.costDifferenceINR / 100000).toFixed(2)} L
              </span>
            </div>
            <div className="text-[11px] font-semibold text-[#64748B] mt-0.5">
              {scenarioResult.percentageDifference > 0 ? '+' : ''}
              {scenarioResult.percentageDifference}% variance
            </div>
          </div>
        </div>
      )}

      {/* Interactive Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* 1. Built-up Area Slider */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[#0F172A] font-mono">Built-up Area</span>
            <span className="font-bold text-[#2563EB] font-mono">{scenarioInput.builtupAreaSqft} sq.ft</span>
          </div>
          <input
            type="range"
            min={600}
            max={6000}
            step={50}
            value={scenarioInput.builtupAreaSqft}
            onChange={(e) =>
              setScenarioInput((prev) => ({
                ...prev,
                builtupAreaSqft: Number(e.target.value),
              }))
            }
            className="w-full h-1.5 bg-[#E2E8F0] rounded-lg appearance-none cursor-pointer accent-[#2563EB]"
          />
          <div className="flex justify-between text-[10px] font-mono text-[#94A3B8]">
            <span>600 sq.ft</span>
            <span>6000 sq.ft</span>
          </div>
        </div>

        {/* 2. Number of Floors */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-[#0F172A] font-mono">
            Number of Floors
          </label>
          <select
            value={scenarioInput.numberOfFloors}
            onChange={(e) =>
              setScenarioInput((prev) => ({
                ...prev,
                numberOfFloors: Number(e.target.value),
              }))
            }
            className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-lg text-xs font-semibold text-[#0F172A] focus:outline-hidden focus:border-[#2563EB]"
          >
            <option value={1}>G+0 (Single Floor)</option>
            <option value={2}>G+1 (Ground + 1 Floor)</option>
            <option value={3}>G+2 (Ground + 2 Floors)</option>
            <option value={4}>G+3 (Ground + 3 Floors)</option>
          </select>
        </div>

        {/* 3. Construction Quality Tier */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-[#0F172A] font-mono">
            Quality Grade
          </label>
          <select
            value={scenarioInput.constructionQuality}
            onChange={(e) =>
              setScenarioInput((prev) => ({
                ...prev,
                constructionQuality: e.target.value as ConstructionQuality,
              }))
            }
            className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-lg text-xs font-semibold text-[#0F172A] focus:outline-hidden focus:border-[#2563EB]"
          >
            <option value="Economy">Economy Tier</option>
            <option value="Standard">Standard Tier</option>
            <option value="Premium">Premium Tier</option>
            <option value="Luxury">Luxury Tier</option>
          </select>
        </div>

        {/* 4. Target Construction Year */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-[#0F172A] font-mono">
            Target Construction Year
          </label>
          <select
            value={scenarioInput.constructionYear}
            onChange={(e) =>
              setScenarioInput((prev) => ({
                ...prev,
                constructionYear: Number(e.target.value),
              }))
            }
            className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-lg text-xs font-semibold text-[#0F172A] focus:outline-hidden focus:border-[#2563EB]"
          >
            <option value={2026}>2026 (Current Base)</option>
            <option value={2027}>2027 (+5.6% Inflation)</option>
            <option value={2028}>2028 (+11.5% Inflation)</option>
            <option value={2029}>2029 (+17.8% Inflation)</option>
            <option value={2030}>2030 (+24.3% Inflation)</option>
          </select>
        </div>
      </div>
    </div>
  );
};
