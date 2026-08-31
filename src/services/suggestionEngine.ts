import { AISuggestion, AreaMetrics, LandDetails, RoomRequirement, ValidationResult } from '../types';
import { calculateAreaMetrics, calculateRoomArea } from './areaCalculator';

export interface RoomStandard {
  priority: 1 | 2 | 3 | 4 | 5;
  priorityLabel: string;
  minL: number;
  minB: number;
  minArea: number;
  stepL: number;
  stepB: number;
}

/**
 * Architectural standard definition and priority categorization
 * Follows strict architectural hierarchy:
 * Priority 1: Garden, Balcony, Sitout, Veranda, Parking
 * Priority 2: Dining, Study, Office, Laundry, Utility, Store Room, Prayer Room
 * Priority 3: Secondary Bedrooms, Guest Rooms
 * Priority 4: Master Bedroom
 * Priority 5: Living Room, Kitchen, Bathrooms
 */
export function getRoomStandard(roomName: string, category?: string): RoomStandard {
  const name = roomName.toLowerCase();

  // -------------------------------------------------------------------------
  // PRIORITY 1: Garden, Balcony, Sitout, Veranda, Parking
  // -------------------------------------------------------------------------
  if (
    name.includes('garden') ||
    name.includes('lawn') ||
    name.includes('landscape') ||
    name.includes('yard')
  ) {
    return {
      priority: 1,
      priorityLabel: 'Priority 1: Outdoor Amenity',
      minL: 8,
      minB: 6,
      minArea: 48,
      stepL: 1.0,
      stepB: 1.0,
    };
  }

  if (
    name.includes('balcony') ||
    name.includes('sitout') ||
    name.includes('sit-out') ||
    name.includes('veranda') ||
    name.includes('verandah') ||
    name.includes('terrace') ||
    name.includes('patio') ||
    name.includes('deck')
  ) {
    return {
      priority: 1,
      priorityLabel: 'Priority 1: Outdoor Amenity & Extension',
      minL: 6,
      minB: 4,
      minArea: 24,
      stepL: 1.0,
      stepB: 0.5,
    };
  }

  if (
    name.includes('parking') ||
    name.includes('garage') ||
    name.includes('car') ||
    name.includes('portico')
  ) {
    return {
      priority: 1,
      priorityLabel: 'Priority 1: Vehicular Parking Extension',
      minL: 12,
      minB: 8,
      minArea: 96,
      stepL: 1.0,
      stepB: 1.0,
    };
  }

  // -------------------------------------------------------------------------
  // PRIORITY 2: Dining, Study, Office, Laundry, Utility, Store Room, Prayer
  // -------------------------------------------------------------------------
  if (name.includes('dining') || name.includes('breakfast')) {
    return {
      priority: 2,
      priorityLabel: 'Priority 2: Ancillary Social Space',
      minL: 9,
      minB: 8,
      minArea: 72,
      stepL: 1.0,
      stepB: 0.5,
    };
  }

  if (name.includes('study') || name.includes('office') || name.includes('work')) {
    return {
      priority: 2,
      priorityLabel: 'Priority 2: Ancillary Study / Workspace',
      minL: 8,
      minB: 7,
      minArea: 56,
      stepL: 1.0,
      stepB: 0.5,
    };
  }

  if (name.includes('laundry') || name.includes('utility') || name.includes('wash')) {
    return {
      priority: 2,
      priorityLabel: 'Priority 2: Utility & Service Space',
      minL: 6,
      minB: 4,
      minArea: 24,
      stepL: 0.5,
      stepB: 0.5,
    };
  }

  if (name.includes('store') || name.includes('pantry')) {
    return {
      priority: 2,
      priorityLabel: 'Priority 2: Storage Core',
      minL: 5,
      minB: 4,
      minArea: 20,
      stepL: 0.5,
      stepB: 0.5,
    };
  }

  if (name.includes('prayer') || name.includes('puja') || name.includes('pooja')) {
    return {
      priority: 2,
      priorityLabel: 'Priority 2: Dedicated Spiritual Space',
      minL: 5,
      minB: 4,
      minArea: 20,
      stepL: 0.5,
      stepB: 0.5,
    };
  }

  // -------------------------------------------------------------------------
  // PRIORITY 3: Secondary Bedrooms, Guest Rooms
  // -------------------------------------------------------------------------
  if (
    (name.includes('bedroom') && !name.includes('master')) ||
    name.includes('guest') ||
    name.includes('kid') ||
    name.includes('children')
  ) {
    return {
      priority: 3,
      priorityLabel: 'Priority 3: Secondary Bedroom',
      minL: 10,
      minB: 9,
      minArea: 90,
      stepL: 1.0,
      stepB: 0.5,
    };
  }

  // -------------------------------------------------------------------------
  // PRIORITY 4: Master Bedroom
  // -------------------------------------------------------------------------
  if (name.includes('master')) {
    return {
      priority: 4,
      priorityLabel: 'Priority 4: Master Bedroom Suite',
      minL: 11,
      minB: 10,
      minArea: 110,
      stepL: 1.0,
      stepB: 0.5,
    };
  }

  // -------------------------------------------------------------------------
  // PRIORITY 5: Living Room, Kitchen, Bathrooms (Reduce only if essential)
  // -------------------------------------------------------------------------
  if (
    name.includes('living') ||
    name.includes('hall') ||
    name.includes('lounge') ||
    name.includes('drawing') ||
    name.includes('foyer')
  ) {
    return {
      priority: 5,
      priorityLabel: 'Priority 5: Essential Living Reception',
      minL: 12,
      minB: 10,
      minArea: 120,
      stepL: 1.0,
      stepB: 1.0,
    };
  }

  if (name.includes('kitchen') || name.includes('cook')) {
    return {
      priority: 5,
      priorityLabel: 'Priority 5: Culinary Core',
      minL: 8,
      minB: 7,
      minArea: 56,
      stepL: 1.0,
      stepB: 0.5,
    };
  }

  if (
    name.includes('bath') ||
    name.includes('toilet') ||
    name.includes('wc') ||
    name.includes('powder') ||
    name.includes('washroom')
  ) {
    const isAttached = name.includes('attached') || name.includes('ensuite');
    return {
      priority: 5,
      priorityLabel: isAttached ? 'Priority 5: Attached Bathroom' : 'Priority 5: Common Bathroom',
      minL: isAttached ? 5 : 5,
      minB: isAttached ? 4 : 4.5,
      minArea: isAttached ? 20 : 22.5,
      stepL: 0.5,
      stepB: 0.5,
    };
  }

  if (name.includes('stair') || name.includes('lift')) {
    return {
      priority: 5,
      priorityLabel: 'Priority 5: Structural Circulation',
      minL: 8,
      minB: 5,
      minArea: 40,
      stepL: 0.5,
      stepB: 0.5,
    };
  }

  // Fallback
  return {
    priority: 3,
    priorityLabel: 'Priority 3: General Living Space',
    minL: 8,
    minB: 8,
    minArea: 64,
    stepL: 1.0,
    stepB: 0.5,
  };
}

