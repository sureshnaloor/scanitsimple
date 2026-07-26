/**
 * Codemod: make tanstack-table value cells render "***" when the API has
 * masked a sensitive field for guest users.
 *
 * Finds lines like:
 *     const value = row.getValue('acquiredvalue');
 * inside app/**\/*.tsx and inserts right after them:
 *     if (value === '***') return '***';
 *
 * Run:  node scripts/add-cell-mask-check.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'app');
const SENSITIVE = new Set([
  'acquiredvalue',
  'assetvalue',
  'toolCost',
  'currentValue',
  'unitRate',
  'sourceUnitRate',
  'totalvalue',
  'unitprice',
  'purchaseprice',
]);

const re = /^(\s*)const value = row\.getValue\('([A-Za-z0-9_]+)'\)( as number)?;/;

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
      out.push(`${m[1]}if (value === '***') return '***';`);
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
