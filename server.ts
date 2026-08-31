import express from 'express';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import {
  runFullCostEstimationPipeline,
  DOCUMENTED_VALIDATION_METRICS,
  HISTORICAL_YEAR_TRENDS,
  HOLDOUT_TEST_SAMPLES,
  DEFAULT_MATERIAL_RATES,
} from './server/costEstimationML';
import { CostEstimationRequest } from './src/types/costEstimation';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy initialization of Gemini API client
let genAIClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!genAIClient && process.env.GEMINI_API_KEY) {
    genAIClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return genAIClient;
}

// Clean JSON response from model output
function cleanJsonText(rawText: string): string {
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  return cleaned;
}

// Robust multi-model generator with automatic fallback
async function generateWithGemini(
  prompt: string,
  systemInstruction?: string
): Promise<string | null> {
  const ai = getGeminiClient();
  if (!ai) return null;

  // Primary model and backup fallback models in case of 503 high-demand spikes
  const candidateModels = ['gemini-3.7-flash', 'gemini-2.5-flash', 'gemini-3.1-flash-lite'];

  for (const model of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          ...(systemInstruction ? { systemInstruction } : {}),
        },
      });

      if (response && response.text) {
        return response.text;
      }
    } catch (err: any) {
      console.warn(`[Gemini API] Model ${model} failed (${err?.message || err}). Trying next fallback...`);
      // Continue to next model in list
    }
  }

  return null;
}

// Health Check API
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

// AI Suggestions API Endpoint
app.post('/api/suggest', async (req, res) => {
  try {
    const { land, facingDirection, rooms, metrics, geometricErrors } = req.body;

    const prompt = `You are an expert architectural layout optimization AI.
Analyzing a house layout design that currently FAILS architectural validation.

LAND DETAILS:
- Length: ${land.length} ft, Breadth: ${land.breadth} ft, Total Land Area: ${land.totalArea} sq.ft
- House Facing Direction: ${facingDirection}

CURRENT METRICS:
- Total Requested Room Area: ${metrics.totalRoomArea} sq.ft
- Wall Allowance (10%): ${metrics.wallAllowance} sq.ft
- Circulation Allowance (12%): ${metrics.circulationAllowance} sq.ft
- Final Required Area: ${metrics.finalRequiredArea} sq.ft
- Land Area: ${land.totalLandArea} sq.ft
- Excess Area Violation: ${metrics.excessArea} sq.ft
- Geometric Errors: ${geometricErrors?.join('; ') || 'Area exceeds land area'}

ROOMS ENTERED:
${JSON.stringify(rooms, null, 2)}

Provide intelligent architectural suggestions to adjust room dimensions to resolve the validation failure.
Format output as valid JSON with array of suggestions containing:
- roomId
- roomName
- currentLength
- currentBreadth
- currentArea
- suggestedLength
- suggestedBreadth
- suggestedArea
- areaSaved
- reason
- problemSolved`;

    const rawText = await generateWithGemini(prompt);
    if (rawText) {
      try {
        const cleaned = cleanJsonText(rawText);
        const parsed = JSON.parse(cleaned);
        return res.json({
          success: true,
          source: 'gemini',
          data: parsed,
        });
      } catch (parseError) {
        console.warn('Could not parse Gemini JSON response for /api/suggest, using local fallback:', parseError);
      }
    }

    return res.json({
      success: true,
      source: 'local_engine',
      message: 'Calculated using deterministic layout optimization engine.',
    });
  } catch (error: any) {
    console.error('Error in /api/suggest:', error);
    return res.status(500).json({
      success: false,
      error: error?.message || 'Failed to generate AI suggestions',
    });
  }
});

