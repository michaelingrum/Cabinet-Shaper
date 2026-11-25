import React, { useRef, useState } from 'react';
import {
  X,
  Download,
  FileCode2,
  Printer,
  FileSpreadsheet,
  FolderUp,
  Save,
  Check,
} from 'lucide-react';
import { CabinetCalculation, CabinetSpec } from '../types/cabinet';
import {
  downloadTextFile,
  generateBlueprintSVG,
  generateCutListCSV,
  generateDXF,
  generateHardwareBOMCSV,
} from '../engine/blueprintExport';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  spec: CabinetSpec;
  calc: CabinetCalculation;
  onUpdateSpec: (updater: (prev: CabinetSpec) => CabinetSpec) => void;
  onImportSpec: (imported: CabinetSpec) => void;
  onPrintDossier: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  spec,
  calc,
  onUpdateSpec,
  onImportSpec,
  onPrintDossier,
}) => {
  const [recentExport, setRecentExport] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const slug =
    spec.drawingNumber.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase() || 'custom_cabinet';

  const markExported = (label: string) => {
    setRecentExport(label);
    window.setTimeout(() => setRecentExport(null), 2600);
  };

  const handleExportSvg = () => {
    const svg = generateBlueprintSVG(spec, calc, {
      showDimensions: true,
      showBoringGrid: true,
      showHiddenLines: true,
      showSwingArcs: true,
      blueprintTheme: 'architectural',
    });
    downloadTextFile(svg, `${slug}_blueprint.svg`, 'image/svg+xml;charset=utf-8');
    markExported('SVG Blueprint downloaded');
  };

  const handleExportDxf = () => {
    const dxf = generateDXF(spec, calc);
    downloadTextFile(dxf, `${slug}_cnc_cad.dxf`, 'application/dxf;charset=utf-8');
    markExported('AutoCAD DXF downloaded');
  };

  const handleExportCutCsv = () => {
    const csv = generateCutListCSV(spec, calc);
    downloadTextFile(csv, `${slug}_cut_list.csv`, 'text/csv;charset=utf-8');
    markExported('Cut List CSV downloaded');
  };

  const handleExportBomCsv = () => {
    const csv = generateHardwareBOMCSV(spec, calc);
    downloadTextFile(csv, `${slug}_hardware_bom.csv`, 'text/csv;charset=utf-8');
    markExported('Hardware BOM CSV downloaded');
  };

  const handleExportJson = () => {
    downloadTextFile(
      JSON.stringify(spec, null, 2),
      `${slug}_spec.kerno.json`,
      'application/json;charset=utf-8'
    );
    markExported('Project JSON saved');
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError(null);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (
          typeof parsed === 'object' &&
          parsed !== null &&
          typeof parsed.widthMm === 'number' &&
          Array.isArray(parsed.bays)
        ) {
          onImportSpec(parsed as CabinetSpec);
          markExported('Project file loaded');
        } else {
          setImportError('Invalid cabinet project file format.');
        }
      } catch {
        setImportError('Could not read JSON file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-modal-title"
    >
      <div className="w-full max-w-2xl rounded-xl border border-[#DCDFE4] bg-[#FFFFFF] shadow-[0_20px_60px_rgba(20,21,23,0.18)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#ECEEF1]">
          <div>
            <h2 id="export-modal-title" className="font-display text-base font-semibold text-[#141517]">
              Export Manufacturing Blueprints
            </h2>
            <p className="text-xs text-[#5A5E66] mt-0.5">
              Customize title block details and download shop-ready CAD, SVG, PDF, or CSV deliverables
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#5A5E66] hover:bg-[#F2F3F5] hover:text-[#141517] transition-colors cursor-pointer"
            aria-label="Close export modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[82vh] overflow-y-auto">
          {/* Title Block Metadata Form */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-[#141517]">
              Blueprint Title Block Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[11px] text-[#5A5E66] mb-1">
                  Cabinet / Project Title
                </label>
                <input
                  type="text"
                  value={spec.projectName}
                  onChange={(e) =>
                    onUpdateSpec((prev) => ({ ...prev, projectName: e.target.value }))
                  }
                  className="w-full rounded-md border border-[#DCDFE4] px-3 py-1.5 text-xs text-[#141517] focus:border-[#1D4ED8] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] text-[#5A5E66] mb-1">
                  Drawing Number
                </label>
                <input
                  type="text"
                  value={spec.drawingNumber}
                  onChange={(e) =>
                    onUpdateSpec((prev) => ({ ...prev, drawingNumber: e.target.value }))
                  }
                  className="w-full rounded-md border border-[#DCDFE4] px-3 py-1.5 font-mono text-xs text-[#141517] focus:border-[#1D4ED8] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-[#5A5E66] mb-1">Revision</label>
                <input
                  type="text"
                  value={spec.revision}
                  onChange={(e) =>
                    onUpdateSpec((prev) => ({ ...prev, revision: e.target.value }))
                  }
                  className="w-full rounded-md border border-[#DCDFE4] px-3 py-1.5 font-mono text-xs text-[#141517] focus:border-[#1D4ED8] focus:outline-none"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[11px] text-[#5A5E66] mb-1">
                  Shop Floor / CNC Fabrication Notes
                </label>
                <input
                  type="text"
                  value={spec.notes}
                  onChange={(e) =>
                    onUpdateSpec((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  className="w-full rounded-md border border-[#DCDFE4] px-3 py-1.5 text-xs text-[#141517] focus:border-[#1D4ED8] focus:outline-none"
                />
              </div>
            </div>
          </div>

          <hr className="border-[#ECEEF1]" />

          {/* Deliverables Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-[#141517]">
                Manufacturing Deliverables
              </h3>
              {recentExport && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-[#15803D]">
                  <Check className="w-3.5 h-3.5" />
                  <span>{recentExport}</span>
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleExportDxf}
                className="flex items-start gap-3 rounded-lg border border-[#DCDFE4] p-3.5 text-left hover:border-[#1D4ED8] hover:bg-[#1D4ED8]/[0.03] transition-colors cursor-pointer"
              >
                <FileCode2 className="w-5 h-5 text-[#1D4ED8] shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-semibold text-[#141517]">
                    AutoCAD / CNC Drawing (.dxf)
                  </div>
                  <p className="text-[11px] text-[#5A5E66] mt-0.5 leading-relaxed">
                    1:1 mm R12 DXF with Front, Section, Plan, 32mm boring circles, and nested CNC cut sheets.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={handleExportSvg}
                className="flex items-start gap-3 rounded-lg border border-[#DCDFE4] p-3.5 text-left hover:border-[#1D4ED8] hover:bg-[#1D4ED8]/[0.03] transition-colors cursor-pointer"
              >
                <Download className="w-5 h-5 text-[#1D4ED8] shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-semibold text-[#141517]">
                    Architectural Blueprint (.svg)
                  </div>
                  <p className="text-[11px] text-[#5A5E66] mt-0.5 leading-relaxed">
                    Scalable vector ISO A3 orthographic drawing with dimensions, swing arcs, and title block.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  window.setTimeout(() => onPrintDossier(), 120);
                }}
                className="flex items-start gap-3 rounded-lg border border-[#141517] bg-[#141517] p-3.5 text-left hover:bg-[#262930] transition-colors cursor-pointer"
              >
                <Printer className="w-5 h-5 text-[#FFFFFF] shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-semibold text-[#FFFFFF]">
                    Print / Save PDF Dossier
                  </div>
                  <p className="text-[11px] text-[#CBD0D9] mt-0.5 leading-relaxed">
                    Complete 3-page landscape shop packet: Orthographic Blueprint + Cut List + Nested Sheets.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={handleExportCutCsv}
                className="flex items-start gap-3 rounded-lg border border-[#DCDFE4] p-3.5 text-left hover:border-[#1D4ED8] hover:bg-[#1D4ED8]/[0.03] transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-5 h-5 text-[#1D4ED8] shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-semibold text-[#141517]">
                    Panel Cut List (.csv)
                  </div>
                  <p className="text-[11px] text-[#5A5E66] mt-0.5 leading-relaxed">
                    {calc.totalPanelCount} panels with exact cut dimensions, edge banding codes, and grain flags.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={handleExportBomCsv}
                className="flex items-start gap-3 rounded-lg border border-[#DCDFE4] p-3.5 text-left hover:border-[#1D4ED8] hover:bg-[#1D4ED8]/[0.03] transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-5 h-5 text-[#4A4F58] shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-semibold text-[#141517]">
                    Hardware & BOM Schedule (.csv)
                  </div>
                  <p className="text-[11px] text-[#5A5E66] mt-0.5 leading-relaxed">
                    Hinges, undermount slides, pulls, edge banding meters, and estimated material totals.
                  </p>
                </div>
              </button>

              <div className="flex flex-col justify-between rounded-lg border border-[#ECEEF1] bg-[#FAFAFB] p-3.5">
                <div className="text-xs font-semibold text-[#141517]">
                  Project File Backup (.json)
                </div>
                <p className="text-[11px] text-[#5A5E66] mt-0.5">
                  Save or reload this cabinet configuration later.
                </p>
                <div className="mt-2.5 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleExportJson}
                    className="inline-flex items-center gap-1.5 rounded-md border border-[#DCDFE4] bg-[#FFFFFF] px-2.5 py-1 text-[11px] font-medium text-[#141517] hover:border-[#1D4ED8] hover:text-[#1D4ED8] cursor-pointer"
                  >
                    <Save className="w-3 h-3" />
                    <span>Save Spec</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 rounded-md border border-[#DCDFE4] bg-[#FFFFFF] px-2.5 py-1 text-[11px] font-medium text-[#141517] hover:border-[#1D4ED8] hover:text-[#1D4ED8] cursor-pointer"
                  >
                    <FolderUp className="w-3 h-3" />
                    <span>Load Spec</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleImportFile}
                    className="hidden"
                  />
                </div>
                {importError && (
                  <p className="mt-1.5 text-[11px] text-[#DC2626]">{importError}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
