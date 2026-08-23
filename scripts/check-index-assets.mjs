import { readFileSync } from 'node:fs';
import manifest from '../src/data/hubbleShowcase.json' with { type: 'json' };

function harvest(file, label) {
  const html = readFileSync(file, 'utf8');
  const urls = [
    ...new Set(
      [...html.matchAll(/https:[^"'\s\\)]*?wp-content\/uploads\/[^"'\s\\)]*?\.(?:jpe?g|png|webp)/gi)].map(
        (m) => m[0].split('?')[0],
      ),
    ),
  ];
  const found = {};
  for (const u of urls) {
    const f = decodeURIComponent(u.split('/').pop());
    const re = new RegExp('(?:^|[-_])' + label.toLowerCase() + '(\\d{1,3})(?=[-._ ]|$)', 'gi');
    let m;
    while ((m = re.exec(f))) {
      const n = parseInt(m[1]);
      if (n >= 1 && n <= 110 && !(label + n in found)) found[label + n] = u;
    }
  }
  return found;
}

const idx = {
  ...harvest('.messier.html', 'M'),
  ...harvest('.caldwell.html', 'C'),
};
const newKeys = Object.keys(idx).filter((k) => !(k in manifest));
console.log('index assets total:', Object.keys(idx).length, '| NEW vs manifest:', newKeys.length);
for (const k of newKeys) console.log(k, '->', idx[k].split('/').pop());
const stillMissing = [];
for (let i = 1; i <= 110; i++) if (!(idx['M' + i] || manifest['M' + i])) stillMissing.push('M' + i);
for (let i = 1; i <= 109; i++) if (!(idx['C' + i] || manifest['C' + i])) stillMissing.push('C' + i);
console.log('uncoverable from NASA showcase:', stillMissing.join(', '));
