/**
 * One-time codemod: route every API JSON response through apiJson() so that
 * guest (not-signed-in) callers receive masked sensitive fields ("***").
 *
 * - Replaces `NextResponse.json(` with `apiJson(` in app/api/** /route.ts
 *   (skipping app/api/auth/** which must stay untouched).
 * - Adds `import { apiJson } from '@/lib/api-response';` to changed files.
 *
 * Run:  node scripts/add-api-masking.js
 */
const fs = require('fs');
const path = require('path');

const API_DIR = path.join(__dirname, '..', 'app', 'api');
const SKIP_SEGMENTS = [`app${path.sep}api${path.sep}auth`];
const IMPORT_LINE = "import { apiJson } from '@/lib/api-response';";

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.name === 'route.ts' || entry.name === 'route.tsx') out.push(full);
  }
  return out;
}

const files = walk(API_DIR).filter(
  (f) => !SKIP_SEGMENTS.some((seg) => f.includes(seg))
);

let changed = 0;
const changedFiles = [];

for (const file of files) {
  const src = fs.readFileSync(file, 'utf8');
  if (!src.includes('NextResponse.json(')) continue;
  if (src.includes("'@/lib/api-response'")) continue; // already migrated

  let next = src.split('NextResponse.json(').join('apiJson(');

  // Insert the apiJson import after the last top-level import statement.
  const importMatches = [...next.matchAll(/^import .*$/gm)];
  if (importMatches.length > 0) {
    const last = importMatches[importMatches.length - 1];
    const idx = last.index + last[0].length;
    next = next.slice(0, idx) + '\n' + IMPORT_LINE + next.slice(idx);
  } else {
    next = IMPORT_LINE + '\n' + next;
  }

  fs.writeFileSync(file, next);
  changed++;
  changedFiles.push(path.relative(process.cwd(), file));
}

console.log(`Migrated ${changed} route files:`);
for (const f of changedFiles) console.log('  ' + f);
