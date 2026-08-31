import * as THREE from 'three';

/**
 * Generates procedural canvas textures for high-fidelity architectural rendering
 * in Three.js without external network image dependencies.
 */

// 1. Procedural Wood Plank Texture (Parquet / Hardwood Flooring)
export function createWoodFloorTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Base wood color
  ctx.fillStyle = '#C89358';
  ctx.fillRect(0, 0, 512, 512);

  // Draw wood planks
  const plankH = 64;
  const plankW = 256;

  for (let y = 0; y < 512; y += plankH) {
    const rowIdx = y / plankH;
    const xOffset = (rowIdx % 2) * (plankW / 2);

    for (let x = -plankW; x < 512 + plankW; x += plankW) {
      const px = x + xOffset;

      // Slight plank color variation
      const toneOffset = ((rowIdx * 13 + x * 7) % 20) - 10;
      const r = Math.min(255, Math.max(0, 200 + toneOffset));
      const g = Math.min(255, Math.max(0, 147 + Math.floor(toneOffset * 0.8)));
      const b = Math.min(255, Math.max(0, 88 + Math.floor(toneOffset * 0.6)));

      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.fillRect(px + 1, y + 1, plankW - 2, plankH - 2);

      // Wood grain lines
      ctx.strokeStyle = `rgba(130, 80, 30, 0.12)`;
      ctx.lineWidth = 1;
      for (let i = 0; i < 6; i++) {
        const gy = y + 8 + i * 9 + ((x + i * 15) % 5);
        ctx.beginPath();
        ctx.moveTo(px, gy);
        ctx.bezierCurveTo(
          px + plankW * 0.3, gy + 3,
          px + plankW * 0.7, gy - 2,
          px + plankW, gy + 1
        );
        ctx.stroke();
      }

      // Plank bevel / seam shadow
      ctx.strokeStyle = '#6E4018';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(px, y, plankW, plankH);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 3);
  return texture;
}

// 2. Procedural Porcelain / Marble Tile Texture (Kitchen & Bathroom Floors)
export function createTileFloorTexture(baseColor = '#E5E9F0', groutColor = '#CBD5E1', tileSize = 64): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  ctx.fillStyle = groutColor;
  ctx.fillRect(0, 0, 512, 512);

  const padding = 3;
  for (let y = 0; y < 512; y += tileSize) {
    for (let x = 0; x < 512; x += tileSize) {
      // Tile face
      ctx.fillStyle = baseColor;
      ctx.fillRect(x + padding, y + padding, tileSize - padding * 2, tileSize - padding * 2);

      // Subtle marble vein / shading
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + padding, y + padding);
      ctx.lineTo(x + tileSize - padding, y + padding);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.beginPath();
      ctx.moveTo(x + padding + 10, y + padding + 15);
      ctx.lineTo(x + tileSize - padding - 15, y + tileSize - padding - 10);
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  return texture;
}

// 3. Procedural Exterior Stucco Plaster Texture (Bump & Diffuse)
export function createStuccoTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  ctx.fillStyle = '#F8FAFC';
  ctx.fillRect(0, 0, 256, 256);

  // Subtle sand speckles
  for (let i = 0; i < 4000; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const opacity = Math.random() * 0.08;
    const isDark = Math.random() > 0.4;
    ctx.fillStyle = isDark ? `rgba(100, 116, 139, ${opacity})` : `rgba(255, 255, 255, ${opacity * 1.5})`;
    ctx.fillRect(x, y, 1.5, 1.5);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(6, 6);
  return texture;
}

