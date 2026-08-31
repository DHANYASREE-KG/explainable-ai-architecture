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
import { ShieldCheck, Table as TableIcon, LineChart as ChartIcon } from 'lucide-react';

interface ModelValidationSectionProps {
  testSamples: ValidationTestSample[];
}

export const ModelValidationSection: React.FC<ModelValidationSectionProps> = ({
  testSamples,
}) => {
  const chartData = testSamples.map((s) => ({
    name: s.projectName.replace(' Residence', '').replace(' Villa', ''),
    shortName: s.sampleId,
    actual: s.actualCostLakhs,
    predicted: s.predictedCostLakhs,
    error: s.percentageError,
    area: s.builtupAreaSqft,
    city: s.city,
    quality: s.quality,
  }));

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 lg:p-7 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#E2E8F0] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-[#EFF6FF] text-[#2563EB] text-[10px] font-mono font-bold uppercase tracking-wider rounded">
              Model Validation
            </span>
            <span className="px-2 py-0.5 bg-[#F0FDF4] text-[#166534] text-[10px] font-mono font-bold uppercase tracking-wider rounded">
              Holdout Test Evaluation
            </span>
          </div>
          <h3 className="text-base font-bold text-[#0F172A] font-sans mt-1">
            Actual vs Predicted Construction Cost
          </h3>
          <p className="text-xs text-[#64748B] mt-0.5">
            Holdout test sample evaluations demonstrating the trained XGBoost model's empirical prediction performance.
          </p>
        </div>

        <div className="text-[11px] font-mono text-[#16A34A] bg-[#F0FDF4] border border-[#BBF7D0] px-3 py-1 rounded-lg font-bold">
          Batch Mean Absolute % Error: 5.92%
        </div>
      </div>

      {/* Actual vs Predicted Graph */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-mono text-[#64748B]">
          <span>Cost Comparison in ₹ Lakhs (Unseen Holdout Validation Split)</span>
          <span className="text-[#2563EB]">Blue = Predicted • Dark Navy = Actual</span>
        </div>

        <div className="h-72 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 15, right: 20, left: 0, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: '#475569' }}
                interval={0}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#475569' }}
                unit="L"
              />
              <Tooltip
                formatter={(val: number, name: string) => [
                  `₹ ${Number(val).toFixed(2)} Lakhs`,
                  name === 'actual' ? 'Actual Ground Truth' : 'XGBoost Predicted',
                ]}
                labelFormatter={(label) => `Test Sample: ${label}`}
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
                    {value === 'actual' ? 'Actual Construction Cost (Ground Truth)' : 'XGBoost Predicted Cost'}
                  </span>
                )}
              />
              <Bar dataKey="actual" name="actual" fill="#0F2747" radius={[4, 4, 0, 0]} maxBarSize={32} />
              <Bar dataKey="predicted" name="predicted" fill="#2563EB" radius={[4, 4, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Actual vs Predicted Detailed Test Samples Table */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-[#0F172A] font-sans">
          <TableIcon className="w-3.5 h-3.5 text-[#2563EB]" />
          <span>Holdout Validation Test Samples (Ground Truth vs Model Output)</span>
        </div>

        <div className="overflow-x-auto border border-[#E2E8F0] rounded-lg">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[10px] uppercase font-mono text-[#64748B]">
              <tr>
                <th className="py-2.5 px-3">Project Sample</th>
                <th className="py-2.5 px-3">City & Tier</th>
                <th className="py-2.5 px-3">Built-up Area</th>
                <th className="py-2.5 px-3 text-right">Actual Cost</th>
                <th className="py-2.5 px-3 text-right">XGBoost Predicted</th>
                <th className="py-2.5 px-3 text-right">Absolute Error</th>
                <th className="py-2.5 px-3 text-right">% Error</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {testSamples.map((sample) => (
                <tr key={`sample-${sample.sampleId}`} className="hover:bg-[#F8FAFC] transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-[#0F172A]">
                    <div>{sample.projectName}</div>
                    <div className="text-[10px] text-[#64748B] font-mono">{sample.sampleId}</div>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="font-semibold text-[#0F172A]">{sample.city}</span>
                    <span className="text-[10px] text-[#64748B] block font-mono">{sample.quality} Tier</span>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[#475569]">
                    {(sample?.builtupAreaSqft ?? 0).toLocaleString()} sq.ft ({sample?.floors ?? 1}F)
                  </td>
                  <td className="py-2.5 px-3 font-mono font-semibold text-[#0F172A] text-right">
                    ₹ {sample.actualCostLakhs.toFixed(2)} L
                  </td>
                  <td className="py-2.5 px-3 font-mono font-bold text-[#2563EB] text-right">
                    ₹ {sample.predictedCostLakhs.toFixed(2)} L
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[#475569] text-right">
                    ₹ {sample.absoluteErrorLakhs.toFixed(2)} L
                  </td>
                  <td className="py-2.5 px-3 font-mono text-right font-semibold text-[#16A34A]">
                    {sample.percentageError.toFixed(2)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
