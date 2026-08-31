import { RoomRequirement, FacingDirection } from '../types';

export type FunctionalZone = 'Public' | 'Semi-Private' | 'Private' | 'Service' | 'Outdoor';

export interface ClassifiedSpace {
  req: RoomRequirement;
  type:
    | 'hall'
    | 'master_bedroom'
    | 'bedroom'
    | 'kitchen'
    | 'dining'
    | 'attached_bathroom'
    | 'common_bathroom'
    | 'staircase'
    | 'parking'
    | 'garden'
    | 'balcony'
    | 'utility'
    | 'store'
    | 'prayer'
    | 'study'
    | 'guest'
    | 'office'
    | 'other';
  zone: 'Front Public' | 'Central Transition' | 'Rear Private' | 'Service Zone' | 'Outdoor Zone';
  functionalZone: FunctionalZone;
  privacyLevel: number; // 1 (Public) to 5 (Private)
  requiresExteriorBoundary: boolean;
  priority: number;
  plumbingImportance: boolean;
  naturalLightRequirement: boolean;
}

// Visual color mapping
export const ROOM_COLORS: Record<string, string> = {
  hall: '#3b82f6', // blue
  bedroom: '#8b5cf6', // purple
  kitchen: '#f59e0b', // amber
  dining: '#10b981', // emerald
  bathroom: '#06b6d4', // cyan
  staircase: '#64748b', // slate
  parking: '#475569', // dark slate
  garden: '#22c55e', // green
  balcony: '#a855f7', // purple-pink
  study: '#ec4899', // pink
  prayer: '#eab308', // yellow
  guest: '#6366f1', // indigo
  store: '#78716c', // stone
  office: '#0284c7', // sky
  utility: '#f97316', // orange
  default: '#6b7280',
};

export function getRoomColor(name: string): string {
  const lower = name.toLowerCase();
  for (const [key, color] of Object.entries(ROOM_COLORS)) {
    if (lower.includes(key)) return color;
  }
  return ROOM_COLORS.default;
}

/**
 * Classifies room into architect-defined functional zones:
 * - Public Zone: Living room, Entrance foyer, Drawing room, Guest sitting, Pooja/Prayer
 * - Semi-Private Zone: Dining room, Family lounge, Staircase
 * - Service Zone: Kitchen, Utility/Wash, Pantry/Store, Common Restroom (clustered plumbing stack)
 * - Private Zone: Master Bedroom, En-suite Attached Bath, Children/Guest Bedrooms, Study Room
 * - Outdoor Zone: Parking bay (on road gate axis), Porch/Sit-out, Garden/Lawn, Balconies/Terraces
 */
