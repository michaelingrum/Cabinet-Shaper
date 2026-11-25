import {
  BayConfig,
  BayGeometry,
  CabinetCalculation,
  CabinetSpec,
  CabinetStyleDef,
  CabinetStyleId,
  CabinetTypology,
  CutListPart,
  DoorStyle,
  ExteriorMaterialId,
  HardwareFinishDef,
  HardwareFinishId,
  HardwareItem,
  HingeDef,
  HingeType,
  InteriorMaterialDef,
  InteriorMaterialId,
  MaterialDef,
  NestedSheet,
  PlacedPart,
  SheetSizeId,
  UnitSystem,
} from '../types/cabinet';

export const EXTERIOR_MATERIALS: Record<ExteriorMaterialId, MaterialDef> = {
  'white-oak': {
    id: 'white-oak',
    name: 'Rift-Cut White Oak',
    category: 'wood',
    baseHex: '#C9AE8B',
    grainHex: '#9E7F58',
    roughness: 0.58,
    metalness: 0.0,
    clearcoat: 0.15,
    pricePerSheetUsd: 168,
    grainDirection: 'vertical',
    description: 'Quarter-sawn architectural white oak veneer on 11-ply core',
  },
  'black-walnut': {
    id: 'black-walnut',
    name: 'American Black Walnut',
    category: 'wood',
    baseHex: '#6A4B37',
    grainHex: '#3E271A',
    roughness: 0.52,
    metalness: 0.0,
    clearcoat: 0.22,
    pricePerSheetUsd: 215,
    grainDirection: 'vertical',
    description: 'Book-matched heartwood walnut with matte oil-wax finish',
  },
  'nordic-birch': {
    id: 'nordic-birch',
    name: 'Nordic Birch Ply',
    category: 'wood',
    baseHex: '#DECBA8',
    grainHex: '#C3AA80',
    roughness: 0.62,
    metalness: 0.0,
    clearcoat: 0.1,
    pricePerSheetUsd: 124,
    grainDirection: 'vertical',
    description: 'Clear-coat Finnish birch architectural plywood',
  },
  'matte-charcoal': {
    id: 'matte-charcoal',
    name: 'Matte Charcoal Fenix',
    category: 'lacquer',
    baseHex: '#2C3036',
    grainHex: '#24282D',
    roughness: 0.78,
    metalness: 0.04,
    clearcoat: 0.04,
    pricePerSheetUsd: 192,
    grainDirection: 'none',
    description: 'Super-matte anti-fingerprint nanotech laminate on MDF',
  },
  'sage-lacquer': {
    id: 'sage-lacquer',
    name: 'Architectural Sage',
    category: 'lacquer',
    baseHex: '#7A897C',
    grainHex: '#6E7C70',
    roughness: 0.48,
    metalness: 0.02,
    clearcoat: 0.18,
    pricePerSheetUsd: 158,
    grainDirection: 'none',
    description: '2K polyurethane satin conversion varnish on MR-MDF',
  },
  'warm-chalk': {
    id: 'warm-chalk',
    name: 'Warm Chalk Matte',
    category: 'lacquer',
    baseHex: '#EAE7E0',
    grainHex: '#DFDBD2',
    roughness: 0.56,
    metalness: 0.0,
    clearcoat: 0.12,
    pricePerSheetUsd: 145,
    grainDirection: 'none',
    description: 'Low-sheen architectural off-white lacquer finish',
  },
  'midnight-navy': {
    id: 'midnight-navy',
    name: 'Midnight Navy',
    category: 'lacquer',
    baseHex: '#26364A',
    grainHex: '#1E2B3B',
    roughness: 0.46,
    metalness: 0.04,
    clearcoat: 0.2,
    pricePerSheetUsd: 162,
    grainDirection: 'none',
    description: 'Deep satin mineral-blue conversion varnish on MDF',
  },
};

export const INTERIOR_MATERIALS: Record<InteriorMaterialId, InteriorMaterialDef> = {
  'baltic-birch': {
    id: 'baltic-birch',
    name: 'Baltic Birch Plywood',
    baseHex: '#DFCCA9',
    grainHex: '#C7AE84',
    isWood: true,
    pricePerSheetUsd: 112,
  },
  'white-melamine': {
    id: 'white-melamine',
    name: 'Snow White Melamine',
    baseHex: '#F2F2EF',
    grainHex: '#E8E8E4',
    isWood: false,
    pricePerSheetUsd: 68,
  },
  'maple-veneer': {
    id: 'maple-veneer',
    name: 'Pre-Finished Maple Core',
    baseHex: '#DFC59A',
    grainHex: '#C5A676',
    isWood: true,
    pricePerSheetUsd: 126,
  },
  'match-exterior': {
    id: 'match-exterior',
    name: 'Match Exterior Veneer',
    baseHex: '#C9AE8B',
    grainHex: '#9E7F58',
    isWood: true,
    pricePerSheetUsd: 168,
  },
};

export const HARDWARE_FINISHES: Record<HardwareFinishId, HardwareFinishDef> = {
  'brushed-brass': {
    id: 'brushed-brass',
    name: 'Brushed Brass',
    hex: '#C4A05A',
    roughness: 0.24,
    metalness: 0.92,
  },
  'matte-black': {
    id: 'matte-black',
    name: 'Matte Black Anodized',
    hex: '#1E2024',
    roughness: 0.42,
    metalness: 0.65,
  },
  'brushed-steel': {
    id: 'brushed-steel',
    name: 'Brushed Stainless',
    hex: '#C5C9CE',
    roughness: 0.22,
    metalness: 0.94,
  },
  'burnished-bronze': {
    id: 'burnished-bronze',
    name: 'Burnished Bronze',
    hex: '#6B5442',
    roughness: 0.34,
    metalness: 0.84,
  },
};

export const CABINET_STYLES: Record<CabinetStyleId, CabinetStyleDef> = {
  'modern-frameless': {
    id: 'modern-frameless',
    name: 'Modern European (Frameless)',
    shortName: 'Modern Euro',
    description: 'Clean frameless 32mm box with full-overlay flush fronts and crisp shadow reveals',
    defaultConstruction: 'frameless',
    defaultDoorMount: 'full-overlay',
    defaultDoorStyle: 'slab',
    defaultHingeType: 'concealed-110',
    hasCrownTrim: false,
    hasMiteredWrap: false,
    hasSteelFrame: false,
  },
  'traditional-inset': {
    id: 'traditional-inset',
    name: 'Traditional Inset (Face-Frame)',
    shortName: 'Traditional Inset',
    description: 'Doors seated flush inside solid 44mm face-frame stiles with stepped crown cornice',
    defaultConstruction: 'face-frame',
    defaultDoorMount: 'inset',
    defaultDoorStyle: 'raised-panel',
    defaultHingeType: 'butt-mortise',
    hasCrownTrim: true,
    hasMiteredWrap: false,
    hasSteelFrame: false,
  },
  'transitional-overlay': {
    id: 'transitional-overlay',
    name: 'Transitional Full-Overlay',
    shortName: 'Transitional',
    description: 'Face-frame structural case with full-overlay doors and clean architectural cap trim',
    defaultConstruction: 'face-frame',
    defaultDoorMount: 'full-overlay',
    defaultDoorStyle: 'shaker',
    defaultHingeType: 'concealed-110',
    hasCrownTrim: true,
    hasMiteredWrap: false,
    hasSteelFrame: false,
  },
  'mid-century': {
    id: 'mid-century',
    name: 'Mid-Century Mitered Case',
    shortName: 'Mid-Century',
    description: 'Beveled 45° perimeter case surround framing recessed inset fronts',
    defaultConstruction: 'frameless',
    defaultDoorMount: 'inset',
    defaultDoorStyle: 'fluted',
    defaultHingeType: 'knife-pivot',
    hasCrownTrim: false,
    hasMiteredWrap: true,
    hasSteelFrame: false,
  },
  'industrial-steel': {
    id: 'industrial-steel',
    name: 'Industrial Steel Frame',
    shortName: 'Industrial',
    description: 'Exposed structural metal corner rails wrapping custom timber carcass panels',
    defaultConstruction: 'frameless',
    defaultDoorMount: 'inset',
    defaultDoorStyle: 'slim-shaker',
    defaultHingeType: 'piano-continuous',
    hasCrownTrim: false,
    hasMiteredWrap: false,
    hasSteelFrame: true,
  },
};

