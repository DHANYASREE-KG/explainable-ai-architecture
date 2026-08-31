import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  LandDetails,
  FacingDirection,
  BasicRequirementsConfig,
  RoomRequirement,
  ScaleSize,
  LayoutData,
  AISuggestion,
} from './types';
import { runFullValidation } from './services/validationEngine';
import { generateSmartSuggestions } from './services/suggestionEngine';
import { expandRequirementsToSpaces } from './services/requirementExpander';
import { calculateRoomArea } from './services/areaCalculator';
import { Sidebar, NavTabId } from './components/Navigation/Sidebar';
import { StepLandDetails } from './components/StepLandDetails';
import { StepFacingDirection } from './components/StepFacingDirection';
import { StepHousingRequirements } from './components/StepHousingRequirements';
import { StepRoomDimensions } from './components/StepRoomDimensions';
import { StepAISuggestions } from './components/StepAISuggestions';
import { Blueprint2DCanvas } from './components/Blueprint2D/Blueprint2DCanvas';
import { House3DCanvas } from './components/House3D/House3DCanvas';
import { CostEstimationView } from './components/CostEstimation/CostEstimationView';
import { GenerationLoadingModal } from './components/Workflow/GenerationLoadingModal';
import { Menu } from 'lucide-react';

const INITIAL_LAND: LandDetails = {
  length: 30,
  breadth: 40,
  totalArea: 1200,
  plotType: 'rectangle',
};

const INITIAL_CONFIG: BasicRequirementsConfig = {
  halls: 1,
  diningRooms: 1,
  bedrooms: 2,
  kitchens: 1,
  bathrooms: 1,
  attachedBathrooms: 1,
  hasStaircase: false,
  hasParking: true,
  hasGarden: false,
  hasBalcony: true,
  optionalRooms: {
    studyRoom: false,
    prayerRoom: true,
    guestRoom: false,
    storeRoom: false,
    homeOffice: false,
    utilityRoom: true,
    laundryRoom: false,
  },
};

