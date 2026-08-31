import React, { useMemo } from 'react';
import {
  AISuggestion,
  AreaMetrics,
  LandDetails,
  ValidationResult,
} from '../types';
import {
  Check,
  X,
  ArrowRight,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  Wand2,
  SlidersHorizontal,
  AlertTriangle,
  ArrowLeft,
} from 'lucide-react';

interface StepAISuggestionsProps {
  land: LandDetails;
  metrics: AreaMetrics;
  validationResult?: ValidationResult;
  suggestions: AISuggestion[];
  onAcceptSuggestion: (suggestionId: string) => void;
  onAcceptAllSuggestions?: () => void;
  onRejectSuggestion: (suggestionId: string) => void;
  onRevalidate: () => void;
  onGenerate2D: () => void;
  isValid: boolean;
  onBack?: () => void;
}

export const StepAISuggestions: React.FC<StepAISuggestionsProps> = ({
  metrics,
  suggestions,
  onAcceptSuggestion,
  onAcceptAllSuggestions,
  onRejectSuggestion,
  onRevalidate,
  onGenerate2D,
  isValid,
  onBack,
}) => {
  const layoutFits =
    (metrics.excessArea === 0 && isValid) ||
    (metrics.totalLandArea > 0 &&
      metrics.finalRequiredArea <= metrics.totalLandArea &&
      isValid);

  const targetRecovery = useMemo(() => {
    return Math.max(0, metrics.excessArea);
  }, [metrics.excessArea]);

  const acceptedSuggestions = useMemo(() => {
    return suggestions.filter((s) => s.status === 'accepted');
  }, [suggestions]);

  const pendingSuggestions = useMemo(() => {
    return suggestions.filter((s) => s.status === 'pending');
  }, [suggestions]);

  const totalRecoveredArea = useMemo(() => {
    return acceptedSuggestions.reduce((sum, s) => sum + s.areaSaved, 0);
  }, [acceptedSuggestions]);

  const remainingExcess = Math.max(0, targetRecovery - totalRecoveredArea);

  const recoveryProgress =
    targetRecovery > 0
      ? Math.min(100, Math.round((totalRecoveredArea / targetRecovery) * 100))
      : 100;

  const isExhaustedImpossible = useMemo(() => {
    if (layoutFits) return false;
    if (
      pendingSuggestions.length === 0 &&
      remainingExcess > 0 &&
      suggestions.length > 0
    ) {
      return true;
    }
    return false;
  }, [
    layoutFits,
    pendingSuggestions.length,
    remainingExcess,
    suggestions.length,
  ]);

  const handleApplyAll = () => {
    if (onAcceptAllSuggestions) {
      onAcceptAllSuggestions();
    } else {
      pendingSuggestions.forEach((sug) => {
        onAcceptSuggestion(sug.id);
      });
    }
  };

  // ---------------------------------------------------------------------------
  // CASE 1: LAYOUT FITS (NO OPTIMIZATION NEEDED)
  // ---------------------------------------------------------------------------
  if (layoutFits) {
    return (
      <div className="space-y-8 max-w-5xl mx-auto py-4 animate-in fade-in duration-300">
        {/* Global Page Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-6 border-b border-[#E2E8F0]">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#16A34A] bg-[#DCFCE7] px-2.5 py-0.5 rounded-md border border-[#BBF7D0]">
                05 • SPATIAL COMPLIANCE
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0F172A] tracking-tight">
              AI Optimization
            </h2>
            <p className="text-sm text-[#64748B] mt-1 max-w-2xl">
              All room requirements fit comfortably within the site footprint. No adjustments required.
            </p>
          </div>
        </div>

        {/* Success Card */}
        <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl p-8 sm:p-12 text-center space-y-6 shadow-sm">
          <div className="w-16 h-16 bg-[#DCFCE7] text-[#16A34A] border border-[#BBF7D0] flex items-center justify-center mx-auto rounded-2xl shadow-xs">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <h3 className="text-2xl font-bold text-[#0F172A]">
              Full Compliance Achieved
            </h3>
            <p className="text-sm text-[#64748B]">
              Your requested rooms, wall allowances, and circulation hallways fit within the site's buildable footprint.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto pt-2">
            <div className="bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0] shadow-2xs">
              <span className="text-[#64748B] block text-[10px] uppercase font-bold tracking-wider font-mono">
                Total Land Area
              </span>
              <strong className="text-[#0F172A] text-lg font-bold font-mono mt-1 block">
                {(metrics?.totalLandArea ?? 0).toLocaleString()} sq.ft
              </strong>
            </div>
            <div className="bg-[#EFF6FF] p-4 rounded-xl border border-[#DBEAFE] shadow-2xs">
              <span className="text-[#2563EB] block text-[10px] uppercase font-bold tracking-wider font-mono">
                Required Footprint
              </span>
              <strong className="text-[#1D4ED8] text-lg font-bold font-mono mt-1 block">
                {(metrics?.finalRequiredArea ?? 0).toLocaleString()} sq.ft
              </strong>
            </div>
            <div className="bg-[#DCFCE7] p-4 rounded-xl border border-[#BBF7D0] shadow-2xs">
              <span className="text-[#15803D] block text-[10px] uppercase font-bold tracking-wider font-mono">
                Open Setback
              </span>
              <strong className="text-[#15803D] text-lg font-bold font-mono mt-1 block">
                {(metrics?.remainingArea ?? 0).toLocaleString()} sq.ft
              </strong>
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
            onClick={onGenerate2D}
            className="btn-primary"
          >
            <span>Generate 2D Blueprint</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // CASE 2: OPTIMIZATION REQUIRED
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-8 max-w-5xl mx-auto py-4 animate-in fade-in duration-300">
      {/* Global Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-6 border-b border-[#E2E8F0]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#2563EB] bg-[#EFF6FF] px-2.5 py-0.5 rounded-md border border-[#DBEAFE]">
              05 • SPATIAL OPTIMIZATION
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#0F172A] tracking-tight">
            AI Recommendations
          </h2>
          <p className="text-sm text-[#64748B] mt-1 max-w-2xl">
            Proportional dimensional adjustments to balance room schedules with plot capacity.
          </p>
        </div>

        {pendingSuggestions.length > 0 && (
          <button
            type="button"
            onClick={handleApplyAll}
            className="btn-primary shrink-0"
          >
            <Wand2 className="w-4 h-4" />
            <span>Apply All ({pendingSuggestions.length}) Adjustments</span>
          </button>
        )}
      </div>

      {/* 4 Architectural Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#FFFFFF] p-4 rounded-xl border border-[#E2E8F0] shadow-2xs">
          <span className="text-[#64748B] block text-[10px] uppercase font-bold tracking-wider font-mono">
            Buildable Area
          </span>
          <div className="text-lg font-bold text-[#0F172A] font-mono mt-1">
            {(metrics?.totalLandArea ?? 0).toLocaleString()}{' '}
            <span className="text-xs font-normal text-[#64748B]">sq.ft</span>
          </div>
        </div>

        <div className="bg-[#FFFFFF] p-4 rounded-xl border border-[#E2E8F0] shadow-2xs">
          <span className="text-[#64748B] block text-[10px] uppercase font-bold tracking-wider font-mono">
            Requested Area
          </span>
          <div className="text-lg font-bold text-[#0F172A] font-mono mt-1">
            {(metrics?.finalRequiredArea ?? 0).toLocaleString()}{' '}
            <span className="text-xs font-normal text-[#64748B]">sq.ft</span>
          </div>
        </div>

        <div className="bg-[#FEF2F2] p-4 rounded-xl border border-[#FCA5A5] shadow-2xs">
          <span className="text-[#DC2626] block text-[10px] uppercase font-bold tracking-wider font-mono">
            Excess Footprint
          </span>
          <div className="text-lg font-bold text-[#DC2626] font-mono mt-1">
            +{(metrics?.excessArea ?? 0).toLocaleString()}{' '}
            <span className="text-xs font-normal text-[#DC2626]/70">sq.ft</span>
          </div>
        </div>

        <div className="bg-[#EFF6FF] p-4 rounded-xl border border-[#93C5FD] shadow-2xs">
          <span className="text-[#1D4ED8] block text-[10px] uppercase font-bold tracking-wider font-mono">
            Target Recovery
          </span>
          <div className="text-lg font-bold text-[#1D4ED8] font-mono mt-1">
            {(targetRecovery ?? 0).toLocaleString()}{' '}
            <span className="text-xs font-normal text-[#1D4ED8]/70">sq.ft</span>
          </div>
        </div>
      </div>

      {/* Progress Strip */}
      <div className="bg-[#FFFFFF] border border-[#E2E8F0] p-5 rounded-xl shadow-2xs space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs font-mono font-bold uppercase tracking-wider gap-2">
          <span className="text-[#64748B]">
            Optimization Progress:{' '}
            <strong className="text-[#0F172A]">{recoveryProgress}%</strong>
          </span>
          <span className="text-[#64748B]">
            Recovered:{' '}
            <strong className="text-[#16A34A]">{totalRecoveredArea} sq.ft</strong>{' '}
            <span className="opacity-40 mx-1.5">•</span> Remaining:{' '}
            <strong
              className={
                remainingExcess === 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'
              }
            >
              {remainingExcess} sq.ft
            </strong>
          </span>
        </div>
        <div className="w-full bg-[#F1F5F9] h-2.5 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#2563EB] transition-all duration-300 rounded-full"
            style={{ width: `${recoveryProgress}%` }}
          />
        </div>
      </div>

      {/* Success Banner */}
      {remainingExcess === 0 && (
        <div className="bg-[#DCFCE7] border border-[#86EFAC] rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-lg bg-[#16A34A] text-white flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#14532D]">
                Optimization Complete
              </h3>
              <p className="text-xs text-[#15803D] mt-0.5">
                The floor plan now satisfies all plot boundary and setback rules.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onGenerate2D}
            className="btn-primary shrink-0"
          >
            <span>Proceed to 2D Blueprint</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Impossible Layout Banner */}
      {isExhaustedImpossible && (
        <div className="bg-[#FEF2F2] border border-[#FCA5A5] rounded-xl p-5 space-y-2">
          <div className="flex items-center gap-2.5 text-[#DC2626] font-bold text-sm">
            <AlertTriangle className="w-4 h-4" />
            <span>Plot Limit Reached</span>
          </div>
          <p className="text-xs text-[#7F1D1D] leading-relaxed">
            The requested spatial program exceeds the maximum allowable buildable envelope. Consider reducing room dimensions, removing optional rooms, or adding a second floor level.
          </p>
        </div>
      )}

      {/* Recommendation Cards List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
          <div className="flex items-center gap-2.5">
            <SlidersHorizontal className="w-4 h-4 text-[#2563EB]" />
            <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-[#0F172A]">
              Actionable Recommendations ({suggestions.length})
            </h3>
          </div>

          <button
            type="button"
            onClick={onRevalidate}
            className="text-[11px] font-mono font-bold text-[#64748B] hover:text-[#0F172A] flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Re-evaluate</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {suggestions.map((sug) => {
            const isAccepted = sug.status === 'accepted';
            const isRejected = sug.status === 'rejected';

            return (
              <div
                key={sug.id}
                className={`bg-[#FFFFFF] border rounded-xl p-5 space-y-4 transition-all shadow-xs ${
                  isAccepted
                    ? 'border-[#16A34A] ring-1 ring-[#16A34A]'
                    : isRejected
                    ? 'border-[#E2E8F0] opacity-40 grayscale'
                    : 'border-[#E2E8F0] hover:border-[#CBD5E1]'
                }`}
              >
                {/* Card Title & Issue */}
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-[#0F172A]">
                      {sug.roomName}
                    </h4>
                    <span className="text-[11px] text-[#64748B] block mt-0.5">
                      Proportional adjustment
                    </span>
                  </div>

                  <span className="text-[10px] font-bold text-[#2563EB] bg-[#EFF6FF] px-2 py-0.5 rounded border border-[#DBEAFE] font-mono">
                    Priority {sug.priority || 1}
                  </span>
                </div>

                {/* Clean Comparison Layout */}
                <div className="grid grid-cols-2 gap-3 text-xs bg-[#F8FAFC] p-3 rounded-lg border border-[#E2E8F0]">
                  <div>
                    <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block font-mono mb-1">
                      Current
                    </span>
                    <div className="font-mono text-xs font-bold text-[#0F172A]">
                      {sug.currentLength} × {sug.currentBreadth} ft
                    </div>
                    <div className="text-[10px] text-[#64748B] font-mono mt-0.5">
                      {sug.currentArea} sq.ft
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-[#2563EB] uppercase tracking-wider block font-mono mb-1">
                      Optimized
                    </span>
                    <div className="font-mono text-xs font-bold text-[#2563EB]">
                      {sug.suggestedLength} × {sug.suggestedBreadth} ft
                    </div>
                    <div className="text-[10px] text-[#2563EB] font-mono mt-0.5 font-bold">
                      {sug.suggestedArea} sq.ft
                    </div>
                  </div>
                </div>

                {/* Expected Improvement & Reason */}
                <div className="text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[#64748B]">Recovered Area:</span>
                    <span className="font-bold text-[#16A34A] font-mono bg-[#DCFCE7] px-2 py-0.5 rounded border border-[#BBF7D0]">
                      +{sug.areaSaved} sq.ft
                    </span>
                  </div>
                  <p className="text-[11px] text-[#64748B] leading-relaxed">
                    {sug.reason}
                  </p>
                </div>

                {/* Accept / Reject Buttons */}
                <div className="flex items-center gap-2 pt-2 border-t border-[#F1F5F9]">
                  <button
                    type="button"
                    onClick={() => onAcceptSuggestion(sug.id)}
                    disabled={isAccepted}
                    className={`flex-1 py-2 px-3 text-xs font-bold flex items-center justify-center gap-1.5 rounded-lg transition-colors cursor-pointer ${
                      isAccepted
                        ? 'bg-[#16A34A] text-white'
                        : 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{isAccepted ? 'Applied' : 'Accept'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onRejectSuggestion(sug.id)}
                    disabled={isRejected}
                    className="py-2 px-3 bg-[#FFFFFF] hover:bg-[#F8FAFC] text-[#64748B] hover:text-[#0F172A] border border-[#E2E8F0] text-xs font-bold rounded-lg flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
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
          onClick={onGenerate2D}
          disabled={!isValid && remainingExcess > 0}
          className="btn-primary"
        >
          <span>Generate 2D Blueprint</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

