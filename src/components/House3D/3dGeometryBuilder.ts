import * as THREE from 'three';
import { FacingDirection, LayoutData, RoomPlacement, RoofType } from '../../types';
import {
  createWoodFloorTexture,
  createTileFloorTexture,
  createStuccoTexture,
  createRoofTileTexture,
  createPaverTexture,
  createGrassTexture,
  createSolarPanelTexture,
  createMainEntranceBadgeTexture,
  createMainEntrancePlaqueTexture,
  createEntranceDoormatTexture,
} from './proceduralTextures';

export interface Scene3DOptions {
  isWalkthrough?: boolean;
  lightingPreset?: 'daylight' | 'golden' | 'evening';
}

export interface WallCollisionSegment {
  axis: 'H' | 'V';
  floor: number;
  fixedCoord: number; // Z for 'H', X for 'V'
  start: number; // min X for 'H', min Z for 'V'
  end: number; // max X for 'H', max Z for 'V'
  isExterior?: boolean;
  doors: Array<{ offset: number; width: number }>;
  windows?: Array<{
    offset: number;
    width: number;
    roomType?: 'living' | 'bedroom' | 'kitchen' | 'sanitary' | 'staircase' | 'dining' | 'balcony' | 'default';
  }>;
}

// Convert 2D room (x, y) coordinates to 3D coordinates relative to land center
export function to3DPos(x: number, y: number, w: number, h: number, landW: number, landH: number) {
  const posX = x + w / 2 - landW / 2;
  const posZ = y + h / 2 - landH / 2;
  return { posX, posZ };
}

export interface SetbackBounds {
  plotMinX: number;
  plotMaxX: number;
  plotMinZ: number;
  plotMaxZ: number;
  plotW: number;
  plotH: number;
  frontSetback: number;
  rearSetback: number;
  sideSetback: number;
}

export interface PolygonVertex3D {
  x: number;
  z: number;
}

export interface PolygonEdge3D {
  index: number;
  p1: PolygonVertex3D;
  p2: PolygonVertex3D;
  length: number;
  midpoint: PolygonVertex3D;
  angle: number; // in radians: Math.atan2(p2.z - p1.z, p2.x - p1.x)
  normal: PolygonVertex3D; // unit outward normal in X-Z plane
}

/**
 * Returns polygon boundary vertices in 3D centered space.
 * For irregular polygon plots, maps layoutData.land.polygonPoints accurately.
 * For rectangular plots, falls back to setback bounds.
 */
export function getPolygonVertices3D(layoutData: LayoutData): PolygonVertex3D[] {
  const landW = layoutData.land.length;
  const landH = layoutData.land.breadth;
  const isPolygon =
    layoutData.land.plotType === 'polygon' &&
    !!layoutData.land.polygonPoints &&
    layoutData.land.polygonPoints.length >= 3;

  if (isPolygon) {
    return layoutData.land.polygonPoints!.map((pt) => ({
      x: pt.x - landW / 2,
      z: pt.y - landH / 2,
    }));
  }

  // Rectangular plot boundary with setbacks
  const setbacks = computePlotSetbacks(landW, landH, layoutData.facingDirection || 'North');
  return [
    { x: setbacks.plotMinX, z: setbacks.plotMinZ },
    { x: setbacks.plotMaxX, z: setbacks.plotMinZ },
    { x: setbacks.plotMaxX, z: setbacks.plotMaxZ },
    { x: setbacks.plotMinX, z: setbacks.plotMaxZ },
  ];
}

/**
 * Computes consecutive boundary edges, angles, lengths, midpoints, and outward normals for polygon vertices
 */
export function computePolygonEdges(vertices: PolygonVertex3D[]): PolygonEdge3D[] {
  if (!vertices || vertices.length < 3) return [];
  const n = vertices.length;

  // Calculate polygon centroid
  let sumX = 0;
  let sumZ = 0;
  for (const v of vertices) {
    sumX += v.x;
    sumZ += v.z;
  }
  const centroid = { x: sumX / n, z: sumZ / n };

  const edges: PolygonEdge3D[] = [];

  for (let i = 0; i < n; i++) {
    const p1 = vertices[i];
    const p2 = vertices[(i + 1) % n];
    const dx = p2.x - p1.x;
    const dz = p2.z - p1.z;
    const length = Math.hypot(dx, dz);
    if (length < 1e-4) continue;

    const midpoint = {
      x: (p1.x + p2.x) / 2,
      z: (p1.z + p2.z) / 2,
    };
    const angle = Math.atan2(dz, dx);

    // Initial normal perpendicular to edge: (dz, -dx) normalized
    let nx = dz / length;
    let nz = -dx / length;

    // Ensure normal points outward from polygon centroid
    const toMidX = midpoint.x - centroid.x;
    const toMidZ = midpoint.z - centroid.z;
    const dot = nx * toMidX + nz * toMidZ;
    if (dot < 0) {
      nx = -nx;
      nz = -nz;
    }

    edges.push({
      index: i,
      p1,
      p2,
      length,
      midpoint,
      angle,
      normal: { x: nx, z: nz },
    });
  }

  return edges;
}

/**
 * Finds the edge best aligned with the road frontage / facing direction
 */
export function findRoadFacingEdge(
  edges: PolygonEdge3D[],
  facing: FacingDirection,
  targetPoint?: { x: number; z: number }
): PolygonEdge3D {
  if (edges.length === 0) {
    return {
      index: 0,
      p1: { x: -20, z: -20 },
      p2: { x: 20, z: -20 },
      length: 40,
      midpoint: { x: 0, z: -20 },
      angle: 0,
      normal: { x: 0, z: -1 },
    };
  }

  let targetVec = { x: 0, z: -1 }; // North
  if (facing === 'South') targetVec = { x: 0, z: 1 };
  else if (facing === 'East') targetVec = { x: 1, z: 0 };
  else if (facing === 'West') targetVec = { x: -1, z: 0 };

  let bestEdge = edges[0];
  let bestScore = -Infinity;

  for (const edge of edges) {
    const dot = edge.normal.x * targetVec.x + edge.normal.z * targetVec.z;
    let score = dot;

    if (targetPoint) {
      const dist = Math.hypot(edge.midpoint.x - targetPoint.x, edge.midpoint.z - targetPoint.z);
      score += Math.max(-0.5, 0.5 - dist / 50);
    }

    if (score > bestScore) {
      bestScore = score;
      bestEdge = edge;
    }
  }

  return bestEdge;
}

/**
 * Robust 2D point in polygon containment test in 3D X-Z space
 */
export function isPointInsidePolygon3D(pt: { x: number; z: number }, vertices: PolygonVertex3D[]): boolean {
  if (!vertices || vertices.length < 3) return false;
  let inside = false;
  const n = vertices.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = vertices[i].x;
    const zi = vertices[i].z;
    const xj = vertices[j].x;
    const zj = vertices[j].z;

    const intersect =
      zi > pt.z !== zj > pt.z &&
      pt.x < ((xj - xi) * (pt.z - zi)) / (zj - zi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Calculates realistic architectural plot setbacks around the house footprint.
 * The setback bounds define the exact property boundary limits (plotMinX..plotMaxX, plotMinZ..plotMaxZ)
 * in 3D centered space.
 */
export function computePlotSetbacks(
  landW: number,
  landH: number,
  facing: string,
  layoutData?: LayoutData
): SetbackBounds {
  const sp = layoutData?.sitePlan?.setbacks;
  const frontSetback = sp ? sp.front : 8.5; // 8.5 ft front setback for driveway, entrance path & front lawn
  const rearSetback = sp ? sp.rear : 5.0; // 5.0 ft rear setback for backyard & garden verge
  const sideSetback = sp ? sp.left : 4.5; // 4.5 ft side setback pathways with pavers & lawn borders

  // Exact property boundary in centered 3D space:
  const plotMinX = -landW / 2;
  const plotMaxX = landW / 2;
  const plotMinZ = -landH / 2;
  const plotMaxZ = landH / 2;
  const plotW = landW;
  const plotH = landH;

  return {
    plotMinX,
    plotMaxX,
    plotMinZ,
    plotMaxZ,
    plotW,
    plotH,
    frontSetback,
    rearSetback,
    sideSetback,
  };
}

interface RawWallSegment {
  axis: 'H' | 'V';
  floor: number;
  fixedCoord: number;
  start: number;
  end: number;
  isExterior?: boolean;
  doors: Array<{ offset: number; width: number }>;
  windows: Array<{
    offset: number;
    width: number;
    roomType?: 'living' | 'bedroom' | 'kitchen' | 'sanitary' | 'staircase' | 'dining' | 'balcony' | 'default';
  }>;
}

/**
 * Builds the entire 3D house scene strictly based on validated 2D layoutData geometry.
 * Enhances architectural realism with authentic procedural textures, volumetric elements,
 * modern exterior façades, fenestrations, interior fixtures, and landscaping.
 */
export function buildHouse3DScene(
  scene: THREE.Scene,
  layoutData: LayoutData,
  options: Scene3DOptions = {}
): {
  houseGroup: THREE.Group;
  roofGroup: THREE.Group;
  roomMeshes: THREE.Mesh[];
  buildingBounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  mergedWalls: WallCollisionSegment[];
  entrance3DPos: { x: number; y: number; z: number };
} {
  const landW = layoutData.land.length;
  const landH = layoutData.land.breadth;
  const wallHeight = 9.5; // Standard residential 9.5 ft ceiling
  const wallThickness = 0.5; // 6 inches wall thickness
  const facing = layoutData.facingDirection || 'North';

  const setbacks = computePlotSetbacks(landW, landH, facing, layoutData);

  const houseGroup = new THREE.Group();
  const roofGroup = new THREE.Group();
  const roomMeshes: THREE.Mesh[] = [];

  // 1. PROCEDURAL ARCHITECTURAL TEXTURES & MATERIALS
  const woodFloorTex = createWoodFloorTexture();
  const tileFloorTex = createTileFloorTexture('#F1F5F9', '#CBD5E1', 64);
  const bathTileTex = createTileFloorTexture('#E2E8F0', '#94A3B8', 48);
  const stuccoTex = createStuccoTexture();
  const roofTileTex = createRoofTileTexture();
  const paverTex = createPaverTexture();
  const grassTex = createGrassTexture();
  const solarTex = createSolarPanelTexture();

  // Exterior Wall Finish: Warm Off-White Architectural Stucco with fine grain
  const exteriorWallMat = new THREE.MeshStandardMaterial({
    color: '#F8FAFC',
    map: stuccoTex,
    roughness: 0.55,
    metalness: 0.02,
  });

  // Modern Accent Cladding: Warm Walnut Timber Slats
  const timberCladdingMat = new THREE.MeshStandardMaterial({
    color: '#854D0E',
    roughness: 0.4,
    metalness: 0.05,
  });

  // Dark Architectural Feature Wall: Charcoal Slate
  const featureSlateMat = new THREE.MeshStandardMaterial({
    color: '#1E293B',
    roughness: 0.45,
    metalness: 0.1,
  });

  // Interior Wall Finish: Crisp Pure White Plaster
  const interiorWallMat = new THREE.MeshStandardMaterial({
    color: '#FFFFFF',
    roughness: 0.6,
    metalness: 0.0,
  });

  // Ceiling Finish: Soft Matte Light Off-White
  const ceilingMat = new THREE.MeshStandardMaterial({
    color: '#F8FAFC',
    roughness: 0.7,
    metalness: 0.0,
  });

  // Architectural Master Frame Finish: Crisp Light Architectural Anodized Aluminum / Off-White Trim
  const blackFrameMat = new THREE.MeshStandardMaterial({
    color: '#F1F5F9', // Crisp light off-white / light aluminum architectural frame
    roughness: 0.28,
    metalness: 0.2,
  });

  // Cross-Frame Mullions & Muntins Finish: Light Architectural Aluminum
  const mullionMat = new THREE.MeshStandardMaterial({
    color: '#E2E8F0', // Clean light aluminum sash mullion
    roughness: 0.3,
    metalness: 0.18,
  });

  // White Window Sash / Trim Accent
  const whiteTrimMat = new THREE.MeshStandardMaterial({
    color: '#FFFFFF',
    roughness: 0.3,
    metalness: 0.05,
  });

  // Window Sill Shelf (Exterior Molded Stone Sill with Drip Edge)
  const sillMat = new THREE.MeshStandardMaterial({
    color: '#E2E8F0',
    roughness: 0.45,
    metalness: 0.08,
  });

  // Primary Exterior Glass Layer: Light Sky-Tinted Architectural Insulated Glass with Natural Reflectivity & Clearcoat
  const darkGlassMat = new THREE.MeshPhysicalMaterial({
    color: '#E0F2FE', // Very light sky blue-gray daylight glass tint
    roughness: 0.04,
    metalness: 0.08,
    transparent: true,
    opacity: 0.36,
    transmission: 0.85,
    ior: 1.52,
    reflectivity: 0.88,
    clearcoat: 0.9,
    clearcoatRoughness: 0.04,
  });

  // Secondary Interior Glass Layer: Clear Crystal Translucent Double-Pane Layer
  const innerGlassMat = new THREE.MeshPhysicalMaterial({
    color: '#F0F9FF', // Clear translucent crystal glass
    roughness: 0.05,
    metalness: 0.02,
    transparent: true,
    opacity: 0.22,
    transmission: 0.92,
    ior: 1.50,
    reflectivity: 0.72,
    clearcoat: 0.6,
    clearcoatRoughness: 0.05,
  });

  // Frosted Bathroom Privacy Glass with Soft Translucency & Specular Sheen
  const frostedGlassMat = new THREE.MeshPhysicalMaterial({
    color: '#E2E8F0',
    roughness: 0.32,
    metalness: 0.08,
    transparent: true,
    opacity: 0.88,
    transmission: 0.28,
    ior: 1.48,
    clearcoat: 0.5,
    clearcoatRoughness: 0.1,
  });

  // Balcony Glass Railing
  const glassRailMat = new THREE.MeshPhysicalMaterial({
    color: '#93C5FD',
    roughness: 0.08,
    transparent: true,
    opacity: 0.5,
    transmission: 0.8,
    ior: 1.5,
  });

  // Rich Warm Timber for Doors
  const woodDoorMat = new THREE.MeshStandardMaterial({
    color: '#78350F',
    roughness: 0.35,
    metalness: 0.08,
  });

  // Floor Materials with Procedural Textures
  const woodFloorMat = new THREE.MeshStandardMaterial({
    color: '#FFFFFF',
    map: woodFloorTex,
    roughness: 0.35,
    metalness: 0.05,
  });

  const marbleFloorMat = new THREE.MeshStandardMaterial({
    color: '#FFFFFF',
    map: tileFloorTex,
    roughness: 0.2,
    metalness: 0.1,
  });

  const kitchenTileMat = new THREE.MeshStandardMaterial({
    color: '#FFFFFF',
    map: tileFloorTex,
    roughness: 0.25,
    metalness: 0.05,
  });

  const bathroomTileMat = new THREE.MeshStandardMaterial({
    color: '#FFFFFF',
    map: bathTileTex,
    roughness: 0.3,
    metalness: 0.05,
  });

  const grassMat = new THREE.MeshStandardMaterial({
    color: '#FFFFFF',
    map: grassTex,
    roughness: 0.9,
    metalness: 0.0,
  });

  const paverMat = new THREE.MeshStandardMaterial({
    color: '#FFFFFF',
    map: paverTex,
    roughness: 0.75,
    metalness: 0.05,
  });

  // 2. PLOT GROUND, SETBACK SPACES & RAISED FOUNDATION PLINTH
  const isPolygonPlot =
    layoutData.land.plotType === 'polygon' &&
    !!layoutData.land.polygonPoints &&
    layoutData.land.polygonPoints.length >= 3;

  const polygonVertices = getPolygonVertices3D(layoutData);
  const polygonEdges = computePolygonEdges(polygonVertices);

  const parkRoom = layoutData.rooms.find(
    (r) =>
      r.name.toLowerCase().includes('park') ||
      r.name.toLowerCase().includes('car') ||
      r.name.toLowerCase().includes('porch') ||
      r.name.toLowerCase().includes('garage')
  );
  const parkTarget = parkRoom
    ? to3DPos(parkRoom.x, parkRoom.y, parkRoom.width, parkRoom.height, landW, landH)
    : undefined;
  const roadFacingEdge = findRoadFacingEdge(
    polygonEdges,
    facing as FacingDirection,
    parkTarget ? { x: parkTarget.posX, z: parkTarget.posZ } : undefined
  );

  // Master Infinite Ground Plane (Lush Green Grass)
  const masterSpan = Math.max(setbacks.plotW, setbacks.plotH, landW, landH) * 4.0;
  const masterGroundGeo = new THREE.PlaneGeometry(masterSpan, masterSpan);
  const masterGroundMat = new THREE.MeshStandardMaterial({
    color: '#34D399',
    map: grassTex,
    roughness: 0.9,
    metalness: 0.0,
  });
  const masterGround = new THREE.Mesh(masterGroundGeo, masterGroundMat);
  masterGround.rotation.x = -Math.PI / 2;
  masterGround.position.set((setbacks.plotMinX + setbacks.plotMaxX) / 2, -0.3, (setbacks.plotMinZ + setbacks.plotMaxZ) / 2);
  masterGround.receiveShadow = true;
  houseGroup.add(masterGround);

  // Setback Yard Space between House Plinth and Compound Walls
  buildPlotSetbackGround(
    houseGroup,
    landW,
    landH,
    setbacks,
    paverMat,
    grassMat,
    layoutData,
    polygonVertices,
    polygonEdges,
    roadFacingEdge,
    isPolygonPlot
  );

  // Raised Foundation Plinth Step under the House Footprint
  let indoorMinX = Infinity;
  let indoorMaxX = -Infinity;
  let indoorMinZ = Infinity;
  let indoorMaxZ = -Infinity;

  layoutData.rooms.forEach((r) => {
    const nameLower = r.name.toLowerCase();
    const isOutdoor =
      r.category === 'outdoor' ||
      nameLower.includes('garden') ||
      nameLower.includes('lawn') ||
      nameLower.includes('yard') ||
      nameLower.includes('park') ||
      nameLower.includes('car') ||
      nameLower.includes('porch');
    if (!isOutdoor) {
      const { posX, posZ } = to3DPos(r.x, r.y, r.width, r.height, landW, landH);
      indoorMinX = Math.min(indoorMinX, posX - r.width / 2);
      indoorMaxX = Math.max(indoorMaxX, posX + r.width / 2);
      indoorMinZ = Math.min(indoorMinZ, posZ - r.height / 2);
      indoorMaxZ = Math.max(indoorMaxZ, posZ + r.height / 2);
    }
  });

  const hasIndoorRooms = indoorMinX < indoorMaxX && indoorMinZ < indoorMaxZ;

  // Plot Perimeter Boundary Compound Wall with Masonry Pillars & Modern Gates positioned at true plot boundary
  buildCompoundWallAndGates(
    houseGroup,
    setbacks,
    facing,
    layoutData,
    polygonVertices,
    polygonEdges,
    roadFacingEdge,
    isPolygonPlot
  );

  // Exterior Public Access Road with Sidewalk and Markings on Facing Side
  buildExteriorAccessRoad(
    houseGroup,
    setbacks,
    facing,
    roadFacingEdge,
    isPolygonPlot
  );

  // 3. ROOM BOUNDS & INDEPENDENT FLOORS, CEILINGS & WARM AMBIENT LIGHTS
  // Authoritative filter for indoor rooms defining the building footprint
  const indoorRooms = layoutData.rooms.filter((r) => {
    const nameLower = (r.name || '').toLowerCase();
    const cat = (r.category || '').toLowerCase();
    const type = ((r as any).type || '').toLowerCase();
    const isOutdoor = cat === 'outdoor' || cat === 'open' ||
      nameLower.includes('garden') || nameLower.includes('lawn') || nameLower.includes('yard') ||
      nameLower.includes('park') || nameLower.includes('car') || nameLower.includes('porch') ||
      type === 'garden' || type === 'parking';
    return !isOutdoor;
  });

  const maxFloor = indoorRooms.length > 0
    ? Math.max(...indoorRooms.map((r) => (r as any).floor || 0))
    : 0;

  // Precompute 3D bounding boxes for all indoor rooms to accurately classify exterior vs interior walls
  const indoorRoomBoxes = indoorRooms.map((r) => {
    const { posX, posZ } = to3DPos(r.x, r.y, r.width, r.height, landW, landH);
    const halfW = r.width / 2;
    const halfH = r.height / 2;
    return {
      id: r.id,
      floor: (r as any).floor || 0,
      minX: posX - halfW,
      maxX: posX + halfW,
      minZ: posZ - halfH,
      maxZ: posZ + halfH,
    };
  });

  // Determines if a wall segment lies on the exterior perimeter of the building footprint
  const isSegmentExterior = (axis: 'H' | 'V', floor: number, fixedCoord: number, start: number, end: number): boolean => {
    const mid = (start + end) / 2;
    const eps = 0.25;
    if (axis === 'H') {
      const z1 = fixedCoord - eps;
      const z2 = fixedCoord + eps;
      const in1 = indoorRoomBoxes.some((b) => b.floor === floor && mid >= b.minX - 0.05 && mid <= b.maxX + 0.05 && z1 >= b.minZ && z1 <= b.maxZ);
      const in2 = indoorRoomBoxes.some((b) => b.floor === floor && mid >= b.minX - 0.05 && mid <= b.maxX + 0.05 && z2 >= b.minZ && z2 <= b.maxZ);
      return in1 !== in2;
    } else {
      const x1 = fixedCoord - eps;
      const x2 = fixedCoord + eps;
      const in1 = indoorRoomBoxes.some((b) => b.floor === floor && mid >= b.minZ - 0.05 && mid <= b.maxZ + 0.05 && x1 >= b.minX && x1 <= b.maxX);
      const in2 = indoorRoomBoxes.some((b) => b.floor === floor && mid >= b.minZ - 0.05 && mid <= b.maxZ + 0.05 && x2 >= b.minX && x2 <= b.maxX);
      return in1 !== in2;
    }
  };

  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;

  const rawWallSegments: RawWallSegment[] = [];

  layoutData.rooms.forEach((room) => {
    const nameLower = room.name.toLowerCase();
    const isGarden = nameLower.includes('garden') || nameLower.includes('lawn') || nameLower.includes('yard');
    const isParking = nameLower.includes('park') || nameLower.includes('car') || nameLower.includes('porch');
    const isBalcony = nameLower.includes('balcony');
    const isStaircase = nameLower.includes('stair');
    const isSanitary = room.category === 'sanitary' || nameLower.includes('bath') || nameLower.includes('toilet');
    const isKitchen = nameLower.includes('kitchen') || nameLower.includes('pantry');
    const isDining = nameLower.includes('dining');
    const isBedroom = nameLower.includes('bed') || nameLower.includes('study') || nameLower.includes('office');
    const isLiving = nameLower.includes('living') || nameLower.includes('hall') || nameLower.includes('drawing') || nameLower.includes('family');
    const isOutdoor = room.category === 'outdoor' || isGarden || isParking;

    let roomType: 'living' | 'bedroom' | 'kitchen' | 'sanitary' | 'staircase' | 'dining' | 'balcony' | 'default' = 'default';
    if (isLiving) roomType = 'living';
    else if (isBedroom) roomType = 'bedroom';
    else if (isKitchen) roomType = 'kitchen';
    else if (isSanitary) roomType = 'sanitary';
    else if (isStaircase) roomType = 'staircase';
    else if (isDining) roomType = 'dining';
    else if (isBalcony) roomType = 'balcony';

    const floorLevel = (room as any).floor || 0;
    const yElevation = floorLevel * wallHeight;

    const { posX, posZ } = to3DPos(room.x, room.y, room.width, room.height, landW, landH);
    const halfW = room.width / 2;
    const halfH = room.height / 2;

    if (!isOutdoor) {
      minX = Math.min(minX, posX - halfW);
      maxX = Math.max(maxX, posX + halfW);
      minZ = Math.min(minZ, posZ - halfH);
      maxZ = Math.max(maxZ, posZ + halfH);
    }

    // A. INDEPENDENT FLOOR PLATE FOR EVERY ROOM
    let fMat = marbleFloorMat;
    if (isGarden) fMat = grassMat;
    else if (isParking) fMat = paverMat;
    else if (isSanitary) fMat = bathroomTileMat;
    else if (isKitchen) fMat = kitchenTileMat;
    else if (isBedroom || isLiving) fMat = woodFloorMat;

    const floorGeo = new THREE.BoxGeometry(room.width, 0.15, room.height);
    const floorMesh = new THREE.Mesh(floorGeo, fMat);
    floorMesh.position.set(posX, yElevation + 0.075, posZ);
    floorMesh.receiveShadow = true;
    floorMesh.userData = { roomData: room };
    houseGroup.add(floorMesh);
    roomMeshes.push(floorMesh);

    // Baseboard / Skirting Board trim along perimeter of room
    if (!isOutdoor && !isGarden && !isParking && !isBalcony) {
      const baseboardMat = new THREE.MeshStandardMaterial({ color: '#FFFFFF', roughness: 0.4 });
      const bH = 0.35;
      const bT = 0.04;
      const bN = new THREE.Mesh(new THREE.BoxGeometry(room.width - 0.2, bH, bT), baseboardMat);
      bN.position.set(posX, yElevation + bH / 2 + 0.15, posZ - halfH + bT / 2);
      const bS = new THREE.Mesh(new THREE.BoxGeometry(room.width - 0.2, bH, bT), baseboardMat);
      bS.position.set(posX, yElevation + bH / 2 + 0.15, posZ + halfH - bT / 2);
      const bW = new THREE.Mesh(new THREE.BoxGeometry(bT, bH, room.height - 0.2), baseboardMat);
      bW.position.set(posX - halfW + bT / 2, yElevation + bH / 2 + 0.15, posZ);
      const bE = new THREE.Mesh(new THREE.BoxGeometry(bT, bH, room.height - 0.2), baseboardMat);
      bE.position.set(posX + halfW - bT / 2, yElevation + bH / 2 + 0.15, posZ);
      houseGroup.add(bN, bS, bW, bE);
    }

    // B. INTERMEDIATE CEILING/FLOOR PLATE (For multi-story lower floors)
    if (!isOutdoor && !isGarden && !isParking && !isBalcony) {
      if (floorLevel < maxFloor) {
        const ceilingGeo = new THREE.BoxGeometry(room.width, 0.15, room.height);
        const ceilingMesh = new THREE.Mesh(ceilingGeo, ceilingMat);
        ceilingMesh.position.set(posX, yElevation + wallHeight - 0.075, posZ);
        ceilingMesh.receiveShadow = true;
        houseGroup.add(ceilingMesh);
      }

      // Recessed Architectural Downlight in Ceiling
      const spotLight = new THREE.PointLight(0xFFFBEB, 0.8, Math.max(room.width, room.height) * 2.2);
      spotLight.position.set(posX, yElevation + wallHeight - 0.8, posZ);
      spotLight.castShadow = false;
      houseGroup.add(spotLight);

      // Downlight Bezel Fixture in Ceiling
      const lightBezel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.3, 0.04, 16),
        new THREE.MeshStandardMaterial({ color: '#FFFFFF', roughness: 0.2, emissive: '#FEF3C7', emissiveIntensity: 0.6 })
      );
      lightBezel.position.set(posX, yElevation + wallHeight - 0.15, posZ);
      houseGroup.add(lightBezel);
    }

    // Build Detailed 3D Interior Furniture
    if (!isOutdoor && !isGarden && !isParking && !isBalcony && !isStaircase) {
      buildDetailedRoomFurniture(houseGroup, room, posX, posZ, yElevation, roomType);
    }

    // C. SPECIAL OUTDOOR / ARCHITECTURAL FEATURES
    if (isGarden) {
      buildGardenRoom(houseGroup, posX, posZ, room.width, room.height);
      return;
    }
    if (isParking) {
      buildParkingRoom(houseGroup, posX, posZ, room.width, room.height, wallHeight, facing);
      return;
    }
    if (isBalcony) {
      buildBalconyRoom(houseGroup, posX, posZ, room.width, room.height, yElevation, glassRailMat);
      return;
    }
    if (isStaircase) {
      buildStaircase(houseGroup, posX, posZ, room.width, room.height, wallHeight, yElevation);
    }

    // Determine exterior vs interior classification for each room wall side
    const isExtN = isSegmentExterior('H', floorLevel, posZ - halfH, posX - halfW, posX + halfW);
    const isExtS = isSegmentExterior('H', floorLevel, posZ + halfH, posX - halfW, posX + halfW);
    const isExtW = isSegmentExterior('V', floorLevel, posX - halfW, posZ - halfH, posZ + halfH);
    const isExtE = isSegmentExterior('V', floorLevel, posX + halfW, posZ - halfH, posZ + halfH);

    // D. COLLECT RAW WALL SEGMENTS WITH ARCHITECTURAL WINDOWS (Windows only on exterior walls)
    const nDoors = room.doors.filter((d) => d.wall === 'north');
    let nWindows = room.windows.filter((w) => w.wall === 'north');
    if (nWindows.length === 0 && nDoors.length === 0 && isExtN && room.width >= 4.5 && !isSanitary) {
      const wWidth = isLiving ? Math.min(5.5, room.width * 0.5) : Math.min(3.8, room.width * 0.45);
      nWindows = [{ id: `auto-win-${room.id}-n`, wall: 'north', offset: room.width / 2 - wWidth / 2, width: wWidth }];
    }
    rawWallSegments.push({
      axis: 'H',
      floor: floorLevel,
      fixedCoord: posZ - halfH,
      start: posX - halfW,
      end: posX + halfW,
      isExterior: isExtN,
      doors: nDoors.map((d) => ({ offset: d.offset, width: d.width })),
      windows: isExtN ? nWindows.map((w) => ({ offset: w.offset, width: w.width, roomType })) : [],
    });

    const sDoors = room.doors.filter((d) => d.wall === 'south');
    let sWindows = room.windows.filter((w) => w.wall === 'south');
    if (sWindows.length === 0 && sDoors.length === 0 && isExtS && room.width >= 4.5 && !isSanitary) {
      const wWidth = isLiving ? Math.min(5.5, room.width * 0.5) : Math.min(3.8, room.width * 0.45);
      sWindows = [{ id: `auto-win-${room.id}-s`, wall: 'south', offset: room.width / 2 - wWidth / 2, width: wWidth }];
    }
    rawWallSegments.push({
      axis: 'H',
      floor: floorLevel,
      fixedCoord: posZ + halfH,
      start: posX - halfW,
      end: posX + halfW,
      isExterior: isExtS,
      doors: sDoors.map((d) => ({ offset: d.offset, width: d.width })),
      windows: isExtS ? sWindows.map((w) => ({ offset: w.offset, width: w.width, roomType })) : [],
    });

    const wDoors = room.doors.filter((d) => d.wall === 'west');
    let wWindows = room.windows.filter((w) => w.wall === 'west');
    if (wWindows.length === 0 && wDoors.length === 0 && isExtW && room.height >= 4.5 && !isSanitary) {
      const wWidth = isLiving ? Math.min(5.5, room.height * 0.5) : Math.min(3.8, room.height * 0.45);
      wWindows = [{ id: `auto-win-${room.id}-w`, wall: 'west', offset: room.height / 2 - wWidth / 2, width: wWidth }];
    }
    rawWallSegments.push({
      axis: 'V',
      floor: floorLevel,
      fixedCoord: posX - halfW,
      start: posZ - halfH,
      end: posZ + halfH,
      isExterior: isExtW,
      doors: wDoors.map((d) => ({ offset: d.offset, width: d.width })),
      windows: isExtW ? wWindows.map((w) => ({ offset: w.offset, width: w.width, roomType })) : [],
    });

    const eDoors = room.doors.filter((d) => d.wall === 'east');
    let eWindows = room.windows.filter((w) => w.wall === 'east');
    if (eWindows.length === 0 && eDoors.length === 0 && isExtE && room.height >= 4.5 && !isSanitary) {
      const wWidth = isLiving ? Math.min(5.5, room.height * 0.5) : Math.min(3.8, room.height * 0.45);
      eWindows = [{ id: `auto-win-${room.id}-e`, wall: 'east', offset: room.height / 2 - wWidth / 2, width: wWidth }];
    }
    rawWallSegments.push({
      axis: 'V',
      floor: floorLevel,
      fixedCoord: posX + halfW,
      start: posZ - halfH,
      end: posZ + halfH,
      isExterior: isExtE,
      doors: eDoors.map((d) => ({ offset: d.offset, width: d.width })),
      windows: isExtE ? eWindows.map((w) => ({ offset: w.offset, width: w.width, roomType })) : [],
    });
  });

  if (minX === Infinity) {
    minX = -landW / 2 + 5;
    maxX = landW / 2 - 5;
    minZ = -landH / 2 + 5;
    maxZ = landH / 2 - 5;
  }

  // Unified Solid Architectural Foundation Plinth anchoring the entire building mass
  const plinthMat = new THREE.MeshStandardMaterial({ color: '#CBD5E1', roughness: 0.7 });
  const plinthW = maxX - minX + 0.3;
  const plinthD = maxZ - minZ + 0.3;
  const plinthMesh = new THREE.Mesh(new THREE.BoxGeometry(plinthW, 0.3, plinthD), plinthMat);
  plinthMesh.position.set((minX + maxX) / 2, -0.15, (minZ + maxZ) / 2);
  plinthMesh.receiveShadow = true;
  houseGroup.add(plinthMesh);

  // 4. EXTRACT CONTINUOUS BUILDING EXTERIOR ENVELOPE AND INTERIOR PARTITIONS FROM UNION OF ROOMS
  const mergedWalls = extractContinuousWalls(
    indoorRooms,
    indoorRoomBoxes,
    maxFloor,
    landW,
    landH
  );

  // Entrance 3D Position
  let entrance3DPos = { x: (minX + maxX) / 2, y: 5.2, z: maxZ + 3.0 };

  if (layoutData.entrance) {
    const ent = layoutData.entrance;
    const entX = ent.x + (ent.width || 4.0) / 2 - landW / 2;
    const entZ = ent.y - landH / 2;
    const facing = layoutData.facingDirection || 'South';

    if (facing === 'North') {
      entrance3DPos = { x: entX, y: 5.2, z: entZ - 3.0 };
    } else if (facing === 'East') {
      entrance3DPos = { x: entX + 3.0, y: 5.2, z: entZ };
    } else if (facing === 'West') {
      entrance3DPos = { x: entX - 3.0, y: 5.2, z: entZ };
    } else {
      entrance3DPos = { x: entX, y: 5.2, z: entZ + 3.0 };
    }

    // Ensure front entrance door cutout exists on the host wall
    const isHorizontal = facing === 'North' || facing === 'South';
    const targetCoord = isHorizontal ? entZ : entX;
    const targetVal = isHorizontal ? entX : entZ;

    const frontWalls = mergedWalls.filter((w) => {
      if (isHorizontal && w.axis === 'H') {
        return Math.abs(w.fixedCoord - targetCoord) < 2.5;
      }
      if (!isHorizontal && w.axis === 'V') {
        return Math.abs(w.fixedCoord - targetCoord) < 2.5;
      }
      return false;
    });

    if (frontWalls.length > 0) {
      const wall = frontWalls[0];
      const doorWidth = 3.6;
      const doorOffset = Math.max(0.6, Math.min(wall.end - wall.start - doorWidth - 0.6, targetVal - wall.start - doorWidth / 2));
      const hasDoor = wall.doors.some((d) => Math.abs(d.offset - doorOffset) < 2.0);
      if (!hasDoor) {
        wall.doors.push({ offset: doorOffset, width: doorWidth });
      }

      // Remove any overlapping window from the front entrance area
      wall.windows = wall.windows.filter((w) => {
        const wStart = w.offset;
        const wEnd = w.offset + w.width;
        const dStart = doorOffset - 0.6;
        const dEnd = doorOffset + doorWidth + 0.6;
        return !(wStart < dEnd && wEnd > dStart);
      });
    }
  }

  // BUILD MERGED WALL GEOMETRY WITH PHYSICAL CUTOUTS
  mergedWalls.forEach((wall) => {
    const yElevation = wall.floor * wallHeight;
    const length = wall.end - wall.start;
    if (length < 0.2) return;

    const isExt = wall.isExterior === true;
    const actualThick = isExt ? 0.65 : 0.40;
    // Exterior walls reach full height to meet eaves/parapets.
    // Interior partition walls terminate safely below the ceiling/roof (wallHeight - 0.4 ft).
    const actualWallHeight = isExt ? wallHeight : wallHeight - 0.4;

    if (wall.axis === 'H') {
      buildWallSideWithCutouts(
        houseGroup,
        wall.start,
        wall.fixedCoord,
        length,
        actualThick,
        actualWallHeight,
        yElevation,
        'horizontal',
        wall.doors,
        isExt ? wall.windows : [],
        exteriorWallMat,
        interiorWallMat,
        blackFrameMat,
        mullionMat,
        whiteTrimMat,
        sillMat,
        darkGlassMat,
        innerGlassMat,
        frostedGlassMat,
        woodDoorMat,
        isExt
      );
    } else {
      buildWallSideWithCutouts(
        houseGroup,
        wall.fixedCoord,
        wall.start,
        length,
        actualThick,
        actualWallHeight,
        yElevation,
        'vertical',
        wall.doors,
        isExt ? wall.windows : [],
        exteriorWallMat,
        interiorWallMat,
        blackFrameMat,
        mullionMat,
        whiteTrimMat,
        sillMat,
        darkGlassMat,
        innerGlassMat,
        frostedGlassMat,
        woodDoorMat,
        isExt
      );
    }
  });

  // 5. MAIN ENTRANCE PORCH, STEPS, TIMBER SLATS & ACCENT SCONCES
  if (layoutData.entrance) {
    buildMainEntrancePorch(houseGroup, layoutData, landW, landH, wallHeight, timberCladdingMat, featureSlateMat);
  }

  // 6. ROOF GENERATION DERIVED DIRECTLY FROM AUTHORITATIVE 2D BUILDING FOOTPRINT
  const topFloorRooms = indoorRooms.filter(
    (r) => ((r as any).floor || 0) === maxFloor
  );
  const activeRooms = topFloorRooms.length > 0 ? topFloorRooms : indoorRooms;
  const topElevation = (maxFloor + 1) * wallHeight;
  const roofType = layoutData.roofType || 'flat';

  // Analyze footprint topology: Square, Rectangle, L-Shape, or Composite
  const footprintTopology = analyzeBuildingFootprint(activeRooms, landW, landH);

  // Identify top-floor exterior walls for perimeter parapets & eaves
  const topExteriorWalls = mergedWalls.filter((w) => w.floor === maxFloor && w.isExterior);

  // Build the intelligent common unified roof
  buildCommonRoofSystem(
    roofGroup,
    footprintTopology,
    topElevation,
    roofType,
    topExteriorWalls,
    roofTileTex,
    solarTex,
    landW,
    landH
  );

  // 7. LANDSCAPING: PROCEDURAL LOW-POLY ARCHITECTURAL TREES & HEDGES
  buildLandscapingTrees(houseGroup, setbacks, minX, maxX, minZ, maxZ, polygonVertices, isPolygonPlot);

  return {
    houseGroup,
    roofGroup,
    roomMeshes,
    buildingBounds: { minX, maxX, minZ, maxZ },
    mergedWalls,
    entrance3DPos,
  };
}