/**
 * Builds clear, professional architectural justification for room reductions
 */
function buildArchitecturalReason(
  roomName: string,
  priority: 1 | 2 | 3 | 4 | 5,
  currentW: number,
  currentH: number,
  sugW: number,
  sugH: number,
  saved: number
): string {
  const name = roomName.toLowerCase();

  if (name.includes('balcony') || name.includes('sitout') || name.includes('veranda') || name.includes('terrace')) {
    return `${roomName} size exceeds recommended residential standards. Reducing it from ${currentW} × ${currentH} ft to ${sugW} × ${sugH} ft preserves usability while recovering ${saved} sq.ft.`;
  }

  if (name.includes('garden') || name.includes('lawn')) {
    return `Outdoor landscape footprint optimized from ${currentW} × ${currentH} ft to ${sugW} × ${sugH} ft, retaining ample natural green cover while recovering ${saved} sq.ft.`;
  }

  if (name.includes('parking') || name.includes('garage')) {
    return `Parking area streamlined from ${currentW} × ${currentH} ft to ${sugW} × ${sugH} ft, preserving standard vehicular clearance and door swing clearance while recovering ${saved} sq.ft.`;
  }

  if (name.includes('dining')) {
    return `Dining space optimized from ${currentW} × ${currentH} ft to ${sugW} × ${sugH} ft, maintaining standard 6-seater dining table clearances while recovering ${saved} sq.ft.`;
  }

  if (name.includes('study') || name.includes('office')) {
    return `Workspace footprint adjusted from ${currentW} × ${currentH} ft to ${sugW} × ${sugH} ft, ensuring workstation desk, chair swing, and shelving clearances remain comfortable while recovering ${saved} sq.ft.`;
  }

  if (name.includes('utility') || name.includes('laundry') || name.includes('store') || name.includes('pantry')) {
    return `Utility/storage zone downscaled from ${currentW} × ${currentH} ft to ${sugW} × ${sugH} ft, maintaining appliance and aisle access while recovering ${saved} sq.ft.`;
  }

  if (name.includes('prayer') || name.includes('puja') || name.includes('pooja')) {
    return `Prayer space re-proportioned from ${currentW} × ${currentH} ft to ${sugW} × ${sugH} ft, preserving sanctum orientation while recovering ${saved} sq.ft.`;
  }

  if (name.includes('bedroom') && !name.includes('master')) {
    return `Secondary bedroom optimized from ${currentW} × ${currentH} ft to ${sugW} × ${sugH} ft, comfortably accommodating a double bed with standard wardrobe clearance and natural ventilation while recovering ${saved} sq.ft.`;
  }

  if (name.includes('master')) {
    return `Master bedroom suite trimmed from ${currentW} × ${currentH} ft to ${sugW} × ${sugH} ft, preserving king-size bed placement, dual bedside tables, wardrobe access, and ventilation while recovering ${saved} sq.ft.`;
  }

  if (name.includes('living') || name.includes('hall')) {
    return `Living room adjusted from ${currentW} × ${currentH} ft to ${sugW} × ${sugH} ft as a final measure, preserving primary seating arrangements and circulation pathways while recovering ${saved} sq.ft.`;
  }

  if (name.includes('kitchen')) {
    return `Kitchen scaled from ${currentW} × ${currentH} ft to ${sugW} × ${sugH} ft, maintaining ergonomic work-triangle counter spacing and refrigerator clearance while recovering ${saved} sq.ft.`;
  }

  if (name.includes('bath') || name.includes('toilet')) {
    return `Bathroom re-dimensioned from ${currentW} × ${currentH} ft to ${sugW} × ${sugH} ft, strictly preserving NBC minimum sanitary fixture clearances (WC, washbasin, shower zone) while recovering ${saved} sq.ft.`;
  }

  return `Spatial adjustment from ${currentW} × ${currentH} ft to ${sugW} × ${sugH} ft complies with standard residential clearance norms, recovering ${saved} sq.ft.`;
}