// 4. Procedural Terracotta Roof Tile Texture
export function createRoofTileTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  ctx.fillStyle = '#993716';
  ctx.fillRect(0, 0, 512, 512);

  const rowHeight = 32;
  const tileWidth = 48;

  for (let y = 0; y < 512; y += rowHeight) {
    const row = y / rowHeight;
    const offset = (row % 2) * (tileWidth / 2);

    // Row shadow under the overlap
    ctx.fillStyle = '#6E250E';
    ctx.fillRect(0, y + rowHeight - 4, 512, 4);

    for (let x = -tileWidth; x < 512 + tileWidth; x += tileWidth) {
      const tx = x + offset;

      // Tile gradient / curved Spanish barrel tile look
      const grad = ctx.createLinearGradient(tx, y, tx + tileWidth, y);
      grad.addColorStop(0, '#7C2D12');
      grad.addColorStop(0.3, '#B45309');
      grad.addColorStop(0.7, '#C2410C');
      grad.addColorStop(1, '#6E250E');

      ctx.fillStyle = grad;
      ctx.fillRect(tx + 2, y + 2, tileWidth - 4, rowHeight - 6);

      // Tile highlight edge
      ctx.fillStyle = 'rgba(254, 215, 170, 0.35)';
      ctx.fillRect(tx + 4, y + 3, tileWidth * 0.4, 2);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  return texture;
}

// 5. Procedural Concrete Interlocking Pavers (Driveway & Patio)
export function createPaverTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  ctx.fillStyle = '#475569';
  ctx.fillRect(0, 0, 256, 256);

  const pW = 64;
  const pH = 32;

  for (let y = 0; y < 256; y += pH) {
    const row = y / pH;
    const offset = (row % 2) * (pW / 2);

    for (let x = -pW; x < 256 + pW; x += pW) {
      const px = x + offset;
      const shade = 105 + ((x * 11 + y * 7) % 30);
      ctx.fillStyle = `rgb(${shade}, ${shade + 4}, ${shade + 8})`;
      ctx.fillRect(px + 2, y + 2, pW - 4, pH - 4);

      // Bevel highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.fillRect(px + 3, y + 3, pW - 6, 2);
      ctx.fillRect(px + 3, y + 3, 2, pH - 6);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(5, 5);
  return texture;
}

// 6. Procedural Grass Lawn Texture
export function createGrassTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  ctx.fillStyle = '#22C55E';
  ctx.fillRect(0, 0, 256, 256);

  // Multiple shades of green specks
  for (let i = 0; i < 5000; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const shade = Math.random();
    if (shade < 0.35) {
      ctx.fillStyle = '#15803D';
    } else if (shade < 0.7) {
      ctx.fillStyle = '#16A34A';
    } else {
      ctx.fillStyle = '#4ADE80';
    }
    ctx.fillRect(x, y, 2, 3);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(8, 8);
  return texture;
}

// 7. Procedural Architectural Solar Panel Texture
export function createSolarPanelTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Dark metallic navy silicon
  ctx.fillStyle = '#0F172A';
  ctx.fillRect(0, 0, 256, 256);

  // Grid of silicon solar cells
  const cellSize = 60;
  ctx.fillStyle = '#1E3A8A';
  ctx.strokeStyle = '#94A3B8';
  ctx.lineWidth = 1.5;

  for (let y = 8; y < 256 - 8; y += cellSize + 4) {
    for (let x = 8; x < 256 - 8; x += cellSize + 4) {
      ctx.fillRect(x, y, cellSize, cellSize);
      ctx.strokeRect(x, y, cellSize, cellSize);

      // Busbars inside each cell
      ctx.strokeStyle = 'rgba(203, 213, 225, 0.4)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(x + cellSize * 0.33, y);
      ctx.lineTo(x + cellSize * 0.33, y + cellSize);
      ctx.moveTo(x + cellSize * 0.66, y);
      ctx.lineTo(x + cellSize * 0.66, y + cellSize);
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

// 8. Procedural Main Entrance Badge Floating 3D Marker
export function createMainEntranceBadgeTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 160;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  ctx.clearRect(0, 0, 512, 160);

  // Rounded Pill Badge Background
  const r = 36;
  const x = 16;
  const y = 20;
  const w = 480;
  const h = 120;

  // Outer glow shadow
  ctx.shadowColor = 'rgba(2, 132, 199, 0.4)';
  ctx.shadowBlur = 16;

  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();

  ctx.fillStyle = '#0F172A';
  ctx.fill();

  // Reset shadow for crisp borders & text
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;

  // Vibrant Cyan Pill Border
  ctx.strokeStyle = '#0284C7';
  ctx.lineWidth = 4;
  ctx.stroke();

  // Cyan Glowing Entrance Icon / Beacon on Left
  ctx.beginPath();
  ctx.arc(68, 80, 14, 0, Math.PI * 2);
  ctx.fillStyle = '#38BDF8';
  ctx.fill();

  ctx.beginPath();
  ctx.arc(68, 80, 6, 0, Math.PI * 2);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();

  // Main Typography
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 36px "Plus Jakarta Sans", system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('MAIN ENTRANCE', 104, 70);

  // Subtitle
  ctx.fillStyle = '#38BDF8';
  ctx.font = 'bold 16px monospace';
  ctx.fillText('PRIMARY ACCESS', 106, 106);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}

// 9. Procedural Architectural Wall Plaque Sign
export function createMainEntrancePlaqueTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Dark slate brushed background
  ctx.fillStyle = '#0F172A';
  ctx.fillRect(0, 0, 512, 128);

  // Metallic gold/brass accent frame
  ctx.strokeStyle = '#F59E0B';
  ctx.lineWidth = 6;
  ctx.strokeRect(8, 8, 496, 112);

  // Inner thin border
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
  ctx.lineWidth = 2;
  ctx.strokeRect(18, 18, 476, 92);

  // Engraved Text
  ctx.fillStyle = '#FEF08A';
  ctx.font = 'bold 38px "Plus Jakarta Sans", system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('MAIN ENTRANCE', 256, 64);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

// 10. Procedural Entrance Doormat Texture
export function createEntranceDoormatTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Coir textured base
  ctx.fillStyle = '#451A03';
  ctx.fillRect(0, 0, 256, 128);

  // Subtle border
  ctx.strokeStyle = '#1E293B';
  ctx.lineWidth = 6;
  ctx.strokeRect(4, 4, 248, 120);

  // Text
  ctx.fillStyle = '#FEF3C7';
  ctx.font = 'bold 20px "Plus Jakarta Sans", monospace, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('MAIN ENTRANCE', 128, 64);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