/**
 * Data structures for building footprint analysis & roof generation
 */
export interface FootprintRect {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  width: number;
  height: number;
}

export interface BuildingFootprintTopology {
  type: 'rectangle' | 'square' | 'l-shape' | 'composite';
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number; width: number; depth: number };
  activeRooms: RoomPlacement[];
  lShape?: {
    cutoutCorner: 'NW' | 'NE' | 'SW' | 'SE';
    splitX: number;
    splitZ: number;
    concaveCorner: { x: number; z: number };
    vertices: Array<{ x: number; z: number }>; // 6 vertices clockwise
  };
}

/**
 * Extracts and analyzes the unified building footprint from final top-floor indoor rooms
 */
export function analyzeBuildingFootprint(
  activeRooms: RoomPlacement[],
  landW: number,
  landH: number
): BuildingFootprintTopology {
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;

  const roomBoxes = activeRooms.map((r) => {
    const { posX, posZ } = to3DPos(r.x, r.y, r.width, r.height, landW, landH);
    const rMinX = posX - r.width / 2;
    const rMaxX = posX + r.width / 2;
    const rMinZ = posZ - r.height / 2;
    const rMaxZ = posZ + r.height / 2;

    minX = Math.min(minX, rMinX);
    maxX = Math.max(maxX, rMaxX);
    minZ = Math.min(minZ, rMinZ);
    maxZ = Math.max(maxZ, rMaxZ);

    return { minX: rMinX, maxX: rMaxX, minZ: rMinZ, maxZ: rMaxZ, width: r.width, height: r.height };
  });

  const width = maxX - minX;
  const depth = maxZ - minZ;
  const bboxArea = Math.max(1, width * depth);
  const totalRoomArea = activeRooms.reduce((acc, r) => acc + r.width * r.height, 0);

  // Check the 4 corner quadrants of the bounding box to detect L-shape
  const quadThreshold = 0.32;
  const checkQuadrant = (qxMin: number, qxMax: number, qzMin: number, qzMax: number) => {
    return roomBoxes.some((box) => {
      return box.minX < qxMax - 0.5 && box.maxX > qxMin + 0.5 &&
             box.minZ < qzMax - 0.5 && box.maxZ > qzMin + 0.5;
    });
  };

  const hasNW = checkQuadrant(minX, minX + width * quadThreshold, minZ, minZ + depth * quadThreshold);
  const hasNE = checkQuadrant(maxX - width * quadThreshold, maxX, minZ, minZ + depth * quadThreshold);
  const hasSE = checkQuadrant(maxX - width * quadThreshold, maxX, maxZ - depth * quadThreshold, maxZ);
  const hasSW = checkQuadrant(minX, minX + width * quadThreshold, maxZ - depth * quadThreshold, maxZ);

  const missingCorners: Array<'NW' | 'NE' | 'SW' | 'SE'> = [];
  if (!hasNW) missingCorners.push('NW');
  if (!hasNE) missingCorners.push('NE');
  if (!hasSE) missingCorners.push('SE');
  if (!hasSW) missingCorners.push('SW');

  const bounds = { minX, maxX, minZ, maxZ, width, depth };

  // If exactly one corner is missing and area deficit is significant, footprint is L-shaped
  if (missingCorners.length === 1 && totalRoomArea / bboxArea < 0.88) {
    const cutoutCorner = missingCorners[0];
    let splitX = (minX + maxX) / 2;
    let splitZ = (minZ + maxZ) / 2;

    if (cutoutCorner === 'NE') {
      // Find maximum X for rooms in the north half and minimum Z for rooms in east half
      const northRooms = roomBoxes.filter((b) => b.minZ < minZ + depth * 0.45);
      const eastRooms = roomBoxes.filter((b) => b.maxX > maxX - width * 0.45);
      if (northRooms.length > 0) splitX = Math.max(...northRooms.map((b) => b.maxX));
      if (eastRooms.length > 0) splitZ = Math.min(...eastRooms.map((b) => b.minZ));

      splitX = Math.max(minX + width * 0.25, Math.min(maxX - width * 0.25, splitX));
      splitZ = Math.max(minZ + depth * 0.25, Math.min(maxZ - depth * 0.25, splitZ));

      const vertices = [
        { x: minX, z: minZ },
        { x: splitX, z: minZ },
        { x: splitX, z: splitZ }, // Concave corner
        { x: maxX, z: splitZ },
        { x: maxX, z: maxZ },
        { x: minX, z: maxZ },
      ];
      return {
        type: 'l-shape',
        bounds,
        activeRooms,
        lShape: { cutoutCorner: 'NE', splitX, splitZ, concaveCorner: { x: splitX, z: splitZ }, vertices },
      };
    } else if (cutoutCorner === 'NW') {
      const northRooms = roomBoxes.filter((b) => b.minZ < minZ + depth * 0.45);
      const westRooms = roomBoxes.filter((b) => b.minX < minX + width * 0.45);
      if (northRooms.length > 0) splitX = Math.min(...northRooms.map((b) => b.minX));
      if (westRooms.length > 0) splitZ = Math.min(...westRooms.map((b) => b.minZ));

      splitX = Math.max(minX + width * 0.25, Math.min(maxX - width * 0.25, splitX));
      splitZ = Math.max(minZ + depth * 0.25, Math.min(maxZ - depth * 0.25, splitZ));

      const vertices = [
        { x: splitX, z: minZ },
        { x: maxX, z: minZ },
        { x: maxX, z: maxZ },
        { x: minX, z: maxZ },
        { x: minX, z: splitZ },
        { x: splitX, z: splitZ }, // Concave corner
      ];
      return {
        type: 'l-shape',
        bounds,
        activeRooms,
        lShape: { cutoutCorner: 'NW', splitX, splitZ, concaveCorner: { x: splitX, z: splitZ }, vertices },
      };
    } else if (cutoutCorner === 'SE') {
      const southRooms = roomBoxes.filter((b) => b.maxZ > maxZ - depth * 0.45);
      const eastRooms = roomBoxes.filter((b) => b.maxX > maxX - width * 0.45);
      if (southRooms.length > 0) splitX = Math.max(...southRooms.map((b) => b.maxX));
      if (eastRooms.length > 0) splitZ = Math.max(...eastRooms.map((b) => b.maxZ));

      splitX = Math.max(minX + width * 0.25, Math.min(maxX - width * 0.25, splitX));
      splitZ = Math.max(minZ + depth * 0.25, Math.min(maxZ - depth * 0.25, splitZ));

      const vertices = [
        { x: minX, z: minZ },
        { x: maxX, z: minZ },
        { x: maxX, z: splitZ },
        { x: splitX, z: splitZ }, // Concave corner
        { x: splitX, z: maxZ },
        { x: minX, z: maxZ },
      ];
      return {
        type: 'l-shape',
        bounds,
        activeRooms,
        lShape: { cutoutCorner: 'SE', splitX, splitZ, concaveCorner: { x: splitX, z: splitZ }, vertices },
      };
    } else if (cutoutCorner === 'SW') {
      const southRooms = roomBoxes.filter((b) => b.maxZ > maxZ - depth * 0.45);
      const westRooms = roomBoxes.filter((b) => b.minX < minX + width * 0.45);
      if (southRooms.length > 0) splitX = Math.min(...southRooms.map((b) => b.minX));
      if (westRooms.length > 0) splitZ = Math.max(...westRooms.map((b) => b.maxZ));

      splitX = Math.max(minX + width * 0.25, Math.min(maxX - width * 0.25, splitX));
      splitZ = Math.max(minZ + depth * 0.25, Math.min(maxZ - depth * 0.25, splitZ));

      const vertices = [
        { x: minX, z: minZ },
        { x: maxX, z: minZ },
        { x: maxX, z: maxZ },
        { x: splitX, z: maxZ },
        { x: splitX, z: splitZ }, // Concave corner
        { x: minX, z: splitZ },
      ];
      return {
        type: 'l-shape',
        bounds,
        activeRooms,
        lShape: { cutoutCorner: 'SW', splitX, splitZ, concaveCorner: { x: splitX, z: splitZ }, vertices },
      };
    }
  }

  // If square proportions
  const isSquare = Math.abs(width - depth) <= 2.5;
  return {
    type: isSquare ? 'square' : 'rectangle',
    bounds,
    activeRooms,
  };
}

/**
 * Builds a unified, common roof system following the authentic 2D building footprint
 */
