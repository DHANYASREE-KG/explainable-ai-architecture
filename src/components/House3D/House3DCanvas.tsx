import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { LayoutData, RoomPlacement } from '../../types';
import { buildHouse3DScene, WallCollisionSegment } from './3dGeometryBuilder';
import {
  Footprints,
  Compass,
  X,
  RotateCcw,
  Maximize2,
  Eye,
  Sun,
  Sunset,
  Moon,
  Layers,
  Camera,
  Home,
  Box,
  Map,
  ZoomIn,
  ZoomOut,
  Download,
  ArrowLeft,
  ArrowRight,
  Grid3X3,
  Calculator,
} from 'lucide-react';

interface House3DCanvasProps {
  layoutData: LayoutData;
  onBackTo2D?: () => void;
  onProceedToCost?: () => void;
  onSwitchView?: (view: '2d' | '3d') => void;
}

export type LightingMode = 'daylight' | 'golden' | 'evening';
export type CameraPreset = 'front' | 'iso' | 'top' | 'reset' | 'custom' | 'front-right' | 'front-left' | 'rear' | 'side' | 'living' | 'kitchen' | 'bedroom' | 'staircase';

export const House3DCanvas: React.FC<House3DCanvasProps> = ({
  layoutData,
  onBackTo2D,
  onProceedToCost,
  onSwitchView,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  // Viewport states
  const [isWalkthrough, setIsWalkthrough] = useState<boolean>(false);
  const [showRoof, setShowRoof] = useState<boolean>(true);
  const [lightingMode, setLightingMode] = useState<LightingMode>('daylight');
  const [activePreset, setActivePreset] = useState<CameraPreset>('front');
  const [currentLocationName, setCurrentLocationName] = useState<string>('Main Entrance Porch');
  const [hoveredRoom, setHoveredRoom] = useState<RoomPlacement | null>(null);

  // Three.js References
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const roofGroupRef = useRef<THREE.Group | null>(null);
  const dirLightRef = useRef<THREE.DirectionalLight | null>(null);
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);
  const hemiLightRef = useRef<THREE.HemisphereLight | null>(null);

  const buildingCenterRef = useRef<{ x: number; y: number; z: number; span: number }>({
    x: 0,
    y: 4.5,
    z: 0,
    span: 20,
  });

  // FPS Walkthrough movement state
  const walkStateRef = useRef({
    posX: 0,
    posY: 5.2, // Standard eye-level height in feet
    posZ: 0,
    rotY: 0,
    rotX: 0,
    keys: { w: false, a: false, s: false, d: false, space: false, shift: false },
    isDragging: false,
    prevMouseX: 0,
    prevMouseY: 0,
  });

  const mergedWallsRef = useRef<WallCollisionSegment[]>([]);

  const landW = layoutData.land.length;
  const landH = layoutData.land.breadth;
  const wallHeight = 9.5;

  // Initialize and update 3D Scene
  useEffect(() => {
    if (!mountRef.current) return;

    const container = mountRef.current;
    const width = container.clientWidth || 800;
    const height = 580;

    // 1. Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Set background color based on initial lighting mode
    const bgColors: Record<LightingMode, string> = {
      daylight: '#F0F9FF',
      golden: '#FEF3C7',
      evening: '#090D16',
    };
    scene.background = new THREE.Color(bgColors[lightingMode]);

    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    cameraRef.current = camera;

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    container.appendChild(renderer.domElement);

    // 4. Orbit Controls for non-walkthrough mode
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;
    controls.zoomSpeed = 1.2;
    controls.enableRotate = true;
    controls.rotateSpeed = 0.9;
    controls.enablePan = true;
    controls.panSpeed = 0.9;
    controls.screenSpacePanning = true;
    controls.maxPolarAngle = Math.PI / 2 - 0.01;
    controlsRef.current = controls;

    // 5. Lighting Setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);
    ambientLightRef.current = ambientLight;

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.3);
    dirLight.position.set(landW * 1.2, landW * 1.6, landH * 1.2);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 500;
    const d = Math.max(landW, landH) * 1.5;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    dirLight.shadow.bias = -0.0001;
    scene.add(dirLight);
    dirLightRef.current = dirLight;

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xe2e8f0, 0.6);
    scene.add(hemiLight);
    hemiLightRef.current = hemiLight;

    // 6. Build 3D House Scene strictly from 2D Layout Data
    const { houseGroup, roofGroup, roomMeshes, buildingBounds, mergedWalls, entrance3DPos } = buildHouse3DScene(
      scene,
      layoutData,
      { isWalkthrough, lightingPreset: lightingMode }
    );
    scene.add(houseGroup);
    scene.add(roofGroup);
    roofGroupRef.current = roofGroup;
    roofGroup.visible = showRoof;
    mergedWallsRef.current = mergedWalls;

    // Auto-focus calculations based on exact building bounds
    const bCenterX = (buildingBounds.minX + buildingBounds.maxX) / 2;
    const bCenterZ = (buildingBounds.minZ + buildingBounds.maxZ) / 2;
    const bWidth = buildingBounds.maxX - buildingBounds.minX;
    const bDepth = buildingBounds.maxZ - buildingBounds.minZ;
    const bSpan = Math.max(Math.sqrt(bWidth * bWidth + bDepth * bDepth), 15);
    const cameraDist = bSpan * 1.45;

    buildingCenterRef.current = {
      x: bCenterX,
      y: wallHeight / 2,
      z: bCenterZ,
      span: bSpan,
    };

    controls.target.set(bCenterX, wallHeight / 2, bCenterZ);
    controls.minDistance = 2.0;
    controls.maxDistance = bSpan * 4.0;

    // Position camera facing front façade based on facing direction
    switch (layoutData.facingDirection) {
      case 'North':
        camera.position.set(bCenterX, cameraDist * 0.65, bCenterZ - cameraDist);
        break;
      case 'South':
        camera.position.set(bCenterX, cameraDist * 0.65, bCenterZ + cameraDist);
        break;
      case 'East':
        camera.position.set(bCenterX + cameraDist, cameraDist * 0.65, bCenterZ);
        break;
      case 'West':
        camera.position.set(bCenterX - cameraDist, cameraDist * 0.65, bCenterZ);
        break;
      default:
        camera.position.set(bCenterX + cameraDist * 0.7, cameraDist * 0.7, bCenterZ + cameraDist * 0.7);
    }
    camera.lookAt(bCenterX, wallHeight / 2, bCenterZ);
    controls.update();

    // Initial Walkthrough starting position
    walkStateRef.current.posX = entrance3DPos.x;
    walkStateRef.current.posY = 5.2;
    walkStateRef.current.posZ = entrance3DPos.z;

    // View orientation facing inside
    if (layoutData.facingDirection === 'North') walkStateRef.current.rotY = Math.PI;
    else if (layoutData.facingDirection === 'South') walkStateRef.current.rotY = 0;
    else if (layoutData.facingDirection === 'East') walkStateRef.current.rotY = -Math.PI / 2;
    else walkStateRef.current.rotY = Math.PI / 2;

    // Apply lighting mode
    applyLighting(lightingMode, scene, ambientLight, dirLight, hemiLight);

    // 7. Responsive Container Observer
    const handleResize = () => {
      if (!container || !cameraRef.current) return;
      const w = container.clientWidth || 800;
      const h = container.clientHeight || 580;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // 8. Animation Loop
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (isWalkthrough) {
        controls.enabled = false;

        const moveSpeed = 0.28;
        const state = walkStateRef.current;

        const forwardX = Math.sin(state.rotY);
        const forwardZ = Math.cos(state.rotY);
        const rightX = Math.cos(state.rotY);
        const rightZ = -Math.sin(state.rotY);

        let deltaX = 0;
        let deltaZ = 0;

        if (state.keys.w) {
          deltaX += forwardX * moveSpeed;
          deltaZ += forwardZ * moveSpeed;
        }
        if (state.keys.s) {
          deltaX -= forwardX * moveSpeed;
          deltaZ -= forwardZ * moveSpeed;
        }
        if (state.keys.a) {
          deltaX -= rightX * moveSpeed;
          deltaZ -= rightZ * moveSpeed;
        }
        if (state.keys.d) {
          deltaX += rightX * moveSpeed;
          deltaZ += rightZ * moveSpeed;
        }
        if (state.keys.space) {
          state.posY = Math.min(wallHeight * 2.5, state.posY + moveSpeed);
        }
        if (state.keys.shift) {
          state.posY = Math.max(1.0, state.posY - moveSpeed);
        }

        // Target coordinates
        const targetX = state.posX + deltaX;
        const targetZ = state.posZ + deltaZ;

        // Wall collision check allowing passage through door cutouts
        const { finalX, finalZ } = checkWallCollision(
          state.posX,
          state.posZ,
          targetX,
          targetZ,
          state.posY,
          mergedWallsRef.current
        );

        // Keep inside plot boundary
        state.posX = Math.max(-landW / 2 + 1, Math.min(landW / 2 - 1, finalX));
        state.posZ = Math.max(-landH / 2 + 1, Math.min(landH / 2 - 1, finalZ));

        camera.position.set(state.posX, state.posY, state.posZ);

        // Look Target
        const lookTargetX = state.posX + Math.sin(state.rotY) * Math.cos(state.rotX);
        const lookTargetY = state.posY + Math.sin(state.rotX);
        const lookTargetZ = state.posZ + Math.cos(state.rotY) * Math.cos(state.rotX);
        camera.lookAt(lookTargetX, lookTargetY, lookTargetZ);

        // Room location detection
        const currentXFeet = state.posX + landW / 2;
        const currentYFeet = state.posZ + landH / 2;

        const roomMatch = layoutData.rooms.find(
          (r) =>
            currentXFeet >= r.x &&
            currentXFeet <= r.x + r.width &&
            currentYFeet >= r.y &&
            currentYFeet <= r.y + r.height
        );

        if (roomMatch) {
          setCurrentLocationName(roomMatch.name);
        } else {
          setCurrentLocationName('Courtyard / Main Entrance');
        }
      } else {
        controls.enabled = true;
        controls.update();
      }

      renderer.render(scene, camera);
    };

    animate();

    // 9. Controls & Events
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isWalkthrough) return;
      const key = e.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
        if (key === 'w' || key === 'arrowup') walkStateRef.current.keys.w = true;
        if (key === 's' || key === 'arrowdown') walkStateRef.current.keys.s = true;
        if (key === 'a' || key === 'arrowleft') walkStateRef.current.keys.a = true;
        if (key === 'd' || key === 'arrowright') walkStateRef.current.keys.d = true;
      } else if (e.code === 'Space') {
        walkStateRef.current.keys.space = true;
        e.preventDefault();
      } else if (key === 'shift') {
        walkStateRef.current.keys.shift = true;
      } else if (key === 'escape') {
        setIsWalkthrough(false);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!isWalkthrough) return;
      const key = e.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
        if (key === 'w' || key === 'arrowup') walkStateRef.current.keys.w = false;
        if (key === 's' || key === 'arrowdown') walkStateRef.current.keys.s = false;
        if (key === 'a' || key === 'arrowleft') walkStateRef.current.keys.a = false;
        if (key === 'd' || key === 'arrowright') walkStateRef.current.keys.d = false;
      } else if (e.code === 'Space') {
        walkStateRef.current.keys.space = false;
      } else if (key === 'shift') {
        walkStateRef.current.keys.shift = false;
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (isWalkthrough) {
        walkStateRef.current.isDragging = true;
        walkStateRef.current.prevMouseX = e.clientX;
        walkStateRef.current.prevMouseY = e.clientY;
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isWalkthrough && walkStateRef.current.isDragging) {
        const deltaX = e.clientX - walkStateRef.current.prevMouseX;
        const deltaY = e.clientY - walkStateRef.current.prevMouseY;

        walkStateRef.current.rotY -= deltaX * 0.005;
        walkStateRef.current.rotX = Math.max(
          -Math.PI / 3,
          Math.min(Math.PI / 3, walkStateRef.current.rotX - deltaY * 0.005)
        );

        walkStateRef.current.prevMouseX = e.clientX;
        walkStateRef.current.prevMouseY = e.clientY;
      }
    };

    const handleMouseUp = () => {
      if (isWalkthrough) {
        walkStateRef.current.isDragging = false;
      }
    };

    // Pointer hover room detection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerMove = (event: MouseEvent) => {
      if (isWalkthrough) return;
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(roomMeshes, true);

      if (intersects.length > 0 && intersects[0].object.userData?.roomData) {
        const room: RoomPlacement = intersects[0].object.userData.roomData;
        setHoveredRoom(room);
      } else {
        setHoveredRoom(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    renderer.domElement.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    renderer.domElement.addEventListener('pointermove', handlePointerMove);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      renderer.domElement.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      renderer.domElement.removeEventListener('pointermove', handlePointerMove);

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [layoutData, isWalkthrough]);

  // Lighting Mode Switcher
  const handleLightingChange = (mode: LightingMode) => {
    setLightingMode(mode);
    if (!sceneRef.current || !ambientLightRef.current || !dirLightRef.current || !hemiLightRef.current) return;
    applyLighting(mode, sceneRef.current, ambientLightRef.current, dirLightRef.current, hemiLightRef.current);
  };

  const applyLighting = (
    mode: LightingMode,
    scene: THREE.Scene,
    ambientLight: THREE.AmbientLight,
    dirLight: THREE.DirectionalLight,
    hemiLight: THREE.HemisphereLight
  ) => {
    if (mode === 'daylight') {
      scene.background = new THREE.Color('#F0F9FF');
      ambientLight.color.set('#FFFFFF');
      ambientLight.intensity = 0.9;
      dirLight.color.set('#FFFFFF');
      dirLight.intensity = 1.35;
      hemiLight.color.set('#FFFFFF');
      hemiLight.groundColor.set('#E2E8F0');
      hemiLight.intensity = 0.6;
    } else if (mode === 'golden') {
      scene.background = new THREE.Color('#FEF3C7');
      ambientLight.color.set('#FED7AA');
      ambientLight.intensity = 0.75;
      dirLight.color.set('#F59E0B');
      dirLight.intensity = 1.6;
      hemiLight.color.set('#FDE68A');
      hemiLight.groundColor.set('#78350F');
      hemiLight.intensity = 0.5;
    } else if (mode === 'evening') {
      scene.background = new THREE.Color('#0B132B');
      ambientLight.color.set('#1E293B');
      ambientLight.intensity = 0.35;
      dirLight.color.set('#60A5FA');
      dirLight.intensity = 0.5;
      hemiLight.color.set('#1E3A8A');
      hemiLight.groundColor.set('#020617');
      hemiLight.intensity = 0.3;
    }
  };

  // View Preset Handler
  const setCameraView = (view: CameraPreset) => {
    if (!cameraRef.current || !controlsRef.current) return;
    setIsWalkthrough(false);
    setActivePreset(view);

    const camera = cameraRef.current;
    const controls = controlsRef.current;
    const c = buildingCenterRef.current;
    const cameraDist = c.span * 1.5;

    controls.target.set(c.x, c.y, c.z);

    switch (view) {
      case 'front':
        if (layoutData.facingDirection === 'North') camera.position.set(c.x, cameraDist * 0.4, c.z - cameraDist * 0.9);
        else if (layoutData.facingDirection === 'South') camera.position.set(c.x, cameraDist * 0.4, c.z + cameraDist * 0.9);
        else if (layoutData.facingDirection === 'East') camera.position.set(c.x + cameraDist * 0.9, cameraDist * 0.4, c.z);
        else camera.position.set(c.x - cameraDist * 0.9, cameraDist * 0.4, c.z);
        break;
      case 'front-right':
        if (layoutData.facingDirection === 'North') camera.position.set(c.x - cameraDist * 0.7, cameraDist * 0.5, c.z - cameraDist * 0.8);
        else if (layoutData.facingDirection === 'South') camera.position.set(c.x + cameraDist * 0.7, cameraDist * 0.5, c.z + cameraDist * 0.8);
        else if (layoutData.facingDirection === 'East') camera.position.set(c.x + cameraDist * 0.8, cameraDist * 0.5, c.z + cameraDist * 0.7);
        else camera.position.set(c.x - cameraDist * 0.8, cameraDist * 0.5, c.z - cameraDist * 0.7);
        break;
      case 'front-left':
        if (layoutData.facingDirection === 'North') camera.position.set(c.x + cameraDist * 0.7, cameraDist * 0.5, c.z - cameraDist * 0.8);
        else if (layoutData.facingDirection === 'South') camera.position.set(c.x - cameraDist * 0.7, cameraDist * 0.5, c.z + cameraDist * 0.8);
        else if (layoutData.facingDirection === 'East') camera.position.set(c.x + cameraDist * 0.8, cameraDist * 0.5, c.z - cameraDist * 0.7);
        else camera.position.set(c.x - cameraDist * 0.8, cameraDist * 0.5, c.z + cameraDist * 0.7);
        break;
      case 'rear':
        if (layoutData.facingDirection === 'North') camera.position.set(c.x, cameraDist * 0.4, c.z + cameraDist * 0.9);
        else if (layoutData.facingDirection === 'South') camera.position.set(c.x, cameraDist * 0.4, c.z - cameraDist * 0.9);
        else if (layoutData.facingDirection === 'East') camera.position.set(c.x - cameraDist * 0.9, cameraDist * 0.4, c.z);
        else camera.position.set(c.x + cameraDist * 0.9, cameraDist * 0.4, c.z);
        break;
      case 'side':
        if (layoutData.facingDirection === 'North') camera.position.set(c.x - cameraDist * 0.9, cameraDist * 0.4, c.z);
        else if (layoutData.facingDirection === 'South') camera.position.set(c.x + cameraDist * 0.9, cameraDist * 0.4, c.z);
        else if (layoutData.facingDirection === 'East') camera.position.set(c.x, cameraDist * 0.4, c.z - cameraDist * 0.9);
        else camera.position.set(c.x, cameraDist * 0.4, c.z + cameraDist * 0.9);
        break;
      case 'reset':
        if (layoutData.facingDirection === 'North') camera.position.set(c.x, cameraDist * 0.65, c.z - cameraDist);
        else if (layoutData.facingDirection === 'South') camera.position.set(c.x, cameraDist * 0.65, c.z + cameraDist);
        else if (layoutData.facingDirection === 'East') camera.position.set(c.x + cameraDist, cameraDist * 0.65, c.z);
        else camera.position.set(c.x - cameraDist, cameraDist * 0.65, c.z);
        break;
      case 'top':
        camera.position.set(c.x, cameraDist * 1.9, c.z + 0.01);
        break;
      case 'iso':
        camera.position.set(c.x + cameraDist * 0.85, cameraDist * 0.85, c.z + cameraDist * 0.85);
        break;
      case 'living':
      case 'kitchen':
      case 'bedroom':
      case 'staircase':
        // Find the room center
        const room = layoutData.layout?.find(r => r.name.toLowerCase().includes(view));
        if (room) {
           const rx = room.x + room.width / 2 - layoutData.land.length / 2;
           const rz = room.y + room.height / 2 - layoutData.land.breadth / 2;
           
           // If we're entering a room, hide the roof for visibility
           if (showRoof) {
             toggleRoof();
           }
           
           // Position camera slightly offset from room center to see the room
           camera.position.set(rx + room.width * 0.3, 5, rz + room.height * 0.3);
           controls.target.set(rx, 3, rz);
        } else {
           // Fallback if room not found
           setCameraView('iso');
           return;
        }
        break;
    }

    camera.lookAt(c.x, c.y, c.z);
    controls.update();
  };

  // Zoom Handler
  const zoomCamera = (factor: number) => {
    if (!cameraRef.current || !controlsRef.current) return;
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    const target = controls.target;
    
    camera.position.x = target.x + (camera.position.x - target.x) * factor;
    camera.position.y = target.y + (camera.position.y - target.y) * factor;
    camera.position.z = target.z + (camera.position.z - target.z) * factor;
    controls.update();
  };

  // Capture High-Res 3D Render Snapshot
  const captureSnapshot = () => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;
    rendererRef.current.render(sceneRef.current, cameraRef.current);
    const dataUrl = rendererRef.current.domElement.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `3d-blueprint-${layoutData.facingDirection || 'house'}.png`;
    link.href = dataUrl;
    link.click();
  };

  // Toggle Roof / Cutaway View
  const toggleRoof = () => {
    const nextState = !showRoof;
    setShowRoof(nextState);
    if (roofGroupRef.current) {
      roofGroupRef.current.visible = nextState;
    }
  };

  // Toggle First-Person Walkthrough
  const toggleWalkthrough = () => {
    if (!isWalkthrough) {
      setIsWalkthrough(true);
    } else {
      setIsWalkthrough(false);
      setCameraView('reset');
    }
  };

  return (
    <div className="space-y-5">
      {/* 3D Model Header Card */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] flex items-center justify-center shrink-0">
            <Home className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <span className="text-[9px] font-bold uppercase tracking-widest text-[#64748B] font-mono">
                STEP 07
              </span>
              <h2 className="text-xl font-bold text-[#0F172A] font-sans">
                3D Architectural Model
              </h2>
              {/* Sibling View Switcher */}
              <div className="hidden md:inline-flex p-0.5 bg-[#F1F5F9] rounded-lg border border-[#E2E8F0] shadow-2xs">
                <button
                  type="button"
                  onClick={onBackTo2D}
                  className="px-3 py-1 rounded-md text-xs font-mono font-semibold uppercase tracking-wider flex items-center gap-1.5 text-[#64748B] hover:text-[#0F172A] hover:bg-white/80 transition-all cursor-pointer"
                >
                  <Grid3X3 className="w-3.5 h-3.5" />
                  <span>2D Blueprint</span>
                </button>
                <button
                  type="button"
                  className="px-3 py-1 rounded-md text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 bg-[#2563EB] text-white shadow-xs cursor-default"
                >
                  <Box className="w-3.5 h-3.5" />
                  <span>3D House</span>
                </button>
              </div>
            </div>
            <p className="text-xs text-[#64748B] font-sans mt-1">
              Constructed directly from 2D blueprint with realistic materials and walkthrough.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Back to 2D Button */}
          {onBackTo2D && (
            <button
              type="button"
              onClick={onBackTo2D}
              className="premium-btn-outline px-3 py-1.5 flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider"
              title="Return to 2D Blueprint"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to 2D</span>
            </button>
          )}

          {/* Lighting Mode Selector */}
          <div className="flex items-center bg-[#F8FAFC] p-1 border border-[#E2E8F0]">
            <button
              type="button"
              onClick={() => handleLightingChange('daylight')}
              className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-colors cursor-pointer font-mono ${
                lightingMode === 'daylight' ? 'bg-white text-[#0F172A] border border-[#E2E8F0]' : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
              title="Bright Daylight"
            >
              <Sun className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Day</span>
            </button>
            <button
              type="button"
              onClick={() => handleLightingChange('golden')}
              className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-colors cursor-pointer font-mono ${
                lightingMode === 'golden' ? 'bg-white text-[#0F172A] border border-[#E2E8F0]' : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
              title="Golden Hour Sunset"
            >
              <Sunset className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Sunset</span>
            </button>
            <button
              type="button"
              onClick={() => handleLightingChange('evening')}
              className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-colors cursor-pointer font-mono ${
                lightingMode === 'evening' ? 'bg-[#0F172A] text-[#F8FAFC]' : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
              title="Evening Twilight"
            >
              <Moon className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Night</span>
            </button>
          </div>

          {/* Walkthrough Button */}
          <button
            type="button"
            onClick={toggleWalkthrough}
            className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest font-mono flex items-center gap-2 transition-colors cursor-pointer border ${
              isWalkthrough
                ? 'bg-[#0F172A] text-[#F8FAFC] border-[#0F172A]'
                : 'bg-white hover:bg-[#F8FAFC] text-[#0F172A] border-[#E2E8F0]'
            }`}
          >
            <Footprints className="w-3.5 h-3.5" />
            <span>{isWalkthrough ? 'Exit Walkthrough' : 'Walkthrough'}</span>
          </button>

          {/* Snapshot Button */}
          <button
            type="button"
            onClick={captureSnapshot}
            className="premium-btn-outline px-4 py-2 flex items-center gap-2 text-[10px]"
            title="Download 3D Render Snapshot"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Snapshot</span>
          </button>
        </div>
      </div>

      {/* 3D Viewport Area */}
      <div className="bg-[#F8FAFC] border border-[#E2E8F0] overflow-hidden relative p-1">
        <div ref={mountRef} className="w-full h-[620px] bg-white cursor-grab active:cursor-grabbing touch-none" />

        {/* Floating Architectural Camera & View Toolbar */}
        <div className="absolute top-4 right-4 flex items-center gap-2 z-10 flex-wrap justify-end">
          {/* Camera Presets */}
          <div className="flex items-center bg-white/90 backdrop-blur-sm border border-[#E2E8F0] p-1 h-9">
            <select
              value={isWalkthrough ? 'custom' : activePreset}
              onChange={(e) => setCameraView(e.target.value as CameraPreset)}
              className="bg-transparent text-[9px] font-bold uppercase tracking-widest font-mono text-[#0F172A] outline-none cursor-pointer h-full px-2"
            >
              <option value="front">Front Exterior</option>
              <option value="front-right">Front-Right Perspective</option>
              <option value="front-left">Front-Left Perspective</option>
              <option value="rear">Rear Exterior</option>
              <option value="side">Side Exterior</option>
              <option value="top">Top/Roof View</option>
              <option value="iso">Isometric Axonometric</option>
              <option disabled>──────</option>
              <option value="living">Interior: Living Room</option>
              <option value="kitchen">Interior: Kitchen</option>
              <option value="bedroom">Interior: Bedroom</option>
              <option value="staircase">Interior: Staircase</option>
            </select>
          </div>

          {/* Roof / Cutaway Toggle */}
          <button
            type="button"
            onClick={toggleRoof}
            className={`px-3 py-2 text-[9px] font-bold uppercase tracking-widest font-mono backdrop-blur-sm cursor-pointer transition-colors border flex items-center gap-2 ${
              showRoof
                ? 'bg-white/90 text-[#0F172A] border-[#E2E8F0] hover:bg-white'
                : 'bg-[#0F172A] text-[#F8FAFC] border-[#0F172A]'
            }`}
            title="Toggle Exterior Roof / Cutaway Interior Floor View"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{showRoof ? 'Roof: On' : 'Cutaway: On'}</span>
          </button>

          {/* Zoom Controls */}
          <div className="flex items-center bg-white/90 backdrop-blur-sm border border-[#E2E8F0] p-1">
            <button
              type="button"
              onClick={() => zoomCamera(0.8)}
              className="p-1.5 text-[#64748B] hover:bg-[#F8FAFC] cursor-pointer transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => zoomCamera(1.25)}
              className="p-1.5 text-[#64748B] hover:bg-[#F8FAFC] cursor-pointer transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
          </div>

          {/* Reset Camera */}
          <button
            type="button"
            onClick={() => setCameraView('reset')}
            className="p-2.5 bg-white/90 hover:bg-white text-[#64748B] border border-[#E2E8F0] backdrop-blur-sm cursor-pointer flex items-center justify-center transition-colors"
            title="Reset Camera View"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Orbit Helper Overlay */}
        {!isWalkthrough && (
          <div className="absolute bottom-4 left-4 bg-white/90 text-[#0F172A] text-[9px] uppercase tracking-widest font-mono px-4 py-2 border border-[#E2E8F0] backdrop-blur-sm flex items-center gap-3">
            <Maximize2 className="w-3.5 h-3.5 text-[#64748B]" />
            <span>Left Click: Rotate • Right Click: Pan • Scroll: Zoom</span>
          </div>
        )}

        {/* Hovered Room Info Badge */}
        {!isWalkthrough && hoveredRoom && (
          <div className="absolute top-4 left-4 bg-[#0F172A] text-[#F8FAFC] px-4 py-2 backdrop-blur-sm font-mono font-bold text-[9px] uppercase tracking-widest flex items-center gap-3 pointer-events-none animate-in fade-in">
            <Eye className="w-3.5 h-3.5 text-[#F8FAFC]" />
            <span>
              <strong>{hoveredRoom.name}</strong> • {hoveredRoom.width}' × {hoveredRoom.height}' ({hoveredRoom.area} sq.ft)
            </span>
          </div>
        )}

        {/* Walkthrough Mode HUD */}
        {isWalkthrough && (
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-20">
            <div className="bg-white/95 text-[#0F172A] p-5 backdrop-blur-sm border border-[#E2E8F0] font-mono text-xs space-y-3 pointer-events-auto shadow-xl">
              <div className="flex items-center gap-3 text-[10px] uppercase tracking-widest font-bold text-[#64748B]">
                <Footprints className="w-4 h-4" />
                <span>Walkthrough Mode</span>
              </div>
              <p className="font-sans text-sm">
                Inside: <strong className="font-bold text-[#0F172A] font-sans">{currentLocationName}</strong>
              </p>
              <div className="text-[9px] uppercase tracking-widest text-[#64748B] pt-3 border-t border-[#E2E8F0] flex items-center gap-4 flex-wrap">
                <span>Move: <strong className="text-[#0F172A]">W A S D / Arrows</strong></span>
                <span>Look: <strong className="text-[#0F172A]">Drag Mouse</strong></span>
                <span>Ascend/Descend: <strong className="text-[#0F172A]">Space / Shift</strong></span>
                <span>Exit: <strong className="text-[#0F172A]">Esc</strong></span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsWalkthrough(false)}
              className="pointer-events-auto bg-[#0F172A] hover:bg-[#0F2747] text-[#F8FAFC] font-mono font-bold uppercase tracking-widest text-[9px] px-5 py-3 shadow-xl flex items-center gap-2 cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
              <span>Exit Mode</span>
            </button>
          </div>
        )}
      </div>

      {/* Bottom Navigation Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#E2E8F0]">
        {onBackTo2D && (
          <button
            type="button"
            onClick={onBackTo2D}
            className="premium-btn-outline px-6 py-2.5 flex items-center gap-2 text-xs font-mono uppercase tracking-wider w-full sm:w-auto justify-center"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to 2D Blueprint</span>
          </button>
        )}

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {onProceedToCost && (
            <button
              type="button"
              onClick={onProceedToCost}
              className="premium-btn px-6 py-2.5 flex items-center gap-2 text-xs font-mono uppercase tracking-wider w-full sm:w-auto justify-center shadow-xs"
            >
              <Calculator className="w-4 h-4" />
              <span>Proceed to AI Cost Estimation (08)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Wall collision detection algorithm preventing walking through solid walls
 * while allowing passage through door cutouts.
 */
function checkWallCollision(
  currX: number,
  currZ: number,
  targetX: number,
  targetZ: number,
  posY: number,
  walls: WallCollisionSegment[]
): { finalX: number; finalZ: number } {
  const bodyRadius = 0.8;
  let finalX = targetX;
  let finalZ = targetZ;

  for (const wall of walls) {
    if (wall.axis === 'H') {
      const wallZ = wall.fixedCoord;
      const minX = wall.start - 0.3;
      const maxX = wall.end + 0.3;

      if (Math.abs(targetZ - wallZ) < bodyRadius && targetX >= minX && targetX <= maxX) {
        const offsetAlongWall = targetX - wall.start;
        const isDoorPassage = wall.doors.some(
          (d) => offsetAlongWall >= d.offset - 0.5 && offsetAlongWall <= d.offset + d.width + 0.5 && posY <= 7.5
        );

        if (!isDoorPassage) {
          finalZ = currZ;
        }
      }
    } else {
      const wallX = wall.fixedCoord;
      const minZ = wall.start - 0.3;
      const maxZ = wall.end + 0.3;

      if (Math.abs(targetX - wallX) < bodyRadius && targetZ >= minZ && targetZ <= maxZ) {
        const offsetAlongWall = targetZ - wall.start;
        const isDoorPassage = wall.doors.some(
          (d) => offsetAlongWall >= d.offset - 0.5 && offsetAlongWall <= d.offset + d.width + 0.5 && posY <= 7.5
        );

        if (!isDoorPassage) {
          finalX = currX;
        }
      }
    }
  }

  return { finalX, finalZ };
}
