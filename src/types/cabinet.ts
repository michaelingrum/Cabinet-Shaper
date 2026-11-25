export type UnitSystem = 'mm' | 'in';

export type CabinetTypology = 'base' | 'wall' | 'tall' | 'credenza' | 'vanity';

export type CabinetStyleId =
  | 'modern-frameless'
  | 'traditional-inset'
  | 'transitional-overlay'
  | 'mid-century'
  | 'industrial-steel';

export type ConstructionType = 'frameless' | 'face-frame';

export type DoorMountType = 'full-overlay' | 'half-overlay' | 'inset';

export type JoineryMethod = 'dado-rabbet' | 'dowel-32mm' | 'cam-lock';

export type BaseStyle = 'toe-kick' | 'steel-legs' | 'wall-hung';

export type BayLayout =
  | 'double-doors'
  | 'single-door-left'
  | 'single-door-right'
  | 'drawer-and-doors'
  | 'three-drawers'
  | 'four-drawers'
  | 'open-shelves';

export type DoorStyle =
  | 'slab'
  | 'shaker'
  | 'slim-shaker'
  | 'raised-panel'
  | 'glass-mullion'
  | 'louvered'
  | 'beveled'
  | 'fluted';

export type HingeType =
  | 'concealed-110'
  | 'concealed-170'
  | 'butt-mortise'
  | 'knife-pivot'
  | 'wrap-around'
  | 'piano-continuous';

export type HardwareStyle = 'bar-pull' | 'knob' | 'edge-pull' | 'push-to-open';

export type HardwareFinishId = 'brushed-brass' | 'matte-black' | 'brushed-steel' | 'burnished-bronze';

export type ExteriorMaterialId =
  | 'white-oak'
  | 'black-walnut'
  | 'nordic-birch'
  | 'matte-charcoal'
  | 'sage-lacquer'
  | 'warm-chalk'
  | 'midnight-navy';

export type InteriorMaterialId = 'baltic-birch' | 'white-melamine' | 'maple-veneer' | 'match-exterior';

export type SheetSizeId = '2440x1220' | '1525x1525';

export interface BayConfig {
  id: string;
  layout: BayLayout;
  shelfCount: number;
  widthRatio: number; // relative weight, default 1
}

export interface CabinetSpec {
  projectName: string;
  drawingNumber: string;
  revision: string;
  clientName: string;
  notes: string;
  typology: CabinetTypology;
  cabinetStyle: CabinetStyleId;
  unit: UnitSystem;

  // Overall dimensions in mm
  widthMm: number;
  heightMm: number;
  depthMm: number;

  // Base / Plinth
  baseStyle: BaseStyle;
  toeKickHeightMm: number;
  toeKickRecessMm: number;

  // Construction & Material Thicknesses in mm
  construction: ConstructionType;
  doorMount: DoorMountType;
  joinery: JoineryMethod;
  carcassThicknessMm: number;
  backThicknessMm: number;
  frontThicknessMm: number;
  revealGapMm: number;
  countertopEnabled: boolean;
  countertopThicknessMm: number;
  countertopOverhangMm: number;

  // Bays
  bays: BayConfig[];

  // Styling & Materials
  doorStyle: DoorStyle;
  hingeType: HingeType;
  exteriorMaterial: ExteriorMaterialId;
  interiorMaterial: InteriorMaterialId;
  hardwareStyle: HardwareStyle;
  hardwareFinish: HardwareFinishId;

  // Nesting settings
  sheetSize: SheetSizeId;
  sawKerfMm: number;
}

export interface CabinetStyleDef {
  id: CabinetStyleId;
  name: string;
  shortName: string;
  description: string;
  defaultConstruction: ConstructionType;
  defaultDoorMount: DoorMountType;
  defaultDoorStyle: DoorStyle;
  defaultHingeType: HingeType;
  hasCrownTrim: boolean;
  hasMiteredWrap: boolean;
  hasSteelFrame: boolean;
}

export interface HingeDef {
  id: HingeType;
  name: string;
  shortName: string;
  openingAngleDeg: number;
  maxPreviewAngleDeg: number;
  visibility: 'Concealed' | 'Semi-Concealed' | 'Exposed';
  machiningSpec: string;
  unitPriceUsd: number;
  isContinuous?: boolean;
  requiresCupBore: boolean;
  description: string;
}

export interface MaterialDef {
  id: ExteriorMaterialId;
  name: string;
  category: 'wood' | 'lacquer';
  baseHex: string;
  grainHex: string;
  roughness: number;
  metalness: number;
  clearcoat: number;
  pricePerSheetUsd: number;
  grainDirection: 'vertical' | 'none';
  description: string;
}

export interface InteriorMaterialDef {
  id: InteriorMaterialId;
  name: string;
  baseHex: string;
  grainHex: string;
  isWood: boolean;
  pricePerSheetUsd: number;
}

export interface HardwareFinishDef {
  id: HardwareFinishId;
  name: string;
  hex: string;
  roughness: number;
  metalness: number;
}

export type PartGroup = 'Carcass' | 'Interior' | 'Fronts' | 'Drawer Boxes' | 'Base & Plinth' | 'Countertop';

export interface CutListPart {
  id: string;
  code: string;
  name: string;
  group: PartGroup;
  materialName: string;
  materialKey: string;
  thicknessMm: number;
  lengthMm: number; // along grain when grain locked
  widthMm: number;
  qty: number;
  edgeBanding: string; // e.g., "1L 2W" or "2L 2W" or "None"
  edgeBandingMm: number; // total linear mm for qty
  grainLocked: boolean;
  notes: string;
}

export interface PlacedPart {
  partId: string;
  code: string;
  name: string;
  group: PartGroup;
  x: number;
  y: number;
  w: number;
  h: number;
  rotated: boolean;
}

export interface NestedSheet {
  sheetIndex: number;
  materialKey: string;
  materialName: string;
  thicknessMm: number;
  sheetWidthMm: number;
  sheetHeightMm: number;
  parts: PlacedPart[];
  usedAreaMm2: number;
  totalAreaMm2: number;
  utilizationPct: number;
}

export interface HardwareItem {
  id: string;
  category: 'Hinges' | 'Slides' | 'Pulls' | 'Fasteners' | 'Edge Banding' | 'Structural';
  name: string;
  spec: string;
  qty: number;
  unit: string;
  unitPriceUsd: number;
  totalPriceUsd: number;
}

export interface BayGeometry {
  bayIndex: number;
  bay: BayConfig;
  innerLeftMm: number; // measured from left exterior face (0)
  innerWidthMm: number;
  frontLeftMm: number;
  frontWidthMm: number;
}

export interface CabinetCalculation {
  carcassBottomY: number; // height above floor where carcass box begins
  carcassHeightMm: number;
  carcassDepthMm: number; // without front doors
  innerHeightMm: number;
  innerDepthMm: number;
  bayGeometries: BayGeometry[];
  parts: CutListPart[];
  sheets: NestedSheet[];
  hardware: HardwareItem[];
  totalPanelCount: number;
  totalSheetCount: number;
  avgUtilizationPct: number;
  totalEdgeBandingM: number;
  estimatedSheetCostUsd: number;
  estimatedHardwareCostUsd: number;
  estimatedTotalCostUsd: number;
  shelfPinHoleRows: number;
  totalBoringHoles: number;
}

export type ActiveWorkspaceTab = 'studio' | 'blueprints' | 'cutlist' | 'hardware';

export type CameraPresetId = 'three-quarter' | 'front' | 'side' | 'top' | 'interior';