export const DOOR_STYLE_DEFS: Record<DoorStyle, { id: DoorStyle; name: string; summary: string }> = {
  slab: { id: 'slab', name: 'Flat Slab', summary: 'Minimalist seamless monolithic panel' },
  shaker: { id: 'shaker', name: '5-Piece Shaker', summary: 'Classic 54 mm stiles & recessed center' },
  'slim-shaker': { id: 'slim-shaker', name: 'Slim Shaker', summary: 'Refined 22 mm narrow perimeter frame' },
  'raised-panel': { id: 'raised-panel', name: 'Raised Panel', summary: 'Traditional beveled stepped center panel' },
  'glass-mullion': { id: 'glass-mullion', name: 'Glass Mullion', summary: 'Tempered clear glass with cross mullions' },
  louvered: { id: 'louvered', name: 'Louvered Slats', summary: 'Ventilated angled horizontal wood louvers' },
  beveled: { id: 'beveled', name: 'Beveled Frame', summary: '45° architectural chamfered front face' },
  fluted: { id: 'fluted', name: 'Fluted / Reeded', summary: 'Precision vertical half-round slat profile' },
};

export const HINGE_TYPES: Record<HingeType, HingeDef> = {
  'concealed-110': {
    id: 'concealed-110',
    name: '110° Soft-Close Concealed Cup',
    shortName: '110° Euro Cup',
    openingAngleDeg: 110,
    maxPreviewAngleDeg: 95,
    visibility: 'Concealed',
    machiningSpec: '35 mm Ø cup bore × 12.5 mm deep · 22.5 mm setback',
    unitPriceUsd: 6.5,
    requiresCupBore: true,
    description: 'Standard hidden European cup hinge with integrated hydraulic soft-close damper',
  },
  'concealed-170': {
    id: 'concealed-170',
    name: '170° Wide-Angle Concealed',
    shortName: '170° Wide-Angle',
    openingAngleDeg: 170,
    maxPreviewAngleDeg: 145,
    visibility: 'Concealed',
    machiningSpec: '35 mm Ø cup bore · zero-protrusion dual-link arm',
    unitPriceUsd: 12.75,
    requiresCupBore: true,
    description: 'Full-access wide-swing articulated hinge ideal for pantries and interior roll-outs',
  },
  'butt-mortise': {
    id: 'butt-mortise',
    name: 'Exposed Mortise Butt Hinge',
    shortName: 'Mortise Butt',
    openingAngleDeg: 180,
    maxPreviewAngleDeg: 115,
    visibility: 'Exposed',
    machiningSpec: '76 × 45 mm mortise leaf recess · solid metal knuckle',
    unitPriceUsd: 16.5,
    requiresCupBore: false,
    description: 'Heirloom solid-metal barrel hinge mortised cleanly into inset door & frame edges',
  },
  'knife-pivot': {
    id: 'knife-pivot',
    name: 'L-Shaped Knife Pivot Hinge',
    shortName: 'Knife Pivot',
    openingAngleDeg: 180,
    maxPreviewAngleDeg: 110,
    visibility: 'Semi-Concealed',
    machiningSpec: 'Top & bottom 3 mm edge mortise · hidden pivot axis',
    unitPriceUsd: 24.0,
    requiresCupBore: false,
    description: 'Precision top-and-bottom mortised knife pivot for minimalist inset & mid-century doors',
  },
  'wrap-around': {
    id: 'wrap-around',
    name: 'Semi-Concealed Wrap-Around',
    shortName: 'Wrap-Around',
    openingAngleDeg: 165,
    maxPreviewAngleDeg: 108,
    visibility: 'Semi-Concealed',
    machiningSpec: 'Surface face-frame mount · self-closing spring knuckle',
    unitPriceUsd: 8.25,
    requiresCupBore: false,
    description: 'Classic American face-frame hinge with decorative exposed barrel along the door edge',
  },
  'piano-continuous': {
    id: 'piano-continuous',
    name: 'Full-Height Continuous Piano',
    shortName: 'Continuous Piano',
    openingAngleDeg: 180,
    maxPreviewAngleDeg: 120,
    visibility: 'Exposed',
    machiningSpec: 'Full-height geared stainless/brass leaf · #6 screws @ 50 mm',
    unitPriceUsd: 28.0,
    isContinuous: true,
    requiresCupBore: false,
    description: 'Heavy-duty continuous barrel hinge supporting tall or wide doors with zero sag',
  },
};

export const SHEET_DIMENSIONS: Record<SheetSizeId, { widthMm: number; heightMm: number; label: string }> = {
  '2440x1220': { widthMm: 2440, heightMm: 1220, label: '2440 × 1220 mm (4\' × 8\')' },
  '1525x1525': { widthMm: 1525, heightMm: 1525, label: '1525 × 1525 mm (5\' × 5\')' },
};

export interface CabinetPreset {
  id: string;
  label: string;
  typology: CabinetTypology;
  summary: string;
  spec: Partial<CabinetSpec>;
}

