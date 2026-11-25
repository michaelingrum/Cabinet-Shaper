import React from 'react';
import { Download } from 'lucide-react';
import { CabinetCalculation, CabinetSpec } from '../types/cabinet';
import {
  CABINET_STYLES,
  DOOR_STYLE_DEFS,
  EXTERIOR_MATERIALS,
  HARDWARE_FINISHES,
  HINGE_TYPES,
  formatDim,
  getEffectiveInteriorMaterial,
} from '../engine/cabinetEngine';
import { downloadTextFile, generateHardwareBOMCSV } from '../engine/blueprintExport';

interface HardwareBomViewProps {
  spec: CabinetSpec;
  calc: CabinetCalculation;
}

export const HardwareBomView: React.FC<HardwareBomViewProps> = ({ spec, calc }) => {
  const extMat = EXTERIOR_MATERIALS[spec.exteriorMaterial];
  const intMat = getEffectiveInteriorMaterial(spec);
  const hwFinish = HARDWARE_FINISHES[spec.hardwareFinish];
  const styleDef = CABINET_STYLES[spec.cabinetStyle ?? 'modern-frameless'];
  const doorDef = DOOR_STYLE_DEFS[spec.doorStyle];
  const hingeDef = HINGE_TYPES[spec.hingeType ?? 'concealed-110'];
  const mountLabel =
    (spec.doorMount ?? 'full-overlay') === 'inset'
      ? 'Flush Inset'
      : (spec.doorMount ?? 'full-overlay') === 'half-overlay'
        ? 'Half Overlay'
        : 'Full Overlay';

  const handleDownloadBom = () => {
    const csv = generateHardwareBOMCSV(spec, calc);
    const slug = spec.drawingNumber.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase() || 'cabinet';
    downloadTextFile(csv, `${slug}_hardware_bom.csv`, 'text/csv;charset=utf-8');
  };

  return (
    <div className="h-full overflow-y-auto bg-[#F6F6F3] px-6 py-6">
      <div className="max-w-[1360px] mx-auto space-y-6">
        {/* Cost & CNC Summary Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 border border-[#E2E4E8] rounded-xl bg-[#FFFFFF] divide-y lg:divide-y-0 lg:divide-x divide-[#ECEEF1]">
          <div className="px-5 py-4">
            <div className="text-xs text-[#5A5E66]">Estimated Total Material</div>
            <div className="mt-1 font-mono text-2xl font-semibold text-[#141517] tabular-nums">
              ${calc.estimatedTotalCostUsd.toLocaleString()}
            </div>
            <div className="mt-0.5 text-xs text-[#7D838E]">
              Excludes shop labor & finishing
            </div>
          </div>

          <div className="px-5 py-4">
            <div className="text-xs text-[#5A5E66]">Sheet Goods & Countertop</div>
            <div className="mt-1 font-mono text-2xl font-semibold text-[#141517] tabular-nums">
              ${calc.estimatedSheetCostUsd.toLocaleString()}
            </div>
            <div className="mt-0.5 text-xs text-[#7D838E]">
              {calc.totalSheetCount} sheets · {extMat.name}
            </div>
          </div>

          <div className="px-5 py-4">
            <div className="text-xs text-[#5A5E66]">Hardware & Fittings</div>
            <div className="mt-1 font-mono text-2xl font-semibold text-[#141517] tabular-nums">
              ${calc.estimatedHardwareCostUsd.toLocaleString()}
            </div>
            <div className="mt-0.5 text-xs text-[#7D838E]">
              {hwFinish.name} finish
            </div>
          </div>

          <div className="px-5 py-4">
            <div className="text-xs text-[#5A5E66]">CNC System 32 Boring</div>
            <div className="mt-1 font-mono text-2xl font-semibold text-[#141517] tabular-nums">
              {calc.totalBoringHoles}
            </div>
            <div className="mt-0.5 text-xs text-[#7D838E]">
              32 mm pitch · 37 mm front setback
            </div>
          </div>
        </div>

        {/* Hardware Schedule Table */}
        <section className="border border-[#E2E4E8] rounded-xl bg-[#FFFFFF] overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-[#ECEEF1]">
            <div>
              <h2 className="font-display text-base font-semibold text-[#141517]">
                Hardware & Fittings Schedule
              </h2>
              <p className="text-xs text-[#5A5E66] mt-0.5">
                Sized for {formatDim(calc.carcassDepthMm, spec.unit)} carcass depth · {styleDef.shortName} ·{' '}
                {hingeDef.shortName} ({hingeDef.openingAngleDeg}°)
              </p>
            </div>
            <button
              type="button"
              onClick={handleDownloadBom}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#DCDFE4] bg-[#FFFFFF] px-3 py-1.5 text-xs font-medium text-[#141517] hover:border-[#1D4ED8] hover:text-[#1D4ED8] transition-colors cursor-pointer whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export BOM CSV</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#ECEEF1] bg-[#FAFAFB] text-[11px] font-medium text-[#5A5E66]">
                  <th className="py-2.5 px-4">Category</th>
                  <th className="py-2.5 px-4">Hardware Component</th>
                  <th className="py-2.5 px-4">Manufacturing Specification</th>
                  <th className="py-2.5 px-4 text-right">Qty</th>
                  <th className="py-2.5 px-4">Unit</th>
                  <th className="py-2.5 px-4 text-right">Unit Cost</th>
                  <th className="py-2.5 px-4 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F1F4] text-xs">
                {calc.hardware.map((item) => (
                  <tr key={item.id} className="hover:bg-[#FAFAFC] transition-colors">
                    <td className="py-3 px-4 font-medium text-[#5A5E66] whitespace-nowrap">
                      {item.category}
                    </td>
                    <td className="py-3 px-4 font-medium text-[#141517] whitespace-nowrap">
                      {item.name}
                    </td>
                    <td className="py-3 px-4 text-[#4A4F58]">{item.spec}</td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-[#141517] tabular-nums">
                      {item.qty}
                    </td>
                    <td className="py-3 px-4 text-[#5A5E66]">{item.unit}</td>
                    <td className="py-3 px-4 text-right font-mono text-[#4A4F58] tabular-nums">
                      ${item.unitPriceUsd.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-[#141517] tabular-nums">
                      ${item.totalPriceUsd.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-[#DCDFE4] bg-[#FAFAFB] text-xs font-semibold">
                  <td colSpan={6} className="py-3 px-4 text-right text-[#4A4F58]">
                    Hardware Schedule Subtotal
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-[#141517] tabular-nums">
                    ${calc.estimatedHardwareCostUsd.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        {/* CNC Joinery & Shop Specification Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="border border-[#E2E4E8] rounded-xl bg-[#FFFFFF] p-5">
            <h3 className="font-display text-sm font-semibold text-[#141517]">
              CNC Machining & Boring Parameters
            </h3>
            <dl className="mt-4 divide-y divide-[#F0F1F4] text-xs">
              <div className="py-2.5 flex justify-between gap-4">
                <dt className="text-[#5A5E66]">Construction Architecture</dt>
                <dd className="font-mono text-[#141517] text-right">
                  {styleDef.shortName} · {spec.construction === 'frameless' ? 'Frameless 32mm' : 'Face-Frame'} ({mountLabel})
                </dd>
              </div>
              <div className="py-2.5 flex justify-between gap-4">
                <dt className="text-[#5A5E66]">Carcass Joinery</dt>
                <dd className="font-mono text-[#141517] text-right">
                  {spec.joinery === 'dado-rabbet'
                    ? '6 mm Blind Dado + Back Groove'
                    : spec.joinery === 'dowel-32mm'
                      ? '8×35 mm Dowels + Confirmat'
                      : '15 mm Minifix Cam-Lock RTA'}
                </dd>
              </div>
              <div className="py-2.5 flex justify-between gap-4">
                <dt className="text-[#5A5E66]">Shelf-Pin Boring Grid</dt>
                <dd className="font-mono text-[#141517] tabular-nums text-right">
                  5 mm Ø × 12 mm deep · 32 mm OC · {calc.shelfPinHoleRows} rows/bay
                </dd>
              </div>
              <div className="py-2.5 flex justify-between gap-4">
                <dt className="text-[#5A5E66]">Hinge Machining ({hingeDef.shortName})</dt>
                <dd className="font-mono text-[#141517] tabular-nums text-right">
                  {hingeDef.machiningSpec}
                </dd>
              </div>
              <div className="py-2.5 flex justify-between gap-4">
                <dt className="text-[#5A5E66]">Rear Service Void</dt>
                <dd className="font-mono text-[#141517] tabular-nums text-right">
                  12 mm setback behind {spec.backThicknessMm} mm back panel
                </dd>
              </div>
            </dl>
          </section>

          <section className="border border-[#E2E4E8] rounded-xl bg-[#FFFFFF] p-5">
            <h3 className="font-display text-sm font-semibold text-[#141517]">
              Material & Finishing Spec Sheet
            </h3>
            <dl className="mt-4 divide-y divide-[#F0F1F4] text-xs">
              <div className="py-2.5 flex justify-between gap-4">
                <dt className="text-[#5A5E66]">Cabinet Style & Door Profile</dt>
                <dd className="font-medium text-[#141517] text-right">
                  {styleDef.name} · {doorDef.name} ({mountLabel})
                </dd>
              </div>
              <div className="py-2.5 flex justify-between gap-4">
                <dt className="text-[#5A5E66]">Exterior Gables & Fronts</dt>
                <dd className="font-medium text-[#141517] text-right">
                  {extMat.name} ({spec.frontThicknessMm} mm)
                </dd>
              </div>
              <div className="py-2.5 flex justify-between gap-4">
                <dt className="text-[#5A5E66]">Carcass Interior Core</dt>
                <dd className="font-medium text-[#141517] text-right">
                  {intMat.name} ({spec.carcassThicknessMm} mm)
                </dd>
              </div>
              <div className="py-2.5 flex justify-between gap-4">
                <dt className="text-[#5A5E66]">Drawer Box Construction</dt>
                <dd className="font-mono text-[#141517]">
                  15 mm Baltic Birch sides · 6 mm captive bottom
                </dd>
              </div>
              <div className="py-2.5 flex justify-between gap-4">
                <dt className="text-[#5A5E66]">Door & Drawer Reveal</dt>
                <dd className="font-mono text-[#141517] tabular-nums">
                  {spec.revealGapMm} mm uniform perimeter shadow gap
                </dd>
              </div>
              <div className="py-2.5 flex justify-between gap-4">
                <dt className="text-[#5A5E66]">Edge Banding Spec</dt>
                <dd className="font-mono text-[#141517] tabular-nums">
                  1 mm PUR-bonded matching · {calc.totalEdgeBandingM.toFixed(1)} m total
                </dd>
              </div>
            </dl>
          </section>
        </div>
      </div>
    </div>
  );
};