export function buildCommonRoofSystem(
  roofGroup: THREE.Group,
  topology: BuildingFootprintTopology,
  topElevation: number,
  roofType: RoofType | string = 'flat',
  topExteriorWalls: WallCollisionSegment[],
  roofTileTex: THREE.Texture,
  solarTex: THREE.Texture,
  landW: number,
  landH: number
) {
  const { minX, maxX, minZ, maxZ, width, depth } = topology.bounds;
  const overhang = 0.5; // Controlled architectural overhang in feet
  const roofSlabMat = new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.5 });
  const fasciaMat = new THREE.MeshStandardMaterial({ color: '#1E293B', roughness: 0.35 });
  const ridgeMat = new THREE.MeshStandardMaterial({ color: '#991B1B', roughness: 0.4 });
  const roofMat = new THREE.MeshStandardMaterial({
    color: '#FFFFFF',
    map: roofTileTex,
    roughness: 0.5,
    metalness: 0.05,
  });

  if (roofType === 'tiled') {
    const roofH = Math.min(5.2, Math.max(3.2, Math.min(width, depth) * 0.28));

    if (topology.type === 'l-shape' && topology.lShape) {
      // UNIFIED L-SHAPED HIPPED ROOF WITH COMPOUND VALLEY
      buildLShapedHippedRoof(
        roofGroup,
        topology.lShape,
        topology.bounds,
        topElevation,
        roofH,
        roofMat,
        ridgeMat,
        fasciaMat,
        overhang
      );
    } else {
      // UNIFIED SQUARE / RECTANGULAR HIPPED ROOF
      buildHippedRoof(
        roofGroup,
        minX,
        maxX,
        minZ,
        maxZ,
        topElevation,
        roofH,
        roofMat,
        ridgeMat,
        fasciaMat,
        overhang
      );
    }
  } else {
    // FLAT TERRACE ROOF FOLLOWING EXACT BUILDING FOOTPRINT
    if (topology.type === 'l-shape' && topology.lShape) {
      // Extruded L-shaped slab preserving the concave cutout
      const verts = topology.lShape.vertices;
      const shape = new THREE.Shape();
      shape.moveTo(verts[0].x, verts[0].z);
      for (let i = 1; i < verts.length; i++) {
        shape.lineTo(verts[i].x, verts[i].z);
      }
      shape.closePath();

      const extrudeSettings = { depth: 0.4, bevelEnabled: false };
      const slabGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      slabGeo.rotateX(Math.PI / 2);

      const slabMesh = new THREE.Mesh(slabGeo, roofSlabMat);
      slabMesh.position.set(0, topElevation + 0.4, 0);
      slabMesh.castShadow = true;
      slabMesh.receiveShadow = true;
      roofGroup.add(slabMesh);
    } else {
      // Single continuous rectangular/square slab
      const slabW = width + overhang * 2;
      const slabD = depth + overhang * 2;
      const cX = (minX + maxX) / 2;
      const cZ = (minZ + maxZ) / 2;

      const slabMesh = new THREE.Mesh(new THREE.BoxGeometry(slabW, 0.4, slabD), roofSlabMat);
      slabMesh.position.set(cX, topElevation + 0.2, cZ);
      slabMesh.castShadow = true;
      slabMesh.receiveShadow = true;
      roofGroup.add(slabMesh);
    }

    // Clean, Continuous Exterior Parapet along the FINAL BUILDING PERIMETER ONLY
    const parapetH = 2.2;
    const parapetThick = 0.35;
    const parapetMat = new THREE.MeshStandardMaterial({ color: '#1E293B', roughness: 0.4 });
    const copingStoneMat = new THREE.MeshStandardMaterial({ color: '#E2E8F0', roughness: 0.3 });

    const addParapetAlongSegment = (p1: { x: number; z: number }, p2: { x: number; z: number }) => {
      const dx = p2.x - p1.x;
      const dz = p2.z - p1.z;
      const len = Math.hypot(dx, dz);
      if (len < 0.3) return;

      const midX = (p1.x + p2.x) / 2;
      const midZ = (p1.z + p2.z) / 2;
      const isHorizontal = Math.abs(dz) < Math.abs(dx);

      if (isHorizontal) {
        const pMesh = new THREE.Mesh(new THREE.BoxGeometry(len + parapetThick, parapetH, parapetThick), parapetMat);
        pMesh.position.set(midX, topElevation + 0.4 + parapetH / 2, midZ);
        pMesh.castShadow = true;

        const cMesh = new THREE.Mesh(new THREE.BoxGeometry(len + parapetThick + 0.1, 0.1, parapetThick + 0.1), copingStoneMat);
        cMesh.position.set(midX, topElevation + 0.4 + parapetH + 0.05, midZ);
        roofGroup.add(pMesh, cMesh);
      } else {
        const pMesh = new THREE.Mesh(new THREE.BoxGeometry(parapetThick, parapetH, len + parapetThick), parapetMat);
        pMesh.position.set(midX, topElevation + 0.4 + parapetH / 2, midZ);
        pMesh.castShadow = true;

        const cMesh = new THREE.Mesh(new THREE.BoxGeometry(parapetThick + 0.1, 0.1, len + parapetThick + 0.1), copingStoneMat);
        cMesh.position.set(midX, topElevation + 0.4 + parapetH + 0.05, midZ);
        roofGroup.add(pMesh, cMesh);
      }
    };

    if (topology.type === 'l-shape' && topology.lShape) {
      const verts = topology.lShape.vertices;
      for (let i = 0; i < verts.length; i++) {
        addParapetAlongSegment(verts[i], verts[(i + 1) % verts.length]);
      }
    } else {
      // 4 perimeter edges of the continuous building envelope
      addParapetAlongSegment({ x: minX, z: minZ }, { x: maxX, z: minZ }); // North
      addParapetAlongSegment({ x: minX, z: maxZ }, { x: maxX, z: maxZ }); // South
      addParapetAlongSegment({ x: minX, z: minZ }, { x: minX, z: maxZ }); // West
      addParapetAlongSegment({ x: maxX, z: minZ }, { x: maxX, z: maxZ }); // East
    }

    // Solar PV Array on largest top floor room
    let largestRoom = topology.activeRooms[0];
    let maxArea = 0;
    topology.activeRooms.forEach((r) => {
      const a = r.width * r.height;
      if (a > maxArea) {
        maxArea = a;
        largestRoom = r;
      }
    });

    if (largestRoom && largestRoom.width >= 8 && largestRoom.height >= 8) {
      const { posX: lX, posZ: lZ } = to3DPos(largestRoom.x, largestRoom.y, largestRoom.width, largestRoom.height, landW, landH);
      const solarMat = new THREE.MeshStandardMaterial({
        map: solarTex,
        roughness: 0.15,
        metalness: 0.7,
      });
      const rackMat = new THREE.MeshStandardMaterial({ color: '#64748B', metalness: 0.8, roughness: 0.3 });

      const pW = Math.min(6.0, largestRoom.width - 2.5);
      const pD = Math.min(4.0, largestRoom.height - 2.5);
      const solarPanel = new THREE.Mesh(new THREE.BoxGeometry(pW, 0.1, pD), solarMat);
      solarPanel.rotation.x = -Math.PI / 8;
      solarPanel.position.set(lX, topElevation + 1.1, lZ);
      solarPanel.castShadow = true;

      const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.7, 8), rackMat);
      stand.position.set(lX, topElevation + 0.75, lZ);

      roofGroup.add(solarPanel, stand);
    }
  }
}

/**
 * Builds an authentic residential continuous hipped roof for rectangular & square footprints
 */
function buildHippedRoof(
  roofGroup: THREE.Group,
  minX: number,
  maxX: number,
  minZ: number,
  maxZ: number,
  baseY: number,
  roofHeight: number,
  roofMat: THREE.Material,
  ridgeMat: THREE.Material,
  fasciaMat: THREE.Material,
  eaves: number = 0.5
) {
  const rMinX = minX - eaves;
  const rMaxX = maxX + eaves;
  const rMinZ = minZ - eaves;
  const rMaxZ = maxZ + eaves;
  const spanX = rMaxX - rMinX;
  const spanZ = rMaxZ - rMinZ;
  const centerX = (rMinX + rMaxX) / 2;
  const centerZ = (rMinZ + rMaxZ) / 2;

  // Continuous Fascia board box under eaves
  const fascia = new THREE.Mesh(
    new THREE.BoxGeometry(spanX, 0.45, spanZ),
    fasciaMat
  );
  fascia.position.set(centerX, baseY + 0.225, centerZ);
  fascia.castShadow = true;
  roofGroup.add(fascia);

  // Determine ridge length and orientation
  const isXLonger = spanX >= spanZ;
  const ridgeLen = Math.max(0.5, Math.abs(spanX - spanZ));
  const roofTopY = baseY + 0.45 + roofHeight;

  // Ridge vertices
  let ridgeP1: THREE.Vector3;
  let ridgeP2: THREE.Vector3;

  if (isXLonger) {
    ridgeP1 = new THREE.Vector3(centerX - ridgeLen / 2, roofTopY, centerZ);
    ridgeP2 = new THREE.Vector3(centerX + ridgeLen / 2, roofTopY, centerZ);
  } else {
    ridgeP1 = new THREE.Vector3(centerX, roofTopY, centerZ - ridgeLen / 2);
    ridgeP2 = new THREE.Vector3(centerX, roofTopY, centerZ + ridgeLen / 2);
  }

  // 4 Eaves corners
  const eNW = new THREE.Vector3(rMinX, baseY + 0.45, rMinZ);
  const eNE = new THREE.Vector3(rMaxX, baseY + 0.45, rMinZ);
  const eSE = new THREE.Vector3(rMaxX, baseY + 0.45, rMaxZ);
  const eSW = new THREE.Vector3(rMinX, baseY + 0.45, rMaxZ);

  // Build faces using BufferGeometry
  const vertices: number[] = [];
  const uvs: number[] = [];

  const addTriangle = (p1: THREE.Vector3, p2: THREE.Vector3, p3: THREE.Vector3) => {
    vertices.push(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z, p3.x, p3.y, p3.z);
    uvs.push(p1.x * 0.25, p1.z * 0.25, p2.x * 0.25, p2.z * 0.25, p3.x * 0.25, p3.z * 0.25);
  };

  const addQuad = (p1: THREE.Vector3, p2: THREE.Vector3, p3: THREE.Vector3, p4: THREE.Vector3) => {
    addTriangle(p1, p2, p3);
    addTriangle(p1, p3, p4);
  };

  if (isXLonger) {
    addQuad(eNW, eNE, ridgeP2, ridgeP1); // North face
    addQuad(eSE, eSW, ridgeP1, ridgeP2); // South face
    addTriangle(eSW, eNW, ridgeP1);      // West hip
    addTriangle(eNE, eSE, ridgeP2);      // East hip
  } else {
    addQuad(eSW, eNW, ridgeP1, ridgeP2); // West face
    addQuad(eNE, eSE, ridgeP2, ridgeP1); // East face
    addTriangle(eNW, eNE, ridgeP1);      // North hip
    addTriangle(eSE, eSW, ridgeP2);      // South hip
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.computeVertexNormals();

  const roofMesh = new THREE.Mesh(geo, roofMat);
  roofMesh.castShadow = true;
  roofMesh.receiveShadow = true;
  roofGroup.add(roofMesh);

  // Terracotta Ridge Capping along central horizontal ridge
  const ridgeGeo = new THREE.BoxGeometry(
    isXLonger ? ridgeLen + 0.6 : 0.45,
    0.2,
    isXLonger ? 0.45 : ridgeLen + 0.6
  );
  const ridgeMesh = new THREE.Mesh(ridgeGeo, ridgeMat);
  ridgeMesh.position.set(centerX, roofTopY + 0.08, centerZ);
  ridgeMesh.castShadow = true;
  roofGroup.add(ridgeMesh);

  // Decorative Ridge End Finials
  [ridgeP1, ridgeP2].forEach((pt) => {
    const finial = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 12), ridgeMat);
    finial.position.set(pt.x, pt.y + 0.32, pt.z);
    finial.castShadow = true;
    roofGroup.add(finial);
  });
}

/**
 * Builds an authentic residential unified L-shaped compound hip and valley roof system
 */
function buildLShapedHippedRoof(
  roofGroup: THREE.Group,
  lShape: NonNullable<BuildingFootprintTopology['lShape']>,
  bounds: BuildingFootprintTopology['bounds'],
  baseY: number,
  roofHeight: number,
  roofMat: THREE.Material,
  ridgeMat: THREE.Material,
  fasciaMat: THREE.Material,
  eaves: number = 0.5
) {
  const { cutoutCorner, splitX, splitZ } = lShape;
  const { minX, maxX, minZ, maxZ } = bounds;
  const eY = baseY + 0.45;
  const roofTopY = eY + roofHeight;

  // Fascia along the 6 outer boundary edges of the L-shape
  const verts = lShape.vertices;
  for (let i = 0; i < verts.length; i++) {
    const p1 = verts[i];
    const p2 = verts[(i + 1) % verts.length];
    const dx = p2.x - p1.x;
    const dz = p2.z - p1.z;
    const len = Math.sqrt(dx * dx + dz * dz);
    if (len < 0.2) continue;

    const midX = (p1.x + p2.x) / 2;
    const midZ = (p1.z + p2.z) / 2;
    const isHorizontal = Math.abs(dz) < Math.abs(dx);

    const fMesh = new THREE.Mesh(
      new THREE.BoxGeometry(isHorizontal ? len + 0.3 : 0.45, 0.45, isHorizontal ? 0.45 : len + 0.3),
      fasciaMat
    );
    fMesh.position.set(midX, baseY + 0.225, midZ);
    fMesh.castShadow = true;
    roofGroup.add(fMesh);
  }

  const vertices: number[] = [];
  const uvs: number[] = [];

  const addTriangle = (p1: THREE.Vector3, p2: THREE.Vector3, p3: THREE.Vector3) => {
    vertices.push(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z, p3.x, p3.y, p3.z);
    uvs.push(p1.x * 0.25, p1.z * 0.25, p2.x * 0.25, p2.z * 0.25, p3.x * 0.25, p3.z * 0.25);
  };

  const addQuad = (p1: THREE.Vector3, p2: THREE.Vector3, p3: THREE.Vector3, p4: THREE.Vector3) => {
    addTriangle(p1, p2, p3);
    addTriangle(p1, p3, p4);
  };

  // Build compound hipped geometry for each cutout orientation
  if (cutoutCorner === 'NE') {
    // Wing 1 (West Wing): X in [minX, splitX], Z in [minZ, maxZ]
    // Wing 2 (South Wing): X in [minX, maxX], Z in [splitZ, maxZ]
    const cxWest = (minX + splitX) / 2;
    const czSouth = (splitZ + maxZ) / 2;

    const rJunc = new THREE.Vector3(cxWest, roofTopY, czSouth);
    const rNorth = new THREE.Vector3(cxWest, roofTopY, minZ - eaves + (splitX - minX) * 0.4);
    const rEast = new THREE.Vector3(maxX + eaves - (maxZ - splitZ) * 0.4, roofTopY, czSouth);

    const vNW = new THREE.Vector3(minX - eaves, eY, minZ - eaves);
    const vN_Inner = new THREE.Vector3(splitX + eaves, eY, minZ - eaves);
    const vConcave = new THREE.Vector3(splitX + eaves, eY, splitZ - eaves);
    const vE_Inner = new THREE.Vector3(maxX + eaves, eY, splitZ - eaves);
    const vSE = new THREE.Vector3(maxX + eaves, eY, maxZ + eaves);
    const vSW = new THREE.Vector3(minX - eaves, eY, maxZ + eaves);

    // West Wing North Hip
    addTriangle(vNW, vN_Inner, rNorth);
    // East slope of West Wing into Valley
    addQuad(vN_Inner, vConcave, rJunc, rNorth);
    // North slope of South Wing into Valley
    addQuad(vConcave, vE_Inner, rEast, rJunc);
    // South Wing East Hip
    addTriangle(vE_Inner, vSE, rEast);
    // South main slope
    addQuad(vSE, vSW, rJunc, rEast);
    // West main slope
    addQuad(vSW, vNW, rNorth, rJunc);

    // Terracotta Ridges & Valley
    const ridgeWest = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.2, Math.abs(czSouth - rNorth.z) + 0.4), ridgeMat);
    ridgeWest.position.set(cxWest, roofTopY + 0.08, (rNorth.z + czSouth) / 2);
    const ridgeSouth = new THREE.Mesh(new THREE.BoxGeometry(Math.abs(rEast.x - cxWest) + 0.4, 0.2, 0.45), ridgeMat);
    ridgeSouth.position.set((cxWest + rEast.x) / 2, roofTopY + 0.08, czSouth);
    roofGroup.add(ridgeWest, ridgeSouth);

    [rNorth, rEast].forEach((pt) => {
      const finial = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 12), ridgeMat);
      finial.position.set(pt.x, pt.y + 0.32, pt.z);
      finial.castShadow = true;
      roofGroup.add(finial);
    });
  } else if (cutoutCorner === 'NW') {
    // Wing 1 (East Wing): X in [splitX, maxX], Z in [minZ, maxZ]
    // Wing 2 (South Wing): X in [minX, maxX], Z in [splitZ, maxZ]
    const cxEast = (splitX + maxX) / 2;
    const czSouth = (splitZ + maxZ) / 2;

    const rJunc = new THREE.Vector3(cxEast, roofTopY, czSouth);
    const rNorth = new THREE.Vector3(cxEast, roofTopY, minZ - eaves + (maxX - splitX) * 0.4);
    const rWest = new THREE.Vector3(minX - eaves + (maxZ - splitZ) * 0.4, roofTopY, czSouth);

    const vN_Inner = new THREE.Vector3(splitX - eaves, eY, minZ - eaves);
    const vNE = new THREE.Vector3(maxX + eaves, eY, minZ - eaves);
    const vSE = new THREE.Vector3(maxX + eaves, eY, maxZ + eaves);
    const vSW = new THREE.Vector3(minX - eaves, eY, maxZ + eaves);
    const vW_Inner = new THREE.Vector3(minX - eaves, eY, splitZ - eaves);
    const vConcave = new THREE.Vector3(splitX - eaves, eY, splitZ - eaves);

    addTriangle(vN_Inner, vNE, rNorth);
    addQuad(vNE, vSE, rJunc, rNorth);
    addQuad(vSE, vSW, rWest, rJunc);
    addTriangle(vSW, vW_Inner, rWest);
    addQuad(vW_Inner, vConcave, rJunc, rWest);
    addQuad(vConcave, vN_Inner, rNorth, rJunc);

    const ridgeEast = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.2, Math.abs(czSouth - rNorth.z) + 0.4), ridgeMat);
    ridgeEast.position.set(cxEast, roofTopY + 0.08, (rNorth.z + czSouth) / 2);
    const ridgeSouth = new THREE.Mesh(new THREE.BoxGeometry(Math.abs(cxEast - rWest.x) + 0.4, 0.2, 0.45), ridgeMat);
    ridgeSouth.position.set((rWest.x + cxEast) / 2, roofTopY + 0.08, czSouth);
    roofGroup.add(ridgeEast, ridgeSouth);

    [rNorth, rWest].forEach((pt) => {
      const finial = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 12), ridgeMat);
      finial.position.set(pt.x, pt.y + 0.32, pt.z);
      finial.castShadow = true;
      roofGroup.add(finial);
    });
  } else if (cutoutCorner === 'SE') {
    // Wing 1 (North Wing): X in [minX, maxX], Z in [minZ, splitZ]
    // Wing 2 (West Wing): X in [minX, splitX], Z in [minZ, maxZ]
    const czNorth = (minZ + splitZ) / 2;
    const cxWest = (minX + splitX) / 2;

    const rJunc = new THREE.Vector3(cxWest, roofTopY, czNorth);
    const rEast = new THREE.Vector3(maxX + eaves - (splitZ - minZ) * 0.4, roofTopY, czNorth);
    const rSouth = new THREE.Vector3(cxWest, roofTopY, maxZ + eaves - (splitX - minX) * 0.4);

    const vNW = new THREE.Vector3(minX - eaves, eY, minZ - eaves);
    const vNE = new THREE.Vector3(maxX + eaves, eY, minZ - eaves);
    const vE_Inner = new THREE.Vector3(maxX + eaves, eY, splitZ + eaves);
    const vConcave = new THREE.Vector3(splitX - eaves, eY, splitZ + eaves);
    const vS_Inner = new THREE.Vector3(splitX - eaves, eY, maxZ + eaves);
    const vSW = new THREE.Vector3(minX - eaves, eY, maxZ + eaves);

    addQuad(vNW, vNE, rEast, rJunc);
    addTriangle(vNE, vE_Inner, rEast);
    addQuad(vE_Inner, vConcave, rJunc, rEast);
    addQuad(vConcave, vS_Inner, rSouth, rJunc);
    addTriangle(vS_Inner, vSW, rSouth);
    addQuad(vSW, vNW, rJunc, rSouth);

    const ridgeNorth = new THREE.Mesh(new THREE.BoxGeometry(Math.abs(rEast.x - cxWest) + 0.4, 0.2, 0.45), ridgeMat);
    ridgeNorth.position.set((cxWest + rEast.x) / 2, roofTopY + 0.08, czNorth);
    const ridgeWest = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.2, Math.abs(rSouth.z - czNorth) + 0.4), ridgeMat);
    ridgeWest.position.set(cxWest, roofTopY + 0.08, (czNorth + rSouth.z) / 2);
    roofGroup.add(ridgeNorth, ridgeWest);

    [rEast, rSouth].forEach((pt) => {
      const finial = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 12), ridgeMat);
      finial.position.set(pt.x, pt.y + 0.32, pt.z);
      finial.castShadow = true;
      roofGroup.add(finial);
    });
  } else {
    // Cutout SW: Wing 1 (North Wing) & Wing 2 (East Wing)
    const czNorth = (minZ + splitZ) / 2;
    const cxEast = (splitX + maxX) / 2;

    const rJunc = new THREE.Vector3(cxEast, roofTopY, czNorth);
    const rWest = new THREE.Vector3(minX - eaves + (splitZ - minZ) * 0.4, roofTopY, czNorth);
    const rSouth = new THREE.Vector3(cxEast, roofTopY, maxZ + eaves - (maxX - splitX) * 0.4);

    const vNW = new THREE.Vector3(minX - eaves, eY, minZ - eaves);
    const vNE = new THREE.Vector3(maxX + eaves, eY, minZ - eaves);
    const vSE = new THREE.Vector3(maxX + eaves, eY, maxZ + eaves);
    const vS_Inner = new THREE.Vector3(splitX + eaves, eY, maxZ + eaves);
    const vConcave = new THREE.Vector3(splitX + eaves, eY, splitZ + eaves);
    const vW_Inner = new THREE.Vector3(minX - eaves, eY, splitZ + eaves);

    addTriangle(vW_Inner, vNW, rWest);
    addQuad(vNW, vNE, rJunc, rWest);
    addQuad(vNE, vSE, rSouth, rJunc);
    addTriangle(vSE, vS_Inner, rSouth);
    addQuad(vS_Inner, vConcave, rJunc, rSouth);
    addQuad(vConcave, vW_Inner, rWest, rJunc);

    const ridgeNorth = new THREE.Mesh(new THREE.BoxGeometry(Math.abs(cxEast - rWest.x) + 0.4, 0.2, 0.45), ridgeMat);
    ridgeNorth.position.set((rWest.x + cxEast) / 2, roofTopY + 0.08, czNorth);
    const ridgeEast = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.2, Math.abs(rSouth.z - czNorth) + 0.4), ridgeMat);
    ridgeEast.position.set(cxEast, roofTopY + 0.08, (czNorth + rSouth.z) / 2);
    roofGroup.add(ridgeNorth, ridgeEast);

    [rWest, rSouth].forEach((pt) => {
      const finial = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 12), ridgeMat);
      finial.position.set(pt.x, pt.y + 0.32, pt.z);
      finial.castShadow = true;
      roofGroup.add(finial);
    });
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.computeVertexNormals();

  const roofMesh = new THREE.Mesh(geo, roofMat);
  roofMesh.castShadow = true;
  roofMesh.receiveShadow = true;
  roofGroup.add(roofMesh);
}

/**
 * Extracts continuous building exterior envelope and interior partitions from the union of room geometries.
 * Guarantees zero stepped seams on collinear rooms, no interior partition bleed-through,
 * and clean mathematical corner joints.
 */
