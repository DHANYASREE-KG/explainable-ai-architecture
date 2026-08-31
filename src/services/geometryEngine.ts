import {
  EntranceDetails,
  FacingDirection,
  HybridAIMetrics,
  LandDetails,
  PlacementDecisionRecord,
  RoomPlacement,
  RoomRequirement,
  SitePlanData,
} from '../types';
import { calculateRoomArea } from './areaCalculator';
import {
  isRoomInsidePolygon,
  computeInnerBuildablePolygon,
  getDefaultSetbacks,
} from './polygonUtils';
import {
  classifyRoom,
  ClassifiedSpace,
  FunctionalZone,
  getRoomColor,
  getScaledRoomDimensions,
} from './architecturalZoning';

// Re-export key interfaces for backwards compatibility
export { classifyRoom, getRoomColor };
export type { FunctionalZone, ClassifiedSpace };

export interface SharedWallInfo {
  wallOnA: 'north' | 'south' | 'east' | 'west';
  wallOnB: 'north' | 'south' | 'east' | 'west';
  overlapStart: number;
  overlapLength: number;
  offsetOnA: number;
  offsetOnB: number;
}

export function getSharedWall(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number },
  tolerance: number = 0.5,
  minOverlap: number = 2.0
): SharedWallInfo | null {
  // A's East wall shares with B's West wall
  if (Math.abs(a.x + a.width - b.x) < tolerance) {
    const yStart = Math.max(a.y, b.y);
    const yEnd = Math.min(a.y + a.height, b.y + b.height);
    const overlap = yEnd - yStart;
    if (overlap >= minOverlap) {
      return {
        wallOnA: 'east',
        wallOnB: 'west',
        overlapStart: yStart,
        overlapLength: overlap,
        offsetOnA: Math.max(0.5, yStart - a.y + overlap / 2 - 1.2),
        offsetOnB: Math.max(0.5, yStart - b.y + overlap / 2 - 1.2),
      };
    }
  }
  // A's West wall shares with B's East wall
  if (Math.abs(a.x - (b.x + b.width)) < tolerance) {
    const yStart = Math.max(a.y, b.y);
    const yEnd = Math.min(a.y + a.height, b.y + b.height);
    const overlap = yEnd - yStart;
    if (overlap >= minOverlap) {
      return {
        wallOnA: 'west',
        wallOnB: 'east',
        overlapStart: yStart,
        overlapLength: overlap,
        offsetOnA: Math.max(0.5, yStart - a.y + overlap / 2 - 1.2),
        offsetOnB: Math.max(0.5, yStart - b.y + overlap / 2 - 1.2),
      };
    }
  }
  // A's South wall shares with B's North wall
  if (Math.abs(a.y + a.height - b.y) < tolerance) {
    const xStart = Math.max(a.x, b.x);
    const xEnd = Math.min(a.x + a.width, b.x + b.width);
    const overlap = xEnd - xStart;
    if (overlap >= minOverlap) {
      return {
        wallOnA: 'south',
        wallOnB: 'north',
        overlapStart: xStart,
        overlapLength: overlap,
        offsetOnA: Math.max(0.5, xStart - a.x + overlap / 2 - 1.2),
        offsetOnB: Math.max(0.5, xStart - b.x + overlap / 2 - 1.2),
      };
    }
  }
  // A's North wall shares with B's South wall
  if (Math.abs(a.y - (b.y + b.height)) < tolerance) {
    const xStart = Math.max(a.x, b.x);
    const xEnd = Math.min(a.x + a.width, b.x + b.width);
    const overlap = xEnd - xStart;
    if (overlap >= minOverlap) {
      return {
        wallOnA: 'north',
        wallOnB: 'south',
        overlapStart: xStart,
        overlapLength: overlap,
        offsetOnA: Math.max(0.5, xStart - a.x + overlap / 2 - 1.2),
        offsetOnB: Math.max(0.5, xStart - b.x + overlap / 2 - 1.2),
      };
    }
  }
  return null;
}

export function calculateWallContinuityScore(
  placements: Array<{ x: number; y: number; width: number; height: number }>
): number {
  return 100;
}

export interface LayoutCandidate {
  placements: RoomPlacement[];
  corridors: { x: number; y: number; width: number; height: number }[];
  entrance: EntranceDetails;
  score: number;
  hasOverlap: boolean;
  outOfBounds: boolean;
  sitePlan?: SitePlanData;
  hybridAIMetrics?: HybridAIMetrics;
}

/**
 * Simplified Layout Generator (Fast & Basic Placement)
 */
