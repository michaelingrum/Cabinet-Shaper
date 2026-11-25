import { CabinetCalculation, CabinetSpec } from '../types/cabinet';
import {
  CABINET_STYLES,
  DOOR_STYLE_DEFS,
  EXTERIOR_MATERIALS,
  HARDWARE_FINISHES,
  HINGE_TYPES,
  SHEET_DIMENSIONS,
  formatDim,
  formatDimCompact,
  getEffectiveInteriorMaterial,
} from './cabinetEngine';

export interface BlueprintRenderOptions {
  showDimensions: boolean;
  showBoringGrid: boolean;
  showHiddenLines: boolean;
  showSwingArcs: boolean;
  blueprintTheme: 'architectural' | 'classic-blue';
}

function escXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Draws a crisp architectural dimension line with extension lines, 45-degree slash ticks,
 * and centered tabular monospace measurement text.
 */
function svgDimH(
  x1: number,
  x2: number,
  y: number,
  originY: number,
  label: string,
  color: string,
  bgColor: string
): string {
  const minX = Math.min(x1, x2);
  const maxX = Math.max(x1, x2);
  const midX = (minX + maxX) / 2;
  const dir = y < originY ? -1 : 1;
  const extStart = originY + dir * 4;
  const extEnd = y + dir * 6;
  const tick = 4.5;
  const textW = Math.max(36, label.length * 6.5 + 10);

  return `
    <g class="dim-h">
      <line x1="${minX.toFixed(1)}" y1="${extStart.toFixed(1)}" x2="${minX.toFixed(1)}" y2="${extEnd.toFixed(1)}" stroke="${color}" stroke-width="0.7" opacity="0.65"/>
      <line x1="${maxX.toFixed(1)}" y1="${extStart.toFixed(1)}" x2="${maxX.toFixed(1)}" y2="${extEnd.toFixed(1)}" stroke="${color}" stroke-width="0.7" opacity="0.65"/>
      <line x1="${(minX - 4).toFixed(1)}" y1="${y.toFixed(1)}" x2="${(maxX + 4).toFixed(1)}" y2="${y.toFixed(1)}" stroke="${color}" stroke-width="0.9"/>
      <line x1="${(minX - tick).toFixed(1)}" y1="${(y + tick).toFixed(1)}" x2="${(minX + tick).toFixed(1)}" y2="${(y - tick).toFixed(1)}" stroke="${color}" stroke-width="1.35"/>
      <line x1="${(maxX - tick).toFixed(1)}" y1="${(y + tick).toFixed(1)}" x2="${(maxX + tick).toFixed(1)}" y2="${(y - tick).toFixed(1)}" stroke="${color}" stroke-width="1.35"/>
      <rect x="${(midX - textW / 2).toFixed(1)}" y="${(y - 7.5).toFixed(1)}" width="${textW.toFixed(1)}" height="14" fill="${bgColor}" />
      <text x="${midX.toFixed(1)}" y="${(y + 3.2).toFixed(1)}" text-anchor="middle" font-family="'IBM Plex Mono', monospace" font-size="9.5" font-weight="500" fill="${color}">${escXml(label)}</text>
    </g>
  `;
}

function svgDimV(
  y1: number,
  y2: number,
  x: number,
  originX: number,
  label: string,
  color: string,
  bgColor: string
): string {
  const minY = Math.min(y1, y2);
  const maxY = Math.max(y1, y2);
  const midY = (minY + maxY) / 2;
  const dir = x < originX ? -1 : 1;
  const extStart = originX + dir * 4;
  const extEnd = x + dir * 6;
  const tick = 4.5;
  const textW = Math.max(34, label.length * 6.5 + 10);

  return `
    <g class="dim-v">
      <line x1="${extStart.toFixed(1)}" y1="${minY.toFixed(1)}" x2="${extEnd.toFixed(1)}" y2="${minY.toFixed(1)}" stroke="${color}" stroke-width="0.7" opacity="0.65"/>
      <line x1="${extStart.toFixed(1)}" y1="${maxY.toFixed(1)}" x2="${extEnd.toFixed(1)}" y2="${maxY.toFixed(1)}" stroke="${color}" stroke-width="0.7" opacity="0.65"/>
      <line x1="${x.toFixed(1)}" y1="${(minY - 4).toFixed(1)}" x2="${x.toFixed(1)}" y2="${(maxY + 4).toFixed(1)}" stroke="${color}" stroke-width="0.9"/>
      <line x1="${(x - tick).toFixed(1)}" y1="${(minY + tick).toFixed(1)}" x2="${(x + tick).toFixed(1)}" y2="${(minY - tick).toFixed(1)}" stroke="${color}" stroke-width="1.35"/>
      <line x1="${(x - tick).toFixed(1)}" y1="${(maxY + tick).toFixed(1)}" x2="${(x + tick).toFixed(1)}" y2="${(maxY - tick).toFixed(1)}" stroke="${color}" stroke-width="1.35"/>
      <g transform="translate(${x.toFixed(1)}, ${midY.toFixed(1)}) rotate(-90)">
        <rect x="${(-textW / 2).toFixed(1)}" y="-7.5" width="${textW.toFixed(1)}" height="14" fill="${bgColor}" />
        <text x="0" y="3.2" text-anchor="middle" font-family="'IBM Plex Mono', monospace" font-size="9.5" font-weight="500" fill="${color}">${escXml(label)}</text>
      </g>
    </g>
  `;
}

/**
 * Generates a full ISO A3-proportioned multi-view manufacturing blueprint SVG
 * (Front Elevation, Side Cross-Section A-A, Top Plan View, Specification Notes, Title Block).
 */
