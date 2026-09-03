# 🏠 AI Architect

## Intelligent Residential Architectural Planning and Visualization System

> An AI-assisted residential architectural planning system that transforms user requirements and plot information into optimized floor plans, validated architectural layouts, interactive 2D blueprints, 3D house models, and construction-cost insights.

---

## 📌 Overview

**AI Architect** is an AI-assisted residential architectural planning and visualization platform developed to automate the early stages of house planning.

The system accepts information such as:

- Plot dimensions
- Plot shape
- Plot orientation/facing direction
- Number of bedrooms
- Living room requirements
- Kitchen and dining requirements
- Bathroom requirements
- Parking requirements
- Garden and outdoor spaces
- Study room
- Prayer room
- Guest room
- Utility room
- Store room
- User-defined room dimensions

The system processes these requirements through a multi-stage architectural planning pipeline.

The generated layout is evaluated using architectural and geometric constraints such as:

- Space utilization
- Room dimensions
- Room adjacency
- Functional zoning
- Circulation
- Privacy
- Accessibility
- Natural lighting
- Ventilation
- Plot containment
- Orientation
- Geometric validity

After validation and optimization, the system generates an interactive **2D blueprint** and automatically reconstructs the layout into an interactive **3D house model**.

---

# 🎯 Objectives

The main objectives of the project are:

1. Automate preliminary residential floor-plan generation.
2. Convert user requirements into structured architectural requirements.
3. Analyze available plot area and building constraints.
4. Generate functional room zoning and spatial relationships.
5. Optimize room dimensions according to available space.
6. Support both regular and irregular plots.
7. Validate generated layouts using architectural constraints.
8. Provide AI-assisted recommendations when the requested design exceeds available space.
9. Generate interactive 2D architectural blueprints.
10. Automatically reconstruct validated layouts into 3D house models.
11. Provide interactive 3D walkthrough capabilities.
12. Support preliminary construction-cost estimation.
13. Provide explainable information about architectural design decisions.

---

# 🚀 Key Features

## 📐 1. Plot and Land Analysis

The system analyzes the available plot before generating the house layout.

It supports:

- Square plots
- Rectangular plots
- Irregular polygon plots

The system determines:

- Total plot area
- Plot boundary
- Buildable area
- Setback requirements
- Available construction footprint
- Remaining open space

---

## 🏡 2. Housing Requirement Configuration

Users can define their required spaces and preferences.

### Main Residential Spaces

- Living Room
- Bedrooms
- Master Bedroom
- Kitchen
- Dining Room
- Bathrooms
- Attached Bathrooms

### Additional Spaces

- Study Room
- Prayer Room
- Guest Room
- Home Office
- Store Room
- Utility Room
- Laundry Room
- Staircase

### Outdoor Spaces

- Parking
- Garden
- Balcony
- Sit-out
- Terrace

---

# 🧠 3. AI-Assisted Requirement Understanding

User requirements are converted into structured architectural information.

The system identifies:

- Room types
- Room quantities
- Room dimensions
- Functional categories
- Privacy levels
- Room priorities
- Adjacency preferences
- Orientation preferences

This structured representation is used by subsequent layout-generation and validation modules.

---

# 🧩 4. Architectural Zoning

Rooms are classified into functional zones based on their purpose and privacy requirements.

### Public Zone

Examples:

- Living Room
- Hall
- Foyer

### Semi-Public Zone

Examples:

- Dining Room
- Family Room

### Private Zone

Examples:

- Master Bedroom
- Bedrooms
- Guest Room
- Study Room

### Service Zone

Examples:

- Kitchen
- Utility
- Laundry
- Store
- Bathrooms

### Transition Zone

Examples:

- Staircase
- Corridors
- Circulation areas

This zoning helps establish meaningful spatial relationships between rooms.

---

# 🔗 5. Room Adjacency and Connectivity

The system considers relationships between different spaces.

For example:

