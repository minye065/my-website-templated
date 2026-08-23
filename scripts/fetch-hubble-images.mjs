// One-shot scraper for the official Hubble Messier/Caldwell catalog showcases.
// Writes src/data/hubbleShowcase.json: { "M1": { url, title, source }, ... }
// Re-run any time to refresh the manifest.

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = 'https://science.nasa.gov/mission/hubble/science/explore-the-night-sky';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36';
const DELAY_MS = 300;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.text();
}

function extractSlugs(html, kind) {
  const re = new RegExp(`href="[^"]*hubble-${kind}-catalog/(${kind}-(\\d+))/"`, 'gi');
  const found = new Map();
  let m;
  while ((m = re.exec(html))) found.set(Number(m[2]), m[1]);
  return [...found.entries()].sort((a, b) => a[0] - b[0]);
}

function extractMeta(html, prop) {
  const re = new RegExp(`<meta property="${prop}" content="([^"]*)"`, 'i');
  const m = re.exec(html);
  return m ? m[1].replace(/ - NASA Science$/, '').trim() : null;
}

const indexUrl = (kind) => `${BASE}/hubble-${kind}-catalog/`;

// Some showcase objects have no detail page but appear as carousel slides on the
// index, with assets named by catalog number (e.g. c60-61-1-jpg.webp -> C60+C61).
function harvestIndexAssets(html, kind) {
  const prefix = kind === 'messier' ? 'm' : 'c';
  const label = kind === 'messier' ? 'Messier' : 'Caldwell';
  const urls = [
    ...new Set(
      [...html.matchAll(/https:[^"'\s\\)]*?wp-content\/uploads\/[^"'\s\\)]*?\.(?:jpe?g|png|webp)/gi)].map(
        (m) => m[0].split('?')[0],
      ),
    ),
  ];
  const found = {};
  for (const url of urls) {
    const f = decodeURIComponent(url.split('/').pop());
    const m = new RegExp(`(?:^|[-_])${prefix}(\\d{1,3})(?:-(\\d{1,3}))?(?=[-._ ]|$)`, 'i').exec(f);
    if (!m) continue;
    const nums = [parseInt(m[1])];
    if (m[2] && parseInt(m[2]) > nums[0] && parseInt(m[2]) <= 110) nums.push(parseInt(m[2]));
    for (const n of nums) {
      const key = `${prefix.toUpperCase()}${n}`;
      if (!(key in found)) found[key] = { url, title: `${label} ${n}`, source: indexUrl(kind) };
    }
  }
  return found;
}

const outDir = resolve(dirname(fileURLToPath(import.meta.url)), '../src/data');
mkdirSync(outDir, { recursive: true });

const manifest = {};
const allFailed = [];

for (const kind of ['messier', 'caldwell']) {
  console.log(`index: ${indexUrl(kind)}`);
  const indexHtml = await get(indexUrl(kind));
  const slugs = extractSlugs(indexHtml, kind);
  console.log(`  ${slugs.length} object pages linked`);

  const fromIndex = harvestIndexAssets(indexHtml, kind);

  const failed = [];
  for (const [num, slug] of slugs) {
    await sleep(DELAY_MS);
    const source = `${BASE}/hubble-${kind}-catalog/${slug}/`;
    try {
      const html = await get(source);
      const url = extractMeta(html, 'og:image');
      const title = extractMeta(html, 'og:title');
      if (!url) throw new Error('no og:image');
      manifest[`${kind === 'messier' ? 'M' : 'C'}${num}`] = { url, title: title ?? slug, source };
    } catch (e) {
      failed.push(`${slug}: ${e.message}`);
    }
  }
  console.log(`  captured ${slugs.length - failed.length}/${slugs.length}`);

  // slide-only objects (no detail page): fall back to index carousel assets
  let fromSlides = 0;
  for (const [key, entry] of Object.entries(fromIndex)) {
    if (!(key in manifest)) {
      manifest[key] = entry;
      fromSlides++;
    }
  }
  if (fromSlides) console.log(`  +${fromSlides} slide-only objects recovered from index`);
  if (failed.length) allFailed.push(...failed);
}

const file = resolve(outDir, 'hubbleShowcase.json');
writeFileSync(file, JSON.stringify(manifest, null, 2) + '\n');
console.log(`wrote ${Object.keys(manifest).length} entries -> ${file}`);
if (allFailed.length) console.log(`FAILED (${allFailed.length}): ${allFailed.join('; ')}`);