export function generateBlueprintSVG(
  spec: CabinetSpec,
  calc: CabinetCalculation,
  options: BlueprintRenderOptions
): string {
  const W = 1400;
  const H = 990;
  const isBlue = options.blueprintTheme === 'classic-blue';

  const bg = isBlue ? '#0E294B' : '#FFFFFF';
  const gridCol = isBlue ? 'rgba(186, 214, 247, 0.08)' : 'rgba(20, 21, 23, 0.045)';
  const ink = isBlue ? '#F0F6FF' : '#141517';
  const inkSoft = isBlue ? '#9AC0E8' : '#525866';
  const dimCol = isBlue ? '#7CC4FA' : '#1D4ED8';
  const hiddenCol = isBlue ? '#6395C9' : '#858C98';
  const hatchFill = isBlue ? 'rgba(124, 196, 250, 0.14)' : 'rgba(20, 21, 23, 0.07)';
  const borderCol = isBlue ? '#5C8AC0' : '#1E2229';

  const extMat = EXTERIOR_MATERIALS[spec.exteriorMaterial];
  const intMat = getEffectiveInteriorMaterial(spec);
  const hwFinish = HARDWARE_FINISHES[spec.hardwareFinish];
  const styleDef = CABINET_STYLES[spec.cabinetStyle ?? 'modern-frameless'] ?? CABINET_STYLES['modern-frameless'];
  const doorDef = DOOR_STYLE_DEFS[spec.doorStyle] ?? DOOR_STYLE_DEFS.slab;
  const hingeDef = HINGE_TYPES[spec.hingeType ?? 'concealed-110'] ?? HINGE_TYPES['concealed-110'];
  const doorMount = spec.doorMount ?? 'full-overlay';

  // Auto-compute unified orthographic scale (px per mm) so Front + Side + Plan fit comfortably with room for dims
  const countertopT =
    spec.countertopEnabled && spec.typology !== 'wall' && spec.typology !== 'tall'
      ? spec.countertopThicknessMm
      : 0;
  const overhang = countertopT > 0 ? spec.countertopOverhangMm : 0;

  const frontAreaW = 660;
  const frontAreaH = 420;
  const sideAreaW = 360;
  const planAreaH = 215;

  const scaleFromFrontW = frontAreaW / (spec.widthMm + overhang * 2 + 180);
  const scaleFromFrontH = frontAreaH / (spec.heightMm + 160);
  const scaleFromSideW = sideAreaW / (spec.depthMm + overhang + 140);
  const scaleFromPlanH = planAreaH / (spec.depthMm + overhang + 110);

  const scale = Math.min(scaleFromFrontW, scaleFromFrontH, scaleFromSideW, scaleFromPlanH, 0.48);
  const ratioApprox = Math.max(1, Math.round(1 / (scale * 0.2645))); // approx architectural scale 1:N

  const px = (mm: number) => mm * scale;

  // View anchor origins
  const cabW = px(spec.widthMm);
  const cabH = px(spec.heightMm);
  const cabD = px(spec.depthMm);
  const ctH = px(countertopT);
  const ctOver = px(overhang);
  const baseH = px(calc.carcassBottomY);
  const carcH = px(calc.carcassHeightMm);
  const carcD = px(calc.carcassDepthMm);
  const tPx = Math.max(2, px(spec.carcassThicknessMm));
  const frontTPx = Math.max(2, px(spec.frontThicknessMm));
  const backTPx = Math.max(1.2, px(spec.backThicknessMm));

  // Front Elevation: centered in left-top quadrant
  const frontOriginX = 135 + (frontAreaW - cabW) / 2;
  const frontBottomY = 105 + frontAreaH - (frontAreaH - cabH) / 2;
  const frontTopY = frontBottomY - cabH;
  const frontCarcTopY = frontTopY + ctH;
  const frontCarcBotY = frontBottomY - baseH;

  // Side Cross-Section A-A: aligned horizontally with Front Elevation
  const sideOriginX = 955 + (sideAreaW - cabD) / 2;
  const sideBottomY = frontBottomY;
  const sideTopY = frontTopY;

  // Top Plan View: aligned vertically below Front Elevation
  const planOriginX = frontOriginX;
  const planTopY = 665 + (planAreaH - cabD) / 2;

  const partsSvg: string[] = [];

  // --- 1. FRONT ELEVATION ---
  partsSvg.push(`
    <g id="front-elevation">
      <text x="${(frontOriginX).toFixed(1)}" y="68" font-family="'Plus Jakarta Sans', sans-serif" font-size="13" font-weight="700" fill="${ink}" letter-spacing="0.04em">01. FRONT ELEVATION</text>
      <text x="${(frontOriginX).toFixed(1)}" y="83" font-family="'IBM Plex Mono', monospace" font-size="9.5" fill="${inkSoft}">Scale 1:${ratioApprox} · Overall ${formatDim(spec.widthMm, spec.unit)} W × ${formatDim(spec.heightMm, spec.unit)} H</text>
  `);

  // Floor datum line
  partsSvg.push(`
    <line x1="${(frontOriginX - 36).toFixed(1)}" y1="${frontBottomY.toFixed(1)}" x2="${(frontOriginX + cabW + 36).toFixed(1)}" y2="${frontBottomY.toFixed(1)}" stroke="${inkSoft}" stroke-width="0.9" stroke-dasharray="10 4 2 4"/>
  `);

  // Base (toe-kick or steel legs)
  if (spec.baseStyle === 'toe-kick' && calc.carcassBottomY > 0) {
    partsSvg.push(`
      <rect x="${(frontOriginX + 2).toFixed(1)}" y="${frontCarcBotY.toFixed(1)}" width="${(cabW - 4).toFixed(1)}" height="${baseH.toFixed(1)}" fill="${hatchFill}" stroke="${ink}" stroke-width="1.2"/>
    `);
  } else if (spec.baseStyle === 'steel-legs' && calc.carcassBottomY > 0) {
    const legW = Math.max(5, px(26));
    const inset = px(38);
    const legPositions =
      spec.widthMm >= 1400
        ? [frontOriginX + inset, frontOriginX + cabW / 2 - legW / 2, frontOriginX + cabW - inset - legW]
        : [frontOriginX + inset, frontOriginX + cabW - inset - legW];
    legPositions.forEach((lx) => {
      partsSvg.push(`
        <polygon points="${lx.toFixed(1)},${frontCarcBotY.toFixed(1)} ${(lx + legW).toFixed(1)},${frontCarcBotY.toFixed(1)} ${(lx + legW * 0.82).toFixed(1)},${frontBottomY.toFixed(1)} ${(lx + legW * 0.18).toFixed(1)},${frontBottomY.toFixed(1)}" fill="${hatchFill}" stroke="${ink}" stroke-width="1.2"/>
      `);
    });
  }

  // Main carcass outer perimeter
  partsSvg.push(`
    <rect x="${frontOriginX.toFixed(1)}" y="${frontCarcTopY.toFixed(1)}" width="${cabW.toFixed(1)}" height="${carcH.toFixed(1)}" fill="none" stroke="${ink}" stroke-width="1.8"/>
  `);

  // Hidden interior carcass & shelf lines
  if (options.showHiddenLines) {
    // Left & right gable inner faces, bottom & top decks
    partsSvg.push(`
      <line x1="${(frontOriginX + tPx).toFixed(1)}" y1="${frontCarcTopY.toFixed(1)}" x2="${(frontOriginX + tPx).toFixed(1)}" y2="${frontCarcBotY.toFixed(1)}" stroke="${hiddenCol}" stroke-width="0.7" stroke-dasharray="4 3"/>
      <line x1="${(frontOriginX + cabW - tPx).toFixed(1)}" y1="${frontCarcTopY.toFixed(1)}" x2="${(frontOriginX + cabW - tPx).toFixed(1)}" y2="${frontCarcBotY.toFixed(1)}" stroke="${hiddenCol}" stroke-width="0.7" stroke-dasharray="4 3"/>
      <line x1="${frontOriginX.toFixed(1)}" y1="${(frontCarcBotY - tPx).toFixed(1)}" x2="${(frontOriginX + cabW).toFixed(1)}" y2="${(frontCarcBotY - tPx).toFixed(1)}" stroke="${hiddenCol}" stroke-width="0.7" stroke-dasharray="4 3"/>
      <line x1="${frontOriginX.toFixed(1)}" y1="${(frontCarcTopY + tPx).toFixed(1)}" x2="${(frontOriginX + cabW).toFixed(1)}" y2="${(frontCarcTopY + tPx).toFixed(1)}" stroke="${hiddenCol}" stroke-width="0.7" stroke-dasharray="4 3"/>
    `);
  }

  // Countertop slab
  if (countertopT > 0) {
    partsSvg.push(`
      <rect x="${(frontOriginX - ctOver).toFixed(1)}" y="${frontTopY.toFixed(1)}" width="${(cabW + ctOver * 2).toFixed(1)}" height="${ctH.toFixed(1)}" fill="${hatchFill}" stroke="${ink}" stroke-width="1.7"/>
    `);
  }

  // Crown molding cornice outline in front elevation when style has crown trim & no countertop
  if (styleDef.hasCrownTrim && countertopT === 0) {
    const crH = px(44);
    const crOver = px(20);
    partsSvg.push(`
      <rect x="${(frontOriginX - crOver).toFixed(1)}" y="${(frontCarcTopY - crH).toFixed(1)}" width="${(cabW + crOver * 2).toFixed(1)}" height="${(crH * 0.55).toFixed(1)}" fill="${hatchFill}" stroke="${ink}" stroke-width="1.4"/>
      <rect x="${(frontOriginX - crOver * 0.5).toFixed(1)}" y="${(frontCarcTopY - crH * 0.45).toFixed(1)}" width="${(cabW + crOver).toFixed(1)}" height="${(crH * 0.45).toFixed(1)}" fill="none" stroke="${ink}" stroke-width="1.1"/>
    `);
  }

  // Per-bay doors, drawers, shelves, swing triangles, hinge markers, pulls
  const gapPx = Math.max(1.4, px(spec.revealGapMm));
  const insetTopBotTrimPx = doorMount === 'inset'
    ? px(spec.construction === 'face-frame' ? 42 : spec.carcassThicknessMm)
    : doorMount === 'half-overlay' && spec.construction === 'face-frame'
      ? px(20)
      : 0;

  const drawFrontPanel = (
    x: number,
    y: number,
    w: number,
    h: number,
    isDrawer: boolean,
    hingeSide?: 'left' | 'right'
  ) => {
    partsSvg.push(
      `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" fill="none" stroke="${ink}" stroke-width="1.25"/>`
    );

    // Door profile details across all 8 door styles
    if ((spec.doorStyle === 'shaker' || spec.doorStyle === 'slim-shaker') && w > 20 && h > 20) {
      const targetSt = spec.doorStyle === 'slim-shaker' ? px(22) : px(54);
      const st = Math.min(targetSt, w * 0.22, h * 0.24);
      partsSvg.push(
        `<rect x="${(x + st).toFixed(1)}" y="${(y + st).toFixed(1)}" width="${(w - st * 2).toFixed(1)}" height="${(h - st * 2).toFixed(1)}" fill="none" stroke="${inkSoft}" stroke-width="0.75"/>`
      );
    } else if (spec.doorStyle === 'raised-panel' && w > 26 && h > 26) {
      const st = Math.min(px(54), w * 0.22, h * 0.24);
      const bev = Math.min(px(24), (w - st * 2) * 0.2, (h - st * 2) * 0.2);
      partsSvg.push(
        `<rect x="${(x + st).toFixed(1)}" y="${(y + st).toFixed(1)}" width="${(w - st * 2).toFixed(1)}" height="${(h - st * 2).toFixed(1)}" fill="none" stroke="${inkSoft}" stroke-width="0.8"/>`,
        `<rect x="${(x + st + bev).toFixed(1)}" y="${(y + st + bev).toFixed(1)}" width="${(w - (st + bev) * 2).toFixed(1)}" height="${(h - (st + bev) * 2).toFixed(1)}" fill="none" stroke="${inkSoft}" stroke-width="0.65"/>`
      );
    } else if (spec.doorStyle === 'glass-mullion' && !isDrawer && w > 24 && h > 24) {
      const st = Math.min(px(48), w * 0.22, h * 0.22);
      const gx = x + st;
      const gy = y + st;
      const gw = w - st * 2;
      const gh = h - st * 2;
      partsSvg.push(
        `<rect x="${gx.toFixed(1)}" y="${gy.toFixed(1)}" width="${gw.toFixed(1)}" height="${gh.toFixed(1)}" fill="${hatchFill}" stroke="${inkSoft}" stroke-width="0.85"/>`,
        // Subtle glazing sheen slash lines
        `<line x1="${(gx + gw * 0.22).toFixed(1)}" y1="${(gy + gh * 0.32).toFixed(1)}" x2="${(gx + gw * 0.36).toFixed(1)}" y2="${(gy + gh * 0.18).toFixed(1)}" stroke="${inkSoft}" stroke-width="0.6" opacity="0.7"/>`,
        `<line x1="${(gx + gw * 0.28).toFixed(1)}" y1="${(gy + gh * 0.34).toFixed(1)}" x2="${(gx + gw * 0.42).toFixed(1)}" y2="${(gy + gh * 0.20).toFixed(1)}" stroke="${inkSoft}" stroke-width="0.6" opacity="0.7"/>`
      );
      if (gw > 36) {
        partsSvg.push(
          `<line x1="${(gx + gw / 2).toFixed(1)}" y1="${gy.toFixed(1)}" x2="${(gx + gw / 2).toFixed(1)}" y2="${(gy + gh).toFixed(1)}" stroke="${ink}" stroke-width="1"/>`
        );
      }
      partsSvg.push(
        `<line x1="${gx.toFixed(1)}" y1="${(gy + gh / 2).toFixed(1)}" x2="${(gx + gw).toFixed(1)}" y2="${(gy + gh / 2).toFixed(1)}" stroke="${ink}" stroke-width="1"/>`
      );
    } else if (spec.doorStyle === 'louvered' && !isDrawer && w > 24 && h > 26) {
      const st = Math.min(px(46), w * 0.22, h * 0.22);
      const lx = x + st;
      const ly = y + st;
      const lw = w - st * 2;
      const lh = h - st * 2;
      partsSvg.push(
        `<rect x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" width="${lw.toFixed(1)}" height="${lh.toFixed(1)}" fill="none" stroke="${inkSoft}" stroke-width="0.8"/>`
      );
      const pitch = Math.max(5.5, px(24));
      for (let sy = ly + pitch; sy < ly + lh - 2; sy += pitch) {
        partsSvg.push(
          `<line x1="${(lx + 1).toFixed(1)}" y1="${sy.toFixed(1)}" x2="${(lx + lw - 1).toFixed(1)}" y2="${sy.toFixed(1)}" stroke="${inkSoft}" stroke-width="0.65" opacity="0.8"/>`
        );
      }
    } else if (spec.doorStyle === 'beveled' && w > 20 && h > 20) {
      const bev = Math.min(6, w * 0.1);
      partsSvg.push(
        `<rect x="${(x + bev).toFixed(1)}" y="${(y + bev).toFixed(1)}" width="${(w - bev * 2).toFixed(1)}" height="${(h - bev * 2).toFixed(1)}" fill="none" stroke="${inkSoft}" stroke-width="0.6"/>`
      );
    } else if (spec.doorStyle === 'fluted' && w > 18) {
      const pitch = Math.max(4.5, px(18));
      for (let fx = x + pitch; fx < x + w - 2; fx += pitch) {
        partsSvg.push(
          `<line x1="${fx.toFixed(1)}" y1="${(y + 1).toFixed(1)}" x2="${fx.toFixed(1)}" y2="${(y + h - 1).toFixed(1)}" stroke="${inkSoft}" stroke-width="0.45" opacity="0.65"/>`
        );
      }
    }

    // Exposed / Semi-Concealed Hinge Markers along door hinge edge
    if (!isDrawer && hingeSide && hingeDef.visibility !== 'Concealed') {
      const hx = hingeSide === 'left' ? x - 1.8 : x + w - 1.8;
      if (spec.hingeType === 'piano-continuous') {
        partsSvg.push(
          `<rect x="${hx.toFixed(1)}" y="${(y + 4).toFixed(1)}" width="3.6" height="${Math.max(8, h - 8).toFixed(1)}" fill="${dimCol}" opacity="0.85"/>`
        );
      } else if (spec.hingeType === 'knife-pivot') {
        const kx = hingeSide === 'left' ? x + 1 : x + w - 10;
        partsSvg.push(
          `<rect x="${kx.toFixed(1)}" y="${(y - 1.5).toFixed(1)}" width="9" height="2.4" fill="${dimCol}"/>`,
          `<rect x="${kx.toFixed(1)}" y="${(y + h - 0.9).toFixed(1)}" width="9" height="2.4" fill="${dimCol}"/>`
        );
      } else {
        // Butt mortise or wrap-around barrel ticks
        const offset = Math.min(px(90), h * 0.22);
        [y + offset - 7, y + h - offset - 7].forEach((hy) => {
          partsSvg.push(
            `<rect x="${hx.toFixed(1)}" y="${hy.toFixed(1)}" width="3.6" height="14" rx="1" fill="${dimCol}"/>`
          );
        });
      }
    }

    // European architectural hinge swing triangle (dashed lines pointing to hinge side)
    if (options.showSwingArcs && !isDrawer && hingeSide) {
      const hingeX = hingeSide === 'left' ? x : x + w;
      const openX = hingeSide === 'left' ? x + w : x;
      const midY = y + h / 2;
      partsSvg.push(`
        <polyline points="${hingeX.toFixed(1)},${y.toFixed(1)} ${openX.toFixed(1)},${midY.toFixed(1)} ${hingeX.toFixed(1)},${(y + h).toFixed(1)}" fill="none" stroke="${dimCol}" stroke-width="0.7" stroke-dasharray="5 3.5" opacity="0.75"/>
      `);
    }

    // Hardware indicator
    if (spec.hardwareStyle !== 'push-to-open') {
      if (isDrawer) {
        const cx = x + w / 2;
        const cy = spec.hardwareStyle === 'edge-pull' ? y + 3 : y + Math.min(h * 0.38, px(48));
        if (spec.hardwareStyle === 'knob') {
          partsSvg.push(`<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="2.8" fill="none" stroke="${ink}" stroke-width="1.1"/>`);
        } else {
          const pullW = Math.min(w * 0.42, px(160));
          partsSvg.push(`<line x1="${(cx - pullW / 2).toFixed(1)}" y1="${cy.toFixed(1)}" x2="${(cx + pullW / 2).toFixed(1)}" y2="${cy.toFixed(1)}" stroke="${ink}" stroke-width="2"/>`);
        }
      } else if (hingeSide) {
        const pullX = hingeSide === 'left' ? x + w - Math.max(8, px(30)) : x + Math.max(8, px(30));
        const pullY = spec.typology === 'wall' ? y + h - Math.max(18, px(75)) : y + Math.max(18, px(75));
        if (spec.hardwareStyle === 'knob') {
          partsSvg.push(`<circle cx="${pullX.toFixed(1)}" cy="${pullY.toFixed(1)}" r="2.8" fill="none" stroke="${ink}" stroke-width="1.1"/>`);
        } else if (spec.hardwareStyle === 'edge-pull') {
          const epW = Math.min(w * 0.35, px(110));
          const epX = hingeSide === 'left' ? x + w - epW - 4 : x + 4;
          const epY = spec.typology === 'wall' ? y + h - 3 : y + 3;
          partsSvg.push(`<line x1="${epX.toFixed(1)}" y1="${epY.toFixed(1)}" x2="${(epX + epW).toFixed(1)}" y2="${epY.toFixed(1)}" stroke="${ink}" stroke-width="2"/>`);
        } else {
          const pullH = Math.min(h * 0.35, px(160));
          partsSvg.push(`<line x1="${pullX.toFixed(1)}" y1="${(pullY - pullH * 0.2).toFixed(1)}" x2="${pullX.toFixed(1)}" y2="${(pullY + pullH * 0.8).toFixed(1)}" stroke="${ink}" stroke-width="2"/>`);
        }
      }
    }
  };

  calc.bayGeometries.forEach((bayGeo, idx) => {
    const fx = frontOriginX + px(bayGeo.frontLeftMm);
    const fw = px(bayGeo.frontWidthMm);
    const fy = frontCarcTopY + insetTopBotTrimPx + gapPx;
    const fh = Math.max(30, carcH - insetTopBotTrimPx * 2 - gapPx * 2);
    const innerX = frontOriginX + px(bayGeo.innerLeftMm);
    const innerW = px(bayGeo.innerWidthMm);

    // Draw interior divider hidden lines between bays
    if (idx > 0 && options.showHiddenLines) {
      const divX = innerX - tPx;
      partsSvg.push(`
        <rect x="${divX.toFixed(1)}" y="${(frontCarcTopY + tPx).toFixed(1)}" width="${tPx.toFixed(1)}" height="${(carcH - tPx * 2).toFixed(1)}" fill="none" stroke="${hiddenCol}" stroke-width="0.65" stroke-dasharray="4 3"/>
      `);
    }

    const { layout, shelfCount } = bayGeo.bay;

    // Draw shelves (solid if open-shelves, dashed if behind doors)
    if (shelfCount > 0 && layout !== 'three-drawers' && layout !== 'four-drawers') {
      const startY =
        layout === 'drawer-and-doors'
          ? frontCarcTopY + Math.min(px(180), fh * 0.24) + gapPx
          : frontCarcTopY + tPx;
      const spanH = frontCarcBotY - tPx - startY;
      for (let s = 1; s <= shelfCount; s++) {
        const sy = startY + (spanH * s) / (shelfCount + 1);
        if (layout === 'open-shelves') {
          partsSvg.push(
            `<rect x="${innerX.toFixed(1)}" y="${(sy - tPx / 2).toFixed(1)}" width="${innerW.toFixed(1)}" height="${tPx.toFixed(1)}" fill="${hatchFill}" stroke="${ink}" stroke-width="1.1"/>`
          );
        } else if (options.showHiddenLines) {
          partsSvg.push(
            `<line x1="${innerX.toFixed(1)}" y1="${sy.toFixed(1)}" x2="${(innerX + innerW).toFixed(1)}" y2="${sy.toFixed(1)}" stroke="${hiddenCol}" stroke-width="0.7" stroke-dasharray="3 3"/>`
          );
        }
      }
    }

    if (layout === 'double-doors') {
      const eachW = (fw - gapPx) / 2;
      drawFrontPanel(fx, fy, eachW, fh, false, 'left');
      drawFrontPanel(fx + eachW + gapPx, fy, eachW, fh, false, 'right');
    } else if (layout === 'single-door-left') {
      drawFrontPanel(fx, fy, fw, fh, false, 'left');
    } else if (layout === 'single-door-right') {
      drawFrontPanel(fx, fy, fw, fh, false, 'right');
    } else if (layout === 'drawer-and-doors') {
      const dH = Math.min(px(180), fh * 0.24);
      const lowH = fh - dH - gapPx;
      const eachW = (fw - gapPx) / 2;
      drawFrontPanel(fx, fy, fw, dH, true);
      drawFrontPanel(fx, fy + dH + gapPx, eachW, lowH, false, 'left');
      drawFrontPanel(fx + eachW + gapPx, fy + dH + gapPx, eachW, lowH, false, 'right');
    } else if (layout === 'three-drawers' || layout === 'four-drawers') {
      const count = layout === 'three-drawers' ? 3 : 4;
      const weights = count === 3 ? [0.24, 0.38, 0.38] : [0.19, 0.23, 0.28, 0.3];
      const avail = fh - gapPx * (count - 1);
      let cy = fy;
      weights.forEach((w) => {
        const dh = avail * w;
        drawFrontPanel(fx, cy, fw, dh, true);
        cy += dh + gapPx;
      });
    } else if (layout === 'open-shelves') {
      partsSvg.push(
        `<rect x="${innerX.toFixed(1)}" y="${(frontCarcTopY + tPx).toFixed(1)}" width="${innerW.toFixed(1)}" height="${(carcH - tPx * 2).toFixed(1)}" fill="none" stroke="${ink}" stroke-width="1"/>`
      );
    }

    // Bay center tag below baseline if multiple bays
    if (options.showDimensions && calc.bayGeometries.length > 1) {
      partsSvg.push(
        svgDimH(
          fx,
          fx + fw,
          frontBottomY + 26,
          frontBottomY,
          formatDimCompact(bayGeo.frontWidthMm, spec.unit),
          dimCol,
          bg
        )
      );
    }
  });

  // Front Elevation primary dimension chains
  if (options.showDimensions) {
    // Overall width (top)
    partsSvg.push(
      svgDimH(
        frontOriginX,
        frontOriginX + cabW,
        frontTopY - 26,
        frontTopY,
        formatDim(spec.widthMm, spec.unit),
        dimCol,
        bg
      )
    );
    // Overall height (left outer)
    partsSvg.push(
      svgDimV(
        frontTopY,
        frontBottomY,
        frontOriginX - 54,
        frontOriginX,
        formatDim(spec.heightMm, spec.unit),
        dimCol,
        bg
      )
    );
    // Carcass height (left inner)
    partsSvg.push(
      svgDimV(
        frontCarcTopY,
        frontCarcBotY,
        frontOriginX - 24,
        frontOriginX,
        formatDimCompact(calc.carcassHeightMm, spec.unit),
        dimCol,
        bg
      )
    );
    // Toe kick / legs height
    if (calc.carcassBottomY > 0) {
      partsSvg.push(
        svgDimV(
          frontCarcBotY,
          frontBottomY,
          frontOriginX - 24,
          frontOriginX,
          formatDimCompact(calc.carcassBottomY, spec.unit),
          dimCol,
          bg
        )
      );
    }
  }
  partsSvg.push(`</g>`);

  // --- 2. SIDE CROSS-SECTION A-A ---
  // Left = Rear wall, Right = Front door face
  const sideCarcLeftX = sideOriginX;
  const sideCarcRightX = sideOriginX + carcD;
  const sideFrontRightX = sideOriginX + cabD;
  const backRecessPx = px(12);

  partsSvg.push(`
    <g id="side-section">
      <text x="${sideOriginX.toFixed(1)}" y="68" font-family="'Plus Jakarta Sans', sans-serif" font-size="13" font-weight="700" fill="${ink}" letter-spacing="0.04em">02. SECTION A–A (SIDE)</text>
      <text x="${sideOriginX.toFixed(1)}" y="83" font-family="'IBM Plex Mono', monospace" font-size="9.5" fill="${inkSoft}">Carcass ${formatDim(calc.carcassDepthMm, spec.unit)} + Front ${formatDim(spec.frontThicknessMm, spec.unit)}</text>
      <line x1="${(sideOriginX - 24).toFixed(1)}" y1="${sideBottomY.toFixed(1)}" x2="${(sideFrontRightX + 34).toFixed(1)}" y2="${sideBottomY.toFixed(1)}" stroke="${inkSoft}" stroke-width="0.9" stroke-dasharray="10 4 2 4"/>
  `);

  // Base in section
  if (spec.baseStyle === 'toe-kick' && calc.carcassBottomY > 0) {
    const kickFrontX = sideCarcRightX - px(spec.toeKickRecessMm);
    partsSvg.push(`
      <rect x="${sideCarcLeftX.toFixed(1)}" y="${frontCarcBotY.toFixed(1)}" width="${(kickFrontX - sideCarcLeftX).toFixed(1)}" height="${baseH.toFixed(1)}" fill="${hatchFill}" stroke="${ink}" stroke-width="1.2"/>
      <rect x="${(kickFrontX - tPx).toFixed(1)}" y="${frontCarcBotY.toFixed(1)}" width="${tPx.toFixed(1)}" height="${baseH.toFixed(1)}" fill="none" stroke="${ink}" stroke-width="1.2"/>
    `);
  } else if (spec.baseStyle === 'steel-legs' && calc.carcassBottomY > 0) {
    const legW = Math.max(5, px(24));
    const inset = px(40);
    [sideCarcLeftX + inset, sideCarcRightX - inset - legW].forEach((lx) => {
      partsSvg.push(`
        <rect x="${lx.toFixed(1)}" y="${frontCarcBotY.toFixed(1)}" width="${legW.toFixed(1)}" height="${baseH.toFixed(1)}" fill="${hatchFill}" stroke="${ink}" stroke-width="1.2"/>
      `);
    });
  }

  // Outer carcass box in section
  partsSvg.push(`
    <rect x="${sideCarcLeftX.toFixed(1)}" y="${frontCarcTopY.toFixed(1)}" width="${carcD.toFixed(1)}" height="${carcH.toFixed(1)}" fill="none" stroke="${ink}" stroke-width="1.7"/>
  `);

  // Cutaway bottom deck, top deck/stretchers, recessed back panel
  partsSvg.push(`
    <rect x="${sideCarcLeftX.toFixed(1)}" y="${(frontCarcBotY - tPx).toFixed(1)}" width="${carcD.toFixed(1)}" height="${tPx.toFixed(1)}" fill="${hatchFill}" stroke="${ink}" stroke-width="1.1"/>
  `);
  if (spec.typology === 'base' || spec.typology === 'vanity') {
    const stretcherW = px(100);
    partsSvg.push(`
      <rect x="${sideCarcLeftX.toFixed(1)}" y="${frontCarcTopY.toFixed(1)}" width="${stretcherW.toFixed(1)}" height="${tPx.toFixed(1)}" fill="${hatchFill}" stroke="${ink}" stroke-width="1.1"/>
      <rect x="${(sideCarcRightX - stretcherW).toFixed(1)}" y="${frontCarcTopY.toFixed(1)}" width="${stretcherW.toFixed(1)}" height="${tPx.toFixed(1)}" fill="${hatchFill}" stroke="${ink}" stroke-width="1.1"/>
    `);
  } else {
    partsSvg.push(`
      <rect x="${sideCarcLeftX.toFixed(1)}" y="${frontCarcTopY.toFixed(1)}" width="${carcD.toFixed(1)}" height="${tPx.toFixed(1)}" fill="${hatchFill}" stroke="${ink}" stroke-width="1.1"/>
    `);
  }

  // Recessed back panel
  const backX = sideCarcLeftX + backRecessPx;
  partsSvg.push(`
    <rect x="${backX.toFixed(1)}" y="${(frontCarcTopY + tPx - 2).toFixed(1)}" width="${backTPx.toFixed(1)}" height="${(carcH - tPx * 2 + 4).toFixed(1)}" fill="${inkSoft}" opacity="0.55" stroke="${ink}" stroke-width="0.9"/>
  `);

  // Front door/drawer thickness profile
  partsSvg.push(`
    <rect x="${(sideCarcRightX + 1.2).toFixed(1)}" y="${(frontCarcTopY + gapPx).toFixed(1)}" width="${frontTPx.toFixed(1)}" height="${(carcH - gapPx * 2).toFixed(1)}" fill="${hatchFill}" stroke="${ink}" stroke-width="1.35"/>
  `);

  // Countertop in section
  if (countertopT > 0) {
    partsSvg.push(`
      <rect x="${sideCarcLeftX.toFixed(1)}" y="${sideTopY.toFixed(1)}" width="${(cabD + ctOver).toFixed(1)}" height="${ctH.toFixed(1)}" fill="${hatchFill}" stroke="${ink}" stroke-width="1.6"/>
    `);
  }

  // Interior shelves in section (from first bay with shelves)
  const sampleShelfBay = spec.bays.find((b) => b.shelfCount > 0) ?? spec.bays[0];
  if (sampleShelfBay && sampleShelfBay.shelfCount > 0) {
    const shelfStartX = backX + backTPx + 1;
    const shelfW = sideCarcRightX - px(20) - shelfStartX;
    const spanH = carcH - tPx * 2;
    for (let s = 1; s <= sampleShelfBay.shelfCount; s++) {
      const sy = frontCarcTopY + tPx + (spanH * s) / (sampleShelfBay.shelfCount + 1);
      partsSvg.push(`
        <rect x="${shelfStartX.toFixed(1)}" y="${(sy - tPx / 2).toFixed(1)}" width="${shelfW.toFixed(1)}" height="${tPx.toFixed(1)}" fill="${hatchFill}" stroke="${ink}" stroke-width="1.05"/>
      `);
    }
  }

  // 32mm shelf-pin boring grid visualization in section
  if (options.showBoringGrid) {
    const holeFrontX = sideCarcRightX - px(37); // Standard 37mm System 32 front setback
    const holeRearX = backX + backTPx + px(37);
    const step32 = px(32);
    const startH = frontCarcTopY + tPx + px(80);
    const endH = frontCarcBotY - tPx - px(80);
    if (step32 >= 3.5 && holeFrontX > holeRearX + 10) {
      for (let hy = startH; hy <= endH; hy += step32) {
        partsSvg.push(`<circle cx="${holeFrontX.toFixed(1)}" cy="${hy.toFixed(1)}" r="1.45" fill="${dimCol}" opacity="0.8"/>`);
        partsSvg.push(`<circle cx="${holeRearX.toFixed(1)}" cy="${hy.toFixed(1)}" r="1.45" fill="${dimCol}" opacity="0.8"/>`);
      }
    }
  }

  // Side section dimensions
  if (options.showDimensions) {
    partsSvg.push(
      svgDimH(
        sideCarcLeftX,
        sideFrontRightX,
        sideTopY - 26,
        sideTopY,
        formatDim(spec.depthMm, spec.unit),
        dimCol,
        bg
      )
    );
    partsSvg.push(
      svgDimH(
        sideCarcLeftX,
        sideCarcRightX,
        sideBottomY + 24,
        sideBottomY,
        formatDimCompact(calc.carcassDepthMm, spec.unit),
        dimCol,
        bg
      )
    );
    if (spec.baseStyle === 'toe-kick' && spec.toeKickRecessMm > 0) {
      partsSvg.push(
        svgDimH(
          sideCarcRightX - px(spec.toeKickRecessMm),
          sideCarcRightX,
          sideBottomY + 48,
          sideBottomY,
          `Kick ${formatDimCompact(spec.toeKickRecessMm, spec.unit)}`,
          dimCol,
          bg
        )
      );
    }
  }
  partsSvg.push(`</g>`);

  // --- 3. TOP PLAN VIEW ---
  partsSvg.push(`
    <g id="top-plan">
      <text x="${planOriginX.toFixed(1)}" y="635" font-family="'Plus Jakarta Sans', sans-serif" font-size="13" font-weight="700" fill="${ink}" letter-spacing="0.04em">03. TOP PLAN SECTION</text>
      <text x="${planOriginX.toFixed(1)}" y="650" font-family="'IBM Plex Mono', monospace" font-size="9.5" fill="${inkSoft}">Horizontal cut · ${spec.bays.length} Bay${spec.bays.length > 1 ? 's' : ''} · ${spec.construction === 'frameless' ? 'Frameless 32mm' : 'Face-Frame'}</text>
  `);

  // Carcass outer shell in plan (top = rear wall, bottom = front door face)
  partsSvg.push(`
    <rect x="${planOriginX.toFixed(1)}" y="${planTopY.toFixed(1)}" width="${cabW.toFixed(1)}" height="${carcD.toFixed(1)}" fill="none" stroke="${ink}" stroke-width="1.6"/>
    <rect x="${planOriginX.toFixed(1)}" y="${planTopY.toFixed(1)}" width="${tPx.toFixed(1)}" height="${carcD.toFixed(1)}" fill="${hatchFill}" stroke="${ink}" stroke-width="1"/>
    <rect x="${(planOriginX + cabW - tPx).toFixed(1)}" y="${planTopY.toFixed(1)}" width="${tPx.toFixed(1)}" height="${carcD.toFixed(1)}" fill="${hatchFill}" stroke="${ink}" stroke-width="1"/>
    <rect x="${(planOriginX + tPx - 1.5).toFixed(1)}" y="${(planTopY + backRecessPx).toFixed(1)}" width="${(cabW - tPx * 2 + 3).toFixed(1)}" height="${backTPx.toFixed(1)}" fill="${inkSoft}" opacity="0.55" stroke="${ink}" stroke-width="0.8"/>
  `);

  // Dividers and front slabs + 90 deg plan swing arcs
  calc.bayGeometries.forEach((bg, idx) => {
    if (idx > 0) {
      const divX = planOriginX + px(bg.innerLeftMm) - tPx;
      partsSvg.push(`
        <rect x="${divX.toFixed(1)}" y="${(planTopY + backRecessPx + backTPx).toFixed(1)}" width="${tPx.toFixed(1)}" height="${(carcD - backRecessPx - backTPx).toFixed(1)}" fill="${hatchFill}" stroke="${ink}" stroke-width="1"/>
      `);
    }

    const fx = planOriginX + px(bg.frontLeftMm);
    const fw = px(bg.frontWidthMm);
    const fy = planTopY + carcD + 1.2;

    if (bg.bay.layout !== 'open-shelves') {
      if (bg.bay.layout === 'double-doors' || bg.bay.layout === 'drawer-and-doors') {
        const eachW = (fw - gapPx) / 2;
        partsSvg.push(`
          <rect x="${fx.toFixed(1)}" y="${fy.toFixed(1)}" width="${eachW.toFixed(1)}" height="${frontTPx.toFixed(1)}" fill="${hatchFill}" stroke="${ink}" stroke-width="1.15"/>
          <rect x="${(fx + eachW + gapPx).toFixed(1)}" y="${fy.toFixed(1)}" width="${eachW.toFixed(1)}" height="${frontTPx.toFixed(1)}" fill="${hatchFill}" stroke="${ink}" stroke-width="1.15"/>
        `);
        if (options.showSwingArcs) {
          const r = Math.min(eachW, 70);
          partsSvg.push(`
            <path d="M ${(fx + r).toFixed(1)} ${(fy + frontTPx).toFixed(1)} A ${r.toFixed(1)} ${r.toFixed(1)} 0 0 1 ${fx.toFixed(1)} ${(fy + frontTPx + r).toFixed(1)}" fill="none" stroke="${dimCol}" stroke-width="0.7" stroke-dasharray="4 3" opacity="0.7"/>
            <path d="M ${(fx + fw - r).toFixed(1)} ${(fy + frontTPx).toFixed(1)} A ${r.toFixed(1)} ${r.toFixed(1)} 0 0 0 ${(fx + fw).toFixed(1)} ${(fy + frontTPx + r).toFixed(1)}" fill="none" stroke="${dimCol}" stroke-width="0.7" stroke-dasharray="4 3" opacity="0.7"/>
          `);
        }
      } else {
        partsSvg.push(`
          <rect x="${fx.toFixed(1)}" y="${fy.toFixed(1)}" width="${fw.toFixed(1)}" height="${frontTPx.toFixed(1)}" fill="${hatchFill}" stroke="${ink}" stroke-width="1.15"/>
        `);
      }
    }
  });

  if (options.showDimensions) {
    partsSvg.push(
      svgDimV(
        planTopY,
        planTopY + cabD,
        planOriginX - 32,
        planOriginX,
        formatDim(spec.depthMm, spec.unit),
        dimCol,
        bg
      )
    );
  }
  partsSvg.push(`</g>`);

  // --- 4. MANUFACTURING SPECIFICATION & TITLE BLOCK (Bottom Right) ---
  const tbX = 910;
  const tbY = 620;
  const tbW = 456;
  const tbH = 336;
  const todayStr = new Date().toISOString().slice(0, 10);

  const notesBlock = `
    <g id="title-and-spec-block">
      <!-- Outer box -->
      <rect x="${tbX}" y="${tbY}" width="${tbW}" height="${tbH}" fill="${bg}" stroke="${borderCol}" stroke-width="1.6"/>

      <!-- Specification Summary (top portion) -->
      <text x="${tbX + 16}" y="${tbY + 24}" font-family="'Plus Jakarta Sans', sans-serif" font-size="11" font-weight="700" fill="${ink}" letter-spacing="0.06em">MANUFACTURING SPECIFICATIONS</text>
      <line x1="${tbX}" y1="${tbY + 34}" x2="${tbX + tbW}" y2="${tbY + 34}" stroke="${borderCol}" stroke-width="0.9"/>

      <g font-family="'IBM Plex Mono', monospace" font-size="9.5" fill="${ink}">
        <text x="${tbX + 16}" y="${tbY + 52}"><tspan fill="${inkSoft}">STYLE:   </tspan> ${escXml(styleDef.shortName)} · ${escXml(doorDef.name)} (${escXml(doorMount)})</text>
        <text x="${tbX + 16}" y="${tbY + 69}"><tspan fill="${inkSoft}">HINGES:  </tspan> ${escXml(hingeDef.name)} (${hingeDef.openingAngleDeg}°)</text>
        <text x="${tbX + 16}" y="${tbY + 86}"><tspan fill="${inkSoft}">EXTERIOR:</tspan> ${escXml(extMat.name)} (${spec.frontThicknessMm}mm)</text>
        <text x="${tbX + 16}" y="${tbY + 103}"><tspan fill="${inkSoft}">CARCASS: </tspan> ${escXml(intMat.name)} (${spec.carcassThicknessMm}mm) · Back ${spec.backThicknessMm}mm</text>
        <text x="${tbX + 16}" y="${tbY + 120}"><tspan fill="${inkSoft}">JOINERY: </tspan> ${escXml(spec.construction.toUpperCase())} · ${escXml(spec.joinery.toUpperCase())} · Gap ${spec.revealGapMm}mm</text>
        <text x="${tbX + 16}" y="${tbY + 137}"><tspan fill="${inkSoft}">HARDWARE:</tspan> ${escXml(spec.hardwareStyle)} · ${escXml(hwFinish.name)}</text>
        <text x="${tbX + 16}" y="${tbY + 154}"><tspan fill="${inkSoft}">CUT LIST:</tspan> ${calc.totalPanelCount} panels · ${calc.totalSheetCount} sheets (${SHEET_DIMENSIONS[spec.sheetSize].widthMm}×${SHEET_DIMENSIONS[spec.sheetSize].heightMm}mm)</text>
        <text x="${tbX + 16}" y="${tbY + 170}"><tspan fill="${inkSoft}">BANDING: </tspan> ${calc.totalEdgeBandingM.toFixed(1)} m (1mm) · ${calc.totalBoringHoles} CNC bore holes</text>
      </g>

      <line x1="${tbX}" y1="${tbY + 178}" x2="${tbX + tbW}" y2="${tbY + 178}" stroke="${borderCol}" stroke-width="1.2"/>

      <!-- Shop Notes -->
      <text x="${tbX + 16}" y="${tbY + 196}" font-family="'IBM Plex Mono', monospace" font-size="8.5" fill="${inkSoft}">SHOP NOTES:</text>
      <text x="${tbX + 16}" y="${tbY + 212}" font-family="'Public Sans', sans-serif" font-size="10" fill="${ink}">${escXml(spec.notes.slice(0, 74))}</text>
      ${spec.notes.length > 74 ? `<text x="${tbX + 16}" y="${tbY + 226}" font-family="'Public Sans', sans-serif" font-size="10" fill="${ink}">${escXml(spec.notes.slice(74, 148))}</text>` : ''}

      <line x1="${tbX}" y1="${tbY + 240}" x2="${tbX + tbW}" y2="${tbY + 240}" stroke="${borderCol}" stroke-width="1.4"/>

      <!-- Title Block Grid -->
      <text x="${tbX + 16}" y="${tbY + 260}" font-family="'IBM Plex Mono', monospace" font-size="8.5" fill="${inkSoft}">PROJECT / CABINET TITLE</text>
      <text x="${tbX + 16}" y="${tbY + 281}" font-family="'Plus Jakarta Sans', sans-serif" font-size="15" font-weight="700" fill="${ink}">${escXml(spec.projectName)}</text>

      <line x1="${tbX}" y1="${tbY + 294}" x2="${tbX + tbW}" y2="${tbY + 294}" stroke="${borderCol}" stroke-width="0.9"/>
      <line x1="${tbX + 150}" y1="${tbY + 294}" x2="${tbX + 150}" y2="${tbY + tbH}" stroke="${borderCol}" stroke-width="0.9"/>
      <line x1="${tbX + 270}" y1="${tbY + 294}" x2="${tbX + 270}" y2="${tbY + tbH}" stroke="${borderCol}" stroke-width="0.9"/>
      <line x1="${tbX + 365}" y1="${tbY + 294}" x2="${tbX + 365}" y2="${tbY + tbH}" stroke="${borderCol}" stroke-width="0.9"/>

      <text x="${tbX + 12}" y="${tbY + 308}" font-family="'IBM Plex Mono', monospace" font-size="8" fill="${inkSoft}">DRAWING NO.</text>
      <text x="${tbX + 12}" y="${tbY + 324}" font-family="'IBM Plex Mono', monospace" font-size="11" font-weight="600" fill="${ink}">${escXml(spec.drawingNumber)}</text>

      <text x="${tbX + 160}" y="${tbY + 308}" font-family="'IBM Plex Mono', monospace" font-size="8" fill="${inkSoft}">DATE / CLIENT</text>
      <text x="${tbX + 160}" y="${tbY + 324}" font-family="'IBM Plex Mono', monospace" font-size="10" fill="${ink}">${todayStr}</text>

      <text x="${tbX + 280}" y="${tbY + 308}" font-family="'IBM Plex Mono', monospace" font-size="8" fill="${inkSoft}">SCALE / UNIT</text>
      <text x="${tbX + 280}" y="${tbY + 324}" font-family="'IBM Plex Mono', monospace" font-size="10.5" fill="${ink}">1:${ratioApprox} (${spec.unit})</text>

      <text x="${tbX + 375}" y="${tbY + 308}" font-family="'IBM Plex Mono', monospace" font-size="8" fill="${inkSoft}">REV / SHEET</text>
      <text x="${tbX + 375}" y="${tbY + 324}" font-family="'IBM Plex Mono', monospace" font-size="10.5" font-weight="600" fill="${dimCol}">${escXml(spec.revision)} · 1/1</text>
    </g>
  `;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <defs>
    <pattern id="bp-grid" width="28" height="28" patternUnits="userSpaceOnUse">
      <path d="M 28 0 L 0 0 0 28" fill="none" stroke="${gridCol}" stroke-width="0.8"/>
    </pattern>
  </defs>
  <rect width="${W}" height="${H}" fill="${bg}" />
  <rect x="24" y="24" width="${W - 48}" height="${H - 48}" fill="url(#bp-grid)" stroke="${borderCol}" stroke-width="2"/>
  <rect x="30" y="30" width="${W - 60}" height="${H - 60}" fill="none" stroke="${borderCol}" stroke-width="0.7"/>

  <!-- Sheet Border Reference Ticks (Architectural Grid Zones) -->
  <g font-family="'IBM Plex Mono', monospace" font-size="8.5" fill="${inkSoft}" text-anchor="middle">
    <text x="200" y="20">A</text><text x="550" y="20">B</text><text x="900" y="20">C</text><text x="1220" y="20">D</text>
    <text x="14" y="240">1</text><text x="14" y="510">2</text><text x="14" y="790">3</text>
  </g>

  <!-- Subtle divider between Front/Plan and Section/Title columns -->
  <line x1="882" y1="30" x2="882" y2="${H - 30}" stroke="${gridCol}" stroke-width="1.2" stroke-dasharray="6 4"/>
  <line x1="30" y1="596" x2="882" y2="596" stroke="${gridCol}" stroke-width="1.2" stroke-dasharray="6 4"/>

  ${partsSvg.join('\n')}
  ${notesBlock}
</svg>`;
}

/**
 * Generates an authentic AutoCAD R12 ASCII DXF file in 1:1 millimeter coordinates.
 * Includes Front Elevation, Side Cross-Section, Top Plan, and Nested Cut Sheets on separate CAD layers.
 */
export function generateDXF(spec: CabinetSpec, calc: CabinetCalculation): string {
  const lines: string[] = [];

  const push = (...items: (string | number)[]) => {
    for (const item of items) lines.push(String(item));
  };

  const addLine = (layer: string, x1: number, y1: number, x2: number, y2: number, color = 7) => {
    push(
      0, 'LINE',
      8, layer,
      62, color,
      10, x1.toFixed(2),
      20, y1.toFixed(2),
      30, '0.0',
      11, x2.toFixed(2),
      21, y2.toFixed(2),
      31, '0.0'
    );
  };

  const addRect = (layer: string, x: number, y: number, w: number, h: number, color = 7) => {
    addLine(layer, x, y, x + w, y, color);
    addLine(layer, x + w, y, x + w, y + h, color);
    addLine(layer, x + w, y + h, x, y + h, color);
    addLine(layer, x, y + h, x, y, color);
  };

  const addCircle = (layer: string, cx: number, cy: number, r: number, color = 5) => {
    push(
      0, 'CIRCLE',
      8, layer,
      62, color,
      10, cx.toFixed(2),
      20, cy.toFixed(2),
      30, '0.0',
      40, r.toFixed(2)
    );
  };

  const addText = (layer: string, x: number, y: number, height: number, text: string, color = 3) => {
    push(
      0, 'TEXT',
      8, layer,
      62, color,
      10, x.toFixed(2),
      20, y.toFixed(2),
      30, '0.0',
      40, height.toFixed(1),
      1, text.replace(/[\r\n]/g, ' ')
    );
  };

  // DXF Header (R12 AC1009 — universally compatible with AutoCAD, Fusion 360, QCAD, VCarve)
  push(0, 'SECTION', 2, 'HEADER');
  push(9, '$ACADVER', 1, 'AC1009');
  push(9, '$INSUNITS', 70, 4); // 4 = Millimeters
  push(0, 'ENDSEC');

  push(0, 'SECTION', 2, 'ENTITIES');

  const t = spec.carcassThicknessMm;
  const gap = spec.revealGapMm;
  const ctH = spec.countertopEnabled && spec.typology !== 'wall' && spec.typology !== 'tall' ? spec.countertopThicknessMm : 0;
  const ctOver = ctH > 0 ? spec.countertopOverhangMm : 0;

  // 1. FRONT ELEVATION at origin (0, 0) -> (widthMm, heightMm)
  addText('ANNOTATIONS', 0, spec.heightMm + 90, 35, `FRONT ELEVATION - ${spec.projectName} (${spec.widthMm}x${spec.heightMm}x${spec.depthMm}mm)`, 3);
  addRect('CABINET_FRONT', 0, calc.carcassBottomY, spec.widthMm, calc.carcassHeightMm, 7);
  if (calc.carcassBottomY > 0) {
    addRect('CABINET_FRONT', 0, 0, spec.widthMm, calc.carcassBottomY, 8);
  }
  if (ctH > 0) {
    addRect('CABINET_FRONT', -ctOver, spec.heightMm - ctH, spec.widthMm + ctOver * 2, ctH, 4);
  }

  // Bay fronts in DXF
  calc.bayGeometries.forEach((bg) => {
    const fx = bg.frontLeftMm;
    const fw = bg.frontWidthMm;
    const fy = calc.carcassBottomY + gap;
    const fh = calc.carcassHeightMm - gap * 2;

    if (bg.bay.layout === 'double-doors') {
      const ew = (fw - gap) / 2;
      addRect('CABINET_FRONT', fx, fy, ew, fh, 1);
      addRect('CABINET_FRONT', fx + ew + gap, fy, ew, fh, 1);
    } else if (bg.bay.layout === 'drawer-and-doors') {
      const dH = Math.min(180, Math.round(fh * 0.24));
      const lowH = fh - dH - gap;
      const ew = (fw - gap) / 2;
      addRect('CABINET_FRONT', fx, fy + lowH + gap, fw, dH, 1);
      addRect('CABINET_FRONT', fx, fy, ew, lowH, 1);
      addRect('CABINET_FRONT', fx + ew + gap, fy, ew, lowH, 1);
    } else if (bg.bay.layout === 'three-drawers' || bg.bay.layout === 'four-drawers') {
      const count = bg.bay.layout === 'three-drawers' ? 3 : 4;
      const weights = count === 3 ? [0.38, 0.38, 0.24] : [0.3, 0.28, 0.23, 0.19]; // bottom-up in DXF Y+
      const avail = fh - gap * (count - 1);
      let cy = fy;
      weights.forEach((w) => {
        const dh = avail * w;
        addRect('CABINET_FRONT', fx, cy, fw, dh, 1);
        cy += dh + gap;
      });
    } else if (bg.bay.layout !== 'open-shelves') {
      addRect('CABINET_FRONT', fx, fy, fw, fh, 1);
    }
  });

  // 2. SIDE CROSS-SECTION offset to X = widthMm + 400
  const sideX = spec.widthMm + 400;
  addText('ANNOTATIONS', sideX, spec.heightMm + 90, 35, 'SECTION A-A (SIDE)', 3);
  addRect('CABINET_SECTION', sideX, calc.carcassBottomY, calc.carcassDepthMm, calc.carcassHeightMm, 7);
  addRect('CABINET_SECTION', sideX + calc.carcassDepthMm, calc.carcassBottomY + gap, spec.frontThicknessMm, calc.carcassHeightMm - gap * 2, 1);
  // Recessed back panel
  addRect('CABINET_SECTION', sideX + 12, calc.carcassBottomY + t, spec.backThicknessMm, calc.carcassHeightMm - t * 2, 2);
  // 32mm shelf-pin boring circles in side section
  for (let hy = calc.carcassBottomY + t + 80; hy <= calc.carcassBottomY + calc.carcassHeightMm - t - 80; hy += 32) {
    addCircle('BORING_32MM', sideX + calc.carcassDepthMm - 37, hy, 2.5, 5);
    addCircle('BORING_32MM', sideX + 12 + spec.backThicknessMm + 37, hy, 2.5, 5);
  }

  // 3. TOP PLAN VIEW below Front Elevation at Y = -(depthMm + 350)
  const planY = -(spec.depthMm + 350);
  addText('ANNOTATIONS', 0, planY - 60, 35, 'TOP PLAN SECTION', 3);
  addRect('CABINET_PLAN', 0, planY, spec.widthMm, calc.carcassDepthMm, 7);
  addRect('CABINET_PLAN', 0, planY, t, calc.carcassDepthMm, 2);
  addRect('CABINET_PLAN', spec.widthMm - t, planY, t, calc.carcassDepthMm, 2);
  calc.bayGeometries.forEach((bg, idx) => {
    if (idx > 0) {
      addRect('CABINET_PLAN', bg.innerLeftMm - t, planY, t, calc.carcassDepthMm, 2);
    }
  });

  // 4. NESTED CNC CUT SHEETS laid out cleanly to the right (X = sideX + depthMm + 600)
  let sheetCursorY = 0;
  const sheetOriginX = sideX + spec.depthMm + 600;
  calc.sheets.forEach((sheet) => {
    addText(
      'ANNOTATIONS',
      sheetOriginX,
      sheetCursorY + sheet.sheetHeightMm + 45,
      32,
      `SHEET ${sheet.sheetIndex}: ${sheet.materialName} ${sheet.thicknessMm}mm (${sheet.utilizationPct.toFixed(1)}% yield)`,
      3
    );
    addRect('SHEET_BOUNDARY', sheetOriginX, sheetCursorY, sheet.sheetWidthMm, sheet.sheetHeightMm, 8);
    sheet.parts.forEach((p) => {
      addRect('CNC_CUT_PANELS', sheetOriginX + p.x, sheetCursorY + p.y, p.w, p.h, 6);
      addText('PART_LABELS', sheetOriginX + p.x + 12, sheetCursorY + p.y + p.h / 2, 18, `${p.code} (${Math.round(p.w)}x${Math.round(p.h)})`, 3);
    });
    sheetCursorY += sheet.sheetHeightMm + 220;
  });

  push(0, 'ENDSEC');
  push(0, 'EOF');

  return lines.join('\n');
}

export function generateCutListCSV(spec: CabinetSpec, calc: CabinetCalculation): string {
  const header = [
    'Part Code',
    'Component Name',
    'Group',
    'Material',
    'Thickness (mm)',
    'Length (mm)',
    'Width (mm)',
    'Qty',
    'Edge Banding',
    'Grain Locked',
    'Shop Notes',
  ];
  const rows = calc.parts.map((p) => [
    p.code,
    `"${p.name.replace(/"/g, '""')}"`,
    p.group,
    `"${p.materialName.replace(/"/g, '""')}"`,
    p.thicknessMm,
    p.lengthMm,
    p.widthMm,
    p.qty,
    p.edgeBanding,
    p.grainLocked ? 'Yes' : 'No',
    `"${p.notes.replace(/"/g, '""')}"`,
  ]);

  const meta = [
    `# Project,${spec.projectName}`,
    `# Drawing No,${spec.drawingNumber}`,
    `# Dimensions,${spec.widthMm} x ${spec.heightMm} x ${spec.depthMm} mm`,
    '',
  ];

  return [...meta, header.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

export function generateHardwareBOMCSV(spec: CabinetSpec, calc: CabinetCalculation): string {
  const header = ['Category', 'Item Name', 'Specification', 'Qty', 'Unit', 'Unit Cost (USD)', 'Subtotal (USD)'];
  const rows = calc.hardware.map((h) => [
    h.category,
    `"${h.name.replace(/"/g, '""')}"`,
    `"${h.spec.replace(/"/g, '""')}"`,
    h.qty,
    h.unit,
    h.unitPriceUsd.toFixed(2),
    h.totalPriceUsd.toFixed(2),
  ]);
  const summary = [
    '',
    `Sheet Goods Estimate,,,,,${calc.totalSheetCount} sheets,${calc.estimatedSheetCostUsd.toFixed(2)}`,
    `Hardware Estimate,,,,,,${calc.estimatedHardwareCostUsd.toFixed(2)}`,
    `Total Estimated Material & Hardware,,,,,,${calc.estimatedTotalCostUsd.toFixed(2)}`,
  ];
  return [
    `# Hardware & Bill of Materials - ${spec.projectName} (${spec.drawingNumber})`,
    '',
    header.join(','),
    ...rows.map((r) => r.join(',')),
    ...summary,
  ].join('\n');
}

export function downloadTextFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