function extractContinuousWalls(
  indoorRooms: LayoutData['rooms'],
  indoorRoomBoxes: Array<{ id: string; floor: number; minX: number; maxX: number; minZ: number; maxZ: number }>,
  maxFloor: number,
  landW: number,
  landH: number
): WallCollisionSegment[] {
  const allAtomicSegments: Array<{
    axis: 'H' | 'V';
    floor: number;
    fixedCoord: number;
    start: number;
    end: number;
    isExterior: boolean;
  }> = [];

  for (let fl = 0; fl <= maxFloor; fl++) {
    const floorBoxes = indoorRoomBoxes.filter((b) => b.floor === fl);
    if (floorBoxes.length === 0) continue;

    // Collect all grid line intersections for this floor
    const xs = Array.from(new Set(floorBoxes.flatMap((b) => [Number(b.minX.toFixed(2)), Number(b.maxX.toFixed(2))]))).sort((a, b) => a - b);
    const zs = Array.from(new Set(floorBoxes.flatMap((b) => [Number(b.minZ.toFixed(2)), Number(b.maxZ.toFixed(2))]))).sort((a, b) => a - b);

    const eps = 0.15;
    const isPointInFloor = (px: number, pz: number) => {
      return floorBoxes.some((b) => px >= b.minX - 0.01 && px <= b.maxX + 0.01 && pz >= b.minZ - 0.01 && pz <= b.maxZ + 0.01);
    };

    // 1. Horizontal atomic edges
    for (const box of floorBoxes) {
      for (const fixedZ of [box.minZ, box.maxZ]) {
        for (let i = 0; i < xs.length - 1; i++) {
          const x1 = xs[i];
          const x2 = xs[i + 1];
          if (x1 >= box.minX - 0.01 && x2 <= box.maxX + 0.01 && x2 - x1 > 0.1) {
            const midX = (x1 + x2) / 2;
            const inAbove = isPointInFloor(midX, fixedZ - eps);
            const inBelow = isPointInFloor(midX, fixedZ + eps);

            if (inAbove !== inBelow) {
              allAtomicSegments.push({
                axis: 'H',
                floor: fl,
                fixedCoord: Number(fixedZ.toFixed(2)),
                start: x1,
                end: x2,
                isExterior: true,
              });
            } else if (inAbove && inBelow) {
              allAtomicSegments.push({
                axis: 'H',
                floor: fl,
                fixedCoord: Number(fixedZ.toFixed(2)),
                start: x1,
                end: x2,
                isExterior: false,
              });
            }
          }
        }
      }

      // 2. Vertical atomic edges
      for (const fixedX of [box.minX, box.maxX]) {
        for (let i = 0; i < zs.length - 1; i++) {
          const z1 = zs[i];
          const z2 = zs[i + 1];
          if (z1 >= box.minZ - 0.01 && z2 <= box.maxZ + 0.01 && z2 - z1 > 0.1) {
            const midZ = (z1 + z2) / 2;
            const inLeft = isPointInFloor(fixedX - eps, midZ);
            const inRight = isPointInFloor(fixedX + eps, midZ);

            if (inLeft !== inRight) {
              allAtomicSegments.push({
                axis: 'V',
                floor: fl,
                fixedCoord: Number(fixedX.toFixed(2)),
                start: z1,
                end: z2,
                isExterior: true,
              });
            } else if (inLeft && inRight) {
              allAtomicSegments.push({
                axis: 'V',
                floor: fl,
                fixedCoord: Number(fixedX.toFixed(2)),
                start: z1,
                end: z2,
                isExterior: false,
              });
            }
          }
        }
      }
    }
  }

  // Deduplicate identical atomic segments
  const uniqueAtomic = new Map<string, typeof allAtomicSegments[0]>();
  for (const seg of allAtomicSegments) {
    const key = `${seg.floor}_${seg.axis}_${seg.fixedCoord.toFixed(2)}_${seg.start.toFixed(2)}_${seg.end.toFixed(2)}_${seg.isExterior ? 'ext' : 'int'}`;
    if (!uniqueAtomic.has(key)) {
      uniqueAtomic.set(key, seg);
    }
  }

  // Group and merge contiguous collinear segments into ONE continuous wall
  const mergedWalls: WallCollisionSegment[] = [];
  const groups = new Map<string, Array<typeof allAtomicSegments[0]>>();

  for (const seg of uniqueAtomic.values()) {
    const key = `${seg.floor}_${seg.axis}_${seg.isExterior ? 'ext' : 'int'}_${seg.fixedCoord.toFixed(2)}`;
    const list = groups.get(key) || [];
    list.push(seg);
    groups.set(key, list);
  }

  groups.forEach((segs) => {
    segs.sort((a, b) => a.start - b.start);

    let curr = { ...segs[0] };
    for (let i = 1; i < segs.length; i++) {
      const seg = segs[i];
      if (seg.start <= curr.end + 0.15) {
        curr.end = Math.max(curr.end, seg.end);
      } else {
        if (curr.end - curr.start >= 0.2) {
          mergedWalls.push({
            axis: curr.axis,
            floor: curr.floor,
            fixedCoord: curr.fixedCoord,
            start: curr.start,
            end: curr.end,
            isExterior: curr.isExterior,
            doors: [],
            windows: [],
          });
        }
        curr = { ...seg };
      }
    }
    if (curr.end - curr.start >= 0.2) {
      mergedWalls.push({
        axis: curr.axis,
        floor: curr.floor,
        fixedCoord: curr.fixedCoord,
        start: curr.start,
        end: curr.end,
        isExterior: curr.isExterior,
        doors: [],
        windows: [],
      });
    }
  });

  // Map room doors and windows onto the final continuous walls
  for (const room of indoorRooms) {
    const floorLevel = (room as any).floor || 0;
    const { posX, posZ } = to3DPos(room.x, room.y, room.width, room.height, landW, landH);
    const halfW = room.width / 2;
    const halfH = room.height / 2;

    const nameLower = room.name.toLowerCase();
    const isSanitary = room.category === 'sanitary' || nameLower.includes('bath') || nameLower.includes('toilet');
    const isKitchen = nameLower.includes('kitchen') || nameLower.includes('pantry');
    const isDining = nameLower.includes('dining');
    const isBedroom = nameLower.includes('bed') || nameLower.includes('study') || nameLower.includes('office');
    const isLiving = nameLower.includes('living') || nameLower.includes('hall') || nameLower.includes('drawing') || nameLower.includes('family');
    const isBalcony = nameLower.includes('balcony');
    const isStaircase = nameLower.includes('stair');

    let roomType: 'living' | 'bedroom' | 'kitchen' | 'sanitary' | 'staircase' | 'dining' | 'balcony' | 'default' = 'default';
    if (isLiving) roomType = 'living';
    else if (isBedroom) roomType = 'bedroom';
    else if (isKitchen) roomType = 'kitchen';
    else if (isSanitary) roomType = 'sanitary';
    else if (isStaircase) roomType = 'staircase';
    else if (isDining) roomType = 'dining';
    else if (isBalcony) roomType = 'balcony';

    // Helper to find host wall and add door/window
    const addDoorToWall = (axis: 'H' | 'V', fixedZorX: number, roomWallStart: number, dOffset: number, dWidth: number) => {
      const globalDoorCenter = roomWallStart + dOffset + dWidth / 2;
      const targetWall = mergedWalls.find((w) =>
        w.floor === floorLevel &&
        w.axis === axis &&
        Math.abs(w.fixedCoord - fixedZorX) < 0.25 &&
        globalDoorCenter >= w.start - 0.1 &&
        globalDoorCenter <= w.end + 0.1
      );
      if (targetWall) {
        const offsetOnWall = globalDoorCenter - dWidth / 2 - targetWall.start;
        if (!targetWall.doors.some((d) => Math.abs(d.offset - offsetOnWall) < 1.0)) {
          targetWall.doors.push({ offset: Math.max(0.4, offsetOnWall), width: dWidth });
        }
      }
    };

    const addWindowToWall = (axis: 'H' | 'V', fixedZorX: number, roomWallStart: number, wOffset: number, wWidth: number) => {
      const globalWinCenter = roomWallStart + wOffset + wWidth / 2;
      const targetWall = mergedWalls.find((w) =>
        w.floor === floorLevel &&
        w.axis === axis &&
        w.isExterior &&
        Math.abs(w.fixedCoord - fixedZorX) < 0.25 &&
        globalWinCenter >= w.start - 0.1 &&
        globalWinCenter <= w.end + 0.1
      );
      if (targetWall) {
        const offsetOnWall = globalWinCenter - wWidth / 2 - targetWall.start;
        if (!targetWall.windows.some((w) => Math.abs(w.offset - offsetOnWall) < 1.0)) {
          targetWall.windows.push({ offset: Math.max(0.4, offsetOnWall), width: wWidth, roomType });
        }
      }
    };

    // North (fixedCoord = posZ - halfH, start = posX - halfW)
    room.doors.filter((d) => d.wall === 'north').forEach((d) => addDoorToWall('H', posZ - halfH, posX - halfW, d.offset, d.width));
    room.windows.filter((w) => w.wall === 'north').forEach((w) => addWindowToWall('H', posZ - halfH, posX - halfW, w.offset, w.width));

    // South (fixedCoord = posZ + halfH, start = posX - halfW)
    room.doors.filter((d) => d.wall === 'south').forEach((d) => addDoorToWall('H', posZ + halfH, posX - halfW, d.offset, d.width));
    room.windows.filter((w) => w.wall === 'south').forEach((w) => addWindowToWall('H', posZ + halfH, posX - halfW, w.offset, w.width));

    // West (fixedCoord = posX - halfW, start = posZ - halfH)
    room.doors.filter((d) => d.wall === 'west').forEach((d) => addDoorToWall('V', posX - halfW, posZ - halfH, d.offset, d.width));
    room.windows.filter((w) => w.wall === 'west').forEach((w) => addWindowToWall('V', posX - halfW, posZ - halfH, w.offset, w.width));

    // East (fixedCoord = posX + halfW, start = posZ - halfH)
    room.doors.filter((d) => d.wall === 'east').forEach((d) => addDoorToWall('V', posX + halfW, posZ - halfH, d.offset, d.width));
    room.windows.filter((w) => w.wall === 'east').forEach((w) => addWindowToWall('V', posX + halfW, posZ - halfH, w.offset, w.width));
  }

  // Ensure long exterior walls without openings get a balanced fenestration window
  mergedWalls.forEach((w) => {
    if (w.isExterior) {
      const len = w.end - w.start;
      if (w.windows.length === 0 && w.doors.length === 0 && len >= 5.0) {
        const wWidth = Math.min(4.2, len * 0.45);
        w.windows.push({
          offset: len / 2 - wWidth / 2,
          width: wWidth,
          roomType: 'living',
        });
      }
    }
  });

  return mergedWalls;
}

/**
 * Merges raw wall segments along horizontal and vertical axes
 */
function mergeWallSegments(raw: RawWallSegment[]): WallCollisionSegment[] {
  const merged: WallCollisionSegment[] = [];

  const hGroups = new Map<string, RawWallSegment[]>();
  const vGroups = new Map<string, RawWallSegment[]>();

  raw.forEach((seg) => {
    const key = `${seg.floor}_${seg.fixedCoord.toFixed(2)}`;
    if (seg.axis === 'H') {
      const list = hGroups.get(key) || [];
      list.push(seg);
      hGroups.set(key, list);
    } else {
      const list = vGroups.get(key) || [];
      list.push(seg);
      vGroups.set(key, list);
    }
  });

  const processGroup = (axis: 'H' | 'V', groups: Map<string, RawWallSegment[]>) => {
    groups.forEach((segs) => {
      segs.sort((a, b) => a.start - b.start);

      let currStart = segs[0].start;
      let currEnd = segs[0].end;
      const currFloor = segs[0].floor;
      const currFixed = segs[0].fixedCoord;
      let currDoors = segs[0].doors.map((d) => ({ ...d }));
      let currWindows = segs[0].windows.map((w) => ({ ...w }));
      let currIsExterior = segs[0].isExterior === true;

      for (let i = 1; i < segs.length; i++) {
        const seg = segs[i];
        if (seg.start <= currEnd + 0.25) {
          const shift = seg.start - currStart;
          currEnd = Math.max(currEnd, seg.end);
          if (seg.isExterior) currIsExterior = true;
          seg.doors.forEach((d) => {
            const adjOffset = d.offset + shift;
            if (!currDoors.some((cd) => Math.abs(cd.offset - adjOffset) < 0.5)) {
              currDoors.push({ ...d, offset: adjOffset });
            }
          });
          seg.windows.forEach((w) => {
            const adjOffset = w.offset + shift;
            if (!currWindows.some((cw) => Math.abs(cw.offset - adjOffset) < 0.5)) {
              currWindows.push({ ...w, offset: adjOffset });
            }
          });
        } else {
          merged.push({
            axis,
            floor: currFloor,
            fixedCoord: currFixed,
            start: currStart,
            end: currEnd,
            isExterior: currIsExterior,
            doors: currDoors,
            windows: currIsExterior ? currWindows : [],
          });

          currStart = seg.start;
          currEnd = seg.end;
          currDoors = seg.doors.map((d) => ({ ...d }));
          currWindows = seg.windows.map((w) => ({ ...w }));
          currIsExterior = seg.isExterior === true;
        }
      }

      merged.push({
        axis,
        floor: currFloor,
        fixedCoord: currFixed,
        start: currStart,
        end: currEnd,
        isExterior: currIsExterior,
        doors: currDoors,
        windows: currIsExterior ? currWindows : [],
      });
    });
  };

  processGroup('H', hGroups);
  processGroup('V', vGroups);

  return merged;
}

/**
 * Constructs a wall side with precise architectural cutouts for doors and windows
 * guaranteeing zero overlapping, adequate structural corner margins, and clean masonry piers.
 */
function buildWallSideWithCutouts(
  parent: THREE.Group,
  startX: number,
  startZ: number,
  length: number,
  wallThickness: number,
  wallHeight: number,
  bottomY: number,
  orientation: 'horizontal' | 'vertical',
  doors: Array<{ offset: number; width: number }>,
  windows: Array<{
    offset: number;
    width: number;
    roomType?: 'living' | 'bedroom' | 'kitchen' | 'sanitary' | 'staircase' | 'dining' | 'balcony' | 'default';
  }>,
  extWallMat: THREE.Material,
  intWallMat: THREE.Material,
  blackFrameMat: THREE.Material,
  mullionMat: THREE.Material,
  whiteTrimMat: THREE.Material,
  sillMat: THREE.Material,
  darkGlassMat: THREE.Material,
  innerGlassMat: THREE.Material,
  frostedGlassMat: THREE.Material,
  woodDoorMat: THREE.Material,
  isExterior: boolean = true
) {
  interface Cutout {
    type: 'door' | 'window';
    offset: number;
    width: number;
    roomType?: string;
  }

  const activeWallMat = isExterior ? extWallMat : intWallMat;
  const cornerMargin = Math.max(0.45, wallThickness + 0.05);
  const minPierSeparation = 0.45;

  // Exterior Base Plinth Water Table Molding (0.4 ft height stone trim with +0.12 ft protrusion)
  if (isExterior && length >= 1.0) {
    const plinthH = 0.4;
    const plinthGeo = orientation === 'horizontal'
      ? new THREE.BoxGeometry(length, plinthH, wallThickness + 0.16)
      : new THREE.BoxGeometry(wallThickness + 0.16, plinthH, length);
    const plinthMesh = new THREE.Mesh(plinthGeo, sillMat);
    plinthMesh.position.set(
      orientation === 'horizontal' ? startX + length / 2 : startX,
      bottomY + plinthH / 2,
      orientation === 'horizontal' ? startZ : startZ + length / 2
    );
    plinthMesh.receiveShadow = true;
    parent.add(plinthMesh);

    // Exterior Top Frieze Molding (0.35 ft height trim)
    const friezeH = 0.35;
    const friezeGeo = orientation === 'horizontal'
      ? new THREE.BoxGeometry(length, friezeH, wallThickness + 0.12)
      : new THREE.BoxGeometry(wallThickness + 0.12, friezeH, length);
    const friezeMesh = new THREE.Mesh(friezeGeo, whiteTrimMat);
    friezeMesh.position.set(
      orientation === 'horizontal' ? startX + length / 2 : startX,
      bottomY + wallHeight - friezeH / 2,
      orientation === 'horizontal' ? startZ : startZ + length / 2
    );
    friezeMesh.castShadow = true;
    parent.add(friezeMesh);
  }

  // 1. Process and sanitize doors with priority
  const validDoors: Array<{ offset: number; width: number }> = [];
  const sortedRawDoors = [...doors].sort((a, b) => a.offset - b.offset);

  for (const d of sortedRawDoors) {
    let dW = Math.max(2.4, Math.min(d.width, length - cornerMargin * 2));
    let dOff = Math.max(cornerMargin, Math.min(length - cornerMargin - dW, d.offset));

    if (dOff + dW > length - cornerMargin) {
      dW = length - cornerMargin - dOff;
    }

    if (dW >= 2.0) {
      // Check collision with already placed doors
      let overlaps = false;
      for (const placed of validDoors) {
        if (dOff < placed.offset + placed.width + minPierSeparation && dOff + dW > placed.offset - minPierSeparation) {
          overlaps = true;
          break;
        }
      }
      if (!overlaps) {
        validDoors.push({ offset: dOff, width: dW });
      }
    }
  }

  // 2. Process and sanitize windows (resolve door conflicts & window-window overlap)
  const validWindows: Array<{ offset: number; width: number; roomType?: string }> = [];
  const sortedRawWindows = [...windows].sort((a, b) => a.offset - b.offset);

  for (const w of sortedRawWindows) {
    let wW = Math.max(1.8, Math.min(w.width, length - cornerMargin * 2));
    let wOff = Math.max(cornerMargin, Math.min(length - cornerMargin - wW, w.offset));

    if (wOff + wW > length - cornerMargin) {
      wW = length - cornerMargin - wOff;
    }

    if (wW < 1.6) continue;

    // Check collision with doors
    let collidesWithDoor = false;
    for (const d of validDoors) {
      const dStart = d.offset - minPierSeparation;
      const dEnd = d.offset + d.width + minPierSeparation;
      if (wOff < dEnd && wOff + wW > dStart) {
        collidesWithDoor = true;
        break;
      }
    }

    if (collidesWithDoor) {
      // Try repositioning window to available space away from doors
      let resolved = false;
      for (const d of validDoors) {
        const leftCandidate = d.offset - minPierSeparation - wW;
        if (leftCandidate >= cornerMargin) {
          let leftOk = true;
          for (const otherD of validDoors) {
            if (leftCandidate < otherD.offset + otherD.width + minPierSeparation && leftCandidate + wW > otherD.offset - minPierSeparation) {
              leftOk = false;
              break;
            }
          }
          if (leftOk) {
            wOff = leftCandidate;
            resolved = true;
            break;
          }
        }

        const rightCandidate = d.offset + d.width + minPierSeparation;
        if (rightCandidate + wW <= length - cornerMargin) {
          let rightOk = true;
          for (const otherD of validDoors) {
            if (rightCandidate < otherD.offset + otherD.width + minPierSeparation && rightCandidate + wW > otherD.offset - minPierSeparation) {
              rightOk = false;
              break;
            }
          }
          if (rightOk) {
            wOff = rightCandidate;
            resolved = true;
            break;
          }
        }
      }
      if (!resolved) continue; // Skip window if no non-overlapping space
    }

    // Check collision with already placed windows
    let collidesWithWin = false;
    for (const placed of validWindows) {
      if (wOff < placed.offset + placed.width + minPierSeparation && wOff + wW > placed.offset - minPierSeparation) {
        collidesWithWin = true;
        break;
      }
    }

    if (!collidesWithWin) {
      validWindows.push({ offset: wOff, width: wW, roomType: w.roomType });
    }
  }

  // 3. Assemble unified sorted cutouts list
  const cutouts: Cutout[] = [];
  validDoors.forEach((d) => cutouts.push({ type: 'door', offset: d.offset, width: d.width }));
  validWindows.forEach((w) => cutouts.push({ type: 'window', offset: w.offset, width: w.width, roomType: w.roomType }));
  cutouts.sort((a, b) => a.offset - b.offset);

  const doorHeight = 7.0; // Standard 7 ft residential door height
  let currOffset = 0;

  cutouts.forEach((cut) => {
    const segLen = cut.offset - currOffset;
    if (segLen > 0.05) {
      createWallBlock(
        parent,
        startX,
        startZ,
        orientation,
        currOffset,
        segLen,
        bottomY,
        wallHeight,
        wallThickness,
        activeWallMat
      );
    }

    if (cut.type === 'door') {
      // Top Lintel Wall block above door opening (7.0ft to 9.5ft)
      createWallBlock(
        parent,
        startX,
        startZ,
        orientation,
        cut.offset,
        cut.width,
        bottomY + doorHeight,
        wallHeight - doorHeight,
        wallThickness,
        activeWallMat
      );

      // Clean Architectural Door Frame & Threshold
      createDoorFrame(
        parent,
        startX,
        startZ,
        orientation,
        cut.offset,
        cut.width,
        doorHeight,
        bottomY,
        wallThickness,
        woodDoorMat
      );
    } else if (cut.type === 'window') {
      const roomType = cut.roomType || 'default';
      let winSill = 3.0;
      let winHeight = 4.0;
      let isFrosted = false;

      if (roomType === 'sanitary') {
        winSill = 5.2; // High privacy sill for bathroom
        winHeight = 2.0;
        isFrosted = true;
      } else if (roomType === 'kitchen') {
        winSill = 3.6; // Clearance above kitchen sink countertop
        winHeight = 3.2;
      } else if (roomType === 'living') {
        winSill = 2.2; // Large expansive living room picture window
        winHeight = 5.0;
      } else if (roomType === 'staircase') {
        winSill = 1.8; // Tall vertical staircase window
        winHeight = 5.8;
      } else if (roomType === 'balcony') {
        winSill = 0.0;
        winHeight = 7.0;
      }

      const winLintel = Math.min(wallHeight - 0.2, winSill + winHeight);
      const actualWinH = winLintel - winSill;

      // Bottom Sill Wall block below window opening
      if (winSill > 0.1) {
        createWallBlock(
          parent,
          startX,
          startZ,
          orientation,
          cut.offset,
          cut.width,
          bottomY,
          winSill,
          wallThickness,
          activeWallMat
        );
      }

      // Top Lintel Wall block above window opening
      if (wallHeight - winLintel > 0.1) {
        createWallBlock(
          parent,
          startX,
          startZ,
          orientation,
          cut.offset,
          cut.width,
          bottomY + winLintel,
          wallHeight - winLintel,
          wallThickness,
          activeWallMat
        );
      }

      // Architectural Residential Window with Frame, Stone Sill Ledge, Glass & Muntins
      createWindowPaneAndFrame(
        parent,
        startX,
        startZ,
        orientation,
        cut.offset,
        cut.width,
        bottomY + winSill,
        actualWinH,
        wallThickness,
        blackFrameMat,
        mullionMat,
        whiteTrimMat,
        sillMat,
        isFrosted ? frostedGlassMat : darkGlassMat,
        isFrosted ? frostedGlassMat : innerGlassMat,
        roomType
      );
    }

    currOffset = cut.offset + cut.width;
  });

  const remLen = length - currOffset;
  if (remLen > 0.05) {
    createWallBlock(
      parent,
      startX,
      startZ,
      orientation,
      currOffset,
      remLen,
      bottomY,
      wallHeight,
      wallThickness,
      activeWallMat
    );
  }
}

/**
 * Creates a single 3D box wall block segment
 */
