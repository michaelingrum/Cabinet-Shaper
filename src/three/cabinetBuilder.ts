import * as THREE from 'three';
import { CabinetCalculation, CabinetSpec } from '../types/cabinet';
import {
  CABINET_STYLES,
  EXTERIOR_MATERIALS,
  HARDWARE_FINISHES,
  HINGE_TYPES,
  getEffectiveInteriorMaterial,
  getDrawerSlideLengthMm,
} from '../engine/cabinetEngine';
import { createFinishTextureSet, ProceduralTextureSet } from './proceduralTextures';

const MM = 0.001; // 1 unit = 1 meter

export interface ExplodableEntry {
  object: THREE.Object3D;
  basePos: THREE.Vector3;
  explodeDelta: THREE.Vector3;
}

export interface HingedDoorEntry {
  pivot: THREE.Object3D;
  hingeSide: 'left' | 'right';
  maxAngleRad: number;
}

export interface SlidingDrawerEntry {
  group: THREE.Object3D;
  baseZ: number;
  travelZ: number;
}

export interface CabinetSceneBuild {
  root: THREE.Group;
  explodables: ExplodableEntry[];
  doors: HingedDoorEntry[];
  drawers: SlidingDrawerEntry[];
  frontMaterials: THREE.MeshPhysicalMaterial[];
  dispose: () => void;
}

/**
 * Builds a composite, physically-accurate multi-part 3D cabinet model pivoted at bottom-center (Y=0).
 * Every structural panel, shaker stile/rail, fluted slat, drawer box, shelf pin, leg, and handle
 * is built procedurally and rigged for smooth exploded-view and door/drawer opening kinematics.
 */