```text
Living Room
     │
     ├── Dining Room
     │
     ├── Kitchen
     │
     └── Bedroom Zone
````

Room relationships can include:

* Preferred adjacency
* Required adjacency
* Separation requirements
* Door connections
* Entrance connections
* Circulation connections

This ensures that the layout is not based only on geometric packing.

---

# 📊 6. Area Calculation

The system calculates the required residential area based on room dimensions.

The overall requirement can be represented as:

```text
Required Area
=
Room Area
+
Wall Allowance
+
Circulation Allowance
```

The required area is compared with the available buildable area.

### When sufficient space is available

```text
Required Area <= Buildable Area
            |
            v
      Layout Generation
            |
            v
       Validation
            |
            v
       Final Design
```

### When insufficient space is available

```text
Required Area > Buildable Area
            |
            v
      Calculate Excess
            |
            v
    Generate Suggestions
            |
            v
      Optimize Spaces
            |
            v
       Revalidate
```

---

# 🤖 7. AI-Assisted Space Optimization

If the user's requested spaces cannot fit within the available buildable area, the system generates optimization recommendations.

Recommendations may include:

* Reducing non-critical room dimensions
* Optimizing room proportions
* Reducing outdoor space
* Adjusting secondary spaces
* Reorganizing room placement
* Recovering unused areas

Each recommendation can contain:

* Current dimensions
* Suggested dimensions
* Current area
* Suggested area
* Area recovered
* Priority
* Reason
* Architectural trade-off

---

# 📍 8. Irregular Plot Support

The system supports house planning on irregular polygon-shaped plots.

The plot can be represented using multiple vertices.

```text
              P1
             /  \
            /    \
          P2      P6
          |        \
          |         P5
          |        /
          P3------P4
```

The system uses computational geometry techniques to determine whether generated room geometries remain within the plot boundary.

---

# 📐 9. Point-in-Polygon Algorithm

A ray-casting based point-in-polygon approach is used for geometric containment.

```text
Plot Boundary
      |
      v
Room Corner
      |
      v
Point-in-Polygon Test
      |
      +---- Inside ----> Valid
      |
      +---- Outside ---> Invalid
```

This prevents rooms from being positioned outside the available plot.

---

# 🔄 10. Spatial Relaxation for Irregular Layouts

For irregular plots, the layout can be adjusted using iterative spatial relaxation.

The system considers:

* Room overlap
* Plot containment
* Separation between rooms
* Room displacement
* Polygon boundaries

The process iteratively adjusts room positions until an acceptable configuration is obtained.

---

# ✅ 11. Constraint Validation

Before the final design is generated, the system validates the layout.

Validation categories include:

* Input validation
* Area validation
* Geometry validation
* Room overlap
* Plot containment
* Room adjacency
* Circulation
* Accessibility
* Orientation
* Ventilation
* Privacy
* Natural lighting
* Structural alignment

Validation results can be represented using:

```text
PASSED
FAILED
WARNING
PENDING
```

Critical validation failures prevent the layout from being treated as a final valid design.

---

# 📈 12. Architectural Quality Evaluation

The generated layout can be evaluated using multiple quality dimensions.

```text
Architectural Correctness
          +
Connectivity
          +
Space Utilization
          +
Ventilation
          +
Accessibility
          +
Privacy
          +
Natural Lighting
          +
Structural Alignment
          |
          v
    Quality Score
```

The resulting design can be categorized as:

* Excellent
* Good
* Needs Improvement

---

# 🧾 13. Explainable AI

A major feature of the system is the ability to provide explanations for generated design decisions.

The system can explain:

* Why a room was placed in a particular location
* Why two rooms were connected
* Why a room was moved
* Why a dimension was changed
* Why an alternative placement was rejected
* Which constraints were satisfied
* Which user preferences influenced the decision
* Which architectural trade-offs were made

Example:

```text
Why was the bedroom placed here?

