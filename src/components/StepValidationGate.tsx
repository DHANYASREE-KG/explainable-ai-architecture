import React from 'react';
import { ValidationResult } from '../types';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileCode2,
  ArrowRight,
} from 'lucide-react';

interface StepValidationGateProps {
  validationResult: ValidationResult;
  onGenerate2D: () => void;
  isValid: boolean;
}

export const StepValidationGate: React.FC<StepValidationGateProps> = ({
  validationResult,
  onGenerate2D,
  isValid,
}) => {
  const passedCount = validationResult.rules.filter(
    (r) => r.status === 'passed'
  ).length;
  const totalCount = validationResult.rules.length;

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-4 animate-in fade-in duration-300">
      {/* Global Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-6 border-b border-[#E2E8F0]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#2563EB] bg-[#EFF6FF] px-2.5 py-0.5 rounded-md border border-[#DBEAFE]">
              COMPLIANCE AUDIT
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#0F172A] tracking-tight">
            Quality Verification
          </h2>
          <p className="text-sm text-[#64748B] mt-1 max-w-2xl">
            Architectural code compliance, circulation, boundary setbacks, and structural zoning check.
          </p>
        </div>

        <div
          className={`px-3.5 py-2 rounded-xl text-xs font-bold font-mono uppercase tracking-wider flex items-center gap-2 border shadow-2xs ${
            isValid
              ? 'bg-[#DCFCE7] text-[#15803D] border-[#BBF7D0]'
              : 'bg-[#FEF2F2] text-[#DC2626] border-[#FCA5A5]'
          }`}
        >
          {isValid ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
              <span>All Rules Passed</span>
            </>
          ) : (
            <>
              <AlertTriangle className="w-4 h-4 text-[#DC2626]" />
              <span>{totalCount - passedCount} Notice(s) Found</span>
            </>
          )}
        </div>
      </div>

      {/* Validation Rules Report Checklist */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
          <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider font-mono">
            Compliance Checklist
          </h3>
          <span className="text-xs text-[#64748B] font-mono font-semibold">
            {passedCount} of {totalCount} Passed
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3.5">
          {validationResult.rules.map((rule) => {
            const passed = rule.status === 'passed';

            return (
              <div
                key={rule.id}
                className={`p-5 rounded-xl border flex items-start gap-4 transition-all shadow-2xs ${
                  passed
                    ? 'bg-[#FFFFFF] border-[#E2E8F0] hover:border-[#CBD5E1]'
                    : 'bg-[#FEF2F2]/40 border-[#FCA5A5]'
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {passed ? (
                    <div className="w-6 h-6 rounded-full bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-[#FEE2E2] text-[#DC2626] flex items-center justify-center">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-3">
                    <h4 className="font-bold text-[#0F172A] text-sm">
                      {rule.title}
                    </h4>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md font-mono shrink-0 ${
                        passed
                          ? 'bg-[#DCFCE7] text-[#15803D]'
                          : 'bg-[#FEE2E2] text-[#DC2626]'
                      }`}
                    >
                      {rule.status}
                    </span>
                  </div>
                  <p className="text-xs text-[#64748B] leading-relaxed">
                    {rule.description}
                  </p>
                  {rule.details && (
                    <p className="text-[11px] text-[#475569] pt-1.5 border-t border-[#F1F5F9] font-mono">
                      {rule.details}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Button Gate */}
      <div className="pt-6 border-t border-[#E2E8F0] flex items-center justify-between">
        <div className="text-xs text-[#64748B]">
          {isValid
            ? 'All architectural and boundary rules passed.'
            : 'Review notices before proceeding.'}
        </div>

        <button
          type="button"
          onClick={onGenerate2D}
          disabled={!isValid}
          className="btn-primary"
        >
          <FileCode2 className="w-4 h-4" />
          <span>Generate 2D CAD Blueprint</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

