import React, { useMemo } from 'react';
import { CabinetCalculation, CabinetSpec } from '../types/cabinet';
import { generateBlueprintSVG } from '../engine/blueprintExport';
import {
  CABINET_STYLES,
  DOOR_STYLE_DEFS,
  HINGE_TYPES,
  formatDim,
} from '../engine/cabinetEngine';

interface PrintBlueprintPacketProps {
  spec: CabinetSpec;
  calc: CabinetCalculation;
}

/**
 * Multi-page print/PDF manufacturing dossier hidden on screen and cleanly rendered
 * when printing or saving to PDF via the browser's Print dialog.
 */
export const PrintBlueprintPacket: React.FC<PrintBlueprintPacketProps> = ({ spec, calc }) => {
  const blueprintSvg = useMemo(
    () =>
      generateBlueprintSVG(spec, calc, {
        showDimensions: true,
        showBoringGrid: true,
        showHiddenLines: true,
        showSwingArcs: true,
        blueprintTheme: 'architectural',
      }),
    [spec, calc]
  );

  return (
    <div className="hidden print-only bg-white text-black">
      {/* Page 1: Full Vector Architectural Blueprint Sheet */}
      <section className="w-full">
        <div
          className="w-full [&>svg]:w-full [&>svg]:h-auto"
          dangerouslySetInnerHTML={{ __html: blueprintSvg }}
        />
      </section>

      {/* Page 2: Manufacturing Cut List & Hardware Schedule */}
      <section className="print-page-break pt-2">
        <div className="flex items-baseline justify-between border-b-2 border-black pb-2 mb-4">
          <div>
            <h1 className="font-display text-lg font-bold">
              {spec.projectName} — Panel Cut List & Hardware Schedule
            </h1>
            <p className="font-mono text-xs text-neutral-600">
              Drawing {spec.drawingNumber} · {spec.revision} · Overall {formatDim(spec.widthMm, spec.unit)} W ×{' '}
              {formatDim(spec.heightMm, spec.unit)} H × {formatDim(spec.depthMm, spec.unit)} D ·{' '}
              {CABINET_STYLES[spec.cabinetStyle ?? 'modern-frameless'].shortName} ·{' '}
              {DOOR_STYLE_DEFS[spec.doorStyle].name} · {HINGE_TYPES[spec.hingeType ?? 'concealed-110'].shortName}
            </p>
          </div>
          <div className="font-mono text-xs text-right">
            <div>Total Panels: {calc.totalPanelCount}</div>
            <div>Sheets: {calc.totalSheetCount} · Edge Banding: {calc.totalEdgeBandingM.toFixed(1)} m</div>
          </div>
        </div>

        <table className="w-full text-left border-collapse text-[10px] mb-6">
          <thead>
            <tr className="border-b border-black bg-neutral-100">
              <th className="py-1.5 px-2">Code</th>
              <th className="py-1.5 px-2">Component</th>
              <th className="py-1.5 px-2">Material</th>
              <th className="py-1.5 px-2 text-right">Gauge</th>
              <th className="py-1.5 px-2 text-right">Length</th>
              <th className="py-1.5 px-2 text-right">Width</th>
              <th className="py-1.5 px-2 text-right">Qty</th>
              <th className="py-1.5 px-2">Banding</th>
              <th className="py-1.5 px-2">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-300">
            {calc.parts.map((p) => (
              <tr key={p.id}>
                <td className="py-1 px-2 font-mono font-semibold">{p.code}</td>
                <td className="py-1 px-2">{p.name}</td>
                <td className="py-1 px-2">{p.materialName}</td>
                <td className="py-1 px-2 text-right font-mono">{p.thicknessMm} mm</td>
                <td className="py-1 px-2 text-right font-mono">{formatDim(p.lengthMm, spec.unit)}</td>
                <td className="py-1 px-2 text-right font-mono">{formatDim(p.widthMm, spec.unit)}</td>
                <td className="py-1 px-2 text-right font-mono font-bold">{p.qty}</td>
                <td className="py-1 px-2 font-mono">{p.edgeBanding}</td>
                <td className="py-1 px-2 text-neutral-600">{p.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h2 className="font-display text-sm font-bold mb-2">Hardware & Fittings Schedule</h2>
        <table className="w-full text-left border-collapse text-[10px]">
          <thead>
            <tr className="border-b border-black bg-neutral-100">
              <th className="py-1.5 px-2">Category</th>
              <th className="py-1.5 px-2">Item</th>
              <th className="py-1.5 px-2">Specification</th>
              <th className="py-1.5 px-2 text-right">Qty</th>
              <th className="py-1.5 px-2">Unit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-300">
            {calc.hardware.map((h) => (
              <tr key={h.id}>
                <td className="py-1 px-2 font-medium">{h.category}</td>
                <td className="py-1 px-2">{h.name}</td>
                <td className="py-1 px-2 text-neutral-600">{h.spec}</td>
                <td className="py-1 px-2 text-right font-mono font-bold">{h.qty}</td>
                <td className="py-1 px-2">{h.unit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Page 3: Sheet Goods Nesting Diagrams */}
      <section className="print-page-break pt-2">
        <div className="flex items-baseline justify-between border-b-2 border-black pb-2 mb-4">
          <h1 className="font-display text-lg font-bold">
            Sheet Goods Nesting Diagrams ({calc.totalSheetCount} Sheets · Avg Yield {calc.avgUtilizationPct.toFixed(1)}%)
          </h1>
          <span className="font-mono text-xs">Saw Kerf: {spec.sawKerfMm} mm</span>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {calc.sheets.map((sheet) => (
            <div key={sheet.sheetIndex} className="border border-neutral-400 p-3">
              <div className="flex justify-between font-mono text-[10px] mb-1.5">
                <span className="font-bold">
                  Sheet {sheet.sheetIndex}: {sheet.materialName} ({sheet.thicknessMm}mm)
                </span>
                <span>{sheet.utilizationPct.toFixed(1)}% yield</span>
              </div>
              <svg
                viewBox={`0 0 ${sheet.sheetWidthMm} ${sheet.sheetHeightMm}`}
                className="w-full h-auto border border-black"
              >
                <rect width={sheet.sheetWidthMm} height={sheet.sheetHeightMm} fill="#f8f8f8" />
                {sheet.parts.map((part) => (
                  <g key={part.partId}>
                    <rect
                      x={part.x}
                      y={part.y}
                      width={part.w}
                      height={part.h}
                      fill="#ffffff"
                      stroke="#111111"
                      strokeWidth={4}
                    />
                    {part.w > 130 && part.h > 85 && (
                      <text
                        x={part.x + part.w / 2}
                        y={part.y + part.h / 2 + 12}
                        textAnchor="middle"
                        fontFamily="'IBM Plex Mono', monospace"
                        fontSize={36}
                        fill="#111111"
                      >
                        {part.code} ({Math.round(part.w)}×{Math.round(part.h)})
                      </text>
                    )}
                  </g>
                ))}
              </svg>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