export function classifyRoom(req: RoomRequirement): ClassifiedSpace {
  const name = req.name.toLowerCase();

  let type: ClassifiedSpace['type'] = 'other';
  let zone: ClassifiedSpace['zone'] = 'Central Transition';
  let functionalZone: FunctionalZone = 'Public';
  let privacyLevel = 3;
  let requiresExteriorBoundary = false;
  let priority = 5;
  let plumbingImportance = false;
  let naturalLightRequirement = true;

  // 1. OUTDOOR ZONE
  if (name.includes('parking') || name.includes('garage') || name.includes('carport')) {
    type = 'parking';
    zone = 'Outdoor Zone';
    functionalZone = 'Outdoor';
    privacyLevel = 1;
    requiresExteriorBoundary = true;
    priority = 1;
    naturalLightRequirement = false;
  } else if (name.includes('garden') || name.includes('lawn') || name.includes('courtyard')) {
    type = 'garden';
    zone = 'Outdoor Zone';
    functionalZone = 'Outdoor';
    privacyLevel = 1;
    requiresExteriorBoundary = true;
    priority = 1;
    naturalLightRequirement = true;
  } else if (name.includes('balcony') || name.includes('terrace') || name.includes('porch') || name.includes('sit-out') || name.includes('verandah')) {
    type = 'balcony';
    zone = 'Outdoor Zone';
    functionalZone = 'Outdoor';
    privacyLevel = 2;
    requiresExteriorBoundary = true;
    priority = 1;
    naturalLightRequirement = true;
  }
  // 2. PUBLIC ZONE
  else if (
    name.includes('hall') ||
    name.includes('living') ||
    name.includes('reception') ||
    name.includes('drawing') ||
    name.includes('sitting')
  ) {
    type = 'hall';
    zone = 'Front Public';
    functionalZone = 'Public';
    privacyLevel = 1;
    requiresExteriorBoundary = false;
    priority = 2;
    naturalLightRequirement = true;
  } else if (name.includes('dining') || name.includes('dinning')) {
    type = 'dining';
    zone = 'Front Public';
    functionalZone = 'Public';
    privacyLevel = 2;
    requiresExteriorBoundary = false;
    priority = 3;
    naturalLightRequirement = true;
  } else if (
    name.includes('prayer') ||
    name.includes('puja') ||
    name.includes('pooja') ||
    name.includes('shrine') ||
    name.includes('worship')
  ) {
    type = 'prayer';
    zone = 'Front Public';
    functionalZone = 'Public';
    privacyLevel = 2;
    requiresExteriorBoundary = false;
    priority = 2.5;
    naturalLightRequirement = true;
  }
  // 3. SERVICE ZONE & SEMI-PRIVATE
  else if (name.includes('kitchen') || name.includes('cook')) {
    type = 'kitchen';
    zone = 'Service Zone';
    functionalZone = 'Service';
    privacyLevel = 2;
    requiresExteriorBoundary = false;
    priority = 3;
    plumbingImportance = true;
    naturalLightRequirement = true;
  } else if (
    name.includes('utility') ||
    name.includes('laundry') ||
    name.includes('wash area')
  ) {
    type = 'utility';
    zone = 'Service Zone';
    functionalZone = 'Service';
    privacyLevel = 3;
    requiresExteriorBoundary = false;
    priority = 4;
    plumbingImportance = true;
    naturalLightRequirement = false;
  } else if (name.includes('store') || name.includes('pantry')) {
    type = 'store';
    zone = 'Service Zone';
    functionalZone = 'Service';
    privacyLevel = 3;
    requiresExteriorBoundary = false;
    priority = 4;
    naturalLightRequirement = false;
  } else if (name.includes('stair') || name.includes('steps')) {
    type = 'staircase';
    zone = 'Central Transition';
    functionalZone = 'Semi-Private';
    privacyLevel = 2;
    requiresExteriorBoundary = false;
    priority = 4;
    naturalLightRequirement = false;
  } else if (
    name.includes('bath') ||
    name.includes('toilet') ||
    name.includes('washroom') ||
    name.includes('wc') ||
    name.includes('powder')
  ) {
    if (name.includes('attached') || name.includes('en-suite') || name.includes('ensuite')) {
      type = 'attached_bathroom';
      zone = 'Rear Private';
      functionalZone = 'Private';
      privacyLevel = 5;
      requiresExteriorBoundary = false;
      priority = 3; // Must be placed with parent bedroom
      plumbingImportance = true;
      naturalLightRequirement = false;
    } else {
      type = 'common_bathroom';
      zone = 'Central Transition';
      functionalZone = 'Service';
      privacyLevel = 3;
      requiresExteriorBoundary = false;
      priority = 5;
      plumbingImportance = true;
      naturalLightRequirement = false;
    }
  }
  // 4. PRIVATE ZONE
  else if (name.includes('master') && (name.includes('bedroom') || name.includes('bed'))) {
    type = 'master_bedroom';
    zone = 'Rear Private';
    functionalZone = 'Private';
    privacyLevel = 5;
    requiresExteriorBoundary = false;
    priority = 3;
    naturalLightRequirement = true;
  } else if (name.includes('bedroom') || name.includes('bed room') || name.includes('bed')) {
    type = 'bedroom';
    zone = 'Rear Private';
    functionalZone = 'Private';
    privacyLevel = 4;
    requiresExteriorBoundary = false;
    priority = 4;
    naturalLightRequirement = true;
  } else if (name.includes('guest')) {
    type = 'guest';
    zone = 'Rear Private';
    functionalZone = 'Private';
    privacyLevel = 3;
    requiresExteriorBoundary = false;
    priority = 4;
    naturalLightRequirement = true;
  } else if (name.includes('study') || name.includes('office') || name.includes('library')) {
    type = 'study';
    zone = 'Rear Private';
    functionalZone = 'Private';
    privacyLevel = 4;
    requiresExteriorBoundary = false;
    priority = 4.5;
    naturalLightRequirement = true;
  }

  return {
    req,
    type,
    zone,
    functionalZone,
    privacyLevel,
    requiresExteriorBoundary,
    priority,
    plumbingImportance,
    naturalLightRequirement,
  };
}