function createWallBlock(
  parent: THREE.Group,
  startX: number,
  startZ: number,
  orientation: 'horizontal' | 'vertical',
  offset: number,
  length: number,
  bottomY: number,
  height: number,
  thickness: number,
  material: THREE.Material
) {
  const geo =
    orientation === 'horizontal'
      ? new THREE.BoxGeometry(length, height, thickness)
      : new THREE.BoxGeometry(thickness, height, length);

  const mesh = new THREE.Mesh(geo, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  if (orientation === 'horizontal') {
    mesh.position.set(startX + offset + length / 2, bottomY + height / 2, startZ);
  } else {
    mesh.position.set(startX, bottomY + height / 2, startZ + offset + length / 2);
  }

  parent.add(mesh);
}

/**
 * Creates Realistic 3D Architectural Door with Wooden Panel Leaf, Brass/Chrome Lever Handle, Hinges & Threshold
 */
function createDoorFrame(
  parent: THREE.Group,
  startX: number,
  startZ: number,
  orientation: 'horizontal' | 'vertical',
  offset: number,
  width: number,
  height: number,
  bottomY: number,
  wallThickness: number,
  doorMat: THREE.Material
) {
  const doorGroup = new THREE.Group();
  const frameThick = 0.16;
  const frameDepth = wallThickness + 0.08;

  const isMainEntrance = width >= 3.4;

  const frameMat = new THREE.MeshStandardMaterial({
    color: isMainEntrance ? '#271911' : '#332219',
    roughness: 0.35,
    metalness: 0.08,
  });

  const leafMat = new THREE.MeshStandardMaterial({
    color: isMainEntrance ? '#6B2D0C' : '#854D0E', // Rich teak / Warm oak
    roughness: 0.3,
    metalness: 0.05,
  });

  const panelBevelMat = new THREE.MeshStandardMaterial({
    color: isMainEntrance ? '#4E1D05' : '#713F12',
    roughness: 0.45,
  });

  const handleMat = new THREE.MeshStandardMaterial({
    color: '#D4AF37', // Polished warm brass handle
    metalness: 0.9,
    roughness: 0.2,
  });

  const hingeMat = new THREE.MeshStandardMaterial({
    color: '#94A3B8', // Brushed steel/silver hinges
    metalness: 0.9,
    roughness: 0.2,
  });

  const thresholdMat = new THREE.MeshStandardMaterial({
    color: '#475569', // Granite/slate threshold
    roughness: 0.6,
  });

  // 1. Bottom Threshold Kick Plate
  const threshGeo = new THREE.BoxGeometry(width, 0.06, frameDepth + 0.06);
  const threshMesh = new THREE.Mesh(threshGeo, thresholdMat);
  threshMesh.position.set(width / 2, 0.03, 0);
  threshMesh.receiveShadow = true;
  doorGroup.add(threshMesh);

  // 2. Door Frame Jambs (Left, Right, and Head Lintel)
  const leftJamb = new THREE.Mesh(new THREE.BoxGeometry(frameThick, height, frameDepth), frameMat);
  leftJamb.position.set(frameThick / 2, height / 2, 0);
  leftJamb.castShadow = true;

  const rightJamb = new THREE.Mesh(new THREE.BoxGeometry(frameThick, height, frameDepth), frameMat);
  rightJamb.position.set(width - frameThick / 2, height / 2, 0);
  rightJamb.castShadow = true;

  const headJamb = new THREE.Mesh(new THREE.BoxGeometry(width, frameThick, frameDepth), frameMat);
  headJamb.position.set(width / 2, height - frameThick / 2, 0);
  headJamb.castShadow = true;

  doorGroup.add(leftJamb, rightJamb, headJamb);

  // 3. Realistic Wood Door Leaf (Rendered slightly open at ~22° angle for depth & visibility)
  const leafGroup = new THREE.Group();
  const leafW = width - frameThick * 2 - 0.04;
  const leafH = height - frameThick - 0.08;
  const leafThick = 0.12;

  // Solid Main Door Slab
  const leafSlab = new THREE.Mesh(new THREE.BoxGeometry(leafW, leafH, leafThick), leafMat);
  leafSlab.position.set(leafW / 2, leafH / 2, 0);
  leafSlab.castShadow = true;
  leafGroup.add(leafSlab);

  // Recessed Decorative Architectural Panels (Front and Back)
  const pW = leafW * 0.38;
  const pH = leafH * 0.38;
  const pDepth = 0.02;

  const panelCoords = [
    { x: leafW * 0.28, y: leafH * 0.72, w: pW, h: pH },
    { x: leafW * 0.72, y: leafH * 0.72, w: pW, h: pH },
    { x: leafW * 0.28, y: leafH * 0.28, w: pW, h: pH },
    { x: leafW * 0.72, y: leafH * 0.28, w: pW, h: pH },
  ];

  panelCoords.forEach((p) => {
    // Front panels
    const pFront = new THREE.Mesh(new THREE.BoxGeometry(p.w, p.h, pDepth), panelBevelMat);
    pFront.position.set(p.x, p.y, leafThick / 2 + 0.005);
    // Back panels
    const pBack = new THREE.Mesh(new THREE.BoxGeometry(p.w, p.h, pDepth), panelBevelMat);
    pBack.position.set(p.x, p.y, -leafThick / 2 - 0.005);
    leafGroup.add(pFront, pBack);
  });

  // 4. Brass Lever Handle / Long Pull Bar (Front & Back)
  if (isMainEntrance) {
    // Grand Modern Entrance Pull Bar
    [-leafThick / 2 - 0.04, leafThick / 2 + 0.04].forEach((handleZ) => {
      const handleY = leafH * 0.5;
      const handleX = leafW - 0.35;
      const pullBar = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.6, 0.06), handleMat);
      pullBar.position.set(handleX, handleY, handleZ);
      const post1 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.08), handleMat);
      post1.position.set(handleX, handleY + 0.6, handleZ > 0 ? handleZ - 0.04 : handleZ + 0.04);
      const post2 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.08), handleMat);
      post2.position.set(handleX, handleY - 0.6, handleZ > 0 ? handleZ - 0.04 : handleZ + 0.04);
      leafGroup.add(pullBar, post1, post2);
    });
  } else {
    // Standard Interior Lever Handle with Rosette & Escutcheon
    [-leafThick / 2 - 0.02, leafThick / 2 + 0.02].forEach((handleZ, idx) => {
      const handleY = leafH * 0.48;
      const handleX = leafW - 0.3;

      // Escutcheon plate
      const plate = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.42, 0.02), handleMat);
      plate.position.set(handleX, handleY, handleZ);
      leafGroup.add(plate);

      // Lever arm
      const leverArm = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.04, 0.04), handleMat);
      leverArm.position.set(handleX - 0.08, handleY + 0.08, handleZ + (idx === 0 ? -0.04 : 0.04));
      leafGroup.add(leverArm);
    });
  }

  // 5. Butt Hinges on Door Post
  [leafH * 0.15, leafH * 0.5, leafH * 0.85].forEach((hingeY) => {
    const hinge = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.16, 8), hingeMat);
    hinge.position.set(0.02, hingeY, 0.02);
    leafGroup.add(hinge);
  });

  // Position the leaf group at the hinge pivot and rotate ~22° ajar for authentic 3D spatial depth
  leafGroup.position.set(frameThick + 0.02, 0.06, -frameDepth * 0.15);
  leafGroup.rotation.y = -Math.PI / 8.0; // ~22.5 degree open
  doorGroup.add(leafGroup);

  if (orientation === 'horizontal') {
    doorGroup.position.set(startX + offset, bottomY, startZ);
    doorGroup.rotation.y = 0;
  } else {
    doorGroup.position.set(startX, bottomY, startZ + offset + width);
    doorGroup.rotation.y = Math.PI / 2;
  }

  parent.add(doorGroup);
}

/**
 * Creates 3D Residential Architectural Window with Deep Reveal, Molded Stone Sill, Lintel,
 * Black Casing Frames, Bold Cross-Frame (Plus "+" Symbol) Mullions, Double-Glazed Tinted Reflective Glass Layers,
 * Polished Metal Cam Locks, and Interior Drapery Curtains/Blinds.
 */
function createWindowPaneAndFrame(
  parent: THREE.Group,
  startX: number,
  startZ: number,
  orientation: 'horizontal' | 'vertical',
  offset: number,
  width: number,
  sillY: number,
  height: number,
  wallThickness: number,
  blackFrameMat: THREE.Material,
  mullionMat: THREE.Material,
  innerTrimMat: THREE.Material,
  sillMat: THREE.Material,
  glassMat: THREE.Material,
  innerGlassMat: THREE.Material,
  roomType: string = 'default'
) {
  const winGroup = new THREE.Group();
  const frameThick = 0.15;
  const frameDepth = wallThickness + 0.08;

  const isBathroom = roomType === 'sanitary';
  const isLiving = roomType === 'living';
  const isBedroom = roomType === 'bedroom';
  const isKitchen = roomType === 'kitchen';

  // 1. Exterior Projecting Molded Stone Sill Shelf with Drip Nose & Extended Horns
  if (height < 7.0) {
    const sillProtrusion = 0.36;
    const sillThickness = 0.18;
    const sillHornExtension = 0.4; // Extends 4.8" past each side of the opening
    const sillGeo = new THREE.BoxGeometry(width + sillHornExtension * 2, sillThickness, wallThickness + sillProtrusion);
    const sillMesh = new THREE.Mesh(sillGeo, sillMat);
    sillMesh.position.set(width / 2, -sillThickness / 2, 0.09);
    sillMesh.castShadow = true;
    winGroup.add(sillMesh);

    // Beveled Drip Nose Under-Lip to shed rainwater
    const lipGeo = new THREE.BoxGeometry(width + sillHornExtension * 2 - 0.04, 0.06, 0.12);
    const lipMesh = new THREE.Mesh(lipGeo, sillMat);
    lipMesh.position.set(width / 2, -sillThickness - 0.03, wallThickness / 2 + sillProtrusion / 2 - 0.03);
    winGroup.add(lipMesh);
  }

  // 2. Upper Architectural Lintel Header Bar / Crown Molding
  const lintelHeight = 0.24;
  const lintelGeo = new THREE.BoxGeometry(width + 0.45, lintelHeight, wallThickness + 0.08);
  const lintelMat = new THREE.MeshStandardMaterial({ color: '#E2E8F0', roughness: 0.45 });
  const lintelMesh = new THREE.Mesh(lintelGeo, lintelMat);
  lintelMesh.position.set(width / 2, height + lintelHeight / 2, 0.02);
  lintelMesh.castShadow = true;
  winGroup.add(lintelMesh);

  // 3. Outer Master Black Frame Casing (Architectural Jet Black Anodized Aluminum)
  const outerFrame = new THREE.Mesh(new THREE.BoxGeometry(width, height, frameDepth), blackFrameMat);
  outerFrame.position.set(width / 2, height / 2, 0);
  outerFrame.castShadow = true;
  winGroup.add(outerFrame);

  // Exterior & Interior Architrave Trim Stops (Jet Black Proud Facing Borders)
  const trimStopGeo = new THREE.BoxGeometry(width + 0.08, height + 0.08, frameDepth + 0.04);
  const trimStopMesh = new THREE.Mesh(trimStopGeo, blackFrameMat);
  trimStopMesh.position.set(width / 2, height / 2, 0);
  winGroup.add(trimStopMesh);

  // 4. Sash Assemblies & Bold Cross-Frame ("+" Plus Symbol) Grid System
  const openingW = width - frameThick * 2;
  const openingH = height - frameThick * 2;
  const sashW = openingW * 0.52; // Meeting overlap at center for double sash
  const sashH = openingH - 0.04;
  const sashProfile = 0.07;
  const sashDepth = 0.055;

  const sashFrameMat = blackFrameMat;

  // Helper to build a sash assembly with perimeter frame, bold "+" cross-mullions, and secondary reflective glass layer
  const buildSashWithCrossMullions = (
    sw: number,
    sh: number,
    depth: number,
    style: 'cross-4' | 'cross-6' | 'cross-plus' = 'cross-4'
  ) => {
    const sGroup = new THREE.Group();

    // 4-sided Sash Perimeter (Top, Bottom Rails + Left, Right Stiles)
    const railT = new THREE.Mesh(new THREE.BoxGeometry(sw, sashProfile, depth), sashFrameMat);
    railT.position.set(0, sh / 2 - sashProfile / 2, 0);
    const railB = new THREE.Mesh(new THREE.BoxGeometry(sw, sashProfile, depth), sashFrameMat);
    railB.position.set(0, -sh / 2 + sashProfile / 2, 0);
    const stileL = new THREE.Mesh(new THREE.BoxGeometry(sashProfile, sh - sashProfile * 2, depth), sashFrameMat);
    stileL.position.set(-sw / 2 + sashProfile / 2, 0, 0);
    const stileR = new THREE.Mesh(new THREE.BoxGeometry(sashProfile, sh - sashProfile * 2, depth), sashFrameMat);
    stileR.position.set(sw / 2 - sashProfile / 2, 0, 0);

    sGroup.add(railT, railB, stileL, stileR);

    // Inner Glass Lite Opening Dimensions
    const innerW = sw - sashProfile * 2;
    const innerH = sh - sashProfile * 2;
    const mWidth = 0.05; // Bold 0.6-inch mullion bar
    const mDepth = depth * 0.9;

    // Cross-Frame Mullions ("+" Plus Symbol Shape)
    if (style === 'cross-4' || style === 'cross-plus') {
      // Classic bold 4-pane cross grid (+ plus symbol)
      const vBar = new THREE.Mesh(new THREE.BoxGeometry(mWidth, innerH, mDepth), mullionMat);
      vBar.position.set(0, 0, 0);
      const hBar = new THREE.Mesh(new THREE.BoxGeometry(innerW, mWidth, mDepth), mullionMat);
      hBar.position.set(0, 0, 0);
      sGroup.add(vBar, hBar);
    } else if (style === 'cross-6') {
      // 6-pane cross grid (1 vertical center post + 2 horizontal cross bars)
      const vBar = new THREE.Mesh(new THREE.BoxGeometry(mWidth, innerH, mDepth), mullionMat);
      vBar.position.set(0, 0, 0);
      const hBar1 = new THREE.Mesh(new THREE.BoxGeometry(innerW, mWidth, mDepth), mullionMat);
      hBar1.position.set(0, innerH * 0.22, 0);
      const hBar2 = new THREE.Mesh(new THREE.BoxGeometry(innerW, mWidth, mDepth), mullionMat);
      hBar2.position.set(0, -innerH * 0.22, 0);
      sGroup.add(vBar, hBar1, hBar2);
    }

    // Double-Glazed Insulated Glass Layers (Dual Reflective Panes with Slight Tint)
    const glassW = innerW;
    const glassH = innerH;
    const glassThick = 0.018;

    // Primary Exterior Glass Mesh Layer (High Specular Reflectivity & Slate Tint)
    const glassFront = new THREE.Mesh(new THREE.BoxGeometry(glassW, glassH, glassThick), glassMat);
    glassFront.position.set(0, 0, 0.015);

    // Secondary Interior Glass Mesh Layer (Double-Pane Layer with Transparency & Specular Sheen)
    const glassBack = new THREE.Mesh(new THREE.BoxGeometry(glassW, glassH, glassThick), innerGlassMat);
    glassBack.position.set(0, 0, -0.015);

    sGroup.add(glassFront, glassBack);
    return sGroup;
  };

  if (isBathroom) {
    // High privacy awning window with bold cross-frame "+" mullion & privacy louvers
    const sash = buildSashWithCrossMullions(openingW, openingH, sashDepth, 'cross-4');
    sash.position.set(width / 2, height / 2, 0);
    winGroup.add(sash);

    // Exterior Security Louver Slats
    const louverGeo = new THREE.BoxGeometry(openingW - 0.04, 0.08, 0.16);
    const louverMat = new THREE.MeshStandardMaterial({ color: '#94A3B8', roughness: 0.3, metalness: 0.6 });
    [-openingH * 0.28, 0, openingH * 0.28].forEach((ly) => {
      const louver = new THREE.Mesh(louverGeo, louverMat);
      louver.position.set(width / 2, height / 2 + ly, wallThickness * 0.25);
      louver.rotation.x = Math.PI / 5;
      louver.castShadow = true;
      winGroup.add(louver);
    });
  } else if (width < 3.6) {
    // Single Casement/Picture Window with Prominent "+" Cross-Frame Grid
    const singleSash = buildSashWithCrossMullions(openingW, openingH, sashDepth, 'cross-4');
    singleSash.position.set(width / 2, height / 2, 0);
    winGroup.add(singleSash);

    // Center Cam Lock Mechanism
    const lockMat = new THREE.MeshStandardMaterial({ color: '#E2E8F0', roughness: 0.15, metalness: 0.95 });
    const lockBase = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.16, 0.08), lockMat);
    lockBase.position.set(width / 2, height / 2, 0.04);
    const lockLever = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.14, 8), lockMat);
    lockLever.position.set(width / 2, height / 2 + 0.07, 0.07);
    lockLever.rotation.z = Math.PI / 4;
    winGroup.add(lockBase, lockLever);
  } else {
    // Dual Interlocking Sashes (Left & Right), each with its own bold "+" cross-frame grid
    const gridStyle = isLiving || height > 4.5 ? 'cross-6' : 'cross-4';

    // Left Sash (Sliding panel in front: Z = +0.038)
    const leftSash = buildSashWithCrossMullions(sashW, sashH, sashDepth, gridStyle);
    const leftX = frameThick + sashW / 2;
    leftSash.position.set(leftX, height / 2, 0.038);
    winGroup.add(leftSash);

    // Right Sash (Fixed panel in rear: Z = -0.038)
    const rightSash = buildSashWithCrossMullions(sashW, sashH, sashDepth, gridStyle);
    const rightX = width - frameThick - sashW / 2;
    rightSash.position.set(rightX, height / 2, -0.038);
    winGroup.add(rightSash);

    // Bottom Sash Guide Runner Rail Track
    const trackGeo = new THREE.BoxGeometry(openingW, 0.035, 0.15);
    const trackMat = new THREE.MeshStandardMaterial({ color: '#94A3B8', roughness: 0.25, metalness: 0.8 });
    const track = new THREE.Mesh(trackGeo, trackMat);
    track.position.set(width / 2, frameThick + 0.018, 0);
    winGroup.add(track);

    // Center Meeting Rail Lock Mechanism (Polished Chrome Cam Lock & Lever)
    const lockMat = new THREE.MeshStandardMaterial({ color: '#E2E8F0', roughness: 0.15, metalness: 0.95 });
    const lockBase = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.2, 0.1), lockMat);
    lockBase.position.set(width / 2, height / 2, 0.045);
    const lockLever = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.16, 8), lockMat);
    lockLever.position.set(width / 2, height / 2 + 0.09, 0.085);
    lockLever.rotation.z = Math.PI / 4;
    winGroup.add(lockBase, lockLever);

    // Sash Lift Handles on Bottom Rail
    const handleGeo = new THREE.BoxGeometry(0.22, 0.04, 0.05);
    const handleL = new THREE.Mesh(handleGeo, lockMat);
    handleL.position.set(leftX, frameThick + sashProfile + 0.04, 0.065);
    const handleR = new THREE.Mesh(handleGeo, lockMat);
    handleR.position.set(rightX, frameThick + sashProfile + 0.04, -0.015);
    winGroup.add(handleL, handleR);

    // Upper Transom Cross Bar for tall or living room windows
    if (isLiving || height > 4.5) {
      const transomGeo = new THREE.BoxGeometry(openingW, 0.09, 0.09);
      const transom = new THREE.Mesh(transomGeo, blackFrameMat);
      transom.position.set(width / 2, height * 0.74, 0);
      winGroup.add(transom);
    }

    // 5. Interior Window Treatments (Linen Curtains / Venetian Blinds)
    if (isLiving || isBedroom) {
      // Soft Folded Linen Fabric Curtain Panels on Interior Flanks
      const curtainMat = new THREE.MeshStandardMaterial({
        color: '#F1F5F9', // Warm linen off-white
        roughness: 0.85,
      });

      const curtainW = Math.max(0.7, width * 0.28);
      const curtainH = height + 0.4;
      const curtainD = 0.12;

      // Left Curtain Panel
      const cLeft = new THREE.Mesh(new THREE.BoxGeometry(curtainW, curtainH, curtainD), curtainMat);
      cLeft.position.set(curtainW / 2 + 0.05, height / 2 - 0.1, -wallThickness / 2 - 0.08);
      cLeft.castShadow = true;

      // Right Curtain Panel
      const cRight = new THREE.Mesh(new THREE.BoxGeometry(curtainW, curtainH, curtainD), curtainMat);
      cRight.position.set(width - curtainW / 2 - 0.05, height / 2 - 0.1, -wallThickness / 2 - 0.08);
      cRight.castShadow = true;

      // Curtain Rod & End Finials
      const rodMat = new THREE.MeshStandardMaterial({ color: '#1E293B', roughness: 0.3, metalness: 0.7 });
      const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, width + 0.8, 8), rodMat);
      rod.position.set(width / 2, height + 0.2, -wallThickness / 2 - 0.08);
      rod.rotation.z = Math.PI / 2;

      winGroup.add(cLeft, cRight, rod);
    } else if (isKitchen) {
      // Crisp Venetian Blinds Drawn at Top
      const blindMat = new THREE.MeshStandardMaterial({ color: '#E2E8F0', roughness: 0.5 });
      const blindTop = new THREE.Mesh(
        new THREE.BoxGeometry(openingW, Math.min(0.8, height * 0.25), 0.08),
        blindMat
      );
      blindTop.position.set(width / 2, height - frameThick - Math.min(0.4, height * 0.125), -wallThickness / 2 - 0.04);
      winGroup.add(blindTop);
    }
  }

  // Positioning & Rotation in 3D Space
  if (orientation === 'horizontal') {
    winGroup.position.set(startX + offset, sillY, startZ);
    winGroup.rotation.y = 0;
  } else {
    winGroup.position.set(startX, sillY, startZ + offset + width);
    winGroup.rotation.y = Math.PI / 2;
  }

  parent.add(winGroup);
}

/**
 * Builds Garden / Lawn space with landscaping flower beds and stone border
 */
function buildGardenRoom(
  parent: THREE.Group,
  posX: number,
  posZ: number,
  width: number,
  height: number
) {
  const curbMat = new THREE.MeshStandardMaterial({ color: '#E2E8F0', roughness: 0.8 });
  const shrubMat = new THREE.MeshStandardMaterial({ color: '#15803D', roughness: 0.9 });
  const flowerMat = new THREE.MeshStandardMaterial({ color: '#F43F5E', roughness: 0.7 });
  const curbThickness = 0.35;
  const curbHeight = 0.5;

  const curbGeoN = new THREE.BoxGeometry(width, curbHeight, curbThickness);
  const curbN = new THREE.Mesh(curbGeoN, curbMat);
  curbN.position.set(posX, curbHeight / 2, posZ - height / 2 + curbThickness / 2);
  parent.add(curbN);

  const curbGeoS = new THREE.BoxGeometry(width, curbHeight, curbThickness);
  const curbS = new THREE.Mesh(curbGeoS, curbMat);
  curbS.position.set(posX, curbHeight / 2, posZ + height / 2 - curbThickness / 2);
  parent.add(curbS);

  // Decorative Accent Shrub Planter Box
  const shrubGeo = new THREE.BoxGeometry(Math.max(1.5, width * 0.8), 0.6, 0.8);
  const shrubMesh = new THREE.Mesh(shrubGeo, shrubMat);
  shrubMesh.position.set(posX, 0.3, posZ - height / 2 + 0.8);
  shrubMesh.castShadow = true;
  parent.add(shrubMesh);

  // Small flower accents
  const f1 = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), flowerMat);
  f1.position.set(posX - width * 0.2, 0.65, posZ - height / 2 + 0.8);
  const f2 = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), flowerMat);
  f2.position.set(posX + width * 0.2, 0.65, posZ - height / 2 + 0.8);
  parent.add(f1, f2);
}

/**
 * Builds the finished yard and setback spaces strictly inside the plot boundary between the house plinth and the perimeter compound wall.
 * Features a perimeter stone walkway, driveway connection to the parking bay, entrance pedestrian path, and lush lawn borders.
 */
