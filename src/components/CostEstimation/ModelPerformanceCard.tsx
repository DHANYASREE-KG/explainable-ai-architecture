import React from 'react';
import { ModelValidationMetrics } from '../../types/costEstimation';
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Award,
} from 'lucide-react';

interface ModelPerformanceCardProps {
  metrics: ModelValidationMetrics;
}

export const ModelPerformanceCard: React.FC<ModelPerformanceCardProps> = ({ metrics }) => {
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 lg:p-6 shadow-xs space-y-4">
      {/* Header with explicit distinction */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#E2E8F0] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F2747] flex items-center justify-center">
            <Award className="w-4 h-4 text-[#2563EB]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#0F172A] font-sans">
                Historical Model Performance
              </h3>
              <span className="px-2 py-0.5 bg-[#F1F5F9] text-[#475569] text-[10px] font-mono font-bold uppercase rounded">
                Validation Benchmark
              </span>
            </div>
            <div className="text-[11px] text-[#64748B] font-mono">
              Evaluated on 1,000 empirical residential construction records using chronological holdout splits
            </div>
          </div>
        </div>

        <div className="text-[10px] font-mono text-[#64748B] bg-[#F8FAFC] border border-[#E2E8F0] px-2.5 py-1 rounded">
          Algorithm: XGBoost Regressor
        </div>
      </div>

      {/* 4 Core Benchmark Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Metric 1: Accuracy (100 - MAPE) */}
        <div className="p-3.5 bg-[#F0FDF4] border border-[#DCFCE7] rounded-lg">
          <div className="flex items-center justify-between text-[10px] font-mono uppercase text-[#166534] font-semibold">
            <span>MAPE-derived Accuracy</span>
            <span className="text-[9px] bg-[#DCFCE7] px-1.5 py-0.2 rounded text-[#15803D] font-bold">100 − MAPE</span>
          </div>
          <div className="text-2xl lg:text-3xl font-black text-[#15803D] font-mono mt-1">
            {metrics.accuracyScorePercent}%
          </div>
          <div className="text-[11px] text-[#166534] mt-0.5">
            Validation test performance
          </div>
        </div>

        {/* Metric 2: R² Score */}
        <div className="p-3.5 bg-[#EFF6FF] border border-[#DBEAFE] rounded-lg">
          <div className="flex items-center justify-between text-[10px] font-mono uppercase text-[#1E40AF] font-semibold">
            <span>R² Score</span>
            <span className="text-[9px] bg-[#DBEAFE] px-1.5 py-0.2 rounded text-[#1D4ED8] font-bold">Variance Fit</span>
          </div>
          <div className="text-2xl lg:text-3xl font-black text-[#1D4ED8] font-mono mt-1">
            {metrics.r2ScorePercent}%
          </div>
          <div className="text-[11px] text-[#1E40AF] mt-0.5 font-mono">
            R² = {metrics.r2Score.toFixed(4)}
          </div>
        </div>

        {/* Metric 3: MAPE Error */}
        <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
          <div className="flex items-center justify-between text-[10px] font-mono uppercase text-[#475569] font-semibold">
            <span>Mean Absolute % Error</span>
            <span className="text-[9px] bg-[#E2E8F0] px-1.5 py-0.2 rounded text-[#475569] font-bold">MAPE</span>
          </div>
          <div className="text-2xl lg:text-3xl font-black text-[#0F172A] font-mono mt-1">
            {metrics.mapePercent}%
          </div>
          <div className="text-[11px] text-[#64748B] mt-0.5">
            Holdout test evaluation
          </div>
        </div>

        {/* Metric 4: Absolute Errors MAE / RMSE */}
        <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
          <div className="flex items-center justify-between text-[10px] font-mono uppercase text-[#475569] font-semibold">
            <span>Absolute Errors</span>
            <span className="text-[9px] bg-[#E2E8F0] px-1.5 py-0.2 rounded text-[#475569] font-bold">MAE / RMSE</span>
          </div>
          <div className="text-xl lg:text-2xl font-black text-[#0F172A] font-mono mt-1">
            ₹{metrics.maeLakhs}L
          </div>
          <div className="text-[11px] text-[#64748B] mt-0.5 font-mono">
            RMSE: ₹{metrics.rmseLakhs} Lakhs
          </div>
        </div>
      </div>

      {/* Mandatory Accuracy Disclaimer */}
      <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs text-[#475569] flex items-start gap-2.5">
        <CheckCircle2 className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-[#0F172A]">Historical Validation Note: </span>
          The reported accuracy is derived from the model's historical MAPE and represents validation performance. It does not guarantee the exact final construction cost.
        </div>
      </div>
    </div>
  );
};
