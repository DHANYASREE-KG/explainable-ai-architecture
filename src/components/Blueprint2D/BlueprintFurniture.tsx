import React from 'react';
import { FurnitureItem } from '../../types';

interface BlueprintFurnitureProps {
  item: FurnitureItem;
  scale: number; // pixels per foot
  offsetX: number;
  offsetY: number;
  isSelected?: boolean;
  isEditable?: boolean;
  onSelect?: (id: string) => void;
}

export const BlueprintFurniture: React.FC<BlueprintFurnitureProps> = ({
  item,
  scale,
  offsetX,
  offsetY,
  isSelected,
  isEditable,
  onSelect,
}) => {
  const px = offsetX + item.x * scale;
  const py = offsetY + item.y * scale;
  const pw = item.width * scale;
  const ph = item.height * scale;
  const cx = px + pw / 2;
  const cy = py + ph / 2;

  const renderGraphic = () => {
    switch (item.type) {
      case 'sofa_3':
        return (
          <g fill="#0284C7" stroke="#0369A1" strokeWidth="1.5">
            {/* Main Sofa Body */}
            <rect x={-pw / 2} y={-ph / 2} width={pw} height={ph} rx={ph * 0.15} fill="#38BDF8" fillOpacity="0.25" />
            {/* Backrest */}
            <rect x={-pw / 2 + 2} y={-ph / 2 + 2} width={pw - 4} height={ph * 0.3} rx={2} fill="#0284C7" fillOpacity="0.4" />
            {/* Armrests */}
            <rect x={-pw / 2 + 2} y={-ph / 2 + 2} width={pw * 0.12} height={ph - 4} rx={2} fill="#0284C7" fillOpacity="0.5" />
            <rect x={pw / 2 - pw * 0.12 - 2} y={-ph / 2 + 2} width={pw * 0.12} height={ph - 4} rx={2} fill="#0284C7" fillOpacity="0.5" />
            {/* 3 Cushions */}
            <rect x={-pw * 0.35} y={-ph * 0.15} width={pw * 0.22} height={ph * 0.55} rx={2} fill="#E0F2FE" />
            <rect x={-pw * 0.11} y={-ph * 0.15} width={pw * 0.22} height={ph * 0.55} rx={2} fill="#E0F2FE" />
            <rect x={pw * 0.13} y={-ph * 0.15} width={pw * 0.22} height={ph * 0.55} rx={2} fill="#E0F2FE" />
          </g>
        );

      case 'sofa_2':
        return (
          <g fill="#0284C7" stroke="#0369A1" strokeWidth="1.5">
            <rect x={-pw / 2} y={-ph / 2} width={pw} height={ph} rx={ph * 0.15} fill="#38BDF8" fillOpacity="0.25" />
            <rect x={-pw / 2 + 2} y={-ph / 2 + 2} width={pw - 4} height={ph * 0.3} rx={2} fill="#0284C7" fillOpacity="0.4" />
            <rect x={-pw / 2 + 2} y={-ph / 2 + 2} width={pw * 0.14} height={ph - 4} rx={2} fill="#0284C7" fillOpacity="0.5" />
            <rect x={pw / 2 - pw * 0.14 - 2} y={-ph / 2 + 2} width={pw * 0.14} height={ph - 4} rx={2} fill="#0284C7" fillOpacity="0.5" />
            <rect x={-pw * 0.32} y={-ph * 0.15} width={pw * 0.3} height={ph * 0.55} rx={2} fill="#E0F2FE" />
            <rect x={pw * 0.02} y={-ph * 0.15} width={pw * 0.3} height={ph * 0.55} rx={2} fill="#E0F2FE" />
          </g>
        );

      case 'chair':
        return (
          <g stroke="#0369A1" strokeWidth="1.5">
            <circle cx={0} cy={0} r={Math.min(pw, ph) * 0.45} fill="#E0F2FE" fillOpacity="0.8" />
            <path d={`M ${-pw * 0.35} ${-ph * 0.1} A ${pw * 0.35} ${ph * 0.35} 0 0 1 ${pw * 0.35} ${-ph * 0.1}`} fill="none" stroke="#0284C7" strokeWidth="3" />
            <rect x={-pw * 0.25} y={-ph * 0.1} width={pw * 0.5} height={ph * 0.4} rx={3} fill="#0284C7" fillOpacity="0.3" />
          </g>
        );

      case 'tv':
        return (
          <g stroke="#0F172A" strokeWidth="1.5">
            <rect x={-pw / 2} y={-ph / 2} width={pw} height={ph} rx={2} fill="#334155" />
            <rect x={-pw * 0.45} y={-ph * 0.2} width={pw * 0.9} height={ph * 0.4} fill="#0F172A" />
            <line x1={-pw * 0.4} y1={0} x2={pw * 0.4} y2={0} stroke="#38BDF8" strokeWidth="2" />
          </g>
        );

      case 'rug':
        return (
          <g stroke="#94A3B8" strokeWidth="1" strokeDasharray="3,2">
            <rect x={-pw / 2} y={-ph / 2} width={pw} height={ph} rx={4} fill="#F1F5F9" fillOpacity="0.8" />
            <rect x={-pw / 2 + 4} y={-ph / 2 + 4} width={pw - 8} height={ph - 8} rx={2} fill="none" stroke="#CBD5E1" strokeWidth="1" />
          </g>
        );

      case 'bed_queen':
        return (
          <g stroke="#0284C7" strokeWidth="1.5">
            {/* Bedframe */}
            <rect x={-pw / 2} y={-ph / 2} width={pw} height={ph} rx={3} fill="#FFFFFF" />
            {/* Headboard */}
            <rect x={-pw / 2} y={-ph / 2} width={pw} height={ph * 0.15} fill="#0369A1" rx={1} />
            {/* Pillows */}
            <rect x={-pw * 0.4} y={-ph * 0.32} width={pw * 0.35} height={ph * 0.22} rx={2} fill="#E0F2FE" />
            <rect x={pw * 0.05} y={-ph * 0.32} width={pw * 0.35} height={ph * 0.22} rx={2} fill="#E0F2FE" />
            {/* Duvet / Blanket */}
            <rect x={-pw * 0.45} y={-ph * 0.05} width={pw * 0.9} height={ph * 0.5} rx={2} fill="#BAE6FD" fillOpacity="0.5" />
            <line x1={-pw * 0.45} y1={-ph * 0.05} x2={pw * 0.45} y2={-ph * 0.05} stroke="#0284C7" strokeWidth="1.5" />
          </g>
        );

      case 'plant_floor':
        return (
          <g stroke="#15803D" strokeWidth="1.5">
            <circle cx={0} cy={0} r={Math.min(pw, ph) * 0.45} fill="#86EFAC" fillOpacity="0.6" />
            <circle cx={0} cy={0} r={Math.min(pw, ph) * 0.2} fill="#166534" />
            <path d={`M 0 0 Q ${-pw * 0.3} ${-ph * 0.3} ${-pw * 0.4} 0`} fill="none" stroke="#15803D" strokeWidth="1.5" />
            <path d={`M 0 0 Q ${pw * 0.3} ${-ph * 0.3} ${pw * 0.4} 0`} fill="none" stroke="#15803D" strokeWidth="1.5" />
            <path d={`M 0 0 Q ${-pw * 0.3} ${ph * 0.3} ${-pw * 0.4} 0`} fill="none" stroke="#15803D" strokeWidth="1.5" />
            <path d={`M 0 0 Q ${pw * 0.3} ${ph * 0.3} ${pw * 0.4} 0`} fill="none" stroke="#15803D" strokeWidth="1.5" />
          </g>
        );

      case 'plant_hanging':
        return (
          <g stroke="#16A34A" strokeWidth="1">
            <circle cx={0} cy={0} r={Math.min(pw, ph) * 0.4} fill="#BBF7D0" />
            <circle cx={0} cy={0} r={Math.min(pw, ph) * 0.15} fill="#15803D" />
            <line x1={-pw * 0.3} y1={-ph * 0.3} x2={pw * 0.3} y2={ph * 0.3} stroke="#16A34A" strokeDasharray="2,2" />
            <line x1={pw * 0.3} y1={-ph * 0.3} x2={-pw * 0.3} y2={ph * 0.3} stroke="#16A34A" strokeDasharray="2,2" />
          </g>
        );

      default:
        return <rect x={-pw / 2} y={-ph / 2} width={pw} height={ph} fill="#CBD5E1" rx={2} />;
    }
  };

  return (
    <g
      transform={`translate(${cx}, ${cy}) rotate(${item.rotation || 0})`}
      onClick={(e) => {
        e.stopPropagation();
        if (onSelect) onSelect(item.id);
      }}
      className={isEditable ? 'cursor-grab active:cursor-grabbing' : ''}
    >
      {renderGraphic()}
      {isSelected && (
        <rect
          x={-pw / 2 - 3}
          y={-ph / 2 - 3}
          width={pw + 6}
          height={ph + 6}
          fill="none"
          stroke="#0284C7"
          strokeWidth="1.5"
          strokeDasharray="4,2"
          rx={3}
        />
      )}
    </g>
  );
};
