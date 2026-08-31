import React from 'react';
import { ValidationTestSample } from '../../types/costEstimation';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { Award, Info } from 'lucide-react';

interface ModelPerformanceSectionProps {
  testSamples?: ValidationTestSample[];
}

export const ModelPerformanceSection: React.FC<ModelPerformanceSectionProps> = ({
  testSamples = [],
}) => {
  // Clean formatted data for the chart from the real validation test samples
  const chartData = testSamples.map((s, idx) => ({
    name: `Sample ${idx + 1}`,
    actual: s.actualCostLakhs,
    predicted: s.predictedCostLakhs,
  }));

  return (
    <div className="space-y-6">
      {/* 1. Historical Model Performance Card */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 lg:p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E2E8F0] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#0F172A] font-sans">
                Historical Model Performance
              </h3>
              <p className="text-xs text-[#64748B]">
                Performance of the trained XGBoost regression model on unseen validation data.
              </p>
            </div>
          </div>

          <div className="text-[11px] font-mono text-[#2563EB] bg-[#EFF6FF] px-2.5 py-1 rounded-md self-start sm:self-auto font-medium">
            Historical Validation
          </div>
        </div>

        {/* 4 Clean Metric Cards: Algorithm, R², MAPE, MAPE-derived Accuracy */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Metric 1: Algorithm */}
          <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg space-y-1">
            <div className="text-[10px] font-mono uppercase text-[#64748B] font-semibold">
              Algorithm
            </div>
            <div className="text-base font-bold text-[#0F172A] font-sans">
              XGBoost Regressor
            </div>
            <div className="text-[11px] text-[#64748B]">
              Gradient boosted trees
            </div>
          </div>

          {/* Metric 2: R² Score */}
          <div className="p-3.5 bg-[#EFF6FF] border border-[#DBEAFE] rounded-lg space-y-1">
            <div className="text-[10px] font-mono uppercase text-[#1E40AF] font-bold">
              R² Score
            </div>
            <div className="text-2xl font-black text-[#1D4ED8] font-mono">
              85.79%
            </div>
            <div className="text-[11px] text-[#1E40AF] font-mono">
              R² = 0.8579 (Variance fit)
            </div>
          </div>

          {/* Metric 3: MAPE */}
          <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg space-y-1">
            <div className="text-[10px] font-mono uppercase text-[#475569] font-bold">
              MAPE
            </div>
            <div className="text-2xl font-black text-[#0F172A] font-mono">
              12.38%
            </div>
            <div className="text-[11px] text-[#64748B]">
              Mean relative error
            </div>
          </div>

          {/* Metric 4: MAPE-derived Accuracy */}
          <div className="p-3.5 bg-[#F0FDF4] border border-[#DCFCE7] rounded-lg space-y-1">
            <div className="text-[10px] font-mono uppercase text-[#166534] font-bold">
              MAPE-derived Accuracy
            </div>
            <div className="text-2xl font-black text-[#15803D] font-mono">
              87.62%
            </div>
            <div className="text-[11px] text-[#166534]">
              100 − MAPE
            </div>
          </div>
        </div>

        {/* Accuracy Disclaimer Note */}
        <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs text-[#475569] flex items-start gap-2.5">
          <Info className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-[#0F172A]">Historical validation performance: </span>
            MAPE-derived accuracy represents historical model validation performance and does not guarantee the exact final construction cost.
          </div>
        </div>
      </div>

      {/* 2. Actual vs Predicted Graph */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 lg:p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E2E8F0] pb-3">
          <div>
            <h3 className="text-base font-bold text-[#0F172A] font-sans">
              Actual vs Predicted Construction Cost
            </h3>
            <p className="text-xs text-[#64748B]">
              XGBoost validation performance on unseen test data (values in ₹ Lakhs).
            </p>
          </div>
          <span className="text-[11px] font-mono text-[#64748B] bg-[#F8FAFC] border border-[#E2E8F0] px-2.5 py-1 rounded-md self-start sm:self-auto">
            Validation Test Samples
          </span>
        </div>

        <div className="h-64 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-3">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 15, right: 20, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: '#475569' }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#475569' }}
                unit="L"
              />
              <Tooltip
                formatter={(val: number, name: string) => [
                  `₹ ${Number(val).toFixed(2)} Lakhs`,
                  name === 'actual' ? 'Actual Construction Cost' : 'Predicted Cost',
                ]}
                labelFormatter={(label) => `Validation ${label}`}
                contentStyle={{
                  backgroundColor: '#0F172A',
                  color: '#FFFFFF',
                  borderRadius: '8px',
                  fontSize: '12px',
                  border: 'none',
                }}
                itemStyle={{ color: '#FFFFFF' }}
              />
              <Legend
                formatter={(value) => (
                  <span className="text-xs font-mono font-medium text-[#0F172A]">
                    {value === 'actual' ? 'Actual Construction Cost' : 'Predicted Cost'}
                  </span>
                )}
              />
              <Bar dataKey="actual" name="actual" fill="#0F2747" radius={[4, 4, 0, 0]} maxBarSize={36} />
              <Bar dataKey="predicted" name="predicted" fill="#2563EB" radius={[4, 4, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
