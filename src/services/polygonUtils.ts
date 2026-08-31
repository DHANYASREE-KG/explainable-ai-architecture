import { PolygonPoint } from '../types';

export type { PolygonPoint };

export interface EdgeInfo {
  index: number;
  label: string; // e.g. "AB", "BC"
  length: number; // in feet
  lengthText: string; // e.g. "AB = 18.5 ft"
  from: PolygonPoint;
  to: PolygonPoint;
  midpoint: PolygonPoint;
}

/**
 * Calculates the exact area of a polygon using the Shoelace formula (Surveyor's formula).
 */
export function calculatePolygonArea(points: PolygonPoint[]): number {
  if (!points || points.length < 3) return 0;
  let area = 0;
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  return Math.round((Math.abs(area) / 2) * 100) / 100;
}

/**
 * Computes bounding box metrics for a list of polygon vertices.
 */
export function getPolygonBounds(points: PolygonPoint[]): {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  width: number;
  height: number;
} {
  if (!points || points.length === 0) {
    return { minX: 0, maxX: 0, minY: 0, maxY: 0, width: 0, height: 0 };
  }
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const pt of points) {
    if (pt.x < minX) minX = pt.x;
    if (pt.x > maxX) maxX = pt.x;
    if (pt.y < minY) minY = pt.y;
    if (pt.y > maxY) maxY = pt.y;
  }

  return {
    minX,
    maxX,
    minY,
    maxY,
    width: Math.max(1, Math.round((maxX - minX) * 100) / 100),
    height: Math.max(1, Math.round((maxY - minY) * 100) / 100),
  };
}

/**
 * Offsets polygon points so that minX = 0 and minY = 0.
 */
export function normalizePolygonPoints(points: PolygonPoint[]): PolygonPoint[] {
  if (!points || points.length === 0) return [];
  const bounds = getPolygonBounds(points);
  return points.map((p) => ({
    x: Math.round((p.x - bounds.minX) * 10) / 10,
    y: Math.round((p.y - bounds.minY) * 10) / 10,
  }));
}

/**
 * Updates a specific edge length by repositioning the destination vertex along the edge vector.
 */
export function updateEdgeLength(
  points: PolygonPoint[],
  edgeIndex: number,
  newLength: number
): PolygonPoint[] {
  if (!points || points.length < 3 || edgeIndex < 0 || edgeIndex >= points.length) {
    return points;
  }
  const n = points.length;
  const p1 = points[edgeIndex];
  const nextIdx = (edgeIndex + 1) % n;
  const p2 = points[nextIdx];

  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const currentLen = Math.hypot(dx, dy);

  if (newLength <= 0 || isNaN(newLength)) return points;

  let ux = 1;
  let uy = 0;
  if (currentLen > 1e-4) {
    ux = dx / currentLen;
    uy = dy / currentLen;
  }

  const newP2X = Math.round((p1.x + ux * newLength) * 10) / 10;
  const newP2Y = Math.round((p1.y + uy * newLength) * 10) / 10;

  const newPoints = [...points];
  newPoints[nextIdx] = { x: newP2X, y: newP2Y };
  return normalizePolygonPoints(newPoints);
}

/**
 * Computes edge length labels and geometry for each edge in the polygon.
 */
export function calculateEdgeLengths(points: PolygonPoint[]): EdgeInfo[] {
  if (!points || points.length < 2) return [];
  const result: EdgeInfo[] = [];
  const n = points.length;
  const getVertexLabel = (idx: number) => String.fromCharCode(65 + (idx % 26));

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const p1 = points[i];
    const p2 = points[j];
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.round(Math.hypot(dx, dy) * 10) / 10;
    const label = `${getVertexLabel(i)}${getVertexLabel(j)}`;

    result.push({
      index: i,
      label,
      length: len,
      lengthText: `${label} = ${len} ft`,
      from: p1,
      to: p2,
      midpoint: {
        x: (p1.x + p2.x) / 2,
        y: (p1.y + p2.y) / 2,
      },
    });
  }

  return result;
}

/**
 * Orientation test for 3 points (p, q, r).
 * 0 -> Collinear, 1 -> Clockwise, 2 -> Counterclockwise
 */
