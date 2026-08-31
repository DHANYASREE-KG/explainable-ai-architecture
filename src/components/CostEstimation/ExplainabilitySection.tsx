import React, { useState } from 'react';
import { FeatureImportanceFactor } from '../../types/costEstimation';
import {
  Sparkles,
  HelpCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';

interface ExplainabilitySectionProps {
  featureImportance: FeatureImportanceFactor[];
  summary: {
    dominantCostDriver: string;
    cityFactorImpact: string;
    qualityImpact: string;
    inflationImpact: string;
  };
}

export const ExplainabilitySection: React.FC<ExplainabilitySectionProps> = ({
  featureImportance,
  summary,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  const chartData = featureImportance.map((f) => ({
    name: f.featureName.split('(')[0].trim(),
    fullName: f.featureName,
    importance: f.importancePercentage,
    explanation: f.explanation,
    direction: f.impactDirection,
  }));

  const getImpactBadge = (direction: 'increases_cost' | 'decreases_cost' | 'neutral') => {
    if (direction === 'increases_cost') {
      return (
        <span className="text-[9px] font-mono font-bold bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA] px-1.5 py-0.2 rounded flex items-center gap-1">
          <TrendingUp className="w-2.5 h-2.5" /> +Cost Driver
        </span>
      );
    } else if (direction === 'decreases_cost') {
      return (
        <span className="text-[9px] font-mono font-bold bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0] px-1.5 py-0.2 rounded flex items-center gap-1">
          <TrendingDown className="w-2.5 h-2.5" /> -Cost Saver
        </span>
      );
    }
    return (
      <span className="text-[9px] font-mono font-bold bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0] px-1.5 py-0.2 rounded flex items-center gap-1">
        <Minus className="w-2.5 h-2.5" /> Baseline
      </span>
    );
  };

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 lg:p-7 shadow-xs space-y-5">
      <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#F5F3FF] border border-[#DDD6FE] text-[#7C3AED] flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-[#0F172A] font-sans">
                Explainable AI: Why This Cost Estimate?
              </h3>
              <span className="px-2 py-0.2 bg-[#F5F3FF] text-[#7C3AED] text-[10px] font-mono font-bold uppercase rounded">
                Gini Feature Weights
              </span>
            </div>
            <p className="text-xs text-[#64748B] mt-0.5">
              Trained XGBoost model feature importance analysis and primary decision drivers.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1.5 text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] rounded transition-colors cursor-pointer"
        >
          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-6">
          {/* Natural Language Insights Summary Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
              <div className="text-[10px] font-mono uppercase text-[#2563EB] font-bold">
                1. Dominant Scale Driver
              </div>
              <p className="text-xs text-[#0F172A] font-medium mt-1">
                {summary.dominantCostDriver}
              </p>
            </div>

            <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
              <div className="text-[10px] font-mono uppercase text-[#2563EB] font-bold">
                2. Quality Specification Driver
              </div>
              <p className="text-xs text-[#0F172A] font-medium mt-1">
                {summary.qualityImpact}
              </p>
            </div>

            <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
              <div className="text-[10px] font-mono uppercase text-[#2563EB] font-bold">
                3. Geographic Factor
              </div>
              <p className="text-xs text-[#0F172A] font-medium mt-1">
                {summary.cityFactorImpact}
              </p>
            </div>

            <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
              <div className="text-[10px] font-mono uppercase text-[#2563EB] font-bold">
                4. Inflation Trajectory
              </div>
              <p className="text-xs text-[#0F172A] font-medium mt-1">
                {summary.inflationImpact}
              </p>
            </div>
          </div>

          {/* Feature Importance Horizontal Chart */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-[#0F172A] font-mono uppercase tracking-wider">
              XGBoost Relative Feature Importance Weights
            </div>

            <div className="h-64 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                >
                  <XAxis
                    type="number"
                    unit="%"
                    tick={{ fontSize: 10, fill: '#64748B' }}
                    domain={[0, 40]}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#0F172A', fontWeight: 600 }}
                    width={110}
                  />
                  <Tooltip
                    formatter={(val: number) => [`${val}%`, 'Relative Importance Weight']}
                    contentStyle={{ backgroundColor: '#0F172A', color: '#FFFFFF', borderRadius: '8px', fontSize: '12px' }}
                    itemStyle={{ color: '#FFFFFF' }}
                  />
                  <Bar dataKey="importance" radius={[0, 4, 4, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={index === 0 ? '#2563EB' : index === 1 ? '#3B82F6' : index === 2 ? '#60A5FA' : '#93C5FD'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Detailed Feature Explanations List */}
          <div className="divide-y divide-[#E2E8F0] border border-[#E2E8F0] rounded-lg">
            {featureImportance.map((f, idx) => (
              <div key={`feat-${idx}`} className="p-3 hover:bg-[#F8FAFC] transition-colors text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#0F172A] font-sans">{f.featureName}</span>
                    {getImpactBadge(f.impactDirection)}
                  </div>
                  <p className="text-[#64748B] text-[11px] leading-relaxed">
                    {f.explanation}
                  </p>
                </div>
                <div className="shrink-0 text-right font-mono font-bold text-[#0F172A] text-sm sm:pl-4">
                  {f.importancePercentage}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
