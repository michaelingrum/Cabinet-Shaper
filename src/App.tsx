import { useEffect, useMemo, useState } from 'react';
import { ActiveWorkspaceTab, CabinetSpec } from './types/cabinet';
import {
  CABINET_PRESETS,
  calculateCabinetEngineering,
  createInitialCabinetSpec,
} from './engine/cabinetEngine';
import { ConfigSidebar } from './components/ConfigSidebar';
import { CabinetViewport3D } from './components/CabinetViewport3D';
import { BlueprintView } from './components/BlueprintView';
import { CutListNestingView } from './components/CutListNestingView';
import { HardwareBomView } from './components/HardwareBomView';
import { ExportModal } from './components/ExportModal';
import { PrintBlueprintPacket } from './components/PrintBlueprintPacket';

const STORAGE_KEY = 'kerno_millwork_active_cabinet_v1';

const NAV_TABS: Array<{ id: ActiveWorkspaceTab; label: string }> = [
  { id: 'studio', label: '3D Studio' },
  { id: 'blueprints', label: 'Blueprints' },
  { id: 'cutlist', label: 'Cut List & Nesting' },
  { id: 'hardware', label: 'Hardware & BOM' },
];

export default function App() {
  const [spec, setSpec] = useState<CabinetSpec>(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.widthMm === 'number' && Array.isArray(parsed.bays)) {
          return { ...createInitialCabinetSpec(), ...parsed };
        }
      }
    } catch {
      // ignore storage errors
    }
    return createInitialCabinetSpec();
  });

  const [activeTab, setActiveTab] = useState<ActiveWorkspaceTab>('studio');
  const [exportModalOpen, setExportModalOpen] = useState(false);

  // Persist user's active cabinet configuration locally
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(spec));
    } catch {
      // ignore quota errors
    }
  }, [spec]);

  // Real-time parametric engineering calculation (cut list, nesting, BOM, bay geometry)
  const calc = useMemo(() => calculateCabinetEngineering(spec), [spec]);

  const handleApplyPreset = (presetId: string) => {
    const preset = CABINET_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setSpec((prev) => ({
      ...prev,
      ...preset.spec,
      bays: preset.spec.bays ? preset.spec.bays.map((b) => ({ ...b })) : prev.bays,
    }));
  };

  const handleReset = () => {
    setSpec(createInitialCabinetSpec());
  };

  const handlePrintDossier = () => {
    window.print();
  };

  const showSidebar = activeTab === 'studio' || activeTab === 'blueprints';

  return (
    <>
      <div className="no-print h-screen w-screen flex flex-col overflow-hidden bg-[#F6F6F3] text-[#141517]">
        {/* Top Bar Contract: Strict 3-Zone Header separated by gap-8 */}
        <header className="h-14 shrink-0 border-b border-[#E2E4E8] bg-[#FFFFFF] px-6 flex items-center justify-between gap-8">
          {/* Zone 1: Single text element wordmark */}
          <button
            type="button"
            onClick={() => setActiveTab('studio')}
            className="font-display text-base font-bold tracking-tight text-[#141517] whitespace-nowrap shrink-0 cursor-pointer"
          >
            Kerno Millwork
          </button>

          {/* Zone 2: 4 clean single-line text navigation links */}
          <nav
            aria-label="Workspace views"
            className="flex items-center gap-6 overflow-x-auto no-scrollbar h-full"
          >
            {NAV_TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative h-full inline-flex items-center text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    isActive
                      ? 'text-[#141517]'
                      : 'text-[#5A5E66] hover:text-[#141517]'
                  }`}
                >
                  <span>{tab.label}</span>
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1D4ED8]" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: 1 primary CTA action */}
          <div className="shrink-0">
            <button
              type="button"
              onClick={() => setExportModalOpen(true)}
              className="rounded-lg bg-[#141517] px-4 py-2 text-xs font-medium text-[#FFFFFF] hover:bg-[#1D4ED8] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Export Blueprints
            </button>
          </div>
        </header>

        {/* Main Workspace Body */}
        <main className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
          {showSidebar && (
            <ConfigSidebar
              spec={spec}
              onChange={setSpec}
              onApplyPreset={handleApplyPreset}
              onReset={handleReset}
            />
          )}

          <div className="flex-1 min-w-0 min-h-0 h-full overflow-hidden">
            {activeTab === 'studio' && <CabinetViewport3D spec={spec} calc={calc} />}
            {activeTab === 'blueprints' && (
              <BlueprintView
                spec={spec}
                calc={calc}
                onPrintDossier={handlePrintDossier}
              />
            )}
            {activeTab === 'cutlist' && (
              <CutListNestingView
                spec={spec}
                calc={calc}
                onChangeSpec={setSpec}
              />
            )}
            {activeTab === 'hardware' && <HardwareBomView spec={spec} calc={calc} />}
          </div>
        </main>
      </div>

      {/* Manufacturing Export Dialog */}
      <ExportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        spec={spec}
        calc={calc}
        onUpdateSpec={setSpec}
        onImportSpec={(imported) => setSpec({ ...createInitialCabinetSpec(), ...imported })}
        onPrintDossier={handlePrintDossier}
      />

      {/* Dedicated Print / PDF Manufacturing Blueprint Packet */}
      <PrintBlueprintPacket spec={spec} calc={calc} />
    </>
  );
}
