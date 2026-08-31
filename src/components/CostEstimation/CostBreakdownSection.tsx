import React from 'react';

interface CostBreakdownSectionProps {
  totalCostINR: number;
}

interface BreakdownItem {
  name: string;
  category: string;
  sharePercent: number;
}

export const CostBreakdownSection: React.FC<CostBreakdownSectionProps> = ({
  totalCostINR,
}) => {
  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 0,
    }).format(val);
  };

  const itemsConfig: BreakdownItem[] = [
    { name: 'Cement', category: 'Structural Material', sharePercent: 16.4 },
    { name: 'Steel', category: 'Structural Material', sharePercent: 14.2 },
    { name: 'Sand', category: 'Structural Material', sharePercent: 7.2 },
    { name: 'Aggregate', category: 'Structural Material', sharePercent: 4.8 },
    { name: 'Bricks / Blocks', category: 'Masonry', sharePercent: 6.2 },
    { name: 'Flooring & Tiles', category: 'Finishes', sharePercent: 8.0 },
    { name: 'Doors & Windows', category: 'Joinery & Openings', sharePercent: 6.5 },
    { name: 'Electrical', category: 'MEP Works', sharePercent: 5.5 },
    { name: 'Plumbing & Sanitary', category: 'MEP Works', sharePercent: 5.0 },
    { name: 'Painting', category: 'Finishes', sharePercent: 4.2 },
    { name: 'Labour', category: 'Trade Labour', sharePercent: 15.0 },
    { name: 'Other Construction Costs', category: 'Overheads & Contingency', sharePercent: 7.0 },
  ];

  // Calculate exact INR allocation and reconcile rounding
  let runningSum = 0;
  const rows = itemsConfig.map((item, idx) => {
    let amount = Math.round(totalCostINR * (item.sharePercent / 100));
    if (idx === itemsConfig.length - 1) {
      // Last row absorbs rounding difference to guarantee exact match with totalCostINR
      amount = totalCostINR - runningSum;
    } else {
      runningSum += amount;
    }

    return {
      ...item,
      amount,
    };
  });

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 lg:p-6 shadow-2xs space-y-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E2E8F0] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-[#0F172A] font-sans">
              Construction Cost Breakdown
            </h3>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#475569] bg-[#F1F5F9] px-2 py-0.5 rounded border border-[#E2E8F0]">
              Indicative Construction Cost Breakdown
            </span>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Component-wise allocation of materials, trade labour, and auxiliary construction overheads for the current generated blueprint.
          </p>
        </div>

        <div className="text-right shrink-0">
          <span className="text-[10px] uppercase font-mono text-[#64748B] block">Total Allocation</span>
          <span className="text-sm font-bold font-mono text-[#0F172A]">₹ {formatINR(totalCostINR)}</span>
        </div>
      </div>

      {/* Breakdown Table */}
      <div className="overflow-x-auto border border-[#E2E8F0] rounded-lg">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[10px] uppercase font-mono text-[#64748B]">
            <tr>
              <th className="py-3 px-4">Component</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4 text-right">Estimated Cost (INR)</th>
              <th className="py-3 px-4 text-right">Share (%)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0]">
            {rows.map((row, idx) => (
              <tr key={`breakdown-${idx}`} className="hover:bg-[#F8FAFC] transition-colors">
                <td className="py-2.5 px-4 font-semibold text-[#0F172A]">
                  {row.name}
                </td>
                <td className="py-2.5 px-4 text-[#64748B] font-mono text-[11px]">
                  {row.category}
                </td>
                <td className="py-2.5 px-4 font-mono font-bold text-[#0F172A] text-right">
                  ₹ {formatINR(row.amount)}
                </td>
                <td className="py-2.5 px-4 font-mono text-right text-[#2563EB] font-semibold">
                  {row.sharePercent.toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-[#F8FAFC] border-t-2 border-[#CBD5E1] font-mono">
            <tr>
              <td colSpan={2} className="py-3.5 px-4 font-bold text-xs uppercase text-[#0F172A]">
                TOTAL ESTIMATED COST
              </td>
              <td className="py-3.5 px-4 font-black text-sm text-[#0F172A] text-right">
                ₹ {formatINR(totalCostINR)}
              </td>
              <td className="py-3.5 px-4 text-right font-black text-xs text-[#2563EB]">
                100.0%
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="text-[11px] text-[#64748B] bg-[#F8FAFC] border border-[#E2E8F0] p-2.5 rounded-lg">
        <span className="font-semibold text-[#0F172A]">Note: </span>
        This breakdown provides an indicative engineering allocation based on standard residential construction standards. It does not constitute a certified Bill of Quantities (BOQ).
      </div>
    </div>
  );
};