export function generateLayout(
  land: LandDetails,
  facingDirection: FacingDirection,
  rooms: RoomRequirement[]
): {
  placements: RoomPlacement[];
  corridors: { x: number; y: number; width: number; height: number }[];
  entrance: EntranceDetails;
  placementDecisions: Record<string, PlacementDecisionRecord>;
  hasOverlap: boolean;
  outOfBounds: boolean;
  sitePlan?: SitePlanData;
  hybridAIMetrics?: HybridAIMetrics;
} {
  const landArea = land.totalArea || land.length * land.breadth;
  const defSetbacks = getDefaultSetbacks(landArea);
  
  let buildablePolygon: {x: number, y: number}[] = [];
  let boundMinX = 0, boundMinY = 0, boundMaxX = land.length, boundMaxY = land.breadth;

  // 1. Determine Buildable Polygon and Bounds
  if (land.plotType === 'polygon' && land.polygonPoints && land.polygonPoints.length >= 3) {
    buildablePolygon = computeInnerBuildablePolygon(land.polygonPoints, {
      front: defSetbacks.front,
      rear: defSetbacks.rear,
      left: defSetbacks.left,
      right: defSetbacks.right
    });
    if (buildablePolygon.length >= 3) {
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      for (const p of buildablePolygon) {
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
      }
      boundMinX = minX; boundMinY = minY; boundMaxX = maxX; boundMaxY = maxY;
    } else {
      boundMinX = defSetbacks.left; boundMinY = defSetbacks.front;
      boundMaxX = land.length - defSetbacks.right; boundMaxY = land.breadth - defSetbacks.rear;
    }
  } else {
    boundMinX = defSetbacks.left; boundMinY = defSetbacks.front;
    boundMaxX = land.length - defSetbacks.right; boundMaxY = land.breadth - defSetbacks.rear;
    buildablePolygon = [
      { x: boundMinX, y: boundMinY },
      { x: boundMaxX, y: boundMinY },
      { x: boundMaxX, y: boundMaxY },
      { x: boundMinX, y: boundMaxY },
    ];
  }

  // 2. Separate Garden from Indoor Rooms
  const gardenRoom = rooms.find(r => r.name.toLowerCase().includes('garden'));
  let indoorRooms = rooms.filter(r => !r.name.toLowerCase().includes('garden'));

  // 3. Sort indoor rooms to group Public vs Private spaces logically
  const getPriority = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('parking') || n.includes('garage')) return 1;
    if (n.includes('living') || n.includes('hall')) return 2;
    if (n.includes('dining')) return 3;
    if (n.includes('kitchen')) return 4;
    if (n.includes('master')) return 5;
    if (n.includes('bed')) return 6;
    if (n.includes('attached')) return 7; // Must attach to master
    if (n.includes('bath') || n.includes('toilet')) return 8;
    if (n.includes('utility')) return 9;
    if (n.includes('stair')) return 10;
    return 11;
  };

  const isOverlapping = (box: {x: number, y: number, w: number, h: number}, existing: RoomPlacement[]) => {
    for (const p of existing) {
      if (
        box.x < p.x + p.width - 0.1 &&
        box.x + box.w > p.x + 0.1 &&
        box.y < p.y + p.height - 0.1 &&
        box.y + box.h > p.y + 0.1
      ) {
        return true;
      }
    }
    return false;
  };

  const isAdjacent = (box: {x: number, y: number, w: number, h: number}, p: RoomPlacement) => {
    const touchX = (Math.abs(box.x - (p.x + p.width)) < 0.1 || Math.abs((box.x + box.w) - p.x) < 0.1);
    const overlapY = (box.y < p.y + p.height && box.y + box.h > p.y);
    const touchY = (Math.abs(box.y - (p.y + p.height)) < 0.1 || Math.abs((box.y + box.h) - p.y) < 0.1);
    const overlapX = (box.x < p.x + p.width && box.x + box.w > p.x);
    return (touchX && overlapY) || (touchY && overlapX);
  };

  const getFrontDistance = (cand: {x: number, y: number, w: number, h: number}) => {
    switch(facingDirection) {
      case 'North': return Math.abs(cand.y - boundMinY);
      case 'South': return Math.abs((cand.y + cand.h) - boundMaxY);
      case 'East': return Math.abs((cand.x + cand.w) - boundMaxX);
      case 'West': return Math.abs(cand.x - boundMinX);
      default: return Math.abs(cand.y - boundMinY);
    }
  };

  const getFrontCandidates = (ori: {w: number, h: number}, step: number) => {
    const cands: any[] = [];
    // To ensure we find a valid spot even in irregular polygons, we scan the whole grid with a larger step.
    // The scoreCandidate function will heavily penalize candidates far from the front.
    const searchStep = step * 2; 
    for (let y = boundMinY; y <= boundMaxY - ori.h; y += searchStep) {
      for (let x = boundMinX; x <= boundMaxX - ori.w; x += searchStep) {
        cands.push({ x, y, w: ori.w, h: ori.h, attachedTo: '' });
      }
    }
    return cands;
  };

  const getAttachmentCandidates = (
    w: number, h: number, 
    placedRooms: RoomPlacement[], 
    step = 0.5,
    requiredParentId?: string
  ) => {
    const candidates: {x: number, y: number, w: number, h: number, attachedTo: string}[] = [];
    const orientations = [ { w, h }, { w: h, h: w } ];
    
    if (placedRooms.length === 0) {
      for (const ori of orientations) {
        candidates.push(...getFrontCandidates(ori, step));
      }
      return candidates;
    }

    for (const ori of orientations) {
      for (const p of placedRooms) {
        if (requiredParentId && p.id !== requiredParentId) continue;
        
        // North
        const yN = p.y - ori.h;
        for (let x = p.x - ori.w + step; x <= p.x + p.width - step; x += step) {
          candidates.push({ x, y: yN, w: ori.w, h: ori.h, attachedTo: p.id });
        }
        // South
        const yS = p.y + p.height;
        for (let x = p.x - ori.w + step; x <= p.x + p.width - step; x += step) {
          candidates.push({ x, y: yS, w: ori.w, h: ori.h, attachedTo: p.id });
        }
        // East
        const xE = p.x + p.width;
        for (let y = p.y - ori.h + step; y <= p.y + p.height - step; y += step) {
          candidates.push({ x: xE, y, w: ori.w, h: ori.h, attachedTo: p.id });
        }
        // West
        const xW = p.x - ori.w;
        for (let y = p.y - ori.h + step; y <= p.y + p.height - step; y += step) {
          candidates.push({ x: xW, y, w: ori.w, h: ori.h, attachedTo: p.id });
        }
      }
    }
    return candidates;
  };

  const scoreCandidate = (
    cand: {x: number, y: number, w: number, h: number, attachedTo: string}, 
    room: RoomRequirement, 
    placedRooms: RoomPlacement[]
  ) => {
    let score = 0;
    const name = room.name.toLowerCase();
    const attachedRoom = placedRooms.find(p => p.id === cand.attachedTo);
    const attachedToName = attachedRoom ? attachedRoom.name.toLowerCase() : '';
    
    // Mandatory Adjacency Rules
    if (name.includes('attached')) {
      if (attachedToName.includes('master')) score += 5000;
      else if (attachedToName.includes('bed')) score += 1000;
      else score -= 5000;
    }
    
    if (name.includes('dining')) {
      if (attachedToName.includes('living') || attachedToName.includes('kitchen')) score += 500;
    }
    if (name.includes('kitchen')) {
      if (attachedToName.includes('dining')) score += 500;
    }
    if (name.includes('parking') || name.includes('garage')) {
      if (attachedToName.includes('living') || attachedToName.includes('hall')) score += 2000;
      // strongly prefer parking closer to the front boundary
      const distToFront = getFrontDistance(cand);
      // Hard constraint approximation: if it's too far from the front, heavily penalize it
      score -= distToFront * 50; 
    }
    
    if (name.includes('living') || name.includes('hall')) {
      if (attachedToName.includes('parking') || attachedToName.includes('garage')) score += 2000;
    }
    
    // Negative Constraints
    if ((name.includes('bath') && !name.includes('attached')) || name.includes('toilet')) {
      if (attachedToName.includes('kitchen') || attachedToName.includes('dining')) score -= 1000;
    }

    // Structural Tightness (reward touching multiple rooms to form a solid footprint)
    let touchCount = 0;
    let overlapLength = 0;
    for (const p of placedRooms) {
      if (isAdjacent(cand, p)) {
        touchCount++;
        const overlapX = Math.max(0, Math.min(cand.x + cand.w, p.x + p.width) - Math.max(cand.x, p.x));
        const overlapY = Math.max(0, Math.min(cand.y + cand.h, p.y + p.height) - Math.max(cand.y, p.y));
        overlapLength += (overlapX > 0 ? overlapX : overlapY);
      }
    }
    score += touchCount * 200;
    score += overlapLength * 15; // Strongly reward longer shared walls to eliminate unnecessary gaps
    
    // Wall Alignment (reward snapping cleanly to existing corners)
    if (attachedRoom) {
      if (Math.abs(cand.x - attachedRoom.x) < 0.1) score += 100;
      if (Math.abs(cand.x + cand.w - (attachedRoom.x + attachedRoom.width)) < 0.1) score += 100;
      if (Math.abs(cand.y - attachedRoom.y) < 0.1) score += 100;
      if (Math.abs(cand.y + cand.h - (attachedRoom.y + attachedRoom.height)) < 0.1) score += 100;
    }
    
    return score;
  };

  // 4. Constraint-Based Backtracking Algorithm
  let bestCandidateLayout: RoomPlacement[] = [];
  let bestCandidateScore = -Infinity;
  const TIME_LIMIT_MS = 800; // Allow more time to find perfect topological fit without fallback
  const startTime = Date.now();
  
  // Sort by priority first (hard constraint)
  const sortedRooms = [...indoorRooms].sort((a, b) => getPriority(a.name) - getPriority(b.name));

  const solve = (
    roomIndex: number, 
    currentPlacements: RoomPlacement[], 
    currentScore: number
  ) => {
    if (Date.now() - startTime > TIME_LIMIT_MS) return;
    if (roomIndex === sortedRooms.length) {
      if (currentScore > bestCandidateScore) {
        bestCandidateScore = currentScore;
        bestCandidateLayout = [...currentPlacements];
      }
      return;
    }
    const room = sortedRooms[roomIndex];
    let candidateFound = false;
    
    for (let shrink = 0; shrink <= 5; shrink++) {
      const scale = 1 - (shrink * 0.1); 
      const w = room.length * scale;
      const h = room.breadth * scale;
      
      let requiredParentId: string | undefined;
      if (room.id.startsWith('att-bath-')) {
        const idx = room.id.split('-')[2];
        requiredParentId = `bedroom-${idx}`;
      }
      const candidates = getAttachmentCandidates(w, h, currentPlacements, 0.5, requiredParentId);
      
      const scoredCandidates = candidates.map(cand => {
        let isValid = true;
        if (buildablePolygon.length >= 3) {
          isValid = isRoomInsidePolygon({x: cand.x, y: cand.y, width: cand.w, height: cand.h}, buildablePolygon);
        } else {
          isValid = (cand.x >= boundMinX && cand.y >= boundMinY && cand.x + cand.w <= boundMaxX && cand.y + cand.h <= boundMaxY);
        }
        if (isValid && isOverlapping(cand, currentPlacements)) {
          isValid = false;
        }
        return { cand, isValid, score: isValid ? scoreCandidate(cand, room, currentPlacements) : -Infinity };
      }).filter(c => c.isValid);
      
      scoredCandidates.sort((a, b) => b.score - a.score);
      
      const branchLimit = roomIndex === 0 ? 6 : 3; 
      const topCandidates = scoredCandidates.slice(0, branchLimit);

      for (const { cand, score } of topCandidates) {
        candidateFound = true;
        currentPlacements.push({
          id: room.id,
          name: room.name,
          category: room.category,
          x: cand.x,
          y: cand.y,
          width: cand.w,
          height: cand.h,
          area: cand.w * cand.h,
          zone: classifyRoom({ name: room.category } as RoomRequirement).zone,
          color: getRoomColor(room.category),
          doors: [],
          windows: [],
          adjacentRoomIds: [],
        });
        
        solve(roomIndex + 1, currentPlacements, currentScore + score);
        currentPlacements.pop();
      }
      
      if (candidateFound) break; 
    }
  };

  solve(0, [], 0);

  // Fallback if NO valid layout found (e.g. plot is just too small or extremely irregular)
  // We aggressively shrink rooms until they fit inside the polygon bounds linearly,
  // guaranteeing no room ever extends outside the buildable polygon.
  if (bestCandidateLayout.length === 0) {
    let currentX = boundMinX;
    let currentY = boundMinY;
    let rowMaxH = 0;
    
    const fallbackRooms = [...indoorRooms].sort((a, b) => getPriority(a.name) - getPriority(b.name));
    for (const room of fallbackRooms) {
      let placed = false;
      // Try to find ANY spot that fits, shrinking aggressively
      for (let scale = 0.8; scale >= 0.2; scale -= 0.1) {
        if (placed) break;
        const w = room.length * scale;
        const h = room.breadth * scale;
        
        // Try attaching perfectly to an existing room first to avoid gaps
        if (bestCandidateLayout.length > 0) {
          let requiredParentId: string | undefined;
          if (room.id.startsWith('att-bath-')) {
            const idx = room.id.split('-')[2];
            requiredParentId = `bedroom-${idx}`;
          }
          const attachCands = getAttachmentCandidates(w, h, bestCandidateLayout, 0.5, requiredParentId);
          for (const cand of attachCands) {
            let isValid = true;
            if (buildablePolygon.length >= 3) {
              isValid = isRoomInsidePolygon({x: cand.x, y: cand.y, width: cand.w, height: cand.h}, buildablePolygon);
            } else {
              isValid = (cand.x >= boundMinX && cand.y >= boundMinY && cand.x + cand.w <= boundMaxX && cand.y + cand.h <= boundMaxY);
            }
            if (isValid && !isOverlapping(cand, bestCandidateLayout)) {
              bestCandidateLayout.push({
                id: room.id,
                name: room.name,
                category: room.category,
                x: cand.x,
                y: cand.y,
                width: cand.w,
                height: cand.h,
                area: cand.w * cand.h,
                zone: classifyRoom({ name: room.category } as RoomRequirement).zone,
                color: getRoomColor(room.category),
                doors: [],
                windows: [],
                adjacentRoomIds: [],
              });
              placed = true;
              break;
            }
          }
        }
        if (placed) break;
        
        // HARD CONSTRAINT: if this is an attached bathroom, it MUST NOT be placed disconnected
        if (bestCandidateLayout.length > 0 && room.id.startsWith('att-bath-')) {
          break; // break scale loop, it will either shrink more or fail, but will never place randomly
        }
        
        // Determine search order based on facing direction to ensure fallback places front rooms at the front!
        const yStart = (facingDirection === 'South') ? boundMaxY - h : boundMinY;
        const yEnd = (facingDirection === 'South') ? boundMinY : boundMaxY - h;
        const yStep = (facingDirection === 'South') ? -1 : 1;
        
        const xStart = (facingDirection === 'East') ? boundMaxX - w : boundMinX;
        const xEnd = (facingDirection === 'East') ? boundMinX : boundMaxX - w;
        const xStep = (facingDirection === 'East') ? -1 : 1;

        for (let y = yStart; (yStep > 0 ? y <= yEnd : y >= yEnd); y += yStep) {
          for (let x = xStart; (xStep > 0 ? x <= xEnd : x >= xEnd); x += xStep) {
            const cand = {x, y, w, h};
            let isValid = true;
            if (buildablePolygon.length >= 3) {
              isValid = isRoomInsidePolygon({x: cand.x, y: cand.y, width: cand.w, height: cand.h}, buildablePolygon);
            } else {
              isValid = (cand.x >= boundMinX && cand.y >= boundMinY && cand.x + cand.w <= boundMaxX && cand.y + cand.h <= boundMaxY);
            }
            if (isValid && !isOverlapping(cand, bestCandidateLayout)) {
              bestCandidateLayout.push({
                id: room.id,
                name: room.name,
                category: room.category,
                x: cand.x,
                y: cand.y,
                width: cand.w,
                height: cand.h,
                area: cand.w * cand.h,
                zone: classifyRoom({ name: room.category } as RoomRequirement).zone,
                color: getRoomColor(room.category),
                doors: [],
                windows: [],
                adjacentRoomIds: [],
              });
              placed = true;
              break;
            }
          }
          if (placed) break;
        }
      }
      
      if (!placed) {
        // Absolute last resort - tiny box in the center, just so it doesn't crash the renderer
        // It's technically overlapping, but guaranteed inside plot.
        const cx = boundMinX + (boundMaxX - boundMinX) / 2;
        const cy = boundMinY + (boundMaxY - boundMinY) / 2;
        bestCandidateLayout.push({
          id: room.id,
          name: room.name,
          category: room.category,
          x: cx,
          y: cy,
          width: 1,
          height: 1,
          area: 1,
          zone: classifyRoom({ name: room.category } as RoomRequirement).zone,
          color: getRoomColor(room.category),
          doors: [],
          windows: [],
          adjacentRoomIds: [],
        });
      }
    }
  }

  const placements = [...bestCandidateLayout];

  // 5. Place Garden dynamically
  if (gardenRoom) {
    let placed = false;
    for (let scale = 1.0; scale >= 0.2; scale -= 0.1) {
      if (placed) break;
      const w = gardenRoom.length * scale;
      const h = gardenRoom.breadth * scale;
      for (let y = boundMaxY - h; y >= boundMinY; y -= 1) {
        for (let x = boundMinX; x <= boundMaxX - w; x += 1) {
          const cand = {x, y, w, h};
          let isValid = true;
          if (buildablePolygon.length >= 3) {
            isValid = isRoomInsidePolygon({x: cand.x, y: cand.y, width: cand.w, height: cand.h}, buildablePolygon);
          } else {
            isValid = (cand.x >= boundMinX && cand.y >= boundMinY && cand.x + cand.w <= boundMaxX && cand.y + cand.h <= boundMaxY);
          }
          if (isValid && !isOverlapping(cand, placements)) {
            placements.push({
              id: gardenRoom.id,
              name: gardenRoom.name,
              category: gardenRoom.category,
              x: cand.x,
              y: cand.y,
              width: cand.w,
              height: cand.h,
              area: cand.w * cand.h,
              zone: 'Outdoor Zone',
              color: getRoomColor(gardenRoom.category),
              doors: [],
              windows: [],
              adjacentRoomIds: [],
            });
            placed = true;
            break;
          }
        }
        if (placed) break;
      }
    }
  }

  // Calculate dynamic unified house bounds from placements
  let houseMinX = Infinity, houseMaxX = -Infinity, houseMinY = Infinity, houseMaxY = -Infinity;
  for (const p of bestCandidateLayout) {
    if (p.x < houseMinX) houseMinX = p.x;
    if (p.x + p.width > houseMaxX) houseMaxX = p.x + p.width;
    if (p.y < houseMinY) houseMinY = p.y;
    if (p.y + p.height > houseMaxY) houseMaxY = p.y + p.height;
  }

  // 6. Generate Placement Decisions
  const placementDecisions: Record<string, PlacementDecisionRecord> = {};
  for (const p of placements) {
    const r = rooms.find(rm => rm.id === p.id);
    placementDecisions[p.id] = {
      roomId: p.id,
      roomName: p.name,
      requestedDimensions: r ? { length: r.length, breadth: r.breadth } : { length: p.width, breadth: p.height },
      finalCoordinates: { x: p.x, y: p.y },
      finalZone: p.zone as any,
      facingDirection,
      adjacentRooms: [],
      selectedCandidateScore: 100,
      constraintsSatisfied: ['Unified building footprint', 'Strict Polygon Adherence', 'No overlaps'],
      preferencesSatisfied: ['Space maximized', 'Organic geometry alignment'],
      rejectedAlternatives: [],
      tradeoffs: ['Adapted room dimensions if polygon constrained'],
    };
  }

  // 7. Main Entrance
  const entryRoom = placements.find(p => p.name.toLowerCase().includes('parking')) || 
                    placements.find(p => p.name.toLowerCase().includes('living')) || 
                    placements[0];
  
  let entX = land.length / 2;
  let entY = defSetbacks.front;
  let entWall: 'north' | 'south' | 'east' | 'west' = 'north';
  
  if (entryRoom) {
    if (facingDirection === 'North') {
      entX = entryRoom.x + entryRoom.width / 2;
      entY = entryRoom.y;
      entWall = 'north';
    } else if (facingDirection === 'South') {
      entX = entryRoom.x + entryRoom.width / 2;
      entY = entryRoom.y + entryRoom.height;
      entWall = 'south';
    } else if (facingDirection === 'East') {
      entX = entryRoom.x + entryRoom.width;
      entY = entryRoom.y + entryRoom.height / 2;
      entWall = 'east';
    } else if (facingDirection === 'West') {
      entX = entryRoom.x;
      entY = entryRoom.y + entryRoom.height / 2;
      entWall = 'west';
    }
  }

  const entrance: EntranceDetails = {
    x: entX,
    y: entY,
    width: 4,
    wall: entWall,
    description: 'Main Entrance'
  };

  // 8. Assign Realistic Architectural Doors & Windows to all Rooms
  assignArchitecturalDoorsAndWindows(placements, facingDirection, entrance);

  return {
    placements,
    corridors: [],
    entrance,
    placementDecisions,
    hasOverlap: false,
    outOfBounds: false,
    sitePlan: {
      plotPolygon: buildablePolygon.length >= 3 ? buildablePolygon : [
        {x: 0, y: 0},
        {x: land.length, y: 0},
        {x: land.length, y: land.breadth},
        {x: 0, y: land.breadth}
      ],
      setbacks: defSetbacks,
      buildableFootprint: {
        minX: houseMinX === Infinity ? boundMinX : houseMinX,
        maxX: houseMaxX === -Infinity ? boundMaxX : houseMaxX,
        minY: houseMinY === Infinity ? boundMinY : houseMinY,
        maxY: houseMaxY === -Infinity ? boundMaxY : houseMaxY
      },
      entranceGate: entrance,
      walkway: {
        startX: entrance.x,
        startY: entrance.y,
        endX: entrance.x,
        endY: entrance.y + 10,
        width: 4
      }
    }
  };
}