1. The required room dimensions are satisfied.
2. The room remains within the plot boundary.
3. The bedroom maintains the required privacy level.
4. The room satisfies preferred adjacency constraints.
5. The location provides suitable circulation.
6. Alternative locations had geometric or space conflicts.
```

This makes the system more transparent than a purely black-box generation system.

---

# 🗺️ 14. Interactive 2D Blueprint

After successful validation, the system generates an interactive 2D blueprint.

The blueprint can display:

* Plot boundary
* Rooms
* Walls
* Doors
* Windows
* Room dimensions
* Furniture
* Orientation
* Architectural annotations

### Furniture Visualization

The system can represent furniture such as:

* Beds
* Sofas
* Chairs
* Tables
* TV units
* Rugs
* Plants

The 2D blueprint provides the spatial foundation for 3D reconstruction.

---

# 🏗️ 15. Automatic 3D House Reconstruction

The validated 2D layout is converted into a 3D house model.

```text
2D Room Layout
       |
       v
Coordinate Mapping
       |
       v
Room Geometry
       |
       v
Walls
       |
       v
Doors and Windows
       |
       v
Furniture
       |
       v
Roof
       |
       v
Interactive 3D House
```

The 3D model is generated using **Three.js**.

---

# 🎮 16. Interactive 3D Visualization

The application provides an interactive 3D environment.

### Camera Views

* Front View
* Rear View
* Left View
* Right View
* Top View
* Isometric View
* Room-specific views

### Lighting Modes

* Daylight
* Golden Hour
* Evening

### Controls

* Zoom
* Pan
* Rotate
* Camera presets
* Roof visibility

---

# 🚶 17. 3D Walkthrough

The application supports an FPS-style walkthrough.

### Controls

```text
W / ↑       Forward
S / ↓       Backward
A / ←       Left
D / →       Right
Space       Move Up
Shift       Move Down
```

The walkthrough provides:

* First-person navigation
* Room detection
* Wall collision detection
* Interactive exploration

This allows users to experience the generated house before construction.

---

# 💰 18. Construction Cost Estimation

The system provides preliminary construction-cost estimation based on generated building information.

The estimation workflow can be represented as:

```text
Plot Information
       +
Building Area
       +
Room Information
       +
Construction Parameters
       |
       v
Cost Estimation
       |
       v
Estimated Construction Cost
```

The estimation is intended for early-stage planning and budgeting.

---

# 🔄 Complete System Pipeline

```text
User Requirements
        |
        v
AI Requirement Understanding
        |
        v
Plot Analysis
        |
        v
Room Classification
        |
        v
Architectural Zoning
        |
        v
Room Topology / Adjacency
        |
        v
Geometric Floor-Plan Generation
        |
        v
Area Calculation
        |
        v
Constraint Validation
        |
        +-----------------------+
        |                       |
     Valid                   Invalid
        |                       |
        |                       v
        |              AI Optimization
        |                       |
        |                       v
        |                 Revalidation
        |                       |
        +-----------<-----------+
        |
        v
Explainable AI Analysis
        |
        v
2D Blueprint
        |
        v
3D Reconstruction
        |
        v
Interactive Visualization
        |
        v
Cost Estimation
```

---

# 🧮 Algorithms and Techniques

| Module                  | Algorithm / Technique                 |
| ----------------------- | ------------------------------------- |
| Plot Area               | Polygon Area Calculation              |
| Plot Containment        | Ray-Casting Point-in-Polygon          |
| Irregular Plot Planning | Spatial Relaxation                    |
| Room Classification     | Rule-Based Architectural Zoning       |
| Room Placement          | Constraint-Based Spatial Planning     |
| Room Optimization       | Priority-Based Dimension Optimization |
| Room Connectivity       | Adjacency Graph                       |
| Constraint Checking     | Rule-Based Validation Engine          |
| 2D Blueprint            | Geometric Rendering                   |
| 3D Reconstruction       | Procedural Three.js Geometry          |
| Collision Detection     | Geometric Segment Checks              |
| AI Explanation          | Explainable Architectural Analysis    |
| Visualization           | React + Three.js                      |

---

# 🧠 Hybrid Intelligent Architecture

AI Architect follows a hybrid architecture combining AI techniques with deterministic computational methods.

```text
                   AI Layer
                      |
       +--------------+--------------+
       |              |              |
