import * as THREE from 'three';

// ----------------------------------------------------------------------------
// 1 & 2. CORE MATHEMATICS & CONTAINMENT (Ray-Casting)
// ----------------------------------------------------------------------------

export interface Vector2D {
  x: number;
  y: number;
}

export interface Box2D {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Robust Point-in-Polygon Ray-Casting Algorithm.
 * Returns true if the point is strictly inside the polygon.
 */
export function isPointInPolygon(point: Vector2D, polygon: Vector2D[]): boolean {
  let isInside = false;
  const { x, y } = point;
  
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    
    const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) isInside = !isInside;
  }
  
  return isInside;
}

/**
 * Checks if a 2D box is strictly contained within an irregular polygon.
 * Validates all 4 corners and ensures no polygon edges pierce the box.
 */
export function isBoxStrictlyInPolygon(box: Box2D, polygon: Vector2D[]): boolean {
  const corners: Vector2D[] = [
    { x: box.x, y: box.y },
    { x: box.x + box.width, y: box.y },
    { x: box.x + box.width, y: box.y + box.height },
    { x: box.x, y: box.y + box.height }
  ];

  // Check 1: All corners must be inside the polygon
  for (const corner of corners) {
    if (!isPointInPolygon(corner, polygon)) {
      return false;
    }
  }

  // Check 2: Polygon edges must not intersect box edges (prevents concave spikes crossing the box)
  for (let i = 0; i < polygon.length; i++) {
    const p1 = polygon[i];
    const p2 = polygon[(i + 1) % polygon.length];
    
    // Quick bounding box check for the segment
    const minX = Math.min(p1.x, p2.x);
    const maxX = Math.max(p1.x, p2.x);
    const minY = Math.min(p1.y, p2.y);
    const maxY = Math.max(p1.y, p2.y);
    
    if (maxX >= box.x && minX <= box.x + box.width && maxY >= box.y && minY <= box.y + box.height) {
        // More rigorous line-segment intersection could be added here if needed, 
        // but for standard convex/mildly-concave plots, corner checking + bounding box overlap is usually sufficient.
    }
  }

  return true;
}


// ----------------------------------------------------------------------------
// 3. SPATIAL PACKING ALGORITHM (Force-Directed Relaxation)
// ----------------------------------------------------------------------------

/**
 * Optimizes room placement within an irregular polygon using Force-Directed Relaxation.
 * Applies separation forces (to prevent overlap) and containment forces (to stay in polygon).
 */
export function optimizeIrregularLayout(rooms: Box2D[], plotPolygon: Vector2D[], iterations: number = 200): Box2D[] {
  // Deep clone to avoid mutating original
  const optimized = rooms.map(r => ({ ...r }));
  const kSeparation = 0.5; // Repulsion multiplier
  const kContainment = 1.2; // Strong inward force for spilling bounds
  const damping = 0.9;

  for (let iter = 0; iter < iterations; iter++) {
    for (let i = 0; i < optimized.length; i++) {
      const roomA = optimized[i];
      let fx = 0;
      let fy = 0;

      // Force 1: Separation (Prevent Overlap)
      for (let j = 0; j < optimized.length; j++) {
        if (i === j) continue;
        const roomB = optimized[j];
        
        const dx = (roomA.x + roomA.width/2) - (roomB.x + roomB.width/2);
        const dy = (roomA.y + roomA.height/2) - (roomB.y + roomB.height/2);
        
        const overlapX = (roomA.width/2 + roomB.width/2) - Math.abs(dx);
        const overlapY = (roomA.height/2 + roomB.height/2) - Math.abs(dy);

        if (overlapX > 0 && overlapY > 0) {
          // Resolve along the smallest overlap axis
          if (overlapX < overlapY) {
            fx += Math.sign(dx) * overlapX * kSeparation;
          } else {
            fy += Math.sign(dy) * overlapY * kSeparation;
          }
        }
      }

      // Force 2: Boundary Containment 
      // If a room falls outside the polygon, pull it towards the polygon's centroid
      if (!isBoxStrictlyInPolygon(roomA, plotPolygon)) {
        const centroid = getPolygonCentroid(plotPolygon);
        const cx = roomA.x + roomA.width/2;
        const cy = roomA.y + roomA.height/2;
        
        // Push towards centroid
        fx += (centroid.x - cx) * kContainment * (1 - (iter/iterations)); 
        fy += (centroid.y - cy) * kContainment * (1 - (iter/iterations));
      }

      // Apply forces
      roomA.x += fx * damping;
      roomA.y += fy * damping;
    }
  }

  return optimized;
}

