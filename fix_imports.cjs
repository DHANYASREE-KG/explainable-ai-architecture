const fs = require('fs');
let code = fs.readFileSync('src/services/architecturalRefiner.ts', 'utf8');

const missingImports = `
import { ClassifiedSpace } from './architecturalZoning';
import { getSharedWall } from './geometryEngine';
import { touchesExteriorBoundary } from './architecturalScorer';
`;

code = missingImports + code;
fs.writeFileSync('src/services/architecturalRefiner.ts', code);
