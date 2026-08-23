// One-shot probe: which catalog objects can the NASA-search fallback actually serve?
// Replicates info.ts query/token building and nasa.ts search/score/toPhoto exactly.
import { readFileSync } from 'node:fs';

const src = readFileSync('src/lib/catalog.ts', 'utf8');
const rows = [...src.matchAll(/^\['([^']+)', (null|'(?:[^'\\]|\\.)*'), '([a-z0-9]+)'/gm)].map(
  ([, desig, name, type]) => ({ desig, name: name === 'null' ? null : name.slice(1, -1), type }),
);

const manifest = JSON.parse(readFileSync('src/data/hubbleShowcase.json', 'utf8'));
const overrides = JSON.parse(readFileSync('src/data/imageOverrides.json', 'utf8'));
const ALIASES = { 'NGC 7000': 'C20', 'NGC 5139': 'C80', 'NGC 253': 'C65', 'NGC 3372': 'C92', 'NGC 6960': 'C34', 'NGC 2237': 'C49', 'NGC 4565': 'C38' };
const covered = (d) =>
  overrides[d.desig] || overrides[ALIASES[d.desig] ?? ''] || manifest[d.desig] || manifest[ALIASES[d.desig] ?? ''];

const BAD = /(illustration|artist|concept|logo|poster|briefing|conference|portrait|award|employee|administrator|ceremony)/;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function search(q) {
  try {
    const res = await fetch(
      `https://images-api.nasa.gov/search?media_type=image&page_size=12&q=${encodeURIComponent(q)}`,
      { headers: { 'User-Agent': 'Mozilla/5.0' } },
    );
    if (!res.ok) return [];
    const json = await res.json();
    return json?.collection?.items ?? [];
  } catch {
    return [];
  }
}

function score(item, tokens) {
  const d = item.data?.[0];
  if (!d) return -Infinity;
  const title = (d.title ?? '').toLowerCase();
  const hay = `${title} ${(d.keywords ?? []).join(' ')} ${d.description ?? ''}`.toLowerCase();
  let s = 0;
  for (const t of tokens) if (t) s += title.includes(t) ? 6 : hay.includes(t) ? 2 : 0;
  if (/hubble/.test(hay)) s += 3;
  if (/hubble|webb|chandra|spitzer/.test(title)) s += 2;
  if (BAD.test(hay)) s -= 8;
  return s;
}

function hasUsableMedia(item) {
  const links = (item.links ?? [])
    .map((l) => l.href)
    .filter((h) => h && /^https?:\/\//i.test(h));
  return links.length > 0;
}

const targets = rows.filter((d) => !covered(d));
console.log(`probing ${targets.length} uncovered objects...`);
const imageless = [];

for (const d of targets) {
  const messier = /^M\d+$/.test(d.desig);
  const long = messier ? `Messier ${d.desig.slice(1)}` : d.desig;
  const queries = [d.name ? d.name : `${long}${''}`, `${long}${d.name ? ` ${d.name}` : ''}`, long, d.desig].filter(Boolean);
  const tokens = [d.desig, long, d.name ?? ''].filter(Boolean).map((t) => t.toLowerCase());

  let found = null;
  for (const q of queries) {
    await sleep(300);
    const items = await search(q);
    let best = null;
    let maxS = -Infinity;
    for (const it of items) {
      const s = score(it, tokens);
      if (s > maxS) {
        maxS = s;
        best = it;
      }
    }
    if (best && maxS > 0 && hasUsableMedia(best)) {
      found = `${best.data?.[0]?.nasa_id} (${best.data?.[0]?.title})`;
      break;
    }
  }
  console.log(`${d.desig.padEnd(6)} ${found ? 'FALLBACK OK  ' : 'IMAGELESS   '} ${found ?? ''}`);
  if (!found) imageless.push(d.desig);
}

console.log('\nimageless:', imageless.join(' '));
