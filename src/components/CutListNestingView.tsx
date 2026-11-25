import React, { useMemo, useState } from 'react';
import { Download, Search } from 'lucide-react';
import { CabinetCalculation, CabinetSpec, PartGroup, PlacedPart, SheetSizeId } from '../types/cabinet';
import { SHEET_DIMENSIONS, formatDim } from '../engine/cabinetEngine';
import { downloadTextFile, generateCutListCSV } from '../engine/blueprintExport';

interface CutListNestingViewProps {
  spec: CabinetSpec;
  calc: CabinetCalculation;
  onChangeSpec: (updater: (prev: CabinetSpec) => CabinetSpec) => void;
}

const GROUP_COLORS: Record<PartGroup, { fill: string; stroke: string; text: string }> = {
  Carcass: { fill: '#EBF2FF', stroke: '#2563EB', text: '#1E3A8A' },
  Interior: { fill: '#EEF4EE', stroke: '#3B7A57', text: '#1E4631' },
  Fronts: { fill: '#FDF3E7', stroke: '#B45309', text: '#78350F' },
  'Drawer Boxes': { fill: '#F3F0FA', stroke: '#6D28D9', text: '#4C1D95' },
  'Base & Plinth': { fill: '#F1F2F4', stroke: '#4B5563', text: '#1F2937' },
  Countertop: { fill: '#F5F5F4', stroke: '#57534E', text: '#292524' },
};

