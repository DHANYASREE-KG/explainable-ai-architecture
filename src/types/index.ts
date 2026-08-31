export type FacingDirection = 'North' | 'South' | 'East' | 'West';

export type ScaleSize = 'compact' | 'standard' | 'spacious';

export type RoomCategory = 'main' | 'sanitary' | 'outdoor' | 'utility' | 'optional';

export type PlotType = 'rectangle' | 'square' | 'polygon';

export interface PolygonPoint {
  x: number; // in feet relative to plot origin (0, 0)
  y: number; // in feet relative to plot origin (0, 0)
}

export interface LandDetails {
  length: number; // in feet (bounding width)
  breadth: number; // in feet (bounding depth)
  totalArea: number; // sq.ft
  plotType?: PlotType;
  polygonPoints?: PolygonPoint[]; // Ordered boundary vertices for irregular plot
}

export interface RoomRequirement {
  id: string;
  name: string;
  category: RoomCategory;
  count: number;
  length: number; // in feet
  breadth: number; // in feet
  area: number; // sq.ft
  isRequired: boolean;
  minRecommendedArea?: number;
  iconName?: string;
}

export interface BasicRequirementsConfig {
  halls: number;
  bedrooms: number;
  kitchens: number;
  diningRooms: number;
  bathrooms: number;
  attachedBathrooms: number;
  hasStaircase: boolean;
  hasParking: boolean;
  hasGarden: boolean;
  hasBalcony: boolean;
  optionalRooms: {
    studyRoom: boolean;
    prayerRoom: boolean;
    guestRoom: boolean;
    storeRoom: boolean;
    homeOffice: boolean;
    utilityRoom: boolean;
    laundryRoom: boolean;
  };
}

export interface DoorData {
  id: string;
  wall: 'north' | 'south' | 'east' | 'west';
  offset: number; // offset along wall in feet
  width: number; // feet
  swingDirection?: 'inside' | 'outside';
  connectsTo?: string; // Room ID or 'outside' or 'corridor'
}

export interface WindowData {
  id: string;
  wall: 'north' | 'south' | 'east' | 'west';
  offset: number; // feet
  width: number; // feet
}

export interface RoomPlacement {
  id: string;
  name: string;
  category: RoomCategory;
  x: number; // X position from land top-left in feet
  y: number; // Y position from land top-left in feet
  width: number; // Length along X in feet
  height: number; // Breadth along Y in feet
  area: number; // sq.ft
  zone: 'Front Public' | 'Central Transition' | 'Rear Private' | 'Service Zone' | 'Outdoor Zone';
  doors: DoorData[];
  windows: WindowData[];
  color: string;
  adjacentRoomIds: string[];
}

export interface EntranceDetails {
  wall: 'north' | 'south' | 'east' | 'west';
  x: number;
  y: number;
  width: number;
  description: string;
}

export type ValidationCategory =
  | 'input'
  | 'area'
  | 'geometry'
  | 'circulation'
  | 'direction'
  | 'accessibility'
  | 'adjacency'
  | 'structural'
  | 'ventilation'
  | 'privacy'
  | 'lighting';

export interface ValidationRule {
  id: string;
  title: string;
  description: string;
  category: ValidationCategory;
  status: 'passed' | 'failed' | 'warning' | 'pending';
  details: string;
  isCritical?: boolean;
}

export interface AreaMetrics {
  totalLandArea: number;
  totalRoomArea: number;
  wallAllowance: number;
  circulationAllowance: number;
  finalRequiredArea: number;
  remainingArea: number;
  excessArea: number;
  wallPercentage: number;
  circulationPercentage: number;
}

export interface QualityScoreBreakdown {
  architecturalCorrectness: number;
  connectivity: number;
  ventilation: number;
  spaceUtilization: number;
  structuralAlignment: number;
  accessibility: number;
  privacy: number;
  naturalLighting: number;
}

