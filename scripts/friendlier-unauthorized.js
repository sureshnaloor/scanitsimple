// One-off codemod: replace `error: 'Unauthorized'` with a friendlier message
// across app/api route handlers. Skips auth/change-password (has its own text).
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'app', 'api');
const OLD = "error: 'Unauthorized'";
const NEW = "error: 'Unauthorized: sign in before using this feature'";
const SKIP = new Set([path.join('auth', 'change-password', 'route.ts')]);

let filesChanged = 0;
let replacements = 0;

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
    } else if (entry.isFile() && entry.name.endsWith('.ts')) {
      const rel = path.relative(ROOT, full);
      if (SKIP.has(rel)) continue;
      const src = fs.readFileSync(full, 'utf8');
      if (!src.includes(OLD)) continue;
      const out = src.split(OLD).join(NEW);
      const count = (src.length - out.length) / (OLD.length - NEW.length);
      fs.writeFileSync(full, out);
      filesChanged += 1;
      replacements += Math.round(count);
      console.log(`${rel}: ${Math.round(count)} replacement(s)`);
    }
  }
}

walk(ROOT);
console.log(`\nDone: ${replacements} replacements across ${filesChanged} files.`);
