/**
 * Codemod #2: same mask guard as add-cell-mask-check.js but for cells that
 * name the variable `rate` (sourceUnitRate / currentUnitRate columns).
 * Run:  node scripts/add-rate-cell-mask-check.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'app');
const SENSITIVE = new Set(['sourceUnitRate', 'currentUnitRate', 'unitRate', 'totalvalue', 'currentValue']);
const re = /^(\s*)const rate = row\.getValue\('([A-Za-z0-9_]+)'\)( as number)?;/;

let touched = 0;

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith('.tsx')) processFile(full);
  }
}

function processFile(file) {
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  let changed = false;
  const out = [];
  for (const line of lines) {
    out.push(line);
    const m = line.match(re);
    if (m && SENSITIVE.has(m[2])) {
      out.push(`${m[1]}if (rate === '***') return '***';`);
      changed = true;
    }
  }
  if (changed) {
    fs.writeFileSync(file, out.join('\n'));
    touched++;
    console.log('updated:', path.relative(process.cwd(), file));
  }
}

walk(ROOT);
console.log(`Done. ${touched} files updated.`);