export interface ValidationResult {
  overallValid: boolean;
  criticalValid: boolean;
  rules: ValidationRule[];
  metrics: AreaMetrics;
  geometricErrors: string[];
  reasons: string[];
  qualityScore?: number;
  qualityGrade?: 'Excellent' | 'Good' | 'Needs Improvement';
  qualityBreakdown?: QualityScoreBreakdown;
}

export interface AISuggestion {
  id: string;
  validationVersion?: number;
  roomId: string;
  roomName: string;
  currentLength: number;
  currentBreadth: number;
  currentArea: number;
  suggestedLength: number;
  suggestedBreadth: number;
  suggestedArea: number;
  areaSaved: number;
  priority?: 1 | 2 | 3 | 4 | 5;
  priorityLabel?: string;
  reasonType?: 'AREA' | 'GEOMETRY' | 'CIRCULATION' | 'ACCESSIBILITY' | 'DIRECTION';
  reason: string;
  problemSolved: string;
  status: 'pending' | 'accepted' | 'rejected';
}

export interface PlacementDecisionRecord {
  roomId: string;
  roomName: string;
  requestedDimensions: {
    length: number;
    breadth: number;
  };
  finalCoordinates: {
    x: number;
    y: number;
  };
  finalZone: string;
  facingDirection: FacingDirection;
  adjacentRooms: string[];
  selectedCandidateScore: number;
  constraintsSatisfied: string[];
  preferencesSatisfied: string[];
  rejectedAlternatives: {
    location: string;
    reason: string;
  }[];
  tradeoffs: string[];
}

export type RoofType = 'flat' | 'terrace' | 'tiled';

export type FurnitureType =
  | 'sofa_3'
  | 'sofa_2'
  | 'chair'
  | 'tv'
  | 'rug'
  | 'bed_queen'
  | 'plant_floor'
  | 'plant_hanging';

export interface FurnitureItem {
  id: string;
  type: FurnitureType;
  name: string;
  x: number; // in feet from land origin
  y: number; // in feet from land origin
  width: number; // in feet
  height: number; // in feet
  rotation: number; // 0, 90, 180, 270 degrees
  roomId?: string;
}

export interface SitePlanData {
  plotPolygon?: { x: number; y: number }[];
  setbacks: {
    front: number;
    rear: number;
    left: number;
    right: number;
  };
  buildableFootprint: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
  entranceGate: {
    x: number;
    y: number;
    width: number;
    wall: 'north' | 'south' | 'east' | 'west';
  };
  walkway: {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    width: number;
  };
  parkingBay?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  gardenArea?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface HybridAIMetrics {
  cspScore: number;
  graphScore: number;
  aStarCirculationScore: number;
  relationshipScore: number;
  multiObjectiveScore: number;
  allConstraintsSatisfied: boolean;
  totalWalkingDistance: number;
  averagePathDirectness: number;
  zoningsCompliant: boolean;
}

export interface LayoutData {
  land: LandDetails;
  facingDirection: FacingDirection;
  entrance: EntranceDetails;
  rooms: RoomPlacement[];
  wallAllowance: number;
  circulationAllowance: number;
  corridors: { x: number; y: number; width: number; height: number }[];
  validation: ValidationResult;
  layoutScore: number;
  placementDecisions: Record<string, PlacementDecisionRecord>;
  roofType?: RoofType;
  furniture?: FurnitureItem[];
  currentFloor?: string;
  appliedSuggestions?: AISuggestion[];
  sitePlan?: SitePlanData;
  hybridAIMetrics?: HybridAIMetrics;
}

export interface ExplanationCategoryBreakdown {
  geometry: string;
  area: string;
  direction: string;
  adjacency: string;
  privacy: string;
  circulation: string;
  userPreferences: string;
  optimization: string;
  rejectedAlternatives: string[];
  tradeoffs: string[];
}

export interface ExplanationResponse {
  summary: string;
  overallScoreExplanation: string;
  categories: ExplanationCategoryBreakdown;
  evidenceChecklist: string[];
  specificRoomExplanations?: Record<string, string>;
}

export * from './costEstimation';

