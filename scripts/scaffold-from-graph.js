#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const graphPath = process.argv[2];
if (!graphPath) {
  console.error('Usage: node scripts/scaffold-from-graph.js <path/to/knowledge-graph.yaml>');
  process.exit(1);
}

const graphContent = fs.readFileSync(graphPath, 'utf8');
const graph = yaml.load(graphContent);

const repoRoot = path.resolve(__dirname, '..');
const docsDir = path.join(repoRoot, 'docs');

// Build pillar lookup
const pillarMap = {};
for (const pillar of graph.pillars) {
  pillarMap[pillar.slug] = pillar;
}

// Track all concepts for CONCEPTS.md
const conceptList = [];

for (const concept of graph.concepts) {
  const pillar = pillarMap[concept.pillar];
  if (!pillar) {
    console.warn(`Warning: concept "${concept.slug}" references unknown pillar "${concept.pillar}"`);
    continue;
  }

  const quizDir = path.join(docsDir, pillar.slug, concept.slug, 'quiz');
  fs.mkdirSync(quizDir, { recursive: true });

  const gitkeep = path.join(quizDir, '.gitkeep');
  // Only write .gitkeep if directory is empty (no quiz files yet)
  const files = fs.readdirSync(quizDir).filter(f => f !== '.gitkeep');
  if (files.length === 0 && !fs.existsSync(gitkeep)) {
    fs.writeFileSync(gitkeep, '');
  }

  conceptList.push({
    pillar: pillar.slug,
    pillarTitle: pillar.title,
    concept: concept.slug,
    conceptTitle: concept.title,
  });
}

// Generate CONCEPTS.md
let md = '# Available Concepts\n\n';
let currentPillar = null;

for (const entry of conceptList) {
  if (entry.pillar !== currentPillar) {
    currentPillar = entry.pillar;
    md += `## ${entry.pillarTitle}\n`;
  }
  md += `- \`${entry.pillar}/${entry.concept}\` — ${entry.conceptTitle}\n`;
}

fs.writeFileSync(path.join(repoRoot, 'CONCEPTS.md'), md);

console.log(`Scaffolded ${conceptList.length} concept directories under docs/`);
console.log('Generated CONCEPTS.md');