Requirement      Optimization    Explanation
Understanding
       |              |              |
       +--------------+--------------+
                      |
                      v
            Architectural Rules
                      |
                      v
             Spatial Computation
                      |
        +-------------+-------------+
        |             |             |
        v             v             v
   Area Engine   Geometry Engine  Validation
        |             |             |
        +-------------+-------------+
                      |
                      v
                Final Layout
                      |
             +--------+--------+
             |                 |
             v                 v
        2D Blueprint       3D Model
```

---

# 🛠️ Technology Stack

## Frontend

* React
* TypeScript
* Vite
* Tailwind CSS
* Lucide React
* Motion

## 3D Visualization

* Three.js
* WebGL
* OrbitControls

## Data Visualization

* Recharts

## Backend

* Node.js
* Express
* tsx

## AI Integration

* Google Gemini API
* `@google/genai`

## Development Tools

* TypeScript
* Vite
* npm
* Git

---

# 📁 Project Structure

```text
ai-architect/
│
├── assets/
│
├── src/
│   │
│   ├── components/
│   │   │
│   │   ├── Blueprint2D/
│   │   │   ├── Blueprint2DCanvas.tsx
│   │   │   ├── BlueprintFurniture.tsx
│   │   │   ├── BlueprintFurnitureLibrary.tsx
│   │   │   └── BlueprintRoomPanel.tsx
│   │   │
│   │   ├── House3D/
│   │   │   ├── House3DCanvas.tsx
│   │   │   ├── 3dGeometryBuilder.ts
│   │   │   └── proceduralTextures.ts
│   │   │
│   │   ├── ExplainBlueprint/
│   │   │   └── ExplainableAIBlueprintAnalysis.tsx
│   │   │
│   │   ├── StepAISuggestions.tsx
│   │   ├── StepAreaSummary.tsx
│   │   ├── StepFacingDirection.tsx
│   │   ├── StepHousingRequirements.tsx
│   │   ├── StepLandDetails.tsx
│   │   ├── StepRoomDimensions.tsx
│   │   ├── StepValidationGate.tsx
│   │   ├── PolygonPlotCanvas.tsx
│   │   ├── Header.tsx
│   │   └── Stepper.tsx
│   │
│   ├── services/
│   │   ├── areaCalculator.ts
│   │   ├── architecturalZoning.ts
│   │   ├── explainableAIAnalyzer.ts
│   │   ├── geometryEngine.ts
│   │   ├── irregularPlotEngine.ts
│   │   ├── polygonUtils.ts
│   │   ├── suggestionEngine.ts
│   │   └── validationEngine.ts
│   │
│   ├── types/
│   │   ├── index.ts
│   │   └── costEstimation.ts
│   │
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
│
├── server.ts
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── .env.example
└── .gitignore
```

---

# ⚙️ Installation

## Prerequisites

Make sure the following are installed:

* Node.js
* npm
* Git

---

## 1. Clone the Repository

```bash
git clone https://github.com/DHANYASREE-KG/ai-architect.git
cd ai-architect
```

> Replace `ai-architect` with your actual GitHub repository name if it is different.

---

## 2. Install Dependencies

```bash
npm install
```

---

## 3. Configure Environment Variables

Create a `.env` file based on `.env.example`.

```bash
cp .env.example .env
```

Configure the required API key:

```env
GEMINI_API_KEY=your_api_key_here
```

> Never commit `.env` or API keys to GitHub.

---

# ▶️ Running the Application

Start the development server:

```bash
npm run dev
```

The application will be available at the local development URL displayed in the terminal.

---

# 🏭 Production Build

Create a production build:

```bash
npm run build
```

Start the production server:

```bash
npm start
```

---

# 🔍 Code Quality

Run the project's linting command:

```bash
npm run lint
```

---

# 🧪 Testing

Testing can be extended to cover the following modules:

* Room area calculation
* Plot area calculation
* Point-in-polygon validation
* Room overlap detection
* Room containment
* Room adjacency
* Architectural validation
* Space optimization
* AI recommendations
* 2D/3D coordinate consistency
* Cost estimation
* Collision detection

---

# 💡 Research Contribution

Traditional residential architectural planning generally involves several disconnected stages.

```text
Requirements
      |
      v