/**
 * Standard Architectural Dimension Presets for Intelligent Scaling
 * (Master Bed: 16x14 -> 15x13 -> 14x13 -> 12x12; Living: 18x16 -> 16x14 -> 15x13 -> 14x12; etc.)
 */
export const ARCHITECTURAL_SCALE_PRESETS: Record<string, Array<[number, number]>> = {
  hall: [
    [18, 16],
    [16, 14],
    [15, 13],
    [14, 12],
    [12, 12],
  ],
  dining: [
    [14, 12],
    [12, 11],
    [11, 10],
    [10, 10],
    [9, 9],
  ],
  kitchen: [
    [13, 10],
    [12, 10],
    [10, 9],
    [10, 8],
    [8, 8],
  ],
  master_bedroom: [
    [16, 14],
    [15, 13],
    [14, 13],
    [13, 12],
    [12, 12],
    [12, 11],
  ],
  bedroom: [
    [14, 12],
    [13, 12],
    [12, 11],
    [11, 10],
    [10, 10],
  ],
  attached_bathroom: [
    [9, 6],
    [8, 6],
    [8, 5],
    [7, 5],
    [6, 5],
  ],
  common_bathroom: [
    [8, 6],
    [7, 5],
    [6, 5],
    [5, 5],
  ],
  utility: [
    [8, 6],
    [7, 5],
    [6, 5],
    [5, 4],
  ],
  store: [
    [8, 6],
    [6, 5],
    [5, 5],
    [4, 4],
  ],
  prayer: [
    [7, 6],
    [6, 5],
    [5, 5],
    [4, 4],
  ],
  study: [
    [12, 10],
    [10, 10],
    [10, 8],
    [8, 8],
  ],
  parking: [
    [18, 11],
    [16, 10],
    [15, 10],
    [14, 9],
  ],
  garden: [
    [16, 10],
    [12, 8],
    [10, 8],
    [8, 6],
  ],
  balcony: [
    [12, 5],
    [10, 4.5],
    [8, 4],
    [6, 3.5],
  ],
};

export function getScaledRoomDimensions(
  type: string,
  targetAreaRatio: number = 1.0,
  fallbackLength: number,
  fallbackBreadth: number
): [number, number] {
  // Architectural safety floor limits (in feet)
  const minLimits: Record<string, [number, number]> = {
    hall: [11, 11],
    dining: [8.5, 8.5],
    kitchen: [7.5, 7.5],
    master_bedroom: [10.5, 10.5],
    bedroom: [9.5, 9.5],
    attached_bathroom: [4.5, 5.5],
    common_bathroom: [4.5, 5.5],
    utility: [4, 4],
    store: [3.5, 3.5],
    prayer: [3.5, 3.5],
    study: [8, 8],
    guest: [9.5, 9.5],
    parking: [11, 8],
    garden: [6, 6],
    balcony: [5, 3],
  };

  const min = minLimits[type] || [4, 4];

  if (targetAreaRatio >= 0.99) {
    return [
      Math.max(min[0], Math.round(fallbackLength * 10) / 10),
      Math.max(min[1], Math.round(fallbackBreadth * 10) / 10),
    ];
  }

  // Smooth architectural scaling
  const factor = Math.sqrt(Math.max(0.4, targetAreaRatio));
  const scaledL = Math.max(min[0], Math.round(fallbackLength * factor * 10) / 10);
  const scaledB = Math.max(min[1], Math.round(fallbackBreadth * factor * 10) / 10);

  return [scaledL, scaledB];
}