export function buildCabinet3D(
  spec: CabinetSpec,
  calc: CabinetCalculation,
  maxAnisotropy: number
): CabinetSceneBuild {
  const root = new THREE.Group();
  const explodables: ExplodableEntry[] = [];
  const doors: HingedDoorEntry[] = [];
  const drawers: SlidingDrawerEntry[] = [];
  const disposables: Array<{ dispose: () => void }> = [];
  const textures: ProceduralTextureSet[] = [];

  const extDef = EXTERIOR_MATERIALS[spec.exteriorMaterial];
  const intDef = getEffectiveInteriorMaterial(spec);
  const hwDef = HARDWARE_FINISHES[spec.hardwareFinish];

  // Procedural PBR textures
  const extTex = createFinishTextureSet(
    extDef.baseHex,
    extDef.grainHex,
    extDef.category === 'wood',
    maxAnisotropy,
    11
  );
  textures.push(extTex);

  const intTex = createFinishTextureSet(
    intDef.baseHex,
    intDef.grainHex,
    intDef.isWood,
    maxAnisotropy,
    29
  );
  textures.push(intTex);

  const drawerWoodTex = createFinishTextureSet('#E2CEAA', '#C6AB7D', true, maxAnisotropy, 43);
  textures.push(drawerWoodTex);

  // Materials with realistic roughness / metalness contrast (>= 0.25 contrast between timber and hardware)
  const exteriorMat = new THREE.MeshPhysicalMaterial({
    map: extTex.map,
    bumpMap: extTex.bumpMap,
    bumpScale: extDef.category === 'wood' ? 0.0022 : 0.0005,
    roughness: extDef.roughness,
    metalness: extDef.metalness,
    clearcoat: extDef.clearcoat,
    clearcoatRoughness: 0.32,
  });

  const frontMat = new THREE.MeshPhysicalMaterial({
    map: extTex.map,
    bumpMap: extTex.bumpMap,
    bumpScale: extDef.category === 'wood' ? 0.0024 : 0.0006,
    roughness: extDef.roughness,
    metalness: extDef.metalness,
    clearcoat: extDef.clearcoat,
    clearcoatRoughness: 0.3,
  });

  const interiorMat = new THREE.MeshStandardMaterial({
    map: intTex.map,
    bumpMap: intTex.bumpMap,
    bumpScale: intDef.isWood ? 0.0018 : 0.0003,
    roughness: intDef.isWood ? 0.65 : 0.45,
    metalness: 0.0,
  });

  const drawerBoxMat = new THREE.MeshStandardMaterial({
    map: drawerWoodTex.map,
    bumpMap: drawerWoodTex.bumpMap,
    bumpScale: 0.0018,
    roughness: 0.68,
    metalness: 0.0,
  });

  const hardwareMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(hwDef.hex),
    roughness: hwDef.roughness,
    metalness: hwDef.metalness,
    clearcoat: 0.15,
  });

  const steelRunnerMat = new THREE.MeshStandardMaterial({
    color: 0xa6adb8,
    roughness: 0.26,
    metalness: 0.88,
  });

  const countertopMat = new THREE.MeshPhysicalMaterial({
    color: 0xedece7,
    roughness: 0.28,
    metalness: 0.02,
    clearcoat: 0.35,
    clearcoatRoughness: 0.22,
  });

  // Architectural glass pane material (fast & clean across GPU + software WebGL)
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xdbe8ec,
    roughness: 0.08,
    metalness: 0.05,
    clearcoat: 1.0,
    clearcoatRoughness: 0.06,
    transparent: true,
    opacity: 0.32,
    depthWrite: false,
  });

  disposables.push(
    exteriorMat,
    frontMat,
    interiorMat,
    drawerBoxMat,
    hardwareMat,
    steelRunnerMat,
    countertopMat,
    glassMat
  );

  const styleDef = CABINET_STYLES[spec.cabinetStyle ?? 'modern-frameless'] ?? CABINET_STYLES['modern-frameless'];
  const hingeDef = HINGE_TYPES[spec.hingeType ?? 'concealed-110'] ?? HINGE_TYPES['concealed-110'];
  const doorMount = spec.doorMount ?? 'full-overlay';

  // Dimensions in meters
  const W = spec.widthMm * MM;
  const D = spec.depthMm * MM;
  const t = spec.carcassThicknessMm * MM;
  const backT = spec.backThicknessMm * MM;
  const frontT = spec.frontThicknessMm * MM;
  const gap = spec.revealGapMm * MM;
  const baseH = calc.carcassBottomY * MM;
  const carcH = calc.carcassHeightMm * MM;
  const carcD = calc.carcassDepthMm * MM;
  const backRecess = 12 * MM;
  const ctH =
    spec.countertopEnabled && spec.typology !== 'wall' && spec.typology !== 'tall'
      ? spec.countertopThicknessMm * MM
      : 0;
  const ctOver = ctH > 0 ? spec.countertopOverhangMm * MM : 0;

  // Z convention: Carcass centered roughly around Z=0, front doors facing +Z
  const carcBackZ = -D / 2;
  const carcFrontZ = carcBackZ + carcD;
  const carcCenterZ = (carcBackZ + carcFrontZ) / 2;
  const carcMidY = baseH + carcH / 2;

  const trackGeo = <T extends THREE.BufferGeometry>(g: T): T => {
    disposables.push(g);
    return g;
  };

  const addBoxPart = (
    w: number,
    h: number,
    d: number,
    mat: THREE.Material,
    x: number,
    y: number,
    z: number,
    explodeVec: [number, number, number],
    parent: THREE.Object3D = root
  ): THREE.Mesh => {
    const geo = trackGeo(new THREE.BoxGeometry(Math.max(0.002, w), Math.max(0.002, h), Math.max(0.002, d)));
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    if (parent === root) {
      explodables.push({
        object: mesh,
        basePos: mesh.position.clone(),
        explodeDelta: new THREE.Vector3(explodeVec[0], explodeVec[1], explodeVec[2]),
      });
    }
    return mesh;
  };

  // --- 1. CARCASS STRUCTURE ---
  // Left & Right Gable Sides
  addBoxPart(t, carcH, carcD, exteriorMat, -W / 2 + t / 2, carcMidY, carcCenterZ, [-0.14, 0, 0]);
  addBoxPart(t, carcH, carcD, exteriorMat, W / 2 - t / 2, carcMidY, carcCenterZ, [0.14, 0, 0]);

  // Bottom Structural Deck
  addBoxPart(W - t * 2, t, carcD, interiorMat, 0, baseH + t / 2, carcCenterZ, [0, -0.07, 0]);

  // Top Deck or Base Stretchers
  if (spec.typology === 'base' || spec.typology === 'vanity') {
    const strD = 100 * MM;
    addBoxPart(W - t * 2, t, strD, interiorMat, 0, baseH + carcH - t / 2, carcFrontZ - strD / 2, [0, 0.09, 0.03]);
    addBoxPart(W - t * 2, t, strD, interiorMat, 0, baseH + carcH - t / 2, carcBackZ + strD / 2, [0, 0.09, -0.03]);
  } else {
    addBoxPart(W - t * 2, t, carcD, exteriorMat, 0, baseH + carcH - t / 2, carcCenterZ, [0, 0.11, 0]);
  }

  // Recessed Back Panel
  addBoxPart(
    W - t * 2 + 0.008,
    carcH - t * 2 + 0.008,
    backT,
    interiorMat,
    0,
    carcMidY,
    carcBackZ + backRecess + backT / 2,
    [0, 0, -0.16]
  );

  // Face-Frame overlay rails, stiles & center mullions when construction === 'face-frame'
  if (spec.construction === 'face-frame') {
    const stileW = 42 * MM;
    const ffT = 20 * MM;
    const ffZ = carcFrontZ - ffT / 2 + 0.001;
    addBoxPart(stileW, carcH, ffT, exteriorMat, -W / 2 + stileW / 2, carcMidY, ffZ, [-0.06, 0, 0.08]);
    addBoxPart(stileW, carcH, ffT, exteriorMat, W / 2 - stileW / 2, carcMidY, ffZ, [0.06, 0, 0.08]);
    addBoxPart(W - stileW * 2, stileW, ffT, exteriorMat, 0, baseH + carcH - stileW / 2, ffZ, [0, 0.06, 0.08]);
    addBoxPart(W - stileW * 2, stileW, ffT, exteriorMat, 0, baseH + stileW / 2, ffZ, [0, -0.05, 0.08]);
    // Center mullions between bays
    calc.bayGeometries.forEach((bg, idx) => {
      if (idx > 0) {
        const mullionX = -W / 2 + bg.innerLeftMm * MM - t / 2;
        addBoxPart(stileW, carcH - stileW * 2, ffT, exteriorMat, mullionX, carcMidY, ffZ, [0, 0, 0.08]);
      }
    });
  }

  // Cabinet Style Architectural Trims: Crown Cornice, Mid-Century Mitered Surround, or Industrial Steel Frame
  if (styleDef.hasCrownTrim && ctH === 0) {
    const crownGroup = new THREE.Group();
    const crownBaseY = baseH + carcH;
    // Lower cove band
    const band1W = W + 22 * MM;
    const band1D = carcD + 16 * MM;
    const band1 = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(band1W, 20 * MM, band1D)), exteriorMat);
    band1.position.set(0, crownBaseY + 10 * MM, carcBackZ + band1D / 2);
    band1.castShadow = true;
    band1.receiveShadow = true;
    crownGroup.add(band1);
    // Upper stepped crown cap
    const band2W = W + 46 * MM;
    const band2D = carcD + 28 * MM;
    const band2 = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(band2W, 24 * MM, band2D)), exteriorMat);
    band2.position.set(0, crownBaseY + 32 * MM, carcBackZ + band2D / 2);
    band2.castShadow = true;
    band2.receiveShadow = true;
    crownGroup.add(band2);
    root.add(crownGroup);
    explodables.push({
      object: crownGroup,
      basePos: crownGroup.position.clone(),
      explodeDelta: new THREE.Vector3(0, 0.16, 0),
    });
  } else if (styleDef.hasMiteredWrap) {
    // Mid-Century 45-degree projecting mitered outer surround frame
    const lipD = 26 * MM;
    const lipT = 14 * MM;
    const lipZ = carcFrontZ + lipD / 2 - 4 * MM;
    const wrapGroup = new THREE.Group();
    const topLip = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(W + 4 * MM, lipT, lipD)), exteriorMat);
    topLip.position.set(0, baseH + carcH - lipT / 2 + 2 * MM, lipZ);
    const botLip = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(W + 4 * MM, lipT, lipD)), exteriorMat);
    botLip.position.set(0, baseH + lipT / 2 - 2 * MM, lipZ);
    const leftLip = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(lipT, carcH, lipD)), exteriorMat);
    leftLip.position.set(-W / 2 + lipT / 2 - 2 * MM, carcMidY, lipZ);
    const rightLip = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(lipT, carcH, lipD)), exteriorMat);
    rightLip.position.set(W / 2 - lipT / 2 + 2 * MM, carcMidY, lipZ);
    [topLip, botLip, leftLip, rightLip].forEach((m) => {
      m.castShadow = true;
      m.receiveShadow = true;
      wrapGroup.add(m);
    });
    root.add(wrapGroup);
    explodables.push({
      object: wrapGroup,
      basePos: wrapGroup.position.clone(),
      explodeDelta: new THREE.Vector3(0, 0, 0.14),
    });
  } else if (styleDef.hasSteelFrame) {
    // Industrial Loft exposed structural steel angle corner frame
    const barW = 20 * MM;
    const frameGroup = new THREE.Group();
    const zF = carcFrontZ + 2 * MM;
    const zB = carcBackZ - 2 * MM;
    const yT = baseH + carcH + 2 * MM;
    const yB = baseH - 2 * MM;
    const xL = -W / 2 - 2 * MM;
    const xR = W / 2 + 2 * MM;

    // 4 vertical corner posts
    const vPostGeo = trackGeo(new THREE.BoxGeometry(barW, carcH + 8 * MM, barW));
    [
      [xL, zF],
      [xR, zF],
      [xL, zB],
      [xR, zB],
    ].forEach(([px, pz]) => {
      const p = new THREE.Mesh(vPostGeo, hardwareMat);
      p.position.set(px, carcMidY, pz);
      p.castShadow = true;
      frameGroup.add(p);
    });

    // Horizontal front & back rails (top & bottom)
    const hRailGeo = trackGeo(new THREE.BoxGeometry(W + 24 * MM, barW, barW));
    [
      [yT, zF],
      [yB, zF],
      [yT, zB],
      [yB, zB],
    ].forEach(([py, pz]) => {
      const r = new THREE.Mesh(hRailGeo, hardwareMat);
      r.position.set(0, py, pz);
      r.castShadow = true;
      frameGroup.add(r);
    });

    // Side depth rails
    const sRailGeo = trackGeo(new THREE.BoxGeometry(barW, barW, carcD + 16 * MM));
    [
      [xL, yT],
      [xR, yT],
      [xL, yB],
      [xR, yB],
    ].forEach(([px, py]) => {
      const sr = new THREE.Mesh(sRailGeo, hardwareMat);
      sr.position.set(px, py, carcCenterZ);
      sr.castShadow = true;
      frameGroup.add(sr);
    });

    root.add(frameGroup);
    explodables.push({
      object: frameGroup,
      basePos: frameGroup.position.clone(),
      explodeDelta: new THREE.Vector3(0, 0.04, 0.08),
    });
  }

  // --- 2. BASE PLINTH OR TAPERED STEEL LEGS ---
  if (spec.baseStyle === 'toe-kick' && baseH > 0.01) {
    const kickRecess = spec.toeKickRecessMm * MM;
    const plinthFrontZ = carcFrontZ - kickRecess;
    const plinthD = Math.max(0.08, plinthFrontZ - carcBackZ);
    const plinthGroup = new THREE.Group();
    plinthGroup.position.set(0, baseH / 2, (plinthFrontZ + carcBackZ) / 2);

    const frontPlinth = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(W - 0.002, baseH, t)), exteriorMat);
    frontPlinth.position.set(0, 0, plinthD / 2 - t / 2);
    frontPlinth.castShadow = true;
    frontPlinth.receiveShadow = true;
    plinthGroup.add(frontPlinth);

    const sidePlinthGeo = trackGeo(new THREE.BoxGeometry(t, baseH, plinthD - t));
    [-W / 2 + t / 2 + 0.002, W / 2 - t / 2 - 0.002].forEach((sx) => {
      const sp = new THREE.Mesh(sidePlinthGeo, interiorMat);
      sp.position.set(sx, 0, -t / 2);
      sp.castShadow = true;
      sp.receiveShadow = true;
      plinthGroup.add(sp);
    });

    const rearPlinth = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(W - t * 2, baseH, t)), interiorMat);
    rearPlinth.position.set(0, 0, -plinthD / 2 + t / 2);
    plinthGroup.add(rearPlinth);

    root.add(plinthGroup);
    explodables.push({
      object: plinthGroup,
      basePos: plinthGroup.position.clone(),
      explodeDelta: new THREE.Vector3(0, -0.11, 0),
    });
  } else if (spec.baseStyle === 'steel-legs' && baseH > 0.02) {
    const legsGroup = new THREE.Group();
    const legInsetX = 48 * MM;
    const legInsetZ = 48 * MM;
    const legGeo = trackGeo(new THREE.CylinderGeometry(14 * MM, 9 * MM, baseH - 6 * MM, 20));
    const plateGeo = trackGeo(new THREE.BoxGeometry(46 * MM, 5 * MM, 46 * MM));
    const glideGeo = trackGeo(new THREE.CylinderGeometry(10 * MM, 11 * MM, 6 * MM, 16));

    const xCoords = spec.widthMm >= 1400 ? [-W / 2 + legInsetX, 0, W / 2 - legInsetX] : [-W / 2 + legInsetX, W / 2 - legInsetX];
    const zCoords = [carcBackZ + legInsetZ, carcFrontZ - legInsetZ];

    for (const lx of xCoords) {
      for (const lz of zCoords) {
        const leg = new THREE.Mesh(legGeo, hardwareMat);
        leg.position.set(lx, (baseH + 6 * MM) / 2, lz);
        leg.castShadow = true;
        legsGroup.add(leg);

        const plate = new THREE.Mesh(plateGeo, hardwareMat);
        plate.position.set(lx, baseH - 2.5 * MM, lz);
        legsGroup.add(plate);

        const glide = new THREE.Mesh(glideGeo, steelRunnerMat);
        glide.position.set(lx, 3 * MM, lz);
        legsGroup.add(glide);
      }
    }
    root.add(legsGroup);
    explodables.push({
      object: legsGroup,
      basePos: legsGroup.position.clone(),
      explodeDelta: new THREE.Vector3(0, -0.12, 0),
    });
  }

  // --- 3. COUNTERTOP SLAB ---
  if (ctH > 0) {
    const ctW = W + ctOver * 2;
    const ctD = D + ctOver;
    const ctCenterZ = carcBackZ + ctD / 2;
    addBoxPart(ctW, ctH, ctD, countertopMat, 0, baseH + carcH + ctH / 2, ctCenterZ, [0, 0.18, 0]);
  }

  // --- 4. INTERIOR DIVIDERS, SHELVES, INSTANCED SHELF PINS ---
  const innerD = calc.innerDepthMm * MM;
  const innerH = calc.innerHeightMm * MM;
  const shelfPinPositions: THREE.Vector3[] = [];

  // Pre-build reusable turned brass/steel knob LatheGeometry
  const knobLathePoints = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(0.007, 0),
    new THREE.Vector2(0.007, 0.011),
    new THREE.Vector2(0.0135, 0.013),
    new THREE.Vector2(0.014, 0.023),
    new THREE.Vector2(0.012, 0.025),
    new THREE.Vector2(0, 0.025),
  ];
  const knobGeo = trackGeo(new THREE.LatheGeometry(knobLathePoints, 24));
  knobGeo.rotateX(Math.PI / 2);

  // Helper to assemble detailed front fascia (Slab / Shaker / Beveled / Fluted) + Hardware
  const buildFrontFascia = (
    fw: number,
    fh: number,
    isDrawer: boolean,
    hingeSide?: 'left' | 'right'
  ): THREE.Group => {
    const panel = new THREE.Group();

    const buildFrameStilesRails = (stileW: number) => {
      const stileGeo = trackGeo(new THREE.BoxGeometry(stileW, fh, frontT));
      const leftStile = new THREE.Mesh(stileGeo, frontMat);
      leftStile.position.set(-fw / 2 + stileW / 2, 0, 0);
      leftStile.castShadow = true;
      leftStile.receiveShadow = true;
      panel.add(leftStile);

      const rightStile = new THREE.Mesh(stileGeo, frontMat);
      rightStile.position.set(fw / 2 - stileW / 2, 0, 0);
      rightStile.castShadow = true;
      rightStile.receiveShadow = true;
      panel.add(rightStile);

      const railGeo = trackGeo(new THREE.BoxGeometry(Math.max(0.01, fw - stileW * 2), stileW, frontT));
      const topRail = new THREE.Mesh(railGeo, frontMat);
      topRail.position.set(0, fh / 2 - stileW / 2, 0);
      topRail.castShadow = true;
      topRail.receiveShadow = true;
      panel.add(topRail);

      const botRail = new THREE.Mesh(railGeo, frontMat);
      botRail.position.set(0, -fh / 2 + stileW / 2, 0);
      botRail.castShadow = true;
      botRail.receiveShadow = true;
      panel.add(botRail);
    };

    if ((spec.doorStyle === 'shaker' || spec.doorStyle === 'slim-shaker') && fw > 0.09 && fh > 0.08) {
      const targetStile = spec.doorStyle === 'slim-shaker' ? 22 * MM : 54 * MM;
      const stileW = Math.min(targetStile, fw * 0.24, fh * 0.28);
      const centerT = frontT * 0.48;
      const center = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(fw - stileW * 2 + 0.004, fh - stileW * 2 + 0.004, centerT)),
        frontMat
      );
      center.position.set(0, 0, -frontT * 0.14);
      center.castShadow = true;
      center.receiveShadow = true;
      panel.add(center);
      buildFrameStilesRails(stileW);
    } else if (spec.doorStyle === 'raised-panel' && fw > 0.12 && fh > 0.11) {
      const stileW = Math.min(54 * MM, fw * 0.23, fh * 0.26);
      buildFrameStilesRails(stileW);
      const openW = Math.max(0.02, fw - stileW * 2);
      const openH = Math.max(0.02, fh - stileW * 2);
      // Recessed cove groove backing
      const groove = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(openW + 0.004, openH + 0.004, frontT * 0.44)),
        frontMat
      );
      groove.position.set(0, 0, -frontT * 0.16);
      panel.add(groove);
      // Stepped beveled raised center field
      const bevelMargin = Math.min(24 * MM, openW * 0.18, openH * 0.18);
      const midStep = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(Math.max(0.015, openW - bevelMargin), Math.max(0.015, openH - bevelMargin), frontT * 0.32)),
        frontMat
      );
      midStep.position.set(0, 0, frontT * 0.16);
      midStep.castShadow = true;
      midStep.receiveShadow = true;
      panel.add(midStep);
      const raisedField = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(Math.max(0.01, openW - bevelMargin * 2.1), Math.max(0.01, openH - bevelMargin * 2.1), frontT * 0.24)),
        frontMat
      );
      raisedField.position.set(0, 0, frontT * 0.34);
      raisedField.castShadow = true;
      raisedField.receiveShadow = true;
      panel.add(raisedField);
    } else if (spec.doorStyle === 'glass-mullion' && !isDrawer && fw > 0.11 && fh > 0.14) {
      const stileW = Math.min(48 * MM, fw * 0.22, fh * 0.2);
      buildFrameStilesRails(stileW);
      const openW = Math.max(0.03, fw - stileW * 2);
      const openH = Math.max(0.03, fh - stileW * 2);
      // Tempered glass insert
      const glassPane = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(openW + 0.004, openH + 0.004, 4 * MM)),
        glassMat
      );
      glassPane.position.set(0, 0, -2 * MM);
      glassPane.renderOrder = 4;
      panel.add(glassPane);
      // Mullion crossbars (vertical center + 1 or 2 horizontal muntins)
      const muntinW = 14 * MM;
      const muntinD = frontT * 0.62;
      if (openW > 0.24) {
        const vBar = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(muntinW, openH, muntinD)), frontMat);
        vBar.castShadow = true;
        panel.add(vBar);
      }
      const hCount = fh > 0.95 ? 2 : 1;
      for (let m = 1; m <= hCount; m++) {
        const my = -openH / 2 + (openH * m) / (hCount + 1);
        const hBar = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(openW, muntinW, muntinD)), frontMat);
        hBar.position.set(0, my, 0);
        hBar.castShadow = true;
        panel.add(hBar);
      }
    } else if (spec.doorStyle === 'louvered' && !isDrawer && fw > 0.12 && fh > 0.14) {
      const stileW = Math.min(46 * MM, fw * 0.22, fh * 0.22);
      buildFrameStilesRails(stileW);
      const openW = Math.max(0.03, fw - stileW * 2);
      const openH = Math.max(0.04, fh - stileW * 2);
      const slatPitch = 24 * MM;
      const slatCount = Math.max(3, Math.floor(openH / slatPitch));
      const actualPitch = openH / slatCount;
      const slatGeo = trackGeo(new THREE.BoxGeometry(openW, 6 * MM, frontT * 0.85));
      for (let i = 0; i < slatCount; i++) {
        const sy = -openH / 2 + actualPitch * (i + 0.5);
        const slat = new THREE.Mesh(slatGeo, frontMat);
        slat.position.set(0, sy, 0);
        slat.rotation.x = THREE.MathUtils.degToRad(32);
        slat.castShadow = true;
        slat.receiveShadow = true;
        panel.add(slat);
      }
    } else if (spec.doorStyle === 'beveled') {
      // Two-step architectural bevel slab
      const backSlab = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(fw, fh, frontT * 0.65)), frontMat);
      backSlab.position.set(0, 0, -frontT * 0.17);
      backSlab.castShadow = true;
      backSlab.receiveShadow = true;
      panel.add(backSlab);

      const bevelFace = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(Math.max(0.02, fw - 10 * MM), Math.max(0.02, fh - 10 * MM), frontT * 0.38)),
        frontMat
      );
      bevelFace.position.set(0, 0, frontT * 0.31);
      bevelFace.castShadow = true;
      bevelFace.receiveShadow = true;
      panel.add(bevelFace);
    } else if (spec.doorStyle === 'fluted') {
      // Backing core + vertical precision reeded slats
      const core = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(fw, fh, frontT * 0.68)), frontMat);
      core.position.set(0, 0, -frontT * 0.16);
      core.castShadow = true;
      core.receiveShadow = true;
      panel.add(core);

      const slatPitch = 20 * MM;
      const slatCount = Math.max(3, Math.floor((fw - 16 * MM) / slatPitch));
      const actualPitch = (fw - 12 * MM) / slatCount;
      const slatGeo = trackGeo(new THREE.BoxGeometry(actualPitch * 0.64, fh - 4 * MM, frontT * 0.34));
      for (let i = 0; i < slatCount; i++) {
        const sx = -fw / 2 + 6 * MM + actualPitch * (i + 0.5);
        const slat = new THREE.Mesh(slatGeo, frontMat);
        slat.position.set(sx, 0, frontT * 0.33);
        slat.castShadow = true;
        slat.receiveShadow = true;
        panel.add(slat);
      }
    } else {
      // Flat Architectural Slab (also clean fallback for narrow glass/louver drawer fronts)
      const slab = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(fw, fh, frontT)), frontMat);
      slab.castShadow = true;
      slab.receiveShadow = true;
      panel.add(slab);
    }

    // Hardware Pulls / Knobs
    if (spec.hardwareStyle !== 'push-to-open') {
      const frontZ = frontT / 2;
      if (isDrawer) {
        const pullY = spec.hardwareStyle === 'edge-pull' ? fh / 2 - 2 * MM : Math.min(fh * 0.18, 30 * MM);
        if (spec.hardwareStyle === 'knob') {
          const knob = new THREE.Mesh(knobGeo, hardwareMat);
          knob.position.set(0, pullY, frontZ);
          knob.castShadow = true;
          panel.add(knob);
        } else if (spec.hardwareStyle === 'edge-pull') {
          const pullW = Math.min(fw * 0.42, 180 * MM);
          const lip = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(pullW, 3 * MM, 22 * MM)), hardwareMat);
          lip.position.set(0, fh / 2 + 1.5 * MM, frontZ + 4 * MM);
          panel.add(lip);
          const drop = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(pullW, 14 * MM, 2.5 * MM)), hardwareMat);
          drop.position.set(0, fh / 2 - 5 * MM, frontZ + 14 * MM);
          panel.add(drop);
        } else {
          // Machined bar pull with two cylindrical standoffs
          const pullW = Math.min(fw * 0.42, 160 * MM);
          const bar = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(5 * MM, 5 * MM, pullW, 14)), hardwareMat);
          bar.rotation.z = Math.PI / 2;
          bar.position.set(0, pullY, frontZ + 26 * MM);
          bar.castShadow = true;
          panel.add(bar);

          const postGeo = trackGeo(new THREE.CylinderGeometry(3.8 * MM, 3.8 * MM, 26 * MM, 12));
          postGeo.rotateX(Math.PI / 2);
          [-pullW * 0.36, pullW * 0.36].forEach((px) => {
            const post = new THREE.Mesh(postGeo, hardwareMat);
            post.position.set(px, pullY, frontZ + 13 * MM);
            panel.add(post);
          });
        }
      } else if (hingeSide) {
        const xSign = hingeSide === 'left' ? 1 : -1;
        const pullX = xSign * (fw / 2 - Math.min(34 * MM, fw * 0.18));
        const pullY = spec.typology === 'wall' ? -fh / 2 + Math.min(115 * MM, fh * 0.25) : fh / 2 - Math.min(115 * MM, fh * 0.25);

        if (spec.hardwareStyle === 'knob') {
          const knob = new THREE.Mesh(knobGeo, hardwareMat);
          knob.position.set(pullX, pullY, frontZ);
          knob.castShadow = true;
          panel.add(knob);
        } else if (spec.hardwareStyle === 'edge-pull') {
          const pullW = Math.min(fw * 0.36, 120 * MM);
          const epX = xSign * (fw / 2 - pullW / 2 - 12 * MM);
          const epY = spec.typology === 'wall' ? -fh / 2 - 1.5 * MM : fh / 2 + 1.5 * MM;
          const lip = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(pullW, 3 * MM, 22 * MM)), hardwareMat);
          lip.position.set(epX, epY, frontZ + 4 * MM);
          panel.add(lip);
        } else {
          const pullH = Math.min(fh * 0.34, 168 * MM);
          const bar = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(5 * MM, 5 * MM, pullH, 14)), hardwareMat);
          bar.position.set(pullX, pullY, frontZ + 26 * MM);
          bar.castShadow = true;
          panel.add(bar);

          const postGeo = trackGeo(new THREE.CylinderGeometry(3.8 * MM, 3.8 * MM, 26 * MM, 12));
          postGeo.rotateX(Math.PI / 2);
          [-pullH * 0.36, pullH * 0.36].forEach((py) => {
            const post = new THREE.Mesh(postGeo, hardwareMat);
            post.position.set(pullX, pullY + py, frontZ + 13 * MM);
            panel.add(post);
          });
        }
      }
    }

    return panel;
  };

  // Helper to mount a hinged door around its real hinge axis
  const addHingedDoor = (
    doorLeftMm: number,
    doorWidthMm: number,
    doorBottomMm: number,
    doorHeightMm: number,
    hingeSide: 'left' | 'right',
    bayIndex: number
  ) => {
    const fw = doorWidthMm * MM;
    const fh = doorHeightMm * MM;
    const centerX = -W / 2 + (doorLeftMm + doorWidthMm / 2) * MM;
    const centerY = baseH + (doorBottomMm + doorHeightMm / 2) * MM;
    const frontZ = doorMount === 'inset'
      ? carcFrontZ - frontT / 2 + 0.001
      : carcFrontZ + frontT / 2 + 0.002;

    // Outer container for exploded-view translation
    const explodeWrapper = new THREE.Group();
    const pivotX = hingeSide === 'left' ? centerX - fw / 2 : centerX + fw / 2;
    explodeWrapper.position.set(pivotX, centerY, frontZ);
    root.add(explodeWrapper);

    // Inner hinge pivot group
    const hingePivot = new THREE.Group();
    explodeWrapper.add(hingePivot);

    const fascia = buildFrontFascia(fw, fh, false, hingeSide);
    fascia.position.set(hingeSide === 'left' ? fw / 2 : -fw / 2, 0, 0);
    hingePivot.add(fascia);

    // Physical Hinge Hardware Modeling based on selected HingeType
    const hingeCount = doorHeightMm >= 1500 ? 4 : doorHeightMm >= 900 ? 3 : 2;
    const hingeYOffsets: number[] = [];
    if (hingeCount === 2) {
      hingeYOffsets.push(-fh / 2 + Math.min(90 * MM, fh * 0.2), fh / 2 - Math.min(90 * MM, fh * 0.2));
    } else {
      const topY = fh / 2 - 90 * MM;
      const botY = -fh / 2 + 90 * MM;
      for (let i = 0; i < hingeCount; i++) {
        hingeYOffsets.push(botY + ((topY - botY) * i) / (hingeCount - 1));
      }
    }

    const inwardSign = hingeSide === 'left' ? 1 : -1;
    const activeHingeType = spec.hingeType ?? 'concealed-110';

    if (activeHingeType === 'concealed-110' || activeHingeType === 'concealed-170') {
      // Concealed European 35mm hinge cups + clip-on arms on rear face of door
      const cupGeo = trackGeo(new THREE.CylinderGeometry(17.5 * MM, 17.5 * MM, 5 * MM, 16));
      cupGeo.rotateX(Math.PI / 2);
      const armLen = activeHingeType === 'concealed-170' ? 46 * MM : 28 * MM;
      const armGeo = trackGeo(new THREE.BoxGeometry(22 * MM, 14 * MM, armLen));
      hingeYOffsets.forEach((cy) => {
        const cup = new THREE.Mesh(cupGeo, steelRunnerMat);
        cup.position.set(inwardSign * 22.5 * MM, cy, -frontT / 2 - 1 * MM);
        hingePivot.add(cup);

        const arm = new THREE.Mesh(armGeo, steelRunnerMat);
        arm.position.set(inwardSign * 11 * MM, cy, -frontT / 2 - armLen / 2);
        hingePivot.add(arm);
      });
    } else if (activeHingeType === 'butt-mortise') {
      // Traditional Exposed Solid-Metal Mortise Butt Hinge Knuckles along the exterior seam
      const barrelGeo = trackGeo(new THREE.CylinderGeometry(5.2 * MM, 5.2 * MM, 74 * MM, 14));
      const finialGeo = trackGeo(new THREE.SphereGeometry(5.6 * MM, 12, 10));
      const leafGeo = trackGeo(new THREE.BoxGeometry(16 * MM, 74 * MM, 3 * MM));
      hingeYOffsets.forEach((cy) => {
        const barrel = new THREE.Mesh(barrelGeo, hardwareMat);
        barrel.position.set(0, cy, frontT / 2 + 1.5 * MM);
        barrel.castShadow = true;
        hingePivot.add(barrel);

        // Decorative top & bottom finial caps
        [39 * MM, -39 * MM].forEach((fy) => {
          const cap = new THREE.Mesh(finialGeo, hardwareMat);
          cap.position.set(0, cy + fy, frontT / 2 + 1.5 * MM);
          hingePivot.add(cap);
        });

        const leaf = new THREE.Mesh(leafGeo, hardwareMat);
        leaf.position.set(inwardSign * 8 * MM, cy, -frontT / 2 - 1 * MM);
        hingePivot.add(leaf);
      });
    } else if (activeHingeType === 'knife-pivot') {
      // Top & Bottom Architectural L-Shaped Knife Pivot Plates
      const plateGeo = trackGeo(new THREE.BoxGeometry(36 * MM, 3.5 * MM, frontT + 3 * MM));
      const pinGeo = trackGeo(new THREE.CylinderGeometry(4 * MM, 4 * MM, 12 * MM, 12));
      [-fh / 2 - 1 * MM, fh / 2 + 1 * MM].forEach((py) => {
        const plate = new THREE.Mesh(plateGeo, hardwareMat);
        plate.position.set(inwardSign * 18 * MM, py, 0);
        hingePivot.add(plate);
        const pin = new THREE.Mesh(pinGeo, hardwareMat);
        pin.position.set(inwardSign * 6 * MM, py, frontT / 2 - 3 * MM);
        hingePivot.add(pin);
      });
    } else if (activeHingeType === 'wrap-around') {
      // Semi-Concealed Face-Frame Wrap-Around Hinge with compact exposed barrel
      const barrelGeo = trackGeo(new THREE.CylinderGeometry(4.5 * MM, 4.5 * MM, 54 * MM, 14));
      const wingGeo = trackGeo(new THREE.BoxGeometry(22 * MM, 46 * MM, 3 * MM));
      hingeYOffsets.forEach((cy) => {
        const barrel = new THREE.Mesh(barrelGeo, hardwareMat);
        barrel.position.set(-inwardSign * 2 * MM, cy, frontT / 2 + 1 * MM);
        barrel.castShadow = true;
        hingePivot.add(barrel);

        const wing = new THREE.Mesh(wingGeo, hardwareMat);
        wing.position.set(inwardSign * 11 * MM, cy, -frontT / 2 - 1.5 * MM);
        hingePivot.add(wing);
      });
    } else if (activeHingeType === 'piano-continuous') {
      // Full-height continuous geared/knuckle piano hinge running along entire door height
      const pianoH = Math.max(0.06, fh - 16 * MM);
      const barrel = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(4.4 * MM, 4.4 * MM, pianoH, 14)),
        hardwareMat
      );
      barrel.position.set(0, 0, frontT / 2 + 1.2 * MM);
      barrel.castShadow = true;
      hingePivot.add(barrel);

      const leaf = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(14 * MM, pianoH, 2.5 * MM)),
        hardwareMat
      );
      leaf.position.set(inwardSign * 7 * MM, 0, -frontT / 2 - 1.2 * MM);
      hingePivot.add(leaf);
    }

    const spreadX = (bayIndex - (spec.bays.length - 1) / 2) * 0.05 + (hingeSide === 'left' ? -0.04 : 0.04);
    explodables.push({
      object: explodeWrapper,
      basePos: explodeWrapper.position.clone(),
      explodeDelta: new THREE.Vector3(spreadX, 0, 0.24),
    });

    doors.push({
      pivot: hingePivot,
      hingeSide,
      maxAngleRad: THREE.MathUtils.degToRad(hingeDef.maxPreviewAngleDeg),
    });
  };

  // Helper to mount a complete sliding drawer (fascia + 4-sided Baltic Birch box + bottom + metal runners)
  const addSlidingDrawer = (
    frontLeftMm: number,
    frontWidthMm: number,
    innerLeftMm: number,
    innerWidthMm: number,
    frontBottomMm: number,
    frontHeightMm: number,
    drawerOrderIdx: number,
    bayIndex: number
  ) => {
    const fw = frontWidthMm * MM;
    const fh = frontHeightMm * MM;
    const centerX = -W / 2 + (frontLeftMm + frontWidthMm / 2) * MM;
    const innerCenterX = -W / 2 + (innerLeftMm + innerWidthMm / 2) * MM;
    const centerY = baseH + (frontBottomMm + frontHeightMm / 2) * MM;
    const frontZ = doorMount === 'inset'
      ? carcFrontZ - frontT / 2 + 0.001
      : carcFrontZ + frontT / 2 + 0.002;

    const explodeWrapper = new THREE.Group();
    explodeWrapper.position.set(centerX, centerY, frontZ);
    root.add(explodeWrapper);

    const slideGroup = new THREE.Group();
    explodeWrapper.add(slideGroup);

    // Front fascia
    const fascia = buildFrontFascia(fw, fh, true);
    slideGroup.add(fascia);

    // Drawer box behind fascia
    const boxW = Math.max(0.08, (innerWidthMm - 26) * MM);
    const boxH = Math.max(0.065, (frontHeightMm - 44) * MM);
    const slideLen = getDrawerSlideLengthMm(calc.carcassDepthMm) * MM;
    const boxT = 15 * MM;
    const boxOffsetX = innerCenterX - centerX;
    const boxCenterZ = -frontT / 2 - slideLen / 2 - 4 * MM;
    const boxY = -8 * MM;

    // Left & right box sides
    const sideGeo = trackGeo(new THREE.BoxGeometry(boxT, boxH, slideLen));
    [-boxW / 2 + boxT / 2, boxW / 2 - boxT / 2].forEach((sx) => {
      const sMesh = new THREE.Mesh(sideGeo, drawerBoxMat);
      sMesh.position.set(boxOffsetX + sx, boxY, boxCenterZ);
      sMesh.castShadow = true;
      sMesh.receiveShadow = true;
      slideGroup.add(sMesh);
    });

    // Front & back sub-box panels
    const fbGeo = trackGeo(new THREE.BoxGeometry(boxW - boxT * 2, boxH, boxT));
    const subFront = new THREE.Mesh(fbGeo, drawerBoxMat);
    subFront.position.set(boxOffsetX, boxY, -frontT / 2 - boxT / 2 - 4 * MM);
    slideGroup.add(subFront);

    const subBack = new THREE.Mesh(fbGeo, drawerBoxMat);
    subBack.position.set(boxOffsetX, boxY, -frontT / 2 - slideLen + boxT / 2 - 4 * MM);
    slideGroup.add(subBack);

    // 6mm captive drawer bottom
    const bot = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(boxW - boxT * 2 + 8 * MM, 6 * MM, slideLen - 16 * MM)),
      drawerBoxMat
    );
    bot.position.set(boxOffsetX, boxY - boxH / 2 + 12 * MM, boxCenterZ);
    bot.receiveShadow = true;
    slideGroup.add(bot);

    // Metallic undermount slide rails
    const railGeo = trackGeo(new THREE.BoxGeometry(8 * MM, 18 * MM, slideLen * 0.92));
    [-boxW / 2 - 5 * MM, boxW / 2 + 5 * MM].forEach((rx) => {
      const rail = new THREE.Mesh(railGeo, steelRunnerMat);
      rail.position.set(boxOffsetX + rx, boxY - boxH / 2 + 10 * MM, boxCenterZ);
      slideGroup.add(rail);
    });

    const spreadX = (bayIndex - (spec.bays.length - 1) / 2) * 0.05;
    explodables.push({
      object: explodeWrapper,
      basePos: explodeWrapper.position.clone(),
      explodeDelta: new THREE.Vector3(spreadX, 0, 0.22 + drawerOrderIdx * 0.06),
    });

    drawers.push({
      group: slideGroup,
      baseZ: 0,
      travelZ: Math.min(slideLen * 0.72, 0.34),
    });
  };

  // --- 5. POPULATE EACH BAY ---
  const insetTopBotTrimMm = doorMount === 'inset'
    ? (spec.construction === 'face-frame' ? 42 : spec.carcassThicknessMm)
    : doorMount === 'half-overlay' && spec.construction === 'face-frame'
      ? 20
      : 0;
  const frontBottomOriginMm = insetTopBotTrimMm + spec.revealGapMm;
  const frontHeightTotalMm = Math.max(120, calc.carcassHeightMm - insetTopBotTrimMm * 2 - spec.revealGapMm * 2);
  const shelfBackZ = carcBackZ + backRecess + backT;

  calc.bayGeometries.forEach((bg, idx) => {
    // Vertical bay divider to the left of bay idx > 0
    if (idx > 0) {
      const divX = -W / 2 + bg.innerLeftMm * MM - t / 2;
      addBoxPart(
        t,
        innerH,
        innerD,
        interiorMat,
        divX,
        carcMidY,
        shelfBackZ + innerD / 2,
        [(idx - spec.bays.length / 2) * 0.05, 0, 0.03]
      );
    }

    const { layout, shelfCount } = bg.bay;

    // Adjustable shelves + pin coordinates
    const hasShelves =
      layout === 'double-doors' ||
      layout === 'single-door-left' ||
      layout === 'single-door-right' ||
      layout === 'drawer-and-doors' ||
      layout === 'open-shelves';

    if (hasShelves && shelfCount > 0) {
      const shelfW = (bg.innerWidthMm - 2) * MM;
      const shelfD = innerD - 20 * MM;
      const shelfX = -W / 2 + (bg.innerLeftMm + bg.innerWidthMm / 2) * MM;
      const shelfZ = shelfBackZ + shelfD / 2 + 1 * MM;

      const topBoundY =
        layout === 'drawer-and-doors'
          ? baseH + calc.carcassHeightMm - Math.min(180, Math.round(frontHeightTotalMm * 0.24)) * MM - t
          : baseH + calc.carcassHeightMm - t;
      const botBoundY = baseH + t;
      const spanY = topBoundY - botBoundY;

      for (let s = 1; s <= shelfCount; s++) {
        const sy = botBoundY + (spanY * s) / (shelfCount + 1);
        addBoxPart(
          shelfW,
          t,
          shelfD,
          interiorMat,
          shelfX,
          sy,
          shelfZ,
          [0, (s - (shelfCount + 1) / 2) * 0.025, 0.1]
        );

        // 4 shelf pins under each shelf
        const pinY = sy - t / 2 - 3 * MM;
        const leftPinX = shelfX - shelfW / 2 + 4 * MM;
        const rightPinX = shelfX + shelfW / 2 - 4 * MM;
        const frontPinZ = shelfZ + shelfD / 2 - 35 * MM;
        const backPinZ = shelfZ - shelfD / 2 + 35 * MM;
        shelfPinPositions.push(
          new THREE.Vector3(leftPinX, pinY, frontPinZ),
          new THREE.Vector3(leftPinX, pinY, backPinZ),
          new THREE.Vector3(rightPinX, pinY, frontPinZ),
          new THREE.Vector3(rightPinX, pinY, backPinZ)
        );
      }
    }

    // Mount Doors & Drawers for this bay
    if (layout === 'double-doors') {
      const eachW = (bg.frontWidthMm - spec.revealGapMm) / 2;
      addHingedDoor(bg.frontLeftMm, eachW, frontBottomOriginMm, frontHeightTotalMm, 'left', idx);
      addHingedDoor(bg.frontLeftMm + eachW + spec.revealGapMm, eachW, frontBottomOriginMm, frontHeightTotalMm, 'right', idx);
    } else if (layout === 'single-door-left') {
      addHingedDoor(bg.frontLeftMm, bg.frontWidthMm, frontBottomOriginMm, frontHeightTotalMm, 'left', idx);
    } else if (layout === 'single-door-right') {
      addHingedDoor(bg.frontLeftMm, bg.frontWidthMm, frontBottomOriginMm, frontHeightTotalMm, 'right', idx);
    } else if (layout === 'drawer-and-doors') {
      const topDH = Math.min(180, Math.round(frontHeightTotalMm * 0.24));
      const lowH = frontHeightTotalMm - topDH - spec.revealGapMm;
      const eachW = (bg.frontWidthMm - spec.revealGapMm) / 2;

      addSlidingDrawer(
        bg.frontLeftMm,
        bg.frontWidthMm,
        bg.innerLeftMm,
        bg.innerWidthMm,
        frontBottomOriginMm + lowH + spec.revealGapMm,
        topDH,
        0,
        idx
      );
      addHingedDoor(bg.frontLeftMm, eachW, frontBottomOriginMm, lowH, 'left', idx);
      addHingedDoor(bg.frontLeftMm + eachW + spec.revealGapMm, eachW, frontBottomOriginMm, lowH, 'right', idx);
    } else if (layout === 'three-drawers' || layout === 'four-drawers') {
      const count = layout === 'three-drawers' ? 3 : 4;
      // Bottom-to-top weights (tallest at bottom, shallowest at top)
      const weights = count === 3 ? [0.38, 0.38, 0.24] : [0.3, 0.28, 0.23, 0.19];
      const availH = frontHeightTotalMm - spec.revealGapMm * (count - 1);
      let curBottom = frontBottomOriginMm;
      weights.forEach((w, dIdx) => {
        const dh = availH * w;
        addSlidingDrawer(
          bg.frontLeftMm,
          bg.frontWidthMm,
          bg.innerLeftMm,
          bg.innerWidthMm,
          curBottom,
          dh,
          count - 1 - dIdx,
          idx
        );
        curBottom += dh + spec.revealGapMm;
      });
    }
  });

  // InstancedMesh for all 5mm metallic shelf pins (fast, single draw call)
  if (shelfPinPositions.length > 0) {
    const pinGeo = trackGeo(new THREE.CylinderGeometry(3.5 * MM, 3.5 * MM, 8 * MM, 10));
    pinGeo.rotateZ(Math.PI / 2);
    const pinInst = new THREE.InstancedMesh(pinGeo, steelRunnerMat, shelfPinPositions.length);
    const dummy = new THREE.Object3D();
    shelfPinPositions.forEach((pos, i) => {
      dummy.position.copy(pos);
      dummy.updateMatrix();
      pinInst.setMatrixAt(i, dummy.matrix);
    });
    pinInst.instanceMatrix.needsUpdate = true;
    pinInst.computeBoundingSphere();
    root.add(pinInst);
  }

  return {
    root,
    explodables,
    doors,
    drawers,
    frontMaterials: [frontMat],
    dispose: () => {
      textures.forEach((tx) => tx.dispose());
      disposables.forEach((d) => d.dispose());
    },
  };
}