export const CABINET_PRESETS: CabinetPreset[] = [
  {
    id: 'kitchen-base-double',
    label: 'Kitchen Base',
    typology: 'base',
    summary: '1200 mm dual-bay base with drawer bank & doors',
    spec: {
      projectName: 'Kitchen Base Cabinet B-120',
      drawingNumber: 'KM-2026-B120',
      typology: 'base',
      cabinetStyle: 'modern-frameless',
      widthMm: 1200,
      heightMm: 860,
      depthMm: 580,
      baseStyle: 'toe-kick',
      toeKickHeightMm: 100,
      toeKickRecessMm: 55,
      construction: 'frameless',
      doorMount: 'full-overlay',
      joinery: 'dado-rabbet',
      carcassThicknessMm: 18,
      backThicknessMm: 6,
      frontThicknessMm: 19,
      revealGapMm: 2.5,
      countertopEnabled: true,
      countertopThicknessMm: 30,
      countertopOverhangMm: 25,
      doorStyle: 'shaker',
      hingeType: 'concealed-110',
      exteriorMaterial: 'white-oak',
      interiorMaterial: 'baltic-birch',
      hardwareStyle: 'bar-pull',
      hardwareFinish: 'brushed-brass',
      bays: [
        { id: 'bay-1', layout: 'drawer-and-doors', shelfCount: 1, widthRatio: 1 },
        { id: 'bay-2', layout: 'three-drawers', shelfCount: 0, widthRatio: 1 },
      ],
    },
  },
  {
    id: 'credenza-media',
    label: 'Architectural Credenza',
    typology: 'credenza',
    summary: '1800 mm three-bay sideboard on steel legs',
    spec: {
      projectName: 'Three-Bay Media Credenza C-180',
      drawingNumber: 'KM-2026-C180',
      typology: 'credenza',
      cabinetStyle: 'mid-century',
      widthMm: 1800,
      heightMm: 740,
      depthMm: 460,
      baseStyle: 'steel-legs',
      toeKickHeightMm: 160,
      toeKickRecessMm: 45,
      construction: 'frameless',
      doorMount: 'inset',
      joinery: 'dowel-32mm',
      carcassThicknessMm: 18,
      backThicknessMm: 12,
      frontThicknessMm: 19,
      revealGapMm: 2,
      countertopEnabled: false,
      countertopThicknessMm: 24,
      countertopOverhangMm: 0,
      doorStyle: 'fluted',
      hingeType: 'knife-pivot',
      exteriorMaterial: 'black-walnut',
      interiorMaterial: 'maple-veneer',
      hardwareStyle: 'edge-pull',
      hardwareFinish: 'brushed-brass',
      bays: [
        { id: 'bay-1', layout: 'single-door-left', shelfCount: 1, widthRatio: 1 },
        { id: 'bay-2', layout: 'three-drawers', shelfCount: 0, widthRatio: 1.2 },
        { id: 'bay-3', layout: 'single-door-right', shelfCount: 1, widthRatio: 1 },
      ],
    },
  },
  {
    id: 'tall-pantry',
    label: 'Tall Pantry Tower',
    typology: 'tall',
    summary: '900 × 2140 mm full-height pantry storage',
    spec: {
      projectName: 'Full-Height Pantry Tower T-090',
      drawingNumber: 'KM-2026-T090',
      typology: 'tall',
      cabinetStyle: 'modern-frameless',
      widthMm: 900,
      heightMm: 2140,
      depthMm: 580,
      baseStyle: 'toe-kick',
      toeKickHeightMm: 100,
      toeKickRecessMm: 55,
      construction: 'frameless',
      doorMount: 'full-overlay',
      joinery: 'dowel-32mm',
      carcassThicknessMm: 18,
      backThicknessMm: 6,
      frontThicknessMm: 19,
      revealGapMm: 2.5,
      countertopEnabled: false,
      countertopThicknessMm: 20,
      countertopOverhangMm: 0,
      doorStyle: 'slim-shaker',
      hingeType: 'concealed-170',
      exteriorMaterial: 'sage-lacquer',
      interiorMaterial: 'baltic-birch',
      hardwareStyle: 'bar-pull',
      hardwareFinish: 'matte-black',
      bays: [{ id: 'bay-1', layout: 'double-doors', shelfCount: 5, widthRatio: 1 }],
    },
  },
  {
    id: 'wall-upper',
    label: 'Wall Upper',
    typology: 'wall',
    summary: '1000 × 820 mm suspended wall cabinet',
    spec: {
      projectName: 'Upper Wall Cabinet W-100',
      drawingNumber: 'KM-2026-W100',
      typology: 'wall',
      cabinetStyle: 'transitional-overlay',
      widthMm: 1000,
      heightMm: 820,
      depthMm: 340,
      baseStyle: 'wall-hung',
      toeKickHeightMm: 0,
      toeKickRecessMm: 0,
      construction: 'face-frame',
      doorMount: 'full-overlay',
      joinery: 'dado-rabbet',
      carcassThicknessMm: 18,
      backThicknessMm: 6,
      frontThicknessMm: 18,
      revealGapMm: 2,
      countertopEnabled: false,
      countertopThicknessMm: 20,
      countertopOverhangMm: 0,
      doorStyle: 'glass-mullion',
      hingeType: 'concealed-110',
      exteriorMaterial: 'warm-chalk',
      interiorMaterial: 'white-melamine',
      hardwareStyle: 'knob',
      hardwareFinish: 'brushed-brass',
      bays: [
        { id: 'bay-1', layout: 'double-doors', shelfCount: 2, widthRatio: 1.4 },
        { id: 'bay-2', layout: 'open-shelves', shelfCount: 2, widthRatio: 0.7 },
      ],
    },
  },
  {
    id: 'bath-vanity',
    label: 'Bath Vanity',
    typology: 'vanity',
    summary: '1350 mm traditional inset vanity with mortise hinges',
    spec: {
      projectName: 'Double Bath Vanity V-135',
      drawingNumber: 'KM-2026-V135',
      typology: 'vanity',
      cabinetStyle: 'traditional-inset',
      widthMm: 1350,
      heightMm: 840,
      depthMm: 520,
      baseStyle: 'toe-kick',
      toeKickHeightMm: 110,
      toeKickRecessMm: 50,
      construction: 'face-frame',
      doorMount: 'inset',
      joinery: 'dado-rabbet',
      carcassThicknessMm: 18,
      backThicknessMm: 12,
      frontThicknessMm: 19,
      revealGapMm: 2,
      countertopEnabled: true,
      countertopThicknessMm: 30,
      countertopOverhangMm: 20,
      doorStyle: 'raised-panel',
      hingeType: 'butt-mortise',
      exteriorMaterial: 'midnight-navy',
      interiorMaterial: 'maple-veneer',
      hardwareStyle: 'knob',
      hardwareFinish: 'brushed-brass',
      bays: [
        { id: 'bay-1', layout: 'four-drawers', shelfCount: 0, widthRatio: 0.85 },
        { id: 'bay-2', layout: 'double-doors', shelfCount: 1, widthRatio: 1.3 },
        { id: 'bay-3', layout: 'four-drawers', shelfCount: 0, widthRatio: 0.85 },
      ],
    },
  },
];

export function createInitialCabinetSpec(): CabinetSpec {
  const base = CABINET_PRESETS[0].spec;
  return {
    projectName: base.projectName ?? 'Kitchen Base Cabinet B-120',
    drawingNumber: base.drawingNumber ?? 'KM-2026-B120',
    revision: 'Rev A',
    clientName: 'Studio Residence',
    notes: 'All exposed edges 1mm matching ABS/veneer banding. Pre-bore 5mm shelf pins at 32mm centers.',
    typology: base.typology ?? 'base',
    cabinetStyle: base.cabinetStyle ?? 'modern-frameless',
    unit: 'mm',
    widthMm: base.widthMm ?? 1200,
    heightMm: base.heightMm ?? 860,
    depthMm: base.depthMm ?? 580,
    baseStyle: base.baseStyle ?? 'toe-kick',
    toeKickHeightMm: base.toeKickHeightMm ?? 100,
    toeKickRecessMm: base.toeKickRecessMm ?? 55,
    construction: base.construction ?? 'frameless',
    doorMount: base.doorMount ?? 'full-overlay',
    joinery: base.joinery ?? 'dado-rabbet',
    carcassThicknessMm: base.carcassThicknessMm ?? 18,
    backThicknessMm: base.backThicknessMm ?? 6,
    frontThicknessMm: base.frontThicknessMm ?? 19,
    revealGapMm: base.revealGapMm ?? 2.5,
    countertopEnabled: base.countertopEnabled ?? true,
    countertopThicknessMm: base.countertopThicknessMm ?? 30,
    countertopOverhangMm: base.countertopOverhangMm ?? 25,
    bays: base.bays ? base.bays.map((b) => ({ ...b })) : [{ id: 'bay-1', layout: 'double-doors', shelfCount: 1, widthRatio: 1 }],
    doorStyle: base.doorStyle ?? 'shaker',
    hingeType: base.hingeType ?? 'concealed-110',
    exteriorMaterial: base.exteriorMaterial ?? 'white-oak',
    interiorMaterial: base.interiorMaterial ?? 'baltic-birch',
    hardwareStyle: base.hardwareStyle ?? 'bar-pull',
    hardwareFinish: base.hardwareFinish ?? 'brushed-brass',
    sheetSize: '2440x1220',
    sawKerfMm: 3.2,
  };
}

export function formatDim(mm: number, unit: UnitSystem, includeUnit = true): string {
  if (unit === 'mm') {
    const rounded = Math.round(mm * 10) / 10;
    const str = Number.isInteger(rounded) ? `${rounded}` : rounded.toFixed(1);
    return includeUnit ? `${str} mm` : str;
  }
  const inches = mm / 25.4;
  // Format to nearest 1/16" for clean woodworking readability or decimal
  const str = inches.toFixed(2);
  return includeUnit ? `${str}"` : str;
}