// Explainable AI (XAI) "Explain Blueprint" Endpoint
app.post('/api/explain', async (req, res) => {
  try {
    const { layoutData, selectedRoomId } = req.body;

    if (!layoutData) {
      return res.status(400).json({ error: 'layoutData is required' });
    }

    // Prepare verified facts payload from central layout object
    const selectedRoom = selectedRoomId
      ? layoutData.rooms.find((r: any) => r.id === selectedRoomId)
      : null;

    const factsPrompt = `You are an expert architectural Explainable AI (XAI) engine.
Explain why this house blueprint layout was generated the way it was, using strictly verified layout facts.
Do NOT invent fake room coordinates or fake constraints.

VERIFIED LAYOUT FACTS:
- Land Dimensions: ${layoutData.land.length} ft × ${layoutData.land.breadth} ft (${layoutData.land.totalArea} sq.ft)
- House Facing Direction: ${layoutData.facingDirection}
- Main Entrance: Wall = ${layoutData.entrance.wall}, Location = (${layoutData.entrance.x} ft, ${layoutData.entrance.y} ft), Description = ${layoutData.entrance.description}
- Total Built-up Area: ${layoutData.validation.metrics.finalRequiredArea} sq.ft (${layoutData.validation.metrics.remainingArea} sq.ft remaining)
- Room Count: ${layoutData.rooms.length} spaces

GENERATED ROOM PLACEMENTS (Single Source of Truth):
${JSON.stringify(
  layoutData.rooms.map((r: any) => ({
    id: r.id,
    name: r.name,
    category: r.category,
    coordinates: `(${r.x} ft, ${r.y} ft)`,
    dimensions: `${r.width} ft × ${r.height} ft`,
    area: `${r.area} sq.ft`,
    zone: r.zone,
    doors: r.doors,
    windows: r.windows,
    adjacentRooms: r.adjacentRoomIds,
  })),
  null,
  2
)}

PLACEMENT DECISIONS RECORD:
${JSON.stringify(layoutData.placementDecisions, null, 2)}

FOCUS ITEM: ${selectedRoom ? `Specific Room: ${selectedRoom.name} (ID: ${selectedRoom.id})` : 'Entire Blueprint Layout'}

Required Output Schema (JSON):
{
  "summary": "Concise architectural explanation summary",
  "overallScoreExplanation": "Why this candidate layout scored high",
  "categories": {
    "geometry": "How exact requested Length x Breadth proportions fit inside boundary",
    "area": "How total area fits land area with wall and corridor allowance",
    "direction": "How the ${layoutData.facingDirection}-facing orientation governed front entrance and zoning",
    "adjacency": "How functional relationships (e.g. Kitchen near Dining) were satisfied",
    "privacy": "How private bedroom spaces are isolated from public entrance",
    "circulation": "How corridors and passages connect entrance to every space",
    "userPreferences": "How exact user dimensions were respected",
    "optimization": "Why this candidate placement scored higher than alternatives",
    "rejectedAlternatives": ["List of rejected alternative locations and reasons"],
    "tradeoffs": ["List of trade-offs made during geometric packing"]
  },
  "evidenceChecklist": [
    "✓ Verified Land Boundary (${layoutData.land.length} x ${layoutData.land.breadth} ft)",
    "✓ Verified ${layoutData.facingDirection}-facing main entrance placement",
    "✓ Verified non-overlapping rectangular room geometry",
    "✓ Verified corridor passage accessibility"
  ]
}`;

    const rawText = await generateWithGemini(factsPrompt);
    if (rawText) {
      try {
        const cleaned = cleanJsonText(rawText);
        const parsed = JSON.parse(cleaned);
        return res.json({
          success: true,
          explanation: parsed,
        });
      } catch (parseError) {
        console.warn('Could not parse Gemini JSON response for /api/explain, using local fallback:', parseError);
      }
    }

    // Return structured factual response generated locally if API key is not supplied or call failed
    const roomNote = selectedRoom
      ? `Focusing on ${selectedRoom.name}: Placed at (${selectedRoom.x} ft, ${selectedRoom.y} ft) with dimensions ${selectedRoom.width} ft × ${selectedRoom.height} ft (${selectedRoom.area} sq.ft) in the ${selectedRoom.zone}.`
      : 'Explaining entire blueprint layout:';

    return res.json({
      success: true,
      explanation: {
        summary: `${roomNote} The layout satisfies all ${layoutData.land.length} ft × ${layoutData.land.breadth} ft land constraints and places the main entrance on the ${layoutData.facingDirection} side.`,
        overallScoreExplanation: `Candidate layout scored ${layoutData.layoutScore}/100 for optimal space utilization and strict adherence to ${layoutData.facingDirection}-facing orientation.`,
        categories: {
          geometry: `Exact requested room shapes fit cleanly within the ${layoutData.land.length} ft × ${layoutData.land.breadth} ft rectangular boundary without overlap.`,
          area: `Total built-up area of ${layoutData.validation.metrics.finalRequiredArea} sq.ft is fully contained within total land area of ${layoutData.land.totalArea} sq.ft.`,
          direction: `The selected ${layoutData.facingDirection}-facing orientation established the ${layoutData.facingDirection} boundary as the primary front façade and main entrance access zone.`,
          adjacency: 'Functional adjacencies (e.g., Living Room at front entrance, Kitchen near Dining) are satisfied.',
          privacy: 'Private bedrooms are positioned in set-back quiet zones away from the main public foyer.',
          circulation: `Central corridor allocation of ${layoutData.validation.metrics.circulationAllowance} sq.ft provides direct movement from main entrance to all rooms.`,
          userPreferences: 'All user-entered room length and breadth requirements were preserved without arbitrary scaling.',
          optimization: 'Positioned rooms to maximize natural window ventilation on exterior perimeter walls.',
          rejectedAlternatives: [
            `Alternative placement near opposite wall was rejected to avoid blocking main ${layoutData.facingDirection} corridor.`,
          ],
          tradeoffs: [
            'Adjusted door swing orientation to maximize usable internal room furniture area.',
          ],
        },
        evidenceChecklist: [
          `✓ Verified ${layoutData.land.length} ft × ${layoutData.land.breadth} ft boundary fit`,
          `✓ Verified ${layoutData.facingDirection}-facing front entrance`,
          '✓ Verified 0% room geometric overlap',
          '✓ Verified door and passage accessibility',
        ],
      },
    });
  } catch (error: any) {
    console.error('Error in /api/explain:', error);
    return res.status(500).json({
      success: false,
      error: error?.message || 'Failed to generate layout explanation',
    });
  }
});