function buildPlotSetbackGround(
  parent: THREE.Group,
  landW: number,
  landH: number,
  setbacks: SetbackBounds,
  paverMat: THREE.Material,
  grassMat: THREE.Material,
  layoutData: LayoutData,
  polygonVertices?: PolygonVertex3D[],
  polygonEdges?: PolygonEdge3D[],
  roadFacingEdge?: PolygonEdge3D,
  isPolygonPlot?: boolean
) {
  const yardGroup = new THREE.Group();

  const parkRoom = layoutData.rooms.find(
    (r) =>
      r.name.toLowerCase().includes('park') ||
      r.name.toLowerCase().includes('car') ||
      r.name.toLowerCase().includes('porch') ||
      r.name.toLowerCase().includes('garage')
  );
  const facing = layoutData.facingDirection || 'North';
  const drivewayMat = new THREE.MeshStandardMaterial({
    color: '#64748B',
    roughness: 0.65,
  });

  const ent = layoutData.entrance;

  if (isPolygonPlot && polygonVertices && polygonVertices.length >= 3 && polygonEdges && roadFacingEdge) {
    // 1. Polygon Ground Plate (Lush Lawn Grass) covering exact polygon boundary
    const shape = new THREE.Shape();
    shape.moveTo(polygonVertices[0].x, -polygonVertices[0].z);
    for (let i = 1; i < polygonVertices.length; i++) {
      shape.lineTo(polygonVertices[i].x, -polygonVertices[i].z);
    }
    shape.closePath();

    const shapeGeo = new THREE.ShapeGeometry(shape);
    shapeGeo.rotateX(-Math.PI / 2);
    shapeGeo.computeVertexNormals();

    const posAttr = shapeGeo.attributes.position;
    const uvs = new Float32Array(posAttr.count * 2);
    for (let i = 0; i < posAttr.count; i++) {
      uvs[i * 2] = posAttr.getX(i) * 0.12;
      uvs[i * 2 + 1] = posAttr.getZ(i) * 0.12;
    }
    shapeGeo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));

    const yardBase = new THREE.Mesh(shapeGeo, grassMat);
    yardBase.position.set(0, -0.24, 0);
    yardBase.receiveShadow = true;
    yardGroup.add(yardBase);

    // 2. Driveway Pavement connecting Parking Area to Gate on Road-Facing Edge
    if (parkRoom) {
      const { posX: parkX, posZ: parkZ } = to3DPos(
        parkRoom.x,
        parkRoom.y,
        parkRoom.width,
        parkRoom.height,
        landW,
        landH
      );
      const gateTarget = roadFacingEdge.midpoint;
      const dX = gateTarget.x - parkX;
      const dZ = gateTarget.z - parkZ;
      const dist = Math.hypot(dX, dZ);
      const driveAngle = Math.atan2(dZ, dX);
      const driveW = Math.max(9.0, parkRoom.width);

      const driveGeo = new THREE.BoxGeometry(dist + 2.0, 0.08, driveW);
      const driveMesh = new THREE.Mesh(driveGeo, drivewayMat);
      driveMesh.position.set((parkX + gateTarget.x) / 2, -0.15, (parkZ + gateTarget.z) / 2);
      driveMesh.rotation.y = -driveAngle;
      driveMesh.receiveShadow = true;
      yardGroup.add(driveMesh);
    }

    // 3. Entrance Walkway connecting Entrance to Gate or Road
    if (ent) {
      const entDoorX = ent.x + (ent.width || 4.0) / 2 - landW / 2;
      const entDoorZ = ent.y - landH / 2;
      const gateTarget = roadFacingEdge.midpoint;
      const eDX = gateTarget.x - entDoorX;
      const eDZ = gateTarget.z - entDoorZ;
      const eDist = Math.hypot(eDX, eDZ);
      if (eDist > 2.0) {
        const walkAngle = Math.atan2(eDZ, eDX);
        const walkMesh = new THREE.Mesh(
          new THREE.BoxGeometry(eDist, 0.06, 3.5),
          paverMat
        );
        walkMesh.position.set((entDoorX + gateTarget.x) / 2, -0.16, (entDoorZ + gateTarget.z) / 2);
        walkMesh.rotation.y = -walkAngle;
        walkMesh.receiveShadow = true;
        yardGroup.add(walkMesh);
      }
    }

    // 4. Perimeter Flowerbeds / Hedges along Interior Compound Walls
    const hedgeMat = new THREE.MeshStandardMaterial({ color: '#15803D', roughness: 0.8 });
    const flowerMat = new THREE.MeshStandardMaterial({ color: '#F43F5E', roughness: 0.6 });

    polygonEdges.forEach((edge) => {
      if (edge.index === roadFacingEdge.index) return; // Skip road frontage
      if (edge.length < 5.0) return;

      const hedgeLen = Math.max(2.0, edge.length - 4.0);
      const hedgeH = 1.6;
      const hedgeD = 1.0;

      // Position offset inward along -normal
      const inX = edge.midpoint.x - edge.normal.x * 1.1;
      const inZ = edge.midpoint.z - edge.normal.z * 1.1;

      const hedge = new THREE.Mesh(
        new THREE.BoxGeometry(hedgeLen, hedgeH, hedgeD),
        hedgeMat
      );
      hedge.position.set(inX, hedgeH / 2 - 0.2, inZ);
      hedge.rotation.y = -edge.angle;
      hedge.castShadow = true;
      hedge.receiveShadow = true;
      yardGroup.add(hedge);

      // Colorful flowers along top of hedge
      for (let s = -hedgeLen / 2 + 1.2; s < hedgeLen / 2 - 0.8; s += 2.2) {
        const flower = new THREE.Mesh(new THREE.SphereGeometry(0.25, 6, 6), flowerMat);
        const fLocalX = s;
        const fLocalZ = 0;
        const fWorldX = inX + (fLocalX * Math.cos(-edge.angle) + fLocalZ * Math.sin(-edge.angle));
        const fWorldZ = inZ + (-fLocalX * Math.sin(-edge.angle) + fLocalZ * Math.cos(-edge.angle));
        flower.position.set(fWorldX, hedgeH - 0.15, fWorldZ);
        yardGroup.add(flower);
      }
    });

    parent.add(yardGroup);
    return;
  }

  // --- RECTANGULAR PLOT SETBACK GROUND ---
  const yardBaseGeo = new THREE.BoxGeometry(landW, 0.1, landH);
  const yardBase = new THREE.Mesh(yardBaseGeo, grassMat);
  yardBase.position.set(0, -0.24, 0);
  yardBase.receiveShadow = true;
  yardGroup.add(yardBase);

  // 2. Driveway Paver Pavement across the front setback connecting Compound Gate to Parking Area
  if (parkRoom) {
    const { posX: parkX, posZ: parkZ } = to3DPos(parkRoom.x, parkRoom.y, parkRoom.width, parkRoom.height, landW, landH);
    const driveW = Math.max(9.0, parkRoom.width);

    if (facing === 'North') {
      const driveDepth = Math.abs(-landH / 2 - (parkZ - parkRoom.height / 2));
      const driveMidZ = (-landH / 2 + (parkZ - parkRoom.height / 2)) / 2;
      const driveMesh = new THREE.Mesh(new THREE.BoxGeometry(driveW, 0.08, driveDepth + 0.4), drivewayMat);
      driveMesh.position.set(parkX, -0.15, driveMidZ);
      driveMesh.receiveShadow = true;
      yardGroup.add(driveMesh);
    } else if (facing === 'South') {
      const driveDepth = Math.abs(landH / 2 - (parkZ + parkRoom.height / 2));
      const driveMidZ = (landH / 2 + (parkZ + parkRoom.height / 2)) / 2;
      const driveMesh = new THREE.Mesh(new THREE.BoxGeometry(driveW, 0.08, driveDepth + 0.4), drivewayMat);
      driveMesh.position.set(parkX, -0.15, driveMidZ);
      driveMesh.receiveShadow = true;
      yardGroup.add(driveMesh);
    } else if (facing === 'East') {
      const driveDepth = Math.abs(landW / 2 - (parkX + parkRoom.width / 2));
      const driveMidX = (landW / 2 + (parkX + parkRoom.width / 2)) / 2;
      const driveMesh = new THREE.Mesh(new THREE.BoxGeometry(driveDepth + 0.4, 0.08, driveW), drivewayMat);
      driveMesh.position.set(driveMidX, -0.15, parkZ);
      driveMesh.receiveShadow = true;
      yardGroup.add(driveMesh);
    } else {
      const driveDepth = Math.abs(-landW / 2 - (parkX - parkRoom.width / 2));
      const driveMidX = (-landW / 2 + (parkX - parkRoom.width / 2)) / 2;
      const driveMesh = new THREE.Mesh(new THREE.BoxGeometry(driveDepth + 0.4, 0.08, driveW), drivewayMat);
      driveMesh.position.set(driveMidX, -0.15, parkZ);
      driveMesh.receiveShadow = true;
      yardGroup.add(driveMesh);
    }
  }

  // 3. Entrance Walkway strictly extruded from 2D sitePlan
  if (layoutData.sitePlan?.walkway) {
    const sw = layoutData.sitePlan.walkway;
    const doorX = sw.endX - landW / 2;
    const doorZ = sw.endY - landH / 2;
    const gateX = sw.startX - landW / 2;
    const gateZ = sw.startY - landH / 2;
    const wLen = Math.hypot(gateX - doorX, gateZ - doorZ);
    if (wLen > 0.5) {
      const walkAngle = Math.atan2(gateZ - doorZ, gateX - doorX);
      const walkMesh = new THREE.Mesh(new THREE.BoxGeometry(wLen, 0.06, sw.width || 3.6), paverMat);
      walkMesh.position.set((doorX + gateX) / 2, -0.16, (doorZ + gateZ) / 2);
      walkMesh.rotation.y = -walkAngle;
      walkMesh.receiveShadow = true;
      yardGroup.add(walkMesh);
    }
  } else if (ent) {
    const doorX = ent.x + (ent.width || 4.0) / 2 - landW / 2;
    const doorZ = ent.y - landH / 2;
    let gateX = doorX;
    let gateZ = doorZ;

    if (facing === 'North') gateZ = -landH / 2;
    else if (facing === 'South') gateZ = landH / 2;
    else if (facing === 'East') gateX = landW / 2;
    else gateX = -landW / 2;

    const wLen = Math.hypot(gateX - doorX, gateZ - doorZ);
    if (wLen > 1.5) {
      const walkAngle = Math.atan2(gateZ - doorZ, gateX - doorX);
      const walkMesh = new THREE.Mesh(new THREE.BoxGeometry(wLen, 0.06, 3.6), paverMat);
      walkMesh.position.set((doorX + gateX) / 2, -0.16, (doorZ + gateZ) / 2);
      walkMesh.rotation.y = -walkAngle;
      walkMesh.receiveShadow = true;
      yardGroup.add(walkMesh);
    }
  }

  // 4. Setback Landscaping Flowerbeds along Compound Wall Interior Base
  const flowerbedMat = new THREE.MeshStandardMaterial({ color: '#15803D', roughness: 0.85 });
  const flowerAccentMat = new THREE.MeshStandardMaterial({ color: '#F43F5E', roughness: 0.6 });

  const addHedge = (w: number, d: number, x: number, z: number) => {
    const hedge = new THREE.Mesh(new THREE.BoxGeometry(w, 0.65, d), flowerbedMat);
    hedge.position.set(x, 0.1, z);
    hedge.castShadow = true;
    yardGroup.add(hedge);

    // Flower buds
    for (let i = -0.4; i <= 0.4; i += 0.4) {
      const fl = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 6), flowerAccentMat);
      fl.position.set(x + (w > d ? (w * i) / 2 : 0), 0.48, z + (d >= w ? (d * i) / 2 : 0));
      yardGroup.add(fl);
    }
  };

  // Rear & Side Setback Garden Hedges (placed safely inside the boundary)
  if (facing === 'North') {
    addHedge(landW - 4, 1.0, 0, landH / 2 - 1.0);
  } else if (facing === 'South') {
    addHedge(landW - 4, 1.0, 0, -landH / 2 + 1.0);
  } else if (facing === 'East') {
    addHedge(1.0, landH - 4, -landW / 2 + 1.0, 0);
  } else {
    addHedge(1.0, landH - 4, landW / 2 - 1.0, 0);
  }

  parent.add(yardGroup);
}

/**
 * Builds the exterior asphalt access road with sidewalk, curbs, road markings and streetlamp
 * positioned strictly outside the plot boundary and compound wall along the facing frontage.
 */
function buildExteriorAccessRoad(
  houseGroup: THREE.Group,
  setbacks: SetbackBounds,
  facing: string,
  roadFacingEdge?: PolygonEdge3D,
  isPolygonPlot?: boolean
) {
  const roadDepth = 24.0; // 24 ft wide two-lane public access road
  const sidewalkDepth = 4.5; // 4.5 ft concrete sidewalk along property frontage
  const curbHeight = 0.25;

  const roadMat = new THREE.MeshStandardMaterial({ color: '#1E293B', roughness: 0.85 }); // Charcoal asphalt
  const sidewalkMat = new THREE.MeshStandardMaterial({ color: '#E2E8F0', roughness: 0.65 }); // Light gray concrete
  const curbMat = new THREE.MeshStandardMaterial({ color: '#CBD5E1', roughness: 0.5 }); // Concrete curb stone
  const centerLineMat = new THREE.MeshStandardMaterial({ color: '#FEF08A', roughness: 0.4 }); // Yellow road striping
  const edgeLineMat = new THREE.MeshStandardMaterial({ color: '#FFFFFF', roughness: 0.4 }); // White boundary striping
  const lampPoleMat = new THREE.MeshStandardMaterial({ color: '#0F172A', roughness: 0.3, metalness: 0.8 });
  const lampLightMat = new THREE.MeshStandardMaterial({
    color: '#FEF08A',
    emissive: '#FEF08A',
    emissiveIntensity: 1.2,
  });

  const { plotMinX, plotMaxX, plotMinZ, plotMaxZ, plotW, plotH } = setbacks;

  let roadLength = Math.max(plotW, plotH) + 50.0;
  let roadX = (plotMinX + plotMaxX) / 2;
  let roadZ = (plotMinZ + plotMaxZ) / 2;
  let roadRot = 0;

  // The road is positioned strictly outside the plot boundary
  const bufferFromBoundary = 0.5; // Gap between compound wall base and sidewalk
  const totalOffset = bufferFromBoundary + sidewalkDepth + roadDepth / 2;

  if (isPolygonPlot && roadFacingEdge) {
    roadLength = Math.max(roadFacingEdge.length + 45.0, 60.0);
    roadX = roadFacingEdge.midpoint.x + roadFacingEdge.normal.x * totalOffset;
    roadZ = roadFacingEdge.midpoint.z + roadFacingEdge.normal.z * totalOffset;
    roadRot = -roadFacingEdge.angle;
  } else {
    if (facing === 'North') {
      roadX = (plotMinX + plotMaxX) / 2;
      roadZ = plotMinZ - totalOffset;
      roadRot = 0;
    } else if (facing === 'South') {
      roadX = (plotMinX + plotMaxX) / 2;
      roadZ = plotMaxZ + totalOffset;
      roadRot = 0;
    } else if (facing === 'East') {
      roadX = plotMaxX + totalOffset;
      roadZ = (plotMinZ + plotMaxZ) / 2;
      roadRot = Math.PI / 2;
    } else {
      roadX = plotMinX - totalOffset;
      roadZ = (plotMinZ + plotMaxZ) / 2;
      roadRot = Math.PI / 2;
    }
  }

  const roadGroup = new THREE.Group();

  // 1. Asphalt Road Deck (Slightly sunken to -0.25 to align with ground level)
  const roadMesh = new THREE.Mesh(new THREE.BoxGeometry(roadLength, 0.1, roadDepth), roadMat);
  roadMesh.position.set(0, -0.25, 0);
  roadMesh.receiveShadow = true;
  roadGroup.add(roadMesh);

  // 2. Yellow Dashed Center Line Markings
  for (let i = -roadLength / 2 + 5; i < roadLength / 2 - 5; i += 9) {
    const dash = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.12, 0.4), centerLineMat);
    dash.position.set(i, -0.23, 0);
    roadGroup.add(dash);
  }

  // 3. Solid White Road Edge Guide Lines (both sides of carriage way)
  const whiteLineNear = new THREE.Mesh(new THREE.BoxGeometry(roadLength, 0.12, 0.25), edgeLineMat);
  whiteLineNear.position.set(0, -0.23, -roadDepth / 2 + 0.8);
  const whiteLineFar = new THREE.Mesh(new THREE.BoxGeometry(roadLength, 0.12, 0.25), edgeLineMat);
  whiteLineFar.position.set(0, -0.23, roadDepth / 2 - 0.8);
  roadGroup.add(whiteLineNear, whiteLineFar);

  // 4. Outer Concrete Road Curb
  const outerCurb = new THREE.Mesh(new THREE.BoxGeometry(roadLength, curbHeight, 0.6), curbMat);
  outerCurb.position.set(0, -0.15, roadDepth / 2 + 0.3);
  roadGroup.add(outerCurb);

  // 5. Inner Sidewalk Pavement along Property Frontage (between Road and Plot Boundary)
  const sidewalkMesh = new THREE.Mesh(
    new THREE.BoxGeometry(roadLength, 0.15, sidewalkDepth),
    sidewalkMat
  );
  sidewalkMesh.position.set(0, -0.18, -roadDepth / 2 - sidewalkDepth / 2);
  sidewalkMesh.receiveShadow = true;
  roadGroup.add(sidewalkMesh);

  // Curb dividing Sidewalk and Road
  const streetCurb = new THREE.Mesh(new THREE.BoxGeometry(roadLength, curbHeight, 0.45), curbMat);
  streetCurb.position.set(0, -0.14, -roadDepth / 2);
  roadGroup.add(streetCurb);

  // 6. Modern Streetlamp Luminaire on Sidewalk Curb
  const lampGroup = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 14.0, 8), lampPoleMat);
  pole.position.set(0, 7.0, 0);
  lampGroup.add(pole);

  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 3.5), lampPoleMat);
  arm.position.set(0, 13.8, 1.6);
  lampGroup.add(arm);

  const luminaire = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.15, 1.4), lampPoleMat);
  luminaire.position.set(0, 13.6, 3.2);
  lampGroup.add(luminaire);

  const lightBulb = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.05, 1.1), lampLightMat);
  lightBulb.position.set(0, 13.5, 3.2);
  lampGroup.add(lightBulb);

  const streetLight = new THREE.PointLight(0xFEF08A, 1.2, 35);
  streetLight.position.set(0, 13.0, 3.2);
  lampGroup.add(streetLight);

  lampGroup.position.set(roadLength * 0.32, -0.2, -roadDepth / 2 - 0.6);
  roadGroup.add(lampGroup);

  // Apply world position & orientation strictly outside the plot
  roadGroup.position.set(roadX, 0, roadZ);
  roadGroup.rotation.y = roadRot;
  houseGroup.add(roadGroup);
}

/**
 * Builds realistic perimeter compound wall along the true plot boundary (with setbacks),
 * featuring masonry coping, pillars with lantern caps, a concrete driveway ramp,
 * and an architectural entrance gate aligned directly with the parking area.
 */
function buildCompoundWallAndGates(
  houseGroup: THREE.Group,
  setbacks: SetbackBounds,
  facing: string,
  layoutData: LayoutData,
  polygonVertices?: PolygonVertex3D[],
  polygonEdges?: PolygonEdge3D[],
  roadFacingEdge?: PolygonEdge3D,
  isPolygonPlot?: boolean
) {
  const boundaryH = 4.2;
  const boundaryThick = 0.5;

  const wallMat = new THREE.MeshStandardMaterial({
    color: '#E2E8F0', // Crisp modern architectural off-white stucco
    roughness: 0.8,
  });

  const plinthSkirtMat = new THREE.MeshStandardMaterial({
    color: '#334155', // Charcoal granite plinth base skirt
    roughness: 0.65,
  });

  const copingMat = new THREE.MeshStandardMaterial({
    color: '#0F172A', // Weather-resistant graphite coping capstone
    roughness: 0.4,
  });

  const pillarMat = new THREE.MeshStandardMaterial({
    color: '#475569',
    roughness: 0.55,
  });

  const pillarLightMat = new THREE.MeshStandardMaterial({
    color: '#FEF08A',
    emissive: '#FEF08A',
    emissiveIntensity: 0.9,
    roughness: 0.2,
  });

  const addPillar = (px: number, pz: number) => {
    const pil = new THREE.Mesh(new THREE.BoxGeometry(1.0, boundaryH + 0.6, 1.0), pillarMat);
    pil.position.set(px, (boundaryH + 0.6) / 2 - 0.3, pz);
    pil.castShadow = true;
    pil.receiveShadow = true;
    houseGroup.add(pil);

    // Stone Coping Cap on Pillar
    const cap = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.14, 1.2), copingMat);
    cap.position.set(px, boundaryH + 0.3 + 0.07, pz);
    houseGroup.add(cap);

    // Warm Lantern Fixture on Pillar Top
    const lightCap = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.28, 0.38, 8), pillarLightMat);
    lightCap.position.set(px, boundaryH + 0.48 + 0.19, pz);
    houseGroup.add(lightCap);
  };

  const addOrientedWallSegment = (
    p1: { x: number; z: number },
    p2: { x: number; z: number },
    angle: number
  ) => {
    const len = Math.hypot(p2.x - p1.x, p2.z - p1.z);
    if (len <= 0.2) return;

    const midX = (p1.x + p2.x) / 2;
    const midZ = (p1.z + p2.z) / 2;

    const wallSegGroup = new THREE.Group();

    // Main Masonry Wall
    const wall = new THREE.Mesh(new THREE.BoxGeometry(len, boundaryH, boundaryThick), wallMat);
    wall.position.set(0, boundaryH / 2 - 0.3, 0);
    wall.castShadow = true;
    wall.receiveShadow = true;
    wallSegGroup.add(wall);

    // Dark Plinth Skirt at Wall Base
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(len + 0.04, 0.35, boundaryThick + 0.04), plinthSkirtMat);
    plinth.position.set(0, -0.12, 0);
    plinth.receiveShadow = true;
    wallSegGroup.add(plinth);

    // Weather-shedding Beveled Coping Cap on Top
    const cap = new THREE.Mesh(new THREE.BoxGeometry(len + 0.08, 0.12, boundaryThick + 0.08), copingMat);
    cap.position.set(0, boundaryH - 0.3 + 0.06, 0);
    cap.castShadow = true;
    wallSegGroup.add(cap);

    wallSegGroup.position.set(midX, 0, midZ);
    wallSegGroup.rotation.y = -angle;
    houseGroup.add(wallSegGroup);
  };

  const parkRoom = layoutData.rooms.find(
    (r) =>
      r.name.toLowerCase().includes('park') ||
      r.name.toLowerCase().includes('car') ||
      r.name.toLowerCase().includes('porch') ||
      r.name.toLowerCase().includes('garage')
  );
  const ent = layoutData.entrance;
  const landW = layoutData.land.length;
  const landH = layoutData.land.breadth;

  // --- POLYGON COMPOUND WALL IMPLEMENTATION ---
  if (isPolygonPlot && polygonVertices && polygonVertices.length >= 3 && polygonEdges && roadFacingEdge) {
    // 1. Add Corner Masonry Pillars at EVERY polygon vertex
    polygonVertices.forEach((v) => {
      addPillar(v.x, v.z);
    });

    // 2. Iterate through each polygon edge connecting consecutive boundary points
    polygonEdges.forEach((edge) => {
      if (edge.index === roadFacingEdge.index) {
        // Road-Facing Front Edge with Aligned Entrance Gate
        const p1 = edge.p1;
        const p2 = edge.p2;
        const totalLen = edge.length;
        const dx = p2.x - p1.x;
        const dz = p2.z - p1.z;

        // Determine gate target point along this edge
        let targetX = edge.midpoint.x;
        let targetZ = edge.midpoint.z;

        if (parkRoom) {
          const pPos = to3DPos(parkRoom.x, parkRoom.y, parkRoom.width, parkRoom.height, landW, landH);
          targetX = pPos.posX;
          targetZ = pPos.posZ;
        } else if (ent) {
          targetX = ent.x + (ent.width || 4.0) / 2 - landW / 2;
          targetZ = ent.y - landH / 2;
        }

        // Project target onto segment p1 -> p2
        const tProj = ((targetX - p1.x) * dx + (targetZ - p1.z) * dz) / (totalLen * totalLen);
        const gateWidth = Math.min(12.0, Math.max(6.5, totalLen * 0.45));

        // Margin fraction to preserve corner pillars
        const marginFrac = (gateWidth / 2 + 1.2) / totalLen;
        let tClamped = Math.min(1 - marginFrac, Math.max(marginFrac, tProj));
        if (marginFrac >= 0.5) tClamped = 0.5;

        const gateCenter = {
          x: p1.x + tClamped * dx,
          z: p1.z + tClamped * dz,
        };

        const halfGateVec = {
          x: (dx / totalLen) * (gateWidth / 2),
          z: (dz / totalLen) * (gateWidth / 2),
        };

        const gStart = {
          x: gateCenter.x - halfGateVec.x,
          z: gateCenter.z - halfGateVec.z,
        };
        const gEnd = {
          x: gateCenter.x + halfGateVec.x,
          z: gateCenter.z + halfGateVec.z,
        };

        // Left Wall Segment
        addOrientedWallSegment(p1, gStart, edge.angle);

        // Gate Pillars at Left and Right of Opening
        addPillar(gStart.x, gStart.z);
        addPillar(gEnd.x, gEnd.z);

        // Gate Assembly & Driveway Ramp aligned with edge
        buildModernGateAssembly(houseGroup, gateCenter.x, gateCenter.z, gateWidth, boundaryH, -edge.angle);
        buildDrivewayRamp(houseGroup, gateCenter.x, gateCenter.z, gateWidth, -edge.angle, edge.normal);

        // Right Wall Segment
        addOrientedWallSegment(gEnd, p2, edge.angle);
      } else {
        // Standard Solid Wall along Polygon Edge
        addOrientedWallSegment(edge.p1, edge.p2, edge.angle);
      }
    });

    return;
  }

  // --- RECTANGULAR COMPOUND WALL FALLBACK (Preserved exactly as original) ---
  const addWallSegment = (w: number, d: number, x: number, z: number) => {
    if (w <= 0.2 || d <= 0.2) return;

    // Main Masonry Wall
    const wall = new THREE.Mesh(new THREE.BoxGeometry(w, boundaryH, d), wallMat);
    wall.position.set(x, boundaryH / 2 - 0.3, z);
    wall.castShadow = true;
    wall.receiveShadow = true;
    houseGroup.add(wall);

    // Dark Plinth Skirt at Wall Base
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(w + 0.04, 0.35, d + 0.04), plinthSkirtMat);
    plinth.position.set(x, -0.12, z);
    plinth.receiveShadow = true;
    houseGroup.add(plinth);

    // Weather-shedding Beveled Coping Cap on Top
    const cap = new THREE.Mesh(new THREE.BoxGeometry(w + 0.08, 0.12, d + 0.08), copingMat);
    cap.position.set(x, boundaryH - 0.3 + 0.06, z);
    cap.castShadow = true;
    houseGroup.add(cap);
  };

  const { plotMinX, plotMaxX, plotMinZ, plotMaxZ, plotW, plotH } = setbacks;

  // Add 4 Corner Pillars
  addPillar(plotMinX, plotMinZ);
  addPillar(plotMaxX, plotMinZ);
  addPillar(plotMinX, plotMaxZ);
  addPillar(plotMaxX, plotMaxZ);

  const isNS = facing === 'North' || facing === 'South';

  // 1. Build the 3 non-facing solid boundary walls
  if (facing === 'North') {
    addWallSegment(plotW, boundaryThick, (plotMinX + plotMaxX) / 2, plotMaxZ); // South wall
    addWallSegment(boundaryThick, plotH, plotMinX, (plotMinZ + plotMaxZ) / 2); // West wall
    addWallSegment(boundaryThick, plotH, plotMaxX, (plotMinZ + plotMaxZ) / 2); // East wall
  } else if (facing === 'South') {
    addWallSegment(plotW, boundaryThick, (plotMinX + plotMaxX) / 2, plotMinZ); // North wall
    addWallSegment(boundaryThick, plotH, plotMinX, (plotMinZ + plotMaxZ) / 2); // West wall
    addWallSegment(boundaryThick, plotH, plotMaxX, (plotMinZ + plotMaxZ) / 2); // East wall
  } else if (facing === 'East') {
    addWallSegment(plotW, boundaryThick, (plotMinX + plotMaxX) / 2, plotMinZ); // North wall
    addWallSegment(plotW, boundaryThick, (plotMinX + plotMaxX) / 2, plotMaxZ); // South wall
    addWallSegment(boundaryThick, plotH, plotMinX, (plotMinZ + plotMaxZ) / 2); // West wall
  } else {
    addWallSegment(plotW, boundaryThick, (plotMinX + plotMaxX) / 2, plotMinZ); // North wall
    addWallSegment(plotW, boundaryThick, (plotMinX + plotMaxX) / 2, plotMaxZ); // South wall
    addWallSegment(boundaryThick, plotH, plotMaxX, (plotMinZ + plotMaxZ) / 2); // East wall
  }

  // 2. Compute Front Opening span specifically targeting the Parking Driveway & Entrance
  let frontSpan = isNS ? plotW : plotH;
  let targetCenter = 0;
  let gateSpan = 11.0;

  if (layoutData.sitePlan?.entranceGate) {
    const eg = layoutData.sitePlan.entranceGate;
    if (isNS) {
      targetCenter = eg.x - landW / 2;
      gateSpan = eg.width || 11.0;
    } else {
      targetCenter = eg.y - landH / 2;
      gateSpan = eg.width || 11.0;
    }
  } else if (isNS) {
    if (parkRoom) {
      targetCenter = parkRoom.x + parkRoom.width / 2 - landW / 2;
      gateSpan = Math.max(10.0, Math.min(parkRoom.width + 2.5, frontSpan * 0.48));
    } else if (ent) {
      targetCenter = ent.x + (ent.width || 4) / 2 - landW / 2;
      gateSpan = Math.min(10.5, frontSpan * 0.4);
    } else {
      targetCenter = 0;
      gateSpan = Math.min(10.5, frontSpan * 0.4);
    }
  } else {
    if (parkRoom) {
      targetCenter = parkRoom.y + parkRoom.height / 2 - landH / 2;
      gateSpan = Math.max(10.0, Math.min(parkRoom.height + 2.5, frontSpan * 0.48));
    } else if (ent) {
      targetCenter = ent.y + (ent.width || 4) / 2 - landH / 2;
      gateSpan = Math.min(10.5, frontSpan * 0.4);
    } else {
      targetCenter = 0;
      gateSpan = Math.min(10.5, frontSpan * 0.4);
    }
  }

  // Clamp gate bounds with at least 2.0 ft clearance from plot corners
  const minCoord = isNS ? plotMinX : plotMinZ;
  const maxCoord = isNS ? plotMaxX : plotMaxZ;
  const gateMin = Math.max(minCoord + 2.0, targetCenter - gateSpan / 2);
  const gateMax = Math.min(maxCoord - 2.0, targetCenter + gateSpan / 2);
  const actualGateWidth = gateMax - gateMin;
  const gateCenter = (gateMin + gateMax) / 2;

  // Build Front Boundary Wall Left and Right Flanks, Driveway Apron, and Entrance Gate
  if (facing === 'North') {
    const leftW = gateMin - plotMinX;
    const rightW = plotMaxX - gateMax;
    addWallSegment(leftW, boundaryThick, plotMinX + leftW / 2, plotMinZ);
    addWallSegment(rightW, boundaryThick, gateMax + rightW / 2, plotMinZ);
    addPillar(gateMin, plotMinZ);
    addPillar(gateMax, plotMinZ);
    buildModernGateAssembly(houseGroup, gateCenter, plotMinZ, actualGateWidth, boundaryH, facing);
    buildDrivewayRamp(houseGroup, gateCenter, plotMinZ, actualGateWidth, facing);
  } else if (facing === 'South') {
    const leftW = gateMin - plotMinX;
    const rightW = plotMaxX - gateMax;
    addWallSegment(leftW, boundaryThick, plotMinX + leftW / 2, plotMaxZ);
    addWallSegment(rightW, boundaryThick, gateMax + rightW / 2, plotMaxZ);
    addPillar(gateMin, plotMaxZ);
    addPillar(gateMax, plotMaxZ);
    buildModernGateAssembly(houseGroup, gateCenter, plotMaxZ, actualGateWidth, boundaryH, facing);
    buildDrivewayRamp(houseGroup, gateCenter, plotMaxZ, actualGateWidth, facing);
  } else if (facing === 'East') {
    const topW = gateMin - plotMinZ;
    const botW = plotMaxZ - gateMax;
    addWallSegment(boundaryThick, topW, plotMaxX, plotMinZ + topW / 2);
    addWallSegment(boundaryThick, botW, plotMaxX, gateMax + botW / 2);
    addPillar(plotMaxX, gateMin);
    addPillar(plotMaxX, gateMax);
    buildModernGateAssembly(houseGroup, plotMaxX, gateCenter, actualGateWidth, boundaryH, facing);
    buildDrivewayRamp(houseGroup, plotMaxX, gateCenter, actualGateWidth, facing);
  } else {
    const topW = gateMin - plotMinZ;
    const botW = plotMaxZ - gateMax;
    addWallSegment(boundaryThick, topW, plotMinX, plotMinZ + topW / 2);
    addWallSegment(boundaryThick, botW, plotMinX, gateMax + botW / 2);
    addPillar(plotMinX, gateMin);
    addPillar(plotMinX, gateMax);
    buildModernGateAssembly(houseGroup, plotMinX, gateCenter, actualGateWidth, boundaryH, facing);
    buildDrivewayRamp(houseGroup, plotMinX, gateCenter, actualGateWidth, facing);
  }
}