export function formatDimCompact(mm: number, unit: UnitSystem): string {
  if (unit === 'mm') {
    const rounded = Math.round(mm * 10) / 10;
    return Number.isInteger(rounded) ? `${rounded}` : rounded.toFixed(1);
  }
  return `${(mm / 25.4).toFixed(2)}"`;
}

export function getEffectiveInteriorMaterial(spec: CabinetSpec): { name: string; baseHex: string; grainHex: string; isWood: boolean; pricePerSheetUsd: number } {
  if (spec.interiorMaterial === 'match-exterior') {
    const ext = EXTERIOR_MATERIALS[spec.exteriorMaterial];
    return {
      name: ext.name,
      baseHex: ext.baseHex,
      grainHex: ext.grainHex,
      isWood: ext.category === 'wood',
      pricePerSheetUsd: ext.pricePerSheetUsd,
    };
  }
  const def = INTERIOR_MATERIALS[spec.interiorMaterial];
  return {
    name: def.name,
    baseHex: def.baseHex,
    grainHex: def.grainHex,
    isWood: def.isWood,
    pricePerSheetUsd: def.pricePerSheetUsd,
  };
}

export function getDrawerSlideLengthMm(carcassDepthMm: number): number {
  const usable = carcassDepthMm - 25;
  const standardSizes = [250, 300, 350, 400, 450, 500, 550, 600];
  let chosen = 250;
  for (const s of standardSizes) {
    if (s <= usable) chosen = s;
  }
  return chosen;
}

function calcEdgeBandingMm(lengthMm: number, widthMm: number, code: string, qty: number): number {
  if (code === 'None') return 0;
  let perPiece = 0;
  const matchL = code.match(/(\d)L/);
  const matchW = code.match(/(\d)W/);
  if (matchL) perPiece += parseInt(matchL[1], 10) * lengthMm;
  if (matchW) perPiece += parseInt(matchW[1], 10) * widthMm;
  return perPiece * qty;
}

/**
 * 2D Shelf-based Guillotine Bin Packer for Sheet Goods Nesting.
 * Groups parts by (materialKey, thicknessMm), respects grain direction when locked,
 * and inserts exact sawKerfMm between adjacent cuts.
 */
function nestPanelsOntoSheets(
  parts: CutListPart[],
  sheetSizeId: SheetSizeId,
  sawKerfMm: number
): NestedSheet[] {
  const sheetDim = SHEET_DIMENSIONS[sheetSizeId];
  const sheetW = sheetDim.widthMm; // 2440 horizontal (grain runs along sheetW)
  const sheetH = sheetDim.heightMm; // 1220 vertical
  const trimMargin = 10; // 10mm factory edge trim on sheet perimeter

  // Group individual part instances by materialKey + thickness
  const groups = new Map<
    string,
    {
      materialKey: string;
      materialName: string;
      thicknessMm: number;
      items: Array<{
        partId: string;
        code: string;
        name: string;
        group: CutListPart['group'];
        lengthMm: number;
        widthMm: number;
        grainLocked: boolean;
      }>;
    }
  >();

  for (const p of parts) {
    if (p.group === 'Countertop') continue; // Slab countertop is stone/solid surface, not nested on sheet goods
    const key = `${p.materialKey}__${p.thicknessMm}`;
    if (!groups.has(key)) {
      groups.set(key, {
        materialKey: p.materialKey,
        materialName: p.materialName,
        thicknessMm: p.thicknessMm,
        items: [],
      });
    }
    const bucket = groups.get(key)!;
    for (let i = 0; i < p.qty; i++) {
      bucket.items.push({
        partId: `${p.id}-${i + 1}`,
        code: p.code,
        name: p.name,
        group: p.group,
        lengthMm: Math.min(p.lengthMm, sheetW - trimMargin * 2),
        widthMm: Math.min(p.widthMm, sheetH - trimMargin * 2),
        grainLocked: p.grainLocked,
      });
    }
  }

  const allSheets: NestedSheet[] = [];
  let globalSheetNumber = 1;

  for (const group of groups.values()) {
    // Sort largest area / tallest first for optimal shelf packing
    const sorted = [...group.items].sort((a, b) => {
      const maxA = Math.max(a.lengthMm, a.widthMm);
      const maxB = Math.max(b.lengthMm, b.widthMm);
      if (maxB !== maxA) return maxB - maxA;
      return b.lengthMm * b.widthMm - a.lengthMm * a.widthMm;
    });

    interface ShelfRow {
      y: number;
      height: number;
      cursorX: number;
    }

    interface OpenSheet {
      shelves: ShelfRow[];
      placed: PlacedPart[];
    }

    const openSheets: OpenSheet[] = [];

    const usableW = sheetW - trimMargin * 2;
    const usableH = sheetH - trimMargin * 2;

    for (const item of sorted) {
      // Orientation candidates: along grain (length along X, width along Y), and optionally rotated 90 deg
      const orientations: Array<{ w: number; h: number; rotated: boolean }> = [
        { w: item.lengthMm, h: item.widthMm, rotated: false },
      ];
      if (!item.grainLocked && item.lengthMm !== item.widthMm) {
        orientations.push({ w: item.widthMm, h: item.lengthMm, rotated: true });
      }
      // If a grain-locked piece exceeds usableW/H in default orientation, allow fallback rotation
      if (item.lengthMm > usableW || item.widthMm > usableH) {
        if (orientations.length === 1) {
          orientations.push({ w: item.widthMm, h: item.lengthMm, rotated: true });
        }
      }

      let placedSuccess = false;

      // Try placing into existing sheets and shelves (Best-Fit Height)
      for (const sheet of openSheets) {
        for (const orient of orientations) {
          if (orient.w > usableW || orient.h > usableH) continue;
          // Try existing shelf
          for (const shelf of sheet.shelves) {
            if (orient.h <= shelf.height && shelf.cursorX + orient.w <= trimMargin + usableW + 0.01) {
              sheet.placed.push({
                partId: item.partId,
                code: item.code,
                name: item.name,
                group: item.group,
                x: shelf.cursorX,
                y: shelf.y,
                w: orient.w,
                h: orient.h,
                rotated: orient.rotated,
              });
              shelf.cursorX += orient.w + sawKerfMm;
              placedSuccess = true;
              break;
            }
          }
          if (placedSuccess) break;

          // Try opening a new shelf in this sheet
          const nextY =
            sheet.shelves.length === 0
              ? trimMargin
              : sheet.shelves[sheet.shelves.length - 1].y +
                sheet.shelves[sheet.shelves.length - 1].height +
                sawKerfMm;

          if (nextY + orient.h <= trimMargin + usableH + 0.01) {
            sheet.shelves.push({
              y: nextY,
              height: orient.h,
              cursorX: trimMargin + orient.w + sawKerfMm,
            });
            sheet.placed.push({
              partId: item.partId,
              code: item.code,
              name: item.name,
              group: item.group,
              x: trimMargin,
              y: nextY,
              w: orient.w,
              h: orient.h,
              rotated: orient.rotated,
            });
            placedSuccess = true;
            break;
          }
        }
        if (placedSuccess) break;
      }

      if (!placedSuccess) {
        // Open brand new sheet
        const chosen =
          orientations.find((o) => o.w <= usableW && o.h <= usableH) ?? orientations[0];
        const newSheet: OpenSheet = {
          shelves: [
            {
              y: trimMargin,
              height: chosen.h,
              cursorX: trimMargin + chosen.w + sawKerfMm,
            },
          ],
          placed: [
            {
              partId: item.partId,
              code: item.code,
              name: item.name,
              group: item.group,
              x: trimMargin,
              y: trimMargin,
              w: chosen.w,
              h: chosen.h,
              rotated: chosen.rotated,
            },
          ],
        };
        openSheets.push(newSheet);
      }
    }

    const totalArea = sheetW * sheetH;
    for (const s of openSheets) {
      const usedArea = s.placed.reduce((acc, p) => acc + p.w * p.h, 0);
      allSheets.push({
        sheetIndex: globalSheetNumber++,
        materialKey: group.materialKey,
        materialName: group.materialName,
        thicknessMm: group.thicknessMm,
        sheetWidthMm: sheetW,
        sheetHeightMm: sheetH,
        parts: s.placed,
        usedAreaMm2: usedArea,
        totalAreaMm2: totalArea,
        utilizationPct: Math.min(99.9, (usedArea / totalArea) * 100),
      });
    }
  }

  return allSheets;
}