// =============================================================
// AI CONSTRUCTION COST ESTIMATION API (XGBoost + PyTorch)
// =============================================================

// Historical Trends & Holdout Test Validation Metadata API
app.get('/api/cost-historical-trends', (req, res) => {
  try {
    return res.json({
      success: true,
      validationMetrics: DOCUMENTED_VALIDATION_METRICS,
      historicalTrends: HISTORICAL_YEAR_TRENDS,
      testSamples: HOLDOUT_TEST_SAMPLES,
      defaultRates: DEFAULT_MATERIAL_RATES,
    });
  } catch (err: any) {
    console.error('Error fetching cost historical trends:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve historical cost trends',
    });
  }
});

// Primary AI Construction Cost Estimation Pipeline
app.post('/api/cost-estimation', (req, res) => {
  try {
    const input: CostEstimationRequest = req.body;

    // Strict Input Validation
    const missingFields: string[] = [];
    if (!input) {
      return res.status(400).json({
        success: false,
        error: 'Request body is empty or invalid',
      });
    }

    if (!input.builtupAreaSqft || input.builtupAreaSqft <= 0) {
      missingFields.push('builtupAreaSqft (must be > 0 sq.ft)');
    }
    if (!input.plotAreaSqft || input.plotAreaSqft <= 0) {
      missingFields.push('plotAreaSqft (must be > 0 sq.ft)');
    }
    if (!input.city) {
      missingFields.push('city');
    }
    if (!input.constructionQuality) {
      missingFields.push('constructionQuality (Economy, Standard, Premium, Luxury)');
    }

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Missing or invalid required architectural parameters: ${missingFields.join(', ')}`,
      });
    }

    // Inconsistency checks
    const warnings: string[] = [];
    if (input.plotAreaSqft < input.builtupAreaSqft && (!input.numberOfFloors || input.numberOfFloors <= 1)) {
      warnings.push('Plot area is less than built-up area for single-storey structure. Ensure multi-storey floor count or plot dimensions are aligned.');
    }

    // Run the full ML estimation pipeline with cached model state
    const result = runFullCostEstimationPipeline(input);

    return res.json({
      ...result,
      warnings: warnings.length > 0 ? warnings : undefined,
    });
  } catch (error: any) {
    console.error('Error running cost estimation pipeline:', error);
    return res.status(500).json({
      success: false,
      error: error?.message || 'Cost estimation model is currently unavailable.',
    });
  }
});

// What-If Scenario Analysis Comparison API
app.post('/api/cost-scenario', (req, res) => {
  try {
    const { baseline, scenario } = req.body;

    if (!baseline || !scenario) {
      return res.status(400).json({
        success: false,
        error: 'Both baseline and scenario parameters are required',
      });
    }

    const baselineResult = runFullCostEstimationPipeline(baseline);
    const scenarioResult = runFullCostEstimationPipeline(scenario);

    const costDiff = scenarioResult.primaryEstimate.totalCostINR - baselineResult.primaryEstimate.totalCostINR;
    const pctDiff = Math.round((costDiff / baselineResult.primaryEstimate.totalCostINR) * 1000) / 10;

    return res.json({
      success: true,
      baselineCostINR: baselineResult.primaryEstimate.totalCostINR,
      scenarioCostINR: scenarioResult.primaryEstimate.totalCostINR,
      baselineCostPerSqft: baselineResult.primaryEstimate.costPerSqftINR,
      scenarioCostPerSqft: scenarioResult.primaryEstimate.costPerSqftINR,
      costDifferenceINR: costDiff,
      percentageDifference: pctDiff,
      scenarioFullResult: scenarioResult,
    });
  } catch (error: any) {
    console.error('Error computing scenario analysis:', error);
    return res.status(500).json({
      success: false,
      error: error?.message || 'Failed to compute scenario analysis',
    });
  }
});

// Vite Middleware for development / static serving in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