/**
 * Builds a paved concrete driveway apron / ramp connecting the road to the parking gate
 */
function buildDrivewayRamp(
  parent: THREE.Group,
  posX: number,
  posZ: number,
  gateWidth: number,
  facingOrAngle: string | number,
  normal?: { x: number; z: number }
) {
  const rampDepth = 3.5;
  const rampMat = new THREE.MeshStandardMaterial({
    color: '#64748B', // Concrete paver apron
    roughness: 0.7,
  });

  if (typeof facingOrAngle === 'number') {
    const rampGeo = new THREE.BoxGeometry(gateWidth - 0.2, 0.15, rampDepth);
    const ramp = new THREE.Mesh(rampGeo, rampMat);
    ramp.receiveShadow = true;
    const nx = normal ? normal.x : 0;
    const nz = normal ? normal.z : 1;
    ramp.position.set(posX + nx * (rampDepth / 2), -0.2, posZ + nz * (rampDepth / 2));
    ramp.rotation.y = facingOrAngle;
    parent.add(ramp);
    return;
  }

  const facing = facingOrAngle;
  const isNS = facing === 'North' || facing === 'South';
  const rampGeo = isNS
    ? new THREE.BoxGeometry(gateWidth - 0.2, 0.15, rampDepth)
    : new THREE.BoxGeometry(rampDepth, 0.15, gateWidth - 0.2);

  const ramp = new THREE.Mesh(rampGeo, rampMat);
  ramp.receiveShadow = true;

  if (facing === 'North') {
    ramp.position.set(posX, -0.2, posZ - rampDepth / 2);
  } else if (facing === 'South') {
    ramp.position.set(posX, -0.2, posZ + rampDepth / 2);
  } else if (facing === 'East') {
    ramp.position.set(posX + rampDepth / 2, -0.2, posZ);
  } else {
    ramp.position.set(posX - rampDepth / 2, -0.2, posZ);
  }

  parent.add(ramp);
}

/**
 * Builds 3D Architectural Double-Leaf & Pedestrian Compound Gate with Horizontal Teak Slats & Steel Frame
 */
function buildModernGateAssembly(
  parent: THREE.Group,
  centerCoordX: number,
  centerCoordZ: number,
  gateWidth: number,
  gateHeight: number,
  facingOrAngle: string | number
) {
  const gateGroup = new THREE.Group();

  // Ground Stainless Steel Rail Track
  const railMat = new THREE.MeshStandardMaterial({ color: '#64748B', roughness: 0.2, metalness: 0.9 });
  const railGeo = new THREE.BoxGeometry(gateWidth + 0.6, 0.04, 0.2);
  const rail = new THREE.Mesh(railGeo, railMat);
  rail.position.set(0, 0.02, 0);
  rail.receiveShadow = true;
  gateGroup.add(rail);

  // Divide opening into Main Vehicle Gate (70%) and Pedestrian Wicket Gate (30%)
  const hasPedestrianGate = gateWidth >= 7.5;
  const mainGateW = hasPedestrianGate ? gateWidth * 0.72 : gateWidth * 0.96;
  const pedGateW = hasPedestrianGate ? gateWidth * 0.24 : 0;

  // A. Main Driveway Gate Leaf (Vehicular entrance to parking)
  const mainGate = buildGateLeaf(mainGateW, gateHeight * 0.9);
  if (hasPedestrianGate) {
    mainGate.position.set(-gateWidth / 2 + mainGateW / 2 + 0.1, 0, 0);
  } else {
    mainGate.position.set(0, 0, 0);
  }
  gateGroup.add(mainGate);

  // Motorized Gate Operator Housing
  const motorMat = new THREE.MeshStandardMaterial({ color: '#1E293B', roughness: 0.3, metalness: 0.7 });
  const motorBox = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.8, 0.4), motorMat);
  motorBox.position.set(-gateWidth / 2 + 0.35, 0.4, 0.3);
  gateGroup.add(motorBox);

  // B. Pedestrian Wicket Gate (Positioned next to the driveway gate)
  if (hasPedestrianGate && pedGateW > 1.4) {
    const pedGate = buildGateLeaf(pedGateW, gateHeight * 0.9, true);
    pedGate.position.set(gateWidth / 2 - pedGateW / 2 - 0.1, 0, 0);
    gateGroup.add(pedGate);

    // Dividing Steel Center Post
    const divMat = new THREE.MeshStandardMaterial({ color: '#1E293B', roughness: 0.3, metalness: 0.6 });
    const divPost = new THREE.Mesh(new THREE.BoxGeometry(0.2, gateHeight * 0.95, 0.2), divMat);
    divPost.position.set(-gateWidth / 2 + mainGateW + 0.2, (gateHeight * 0.95) / 2, 0);
    divPost.castShadow = true;
    gateGroup.add(divPost);
  }

  // Positioning the assembly along the frontage
  gateGroup.position.set(centerCoordX, 0, centerCoordZ);

  if (typeof facingOrAngle === 'number') {
    gateGroup.rotation.y = facingOrAngle;
  } else {
    const facing = facingOrAngle;
    if (facing === 'North') {
      gateGroup.rotation.y = 0;
    } else if (facing === 'South') {
      gateGroup.rotation.y = Math.PI;
    } else if (facing === 'East') {
      gateGroup.rotation.y = Math.PI / 2;
    } else {
      gateGroup.rotation.y = -Math.PI / 2;
    }
  }

  parent.add(gateGroup);
}

/**
 * Builds a single modern architectural gate leaf with steel tube frame, horizontal teak slats & vertical pull handle
 */
function buildGateLeaf(width: number, height: number, isPedestrian: boolean = false): THREE.Group {
  const leaf = new THREE.Group();

  const frameThick = 0.12;
  const frameMat = new THREE.MeshStandardMaterial({ color: '#0F172A', roughness: 0.3, metalness: 0.8 });
  const woodMat = new THREE.MeshStandardMaterial({ color: '#78350F', roughness: 0.35 });
  const metalSlatMat = new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.3, metalness: 0.6 });
  const handleMat = new THREE.MeshStandardMaterial({ color: '#E2E8F0', roughness: 0.2, metalness: 0.9 });

  // Outer Border Box
  const pL = new THREE.Mesh(new THREE.BoxGeometry(frameThick, height, frameThick), frameMat);
  pL.position.set(-width / 2 + frameThick / 2, height / 2, 0);
  const pR = new THREE.Mesh(new THREE.BoxGeometry(frameThick, height, frameThick), frameMat);
  pR.position.set(width / 2 - frameThick / 2, height / 2, 0);
  const pT = new THREE.Mesh(new THREE.BoxGeometry(width, frameThick, frameThick), frameMat);
  pT.position.set(0, height - frameThick / 2, 0);
  const pB = new THREE.Mesh(new THREE.BoxGeometry(width, 0.4, frameThick), frameMat);
  pB.position.set(0, 0.2, 0);

  leaf.add(pL, pR, pT, pB);

  // Horizontal Slat Infill (Alternating Warm Teak & Charcoal Steel Slats)
  const slatHeight = 0.12;
  const slatGap = 0.08;
  const startY = 0.48;
  const endY = height - frameThick - 0.05;

  let slatIdx = 0;
  for (let y = startY; y < endY; y += slatHeight + slatGap) {
    const isWood = slatIdx % 2 === 0;
    const slat = new THREE.Mesh(
      new THREE.BoxGeometry(width - frameThick * 2 - 0.02, slatHeight, 0.035),
      isWood ? woodMat : metalSlatMat
    );
    slat.position.set(0, y + slatHeight / 2, 0);
    slat.castShadow = true;
    leaf.add(slat);
    slatIdx++;
  }

  // Modern Long Vertical Stainless Steel Pull Handle
  const handleGeo = new THREE.BoxGeometry(0.04, isPedestrian ? 0.9 : 1.4, 0.08);
  const handle = new THREE.Mesh(handleGeo, handleMat);
  handle.position.set(isPedestrian ? width / 2 - 0.22 : width / 2 - 0.35, height * 0.5, 0.06);
  leaf.add(handle);

  return leaf;
}

/**
 * Builds Parking / Carport space with architectural canopy, steel columns & a strictly contained modern 3D car model!
 */
function buildParkingRoom(
  parent: THREE.Group,
  posX: number,
  posZ: number,
  width: number,
  height: number,
  wallHeight: number,
  facing: string = 'South'
) {
  const colMat = new THREE.MeshStandardMaterial({ color: '#1E293B', roughness: 0.3, metalness: 0.4 });
  const colWidth = 0.45;

  // Front corner column placement based on facing direction
  let c1x = posX - width / 2 + colWidth / 2 + 0.1;
  let c1z = posZ + height / 2 - colWidth / 2 - 0.1;
  let c2x = posX + width / 2 - colWidth / 2 - 0.1;
  let c2z = posZ + height / 2 - colWidth / 2 - 0.1;

  if (facing === 'North') {
    c1z = posZ - height / 2 + colWidth / 2 + 0.1;
    c2z = posZ - height / 2 + colWidth / 2 + 0.1;
  } else if (facing === 'East') {
    c1x = posX + width / 2 - colWidth / 2 - 0.1;
    c1z = posZ - height / 2 + colWidth / 2 + 0.1;
    c2x = posX + width / 2 - colWidth / 2 - 0.1;
    c2z = posZ + height / 2 - colWidth / 2 - 0.1;
  } else if (facing === 'West') {
    c1x = posX - width / 2 + colWidth / 2 + 0.1;
    c1z = posZ - height / 2 + colWidth / 2 + 0.1;
    c2x = posX - width / 2 + colWidth / 2 + 0.1;
    c2z = posZ + height / 2 - colWidth / 2 - 0.1;
  }

  const col1 = new THREE.Mesh(new THREE.BoxGeometry(colWidth, wallHeight, colWidth), colMat);
  col1.position.set(c1x, wallHeight / 2, c1z);
  col1.castShadow = true;
  parent.add(col1);

  const col2 = new THREE.Mesh(new THREE.BoxGeometry(colWidth, wallHeight, colWidth), colMat);
  col2.position.set(c2x, wallHeight / 2, c2z);
  col2.castShadow = true;
  parent.add(col2);

  // Modern Cantilever Carport Canopy Roof with fascia trim
  const canopyMat = new THREE.MeshStandardMaterial({ color: '#1E293B', roughness: 0.35 });
  const canopy = new THREE.Mesh(new THREE.BoxGeometry(width, 0.4, height), canopyMat);
  canopy.position.set(posX, wallHeight + 0.2, posZ);
  canopy.castShadow = true;
  parent.add(canopy);

  // Parking Space White Stripe Marking
  const stripeMat = new THREE.MeshStandardMaterial({ color: '#F8FAFC', roughness: 0.4 });
  const isNS = facing === 'North' || facing === 'South';

  if (isNS) {
    const sLeft = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.02, height * 0.7), stripeMat);
    sLeft.position.set(posX - width / 2 + 0.8, 0.08, posZ);
    const sRight = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.02, height * 0.7), stripeMat);
    sRight.position.set(posX + width / 2 - 0.8, 0.08, posZ);
    parent.add(sLeft, sRight);
  } else {
    const sTop = new THREE.Mesh(new THREE.BoxGeometry(width * 0.7, 0.02, 0.18), stripeMat);
    sTop.position.set(posX, 0.08, posZ - height / 2 + 0.8);
    const sBot = new THREE.Mesh(new THREE.BoxGeometry(width * 0.7, 0.02, 0.18), stripeMat);
    sBot.position.set(posX, 0.08, posZ + height / 2 - 0.8);
    parent.add(sTop, sBot);
  }

  // Stylized Architectural 3D Modern Car in Parking Bay - Strictly Contained within bounds!
  buildModernArchitecturalCar(parent, posX, posZ, width, height, facing);
}

/**
 * Builds a beautifully proportioned modern sedan/crossover car that fits strictly inside the parking bay without clipping or protruding out
 */
function buildModernArchitecturalCar(
  parent: THREE.Group,
  x: number,
  z: number,
  roomW: number,
  roomH: number,
  facing: string = 'South'
) {
  const carGroup = new THREE.Group();

  const isNS = facing === 'North' || facing === 'South';
  const bayLateral = isNS ? roomW : roomH;
  const bayLongitudinal = isNS ? roomH : roomW;

  // Guaranteed safe margins (at least 1.4 ft clearance lateral and 1.8 ft clearance longitudinal)
  const maxSafeW = Math.max(2.6, bayLateral * 0.46);
  const maxSafeL = Math.max(4.6, bayLongitudinal * 0.56);
  const carW = Math.min(maxSafeW, 3.6);
  const carL = Math.min(maxSafeL, 6.4);
  const carH = carW * 0.38;

  const bodyMat = new THREE.MeshStandardMaterial({
    color: '#0284C7', // Metallic sapphire blue
    metalness: 0.85,
    roughness: 0.2,
  });

  const bodyAccentMat = new THREE.MeshStandardMaterial({
    color: '#0F172A',
    roughness: 0.4,
  });

  const glassMat = new THREE.MeshStandardMaterial({
    color: '#090D16',
    metalness: 0.9,
    roughness: 0.1,
  });

  const tireMat = new THREE.MeshStandardMaterial({
    color: '#1E293B',
    roughness: 0.85,
  });

  const rimMat = new THREE.MeshStandardMaterial({
    color: '#E2E8F0',
    metalness: 0.9,
    roughness: 0.15,
  });

  // 1. Lower chassis body
  const chassisGeo = new THREE.BoxGeometry(carW, carH * 0.75, carL);
  const chassis = new THREE.Mesh(chassisGeo, bodyMat);
  chassis.position.set(0, carH * 0.65, 0);
  chassis.castShadow = true;
  carGroup.add(chassis);

  // Front bumper / splitter
  const bumperGeo = new THREE.BoxGeometry(carW * 0.96, carH * 0.35, carL * 0.12);
  const bumper = new THREE.Mesh(bumperGeo, bodyAccentMat);
  bumper.position.set(0, carH * 0.3, carL * 0.48);
  carGroup.add(bumper);

  // 2. Cabin / Greenhouse (Aerodynamic taper)
  const cabinW = carW * 0.88;
  const cabinL = carL * 0.55;
  const cabinH = carH * 0.85;
  const cabinGeo = new THREE.BoxGeometry(cabinW, cabinH, cabinL);
  const cabin = new THREE.Mesh(cabinGeo, glassMat);
  cabin.position.set(0, carH * 0.65 + cabinH * 0.65, -carL * 0.05);
  cabin.castShadow = true;
  carGroup.add(cabin);

  // Roof cap
  const roofGeo = new THREE.BoxGeometry(cabinW * 0.96, 0.1, cabinL * 0.85);
  const roof = new THREE.Mesh(roofGeo, bodyMat);
  roof.position.set(0, carH * 0.65 + cabinH * 1.15 + 0.05, -carL * 0.05);
  carGroup.add(roof);

  // 3. LED Headlights (Front is +Z in local car space)
  const headlightMat = new THREE.MeshStandardMaterial({
    color: '#FEF08A',
    emissive: '#FEF08A',
    emissiveIntensity: 1.0,
  });
  const hW = carW * 0.22;
  const hH = carH * 0.2;
  const hL = new THREE.Mesh(new THREE.BoxGeometry(hW, hH, 0.15), headlightMat);
  hL.position.set(-carW * 0.36, carH * 0.75, carL / 2 + 0.02);
  const hR = new THREE.Mesh(new THREE.BoxGeometry(hW, hH, 0.15), headlightMat);
  hR.position.set(carW * 0.36, carH * 0.75, carL / 2 + 0.02);
  carGroup.add(hL, hR);

  // LED Rear Taillight Bar (Rear is -Z in local car space)
  const taillightMat = new THREE.MeshStandardMaterial({
    color: '#EF4444',
    emissive: '#EF4444',
    emissiveIntensity: 0.9,
  });
  const tBar = new THREE.Mesh(new THREE.BoxGeometry(carW * 0.88, carH * 0.15, 0.12), taillightMat);
  tBar.position.set(0, carH * 0.8, -carL / 2 - 0.02);
  carGroup.add(tBar);

  // 4. Side Mirrors
  const mirrorGeo = new THREE.BoxGeometry(carW * 0.14, carH * 0.2, carL * 0.08);
  const mirL = new THREE.Mesh(mirrorGeo, bodyMat);
  mirL.position.set(-carW / 2 - carW * 0.07, carH * 1.1, carL * 0.12);
  const mirR = new THREE.Mesh(mirrorGeo, bodyMat);
  mirR.position.set(carW / 2 + carW * 0.07, carH * 1.1, carL * 0.12);
  carGroup.add(mirL, mirR);

  // 5. 4 Wheels (Tire + 5-spoke Alloy Rim)
  const wheelRadius = carH * 0.42;
  const wheelWidth = carW * 0.16;
  const tireGeo = new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelWidth, 16);
  const rimGeo = new THREE.CylinderGeometry(wheelRadius * 0.6, wheelRadius * 0.6, wheelWidth + 0.02, 12);

  const wheelOffsetX = carW / 2;
  const wheelOffsetZ = carL * 0.32;
  const wheelPosY = wheelRadius;

  const wheelPositions = [
    [-wheelOffsetX, wheelPosY, wheelOffsetZ],
    [wheelOffsetX, wheelPosY, wheelOffsetZ],
    [-wheelOffsetX, wheelPosY, -wheelOffsetZ],
    [wheelOffsetX, wheelPosY, -wheelOffsetZ],
  ];

  wheelPositions.forEach(([wx, wy, wz]) => {
    const tire = new THREE.Mesh(tireGeo, tireMat);
    tire.rotation.z = Math.PI / 2;
    tire.position.set(wx, wy, wz);
    tire.castShadow = true;

    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.rotation.z = Math.PI / 2;
    rim.position.set(wx, wy, wz);

    carGroup.add(tire, rim);
  });

  // Rotation towards street based on facing direction
  if (facing === 'North') {
    carGroup.rotation.y = Math.PI; // Face North (-Z)
  } else if (facing === 'South') {
    carGroup.rotation.y = 0; // Face South (+Z)
  } else if (facing === 'East') {
    carGroup.rotation.y = -Math.PI / 2; // Face East (+X)
  } else {
    carGroup.rotation.y = Math.PI / 2; // Face West (-X)
  }

  carGroup.position.set(x, 0.15, z);
  parent.add(carGroup);
}

/**
 * Builds Balcony with Tempered Glass Railing & Stainless Handrail
 */
function buildBalconyRoom(
  parent: THREE.Group,
  posX: number,
  posZ: number,
  width: number,
  height: number,
  yElevation: number,
  glassRailMat: THREE.Material
) {
  const railingH = 3.5;
  const railMat = new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.3, metalness: 0.6 });

  // Cantilever Balcony Slab
  const slabMat = new THREE.MeshStandardMaterial({ color: '#E2E8F0', roughness: 0.4 });
  const slab = new THREE.Mesh(new THREE.BoxGeometry(width, 0.4, height), slabMat);
  slab.position.set(posX, yElevation - 0.2, posZ);
  slab.castShadow = true;
  parent.add(slab);

  // Glass Railing Panels
  const glassGeoN = new THREE.BoxGeometry(width - 0.2, railingH - 0.4, 0.08);
  const railN = new THREE.Mesh(glassGeoN, glassRailMat);
  railN.position.set(posX, yElevation + railingH / 2, posZ - height / 2 + 0.1);
  parent.add(railN);

  // Top Stainless Steel Handrail
  const handrailGeo = new THREE.BoxGeometry(width, 0.18, 0.18);
  const handrail = new THREE.Mesh(handrailGeo, railMat);
  handrail.position.set(posX, yElevation + railingH, posZ - height / 2 + 0.1);
  parent.add(handrail);

  // Corner Posts
  const postGeo = new THREE.BoxGeometry(0.2, railingH, 0.2);
  const postL = new THREE.Mesh(postGeo, railMat);
  postL.position.set(posX - width / 2 + 0.1, yElevation + railingH / 2, posZ - height / 2 + 0.1);
  const postR = new THREE.Mesh(postGeo, railMat);
  postR.position.set(posX + width / 2 - 0.1, yElevation + railingH / 2, posZ - height / 2 + 0.1);
  parent.add(postL, postR);
}

