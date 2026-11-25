import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { ChevronDown, ChevronUp, Eye, Layers, DoorOpen } from 'lucide-react';
import { CabinetCalculation, CabinetSpec, CameraPresetId } from '../types/cabinet';
import {
  CABINET_STYLES,
  DOOR_STYLE_DEFS,
  HINGE_TYPES,
  formatDim,
} from '../engine/cabinetEngine';
import { buildCabinet3D, CabinetSceneBuild } from '../three/cabinetBuilder';
import { createContactShadowTexture } from '../three/proceduralTextures';

interface CabinetViewport3DProps {
  spec: CabinetSpec;
  calc: CabinetCalculation;
}

const _camTargetPos = new THREE.Vector3();
const _camTargetLook = new THREE.Vector3();

function detectSoftwareWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) ?? '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

const CAMERA_PRESETS: Array<{ id: CameraPresetId; label: string }> = [
  { id: 'three-quarter', label: '3/4 Studio' },
  { id: 'front', label: 'Front' },
  { id: 'side', label: 'Side' },
  { id: 'top', label: 'Top' },
  { id: 'interior', label: 'Interior' },
];

export const CabinetViewport3D: React.FC<CabinetViewport3DProps> = ({ spec, calc }) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [exploded, setExploded] = useState(0); // 0 to 1
  const [openAmount, setOpenAmount] = useState(0); // 0 to 1
  const [xrayFronts, setXrayFronts] = useState(false);
  const [activePreset, setActivePreset] = useState<CameraPresetId>('three-quarter');
  const [dockCollapsed, setDockCollapsed] = useState(false);
  const [contextLost, setContextLost] = useState(false);

  // Refs shared with Three.js render loop (so React updates never tear down WebGL)
  const animStateRef = useRef({
    targetExploded: 0,
    currentExploded: 0,
    targetOpen: 0,
    currentOpen: 0,
    xray: false,
    cameraTweenActive: false,
    camGoalPos: new THREE.Vector3(1.55, 1.15, 2.05),
    camGoalLook: new THREE.Vector3(0, 0.45, 0),
  });

  const sceneRefs = useRef<{
    scene: THREE.Scene | null;
    camera: THREE.PerspectiveCamera | null;
    renderer: THREE.WebGLRenderer | null;
    controls: OrbitControls | null;
    cabinetBuild: CabinetSceneBuild | null;
    contactPlane: THREE.Mesh | null;
    requestRender: () => void;
  }>({
    scene: null,
    camera: null,
    renderer: null,
    controls: null,
    cabinetBuild: null,
    contactPlane: null,
    requestRender: () => {},
  });

  // Compute camera goal for a given preset based on current cabinet dimensions
  const computePresetGoal = (preset: CameraPresetId, currentSpec: CabinetSpec) => {
    const w = currentSpec.widthMm / 1000;
    const h = currentSpec.heightMm / 1000;
    const d = currentSpec.depthMm / 1000;
    const maxDim = Math.max(w, h, d, 0.8);
    const dist = maxDim * 1.65 + 0.45;
    const midY = h * 0.5;

    switch (preset) {
      case 'front':
        _camTargetPos.set(0, midY + 0.04, dist * 1.05);
        _camTargetLook.set(0, midY, 0);
        break;
      case 'side':
        _camTargetPos.set(dist * 1.05, midY + 0.06, 0.08);
        _camTargetLook.set(0, midY, 0);
        break;
      case 'top':
        _camTargetPos.set(0, h + dist * 0.95, 0.32);
        _camTargetLook.set(0, midY * 0.6, 0);
        break;
      case 'interior':
        _camTargetPos.set(w * 0.35, midY + 0.16, dist * 0.72);
        _camTargetLook.set(0, midY, 0);
        break;
      case 'three-quarter':
      default:
        _camTargetPos.set(dist * 0.72, midY + dist * 0.34, dist * 0.88);
        _camTargetLook.set(0, midY * 0.94, 0);
        break;
    }
    return {
      pos: _camTargetPos.clone(),
      look: _camTargetLook.clone(),
    };
  };

  // Initialize Three.js Scene once
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = detectSoftwareWebGL();
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#F2F2EE');
    scene.fog = new THREE.Fog('#F2F2EE', 7.5, 19);

    const camera = new THREE.PerspectiveCamera(36, width / height, 0.05, 40);
    const initGoal = computePresetGoal('three-quarter', spec);
    camera.position.copy(initGoal.pos);
    animStateRef.current.camGoalPos.copy(initGoal.pos);
    animStateRef.current.camGoalLook.copy(initGoal.look);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';

    // Mandatory studio environment reflection via RoomEnvironment on every device
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envRT = pmremGenerator.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = envRT.texture;
    pmremGenerator.dispose();

    // Balanced 3-Point Architectural Studio Lighting (warm key + cool hemi fill + subtle rim)
    const hemiLight = new THREE.HemisphereLight(0xf3f7ff, 0xd9d2c5, 0.72);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff6ea, 1.55);
    keyLight.position.set(2.8, 4.4, 3.2);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 14;
    const d = 2.4;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xdbe8ff, 0.62);
    rimLight.position.set(-3.2, 2.6, -2.8);
    scene.add(rimLight);

    // Architectural studio floor plane (receives real shadows on GPU)
    const floorGeo = new THREE.PlaneGeometry(24, 24);
    const floorMat = new THREE.ShadowMaterial({ opacity: 0.14 });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.y = 0;
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    // Crisp drafting grid slightly above floor with polygonOffset (zero Z-fighting)
    const grid = new THREE.GridHelper(10, 40, 0xc9ccd2, 0xe1e3e7);
    grid.position.y = 0.001;
    const gridMats = Array.isArray(grid.material) ? grid.material : [grid.material];
    gridMats.forEach((m) => {
      m.transparent = true;
      m.opacity = 0.62;
      m.polygonOffset = true;
      m.polygonOffsetFactor = -1;
      m.polygonOffsetUnits = -1;
    });
    scene.add(grid);

    // Soft radial contact shadow grounding plane directly under the cabinet
    const contactTex = createContactShadowTexture();
    const contactGeo = new THREE.PlaneGeometry(1, 1);
    const contactMat = new THREE.MeshBasicMaterial({
      map: contactTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.48,
    });
    const contactPlane = new THREE.Mesh(contactGeo, contactMat);
    contactPlane.rotation.x = -Math.PI / 2;
    contactPlane.position.y = 0.002;
    scene.add(contactPlane);

    // Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.copy(initGoal.look);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.08;
    controls.minDistance = 0.55;
    controls.maxDistance = 8.0;
    controls.maxPolarAngle = Math.PI / 2 - 0.02;
    controls.update();

    // Cancel camera preset tween whenever user manually drags/zooms
    const onControlStart = () => {
      animStateRef.current.cameraTweenActive = false;
    };
    controls.addEventListener('start', onControlStart);

    // On-demand render scheduler with software-WebGL afterDraw fenceSync pacing
    let frameId = 0;
    let disposed = false;
    let renderBusy = false;
    let renderDirty = false;
    let lastTime = performance.now();

    const afterDraw = (cb: () => void) => {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (!gl || typeof gl.fenceSync !== 'function') {
        frameId = window.setTimeout(cb, 80);
        return;
      }
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) {
          if (sync) gl.deleteSync(sync);
          return;
        }
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    };

    const applyKinematics = (dt: number): boolean => {
      const st = animStateRef.current;
      let stillMoving = false;
      const dampRate = isSoftwareGl ? 18 : 10;

      // Exploded view interpolation
      if (Math.abs(st.currentExploded - st.targetExploded) > 0.0008) {
        st.currentExploded = THREE.MathUtils.damp(st.currentExploded, st.targetExploded, dampRate, dt);
        stillMoving = true;
      } else {
        st.currentExploded = st.targetExploded;
      }

      // Open doors/drawers interpolation
      if (Math.abs(st.currentOpen - st.targetOpen) > 0.0008) {
        st.currentOpen = THREE.MathUtils.damp(st.currentOpen, st.targetOpen, dampRate, dt);
        stillMoving = true;
      } else {
        st.currentOpen = st.targetOpen;
      }

      const build = sceneRefs.current.cabinetBuild;
      if (build) {
        const ex = st.currentExploded;
        for (let i = 0; i < build.explodables.length; i++) {
          const item = build.explodables[i];
          item.object.position.set(
            item.basePos.x + item.explodeDelta.x * ex,
            item.basePos.y + item.explodeDelta.y * ex,
            item.basePos.z + item.explodeDelta.z * ex
          );
        }
        const op = st.currentOpen;
        for (let i = 0; i < build.doors.length; i++) {
          const dItem = build.doors[i];
          const sign = dItem.hingeSide === 'left' ? -1 : 1;
          dItem.pivot.rotation.y = sign * dItem.maxAngleRad * op;
        }
        for (let i = 0; i < build.drawers.length; i++) {
          const dr = build.drawers[i];
          dr.group.position.z = dr.baseZ + dr.travelZ * op;
        }
      }

      // Camera preset damping
      if (st.cameraTweenActive) {
        camera.position.x = THREE.MathUtils.damp(camera.position.x, st.camGoalPos.x, 7.5, dt);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, st.camGoalPos.y, 7.5, dt);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, st.camGoalPos.z, 7.5, dt);
        controls.target.x = THREE.MathUtils.damp(controls.target.x, st.camGoalLook.x, 7.5, dt);
        controls.target.y = THREE.MathUtils.damp(controls.target.y, st.camGoalLook.y, 7.5, dt);
        controls.target.z = THREE.MathUtils.damp(controls.target.z, st.camGoalLook.z, 7.5, dt);
        if (
          camera.position.distanceTo(st.camGoalPos) < 0.008 &&
          controls.target.distanceTo(st.camGoalLook) < 0.006
        ) {
          camera.position.copy(st.camGoalPos);
          controls.target.copy(st.camGoalLook);
          st.cameraTweenActive = false;
        } else {
          stillMoving = true;
        }
      }

      return stillMoving;
    };

    const requestRender = () => {
      if (disposed) return;
      if (renderBusy) {
        renderDirty = true;
        return;
      }
      renderBusy = true;
      frameId = requestAnimationFrame(() => {
        if (disposed) return;
        renderDirty = false;
        const now = performance.now();
        const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
        lastTime = now;

        const needsMore = applyKinematics(dt);
        const dampingActive = controls.update();
        renderer.render(scene, camera);

        const done = () => {
          if (disposed) return;
          renderBusy = false;
          if (renderDirty || needsMore || (!isSoftwareGl && dampingActive)) {
            requestRender();
          }
        };
        if (isSoftwareGl) afterDraw(done);
        else done();
      });
    };

    controls.addEventListener('change', requestRender);

    // WebGL context loss safety
    const onContextLost = (e: Event) => {
      e.preventDefault();
      setContextLost(true);
    };
    const onContextRestored = () => {
      setContextLost(false);
      requestRender();
    };
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);
    renderer.domElement.addEventListener('webglcontextrestored', onContextRestored);

    // ResizeObserver for crisp responsive viewport
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = Math.max(100, entry.contentRect.width);
        const h = Math.max(100, entry.contentRect.height);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
        requestRender();
      }
    });
    ro.observe(container);

    sceneRefs.current = {
      scene,
      camera,
      renderer,
      controls,
      cabinetBuild: null,
      contactPlane,
      requestRender,
    };

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      ro.disconnect();
      controls.removeEventListener('start', onControlStart);
      controls.removeEventListener('change', requestRender);
      controls.dispose();
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', onContextRestored);

      if (sceneRefs.current.cabinetBuild) {
        scene.remove(sceneRefs.current.cabinetBuild.root);
        sceneRefs.current.cabinetBuild.dispose();
        sceneRefs.current.cabinetBuild = null;
      }
      envRT.dispose();
      floorGeo.dispose();
      floorMat.dispose();
      contactTex.dispose();
      contactGeo.dispose();
      contactMat.dispose();
      renderer.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Rebuild composite 3D cabinet mesh whenever spec/calc changes (keeping camera & WebGL context intact)
  useEffect(() => {
    const { scene, renderer, contactPlane, requestRender } = sceneRefs.current;
    if (!scene || !renderer) return;

    if (sceneRefs.current.cabinetBuild) {
      scene.remove(sceneRefs.current.cabinetBuild.root);
      sceneRefs.current.cabinetBuild.dispose();
    }

    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const build = buildCabinet3D(spec, calc, maxAniso);

    // Apply current X-Ray state immediately
    build.frontMaterials.forEach((m) => {
      m.transparent = animStateRef.current.xray;
      m.opacity = animStateRef.current.xray ? 0.24 : 1.0;
      m.depthWrite = !animStateRef.current.xray;
      m.needsUpdate = true;
    });

    scene.add(build.root);
    sceneRefs.current.cabinetBuild = build;

    // Scale contact shadow plane to match cabinet footprint
    if (contactPlane) {
      const footprintW = (spec.widthMm / 1000) * 1.48;
      const footprintD = (spec.depthMm / 1000) * 1.68;
      contactPlane.scale.set(footprintW, footprintD, 1);
      contactPlane.visible = spec.baseStyle !== 'wall-hung';
    }

    requestRender();
  }, [spec, calc]);

  // Sync interactive controls to Three.js refs
  useEffect(() => {
    animStateRef.current.targetExploded = exploded;
    sceneRefs.current.requestRender();
  }, [exploded]);

  useEffect(() => {
    animStateRef.current.targetOpen = openAmount;
    sceneRefs.current.requestRender();
  }, [openAmount]);

  useEffect(() => {
    animStateRef.current.xray = xrayFronts;
    const build = sceneRefs.current.cabinetBuild;
    if (build) {
      build.frontMaterials.forEach((m) => {
        m.transparent = xrayFronts;
        m.opacity = xrayFronts ? 0.24 : 1.0;
        m.depthWrite = !xrayFronts;
        m.needsUpdate = true;
      });
    }
    sceneRefs.current.requestRender();
  }, [xrayFronts]);

  // Keyboard shortcut H to toggle bottom control dock (Zen inspection mode)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
        return;
      }
      if (e.key === 'h' || e.key === 'H') {
        setDockCollapsed((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleCameraPreset = (preset: CameraPresetId) => {
    setActivePreset(preset);
    const goal = computePresetGoal(preset, spec);
    animStateRef.current.camGoalPos.copy(goal.pos);
    animStateRef.current.camGoalLook.copy(goal.look);
    animStateRef.current.cameraTweenActive = true;
    if (preset === 'interior' && openAmount < 0.7) {
      setOpenAmount(0.85);
    }
    sceneRefs.current.requestRender();
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#F2F2EE] select-none">
      {/* Dedicated empty container for WebGLRenderer */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Minimal unboxed top-left dimensional readout */}
      <div className="pointer-events-none absolute top-5 left-6 z-10">
        <div className="font-display text-sm font-semibold text-[#141517] tracking-tight">
          {spec.projectName}
        </div>
        <div className="mt-0.5 flex items-center gap-2 font-mono text-xs text-[#5A5E66] tabular-nums">
          <span>
            {formatDim(spec.widthMm, spec.unit)} W × {formatDim(spec.heightMm, spec.unit)} H ×{' '}
            {formatDim(spec.depthMm, spec.unit)} D
          </span>
          <span aria-hidden="true">·</span>
          <span>{calc.totalPanelCount} panels</span>
          <span aria-hidden="true">·</span>
          <span>
            {calc.totalSheetCount} sheet{calc.totalSheetCount !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-[11px] text-[#6B717C]">
          <span>{CABINET_STYLES[spec.cabinetStyle ?? 'modern-frameless'].shortName}</span>
          <span aria-hidden="true">·</span>
          <span>{DOOR_STYLE_DEFS[spec.doorStyle].name}</span>
          <span aria-hidden="true">·</span>
          <span>{HINGE_TYPES[spec.hingeType ?? 'concealed-110'].shortName}</span>
        </div>
      </div>

      {/* Graceful WebGL fallback overlay if context is lost */}
      {contextLost && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#F2F2EE]">
          <div className="text-center max-w-sm px-6">
            <p className="font-display text-base font-semibold text-[#141517]">
              3D Viewport Paused
            </p>
            <p className="mt-1 text-sm text-[#5A5E66]">
              Graphics context was interrupted. Switch to the 2D Blueprints tab or reload to restore the 3D view.
            </p>
          </div>
        </div>
      )}

      {/* Unified Collapsible Bottom Control Dock (Solid surface, no backdrop-filter over WebGL) */}
      <div
        className="absolute bottom-5 left-1/2 z-10 w-[min(900px,94%)] -translate-x-1/2 transition-transform duration-200 ease-out"
        style={{
          transform: dockCollapsed
            ? 'translate(-50%, calc(100% - 20px))'
            : 'translate(-50%, 0)',
        }}
      >
        {/* Collapse / Expand Tab */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setDockCollapsed((c) => !c)}
            className="inline-flex items-center gap-1.5 rounded-t-lg border border-b-0 border-[#DCDFE4] bg-[#FFFFFF] px-3 py-1 text-xs font-medium text-[#4A4F58] hover:text-[#141517] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            title="Toggle 3D Controls (H)"
          >
            {dockCollapsed ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" />
                <span>Show 3D Controls</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" />
                <span>Hide Controls</span>
              </>
            )}
          </button>
        </div>

        {/* Main Horizontal Control Dock */}
        <div className="rounded-xl border border-[#DCDFE4] bg-[#FFFFFF] px-4 py-3 shadow-[0_6px_24px_rgba(20,21,23,0.08)]">
          <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-3">
            {/* Exploded View Slider */}
            <div className="flex items-center gap-2.5 min-w-[165px]">
              <Layers className="w-4 h-4 text-[#5A5E66] shrink-0" />
              <div className="flex flex-col flex-1">
                <div className="flex items-center justify-between text-[11px] font-medium text-[#4A4F58]">
                  <span>Exploded</span>
                  <span className="font-mono tabular-nums text-[#141517]">
                    {Math.round(exploded * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={exploded}
                  onChange={(e) => setExploded(parseFloat(e.target.value))}
                  aria-label="Exploded view separation"
                  className="studio-slider mt-1 w-28"
                />
              </div>
            </div>

            <div className="hidden sm:block h-7 w-px bg-[#E6E8EC]" />

            {/* Open Doors / Drawers Slider */}
            <div className="flex items-center gap-2.5 min-w-[165px]">
              <DoorOpen className="w-4 h-4 text-[#5A5E66] shrink-0" />
              <div className="flex flex-col flex-1">
                <div className="flex items-center justify-between text-[11px] font-medium text-[#4A4F58]">
                  <span>Open Fronts</span>
                  <span className="font-mono tabular-nums text-[#141517]">
                    {Math.round(openAmount * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={openAmount}
                  onChange={(e) => setOpenAmount(parseFloat(e.target.value))}
                  aria-label="Open doors and drawers"
                  className="studio-slider mt-1 w-28"
                />
              </div>
            </div>

            <div className="hidden md:block h-7 w-px bg-[#E6E8EC]" />

            {/* Camera Presets Segmented Control */}
            <div className="flex items-center gap-1 rounded-lg bg-[#F3F4F6] p-1">
              {CAMERA_PRESETS.map((preset) => {
                const isActive = activePreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleCameraPreset(preset.id)}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      isActive
                        ? 'bg-[#FFFFFF] text-[#141517] shadow-xs'
                        : 'text-[#5A5E66] hover:text-[#141517]'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>

            {/* X-Ray Fronts Toggle */}
            <button
              type="button"
              onClick={() => setXrayFronts((x) => !x)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                xrayFronts
                  ? 'border-[#1D4ED8] bg-[#1D4ED8]/8 text-[#1D4ED8]'
                  : 'border-[#DCDFE4] bg-[#FFFFFF] text-[#4A4F58] hover:border-[#B6BCC6] hover:text-[#141517]'
              }`}
              title="Make door fronts semi-transparent to inspect shelving and drawer boxes"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>X-Ray</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