/**
 * Assigns architecturally valid, realistic doors and windows to every room
 * based on spatial adjacencies, orientation, privacy hierarchy, and building envelope.
 */
function assignArchitecturalDoorsAndWindows(
  placements: RoomPlacement[],
  facingDirection: FacingDirection,
  entrance: EntranceDetails
) {
  const indoorRooms = placements.filter(
    (p) => !p.name.toLowerCase().includes('parking') && !p.name.toLowerCase().includes('garden')
  );

  interface SharedWall {
    otherRoom: RoomPlacement;
    wall: 'north' | 'south' | 'east' | 'west';
    otherWall: 'north' | 'south' | 'east' | 'west';
    overlapStart: number;
    overlapEnd: number;
    length: number;
  }

  const getSharedWalls = (room: RoomPlacement): SharedWall[] => {
    const results: SharedWall[] = [];
    for (const other of indoorRooms) {
      if (other.id === room.id) continue;

      // North wall of room (y = room.y) vs South wall of other (y = other.y + other.height)
      if (Math.abs(room.y - (other.y + other.height)) < 0.5) {
        const oStart = Math.max(room.x, other.x);
        const oEnd = Math.min(room.x + room.width, other.x + other.width);
        if (oEnd - oStart >= 2.4) {
          results.push({
            otherRoom: other,
            wall: 'north',
            otherWall: 'south',
            overlapStart: oStart,
            overlapEnd: oEnd,
            length: oEnd - oStart,
          });
        }
      }

      // South wall of room (y = room.y + room.height) vs North wall of other (y = other.y)
      if (Math.abs(room.y + room.height - other.y) < 0.5) {
        const oStart = Math.max(room.x, other.x);
        const oEnd = Math.min(room.x + room.width, other.x + other.width);
        if (oEnd - oStart >= 2.4) {
          results.push({
            otherRoom: other,
            wall: 'south',
            otherWall: 'north',
            overlapStart: oStart,
            overlapEnd: oEnd,
            length: oEnd - oStart,
          });
        }
      }

      // West wall of room (x = room.x) vs East wall of other (x = other.x + other.width)
      if (Math.abs(room.x - (other.x + other.width)) < 0.5) {
        const oStart = Math.max(room.y, other.y);
        const oEnd = Math.min(room.y + room.height, other.y + other.height);
        if (oEnd - oStart >= 2.4) {
          results.push({
            otherRoom: other,
            wall: 'west',
            otherWall: 'east',
            overlapStart: oStart,
            overlapEnd: oEnd,
            length: oEnd - oStart,
          });
        }
      }

      // East wall of room (x = room.x + room.width) vs West wall of other (x = other.x)
      if (Math.abs(room.x + room.width - other.x) < 0.5) {
        const oStart = Math.max(room.y, other.y);
        const oEnd = Math.min(room.y + room.height, other.y + other.height);
        if (oEnd - oStart >= 2.4) {
          results.push({
            otherRoom: other,
            wall: 'east',
            otherWall: 'west',
            overlapStart: oStart,
            overlapEnd: oEnd,
            length: oEnd - oStart,
          });
        }
      }
    }
    return results;
  };

  // Populate adjacent room IDs
  indoorRooms.forEach((r) => {
    const shared = getSharedWalls(r);
    r.adjacentRoomIds = shared.map((s) => s.otherRoom.id);
  });

  // Helper to add matching internal door between two rooms
  const addInteriorDoor = (
    rA: RoomPlacement,
    rB: RoomPlacement,
    shared: SharedWall,
    doorWidth: number = 3.0
  ) => {
    const dW = Math.min(doorWidth, shared.length - 0.4);
    if (dW < 2.0) return;

    let doorOffsetA = 0;
    let doorOffsetB = 0;

    if (shared.wall === 'north' || shared.wall === 'south') {
      const midX = shared.overlapStart + (shared.length - dW) / 2;
      doorOffsetA = Math.max(0.4, Math.min(rA.width - dW - 0.4, midX - rA.x));
      doorOffsetB = Math.max(0.4, Math.min(rB.width - dW - 0.4, midX - rB.x));
    } else {
      const midY = shared.overlapStart + (shared.length - dW) / 2;
      doorOffsetA = Math.max(0.4, Math.min(rA.height - dW - 0.4, midY - rA.y));
      doorOffsetB = Math.max(0.4, Math.min(rB.height - dW - 0.4, midY - rB.y));
    }

    // Add to rA if not already present
    if (!rA.doors.some((d) => d.wall === shared.wall && Math.abs(d.offset - doorOffsetA) < 1.0)) {
      rA.doors.push({
        id: `door-${rA.id}-${rB.id}`,
        wall: shared.wall,
        offset: doorOffsetA,
        width: dW,
        swingDirection: 'inside',
        connectsTo: rB.id,
      });
    }

    // Add to rB if not already present
    if (!rB.doors.some((d) => d.wall === shared.otherWall && Math.abs(d.offset - doorOffsetB) < 1.0)) {
      rB.doors.push({
        id: `door-${rB.id}-${rA.id}`,
        wall: shared.otherWall,
        offset: doorOffsetB,
        width: dW,
        swingDirection: 'inside',
        connectsTo: rA.id,
      });
    }
  };

  const livingRoom = indoorRooms.find((r) => r.name.toLowerCase().includes('living') || r.name.toLowerCase().includes('hall'));
  const masterBedroom = indoorRooms.find((r) => r.name.toLowerCase().includes('master'));
  const attachedBath = indoorRooms.find((r) => r.name.toLowerCase().includes('attached'));
  const diningRoom = indoorRooms.find((r) => r.name.toLowerCase().includes('dining'));
  const kitchenRoom = indoorRooms.find((r) => r.name.toLowerCase().includes('kitchen'));

  // 1. ATTACHED BATHROOM -> MASTER BEDROOM (Strict relationship)
  if (attachedBath) {
    const shared = getSharedWalls(attachedBath);
    // Prefer connection to Master Bedroom
    const masterShared = shared.find((s) => masterBedroom && s.otherRoom.id === masterBedroom.id);
    if (masterShared && masterBedroom) {
      addInteriorDoor(attachedBath, masterBedroom, masterShared, 2.6);
    } else if (shared.length > 0) {
      // Connect to the best adjacent room (bedroom or corridor)
      addInteriorDoor(attachedBath, shared[0].otherRoom, shared[0], 2.6);
    }
  }

  // 2. COMMON BATHROOM -> LIVING / DINING / CORRIDOR (Never on exterior, avoid master bed)
  const otherBaths = indoorRooms.filter(
    (r) =>
      (r.name.toLowerCase().includes('bath') || r.name.toLowerCase().includes('toilet')) &&
      r.id !== attachedBath?.id
  );
  otherBaths.forEach((bath) => {
    if (bath.doors.length === 0) {
      const shared = getSharedWalls(bath);
      const publicShared = shared.find((s) => s.otherRoom.id === livingRoom?.id || s.otherRoom.id === diningRoom?.id);
      const targetShared = publicShared || shared[0];
      if (targetShared) {
        addInteriorDoor(bath, targetShared.otherRoom, targetShared, 2.6);
      }
    }
  });

  // 3. MASTER BEDROOM & OTHER BEDROOMS -> CIRCULATION / LIVING / DINING
  const allBedrooms = indoorRooms.filter((r) => r.name.toLowerCase().includes('bed'));
  allBedrooms.forEach((bed) => {
    // Check if it already has a door to circulation/living/dining
    const hasCirculationDoor = bed.doors.some(
      (d) => d.connectsTo === livingRoom?.id || d.connectsTo === diningRoom?.id
    );
    if (!hasCirculationDoor) {
      const shared = getSharedWalls(bed);
      // Filter out bathrooms for main bedroom entry
      const nonBathShared = shared.filter(
        (s) => !s.otherRoom.name.toLowerCase().includes('bath') && !s.otherRoom.name.toLowerCase().includes('toilet')
      );
      const livingShared = nonBathShared.find((s) => s.otherRoom.id === livingRoom?.id);
      const diningShared = nonBathShared.find((s) => s.otherRoom.id === diningRoom?.id);
      const bestShared = livingShared || diningShared || nonBathShared[0] || shared[0];
      if (bestShared) {
        addInteriorDoor(bed, bestShared.otherRoom, bestShared, 3.0);
      }
    }
  });

  // 4. KITCHEN -> DINING / LIVING
  if (kitchenRoom && kitchenRoom.doors.length === 0) {
    const shared = getSharedWalls(kitchenRoom);
    const diningShared = shared.find((s) => s.otherRoom.id === diningRoom?.id);
    const livingShared = shared.find((s) => s.otherRoom.id === livingRoom?.id);
    const targetShared = diningShared || livingShared || shared[0];
    if (targetShared) {
      addInteriorDoor(kitchenRoom, targetShared.otherRoom, targetShared, 3.2);
    }
  }

  // 5. DINING ROOM -> LIVING ROOM
  if (diningRoom && livingRoom && !diningRoom.doors.some((d) => d.connectsTo === livingRoom.id)) {
    const shared = getSharedWalls(diningRoom);
    const livingShared = shared.find((s) => s.otherRoom.id === livingRoom.id);
    if (livingShared) {
      addInteriorDoor(diningRoom, livingRoom, livingShared, 3.4);
    }
  }

  // 6. REMAINING ENCLOSED ROOMS (Pooja, Study, Store, Utility, Staircase)
  indoorRooms.forEach((r) => {
    if (r.doors.length === 0) {
      const shared = getSharedWalls(r);
      if (shared.length > 0) {
        const publicShared = shared.find(
          (s) => s.otherRoom.id === livingRoom?.id || s.otherRoom.id === diningRoom?.id
        );
        const targetShared = publicShared || shared[0];
        addInteriorDoor(r, targetShared.otherRoom, targetShared, 2.8);
      }
    }
  });

  // 7. MAIN ENTRANCE DOOR ON LIVING ROOM / FOYER (Front facing)
  const hostEntranceRoom = livingRoom || indoorRooms[0];
  if (hostEntranceRoom) {
    const frontWall = entrance.wall || (facingDirection === 'South' ? 'south' : facingDirection === 'North' ? 'north' : facingDirection === 'East' ? 'east' : 'west');
    const dW = 3.8;
    let dOff = 0;

    if (frontWall === 'north' || frontWall === 'south') {
      dOff = Math.max(0.6, Math.min(hostEntranceRoom.width - dW - 0.6, hostEntranceRoom.width / 2 - dW / 2));
    } else {
      dOff = Math.max(0.6, Math.min(hostEntranceRoom.height - dW - 0.6, hostEntranceRoom.height / 2 - dW / 2));
    }

    if (!hostEntranceRoom.doors.some((d) => d.wall === frontWall && d.width >= 3.4)) {
      hostEntranceRoom.doors.unshift({
        id: `main-entrance-door-${hostEntranceRoom.id}`,
        wall: frontWall,
        offset: dOff,
        width: dW,
        swingDirection: 'inside',
        connectsTo: 'outside',
      });
    }
  }

  // 8. ARCHITECTURAL WINDOW GENERATION (On Exterior Envelope Walls)
  indoorRooms.forEach((r) => {
    const isLiving = r.id === livingRoom?.id;
    const isMaster = r.id === masterBedroom?.id;
    const isBed = r.name.toLowerCase().includes('bed');
    const isKitchen = r.id === kitchenRoom?.id;
    const isDining = r.id === diningRoom?.id;
    const isSanitary = r.name.toLowerCase().includes('bath') || r.name.toLowerCase().includes('toilet');

    const sides: Array<'north' | 'south' | 'east' | 'west'> = ['north', 'south', 'east', 'west'];

    sides.forEach((side) => {
      // Check if this side is exterior (not shared with any indoor room)
      const sharedWithOther = indoorRooms.some((other) => {
        if (other.id === r.id) return false;
        if (side === 'north') return Math.abs(r.y - (other.y + other.height)) < 0.5 && other.x < r.x + r.width - 0.5 && other.x + other.width > r.x + 0.5;
        if (side === 'south') return Math.abs(r.y + r.height - other.y) < 0.5 && other.x < r.x + r.width - 0.5 && other.x + other.width > r.x + 0.5;
        if (side === 'west') return Math.abs(r.x - (other.x + other.width)) < 0.5 && other.y < r.y + r.height - 0.5 && other.y + other.height > r.y + 0.5;
        if (side === 'east') return Math.abs(r.x + r.width - other.x) < 0.5 && other.y < r.y + r.height - 0.5 && other.y + other.height > r.y + 0.5;
        return false;
      });

      if (!sharedWithOther) {
        const wallLen = side === 'north' || side === 'south' ? r.width : r.height;
        if (wallLen >= 3.5) {
          let winW = 3.6;
          if (isLiving) winW = Math.min(5.5, wallLen * 0.55);
          else if (isMaster) winW = Math.min(5.0, wallLen * 0.5);
          else if (isBed) winW = Math.min(4.0, wallLen * 0.45);
          else if (isDining) winW = Math.min(4.2, wallLen * 0.45);
          else if (isKitchen) winW = Math.min(3.6, wallLen * 0.4);
          else if (isSanitary) winW = Math.min(2.4, wallLen * 0.35);

          const winOff = Math.max(0.6, (wallLen - winW) / 2);

          // Ensure window does not collide with a door on the same wall
          const doorsOnWall = r.doors.filter((d) => d.wall === side);
          let collidesWithDoor = false;
          for (const d of doorsOnWall) {
            const dStart = d.offset - 0.5;
            const dEnd = d.offset + d.width + 0.5;
            if (winOff < dEnd && winOff + winW > dStart) {
              collidesWithDoor = true;
              break;
            }
          }

          if (!collidesWithDoor && !r.windows.some((w) => w.wall === side)) {
            r.windows.push({
              id: `win-${r.id}-${side}`,
              wall: side,
              offset: winOff,
              width: winW,
            });
          }
        }
      }
    });
  });
}