/**
 * Intelligent AI Optimization Engine
 * Evaluates required buildable area vs available plot area, applying prioritized architectural optimizations.
 */
export function generateSmartSuggestions(
  land: LandDetails,
  rooms: RoomRequirement[],
  metrics: AreaMetrics,
  validationResult?: ValidationResult,
  version: number = 1
): AISuggestion[] {
  const suggestions: AISuggestion[] = [];

  // Case 1: Layout Fits
  // If Required Area <= Available Buildable Area (excessArea === 0), do not execute optimization.
  if (metrics.excessArea === 0 || (validationResult && validationResult.overallValid)) {
    return suggestions;
  }

  if (land.totalArea <= 0 || rooms.length === 0) {
    return suggestions;
  }

  // Clone original room state to simulate stepped reductions
  const simulatedRooms = rooms.map((r) => ({
    ...r,
    length: r.length,
    breadth: r.breadth,
    area: calculateRoomArea(r.length, r.breadth),
  }));

  let currentMetrics = calculateAreaMetrics(land, simulatedRooms);
  const targetRecovery = metrics.excessArea;

  // Group rooms by architectural priority (Priority 1 to 5)
  // Inside each priority level, sort rooms by largest area first
  const sortedRooms = [...simulatedRooms].sort((a, b) => {
    const stdA = getRoomStandard(a.name, a.category);
    const stdB = getRoomStandard(b.name, b.category);
    if (stdA.priority !== stdB.priority) {
      return stdA.priority - stdB.priority; // Lower priority number is reduced first
    }
    return b.area - a.area; // Larger rooms reduced first
  });

  // Track rooms that have received a proposed reduction
  const proposedRoomMap = new Map<string, { sugL: number; sugB: number; sugArea: number; saved: number }>();

  // Multi-step architectural pass through Priority 1 to Priority 5
  for (const simRoom of sortedRooms) {
    if (currentMetrics.excessArea <= 0) break;

    const std = getRoomStandard(simRoom.name, simRoom.category);
    const originalRoom = rooms.find((r) => r.id === simRoom.id);
    if (!originalRoom) continue;

    const origL = originalRoom.length;
    const origB = originalRoom.breadth;
    const origArea = calculateRoomArea(origL, origB);

    if (origL <= std.minL && origB <= std.minB) {
      // Already at or below architectural minimum
      continue;
    }

    // Determine reduction targets
    // We try to proportionally reduce dimensions down toward minL / minB in 0.5 - 1.0 ft increments
    let curL = origL;
    let curB = origB;

    while (
      currentMetrics.excessArea > 0 &&
      (curL > std.minL || curB > std.minB)
    ) {
      const lExcess = Math.max(0, curL - std.minL);
      const bExcess = Math.max(0, curB - std.minB);

      if (lExcess >= bExcess && curL > std.minL) {
        const step = Math.min(std.stepL, lExcess);
        curL = Math.max(std.minL, Math.round((curL - step) * 10) / 10);
      } else if (curB > std.minB) {
        const step = Math.min(std.stepB, bExcess);
        curB = Math.max(std.minB, Math.round((curB - step) * 10) / 10);
      } else if (curL > std.minL) {
        const step = Math.min(std.stepL, lExcess);
        curL = Math.max(std.minL, Math.round((curL - step) * 10) / 10);
      } else {
        break;
      }

      simRoom.length = curL;
      simRoom.breadth = curB;
      simRoom.area = calculateRoomArea(curL, curB);

      currentMetrics = calculateAreaMetrics(land, simulatedRooms);

      // Record proposed reduction
      const newArea = calculateRoomArea(curL, curB);
      const saved = Math.round((origArea - newArea) * 10) / 10;

      if (saved > 0) {
        proposedRoomMap.set(simRoom.id, {
          sugL: curL,
          sugB: curB,
          sugArea: newArea,
          saved,
        });
      }

      if (currentMetrics.excessArea <= 0) {
        break; // Reached target recovery
      }
    }
  }

  // Format into actionable AI suggestion cards
  proposedRoomMap.forEach((prop, roomId) => {
    const originalRoom = rooms.find((r) => r.id === roomId);
    if (!originalRoom) return;

    const std = getRoomStandard(originalRoom.name, originalRoom.category);
    const reasonText = buildArchitecturalReason(
      originalRoom.name,
      std.priority,
      originalRoom.length,
      originalRoom.breadth,
      prop.sugL,
      prop.sugB,
      prop.saved
    );

    suggestions.push({
      id: `sug-${originalRoom.id}-v${version}`,
      validationVersion: version,
      roomId: originalRoom.id,
      roomName: originalRoom.name,
      currentLength: originalRoom.length,
      currentBreadth: originalRoom.breadth,
      currentArea: originalRoom.area,
      suggestedLength: prop.sugL,
      suggestedBreadth: prop.sugB,
      suggestedArea: prop.sugArea,
      areaSaved: prop.saved,
      priority: std.priority,
      priorityLabel: std.priorityLabel,
      reasonType: 'AREA',
      reason: reasonText,
      problemSolved: `Recovers ${prop.saved} sq.ft toward eliminating the ${targetRecovery} sq.ft site deficit.`,
      status: 'pending',
    });
  });

  // Sort suggestions by Priority (Priority 1 first -> Priority 5 last), then by areaSaved descending
  suggestions.sort((a, b) => {
    const prioA = a.priority || 3;
    const prioB = b.priority || 3;
    if (prioA !== prioB) {
      return prioA - prioB;
    }
    return b.areaSaved - a.areaSaved;
  });

  return suggestions;
}

/**
 * Checks if the layout is mathematically impossible to fit even after maximum architectural reduction
 */
export function checkImpossibleLayout(
  land: LandDetails,
  rooms: RoomRequirement[]
): {
  isImpossible: boolean;
  minPossibleArea: number;
  deficitAfterMaxOptimization: number;
} {
  const minRooms = rooms.map((r) => {
    const std = getRoomStandard(r.name, r.category);
    const minL = std.minL;
    const minB = std.minB;
    return {
      ...r,
      length: minL,
      breadth: minB,
      area: calculateRoomArea(minL, minB),
    };
  });

  const minMetrics = calculateAreaMetrics(land, minRooms);
  return {
    isImpossible: minMetrics.excessArea > 0,
    minPossibleArea: minMetrics.finalRequiredArea,
    deficitAfterMaxOptimization: minMetrics.excessArea,
  };
}