export const CutListNestingView: React.FC<CutListNestingViewProps> = ({
  spec,
  calc,
  onChangeSpec,
}) => {
  const [selectedSheetIdx, setSelectedSheetIdx] = useState(0);
  const [hoveredPart, setHoveredPart] = useState<PlacedPart | null>(null);
  const [groupFilter, setGroupFilter] = useState<PartGroup | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const safeSheetIdx = Math.min(selectedSheetIdx, Math.max(0, calc.sheets.length - 1));
  const activeSheet = calc.sheets[safeSheetIdx] ?? null;

  const filteredParts = useMemo(() => {
    return calc.parts.filter((p) => {
      if (groupFilter !== 'All' && p.group !== groupFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.code.toLowerCase().includes(q) ||
          p.materialName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [calc.parts, groupFilter, searchQuery]);

  const handleDownloadCsv = () => {
    const csv = generateCutListCSV(spec, calc);
    const slug = spec.drawingNumber.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase() || 'cabinet';
    downloadTextFile(csv, `${slug}_cut_list.csv`, 'text/csv;charset=utf-8');
  };

  return (
    <div className="h-full overflow-y-auto bg-[#F6F6F3] px-6 py-6">
      <div className="max-w-[1360px] mx-auto space-y-6">
        {/* Top Manufacturing Metrics Strip (Flat hairline bar, tabular-nums) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 border border-[#E2E4E8] rounded-xl bg-[#FFFFFF] divide-y lg:divide-y-0 lg:divide-x divide-[#ECEEF1]">
          <div className="px-5 py-4">
            <div className="text-xs text-[#5A5E66]">Total Cut Panels</div>
            <div className="mt-1 font-mono text-2xl font-semibold text-[#141517] tabular-nums">
              {calc.totalPanelCount}
            </div>
            <div className="mt-0.5 text-xs text-[#7D838E]">
              {calc.parts.length} unique part definitions
            </div>
          </div>

          <div className="px-5 py-4">
            <div className="text-xs text-[#5A5E66]">Sheets Required</div>
            <div className="mt-1 font-mono text-2xl font-semibold text-[#141517] tabular-nums">
              {calc.totalSheetCount}
            </div>
            <div className="mt-0.5 text-xs text-[#7D838E] font-mono">
              {SHEET_DIMENSIONS[spec.sheetSize].widthMm} × {SHEET_DIMENSIONS[spec.sheetSize].heightMm} mm stock
            </div>
          </div>

          <div className="px-5 py-4">
            <div className="text-xs text-[#5A5E66]">Average Material Yield</div>
            <div className="mt-1 font-mono text-2xl font-semibold text-[#141517] tabular-nums">
              {calc.avgUtilizationPct.toFixed(1)}%
            </div>
            <div className="mt-0.5 text-xs text-[#7D838E] font-mono tabular-nums">
              Saw kerf {spec.sawKerfMm} mm · 10 mm trim
            </div>
          </div>

          <div className="px-5 py-4">
            <div className="text-xs text-[#5A5E66]">Edge Banding Required</div>
            <div className="mt-1 font-mono text-2xl font-semibold text-[#141517] tabular-nums">
              {calc.totalEdgeBandingM.toFixed(1)} m
            </div>
            <div className="mt-0.5 text-xs text-[#7D838E]">
              Includes 12% trim allowance
            </div>
          </div>
        </div>

        {/* 2D Sheet-Goods Nesting Optimizer */}
        <section className="border border-[#E2E4E8] rounded-xl bg-[#FFFFFF] overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 border-b border-[#ECEEF1]">
            <div>
              <h2 className="font-display text-base font-semibold text-[#141517]">
                Sheet Goods Nesting Layout
              </h2>
              <p className="text-xs text-[#5A5E66] mt-0.5">
                Grain-respecting guillotine cut layouts grouped by sheet material and gauge
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Sheet Size Selector */}
              <div className="flex items-center gap-1 rounded-lg bg-[#F2F3F5] p-1 text-xs">
                {(Object.keys(SHEET_DIMENSIONS) as SheetSizeId[]).map((sizeKey) => (
                  <button
                    key={sizeKey}
                    type="button"
                    onClick={() => {
                      onChangeSpec((prev) => ({ ...prev, sheetSize: sizeKey }));
                      setSelectedSheetIdx(0);
                    }}
                    className={`rounded-md px-2.5 py-1 font-mono text-xs transition-colors cursor-pointer whitespace-nowrap ${
                      spec.sheetSize === sizeKey
                        ? 'bg-[#FFFFFF] text-[#141517] font-medium shadow-xs'
                        : 'text-[#5A5E66] hover:text-[#141517]'
                    }`}
                  >
                    {sizeKey === '2440x1220' ? '2440×1220 (4×8)' : '1525×1525 (5×5)'}
                  </button>
                ))}
              </div>

              {/* Kerf Selector */}
              <div className="flex items-center gap-1.5 text-xs text-[#5A5E66]">
                <span>Kerf:</span>
                <select
                  value={spec.sawKerfMm}
                  onChange={(e) =>
                    onChangeSpec((prev) => ({ ...prev, sawKerfMm: parseFloat(e.target.value) }))
                  }
                  className="rounded-md border border-[#DCDFE4] bg-[#FFFFFF] px-2 py-1 font-mono text-xs text-[#141517]"
                >
                  <option value={2.4}>2.4 mm</option>
                  <option value={3.2}>3.2 mm (1/8&quot;)</option>
                  <option value={4.0}>4.0 mm</option>
                  <option value={6.0}>6.0 mm (CNC Bit)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] divide-y lg:divide-y-0 lg:divide-x divide-[#ECEEF1]">
            {/* Sheet Selector List */}
            <div className="p-3 space-y-1.5 bg-[#FAFAFB] max-h-[440px] overflow-y-auto">
              {calc.sheets.map((sheet, idx) => {
                const active = idx === safeSheetIdx;
                return (
                  <button
                    key={`sheet-${sheet.sheetIndex}`}
                    type="button"
                    onClick={() => setSelectedSheetIdx(idx)}
                    className={`w-full text-left rounded-lg border px-3 py-2.5 transition-colors cursor-pointer ${
                      active
                        ? 'border-[#1D4ED8] bg-[#FFFFFF]'
                        : 'border-transparent hover:border-[#DCDFE4] hover:bg-[#FFFFFF]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-semibold text-[#141517]">
                        Sheet {sheet.sheetIndex}
                      </span>
                      <span className="font-mono text-xs text-[#1D4ED8] tabular-nums">
                        {sheet.utilizationPct.toFixed(1)}%
                      </span>
                    </div>
                    <div className="mt-0.5 text-xs text-[#3F444E] truncate">
                      {sheet.materialName}
                    </div>
                    <div className="mt-0.5 font-mono text-[11px] text-[#7D838E] tabular-nums">
                      {sheet.thicknessMm} mm · {sheet.parts.length} panels
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Interactive SVG Cutting Sheet Canvas */}
            <div className="p-5 flex flex-col justify-between bg-[#FFFFFF]">
              {activeSheet ? (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 text-xs text-[#4A4F58]">
                      <span className="font-semibold text-[#141517]">
                        Sheet {activeSheet.sheetIndex}: {activeSheet.materialName}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">
                        {activeSheet.thicknessMm} mm gauge
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">
                        Grain runs horizontally (→ {activeSheet.sheetWidthMm} mm)
                      </span>
                    </div>
                    <div className="font-mono text-xs text-[#5A5E66] tabular-nums h-4">
                      {hoveredPart
                        ? `${hoveredPart.code} · ${hoveredPart.name} · ${formatDim(hoveredPart.w, spec.unit)} × ${formatDim(hoveredPart.h, spec.unit)}${hoveredPart.rotated ? ' (rotated 90°)' : ''}`
                        : 'Hover any nested panel to inspect dimensions'}
                    </div>
                  </div>

                  <div className="w-full overflow-x-auto">
                    <svg
                      viewBox={`-30 -28 ${activeSheet.sheetWidthMm + 60} ${activeSheet.sheetHeightMm + 56}`}
                      className="w-full max-h-[370px] block"
                    >
                      {/* Raw stock board background */}
                      <rect
                        x={0}
                        y={0}
                        width={activeSheet.sheetWidthMm}
                        height={activeSheet.sheetHeightMm}
                        fill="#F4F4F0"
                        stroke="#141517"
                        strokeWidth={4}
                      />
                      {/* Perimeter 10mm factory edge trim dashed guide */}
                      <rect
                        x={10}
                        y={10}
                        width={activeSheet.sheetWidthMm - 20}
                        height={activeSheet.sheetHeightMm - 20}
                        fill="none"
                        stroke="#9CA3AF"
                        strokeWidth={2}
                        strokeDasharray="16 12"
                      />

                      {/* Sheet overall dimension annotations */}
                      <text
                        x={activeSheet.sheetWidthMm / 2}
                        y={-10}
                        textAnchor="middle"
                        fontFamily="'IBM Plex Mono', monospace"
                        fontSize={34}
                        fill="#4A4F58"
                      >
                        {formatDim(activeSheet.sheetWidthMm, spec.unit)} (Grain Direction →)
                      </text>
                      <text
                        x={-12}
                        y={activeSheet.sheetHeightMm / 2}
                        textAnchor="middle"
                        fontFamily="'IBM Plex Mono', monospace"
                        fontSize={34}
                        fill="#4A4F58"
                        transform={`rotate(-90, -12, ${activeSheet.sheetHeightMm / 2})`}
                      >
                        {formatDim(activeSheet.sheetHeightMm, spec.unit)}
                      </text>

                      {/* Nested cut panels */}
                      {activeSheet.parts.map((part) => {
                        const style = GROUP_COLORS[part.group] ?? GROUP_COLORS.Carcass;
                        const isHovered = hoveredPart?.partId === part.partId;
                        const canFitLabel = part.w > 130 && part.h > 80;
                        return (
                          <g
                            key={part.partId}
                            onMouseEnter={() => setHoveredPart(part)}
                            onMouseLeave={() => setHoveredPart(null)}
                            className="cursor-pointer"
                          >
                            <rect
                              x={part.x}
                              y={part.y}
                              width={part.w}
                              height={part.h}
                              fill={style.fill}
                              stroke={isHovered ? '#141517' : style.stroke}
                              strokeWidth={isHovered ? 6 : 3}
                            />
                            {canFitLabel && (
                              <>
                                <text
                                  x={part.x + part.w / 2}
                                  y={part.y + part.h / 2 - 10}
                                  textAnchor="middle"
                                  fontFamily="'IBM Plex Mono', monospace"
                                  fontSize={Math.min(34, part.h * 0.22, part.w * 0.14)}
                                  fontWeight={600}
                                  fill={style.text}
                                >
                                  {part.code}
                                </text>
                                <text
                                  x={part.x + part.w / 2}
                                  y={part.y + part.h / 2 + 24}
                                  textAnchor="middle"
                                  fontFamily="'IBM Plex Mono', monospace"
                                  fontSize={Math.min(26, part.h * 0.17, part.w * 0.11)}
                                  fill={style.text}
                                  opacity={0.85}
                                >
                                  {Math.round(part.w)}×{Math.round(part.h)}
                                </text>
                              </>
                            )}
                          </g>
                        );
                      })}
                    </svg>
                  </div>

                  {/* Clean Legend */}
                  <div className="mt-3 pt-3 border-t border-[#ECEEF1] flex flex-wrap items-center gap-4 text-xs text-[#5A5E66]">
                    {(['Carcass', 'Interior', 'Fronts', 'Drawer Boxes', 'Base & Plinth'] as PartGroup[]).map(
                      (g) => (
                        <div key={g} className="flex items-center gap-1.5">
                          <span
                            className="w-3 h-3 rounded-xs border"
                            style={{
                              backgroundColor: GROUP_COLORS[g].fill,
                              borderColor: GROUP_COLORS[g].stroke,
                            }}
                          />
                          <span>{g}</span>
                        </div>
                      )
                    )}
                  </div>
                </>
              ) : (
                <div className="py-12 text-center text-sm text-[#5A5E66]">
                  No nested panels available.
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Precision Panel Cut List Table */}
        <section className="border border-[#E2E4E8] rounded-xl bg-[#FFFFFF] overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-[#ECEEF1]">
            <div>
              <h2 className="font-display text-base font-semibold text-[#141517]">
                Manufacturing Panel Cut List
              </h2>
              <p className="text-xs text-[#5A5E66] mt-0.5">
                Edge banding codes: L = Length edge, W = Width edge (e.g., 1L 2W = front + both ends)
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Group Filter */}
              <div className="flex items-center gap-1 rounded-lg bg-[#F2F3F5] p-1">
                {(['All', 'Carcass', 'Interior', 'Fronts', 'Drawer Boxes', 'Base & Plinth'] as const).map(
                  (grp) => (
                    <button
                      key={grp}
                      type="button"
                      onClick={() => setGroupFilter(grp)}
                      className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                        groupFilter === grp
                          ? 'bg-[#FFFFFF] text-[#141517] shadow-xs'
                          : 'text-[#5A5E66] hover:text-[#141517]'
                      }`}
                    >
                      {grp}
                    </button>
                  )
                )}
              </div>

              {/* Live Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#7D838E] absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter parts..."
                  className="rounded-lg border border-[#DCDFE4] bg-[#FAFAFB] pl-8 pr-3 py-1.5 text-xs text-[#141517] placeholder:text-[#8E94A0] focus:border-[#1D4ED8] focus:bg-[#FFFFFF] focus:outline-none w-44"
                />
              </div>

              <button
                type="button"
                onClick={handleDownloadCsv}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#DCDFE4] bg-[#FFFFFF] px-3 py-1.5 text-xs font-medium text-[#141517] hover:border-[#1D4ED8] hover:text-[#1D4ED8] transition-colors cursor-pointer whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download CSV</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#ECEEF1] bg-[#FAFAFB] text-[11px] font-medium text-[#5A5E66]">
                  <th className="py-2.5 px-4">Code</th>
                  <th className="py-2.5 px-4">Component</th>
                  <th className="py-2.5 px-4">Material</th>
                  <th className="py-2.5 px-4 text-right">Gauge</th>
                  <th className="py-2.5 px-4 text-right">Length</th>
                  <th className="py-2.5 px-4 text-right">Width</th>
                  <th className="py-2.5 px-4 text-right">Qty</th>
                  <th className="py-2.5 px-4">Edge Banding</th>
                  <th className="py-2.5 px-4">Machining Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F1F4] text-xs">
                {filteredParts.map((part) => (
                  <tr key={part.id} className="hover:bg-[#FAFAFC] transition-colors">
                    <td className="py-2.5 px-4 font-mono font-semibold text-[#1D4ED8] whitespace-nowrap">
                      {part.code}
                    </td>
                    <td className="py-2.5 px-4 font-medium text-[#141517] whitespace-nowrap">
                      {part.name}
                    </td>
                    <td className="py-2.5 px-4 text-[#4A4F58] whitespace-nowrap">
                      {part.materialName}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums text-[#4A4F58] whitespace-nowrap">
                      {part.thicknessMm} mm
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums font-medium text-[#141517] whitespace-nowrap">
                      {formatDim(part.lengthMm, spec.unit)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums font-medium text-[#141517] whitespace-nowrap">
                      {formatDim(part.widthMm, spec.unit)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums font-semibold text-[#141517]">
                      {part.qty}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-[#3F444E] whitespace-nowrap">
                      {part.edgeBanding}
                    </td>
                    <td className="py-2.5 px-4 text-[#5A5E66]">{part.notes}</td>
                  </tr>
                ))}
                {filteredParts.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-10 text-center text-sm text-[#6B717C]">
                      No cut list panels match your current filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};