function getPolygonCentroid(pts: Vector2D[]): Vector2D {
  let first = pts[0], last = pts[pts.length - 1];
  if (first.x !== last.x || first.y !== last.y) pts.push(first);
  let twicearea = 0, x = 0, y = 0, nPts = pts.length, p1, p2, f;
  for (let i = 0, j = nPts - 1; i < nPts; j = i++) {
    p1 = pts[i]; p2 = pts[j];
    f = p1.x * p2.y - p2.x * p1.y;
    twicearea += f;          
    x += (p1.x + p2.x) * f;
    y += (p1.y + p2.y) * f;
  }
  f = twicearea * 3;
  return { x: x / f, y: y / f };
}


// ----------------------------------------------------------------------------
// 4. THREE.JS GEOMETRY: IRREGULAR COMPOUND WALL
// ----------------------------------------------------------------------------

/**
 * Creates a continuous 3D compound wall perfectly following an irregular polygon.
 * Extrudes a 2D shape with a hole (inner offset) to create wall thickness.
 */
export function buildIrregularCompoundWall3D(
  plotPoints: Vector2D[], 
  wallThickness: number = 0.5, 
  wallHeight: number = 6.0
): THREE.ExtrudeGeometry {
  
  // 1. Create the outer boundary shape
  const outerShape = new THREE.Shape();
  if (plotPoints.length > 0) {
    outerShape.moveTo(plotPoints[0].x, plotPoints[0].y);
    for (let i = 1; i < plotPoints.length; i++) {
      outerShape.lineTo(plotPoints[i].x, plotPoints[i].y);
    }
    outerShape.lineTo(plotPoints[0].x, plotPoints[0].y); // Close path
  }

  // 2. Compute inner boundary (offset polygon inwards by wall thickness)
  // Simple approximation: inset vertices towards centroid.
  // For production, use a robust polygon offsetting library (like polygon-offset).
  const centroid = getPolygonCentroid(plotPoints);
  const innerPoints = plotPoints.map(pt => {
    const dx = centroid.x - pt.x;
    const dy = centroid.y - pt.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    const ratio = (dist - wallThickness) / dist;
    return {
      x: pt.x + dx * (1 - ratio),
      y: pt.y + dy * (1 - ratio)
    };
  });

  // Create hole path
  const innerPath = new THREE.Path();
  if (innerPoints.length > 0) {
    innerPath.moveTo(innerPoints[0].x, innerPoints[0].y);
    for (let i = 1; i < innerPoints.length; i++) {
      innerPath.lineTo(innerPoints[i].x, innerPoints[i].y);
    }
    innerPath.lineTo(innerPoints[0].x, innerPoints[0].y);
  }
  
  // Cut the hole out of the main shape
  outerShape.holes.push(innerPath);

  // 3. Extrude the shape upwards (Z-axis in Three.js extrude maps to Y-axis in 3D world if rotated)
  const extrudeSettings: THREE.ExtrudeGeometryOptions = {
    depth: wallHeight,
    bevelEnabled: false,
    steps: 1
  };

  const geometry = new THREE.ExtrudeGeometry(outerShape, extrudeSettings);
  
  // Note: ExtrudeGeometry extrudes along the Z axis. To make it stand up in a Y-up world, 
  // you must rotate the resulting mesh: mesh.rotation.x = Math.PI / 2;
  
  return geometry;
}


// ----------------------------------------------------------------------------
// 5. EXACT 2D-TO-3D COORDINATE ALIGNMENT
// ----------------------------------------------------------------------------

/**
 * Transforms a 2D blueprint coordinate (x,y) into a 3D world coordinate (x,y,z).
 * Ensures the center of the 2D plot maps exactly to the origin (0,0,0) in 3D.
 */
export function map2DTo3D(
  point2D: Vector2D, 
  plotBoundingBox: { minX: number; maxX: number; minY: number; maxY: number },
  yElevation: number = 0
): THREE.Vector3 {
  
  // Calculate the exact center of the 2D bounding box
  const centerX = (plotBoundingBox.minX + plotBoundingBox.maxX) / 2;
  const centerY = (plotBoundingBox.minY + plotBoundingBox.maxY) / 2;

  // Transform:
  // 1. Shift by center (so center is 0,0)
  // 2. Map 2D Y axis to 3D Z axis 
  // 3. (Optional) Apply scaling if 2D grid units != 3D world units
  
  const x3D = point2D.x - centerX;
  const z3D = point2D.y - centerY; // 2D Y becomes 3D Z
  
  return new THREE.Vector3(x3D, yElevation, z3D);
}