/**
 * Builds 3D Staircase steps with Tread/Riser and Hardwood Caps
 */
function buildStaircase(
  parent: THREE.Group,
  posX: number,
  posZ: number,
  width: number,
  height: number,
  wallHeight: number,
  yElevation: number
) {
  const numSteps = 12;
  const stepHeight = wallHeight / numSteps;
  const stepDepth = height / numSteps;
  const stepMat = new THREE.MeshStandardMaterial({ color: '#CBD5E1', roughness: 0.4 });
  const treadMat = new THREE.MeshStandardMaterial({ color: '#78350F', roughness: 0.35 });

  for (let i = 0; i < numSteps; i++) {
    // Step Riser
    const stepGeo = new THREE.BoxGeometry(width * 0.85, stepHeight, stepDepth);
    const stepMesh = new THREE.Mesh(stepGeo, stepMat);
    stepMesh.position.set(
      posX,
      yElevation + i * stepHeight + stepHeight / 2,
      posZ - height / 2 + i * stepDepth + stepDepth / 2
    );
    stepMesh.castShadow = true;
    parent.add(stepMesh);

    // Hardwood Tread Cap
    const treadGeo = new THREE.BoxGeometry(width * 0.88, 0.08, stepDepth + 0.1);
    const treadMesh = new THREE.Mesh(treadGeo, treadMat);
    treadMesh.position.set(
      posX,
      yElevation + (i + 1) * stepHeight + 0.04,
      posZ - height / 2 + i * stepDepth + stepDepth / 2
    );
    treadMesh.castShadow = true;
    parent.add(treadMesh);
  }
}

/**
 * Builds Main Entrance Porch Canopy, Modern Slat Wood Accent Wall, Steps, and Sconces
 */
function buildMainEntrancePorch(
  parent: THREE.Group,
  layoutData: LayoutData,
  landW: number,
  landH: number,
  wallHeight: number,
  timberMat: THREE.Material,
  slateMat: THREE.Material
) {
  const ent = layoutData.entrance;
  if (!ent) return;

  const facing = layoutData.facingDirection || 'South';
  const isNS = facing === 'North' || facing === 'South';
  const entWidth = Math.max(3.5, ent.width || 4.0);

  // Position of entrance door center in 3D
  const doorX = ent.x + (ent.width || 4.0) / 2 - landW / 2;
  const doorZ = ent.y - landH / 2;

  const porchMat = new THREE.MeshStandardMaterial({ color: '#1E293B', roughness: 0.35, metalness: 0.2 });
  const pathMat = new THREE.MeshStandardMaterial({ color: '#CBD5E1', roughness: 0.65 });
  const frontDoorMat = new THREE.MeshStandardMaterial({ color: '#78350F', roughness: 0.3 });
  const handleMat = new THREE.MeshStandardMaterial({ color: '#E2E8F0', roughness: 0.2, metalness: 0.8 });

  let canopyX = doorX;
  let canopyZ = doorZ;
  let pathStartX = doorX;
  let pathStartZ = doorZ;
  let pathEndX = doorX;
  let pathEndZ = doorZ;

  // Subtle flush entrance details that don't protrude outside plot boundaries
  let canopySize: [number, number, number] = [entWidth + 1.0, 0.25, 0.8];
  let step1Size: [number, number, number] = [entWidth + 0.6, 0.15, 0.6];
  let step2Size: [number, number, number] = [entWidth + 1.0, 0.15, 1.2];

  if (facing === 'North') {
    canopyZ = doorZ - 0.4;
    pathStartX = doorX;
    pathStartZ = -landH / 2;
    pathEndX = doorX;
    pathEndZ = doorZ;
  } else if (facing === 'South') {
    canopyZ = doorZ + 0.4;
    pathStartX = doorX;
    pathStartZ = landH / 2;
    pathEndX = doorX;
    pathEndZ = doorZ;
  } else if (facing === 'East') {
    canopyX = doorX + 0.4;
    pathStartX = landW / 2;
    pathStartZ = doorZ;
    pathEndX = doorX;
    pathEndZ = doorZ;
    canopySize = [0.8, 0.25, entWidth + 1.0];
    step1Size = [0.6, 0.15, entWidth + 0.6];
    step2Size = [1.2, 0.15, entWidth + 1.0];
  } else if (facing === 'West') {
    canopyX = doorX - 0.4;
    pathStartX = -landW / 2;
    pathStartZ = doorZ;
    pathEndX = doorX;
    pathEndZ = doorZ;
    canopySize = [0.8, 0.25, entWidth + 1.0];
    step1Size = [0.6, 0.15, entWidth + 0.6];
    step2Size = [1.2, 0.15, entWidth + 1.0];
  }

  // 1. Entrance Canopy with Recessed Underside Downlight
  const canopy = new THREE.Mesh(new THREE.BoxGeometry(...canopySize), porchMat);
  canopy.position.set(canopyX, wallHeight + 0.15, canopyZ);
  canopy.castShadow = true;
  parent.add(canopy);

  // Recessed Canopy Spotlight
  const porchLight = new THREE.PointLight(0xFFFBEB, 1.2, 12);
  porchLight.position.set(canopyX, wallHeight - 0.3, canopyZ);
  parent.add(porchLight);

  // 2. Multi-tier Entrance Steps
  const step2 = new THREE.Mesh(new THREE.BoxGeometry(...step2Size), pathMat);
  step2.position.set(canopyX, 0.075, canopyZ);
  step2.receiveShadow = true;
  parent.add(step2);

  const step1 = new THREE.Mesh(new THREE.BoxGeometry(...step1Size), pathMat);
  step1.position.set(canopyX, 0.225, canopyZ);
  step1.receiveShadow = true;
  parent.add(step1);

  // 3. Authentic Porch Structural Columns (connecting porch step -> column -> canopy)
  const porchColMat = new THREE.MeshStandardMaterial({ color: '#1E293B', roughness: 0.35, metalness: 0.2 });
  const colRadius = 0.16;
  const colHeight = wallHeight + 0.15 - 0.225; // From top of step1 (0.225) to underside of canopy (wallHeight + 0.025)
  const colGeo = new THREE.CylinderGeometry(colRadius, colRadius, colHeight, 16);

  let col1X = canopyX;
  let col1Z = canopyZ;
  let col2X = canopyX;
  let col2Z = canopyZ;

  if (facing === 'South') {
    col1X = canopyX - (canopySize[0] / 2 - 0.35);
    col1Z = canopyZ + (canopySize[2] / 2 - 0.25);
    col2X = canopyX + (canopySize[0] / 2 - 0.35);
    col2Z = canopyZ + (canopySize[2] / 2 - 0.25);
  } else if (facing === 'North') {
    col1X = canopyX - (canopySize[0] / 2 - 0.35);
    col1Z = canopyZ - (canopySize[2] / 2 - 0.25);
    col2X = canopyX + (canopySize[0] / 2 - 0.35);
    col2Z = canopyZ - (canopySize[2] / 2 - 0.25);
  } else if (facing === 'East') {
    col1X = canopyX + (canopySize[0] / 2 - 0.25);
    col1Z = canopyZ - (canopySize[2] / 2 - 0.35);
    col2X = canopyX + (canopySize[0] / 2 - 0.25);
    col2Z = canopyZ + (canopySize[2] / 2 - 0.35);
  } else if (facing === 'West') {
    col1X = canopyX - (canopySize[0] / 2 - 0.25);
    col1Z = canopyZ - (canopySize[2] / 2 - 0.35);
    col2X = canopyX - (canopySize[0] / 2 - 0.25);
    col2Z = canopyZ + (canopySize[2] / 2 - 0.35);
  }

  const pCol1 = new THREE.Mesh(colGeo, porchColMat);
  pCol1.position.set(col1X, 0.225 + colHeight / 2, col1Z);
  pCol1.castShadow = true;
  pCol1.receiveShadow = true;

  const pCol2 = new THREE.Mesh(colGeo, porchColMat);
  pCol2.position.set(col2X, 0.225 + colHeight / 2, col2Z);
  pCol2.castShadow = true;
  pCol2.receiveShadow = true;

  parent.add(pCol1, pCol2);

  // 4. Exterior Façade Sconce Lights beside Door
  const sconceMat = new THREE.MeshStandardMaterial({ color: '#1E293B', metalness: 0.8 });
  const sconceBulbMat = new THREE.MeshStandardMaterial({ color: '#FEF08A', emissive: '#FEF08A', emissiveIntensity: 1.0 });

  const s1X = isNS ? doorX - entWidth * 0.55 : doorX + (facing === 'East' ? 0.18 : -0.18);
  const s1Z = isNS ? doorZ + (facing === 'South' ? 0.18 : -0.18) : doorZ - entWidth * 0.55;
  const sconce1 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.8, 0.2), sconceMat);
  sconce1.position.set(s1X, 5.0, s1Z);
  const sconceBulb1 = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.3, 8), sconceBulbMat);
  sconceBulb1.position.set(s1X, 5.0, s1Z);
  parent.add(sconce1, sconceBulb1);

  // 5. Main Entrance Mention in 3D: High-visibility 3D Marker Badge, Architectural Plaque & Doormat
  // A. Floating 3D Camera-facing Billboard Badge
  const badgeTex = createMainEntranceBadgeTexture();
  const spriteMat = new THREE.SpriteMaterial({
    map: badgeTex,
    transparent: true,
    depthTest: false,
  });
  const entranceSprite = new THREE.Sprite(spriteMat);
  entranceSprite.position.set(canopyX, wallHeight + 2.8, canopyZ);
  entranceSprite.scale.set(6.2, 2.0, 1.0);
  parent.add(entranceSprite);

  // B. Physical 3D Wall Plaque Sign on Canopy Front Facing
  const plaqueTex = createMainEntrancePlaqueTexture();
  const plaqueMat = new THREE.MeshStandardMaterial({
    map: plaqueTex,
    roughness: 0.35,
    metalness: 0.2,
  });

  const plaqueW = Math.min(3.8, entWidth + 0.4);
  const plaqueH = 0.8;
  const plaqueD = 0.08;
  const plaqueGeo = isNS
    ? new THREE.BoxGeometry(plaqueW, plaqueH, plaqueD)
    : new THREE.BoxGeometry(plaqueD, plaqueH, plaqueW);
  const plaqueMesh = new THREE.Mesh(plaqueGeo, plaqueMat);

  let plaquePosX = canopyX;
  let plaquePosZ = canopyZ;
  let plaqueRotY = 0;

  if (facing === 'North') {
    plaquePosZ = canopyZ - canopySize[2] / 2 - 0.05;
    plaqueRotY = Math.PI;
  } else if (facing === 'South') {
    plaquePosZ = canopyZ + canopySize[2] / 2 + 0.05;
    plaqueRotY = 0;
  } else if (facing === 'East') {
    plaquePosX = canopyX + canopySize[0] / 2 + 0.05;
    plaqueRotY = Math.PI / 2;
  } else {
    plaquePosX = canopyX - canopySize[0] / 2 - 0.05;
    plaqueRotY = -Math.PI / 2;
  }

  plaqueMesh.position.set(plaquePosX, wallHeight + 0.2, plaquePosZ);
  plaqueMesh.rotation.y = plaqueRotY;
  plaqueMesh.castShadow = true;
  parent.add(plaqueMesh);

  // C. Entrance Doormat on Top Landing Step
  const doormatTex = createEntranceDoormatTexture();
  const doormatMat = new THREE.MeshStandardMaterial({
    map: doormatTex,
    roughness: 0.85,
  });
  const doormatW = Math.min(3.2, entWidth * 0.8);
  const doormatD = 1.6;
  const doormatGeo = isNS
    ? new THREE.BoxGeometry(doormatW, 0.04, doormatD)
    : new THREE.BoxGeometry(doormatD, 0.04, doormatW);
  const doormatMesh = new THREE.Mesh(doormatGeo, doormatMat);
  doormatMesh.position.set(canopyX, 0.32, canopyZ);
  if (!isNS) {
    doormatMesh.rotation.y = facing === 'East' ? Math.PI / 2 : -Math.PI / 2;
  }
  doormatMesh.receiveShadow = true;
  parent.add(doormatMesh);

  // 6. Pathway from Land Boundary to Front Step
  const pathLength = Math.sqrt(
    (pathEndX - pathStartX) * (pathEndX - pathStartX) + (pathEndZ - pathStartZ) * (pathEndZ - pathStartZ)
  );
  if (pathLength > 1.0) {
    const pathMidX = (pathStartX + pathEndX) / 2;
    const pathMidZ = (pathStartZ + pathEndZ) / 2;
    const pathGeo = isNS
      ? new THREE.BoxGeometry(entWidth + 0.8, 0.04, pathLength)
      : new THREE.BoxGeometry(pathLength, 0.04, entWidth + 0.8);
    const pathMesh = new THREE.Mesh(pathGeo, pathMat);
    pathMesh.position.set(pathMidX, 0.02, pathMidZ);
    pathMesh.receiveShadow = true;
    parent.add(pathMesh);
  }
}

/**
 * Builds Detailed 3D Interior Furniture for rooms
 */
function buildDetailedRoomFurniture(
  parent: THREE.Group,
  room: RoomPlacement,
  posX: number,
  posZ: number,
  yElevation: number,
  roomType: string
) {
  const g = new THREE.Group();

  const woodMat = new THREE.MeshStandardMaterial({ color: '#78350F', roughness: 0.35 });
  const fabricMat = new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.6 });
  const whiteMat = new THREE.MeshStandardMaterial({ color: '#F8FAFC', roughness: 0.25 });
  const metalMat = new THREE.MeshStandardMaterial({ color: '#94A3B8', roughness: 0.2, metalness: 0.7 });
  const darkStoneMat = new THREE.MeshStandardMaterial({ color: '#1E293B', roughness: 0.3 });
  const rugMat = new THREE.MeshStandardMaterial({ color: '#E2E8F0', roughness: 0.9 });

  if (roomType === 'bedroom') {
    // Bed Frame
    const bedW = Math.min(room.width - 2, 6.0);
    const bedL = Math.min(room.height - 2, 6.5);
    const bedFrame = new THREE.Mesh(new THREE.BoxGeometry(bedW, 0.8, bedL), woodMat);
    bedFrame.position.set(posX, yElevation + 0.4, posZ);
    bedFrame.castShadow = true;
    g.add(bedFrame);

    // Mattress & Bed Sheets
    const mattress = new THREE.Mesh(new THREE.BoxGeometry(bedW - 0.2, 0.6, bedL - 0.2), whiteMat);
    mattress.position.set(posX, yElevation + 0.9, posZ);
    g.add(mattress);

    // Duvet / Quilt fold
    const quilt = new THREE.Mesh(new THREE.BoxGeometry(bedW - 0.22, 0.1, bedL * 0.55), fabricMat);
    quilt.position.set(posX, yElevation + 1.25, posZ + bedL * 0.2);
    g.add(quilt);

    // Headboard
    const headboard = new THREE.Mesh(new THREE.BoxGeometry(bedW, 2.4, 0.3), woodMat);
    headboard.position.set(posX, yElevation + 1.2, posZ - bedL / 2 + 0.15);
    g.add(headboard);

    // Pillows
    const p1 = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.25, 1.2), whiteMat);
    p1.position.set(posX - 1.2, yElevation + 1.3, posZ - bedL / 2 + 1.0);
    const p2 = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.25, 1.2), whiteMat);
    p2.position.set(posX + 1.2, yElevation + 1.3, posZ - bedL / 2 + 1.0);
    g.add(p1, p2);

    // Bedside Nightstands & Lamps
    const standMat = woodMat;
    const sL = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.2, 1.5), standMat);
    sL.position.set(posX - bedW / 2 - 1.0, yElevation + 0.6, posZ - bedL / 2 + 1.0);
    const sR = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.2, 1.5), standMat);
    sR.position.set(posX + bedW / 2 + 1.0, yElevation + 0.6, posZ - bedL / 2 + 1.0);
    g.add(sL, sR);
  } else if (roomType === 'living') {
    // Area Rug
    const rug = new THREE.Mesh(new THREE.BoxGeometry(Math.min(room.width - 2, 9.0), 0.02, Math.min(room.height - 2, 7.0)), rugMat);
    rug.position.set(posX, yElevation + 0.08, posZ);
    rug.receiveShadow = true;
    g.add(rug);

    // Sofa Lounge
    const sofaW = Math.min(room.width - 2, 7.5);
    const sofa = new THREE.Mesh(new THREE.BoxGeometry(sofaW, 1.2, 2.8), fabricMat);
    sofa.position.set(posX, yElevation + 0.6, posZ - 1.0);
    sofa.castShadow = true;
    g.add(sofa);

    // Coffee Table with marble top
    const table = new THREE.Mesh(new THREE.BoxGeometry(Math.min(room.width - 4, 4.0), 0.7, 2.0), whiteMat);
    table.position.set(posX, yElevation + 0.35, posZ + 1.5);
    table.castShadow = true;
    g.add(table);

    // TV Media Console Unit & Flat Screen on Wall
    const mediaW = Math.min(room.width - 2, 6.0);
    const consoleUnit = new THREE.Mesh(new THREE.BoxGeometry(mediaW, 0.9, 1.2), darkStoneMat);
    consoleUnit.position.set(posX, yElevation + 0.45, posZ + room.height / 2 - 0.8);
    consoleUnit.castShadow = true;

    const tvScreen = new THREE.Mesh(
      new THREE.BoxGeometry(mediaW * 0.8, 2.5, 0.1),
      new THREE.MeshStandardMaterial({ color: '#0F172A', roughness: 0.1, metalness: 0.8 })
    );
    tvScreen.position.set(posX, yElevation + 2.8, posZ + room.height / 2 - 0.4);
    g.add(consoleUnit, tvScreen);
  } else if (roomType === 'dining') {
    // Dining Table
    const tableW = Math.min(room.width - 2, 5.8);
    const tableL = Math.min(room.height - 2, 3.4);
    const table = new THREE.Mesh(new THREE.BoxGeometry(tableW, 1.3, tableL), woodMat);
    table.position.set(posX, yElevation + 0.65, posZ);
    table.castShadow = true;
    g.add(table);

    // Dining Chairs
    const chairMat = fabricMat;
    const c1 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 1.2), chairMat);
    c1.position.set(posX - 1.5, yElevation + 0.6, posZ - 2.2);
    const c2 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 1.2), chairMat);
    c2.position.set(posX + 1.5, yElevation + 0.6, posZ - 2.2);
    const c3 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 1.2), chairMat);
    c3.position.set(posX - 1.5, yElevation + 0.6, posZ + 2.2);
    const c4 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 1.2), chairMat);
    c4.position.set(posX + 1.5, yElevation + 0.6, posZ + 2.2);
    g.add(c1, c2, c3, c4);
  } else if (roomType === 'kitchen') {
    // L-shaped Kitchen Countertop with Granite Top
    const cLen = Math.min(room.width - 1, 8.5);
    const counter = new THREE.Mesh(new THREE.BoxGeometry(cLen, 1.4, 2.2), darkStoneMat);
    counter.position.set(posX, yElevation + 0.7, posZ - room.height / 2 + 1.3);
    counter.castShadow = true;
    g.add(counter);

    // Stainless Steel Dual Bowl Sink & Faucet
    const sink = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.08, 1.4), metalMat);
    sink.position.set(posX - cLen / 4, yElevation + 1.44, posZ - room.height / 2 + 1.3);
    g.add(sink);

    // Induction Cooktop with burners
    const cooktop = new THREE.Mesh(
      new THREE.BoxGeometry(2.0, 0.05, 1.4),
      new THREE.MeshStandardMaterial({ color: '#0F172A', roughness: 0.1 })
    );
    cooktop.position.set(posX + cLen / 4, yElevation + 1.43, posZ - room.height / 2 + 1.3);
    g.add(cooktop);
  } else if (roomType === 'sanitary') {
    // Vanity Counter & Mirror
    const vanityW = Math.min(room.width - 1, 3.4);
    const vanity = new THREE.Mesh(new THREE.BoxGeometry(vanityW, 1.3, 1.8), whiteMat);
    vanity.position.set(posX, yElevation + 0.65, posZ - room.height / 2 + 1.1);
    vanity.castShadow = true;

    // Ceramic Vessel Sink
    const vesselSink = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.5, 0.4, 16), whiteMat);
    vesselSink.position.set(posX, yElevation + 1.5, posZ - room.height / 2 + 1.1);

    // Wall Mirror
    const mirror = new THREE.Mesh(
      new THREE.BoxGeometry(vanityW * 0.8, 2.0, 0.05),
      new THREE.MeshStandardMaterial({ color: '#E2E8F0', roughness: 0.05, metalness: 0.9 })
    );
    mirror.position.set(posX, yElevation + 3.0, posZ - room.height / 2 + 0.2);
    g.add(vanity, vesselSink, mirror);

    // WC Commode Toilet
    const wc = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.2, 1.8), whiteMat);
    wc.position.set(posX, yElevation + 0.6, posZ + room.height / 2 - 1.2);
    g.add(wc);
  }

  parent.add(g);
}

/**
 * Builds Procedural Low-Poly Architectural Trees & Landscaping along property setback spaces
 */
function buildLandscapingTrees(
  parent: THREE.Group,
  setbacks: SetbackBounds,
  minX: number,
  maxX: number,
  minZ: number,
  maxZ: number,
  polygonVertices?: PolygonVertex3D[],
  isPolygonPlot?: boolean
) {
  const treeMatTrunk = new THREE.MeshStandardMaterial({ color: '#78350F', roughness: 0.8 });
  const treeMatFoliage = new THREE.MeshStandardMaterial({ color: '#16A34A', roughness: 0.8 });
  const treeMatFoliageDark = new THREE.MeshStandardMaterial({ color: '#15803D', roughness: 0.8 });

  let treePositions: Array<[number, number]> = [];

  if (isPolygonPlot && polygonVertices && polygonVertices.length >= 3) {
    // Calculate centroid of polygon
    let cX = 0;
    let cZ = 0;
    polygonVertices.forEach((v) => {
      cX += v.x;
      cZ += v.z;
    });
    cX /= polygonVertices.length;
    cZ /= polygonVertices.length;

    // Offset each corner inward towards the centroid by 3.5 ft
    polygonVertices.forEach((v) => {
      const dx = cX - v.x;
      const dz = cZ - v.z;
      const dist = Math.hypot(dx, dz);
      if (dist > 4.0) {
        const tx = v.x + (dx / dist) * 3.5;
        const tz = v.z + (dz / dist) * 3.5;
        if (isPointInsidePolygon3D({ x: tx, z: tz }, polygonVertices)) {
          treePositions.push([tx, tz]);
        }
      }
    });
  } else {
    const { plotMinX, plotMaxX, plotMinZ, plotMaxZ } = setbacks;
    treePositions = [
      [plotMinX + 3.2, plotMinZ + 3.2],
      [plotMaxX - 3.2, plotMinZ + 3.2],
      [plotMinX + 3.2, plotMaxZ - 3.2],
      [plotMaxX - 3.2, plotMaxZ - 3.2],
    ];
  }

  treePositions.forEach(([tx, tz]) => {
    // Only place tree if it does not collide with building footprint or walls
    if (tx > minX - 2.5 && tx < maxX + 2.5 && tz > minZ - 2.5 && tz < maxZ + 2.5) {
      return;
    }

    const treeGroup = new THREE.Group();

    // Trunk
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.4, 3.5, 8), treeMatTrunk);
    trunk.position.set(0, 1.75, 0);
    trunk.castShadow = true;
    treeGroup.add(trunk);

    // Tier 1 Foliage (Lower broad cone)
    const fol1 = new THREE.Mesh(new THREE.ConeGeometry(2.2, 3.0, 7), treeMatFoliage);
    fol1.position.set(0, 4.0, 0);
    fol1.castShadow = true;
    treeGroup.add(fol1);

    // Tier 2 Foliage (Upper cone)
    const fol2 = new THREE.Mesh(new THREE.ConeGeometry(1.6, 2.5, 7), treeMatFoliageDark);
    fol2.position.set(0, 5.5, 0);
    fol2.castShadow = true;
    treeGroup.add(fol2);

    treeGroup.position.set(tx, 0, tz);
    parent.add(treeGroup);
  });
}
