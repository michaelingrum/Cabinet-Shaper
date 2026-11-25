import React, { useState } from 'react';
import { Plus, Trash2, RotateCcw } from 'lucide-react';
import {
  BaseStyle,
  BayLayout,
  CabinetSpec,
  CabinetStyleId,
  ConstructionType,
  DoorMountType,
  DoorStyle,
  ExteriorMaterialId,
  HardwareFinishId,
  HardwareStyle,
  HingeType,
  InteriorMaterialId,
  JoineryMethod,
} from '../types/cabinet';
import {
  CABINET_PRESETS,
  CABINET_STYLES,
  DOOR_STYLE_DEFS,
  EXTERIOR_MATERIALS,
  HARDWARE_FINISHES,
  HINGE_TYPES,
  INTERIOR_MATERIALS,
  formatDim,
} from '../engine/cabinetEngine';

interface ConfigSidebarProps {
  spec: CabinetSpec;
  onChange: (updater: (prev: CabinetSpec) => CabinetSpec) => void;
  onApplyPreset: (presetId: string) => void;
  onReset: () => void;
}

type InspectorTab = 'dimensions' | 'style' | 'bays' | 'construction';

const BAY_LAYOUT_OPTIONS: Array<{ value: BayLayout; label: string }> = [
  { value: 'double-doors', label: 'Double Doors' },
  { value: 'single-door-left', label: 'Single Door (LH)' },
  { value: 'single-door-right', label: 'Single Door (RH)' },
  { value: 'drawer-and-doors', label: 'Top Drawer + Doors' },
  { value: 'three-drawers', label: '3-Drawer Bank' },
  { value: 'four-drawers', label: '4-Drawer Bank' },
  { value: 'open-shelves', label: 'Open Shelving' },
];

const DOOR_MOUNT_OPTIONS: Array<{ value: DoorMountType; label: string }> = [
  { value: 'full-overlay', label: 'Full Overlay' },
  { value: 'half-overlay', label: 'Half Overlay' },
  { value: 'inset', label: 'Flush Inset' },
];

const HARDWARE_STYLES: Array<{ value: HardwareStyle; label: string }> = [
  { value: 'bar-pull', label: 'Bar Pull' },
  { value: 'knob', label: 'Turned Knob' },
  { value: 'edge-pull', label: 'Edge Pull' },
  { value: 'push-to-open', label: 'Push-to-Open' },
];

