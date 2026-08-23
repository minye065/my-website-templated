import { readFileSync } from 'node:fs';
const src = readFileSync('src/lib/catalog.ts', 'utf8');
const re = /^\['([^']+)', (null|'(?:[^'\\]|\\.)*'), '([a-z0-9]+)'/gm;
let m, count = 0;
const seen = new Set();
while ((m = re.exec(src))) {
  count++;
  seen.add(m[1]);
}
console.log('parsed rows:', count);
for (const k of ['M6', 'M18', 'M43', 'M81', 'M50', 'C46']) console.log('parsed', k, '?', seen.has(k));
const man = JSON.parse(readFileSync('src/data/hubbleShowcase.json', 'utf8'));
for (const k of ['M6', 'M18', 'M41', 'M50', 'M97']) console.log('manifest has', k, '?', !!man[k]);
