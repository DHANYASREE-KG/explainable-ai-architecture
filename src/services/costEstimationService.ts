import {
  CostEstimationRequest,
  CostEstimationResponse,
  MaterialRates,
} from '../types/costEstimation';
import { LayoutData } from '../types';
import {
  runFullCostEstimationPipeline,
  DOCUMENTED_VALIDATION_METRICS,
  HISTORICAL_YEAR_TRENDS,
  HOLDOUT_TEST_SAMPLES,
  DEFAULT_MATERIAL_RATES,
} from '../../server/costEstimationML';

/**
 * Automatically extracts the architectural model inputs from LayoutData
 * without requiring the user to re-enter existing project data.
 */
export function extractArchitecturalInputs(
  layoutData: LayoutData,
  overrides?: Partial<CostEstimationRequest>
): CostEstimationRequest {
  const plotArea = Math.round(
    layoutData.land.totalArea ||
    (layoutData.land.length * layoutData.land.breadth) ||
    1200
  );

  // Calculate actual generated building footprint / built-up area and categorize rooms
  let calculatedRoomsArea = 0;
  let bedroomCount = 0;
  let bathroomCount = 0;
  let attachedBathrooms = 0;
  let commonBathrooms = 0;
  let hallCount = 0;
  let kitchenCount = 0;
  let diningRooms = 0;
  let utilityAreas = 0;
  let parkingAreas = 0;
  let balconyAreas = 0;
  let prayerRooms = 0;

  if (layoutData.rooms && layoutData.rooms.length > 0) {
    layoutData.rooms.forEach((room) => {
      const area = room.width * room.height;
      calculatedRoomsArea += area;

      const rName = (room.name || '').toLowerCase();
      const rCategory = (room.category || '').toLowerCase();

      if (
        rName.includes('bed') ||
        rName.includes('master') ||
        rName.includes('guest') ||
        rName.includes('kid') ||
        rCategory.includes('bed')
      ) {
        bedroomCount++;
      } else if (
        rName.includes('attached') ||
        rName.includes('en-suite') ||
        rName.includes('ensuite')
      ) {
        attachedBathrooms++;
        bathroomCount++;
      } else if (
        rName.includes('bath') ||
        rName.includes('toilet') ||
        rName.includes('powder') ||
        rName.includes('wc') ||
        rName.includes('wash') ||
        rCategory.includes('bath') ||
        rCategory.includes('toilet')
      ) {
        commonBathrooms++;
        bathroomCount++;
      } else if (
        rName.includes('living') ||
        rName.includes('hall') ||
        rName.includes('family') ||
        rName.includes('drawing') ||
        rName.includes('foyer') ||
        rName.includes('lounge') ||
        rCategory.includes('living')
      ) {
        hallCount++;
      } else if (
        rName.includes('kitchen') ||
        rName.includes('pantry') ||
        rName.includes('cook') ||
        rCategory.includes('kitchen')
      ) {
        kitchenCount++;
      } else if (rName.includes('dining')) {
        diningRooms++;
      } else if (
        rName.includes('utility') ||
        rName.includes('store') ||
        rName.includes('laundry') ||
        rName.includes('wash area')
      ) {
        utilityAreas++;
      } else if (
        rName.includes('parking') ||
        rName.includes('garage') ||
        rName.includes('car porch') ||
        rName.includes('porch')
      ) {
        parkingAreas++;
      } else if (
        rName.includes('balcony') ||
        rName.includes('terrace') ||
        rName.includes('deck') ||
        rName.includes('sitout')
      ) {
        balconyAreas++;
      } else if (
        rName.includes('pooja') ||
        rName.includes('prayer') ||
        rName.includes('mandir')
      ) {
        prayerRooms++;
      }
    });
  }

  // Fallback defaults if counts are 0
  bedroomCount = Math.max(1, bedroomCount);
  bathroomCount = Math.max(1, bathroomCount);
  hallCount = Math.max(1, hallCount);
  kitchenCount = Math.max(1, kitchenCount);

  // Total built-up area includes walls allowance (~10%) and circulation corridors (~12%)
  const wallAllowance = layoutData.validation?.metrics?.wallAllowance || Math.round(calculatedRoomsArea * 0.1);
  const circulationAllowance = layoutData.validation?.metrics?.circulationAllowance || Math.round(calculatedRoomsArea * 0.12);
  const totalBuiltup = Math.round(calculatedRoomsArea + wallAllowance + circulationAllowance) || Math.min(plotArea, 1250);

  const plotShape = layoutData.land.plotType === 'polygon' ? 'Polygon / Irregular' : 'Rectangular';
  const orientation = layoutData.facingDirection || 'North';

  return {
    constructionYear: overrides?.constructionYear || 2026,
    city: overrides?.city || 'Bengaluru',
    plotAreaSqft: plotArea,
    builtupAreaSqft: overrides?.builtupAreaSqft || totalBuiltup,
    plotShape: overrides?.plotShape || plotShape,
    orientation: overrides?.orientation || orientation,
    numberOfFloors: overrides?.numberOfFloors || 1,
    houseType: overrides?.houseType || (totalBuiltup > 2500 ? 'Independent Villa' : 'Modern Residence'),
    constructionQuality: overrides?.constructionQuality || 'Standard',
    bedroomCount: overrides?.bedroomCount !== undefined ? overrides.bedroomCount : bedroomCount,
    bathroomCount: overrides?.bathroomCount !== undefined ? overrides.bathroomCount : bathroomCount,
    attachedBathrooms: overrides?.attachedBathrooms !== undefined ? overrides.attachedBathrooms : attachedBathrooms,
    commonBathrooms: overrides?.commonBathrooms !== undefined ? overrides.commonBathrooms : commonBathrooms,
    hallCount: overrides?.hallCount !== undefined ? overrides.hallCount : hallCount,
    kitchenCount: overrides?.kitchenCount !== undefined ? overrides.kitchenCount : kitchenCount,
    diningRooms: overrides?.diningRooms !== undefined ? overrides.diningRooms : diningRooms,
    utilityAreas: overrides?.utilityAreas !== undefined ? overrides.utilityAreas : utilityAreas,
    parkingAreas: overrides?.parkingAreas !== undefined ? overrides.parkingAreas : parkingAreas,
    balconyAreas: overrides?.balconyAreas !== undefined ? overrides.balconyAreas : balconyAreas,
    prayerRooms: overrides?.prayerRooms !== undefined ? overrides.prayerRooms : prayerRooms,
    foundationType: overrides?.foundationType || (totalBuiltup > 3000 ? 'Raft Foundation' : 'Isolated Footing'),
    customRates: overrides?.customRates,
  };
}