export const ConfigSidebar: React.FC<ConfigSidebarProps> = ({
  spec,
  onChange,
  onApplyPreset,
  onReset,
}) => {
  const [section, setSection] = useState<InspectorTab>('dimensions');

  const activeCabinetStyle = spec.cabinetStyle ?? 'modern-frameless';
  const activeDoorMount = spec.doorMount ?? 'full-overlay';
  const activeHingeType = spec.hingeType ?? 'concealed-110';

  const handleSelectCabinetStyle = (styleId: CabinetStyleId) => {
    const def = CABINET_STYLES[styleId];
    onChange((prev) => ({
      ...prev,
      cabinetStyle: styleId,
      construction: def.defaultConstruction,
      doorMount: def.defaultDoorMount,
      doorStyle: def.defaultDoorStyle,
      hingeType: def.defaultHingeType,
    }));
  };

  const updateField = <K extends keyof CabinetSpec>(key: K, value: CabinetSpec[K]) => {
    onChange((prev) => ({ ...prev, [key]: value }));
  };

  const handleAddBay = () => {
    if (spec.bays.length >= 4) return;
    onChange((prev) => ({
      ...prev,
      widthMm: Math.min(2400, Math.max(prev.widthMm, (prev.bays.length + 1) * 450)),
      bays: [
        ...prev.bays,
        {
          id: `bay-${Date.now()}`,
          layout: 'double-doors',
          shelfCount: 1,
          widthRatio: 1,
        },
      ],
    }));
  };

  const handleRemoveBay = (idx: number) => {
    if (spec.bays.length <= 1) return;
    onChange((prev) => ({
      ...prev,
      bays: prev.bays.filter((_, i) => i !== idx),
    }));
  };

  const handleBayUpdate = (idx: number, patch: Partial<CabinetSpec['bays'][number]>) => {
    onChange((prev) => ({
      ...prev,
      bays: prev.bays.map((b, i) => (i === idx ? { ...b, ...patch } : b)),
    }));
  };

  return (
    <aside className="w-full lg:w-[348px] shrink-0 border-r border-[#E2E4E8] bg-[#FFFFFF] flex flex-col h-full overflow-hidden">
      {/* Top Presets & Unit Bar */}
      <div className="px-4 pt-4 pb-3 border-b border-[#ECEEF1]">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-semibold text-[#141517]">Cabinet Templates</span>
          <div className="flex items-center gap-2">
            {/* Unit Toggle (mm / in) */}
            <div className="flex items-center rounded-md bg-[#F2F3F5] p-0.5 text-[11px] font-mono">
              <button
                type="button"
                onClick={() => updateField('unit', 'mm')}
                className={`px-2 py-0.5 rounded transition-colors cursor-pointer whitespace-nowrap ${
                  spec.unit === 'mm'
                    ? 'bg-[#FFFFFF] text-[#141517] font-medium shadow-xs'
                    : 'text-[#5A5E66] hover:text-[#141517]'
                }`}
              >
                mm
              </button>
              <button
                type="button"
                onClick={() => updateField('unit', 'in')}
                className={`px-2 py-0.5 rounded transition-colors cursor-pointer whitespace-nowrap ${
                  spec.unit === 'in'
                    ? 'bg-[#FFFFFF] text-[#141517] font-medium shadow-xs'
                    : 'text-[#5A5E66] hover:text-[#141517]'
                }`}
              >
                in
              </button>
            </div>
            <button
              type="button"
              onClick={onReset}
              className="p-1 text-[#5A5E66] hover:text-[#141517] rounded transition-colors cursor-pointer"
              title="Reset to default cabinet"
              aria-label="Reset cabinet configuration"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Preset horizontal grid */}
        <div className="flex flex-wrap gap-1.5">
          {CABINET_PRESETS.map((preset) => {
            const active = spec.typology === preset.typology && spec.projectName === preset.spec.projectName;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onApplyPreset(preset.id)}
                className={`px-2.5 py-1.5 rounded-md text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap ${
                  active
                    ? 'border-[#1D4ED8] bg-[#1D4ED8]/8 text-[#1D4ED8]'
                    : 'border-[#E2E4E8] bg-[#FAFAFA] text-[#3F444E] hover:border-[#C2C7D0] hover:bg-[#FFFFFF]'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Inspector Section Tabs */}
      <div className="px-4 py-2.5 border-b border-[#ECEEF1] bg-[#FAFAFB]">
        <div className="grid grid-cols-4 gap-1 rounded-lg bg-[#ECEEF2] p-1">
          {(
            [
              { id: 'dimensions', label: 'Size' },
              { id: 'style', label: 'Style' },
              { id: 'bays', label: 'Bays' },
              { id: 'construction', label: 'Joinery' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSection(tab.id)}
              className={`py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                section === tab.id
                  ? 'bg-[#FFFFFF] text-[#141517] shadow-xs'
                  : 'text-[#5A5E66] hover:text-[#141517]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable Inspector Controls */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        {section === 'dimensions' && (
          <>
            {/* Width */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="cab-width" className="text-xs font-medium text-[#3F444E]">
                  Overall Width
                </label>
                <span className="font-mono text-xs font-medium text-[#141517] tabular-nums">
                  {formatDim(spec.widthMm, spec.unit)}
                </span>
              </div>
              <input
                id="cab-width"
                type="range"
                min={350}
                max={2400}
                step={10}
                value={spec.widthMm}
                onChange={(e) => updateField('widthMm', Number(e.target.value))}
                className="studio-slider w-full"
              />
              <div className="mt-1 flex justify-between font-mono text-[10px] text-[#7D838E]">
                <span>{formatDim(350, spec.unit)}</span>
                <span>{formatDim(2400, spec.unit)}</span>
              </div>
            </div>

            {/* Height */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="cab-height" className="text-xs font-medium text-[#3F444E]">
                  Overall Height
                </label>
                <span className="font-mono text-xs font-medium text-[#141517] tabular-nums">
                  {formatDim(spec.heightMm, spec.unit)}
                </span>
              </div>
              <input
                id="cab-height"
                type="range"
                min={350}
                max={2400}
                step={10}
                value={spec.heightMm}
                onChange={(e) => updateField('heightMm', Number(e.target.value))}
                className="studio-slider w-full"
              />
              <div className="mt-1 flex justify-between font-mono text-[10px] text-[#7D838E]">
                <span>{formatDim(350, spec.unit)}</span>
                <span>{formatDim(2400, spec.unit)}</span>
              </div>
            </div>

            {/* Depth */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="cab-depth" className="text-xs font-medium text-[#3F444E]">
                  Overall Depth
                </label>
                <span className="font-mono text-xs font-medium text-[#141517] tabular-nums">
                  {formatDim(spec.depthMm, spec.unit)}
                </span>
              </div>
              <input
                id="cab-depth"
                type="range"
                min={260}
                max={740}
                step={10}
                value={spec.depthMm}
                onChange={(e) => updateField('depthMm', Number(e.target.value))}
                className="studio-slider w-full"
              />
              <div className="mt-1 flex justify-between font-mono text-[10px] text-[#7D838E]">
                <span>{formatDim(260, spec.unit)}</span>
                <span>{formatDim(740, spec.unit)}</span>
              </div>
            </div>

            <hr className="border-[#ECEEF1]" />

            {/* Base / Mounting Type */}
            <div>
              <span className="block text-xs font-medium text-[#3F444E] mb-2">
                Base & Support Structure
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {(
                  [
                    { id: 'toe-kick', label: 'Toe-Kick' },
                    { id: 'steel-legs', label: 'Steel Legs' },
                    { id: 'wall-hung', label: 'Wall Hung' },
                  ] as Array<{ id: BaseStyle; label: string }>
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      onChange((prev) => ({
                        ...prev,
                        baseStyle: opt.id,
                        toeKickHeightMm:
                          opt.id === 'wall-hung'
                            ? 0
                            : opt.id === 'steel-legs'
                              ? Math.max(120, prev.toeKickHeightMm || 150)
                              : Math.max(80, Math.min(150, prev.toeKickHeightMm || 100)),
                      }));
                    }}
                    className={`py-2 px-2 rounded-md border text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                      spec.baseStyle === opt.id
                        ? 'border-[#1D4ED8] bg-[#1D4ED8]/8 text-[#1D4ED8]'
                        : 'border-[#E2E4E8] text-[#4A4F58] hover:border-[#C2C7D0]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {spec.baseStyle !== 'wall-hung' && (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="base-h" className="text-xs font-medium text-[#3F444E]">
                      {spec.baseStyle === 'steel-legs' ? 'Leg Height' : 'Toe-Kick Height'}
                    </label>
                    <span className="font-mono text-xs font-medium text-[#141517] tabular-nums">
                      {formatDim(spec.toeKickHeightMm, spec.unit)}
                    </span>
                  </div>
                  <input
                    id="base-h"
                    type="range"
                    min={60}
                    max={240}
                    step={5}
                    value={spec.toeKickHeightMm}
                    onChange={(e) => updateField('toeKickHeightMm', Number(e.target.value))}
                    className="studio-slider w-full"
                  />
                </div>

                {spec.baseStyle === 'toe-kick' && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label htmlFor="kick-recess" className="text-xs font-medium text-[#3F444E]">
                        Toe-Kick Recess
                      </label>
                      <span className="font-mono text-xs font-medium text-[#141517] tabular-nums">
                        {formatDim(spec.toeKickRecessMm, spec.unit)}
                      </span>
                    </div>
                    <input
                      id="kick-recess"
                      type="range"
                      min={30}
                      max={95}
                      step={5}
                      value={spec.toeKickRecessMm}
                      onChange={(e) => updateField('toeKickRecessMm', Number(e.target.value))}
                      className="studio-slider w-full"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Countertop Toggle (for non-wall/non-tall) */}
            {spec.typology !== 'wall' && spec.typology !== 'tall' && (
              <>
                <hr className="border-[#ECEEF1]" />
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-medium text-[#141517]">Countertop Slab</span>
                      <p className="text-[11px] text-[#6B717C]">
                        Include top stone/solid-surface overhang
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={spec.countertopEnabled}
                      onClick={() => updateField('countertopEnabled', !spec.countertopEnabled)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors ${
                        spec.countertopEnabled ? 'bg-[#1D4ED8]' : 'bg-[#D0D4DC]'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition-transform mt-0.5 ${
                          spec.countertopEnabled ? 'translate-x-4.5' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </div>

                  {spec.countertopEnabled && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-[#5A5E66] mb-1">
                          Thickness ({spec.countertopThicknessMm} mm)
                        </label>
                        <input
                          type="range"
                          min={18}
                          max={50}
                          step={2}
                          value={spec.countertopThicknessMm}
                          onChange={(e) => updateField('countertopThicknessMm', Number(e.target.value))}
                          className="studio-slider w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-[#5A5E66] mb-1">
                          Overhang ({spec.countertopOverhangMm} mm)
                        </label>
                        <input
                          type="range"
                          min={0}
                          max={50}
                          step={5}
                          value={spec.countertopOverhangMm}
                          onChange={(e) => updateField('countertopOverhangMm', Number(e.target.value))}
                          className="studio-slider w-full"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}

        {section === 'bays' && (
          <>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-semibold text-[#141517]">
                  Vertical Bays ({spec.bays.length} of 4)
                </h3>
                <p className="text-[11px] text-[#6B717C]">
                  Configure doors, drawer stacks, and adjustable shelves
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddBay}
                disabled={spec.bays.length >= 4}
                className="inline-flex items-center gap-1 rounded-md border border-[#DCDFE4] bg-[#FFFFFF] px-2.5 py-1.5 text-xs font-medium text-[#141517] hover:border-[#1D4ED8] hover:text-[#1D4ED8] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Bay</span>
              </button>
            </div>

            <div className="space-y-4">
              {spec.bays.map((bay, idx) => {
                const hasShelves =
                  bay.layout !== 'three-drawers' && bay.layout !== 'four-drawers';
                return (
                  <div
                    key={bay.id}
                    className="border-t border-[#ECEEF1] pt-3.5 first:border-t-0 first:pt-0 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-semibold text-[#141517]">
                        Bay {idx + 1}
                      </span>
                      {spec.bays.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveBay(idx)}
                          className="p-1 text-[#7D838E] hover:text-[#DC2626] transition-colors cursor-pointer"
                          title={`Remove Bay ${idx + 1}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] text-[#5A5E66] mb-1">
                        Front Configuration
                      </label>
                      <select
                        value={bay.layout}
                        onChange={(e) =>
                          handleBayUpdate(idx, { layout: e.target.value as BayLayout })
                        }
                        className="w-full rounded-md border border-[#DCDFE4] bg-[#FFFFFF] px-2.5 py-1.5 text-xs text-[#141517] focus:border-[#1D4ED8] focus:outline-none"
                      >
                        {BAY_LAYOUT_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {spec.bays.length > 1 && (
                      <div>
                        <div className="flex items-center justify-between text-[11px] text-[#5A5E66] mb-1">
                          <span>Width Proportion</span>
                          <span className="font-mono tabular-nums text-[#141517]">
                            {bay.widthRatio.toFixed(2)}×
                          </span>
                        </div>
                        <input
                          type="range"
                          min={0.5}
                          max={2.0}
                          step={0.05}
                          value={bay.widthRatio}
                          onChange={(e) =>
                            handleBayUpdate(idx, { widthRatio: parseFloat(e.target.value) })
                          }
                          className="studio-slider w-full"
                        />
                      </div>
                    )}

                    {hasShelves && (
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-[#5A5E66]">Adjustable Shelves</span>
                        <div className="flex items-center gap-1">
                          {[0, 1, 2, 3, 4, 5].map((n) => (
                            <button
                              key={n}
                              type="button"
                              onClick={() => handleBayUpdate(idx, { shelfCount: n })}
                              className={`w-6 h-6 rounded text-xs font-mono transition-colors cursor-pointer ${
                                bay.shelfCount === n
                                  ? 'bg-[#141517] text-[#FFFFFF] font-medium'
                                  : 'bg-[#F2F3F5] text-[#4A4F58] hover:bg-[#E4E6EB]'
                              }`}
                            >
                              {n}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {section === 'style' && (
          <>
            {/* Cabinet Architectural Style */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[#141517]">Cabinet Style</span>
                <span className="text-[11px] text-[#5A5E66]">
                  {CABINET_STYLES[activeCabinetStyle].shortName}
                </span>
              </div>
              <div className="space-y-1.5">
                {(Object.keys(CABINET_STYLES) as CabinetStyleId[]).map((styleId) => {
                  const st = CABINET_STYLES[styleId];
                  const active = activeCabinetStyle === styleId;
                  return (
                    <button
                      key={styleId}
                      type="button"
                      onClick={() => handleSelectCabinetStyle(styleId)}
                      className={`w-full text-left rounded-md border px-3 py-2 transition-colors cursor-pointer ${
                        active
                          ? 'border-[#1D4ED8] bg-[#1D4ED8]/6'
                          : 'border-[#E6E8EC] hover:border-[#C2C7D0] bg-[#FFFFFF]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`text-xs font-medium ${
                            active ? 'text-[#1D4ED8]' : 'text-[#141517]'
                          }`}
                        >
                          {st.name}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[11px] leading-snug text-[#6B717C]">
                        {st.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <hr className="border-[#ECEEF1]" />

            {/* Door Mount / Overlay */}
            <div>
              <span className="block text-xs font-semibold text-[#141517] mb-2">
                Door Mounting & Overlay
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {DOOR_MOUNT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => updateField('doorMount', opt.value)}
                    className={`py-2 px-1.5 rounded-md border text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                      activeDoorMount === opt.value
                        ? 'border-[#1D4ED8] bg-[#1D4ED8]/8 text-[#1D4ED8]'
                        : 'border-[#E2E4E8] text-[#4A4F58] hover:border-[#C2C7D0]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <hr className="border-[#ECEEF1]" />

            {/* Door & Drawer Profile (8 Types) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[#141517]">
                  Door & Drawer Type
                </span>
                <span className="text-[11px] text-[#5A5E66]">
                  {DOOR_STYLE_DEFS[spec.doorStyle].name}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {(Object.keys(DOOR_STYLE_DEFS) as DoorStyle[]).map((doorId) => {
                  const def = DOOR_STYLE_DEFS[doorId];
                  const active = spec.doorStyle === doorId;
                  return (
                    <button
                      key={doorId}
                      type="button"
                      onClick={() => updateField('doorStyle', doorId)}
                      title={def.summary}
                      className={`py-2 px-2.5 rounded-md border text-left transition-colors cursor-pointer ${
                        active
                          ? 'border-[#1D4ED8] bg-[#1D4ED8]/8'
                          : 'border-[#E2E4E8] bg-[#FFFFFF] hover:border-[#C2C7D0]'
                      }`}
                    >
                      <div
                        className={`text-xs font-medium truncate ${
                          active ? 'text-[#1D4ED8]' : 'text-[#141517]'
                        }`}
                      >
                        {def.name}
                      </div>
                      <div className="mt-0.5 text-[10px] leading-tight text-[#6B717C] line-clamp-1">
                        {def.summary}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <hr className="border-[#ECEEF1]" />

            {/* Hinge System (6 Types) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[#141517]">Hinge System</span>
                <span className="font-mono text-[11px] text-[#5A5E66] tabular-nums">
                  {HINGE_TYPES[activeHingeType].openingAngleDeg}° swing
                </span>
              </div>
              <div className="space-y-1.5">
                {(Object.keys(HINGE_TYPES) as HingeType[]).map((hingeId) => {
                  const h = HINGE_TYPES[hingeId];
                  const active = activeHingeType === hingeId;
                  return (
                    <button
                      key={hingeId}
                      type="button"
                      onClick={() => updateField('hingeType', hingeId)}
                      className={`w-full text-left rounded-md border px-3 py-2 transition-colors cursor-pointer ${
                        active
                          ? 'border-[#1D4ED8] bg-[#1D4ED8]/6'
                          : 'border-[#E6E8EC] hover:border-[#C2C7D0] bg-[#FFFFFF]'
                      }`}
                    >
                      <div className="flex items-baseline justify-between gap-2">
                        <span
                          className={`text-xs font-medium ${
                            active ? 'text-[#1D4ED8]' : 'text-[#141517]'
                          }`}
                        >
                          {h.name}
                        </span>
                        <span className="font-mono text-[11px] text-[#5A5E66] tabular-nums shrink-0">
                          {h.openingAngleDeg}°
                        </span>
                      </div>
                      <div className="mt-0.5 text-[11px] text-[#6B717C] font-mono tabular-nums">
                        {h.visibility} · ${h.unitPriceUsd.toFixed(2)}/{h.isContinuous ? 'door' : 'ea'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <hr className="border-[#ECEEF1]" />

            {/* Pulls & Hardware */}
            <div>
              <span className="block text-xs font-semibold text-[#141517] mb-2">
                Pulls & Metal Finish
              </span>
              <div className="grid grid-cols-2 gap-1.5 mb-3">
                {HARDWARE_STYLES.map((hs) => (
                  <button
                    key={hs.value}
                    type="button"
                    onClick={() => updateField('hardwareStyle', hs.value)}
                    className={`py-2 px-2.5 rounded-md border text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                      spec.hardwareStyle === hs.value
                        ? 'border-[#1D4ED8] bg-[#1D4ED8]/8 text-[#1D4ED8]'
                        : 'border-[#E2E4E8] text-[#4A4F58] hover:border-[#C2C7D0]'
                    }`}
                  >
                    {hs.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-4 gap-1.5">
                {(Object.keys(HARDWARE_FINISHES) as HardwareFinishId[]).map((hfId) => {
                  const hf = HARDWARE_FINISHES[hfId];
                  const active = spec.hardwareFinish === hfId;
                  return (
                    <button
                      key={hfId}
                      type="button"
                      onClick={() => updateField('hardwareFinish', hfId)}
                      title={hf.name}
                      className={`flex flex-col items-center gap-1 rounded-md border py-2 px-1 transition-colors cursor-pointer ${
                        active
                          ? 'border-[#1D4ED8] bg-[#1D4ED8]/6'
                          : 'border-[#E2E4E8] hover:border-[#C2C7D0]'
                      }`}
                    >
                      <span
                        className="w-4 h-4 rounded-full border border-black/15"
                        style={{ backgroundColor: hf.hex }}
                      />
                      <span className="text-[10px] text-[#3F444E] truncate w-full text-center">
                        {hf.name.split(' ')[1] ?? hf.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <hr className="border-[#ECEEF1]" />

            {/* Exterior Material Swatches */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[#141517]">Exterior & Front Finish</span>
                <span className="text-[11px] text-[#5A5E66]">
                  {EXTERIOR_MATERIALS[spec.exteriorMaterial].name}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                {(Object.keys(EXTERIOR_MATERIALS) as ExteriorMaterialId[]).map((matId) => {
                  const mat = EXTERIOR_MATERIALS[matId];
                  const active = spec.exteriorMaterial === matId;
                  return (
                    <button
                      key={matId}
                      type="button"
                      onClick={() => updateField('exteriorMaterial', matId)}
                      className={`flex items-center gap-3 rounded-lg border px-2.5 py-2 text-left transition-colors cursor-pointer ${
                        active
                          ? 'border-[#1D4ED8] bg-[#1D4ED8]/6'
                          : 'border-[#E6E8EC] hover:border-[#C2C7D0] bg-[#FFFFFF]'
                      }`}
                    >
                      <span
                        className="w-7 h-7 rounded-md shrink-0 border border-black/10"
                        style={{
                          background:
                            mat.category === 'wood'
                              ? `repeating-linear-gradient(90deg, ${mat.baseHex}, ${mat.baseHex} 3px, ${mat.grainHex} 4px, ${mat.baseHex} 6px)`
                              : mat.baseHex,
                        }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-medium text-[#141517] truncate">
                          {mat.name}
                        </div>
                        <div className="text-[11px] text-[#6B717C] font-mono tabular-nums">
                          ${mat.pricePerSheetUsd}/sheet · {mat.category === 'wood' ? 'Veneer' : 'Lacquer'}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <hr className="border-[#ECEEF1]" />

            {/* Interior Carcass Material */}
            <div>
              <label className="block text-xs font-semibold text-[#141517] mb-2">
                Carcass Interior Core
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {(Object.keys(INTERIOR_MATERIALS) as InteriorMaterialId[]).map((intId) => {
                  const item = INTERIOR_MATERIALS[intId];
                  const active = spec.interiorMaterial === intId;
                  return (
                    <button
                      key={intId}
                      type="button"
                      onClick={() => updateField('interiorMaterial', intId)}
                      className={`flex items-center gap-2 rounded-md border px-2.5 py-2 text-left text-xs transition-colors cursor-pointer ${
                        active
                          ? 'border-[#1D4ED8] bg-[#1D4ED8]/6 text-[#1D4ED8] font-medium'
                          : 'border-[#E2E4E8] text-[#3F444E] hover:border-[#C2C7D0]'
                      }`}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-sm border border-black/15 shrink-0"
                        style={{ backgroundColor: item.baseHex }}
                      />
                      <span className="truncate">{item.name.replace(' Plywood', '').replace(' Veneer', '')}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {section === 'construction' && (
          <>
            {/* Construction Standard */}
            <div>
              <span className="block text-xs font-semibold text-[#141517] mb-2">
                Cabinet Architecture
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {(
                  [
                    { id: 'frameless', label: 'Frameless (32mm)' },
                    { id: 'face-frame', label: 'Face-Frame' },
                  ] as Array<{ id: ConstructionType; label: string }>
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => updateField('construction', opt.id)}
                    className={`py-2 px-2 rounded-md border text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                      spec.construction === opt.id
                        ? 'border-[#1D4ED8] bg-[#1D4ED8]/8 text-[#1D4ED8]'
                        : 'border-[#E2E4E8] text-[#4A4F58] hover:border-[#C2C7D0]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Active Hinge Machining Reference */}
            <div className="rounded-md border border-[#ECEEF1] bg-[#FAFAFB] px-3 py-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold text-[#141517]">
                  Active Hinge: {HINGE_TYPES[activeHingeType].shortName}
                </span>
                <button
                  type="button"
                  onClick={() => setSection('style')}
                  className="text-[11px] font-medium text-[#1D4ED8] hover:underline cursor-pointer whitespace-nowrap"
                >
                  Change
                </button>
              </div>
              <p className="mt-1 font-mono text-[10px] leading-snug text-[#5A5E66]">
                {HINGE_TYPES[activeHingeType].machiningSpec}
              </p>
            </div>

            {/* Joinery Method */}
            <div>
              <span className="block text-xs font-semibold text-[#141517] mb-2">
                Carcass Joinery Method
              </span>
              <div className="space-y-1.5">
                {(
                  [
                    {
                      id: 'dado-rabbet',
                      label: 'Dado & Rabbet (CNC Router)',
                      desc: '6mm captured back dado, blind deck dados',
                    },
                    {
                      id: 'dowel-32mm',
                      label: '32mm System Dowel & Confirmat',
                      desc: '8mm fluted dowels + structural screws',
                    },
                    {
                      id: 'cam-lock',
                      label: 'Minifix Cam-Lock RTA',
                      desc: 'Flat-pack knock-down cam connectors',
                    },
                  ] as Array<{ id: JoineryMethod; label: string; desc: string }>
                ).map((j) => (
                  <button
                    key={j.id}
                    type="button"
                    onClick={() => updateField('joinery', j.id)}
                    className={`w-full text-left rounded-md border px-3 py-2 transition-colors cursor-pointer ${
                      spec.joinery === j.id
                        ? 'border-[#1D4ED8] bg-[#1D4ED8]/6'
                        : 'border-[#E2E4E8] hover:border-[#C2C7D0]'
                    }`}
                  >
                    <div className="text-xs font-medium text-[#141517]">{j.label}</div>
                    <div className="text-[11px] text-[#6B717C]">{j.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <hr className="border-[#ECEEF1]" />

            {/* Sheet Thicknesses */}
            <div className="space-y-3.5">
              <span className="block text-xs font-semibold text-[#141517]">
                Sheet Material Gauges
              </span>

              <div>
                <div className="flex justify-between text-xs text-[#4A4F58] mb-1">
                  <span>Carcass Sheet Thickness</span>
                  <span className="font-mono font-medium text-[#141517]">
                    {spec.carcassThicknessMm} mm
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {[16, 18, 19].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => updateField('carcassThicknessMm', val)}
                      className={`py-1.5 rounded border font-mono text-xs cursor-pointer ${
                        spec.carcassThicknessMm === val
                          ? 'border-[#1D4ED8] bg-[#1D4ED8]/8 text-[#1D4ED8] font-medium'
                          : 'border-[#E2E4E8] text-[#4A4F58]'
                      }`}
                    >
                      {val} mm {val === 19 ? '(3/4")' : ''}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-[#4A4F58] mb-1">
                  <span>Back Panel Thickness</span>
                  <span className="font-mono font-medium text-[#141517]">
                    {spec.backThicknessMm} mm
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {[6, 12].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => updateField('backThicknessMm', val)}
                      className={`py-1.5 rounded border font-mono text-xs cursor-pointer ${
                        spec.backThicknessMm === val
                          ? 'border-[#1D4ED8] bg-[#1D4ED8]/8 text-[#1D4ED8] font-medium'
                          : 'border-[#E2E4E8] text-[#4A4F58]'
                      }`}
                    >
                      {val} mm {val === 6 ? '(1/4")' : '(1/2")'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-[#4A4F58] mb-1">
                  <span>Door & Drawer Front Thickness</span>
                  <span className="font-mono font-medium text-[#141517]">
                    {spec.frontThicknessMm} mm
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {[18, 19, 22].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => updateField('frontThicknessMm', val)}
                      className={`py-1.5 rounded border font-mono text-xs cursor-pointer ${
                        spec.frontThicknessMm === val
                          ? 'border-[#1D4ED8] bg-[#1D4ED8]/8 text-[#1D4ED8] font-medium'
                          : 'border-[#E2E4E8] text-[#4A4F58]'
                      }`}
                    >
                      {val} mm
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-[#4A4F58] mb-1">
                  <span>Door / Drawer Reveal Gap</span>
                  <span className="font-mono font-medium text-[#141517]">
                    {spec.revealGapMm} mm
                  </span>
                </div>
                <input
                  type="range"
                  min={1.5}
                  max={4}
                  step={0.5}
                  value={spec.revealGapMm}
                  onChange={(e) => updateField('revealGapMm', parseFloat(e.target.value))}
                  className="studio-slider w-full"
                />
              </div>
            </div>
          </>
        )}
      </div>
    </aside>
  );
};
