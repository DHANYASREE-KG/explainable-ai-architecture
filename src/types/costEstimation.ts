export type ConstructionQuality = 'Economy' | 'Standard' | 'Premium' | 'Luxury';
export type FoundationType = 'Isolated Footing' | 'Combined Footing' | 'Raft Foundation' | 'Pile Foundation';
export type HouseType = 'Independent Villa' | 'Duplex House' | 'Bungalow' | 'Row House' | 'Modern Residence';

export interface MaterialQuantityEstimate {
  steelKg: number;
  steelMetricTons: number;
  cementBags: number;
  sandCubicMeters: number;
  sandTons: number;
  aggregateCubicMeters: number;
  aggregateTons: number;
  brickUnits: number;
  brickThousands: number;
  electricalPointsCount: number;
  plumbingPointsCount: number;
}

export interface LabourDaysEstimate {
  masonDays: number;
  carpenterDays: number;
  electricianDays: number;
  plumberDays: number;
  painterDays: number;
  unskilledLabourDays: number;
}

export interface MaterialRates {
  cementRatePerBag: number; // ₹ per 50kg bag
  steelRatePerKg: number; // ₹ per kg
  sandRatePerM3: number; // ₹ per m3
  brickRatePer1000: number; // ₹ per 1000 bricks
  aggregateRatePerM3: number; // ₹ per m3
  masonRatePerDay: number; // ₹ per day
  carpenterRatePerDay: number; // ₹ per day
  electricianRatePerDay: number; // ₹ per day
  plumberRatePerDay: number; // ₹ per day
  painterRatePerDay: number; // ₹ per day
  unskilledRatePerDay: number; // ₹ per day
}

export interface CostBreakdownItem {
  name: string;
  category: 'materials' | 'labour' | 'overheads';
  quantityLabel: string;
  unitRateLabel: string;
  amount: number;
  percentage: number;
  isEngineeringEstimate: boolean;
}

export interface CostBreakdown {
  materials: {
    cement: CostBreakdownItem;
    steel: CostBreakdownItem;
    sand: CostBreakdownItem;
    aggregate: CostBreakdownItem;
    bricks: CostBreakdownItem;
    totalMaterialCost: number;
    materialPercentage: number;
  };
  labour: {
    masonry: CostBreakdownItem;
    carpentry: CostBreakdownItem;
    electrical: CostBreakdownItem;
    plumbing: CostBreakdownItem;
    painting: CostBreakdownItem;
    totalLabourCost: number;
    labourPercentage: number;
  };
  overheadsAndEquipment: {
    equipmentAndMachinery: number;
    siteSupervisionAndOverheads: number;
    permitsAndContingency: number;
    totalOverheadsCost: number;
    overheadsPercentage: number;
  };
  totalDirectBaseCost: number;
  reconciliationBalance: number;
  totalEstimatedCost: number;
}

export interface ModelValidationMetrics {
  primaryModel: 'XGBoost Regressor';
  secondaryModel: 'PyTorch Deep Neural Network';
  r2ScorePercent: number; // 85.79%
  r2Score: number; // 0.8579
  mapePercent: number; // 12.38%
  accuracyScorePercent: number; // 87.62% (100 - MAPE)
  maeLakhs: number; // 19.92
  rmseLakhs: number; // 25.04
  trainingYears: string; // 2010–2024
  validationYear: string; // 2025
  holdoutTestYear: string; // 2026
  datasetSampleSize: number; // 1000
  evaluationMethodology: string; // "Chronological holdout evaluation with data leakage prevention"
  disclaimer: string;
}

export interface ValidationTestSample {
  sampleId: string;
  projectName: string;
  city: string;
  builtupAreaSqft: number;
  floors: number;
  quality: ConstructionQuality;
  year: number;
  actualCostLakhs: number;
  predictedCostLakhs: number;
  absoluteErrorLakhs: number;
  percentageError: number;
}

export interface HistoricalYearTrend {
  year: number;
  averageCostLakhs: number;
  minCostLakhs: number;
  maxCostLakhs: number;
  averageCostPerSqft: number;
  sampleCount: number;
}

export interface FeatureImportanceFactor {
  featureKey: string;
  featureName: string;
  importancePercentage: number;
  impactDirection: 'increases_cost' | 'decreases_cost' | 'neutral';
  explanation: string;
}

export interface CostEstimationRequest {
  constructionYear: number;
  city: string;
  plotAreaSqft: number;
  builtupAreaSqft: number;
  plotShape?: string;
  orientation?: string;
  numberOfFloors: number;
  houseType: HouseType;
  constructionQuality: ConstructionQuality;
  bedroomCount: number;
  bathroomCount: number;
  attachedBathrooms?: number;
  commonBathrooms?: number;
  hallCount: number;
  kitchenCount: number;
  diningRooms?: number;
  utilityAreas?: number;
  parkingAreas?: number;
  balconyAreas?: number;
  prayerRooms?: number;
  foundationType: FoundationType;
  customRates?: Partial<MaterialRates>;
}

export interface QualityComparisonItem {
  quality: ConstructionQuality;
  estimatedCost: number;
  costInLakhs: number;
  costPerSqft: number;
  differenceFromCurrent: number;
  percentageDiffFromCurrent: number;
  keyFeatures: string[];
}

export interface WhatIfScenarioResult {
  scenarioId: string;
  title: string;
  parameters: CostEstimationRequest;
  estimatedCost: number;
  costInLakhs: number;
  costPerSqft: number;
  costDifference: number;
  percentageDifference: number;
}

export interface CostEstimationResponse {
  success: boolean;
  timestamp: string;
  projectId: string;
  inputs: CostEstimationRequest;
  
  // Predictions
  primaryEstimate: {
    modelName: string;
    totalCostINR: number;
    totalCostInLakhs: number;
    totalCostInCrores: number;
    costPerSqftINR: number;
    indicativeRange: {
      lowerBoundINR: number;
      lowerBoundLakhs: number;
      upperBoundINR: number;
      upperBoundLakhs: number;
      errorMarginPercent: number; // 12.38%
    };
  };

  // Secondary verification model
  secondaryEstimate?: {
    modelName: string;
    totalCostINR: number;
    totalCostInLakhs: number;
    costPerSqftINR: number;
    varianceWithPrimaryPercent: number;
  };

  // Quantities & Rates
  quantities: MaterialQuantityEstimate;
  labourDays: LabourDaysEstimate;
  ratesUsed: MaterialRates;

  // Transparent Breakdown
  breakdown: CostBreakdown;

  // Validation Metrics & Confidence
  validationMetrics: ModelValidationMetrics;
  testSamples: ValidationTestSample[];
  historicalTrends: HistoricalYearTrend[];

  // Explainability & Feature Importance
  featureImportance: FeatureImportanceFactor[];
  explainabilitySummary: {
    dominantCostDriver: string;
    cityFactorImpact: string;
    qualityImpact: string;
    inflationImpact: string;
    traceabilitySteps: {
      stepNumber: number;
      title: string;
      description: string;
      valueDerived: string;
    }[];
  };

  // Quality Tier Comparison Matrix
  qualityComparison: QualityComparisonItem[];
}