/**
 * Full parametric engineering computation for a custom cabinet.
 * Produces exact cut list parts, nested sheets, bay coordinates, hardware schedule, and cost totals.
 */
export function calculateCabinetEngineering(spec: CabinetSpec): CabinetCalculation {
  const t = spec.carcassThicknessMm;
  const backT = spec.backThicknessMm;
  const frontT = spec.frontThicknessMm;
  const gap = spec.revealGapMm;
  const extMat = EXTERIOR_MATERIALS[spec.exteriorMaterial];
  const intMat = getEffectiveInteriorMaterial(spec);

  const styleDef = CABINET_STYLES[spec.cabinetStyle ?? 'modern-frameless'] ?? CABINET_STYLES['modern-frameless'];
  const hingeDef = HINGE_TYPES[spec.hingeType ?? 'concealed-110'] ?? HINGE_TYPES['concealed-110'];
  const doorMount = spec.doorMount ?? 'full-overlay';

  const countertopAllowance = spec.countertopEnabled && spec.typology !== 'wall' && spec.typology !== 'tall'
    ? spec.countertopThicknessMm
    : 0;

  const carcassBottomY = spec.baseStyle === 'wall-hung' ? 0 : spec.toeKickHeightMm;
  const carcassHeightMm = Math.max(240, spec.heightMm - carcassBottomY - countertopAllowance);
  // Inset doors sit flush inside the carcass/face-frame depth; overlay doors sit proud of the box
  const carcassDepthMm = doorMount === 'inset'
    ? Math.max(200, spec.depthMm)
    : Math.max(200, spec.depthMm - frontT);

  const dadoDepth = spec.joinery === 'dado-rabbet' ? 6 : 0;
  const backRecess = 12; // 12mm service void behind back panel for wall scribing
  const innerHeightMm = carcassHeightMm - t * 2;
  const innerDepthMm = carcassDepthMm - backRecess - backT - (doorMount === 'inset' ? frontT : 0);

  const numBays = Math.max(1, spec.bays.length);
  const numDividers = numBays - 1;
  const totalInnerSpanMm = spec.widthMm - t * 2 - numDividers * t;
  const totalRatio = spec.bays.reduce((sum, b) => sum + b.widthRatio, 0);

  // Frame stile margin when face-frame is active
  const faceFrameStileW = spec.construction === 'face-frame' ? 42 : t;
  const frameInsetMargin = doorMount === 'inset' ? faceFrameStileW : 0;

  // Compute exact bay geometry respecting full-overlay, half-overlay, and inset mounts
  const bayGeometries: BayGeometry[] = [];
  let cursorX = t;
  spec.bays.forEach((bay, idx) => {
    const bayInnerW = (totalInnerSpanMm * bay.widthRatio) / totalRatio;
    let frontLeft: number;
    let frontRight: number;

    if (doorMount === 'inset') {
      const leftEdge = idx === 0 ? frameInsetMargin : cursorX + (spec.construction === 'face-frame' ? 12 : 0);
      const rightEdge =
        idx === numBays - 1
          ? spec.widthMm - frameInsetMargin
          : cursorX + bayInnerW - (spec.construction === 'face-frame' ? 12 : 0);
      frontLeft = leftEdge + gap;
      frontRight = rightEdge - gap;
    } else if (doorMount === 'half-overlay') {
      const outerSetback = spec.construction === 'face-frame' ? 22 : t / 2;
      frontLeft = idx === 0 ? outerSetback : cursorX - t / 4 + gap / 2;
      frontRight =
        idx === numBays - 1
          ? spec.widthMm - outerSetback
          : cursorX + bayInnerW + t / 4 - gap / 2;
    } else {
      // Full overlay
      frontLeft = idx === 0 ? gap : cursorX - t / 2 + gap / 2;
      frontRight =
        idx === numBays - 1
          ? spec.widthMm - gap
          : cursorX + bayInnerW + t / 2 - gap / 2;
    }

    const frontW = Math.max(80, frontRight - frontLeft);

    bayGeometries.push({
      bayIndex: idx,
      bay,
      innerLeftMm: cursorX,
      innerWidthMm: bayInnerW,
      frontLeftMm: frontLeft,
      frontWidthMm: frontW,
    });
    cursorX += bayInnerW + t;
  });

  const parts: CutListPart[] = [];
  let partCounter = 1;
  const addPart = (
    codePrefix: string,
    name: string,
    group: CutListPart['group'],
    materialName: string,
    materialKey: string,
    thicknessMm: number,
    lengthMm: number,
    widthMm: number,
    qty: number,
    edgeBanding: string,
    grainLocked: boolean,
    notes: string
  ) => {
    const cleanLen = Math.round(lengthMm * 10) / 10;
    const cleanWid = Math.round(widthMm * 10) / 10;
    parts.push({
      id: `part-${partCounter++}`,
      code: `${codePrefix}-${String(partCounter - 1).padStart(2, '0')}`,
      name,
      group,
      materialName,
      materialKey,
      thicknessMm,
      lengthMm: cleanLen,
      widthMm: cleanWid,
      qty,
      edgeBanding,
      edgeBandingMm: calcEdgeBandingMm(cleanLen, cleanWid, edgeBanding, qty),
      grainLocked,
      notes,
    });
  };

  // 1. CARCASS PANELS
  // Left & Right Gable Sides (exterior exposed veneer/lacquer)
  const gableHeight = spec.baseStyle === 'toe-kick' ? carcassHeightMm : carcassHeightMm;
  addPart(
    'CS',
    'Left & Right Gable Sides',
    'Carcass',
    extMat.name,
    `ext-${extMat.id}`,
    t,
    gableHeight,
    carcassDepthMm,
    2,
    '1L 2W',
    extMat.grainDirection === 'vertical',
    spec.joinery === 'dado-rabbet'
      ? `${dadoDepth}mm back dado, 32mm pin bores`
      : '32mm system dowel & shelf-pin boring'
  );

  // Bottom Deck
  const bottomWidth = spec.widthMm - t * 2 + (spec.joinery === 'dado-rabbet' ? 0 : 0);
  addPart(
    'CD',
    'Bottom Structural Deck',
    'Carcass',
    intMat.name,
    `int-${spec.interiorMaterial}`,
    t,
    bottomWidth,
    carcassDepthMm,
    1,
    '1L',
    intMat.isWood,
    'Flush front edge banded'
  );

  // Top Deck or Base Stretchers
  if (spec.typology === 'base' || spec.typology === 'vanity') {
    addPart(
      'CT',
      'Top Front & Rear Stretchers',
      'Carcass',
      intMat.name,
      `int-${spec.interiorMaterial}`,
      t,
      bottomWidth,
      100,
      2,
      '1L',
      intMat.isWood,
      'Countertop mounting nailers, pre-drilled'
    );
  } else {
    addPart(
      'CT',
      'Top Structural Deck',
      'Carcass',
      extMat.name,
      `ext-${extMat.id}`,
      t,
      bottomWidth,
      carcassDepthMm,
      1,
      '1L',
      extMat.grainDirection === 'vertical',
      'Exposed top panel, front edge banded'
    );
  }

  // Back Panel
  const backW = spec.widthMm - t * 2 + dadoDepth * 2;
  const backH = carcassHeightMm - t * 2 + dadoDepth * 2;
  addPart(
    'CB',
    'Recessed Back Panel',
    'Carcass',
    `${intMat.name} (${backT}mm)`,
    `back-${spec.interiorMaterial}`,
    backT,
    Math.max(backH, backW),
    Math.min(backH, backW),
    1,
    'None',
    false,
    spec.joinery === 'dado-rabbet'
      ? `Set ${backRecess}mm in ${dadoDepth}mm dado groove`
      : `Plant-on / rabbeted ${backRecess}mm from rear`
  );

  // Nailer cleats for wall-hung or tall cabinets
  if (spec.typology === 'wall' || spec.typology === 'tall' || spec.baseStyle === 'wall-hung') {
    addPart(
      'CN',
      'Rear Hanging Rail Cleat',
      'Carcass',
      intMat.name,
      `int-${spec.interiorMaterial}`,
      t,
      bottomWidth,
      90,
      spec.typology === 'tall' ? 2 : 1,
      'None',
      false,
      'Structural wall-mount ledger rail'
    );
  }

  // Face-Frame rails & stiles if face-frame construction selected
  if (spec.construction === 'face-frame') {
    const stileW = 44;
    addPart(
      'FF',
      'Face-Frame Outer Stiles',
      'Carcass',
      extMat.name,
      `ext-${extMat.id}`,
      20,
      carcassHeightMm,
      stileW,
      2,
      '2L',
      extMat.grainDirection === 'vertical',
      'Pocket-screwed / dowelled to gable front'
    );
    addPart(
      'FF',
      'Face-Frame Top & Bottom Rails',
      'Carcass',
      extMat.name,
      `ext-${extMat.id}`,
      20,
      spec.widthMm - stileW * 2,
      stileW,
      2,
      '2L',
      extMat.grainDirection === 'vertical',
      'Flush face-frame assembly'
    );
    if (numDividers > 0) {
      addPart(
        'FF',
        'Face-Frame Center Mullions',
        'Carcass',
        extMat.name,
        `ext-${extMat.id}`,
        20,
        carcassHeightMm - stileW * 2,
        stileW,
        numDividers,
        '2L',
        extMat.grainDirection === 'vertical',
        'Aligned to interior vertical partitions'
      );
    }
  }

  // Style-specific architectural moldings & trim wraps
  if (styleDef.hasCrownTrim && countertopAllowance === 0) {
    addPart(
      'TR',
      'Stepped Architectural Crown Cornice',
      'Carcass',
      extMat.name,
      `ext-${extMat.id}`,
      22,
      spec.widthMm + 48,
      58,
      1,
      '1L 2W',
      false,
      'Mitered 45° returns · Traditional cornice profile'
    );
    addPart(
      'TR',
      'Crown Return Side Moldings',
      'Carcass',
      extMat.name,
      `ext-${extMat.id}`,
      22,
      carcassDepthMm + 24,
      58,
      2,
      '1L',
      false,
      'Left & right mitered cornice returns'
    );
  } else if (styleDef.hasMiteredWrap) {
    addPart(
      'TR',
      'Mid-Century 45° Mitered Surround Trim',
      'Carcass',
      extMat.name,
      `ext-${extMat.id}`,
      20,
      spec.widthMm,
      36,
      2,
      '1L',
      false,
      'Beveled 45° mitered top & bottom case lip'
    );
  }

  // 2. INTERIOR DIVIDERS & SHELVES
  if (numDividers > 0) {
    addPart(
      'ID',
      'Vertical Bay Partitions',
      'Interior',
      intMat.name,
      `int-${spec.interiorMaterial}`,
      t,
      innerHeightMm,
      innerDepthMm,
      numDividers,
      '1L',
      intMat.isWood,
      'Double-sided 32mm shelf-pin boring'
    );
  }

  // Base Plinth / Toe-Kick
  if (spec.baseStyle === 'toe-kick' && spec.toeKickHeightMm > 0) {
    addPart(
      'BP',
      'Toe-Kick Front Plinth',
      'Base & Plinth',
      extMat.name,
      `ext-${extMat.id}`,
      t,
      spec.widthMm,
      spec.toeKickHeightMm,
      1,
      '1L 2W',
      false,
      `Recessed ${spec.toeKickRecessMm}mm from front face`
    );
    addPart(
      'BP',
      'Plinth Rear & Cross Sleepers',
      'Base & Plinth',
      intMat.name,
      `int-${spec.interiorMaterial}`,
      t,
      carcassDepthMm - spec.toeKickRecessMm - t,
      spec.toeKickHeightMm,
      Math.max(2, numBays + 1),
      'None',
      false,
      'Leveling ladder plinth framing'
    );
  }

  // Countertop slab if enabled
  if (countertopAllowance > 0) {
    addPart(
      'TP',
      'Architectural Countertop Slab',
      'Countertop',
      'Honed Quartz / Solid Surface',
      'countertop-slab',
      spec.countertopThicknessMm,
      spec.widthMm + spec.countertopOverhangMm * 2,
      spec.depthMm + spec.countertopOverhangMm,
      1,
      'None',
      false,
      `${spec.countertopOverhangMm}mm front & side overhang`
    );
  }

  // 3. PER-BAY SHELVES, DOORS, DRAWER FRONTS & DRAWER BOXES
  let totalDoorCount = 0;
  let totalHinges = 0;
  let totalDrawerCount = 0;
  let totalShelfPins = 0;
  let totalHandles = 0;

  const slideLenMm = getDrawerSlideLengthMm(carcassDepthMm);
  const drawerSideClearance = 26; // 13mm per side for standard soft-close slides (or undermount)
  const drawerBoxT = 15; // 15mm Baltic Birch drawer box sides
  const drawerBottomT = 6; // 6mm drawer bottom

  bayGeometries.forEach((bg) => {
    const bLabel = `Bay ${bg.bayIndex + 1}`;
    const { layout, shelfCount } = bg.bay;

    // Adjustable shelves (for bays that have shelving)
    const hasShelves =
      layout === 'double-doors' ||
      layout === 'single-door-left' ||
      layout === 'single-door-right' ||
      layout === 'drawer-and-doors' ||
      layout === 'open-shelves';

    if (hasShelves && shelfCount > 0) {
      const shelfW = bg.innerWidthMm - 2; // 2mm clearance for easy insertion
      const shelfD = innerDepthMm - 20; // 20mm setback behind doors
      addPart(
        'IS',
        `Adjustable Shelves (${bLabel})`,
        'Interior',
        intMat.name,
        `int-${spec.interiorMaterial}`,
        t,
        shelfW,
        shelfD,
        shelfCount,
        '1L',
        intMat.isWood,
        'Supported on 5mm steel shelf pins'
      );
      totalShelfPins += shelfCount * 4;
    }

    const insetTopBotTrim = doorMount === 'inset'
      ? (spec.construction === 'face-frame' ? 42 : t)
      : doorMount === 'half-overlay' && spec.construction === 'face-frame'
        ? 20
        : 0;
    const frontHeightTotal = Math.max(120, carcassHeightMm - insetTopBotTrim * 2 - gap * 2);
    const doorStyleName = DOOR_STYLE_DEFS[spec.doorStyle]?.name ?? spec.doorStyle;
    const hingeNote = hingeDef.shortName;

    const hingesForDoor = (h: number) => {
      if (hingeDef.isContinuous) return 1; // 1 continuous strip per door
      if (spec.hingeType === 'knife-pivot') return 2; // top + bottom pivot pair (2 pcs)
      return h >= 1500 ? 4 : h >= 900 ? 3 : 2;
    };

    if (layout === 'double-doors') {
      const eachDoorW = (bg.frontWidthMm - gap) / 2;
      addPart(
        'FR',
        `Double Cabinet Doors (${bLabel})`,
        'Fronts',
        extMat.name,
        `ext-${extMat.id}`,
        frontT,
        frontHeightTotal,
        eachDoorW,
        2,
        '2L 2W',
        extMat.grainDirection === 'vertical',
        `${doorStyleName} · ${doorMount} · ${hingeNote}`
      );
      totalDoorCount += 2;
      totalHinges += hingesForDoor(frontHeightTotal) * 2;
      if (spec.hardwareStyle !== 'push-to-open') totalHandles += 2;
    } else if (layout === 'single-door-left' || layout === 'single-door-right') {
      addPart(
        'FR',
        `Single Door ${layout === 'single-door-left' ? 'LH' : 'RH'} (${bLabel})`,
        'Fronts',
        extMat.name,
        `ext-${extMat.id}`,
        frontT,
        frontHeightTotal,
        bg.frontWidthMm,
        1,
        '2L 2W',
        extMat.grainDirection === 'vertical',
        `${doorStyleName} · ${layout === 'single-door-left' ? 'LH' : 'RH'} · ${hingeNote}`
      );
      totalDoorCount += 1;
      totalHinges += hingesForDoor(frontHeightTotal);
      if (spec.hardwareStyle !== 'push-to-open') totalHandles += 1;
    } else if (layout === 'drawer-and-doors') {
      const topDrawerFrontH = Math.min(180, Math.round(frontHeightTotal * 0.24));
      const lowerDoorH = frontHeightTotal - topDrawerFrontH - gap;
      const eachDoorW = (bg.frontWidthMm - gap) / 2;

      addPart(
        'FR',
        `Top Drawer Front (${bLabel})`,
        'Fronts',
        extMat.name,
        `ext-${extMat.id}`,
        frontT,
        bg.frontWidthMm,
        topDrawerFrontH,
        1,
        '2L 2W',
        false,
        `${doorStyleName} drawer fascia (${doorMount})`
      );
      addPart(
        'FR',
        `Lower Double Doors (${bLabel})`,
        'Fronts',
        extMat.name,
        `ext-${extMat.id}`,
        frontT,
        lowerDoorH,
        eachDoorW,
        2,
        '2L 2W',
        extMat.grainDirection === 'vertical',
        `${doorStyleName} · ${doorMount} · ${hingeNote}`
      );

      // Drawer box for top drawer
      const boxOuterW = bg.innerWidthMm - drawerSideClearance;
      const boxH = Math.max(85, topDrawerFrontH - 42);
      addPart(
        'DB',
        `Drawer Box Sides (${bLabel})`,
        'Drawer Boxes',
        'Baltic Birch 15mm',
        'drawer-birch-15',
        drawerBoxT,
        slideLenMm,
        boxH,
        2,
        '1L',
        true,
        `For ${slideLenMm}mm full-ext slides`
      );
      addPart(
        'DB',
        `Drawer Front & Back Sub-Box (${bLabel})`,
        'Drawer Boxes',
        'Baltic Birch 15mm',
        'drawer-birch-15',
        drawerBoxT,
        boxOuterW - drawerBoxT * 2,
        boxH,
        2,
        '1L',
        true,
        'Dadoed for 6mm bottom'
      );
      addPart(
        'DB',
        `Drawer Box Bottom (${bLabel})`,
        'Drawer Boxes',
        'Baltic Birch 6mm',
        'drawer-birch-6',
        drawerBottomT,
        slideLenMm - 20,
        boxOuterW - drawerBoxT * 2 + 10,
        1,
        'None',
        false,
        'Captured in 6mm drawer side groove'
      );

      totalDrawerCount += 1;
      totalDoorCount += 2;
      totalHinges += hingesForDoor(lowerDoorH) * 2;
      if (spec.hardwareStyle !== 'push-to-open') totalHandles += 3;
    } else if (layout === 'three-drawers' || layout === 'four-drawers') {
      const count = layout === 'three-drawers' ? 3 : 4;
      // Graduated heights: top drawer slightly shallower, lower drawers deeper
      const weights = count === 3 ? [0.24, 0.38, 0.38] : [0.19, 0.23, 0.28, 0.30];
      const availableH = frontHeightTotal - gap * (count - 1);
      const boxOuterW = bg.innerWidthMm - drawerSideClearance;

      weights.forEach((w, dIdx) => {
        const dFrontH = Math.round(availableH * w);
        const boxH = Math.max(80, dFrontH - 44);
        addPart(
          'FR',
          `Drawer Front #${dIdx + 1} (${bLabel})`,
          'Fronts',
          extMat.name,
          `ext-${extMat.id}`,
          frontT,
          bg.frontWidthMm,
          dFrontH,
          1,
          '2L 2W',
          false,
          `${spec.doorStyle} fascia`
        );
        addPart(
          'DB',
          `Drawer #${dIdx + 1} Sides (${bLabel})`,
          'Drawer Boxes',
          'Baltic Birch 15mm',
          'drawer-birch-15',
          drawerBoxT,
          slideLenMm,
          boxH,
          2,
          '1L',
          true,
          `Sized for ${slideLenMm}mm slides`
        );
        addPart(
          'DB',
          `Drawer #${dIdx + 1} Front/Back (${bLabel})`,
          'Drawer Boxes',
          'Baltic Birch 15mm',
          'drawer-birch-15',
          drawerBoxT,
          boxOuterW - drawerBoxT * 2,
          boxH,
          2,
          '1L',
          true,
          'Captive bottom dado'
        );
        addPart(
          'DB',
          `Drawer #${dIdx + 1} Bottom (${bLabel})`,
          'Drawer Boxes',
          'Baltic Birch 6mm',
          'drawer-birch-6',
          drawerBottomT,
          slideLenMm - 20,
          boxOuterW - drawerBoxT * 2 + 10,
          1,
          'None',
          false,
          '6mm plywood bottom'
        );
      });

      totalDrawerCount += count;
      if (spec.hardwareStyle !== 'push-to-open') totalHandles += count;
    }
  });

  // 4. SHEET NESTING
  const sheets = nestPanelsOntoSheets(parts, spec.sheetSize, spec.sawKerfMm);
  const totalPanelCount = parts.reduce((sum, p) => sum + p.qty, 0);
  const totalSheetCount = sheets.length;
  const avgUtilizationPct =
    sheets.length > 0
      ? sheets.reduce((sum, s) => sum + s.utilizationPct, 0) / sheets.length
      : 0;

  const totalEdgeBandingM =
    Math.ceil((parts.reduce((sum, p) => sum + p.edgeBandingMm, 0) / 1000) * 1.12 * 10) / 10; // +12% trimming allowance

  // 5. HARDWARE & BILL OF MATERIALS
  const hwFinish = HARDWARE_FINISHES[spec.hardwareFinish];
  const hardware: HardwareItem[] = [];

  if (totalHinges > 0) {
    const finishNote =
      hingeDef.visibility !== 'Concealed' ? `${hwFinish.name} · ` : '';
    hardware.push({
      id: 'hw-hinges',
      category: 'Hinges',
      name: hingeDef.name,
      spec: `${finishNote}${hingeDef.machiningSpec} (${doorMount})`,
      qty: totalHinges,
      unit: hingeDef.isContinuous ? 'strips' : 'pcs',
      unitPriceUsd: hingeDef.unitPriceUsd,
      totalPriceUsd: Math.round(totalHinges * hingeDef.unitPriceUsd * 100) / 100,
    });
  }

  // Architectural glass panes if glass-mullion doors are selected
  if (spec.doorStyle === 'glass-mullion' && totalDoorCount > 0) {
    hardware.push({
      id: 'hw-glass-panes',
      category: 'Structural',
      name: '4mm Tempered Low-Iron Architectural Glass Inserts',
      spec: 'Polished edges · silicone glazing bead retainers',
      qty: totalDoorCount,
      unit: 'panes',
      unitPriceUsd: 32.0,
      totalPriceUsd: totalDoorCount * 32.0,
    });
  }

  // Industrial Steel Frame corner angles if industrial-steel cabinet style selected
  if (styleDef.hasSteelFrame) {
    hardware.push({
      id: 'hw-steel-frame',
      category: 'Structural',
      name: '25×25mm Powder-Coated Structural Steel Frame Kit',
      spec: `${hwFinish.name} · perimeter welded corners + countersunk screws`,
      qty: 1,
      unit: 'kit',
      unitPriceUsd: 135.0,
      totalPriceUsd: 135.0,
    });
  }

  if (totalDrawerCount > 0) {
    hardware.push({
      id: 'hw-slides',
      category: 'Slides',
      name: 'Undermount Soft-Close Drawer Slides',
      spec: `${slideLenMm} mm full-extension · 45 kg load rating`,
      qty: totalDrawerCount,
      unit: 'pairs',
      unitPriceUsd: 34.0,
      totalPriceUsd: totalDrawerCount * 34.0,
    });
  }

  if (spec.hardwareStyle === 'push-to-open') {
    const pushCount = totalDoorCount + totalDrawerCount;
    if (pushCount > 0) {
      hardware.push({
        id: 'hw-push',
        category: 'Pulls',
        name: 'Magnetic Tip-On Push Latch',
        spec: 'Flush-bored 10mm adapter · handleless release',
        qty: pushCount,
        unit: 'pcs',
        unitPriceUsd: 5.25,
        totalPriceUsd: pushCount * 5.25,
      });
    }
  } else if (totalHandles > 0) {
    const styleLabel =
      spec.hardwareStyle === 'bar-pull'
        ? 'Machined Architectural Bar Pull (160mm CC)'
        : spec.hardwareStyle === 'knob'
          ? 'Turned Solid Cylinder Knob (28mm Ø)'
          : 'Extruded Aluminum Edge Finger Pull (200mm)';
    const price = spec.hardwareStyle === 'bar-pull' ? 14.5 : spec.hardwareStyle === 'knob' ? 9.5 : 16.0;
    hardware.push({
      id: 'hw-pulls',
      category: 'Pulls',
      name: styleLabel,
      spec: `${hwFinish.name} · M4 mounting bolts included`,
      qty: totalHandles,
      unit: 'pcs',
      unitPriceUsd: price,
      totalPriceUsd: totalHandles * price,
    });
  }

  if (totalShelfPins > 0) {
    hardware.push({
      id: 'hw-pins',
      category: 'Fasteners',
      name: '5mm Steel Spoon Shelf Supports',
      spec: 'Nickel-plated · 32mm system boring',
      qty: totalShelfPins,
      unit: 'pcs',
      unitPriceUsd: 0.35,
      totalPriceUsd: Math.round(totalShelfPins * 0.35 * 100) / 100,
    });
  }

  const fastenerQty = Math.max(16, (numBays + 1) * 12);
  hardware.push({
    id: 'hw-fasteners',
    category: 'Fasteners',
    name:
      spec.joinery === 'dowel-32mm'
        ? '8×35mm Fluted Beech Dowels & Confirmat Screws'
        : spec.joinery === 'cam-lock'
          ? '15mm Minifix Cam-Lock & Bolt Connectors'
          : '7×50mm Confirmat Carcass Screws & PVA Wood Glue',
    spec: `${spec.joinery} assembly hardware pack`,
    qty: fastenerQty,
    unit: 'sets',
    unitPriceUsd: 0.45,
    totalPriceUsd: Math.round(fastenerQty * 0.45 * 100) / 100,
  });

  if (spec.baseStyle === 'steel-legs') {
    const legCount = spec.widthMm >= 1400 ? 6 : 4;
    hardware.push({
      id: 'hw-legs',
      category: 'Structural',
      name: 'Tapered Architectural Steel Furniture Legs',
      spec: `${spec.toeKickHeightMm} mm height · ${hwFinish.name} · leveling glides`,
      qty: legCount,
      unit: 'pcs',
      unitPriceUsd: 22.0,
      totalPriceUsd: legCount * 22.0,
    });
  } else if (spec.baseStyle === 'wall-hung') {
    hardware.push({
      id: 'hw-hangers',
      category: 'Structural',
      name: 'Heavy-Duty Concealed Cabinet Suspension Brackets',
      spec: '120 kg/pair load rating · galvanized steel rail',
      qty: Math.max(2, numBays + 1),
      unit: 'pcs',
      unitPriceUsd: 11.5,
      totalPriceUsd: Math.max(2, numBays + 1) * 11.5,
    });
  }

  hardware.push({
    id: 'hw-edge',
    category: 'Edge Banding',
    name: `1mm Pre-Glued Edge Banding (${extMat.name})`,
    spec: `${spec.carcassThicknessMm + 4} mm coil width · includes 12% trim waste`,
    qty: totalEdgeBandingM,
    unit: 'm',
    unitPriceUsd: 1.85,
    totalPriceUsd: Math.round(totalEdgeBandingM * 1.85 * 100) / 100,
  });

  // 6. COST ESTIMATION
  const sheetCostByKey = (key: string, thickness: number): number => {
    if (key.startsWith('ext-')) return extMat.pricePerSheetUsd;
    if (key.startsWith('int-')) return intMat.pricePerSheetUsd;
    if (key.startsWith('back-')) return thickness <= 6 ? 48 : 82;
    if (key === 'drawer-birch-15') return 98;
    if (key === 'drawer-birch-6') return 46;
    return 110;
  };

  let estimatedSheetCostUsd = sheets.reduce(
    (sum, s) => sum + sheetCostByKey(s.materialKey, s.thicknessMm),
    0
  );
  if (countertopAllowance > 0) {
    const areaSqM = ((spec.widthMm + spec.countertopOverhangMm * 2) * (spec.depthMm + spec.countertopOverhangMm)) / 1_000_000;
    estimatedSheetCostUsd += Math.round(areaSqM * 360);
  }

  const estimatedHardwareCostUsd = Math.round(
    hardware.reduce((sum, h) => sum + h.totalPriceUsd, 0) * 100
  ) / 100;

  // 32mm Boring count (hinge cup boring only counted when hinge requires 35mm cups)
  const shelfPinHoleRows = Math.max(3, Math.floor((innerHeightMm - 160) / 32));
  const hingeBoreCount = hingeDef.requiresCupBore ? totalHinges * 3 : totalHinges * 4;
  const totalBoringHoles =
    numBays * shelfPinHoleRows * 4 + hingeBoreCount + totalDrawerCount * 10;

  return {
    carcassBottomY,
    carcassHeightMm,
    carcassDepthMm,
    innerHeightMm,
    innerDepthMm,
    bayGeometries,
    parts,
    sheets,
    hardware,
    totalPanelCount,
    totalSheetCount,
    avgUtilizationPct,
    totalEdgeBandingM,
    estimatedSheetCostUsd: Math.round(estimatedSheetCostUsd),
    estimatedHardwareCostUsd: Math.round(estimatedHardwareCostUsd),
    estimatedTotalCostUsd: Math.round(estimatedSheetCostUsd + estimatedHardwareCostUsd),
    shelfPinHoleRows,
    totalBoringHoles,
  };
}