export function App() {
  const [activeStep, setActiveStep] = useState<NavTabId>('plot');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [projectName, setProjectName] = useState<string>('Urban Residence Blueprint');
  const [loadingPhase, setLoadingPhase] = useState<'idle' | '2d' | '3d'>('idle');

  // Architectural Input State
  const [land, setLand] = useState<LandDetails>(INITIAL_LAND);
  const [facingDirection, setFacingDirection] = useState<FacingDirection>('North');
  const [scaleSize, setScaleSize] = useState<ScaleSize>('standard');
  const [config, setConfig] = useState<BasicRequirementsConfig>(INITIAL_CONFIG);
  const [rooms, setRooms] = useState<RoomRequirement[]>(() =>
    expandRequirementsToSpaces(INITIAL_CONFIG, [])
  );

  // AI Optimization state
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [appliedSuggestions, setAppliedSuggestions] = useState<AISuggestion[]>([]);
  const [validationVersion, setValidationVersion] = useState<number>(1);

  // Readiness flags
  const [has2D, setHas2D] = useState<boolean>(false);
  const [has3D, setHas3D] = useState<boolean>(false);

  // Full Validation Engine Result
  const { validationResult, layoutData: validationLayoutData } = useMemo(() => {
    return runFullValidation(land, facingDirection, rooms);
  }, [land, facingDirection, rooms]);

  const isValid = validationResult.isValid;

  // Progress logic
  const completedSteps = useMemo(() => {
    return {
      plot: land.totalArea > 0,
      orientation: !!facingDirection,
      program: rooms.length > 0,
      dimensions: rooms.every(r => r.length > 0 && r.breadth > 0),
      ai: (isValid && land.totalArea > 0) || appliedSuggestions.length > 0,
      '2d': has2D,
      '3d': has3D,
      cost: has3D || has2D,
    };
  }, [land, facingDirection, rooms, isValid, appliedSuggestions, has2D, has3D]);

  const unlockedSteps = useMemo(() => {
    return {
      plot: true,
      orientation: completedSteps.plot,
      program: completedSteps.plot && completedSteps.orientation,
      dimensions: completedSteps.plot && completedSteps.orientation && completedSteps.program,
      ai: completedSteps.plot && completedSteps.orientation && completedSteps.program && completedSteps.dimensions,
      '2d': completedSteps.ai && (isValid || suggestions.length === 0), 
      '3d': completedSteps['2d'],
      cost: completedSteps['3d'] || completedSteps['2d'],
    };
  }, [completedSteps, isValid, suggestions]);

  // Layout Data snapshot
  const layoutData: LayoutData = useMemo(() => {
    return {
      ...validationLayoutData,
      appliedSuggestions,
      createdAt: new Date().toISOString(),
    };
  }, [validationLayoutData, appliedSuggestions]);

  // Scroll to top on step change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeStep]);

  // Handlers
  const handleLandChange = useCallback((newLand: LandDetails) => {
    setLand(newLand);
    setSuggestions([]);
    setHas2D(false);
    setHas3D(false);
  }, []);

  const handleSelectFacingDirection = useCallback((dir: FacingDirection) => {
    setFacingDirection(dir);
    setHas2D(false);
    setHas3D(false);
  }, []);

  const handleConfigChange = useCallback((newConfig: BasicRequirementsConfig) => {
    setConfig(newConfig);
    const generated = expandRequirementsToSpaces(newConfig, rooms);
    setRooms(generated);
    setSuggestions([]);
    setHas2D(false);
    setHas3D(false);
  }, [rooms]);

  const handleRoomDimensionChange = useCallback((id: string, length: number, breadth: number) => {
    setRooms((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              length,
              breadth,
              area: calculateRoomArea(length, breadth),
            }
          : r
      )
    );
    setSuggestions([]);
    setHas2D(false);
    setHas3D(false);
  }, []);

  const handleRenameRoom = useCallback((id: string, newName: string) => {
    setRooms((prev) =>
      prev.map((r) => (r.id === id ? { ...r, name: newName } : r))
    );
  }, []);

  const handleApplyPreset = useCallback((preset: ScaleSize) => {
    setScaleSize(preset);
    const standardScales: Record<ScaleSize, { len: number; br: number }> = {
      compact: { len: 10, br: 10 },
      standard: { len: 12, br: 14 },
      spacious: { len: 15, br: 16 },
    };
    const target = standardScales[preset];
    setRooms((prev) =>
      prev.map((r) => {
        const factor = r.isAttachedBath ? 0.5 : r.isBalcony ? 0.6 : 1;
        const l = Math.round(target.len * factor);
        const b = Math.round(target.br * factor);
        return {
          ...r,
          length: l,
          breadth: b,
          area: calculateRoomArea(l, b),
        };
      })
    );
    setSuggestions([]);
    setHas2D(false);
    setHas3D(false);
  }, []);

  const handleValidateAndContinue = useCallback(() => {
    const currentVal = runFullValidation(land, facingDirection, rooms);
    const newVer = validationVersion + 1;
    setValidationVersion(newVer);

    const requiredArea = currentVal.validationResult.metrics.finalRequiredArea;
    const availableArea = land.totalArea;
    const excessArea = currentVal.validationResult.metrics.excessArea;
    const designFits = (excessArea === 0 && requiredArea <= availableArea) || currentVal.validationResult.overallValid;

    if (designFits && land.totalArea > 0) {
      setSuggestions([]);
      setActiveStep('2d');
    } else {
      const sug = generateSmartSuggestions(
        land,
        rooms,
        currentVal.validationResult.metrics,
        currentVal.validationResult,
        newVer
      );
      setSuggestions(sug);
      setActiveStep('ai');
    }
  }, [land, facingDirection, rooms, validationVersion]);

  const handleAcceptSuggestion = useCallback((suggestionId: string) => {
    const sug = suggestions.find((s) => s.id === suggestionId);
    if (!sug) return;

    setAppliedSuggestions((prev) => [...prev.filter((p) => p.roomId !== sug.roomId), sug]);

    const updatedRooms = rooms.map((r) =>
      r.id === sug.roomId
        ? {
            ...r,
            length: sug.suggestedLength,
            breadth: sug.suggestedBreadth,
            area: calculateRoomArea(sug.suggestedLength, sug.suggestedBreadth),
          }
        : r
    );

    setRooms(updatedRooms);

    const newValidation = runFullValidation(land, facingDirection, updatedRooms);
    const newVer = validationVersion + 1;
    setValidationVersion(newVer);

    const requiredArea = newValidation.validationResult.metrics.finalRequiredArea;
    const availableArea = land.totalArea;
    const excessArea = newValidation.validationResult.metrics.excessArea;
    const nowFits = (excessArea === 0 && requiredArea <= availableArea) || newValidation.validationResult.overallValid;

    if (nowFits && land.totalArea > 0) {
      setSuggestions([]);
    } else {
      const freshSug = generateSmartSuggestions(
        land,
        updatedRooms,
        newValidation.validationResult.metrics,
        newValidation.validationResult,
        newVer
      );
      setSuggestions(freshSug);
    }
  }, [suggestions, rooms, land, facingDirection, validationVersion]);

  const handleAcceptAllSuggestions = useCallback(() => {
    const pending = suggestions.filter((s) => s.status === 'pending');
    if (pending.length === 0) return;

    const sugMap = new Map<string, AISuggestion>(pending.map((s) => [s.roomId, s]));
    setAppliedSuggestions((prev) => [...prev.filter((p) => !sugMap.has(p.roomId)), ...pending]);

    const updatedRooms = rooms.map((r) => {
      const sug = sugMap.get(r.id);
      if (sug) {
        return {
          ...r,
          length: sug.suggestedLength,
          breadth: sug.suggestedBreadth,
          area: calculateRoomArea(sug.suggestedLength, sug.suggestedBreadth),
        };
      }
      return r;
    });

    setRooms(updatedRooms);

    const newValidation = runFullValidation(land, facingDirection, updatedRooms);
    const newVer = validationVersion + 1;
    setValidationVersion(newVer);

    const requiredArea = newValidation.validationResult.metrics.finalRequiredArea;
    const availableArea = land.totalArea;
    const excessArea = newValidation.validationResult.metrics.excessArea;
    const nowFits = (excessArea === 0 && requiredArea <= availableArea) || newValidation.validationResult.overallValid;

    if (nowFits && land.totalArea > 0) {
      setSuggestions([]);
    } else {
      const freshSug = generateSmartSuggestions(
        land,
        updatedRooms,
        newValidation.validationResult.metrics,
        newValidation.validationResult,
        newVer
      );
      setSuggestions(freshSug);
    }
  }, [suggestions, rooms, land, facingDirection, validationVersion]);

  const handleRejectSuggestion = useCallback((suggestionId: string) => {
    setSuggestions((prev) =>
      prev.map((s) => (s.id === suggestionId ? { ...s, status: 'rejected' } : s))
    );
  }, []);

  const handleReset = useCallback(() => {
    setLand(INITIAL_LAND);
    setFacingDirection('North');
    setScaleSize('standard');
    setConfig(INITIAL_CONFIG);
    setRooms(expandRequirementsToSpaces(INITIAL_CONFIG, []));
    setSuggestions([]);
    setAppliedSuggestions([]);
    setValidationVersion(1);
    setActiveStep('plot');
    setHas2D(false);
    setHas3D(false);
    setProjectName('Urban Residence Blueprint');
  }, []);

  const handleGenerate2D = useCallback(() => {
    setHas2D(true);
    setActiveStep('2d');
  }, []);

  const handleGenerate3D = useCallback(() => {
    setHas3D(true);
    setActiveStep('3d');
  }, []);

  const getStepTitle = () => {
    switch (activeStep) {
      case 'plot': return 'Plot Dimensions';
      case 'orientation': return 'Orientation';
      case 'program': return 'Space Programming';
      case 'dimensions': return 'Room Dimensions';
      case 'ai': return 'AI Optimization';
      case '2d': return '2D Architectural Blueprint';
      case '3d': return '3D Blueprint';
      default: return '';
    }
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-[#0F172A] font-sans antialiased overflow-hidden selection:bg-[#0F2747] selection:text-[#FFFFFF]">
      
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeStep}
        onSelectTab={setActiveStep}
        completedSteps={completedSteps}
        unlockedSteps={unlockedSteps}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        onStartNewProject={handleReset}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        
        {/* Global Header */}
        <header className="h-16 bg-[#FFFFFF] border-b border-[#E2E8F0] flex items-center justify-between px-4 lg:px-8 shrink-0 z-10 shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-2 text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] rounded transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-base font-semibold text-[#0F172A] tracking-tight">{getStepTitle()}</h1>
          </div>
        </header>

        {/* Dynamic Workspace Container */}
        <main className="flex-1 overflow-y-auto relative bg-[#F8FAFC] p-4 lg:p-8">
          
          <div className="w-full h-full">
            {/* 1. PLOT DIMENSIONS */}
            {activeStep === 'plot' && (
              <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-right-4 duration-200">
                <StepLandDetails
                  land={land}
                  onChangeLand={handleLandChange}
                  onNext={() => setActiveStep('orientation')}
                  facingDirection={facingDirection}
                />
              </div>
            )}

            {/* 2. ORIENTATION */}
            {activeStep === 'orientation' && (
              <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-right-4 duration-200">
                <StepFacingDirection
                  facingDirection={facingDirection}
                  onChangeFacingDirection={handleSelectFacingDirection}
                  onNext={() => setActiveStep('program')}
                  onBack={() => setActiveStep('plot')}
                />
              </div>
            )}

            {/* 3. SPACE PROGRAMMING */}
            {activeStep === 'program' && (
              <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-right-4 duration-200">
                <StepHousingRequirements
                  config={config}
                  onChangeConfig={handleConfigChange}
                  onNext={() => setActiveStep('dimensions')}
                  onBack={() => setActiveStep('orientation')}
                />
              </div>
            )}

            {/* 4. ROOM DIMENSIONS */}
            {activeStep === 'dimensions' && (
              <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-right-4 duration-200">
                <StepRoomDimensions
                  land={land}
                  facingDirection={facingDirection}
                  rooms={rooms}
                  scaleSize={scaleSize}
                  isValid={isValid && land.totalArea > 0}
                  validationResult={validationResult}
                  onChangeRoomDimension={handleRoomDimensionChange}
                  onRenameRoom={handleRenameRoom}
                  onApplyPreset={handleApplyPreset}
                  onValidateAndContinue={handleValidateAndContinue}
                  onGenerate2D={handleGenerate2D}
                  onBack={() => setActiveStep('program')}
                />
              </div>
            )}

            {/* 5. AI OPTIMIZATION */}
            {activeStep === 'ai' && (
              <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-right-4 duration-200">
                <StepAISuggestions
                  land={land}
                  metrics={validationResult.metrics}
                  validationResult={validationResult}
                  suggestions={suggestions}
                  onAcceptSuggestion={handleAcceptSuggestion}
                  onAcceptAllSuggestions={handleAcceptAllSuggestions}
                  onRejectSuggestion={handleRejectSuggestion}
                  onRevalidate={handleValidateAndContinue}
                  onGenerate2D={handleGenerate2D}
                  isValid={isValid && land.totalArea > 0}
                />
              </div>
            )}

            {/* 6. 2D BLUEPRINT */}
            {activeStep === '2d' && (
              <div className="w-full max-w-[1600px] mx-auto animate-in fade-in slide-in-from-right-4 duration-200">
                <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm p-4 lg:p-6">
                  <Blueprint2DCanvas
                    layoutData={layoutData}
                    has3D={has3D}
                    onGenerate3D={handleGenerate3D}
                    onSwitchView={(view) => {
                      if (view === '3d') handleGenerate3D();
                    }}
                  />
                </div>
              </div>
            )}

            {/* 7. 3D BLUEPRINT */}
            {activeStep === '3d' && (
              <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-right-4 duration-200">
                <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm p-4 lg:p-6">
                  <House3DCanvas
                    layoutData={layoutData}
                    onBackTo2D={() => setActiveStep('2d')}
                    onProceedToCost={() => setActiveStep('cost')}
                    onSwitchView={(view) => {
                      if (view === '2d') setActiveStep('2d');
                    }}
                  />
                </div>
              </div>
            )}

            {/* 8. AI CONSTRUCTION COST ESTIMATION */}
            {activeStep === 'cost' && (
              <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-right-4 duration-200">
                <CostEstimationView
                  layoutData={layoutData}
                  onBackTo3D={() => setActiveStep('3d')}
                  onBackTo2D={() => setActiveStep('2d')}
                />
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Generation Loading Modal */}
      <GenerationLoadingModal
        isOpen={loadingPhase !== 'idle'}
        targetMode={loadingPhase === '3d' ? '3d' : '2d'}
        onComplete={() => setLoadingPhase('idle')}
      />
    </div>
  );
}

export default App;