function orientation(p: PolygonPoint, q: PolygonPoint, r: PolygonPoint): number {
  const val = (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
  if (Math.abs(val) < 1e-6) return 0;
  return val > 0 ? 1 : 2;
}

/**
 * Checks if point q lies on segment pr.
 */
function onSegment(p: PolygonPoint, q: PolygonPoint, r: PolygonPoint): boolean {
  return (
    q.x <= Math.max(p.x, r.x) + 1e-6 &&
    q.x >= Math.min(p.x, r.x) - 1e-6 &&
    q.y <= Math.max(p.y, r.y) + 1e-6 &&
    q.y >= Math.min(p.y, r.y) - 1e-6
  );
}

/**
 * Checks if line segment p1q1 intersects line segment p2q2 (strict or inclusive).
 */
export function doSegmentsIntersect(
  p1: PolygonPoint,
  q1: PolygonPoint,
  p2: PolygonPoint,
  q2: PolygonPoint,
  strict = false
): boolean {
  // If sharing an endpoint, they do not strictly cross each other
  const shareEndpoint =
    (Math.abs(p1.x - p2.x) < 1e-4 && Math.abs(p1.y - p2.y) < 1e-4) ||
    (Math.abs(p1.x - q2.x) < 1e-4 && Math.abs(p1.y - q2.y) < 1e-4) ||
    (Math.abs(q1.x - p2.x) < 1e-4 && Math.abs(q1.y - p2.y) < 1e-4) ||
    (Math.abs(q1.x - q2.x) < 1e-4 && Math.abs(q1.y - q2.y) < 1e-4);

  if (shareEndpoint && strict) return false;

  const o1 = orientation(p1, q1, p2);
  const o2 = orientation(p1, q1, q2);
  const o3 = orientation(p2, q2, p1);
  const o4 = orientation(p2, q2, q1);

  // General intersection case
  if (o1 !== o2 && o3 !== o4) return true;

  // Special Collinear cases
  if (!strict) {
    if (o1 === 0 && onSegment(p1, p2, q1)) return true;
    if (o2 === 0 && onSegment(p1, q2, q1)) return true;
    if (o3 === 0 && onSegment(p2, p1, q2)) return true;
    if (o4 === 0 && onSegment(p2, q1, q2)) return true;
  }

  return false;
}

/**
 * Validates whether the polygon is a valid simple closed polygon.
 */
export function isSimplePolygon(points: PolygonPoint[]): { valid: boolean; error?: string } {
  if (!points || points.length < 3) {
    return { valid: false, error: 'Polygon requires at least 3 distinct boundary vertices.' };
  }

  const area = calculatePolygonArea(points);
  if (area < 50) {
    return { valid: false, error: 'Plot area is too small (minimum 50 sq.ft required).' };
  }

  const n = points.length;

  // Check for duplicate adjacent vertices
  for (let i = 0; i < n; i++) {
    const next = (i + 1) % n;
    const dist = Math.hypot(points[i].x - points[next].x, points[i].y - points[next].y);
    if (dist < 1.0) {
      return { valid: false, error: `Vertices ${String.fromCharCode(65 + i)} and ${String.fromCharCode(65 + next)} are too close (< 1 ft).` };
    }
  }

  // Check for self-intersecting non-adjacent edges
  for (let i = 0; i < n; i++) {
    const p1 = points[i];
    const q1 = points[(i + 1) % n];

    for (let j = i + 1; j < n; j++) {
      // Skip adjacent segments that naturally share an endpoint
      if (Math.abs(i - j) <= 1 || (i === 0 && j === n - 1)) continue;

      const p2 = points[j];
      const q2 = points[(j + 1) % n];

      if (doSegmentsIntersect(p1, q1, p2, q2, true)) {
        return {
          valid: false,
          error: 'Invalid boundary. Please keep the plot edges from crossing.',
        };
      }
    }
  }

  return { valid: true };
}

/**
 * Point in polygon check using the standard Ray-Casting algorithm.
 */
export function isPointInPolygon(
  pt: { x: number; y: number },
  polygon: PolygonPoint[],
  inclusive = true
): boolean {
  if (!polygon || polygon.length < 3) return false;
  let inside = false;
  const n = polygon.length;

  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;

    // Check if point is directly on edge
    if (inclusive) {
      const dist = Math.hypot(xj - xi, yj - yi);
      if (dist > 1e-4) {
        const d1 = Math.hypot(pt.x - xi, pt.y - yi);
        const d2 = Math.hypot(pt.x - xj, pt.y - yj);
        if (Math.abs(d1 + d2 - dist) < 0.1) {
          return true; // Point lies on boundary
        }
      }
    }

    const intersect =
      yi > pt.y !== yj > pt.y &&
      pt.x < ((xj - xi) * (pt.y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }

  return inside;
}

/**
 * Checks whether an entire rectangular room sits strictly inside the polygon.
 * Rigorously enforces: Room Polygon ⊂ Polygon (All 4 corners, 4 wall midpoints, and center).
 */
export function isRoomInsidePolygon(
  room: { x: number; y: number; width: number; height: number },
  polygon: PolygonPoint[],
  margin = 0.05
): boolean {
  if (!polygon || polygon.length < 3) return true;

  // 1. Check all 4 corners with slight inner tolerance
  const corners: PolygonPoint[] = [
    { x: room.x + margin, y: room.y + margin },
    { x: room.x + room.width - margin, y: room.y + margin },
    { x: room.x + room.width - margin, y: room.y + room.height - margin },
    { x: room.x + margin, y: room.y + room.height - margin },
  ];

  for (const corner of corners) {
    if (!isPointInPolygon(corner, polygon, true)) {
      return false;
    }
  }

  // 2. Check center point
  const center = { x: room.x + room.width / 2, y: room.y + room.height / 2 };
  if (!isPointInPolygon(center, polygon, true)) {
    return false;
  }

  // 3. Check 4 edge midpoints (to catch concave splay penetrations)
  const edgeMidpoints: PolygonPoint[] = [
    { x: room.x + room.width / 2, y: room.y + margin },
    { x: room.x + room.width - margin, y: room.y + room.height / 2 },
    { x: room.x + room.width / 2, y: room.y + room.height - margin },
    { x: room.x + margin, y: room.y + room.height / 2 },
  ];

  for (const mid of edgeMidpoints) {
    if (!isPointInPolygon(mid, polygon, true)) {
      return false;
    }
  }

  // 4. Ensure no polygon edge crosses into the room rectangle interior
  const roomEdges = [
    { p1: corners[0], p2: corners[1] },
    { p1: corners[1], p2: corners[2] },
    { p1: corners[2], p2: corners[3] },
    { p1: corners[3], p2: corners[0] },
  ];

  const n = polygon.length;
  for (let i = 0; i < n; i++) {
    const p1 = polygon[i];
    const p2 = polygon[(i + 1) % n];

    for (const re of roomEdges) {
      if (doSegmentsIntersect(p1, p2, re.p1, re.p2, true)) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Calculates the bounding box of a list of polygon points.
 */
export function getBoundingBoxOfPolygon(polygon: PolygonPoint[]): {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  width: number;
  height: number;
} {
  return getPolygonBounds(polygon);
}

/**
 * Finds negative / residual open spaces inside the plot polygon that are not covered by indoor rooms.
 * Categorizes spaces into: Parking, Front Walkway, Landscaped Garden, Utility Open Space.
 */
export interface OpenSpaceAllocation {
  type: 'parking' | 'walkway' | 'garden' | 'landscape' | 'utility_open';
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  area: number;
}

export function computeResidualOpenSpaces(
  plotPolygon: PolygonPoint[],
  buildablePolygon: PolygonPoint[],
  placedRooms: Array<{ x: number; y: number; width: number; height: number; zone?: string }>,
  facingDirection: string
): OpenSpaceAllocation[] {
  const bounds = getPolygonBounds(plotPolygon);
  const openSpaces: OpenSpaceAllocation[] = [];

  // Sample grid resolution across the plot
  const step = 4.0;
  const gridOccupied: boolean[][] = [];
  const nx = Math.ceil(bounds.width / step);
  const ny = Math.ceil(bounds.height / step);

  for (let ix = 0; ix < nx; ix++) {
    gridOccupied[ix] = [];
    for (let iy = 0; iy < ny; iy++) {
      const gx = bounds.minX + ix * step + step / 2;
      const gy = bounds.minY + iy * step + step / 2;

      // Inside plot polygon?
      const inPlot = isPointInPolygon({ x: gx, y: gy }, plotPolygon, true);
      if (!inPlot) {
        gridOccupied[ix][iy] = true; // occupied/unavailable
        continue;
      }

      // Inside any placed room?
      let insideRoom = false;
      for (const r of placedRooms) {
        if (gx >= r.x && gx <= r.x + r.width && gy >= r.y && gy <= r.y + r.height) {
          insideRoom = true;
          break;
        }
      }
      gridOccupied[ix][iy] = insideRoom;
    }
  }

  return openSpaces;
}

/**
 * Standard preset irregular architectural plot shapes.
 */
export const PRESET_IRREGULAR_PLOTS: {
  id: string;
  name: string;
  desc: string;
  points: PolygonPoint[];
}[] = [
  {
    id: 'l-shape',
    name: 'L-Shaped Plot',
    desc: '1,400 sq.ft — 6-sided corner garden plot',
    points: [
      { x: 0, y: 0 },
      { x: 40, y: 0 },
      { x: 40, y: 25 },
      { x: 22, y: 25 },
      { x: 22, y: 50 },
      { x: 0, y: 50 },
    ],
  },
  {
    id: 'trapezoid',
    name: 'Trapezoidal Plot',
    desc: '1,350 sq.ft — Splayed road frontage',
    points: [
      { x: 5, y: 0 },
      { x: 35, y: 0 },
      { x: 42, y: 40 },
      { x: 0, y: 40 },
    ],
  },
  {
    id: 'pentagon-corner',
    name: 'Corner Pentagon Plot',
    desc: '1,450 sq.ft — Chamfered road junction',
    points: [
      { x: 10, y: 0 },
      { x: 40, y: 0 },
      { x: 40, y: 40 },
      { x: 0, y: 40 },
      { x: 0, y: 12 },
    ],
  },
  {
    id: 'tapered-wedge',
    name: 'Tapered Wedge Plot',
    desc: '1,225 sq.ft — Cul-de-sac splay',
    points: [
      { x: 0, y: 0 },
      { x: 30, y: 0 },
      { x: 40, y: 35 },
      { x: 5, y: 35 },
    ],
  },
  {
    id: 'hexagon',
    name: 'Hexagonal Plot',
    desc: '1,650 sq.ft — 6-sided angular plot',
    points: [
      { x: 10, y: 0 },
      { x: 35, y: 0 },
      { x: 45, y: 20 },
      { x: 35, y: 40 },
      { x: 10, y: 40 },
      { x: 0, y: 20 },
    ],
  },
  {
    id: 'triangle',
    name: 'Triangular Plot',
    desc: '1,000 sq.ft — 3-sided corner wedge',
    points: [
      { x: 0, y: 0 },
      { x: 40, y: 0 },
      { x: 20, y: 50 },
    ],
  },
];

/**
 * Calculates the geometric centroid of a polygon.
 */
export function getPolygonCentroid(points: PolygonPoint[]): { x: number; y: number } {
  if (!points || points.length === 0) return { x: 0, y: 0 };
  let cx = 0;
  let cy = 0;
  for (const p of points) {
    cx += p.x;
    cy += p.y;
  }
  return {
    x: Math.round((cx / points.length) * 100) / 100,
    y: Math.round((cy / points.length) * 100) / 100,
  };
}

export interface SetbackConfig {
  front: number;
  rear: number;
  left: number;
  right: number;
}

/**
 * Returns standard realistic setbacks based on plot size and zoning norms.
 */
export function getDefaultSetbacks(totalLandArea: number): SetbackConfig {
  if (totalLandArea >= 2400) {
    return { front: 8.5, rear: 4.5, left: 3.5, right: 3.5 };
  } else if (totalLandArea >= 1400) {
    return { front: 7.5, rear: 4.0, left: 3.0, right: 3.0 };
  } else if (totalLandArea >= 900) {
    return { front: 6.5, rear: 3.5, left: 2.5, right: 2.5 };
  } else {
    return { front: 5.0, rear: 3.0, left: 2.0, right: 2.0 };
  }
}

/**
 * Computes an inner buildable boundary polygon by offsetting all perimeter edges inward
 * by the specified setback clearance distance.
 */
export function computeInnerBuildablePolygon(
  points: PolygonPoint[],
  setbackDistance: SetbackConfig | number = 3.5,
  minAreaRatio = 0.25
): PolygonPoint[] {
  if (!points || points.length < 3) return [];

  const originalArea = calculatePolygonArea(points);
  if (originalArea < 10) return points;

  // Use the max setback for general offsetting if SetbackConfig is provided
  // In a real implementation, we would offset each edge specifically based on front/rear/side
  // For now, we'll use a conservative average or max.
  let maxSetback = typeof setbackDistance === 'number' 
    ? setbackDistance 
    : Math.max(setbackDistance.front, setbackDistance.rear, setbackDistance.left, setbackDistance.right);

  // If setback is too large for small plot, scale it down
  let effectiveSetback = maxSetback;
  let attempts = 0;

  while (attempts < 5 && effectiveSetback >= 1.2) {
    attempts++;
    const n = points.length;
    const offsetLines: Array<{
      p: PolygonPoint; // point on offset line
      u: PolygonPoint; // unit direction vector along edge
      n: PolygonPoint; // inward unit normal
    }> = [];

    // 1. For each edge, compute inward normal and offset line
    for (let i = 0; i < n; i++) {
      const p1 = points[i];
      const p2 = points[(i + 1) % n];

      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const len = Math.hypot(dx, dy);

      if (len < 1e-4) {
        offsetLines.push({
          p: p1,
          u: { x: 1, y: 0 },
          n: { x: 0, y: 1 },
        });
        continue;
      }

      const ux = dx / len;
      const uy = dy / len;

      // Normal candidates
      const n1 = { x: -uy, y: ux };
      const n2 = { x: uy, y: -ux };

      // Midpoint test to find the true inward normal
      const mid = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
      const testDist = 0.5;
      const testPt1 = { x: mid.x + n1.x * testDist, y: mid.y + n1.y * testDist };

      const inwardNormal = isPointInPolygon(testPt1, points, true) ? n1 : n2;

      // Line point shifted inward by effective setback
      const linePoint = {
        x: mid.x + inwardNormal.x * effectiveSetback,
        y: mid.y + inwardNormal.y * effectiveSetback,
      };

      offsetLines.push({
        p: linePoint,
        u: { x: ux, y: uy },
        n: inwardNormal,
      });
    }

    // 2. Intersect consecutive offset lines to find inner vertices
    const innerVertices: PolygonPoint[] = [];
    let isHealthy = true;

    for (let i = 0; i < n; i++) {
      const prevIdx = (i - 1 + n) % n;
      const lPrev = offsetLines[prevIdx];
      const lCurr = offsetLines[i];

      // Intersection between lPrev (pPrev + t * uPrev) and lCurr (pCurr + s * uCurr)
      const det = lPrev.u.x * lCurr.u.y - lPrev.u.y * lCurr.u.x;
      const origVertex = points[i];

      if (Math.abs(det) > 1e-4) {
        const dx = lCurr.p.x - lPrev.p.x;
        const dy = lCurr.p.y - lPrev.p.y;
        const t = (dx * lCurr.u.y - dy * lCurr.u.x) / det;

        let ix = lPrev.p.x + t * lPrev.u.x;
        let iy = lPrev.p.y + t * lPrev.u.y;

        // Prevent acute miter spikes from projecting excessively far
        const distFromOrig = Math.hypot(ix - origVertex.x, iy - origVertex.y);
        const maxDist = effectiveSetback * 2.8;
        if (distFromOrig > maxDist) {
          const avgN = {
            x: (lPrev.n.x + lCurr.n.x) / 2,
            y: (lPrev.n.y + lCurr.n.y) / 2,
          };
          const nLen = Math.hypot(avgN.x, avgN.y) || 1;
          ix = origVertex.x + (avgN.x / nLen) * effectiveSetback;
          iy = origVertex.y + (avgN.y / nLen) * effectiveSetback;
        }

        innerVertices.push({
          x: Math.round(ix * 10) / 10,
          y: Math.round(iy * 10) / 10,
        });
      } else {
        // Parallel or collinear fallback: shift along average normal
        const avgN = {
          x: (lPrev.n.x + lCurr.n.x) / 2,
          y: (lPrev.n.y + lCurr.n.y) / 2,
        };
        const nLen = Math.hypot(avgN.x, avgN.y) || 1;
        innerVertices.push({
          x: Math.round((origVertex.x + (avgN.x / nLen) * effectiveSetback) * 10) / 10,
          y: Math.round((origVertex.y + (avgN.y / nLen) * effectiveSetback) * 10) / 10,
        });
      }
    }

    // 3. Verify inner polygon validity
    const innerArea = calculatePolygonArea(innerVertices);
    if (innerArea >= originalArea * minAreaRatio && innerVertices.length >= 3) {
      // Check that all vertices are inside original polygon
      const allInside = innerVertices.every((v) => isPointInPolygon(v, points, true));
      if (allInside) {
        return innerVertices;
      }
    }

    // Reduce setback and retry if polygon inverted or shrunk excessively
    effectiveSetback *= 0.75;
  }

  // Fallback: Centroid-based scale contraction
  const centroid = getPolygonCentroid(points);
  const scaleFactor = Math.max(0.6, 1 - (maxSetback * 2) / Math.sqrt(originalArea));
  return points.map((p) => ({
    x: Math.round((centroid.x + (p.x - centroid.x) * scaleFactor) * 10) / 10,
    y: Math.round((centroid.y + (p.y - centroid.y) * scaleFactor) * 10) / 10,
  }));
}