/**
 * Fetches the complete ML-based Construction Cost Estimation.
 * First queries Express API; falls back to client-side pipeline on network interruption.
 */
export async function fetchCostEstimation(
  request: CostEstimationRequest
): Promise<CostEstimationResponse> {
  try {
    const response = await fetch('/api/cost-estimation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Server responded with status ${response.status}`);
    }

    const data: CostEstimationResponse = await response.json();
    return data;
  } catch (err) {
    console.warn('API /api/cost-estimation fetch failed, executing local ML pipeline fallback:', err);
    // Execute synchronous ML pipeline fallback
    return runFullCostEstimationPipeline(request);
  }
}

/**
 * Fetches Historical Construction Cost Trends & Holdout Test Metrics
 */
export async function fetchHistoricalTrends(): Promise<{
  validationMetrics: typeof DOCUMENTED_VALIDATION_METRICS;
  historicalTrends: typeof HISTORICAL_YEAR_TRENDS;
  testSamples: typeof HOLDOUT_TEST_SAMPLES;
  defaultRates: MaterialRates;
}> {
  try {
    const response = await fetch('/api/cost-historical-trends');
    if (response.ok) {
      const data = await response.json();
      return data;
    }
  } catch (err) {
    console.warn('Fallback to local historical trends:', err);
  }

  return {
    validationMetrics: DOCUMENTED_VALIDATION_METRICS,
    historicalTrends: HISTORICAL_YEAR_TRENDS,
    testSamples: HOLDOUT_TEST_SAMPLES,
    defaultRates: DEFAULT_MATERIAL_RATES,
  };
}

/**
 * Computes What-If Scenario Comparison
 */
export async function computeScenarioAnalysis(
  baseline: CostEstimationRequest,
  scenario: CostEstimationRequest
): Promise<{
  baselineCostINR: number;
  scenarioCostINR: number;
  baselineCostPerSqft: number;
  scenarioCostPerSqft: number;
  costDifferenceINR: number;
  percentageDifference: number;
  scenarioFullResult: CostEstimationResponse;
}> {
  try {
    const response = await fetch('/api/cost-scenario', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ baseline, scenario }),
    });

    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.warn('Fallback to local scenario calculation:', err);
  }

  const baselineResult = runFullCostEstimationPipeline(baseline);
  const scenarioResult = runFullCostEstimationPipeline(scenario);
  const costDiff = scenarioResult.primaryEstimate.totalCostINR - baselineResult.primaryEstimate.totalCostINR;
  const pctDiff = Math.round((costDiff / baselineResult.primaryEstimate.totalCostINR) * 1000) / 10;

  return {
    baselineCostINR: baselineResult.primaryEstimate.totalCostINR,
    scenarioCostINR: scenarioResult.primaryEstimate.totalCostINR,
    baselineCostPerSqft: baselineResult.primaryEstimate.costPerSqftINR,
    scenarioCostPerSqft: scenarioResult.primaryEstimate.costPerSqftINR,
    costDifferenceINR: costDiff,
    percentageDifference: pctDiff,
    scenarioFullResult: scenarioResult,
  };
}
