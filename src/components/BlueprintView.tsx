import React, { useMemo, useState } from 'react';
import { Download, Printer, ZoomIn, ZoomOut, RotateCcw, FileCode2 } from 'lucide-react';
import { CabinetCalculation, CabinetSpec } from '../types/cabinet';
import {
  BlueprintRenderOptions,
  downloadTextFile,
  generateBlueprintSVG,
  generateDXF,
} from '../engine/blueprintExport';

interface BlueprintViewProps {
  spec: CabinetSpec;
  calc: CabinetCalculation;
  onPrintDossier: () => void;
}

export const BlueprintView: React.FC<BlueprintViewProps> = ({ spec, calc, onPrintDossier }) => {
  const [options, setOptions] = useState<BlueprintRenderOptions>({
    showDimensions: true,
    showBoringGrid: true,
    showHiddenLines: true,
    showSwingArcs: true,
    blueprintTheme: 'architectural',
  });
  const [zoom, setZoom] = useState(1);

  const svgMarkup = useMemo(
    () => generateBlueprintSVG(spec, calc, options),
    [spec, calc, options]
  );

  const safeSlug = spec.drawingNumber.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase() || 'cabinet';

  const handleDownloadSvg = () => {
    downloadTextFile(svgMarkup, `${safeSlug}_blueprint.svg`, 'image/svg+xml;charset=utf-8');
  };

  const handleDownloadDxf = () => {
    const dxf = generateDXF(spec, calc);
    downloadTextFile(dxf, `${safeSlug}_cad_1to1.dxf`, 'application/dxf;charset=utf-8');
  };

  const toggleOption = (key: keyof Omit<BlueprintRenderOptions, 'blueprintTheme'>) => {
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="flex flex-col h-full bg-[#F2F2EE] overflow-hidden">
      {/* Blueprint Drafting Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E4E8] bg-[#FFFFFF] px-6 py-3 shrink-0">
        <div className="flex flex-wrap items-center gap-4">
          {/* Layer toggles */}
          <div className="flex items-center gap-1 rounded-lg bg-[#F2F3F5] p-1">
            {(
              [
                { key: 'showDimensions', label: 'Dimensions' },
                { key: 'showBoringGrid', label: '32mm Boring' },
                { key: 'showHiddenLines', label: 'Hidden Lines' },
                { key: 'showSwingArcs', label: 'Door Swings' },
              ] as const
            ).map((item) => {
              const active = options[item.key];
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => toggleOption(item.key)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    active
                      ? 'bg-[#FFFFFF] text-[#141517] shadow-xs'
                      : 'text-[#5A5E66] hover:text-[#141517]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* Paper / Blueprint Theme Switch */}
          <div className="flex items-center gap-1 rounded-lg bg-[#F2F3F5] p-1">
            <button
              type="button"
              onClick={() => setOptions((o) => ({ ...o, blueprintTheme: 'architectural' }))}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                options.blueprintTheme === 'architectural'
                  ? 'bg-[#FFFFFF] text-[#141517] shadow-xs'
                  : 'text-[#5A5E66] hover:text-[#141517]'
              }`}
            >
              Drafting Paper
            </button>
            <button
              type="button"
              onClick={() => setOptions((o) => ({ ...o, blueprintTheme: 'classic-blue' }))}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                options.blueprintTheme === 'classic-blue'
                  ? 'bg-[#0E294B] text-[#FFFFFF] shadow-xs'
                  : 'text-[#5A5E66] hover:text-[#141517]'
              }`}
            >
              Cyanotype Blue
            </button>
          </div>
        </div>

        {/* Zoom & Quick Export Actions */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 border border-[#E2E4E8] rounded-lg px-1.5 py-1 bg-[#FAFAFB]">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.6, Math.round((z - 0.15) * 100) / 100))}
              className="p-1 text-[#4A4F58] hover:text-[#141517] cursor-pointer"
              title="Zoom out"
              aria-label="Zoom out blueprint"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono text-xs text-[#141517] tabular-nums w-11 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(1.9, Math.round((z + 0.15) * 100) / 100))}
              className="p-1 text-[#4A4F58] hover:text-[#141517] cursor-pointer"
              title="Zoom in"
              aria-label="Zoom in blueprint"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setZoom(1)}
              className="p-1 text-[#5A5E66] hover:text-[#141517] cursor-pointer"
              title="Reset zoom"
              aria-label="Reset blueprint zoom"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleDownloadSvg}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#DCDFE4] bg-[#FFFFFF] px-3 py-1.5 text-xs font-medium text-[#141517] hover:border-[#1D4ED8] hover:text-[#1D4ED8] transition-colors cursor-pointer whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span>SVG Sheet</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadDxf}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#DCDFE4] bg-[#FFFFFF] px-3 py-1.5 text-xs font-medium text-[#141517] hover:border-[#1D4ED8] hover:text-[#1D4ED8] transition-colors cursor-pointer whitespace-nowrap"
          >
            <FileCode2 className="w-3.5 h-3.5" />
            <span>AutoCAD DXF</span>
          </button>

          <button
            type="button"
            onClick={onPrintDossier}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#141517] px-3 py-1.5 text-xs font-medium text-[#FFFFFF] hover:bg-[#2A2D34] transition-colors cursor-pointer whitespace-nowrap"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print PDF</span>
          </button>
        </div>
      </div>

      {/* Scrollable Blueprint Canvas */}
      <div className="flex-1 overflow-auto p-6 flex items-start justify-center">
        <div
          className="transition-transform duration-150 origin-top border border-[#D4D7DD] shadow-[0_8px_32px_rgba(20,21,23,0.08)] bg-white"
          style={{
            width: `${Math.round(1180 * zoom)}px`,
            maxWidth: 'none',
          }}
        >
          <div
            className="w-full [&>svg]:w-full [&>svg]:h-auto [&>svg]:block"
            dangerouslySetInnerHTML={{ __html: svgMarkup }}
          />
        </div>
      </div>
    </div>
  );
};