Manual Planning
      |
      v
Manual Validation
      |
      v
CAD Drawing
      |
      v
3D Modeling
      |
      v
Cost Estimation
```

AI Architect attempts to integrate these stages into a unified intelligent workflow.

```text
User Requirements
      |
      v
AI Requirement Understanding
      |
      v
Architectural Zoning
      |
      v
Spatial Planning
      |
      v
Constraint Validation
      |
      v
AI-Assisted Optimization
      |
      v
Explainable Design Decisions
      |
      v
2D Blueprint
      |
      v
Automatic 3D Reconstruction
      |
      v
Interactive Walkthrough
      |
      v
Cost Estimation
```

The primary contribution of the project is the **integration of requirement understanding, architectural spatial reasoning, computational geometry, constraint validation, optimization, explainability, 2D blueprint generation, 3D reconstruction, and cost estimation into a unified residential architectural planning workflow**.

---

# 🔬 Future Enhancements

Future versions of the system can include:

* Graph Neural Networks for room topology generation
* Transformer-based requirement understanding
* Diffusion-based floor-plan generation
* Advanced generative architectural models
* Multi-floor building generation
* BIM/IFC export
* DXF/CAD export
* Structural analysis
* Building-code validation
* Energy-performance simulation
* Daylight simulation
* Ventilation analysis
* Advanced cost prediction
* Material quantity estimation
* Reinforcement estimation
* Real-time collaborative design
* Advanced AI-based architectural reasoning
* Automated building regulation checking
* Site-specific environmental analysis

---

# 📌 Project Status

**Status:** 🚧 Final-Year Research Project

### Current Capabilities

* ✅ Plot analysis
* ✅ Regular plot support
* ✅ Irregular plot support
* ✅ Housing requirement configuration
* ✅ Room dimension configuration
* ✅ Architectural zoning
* ✅ Room adjacency
* ✅ Area calculation
* ✅ Spatial optimization
* ✅ Constraint validation
* ✅ AI-assisted recommendations
* ✅ Explainable blueprint analysis
* ✅ Interactive 2D blueprint
* ✅ 3D house reconstruction
* ✅ Interactive 3D walkthrough
* ✅ Lighting controls
* ✅ Camera controls
* ✅ Preliminary cost estimation

---

# ⚠️ Disclaimer

AI Architect is intended for **academic, research, and preliminary architectural planning purposes**.

The generated layouts should **not be treated as final construction drawings**.

Before construction, designs should be reviewed and approved by qualified professionals, including:

* Licensed Architects
* Structural Engineers
* Civil Engineers
* Local Planning Authorities

Actual construction requirements may vary depending on:

* Local building regulations
* Structural requirements
* Site conditions
* Soil conditions
* Climate
* Local planning standards
* Applicable construction codes

---

# 👩‍💻 Author

## Dhanyasree K G

GitHub:

[https://github.com/DHANYASREE-KG](https://github.com/DHANYASREE-KG)

---

# ⭐ Acknowledgements

This project uses several open-source technologies and libraries, including:

* React
* TypeScript
* Vite
* Three.js
* Tailwind CSS
* Express
* Recharts
* Lucide React
* Google Gemini API

---

# 📜 License

This project is developed for **academic and research purposes**.

An appropriate open-source license should be added before public distribution based on institutional requirements and the licenses of the third-party libraries used in the project.

---

# ⭐ Support

If you find this project useful, consider giving the repository a ⭐ on GitHub.

---
