import * as THREE from 'three';

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const num = parseInt(clean, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

// Deterministic pseudo-random for consistent wood grain across rebuilds
function seededRand(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export interface ProceduralTextureSet {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
  dispose: () => void;
}

/**
 * Generates crisp procedural wood veneer or fine architectural lacquer textures
 * with properly configured SRGBColorSpace (albedo) and linear bump maps.
 */
export function createFinishTextureSet(
  baseHex: string,
  grainHex: string,
  isWood: boolean,
  maxAnisotropy: number,
  seedOffset = 1
): ProceduralTextureSet {
  const size = 512;
  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = size;
  colorCanvas.height = size;
  const ctx = colorCanvas.getContext('2d')!;

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bCtx = bumpCanvas.getContext('2d')!;

  const [br, bg, bb] = hexToRgb(baseHex);
  const [gr, gg, gb] = hexToRgb(grainHex);
  const rand = seededRand(seedOffset * 7919 + br * 31 + bg * 17 + bb);

  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, size, size);

  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, size, size);

  if (isWood) {
    // Soft vertical veneer plank tonal variation
    const grad = ctx.createLinearGradient(0, 0, size, 0);
    grad.addColorStop(0, `rgba(${gr}, ${gg}, ${gb}, 0.08)`);
    grad.addColorStop(0.32, `rgba(255, 255, 255, 0.04)`);
    grad.addColorStop(0.64, `rgba(${gr}, ${gg}, ${gb}, 0.06)`);
    grad.addColorStop(1, `rgba(${gr}, ${gg}, ${gb}, 0.08)`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    // Fine vertical rift-cut wood fibers & subtle cathedral waves
    for (let x = 0; x < size; x += 2) {
      const waveFreq = 0.012 + rand() * 0.014;
      const waveAmp = 1.2 + rand() * 2.8;
      const phase = rand() * Math.PI * 2;
      const alpha = 0.08 + rand() * 0.24;
      const lineW = 0.6 + rand() * 1.4;

      ctx.strokeStyle = `rgba(${gr}, ${gg}, ${gb}, ${alpha.toFixed(3)})`;
      ctx.lineWidth = lineW;
      ctx.beginPath();
      for (let y = 0; y <= size; y += 16) {
        const dx = Math.sin(y * waveFreq + phase) * waveAmp;
        if (y === 0) ctx.moveTo(x + dx, y);
        else ctx.lineTo(x + dx, y);
      }
      ctx.stroke();

      // Matching subtle pore groove in bump map
      const bumpVal = Math.round(112 + rand() * 32);
      bCtx.strokeStyle = `rgb(${bumpVal}, ${bumpVal}, ${bumpVal})`;
      bCtx.lineWidth = lineW;
      bCtx.beginPath();
      for (let y = 0; y <= size; y += 16) {
        const dx = Math.sin(y * waveFreq + phase) * waveAmp;
        if (y === 0) bCtx.moveTo(x + dx, y);
        else bCtx.lineTo(x + dx, y);
      }
      bCtx.stroke();
    }

    // Fine open-pore wood flecks
    for (let i = 0; i < 420; i++) {
      const px = rand() * size;
      const py = rand() * size;
      const len = 6 + rand() * 22;
      ctx.fillStyle = `rgba(${gr}, ${gg}, ${gb}, ${(0.12 + rand() * 0.16).toFixed(3)})`;
      ctx.fillRect(px, py, 1, len);
      bCtx.fillStyle = 'rgb(96,96,96)';
      bCtx.fillRect(px, py, 1, len);
    }
  } else {
    // Ultra-fine architectural matte lacquer micro-stipple
    for (let i = 0; i < 1800; i++) {
      const px = rand() * size;
      const py = rand() * size;
      const delta = rand() > 0.5 ? 255 : 0;
      ctx.fillStyle = `rgba(${delta}, ${delta}, ${delta}, 0.015)`;
      ctx.fillRect(px, py, 2, 2);
      const bv = Math.round(122 + rand() * 12);
      bCtx.fillStyle = `rgb(${bv}, ${bv}, ${bv})`;
      bCtx.fillRect(px, py, 2, 2);
    }
  }

  const map = new THREE.CanvasTexture(colorCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.anisotropy = maxAnisotropy;
  map.needsUpdate = true;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.anisotropy = maxAnisotropy;
  bumpMap.needsUpdate = true;

  return {
    map,
    bumpMap,
    dispose: () => {
      map.dispose();
      bumpMap.dispose();
    },
  };
}

/**
 * Generates a soft radial contact shadow texture for studio grounding beneath the cabinet.
 */
export function createContactShadowTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createRadialGradient(size / 2, size / 2, size * 0.08, size / 2, size / 2, size * 0.5);
  grad.addColorStop(0, 'rgba(15, 18, 24, 0.36)');
  grad.addColorStop(0.55, 'rgba(15, 18, 24, 0.16)');
  grad.addColorStop(1, 'rgba(15, 18, 24, 0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}
