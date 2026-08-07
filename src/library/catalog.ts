import starsUrl from 'd3-celestial/data/stars.6.json?url';
import starNamesUrl from 'd3-celestial/data/starnames.json?url';
import messierUrl from 'd3-celestial/data/messier.json?url';
import dsoNamesUrl from 'd3-celestial/data/dsonames.json?url';
import mwUrl from 'd3-celestial/data/mw.json?url';

export interface Stars {
  n: number;
  ra: Float32Array;
  dec: Float32Array;
  mag: Float32Array;
  ci: Uint8Array;
  hip: Int32Array;
  name: (string | null)[];
  desig: (string | null)[];
  named: number[];
}

export interface Dso {
  desig: string;
  name: string | null;
  type: string;
  mag: number;
  dim: string;
  ra: number;
  dec: number;
  messier: number | null;
}

export interface MwLevel {
  level: number;
  rings: Float32Array[];
}

export interface Catalog {
  stars: Stars;
  dsos: Dso[];
  mw: MwLevel[];
}

export const DSO_TYPE: Record<string, string> = {
  gg: 'Galaxy cluster', g: 'Galaxy', s: 'Spiral galaxy', s0: 'Lenticular galaxy',
  sd: 'Dwarf spheroidal galaxy', i: 'Irregular galaxy', e: 'Elliptical galaxy',
  oc: 'Open cluster', gc: 'Globular cluster', dn: 'Dark nebula', bn: 'Bright nebula',
  sfr: 'Star forming region', rn: 'Reflection nebula', en: 'Emission nebula',
  pn: 'Planetary nebula', snr: 'Supernova remnant',
};

export function dsoFamily(type: string): 'galaxy' | 'cluster' | 'nebula' {
  if (['g', 'gg', 's', 's0', 'sd', 'i', 'e'].includes(type)) return 'galaxy';
  if (['oc', 'gc'].includes(type)) return 'cluster';
  return 'nebula';
}

export const FAMILY_COLOR: Record<string, string> = {
  galaxy: '#ffb877', cluster: '#8fe3ff', nebula: '#ff8fd0',
};

async function getJSON<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`failed to load ${url}`);
  return (await res.json()) as T;
}

function ringToRaDec(coords: number[][]): Float32Array {
  const out = new Float32Array(coords.length * 2);
  for (let i = 0; i < coords.length; i++) {
    out[i * 2] = coords[i][0];
    out[i * 2 + 1] = coords[i][1];
  }
  return out;
}

const norm = (s: string) => s.replace(/\s+/g, '').toUpperCase();

export async function loadCatalog(onProgress?: (p: number) => void): Promise<Catalog> {
  let done = 0;
  const tick = <T,>(p: Promise<T>) => p.then((v) => (onProgress?.(++done / 5), v));

  const [starsRaw, starNames, messierRaw, dsoNames, mwRaw] = await Promise.all([
    tick(getJSON<any>(starsUrl)), tick(getJSON<any>(starNamesUrl)),
    tick(getJSON<any>(messierUrl)), tick(getJSON<any>(dsoNamesUrl)), tick(getJSON<any>(mwUrl)),
  ]);

  const feats: any[] = starsRaw.features;
  const n = feats.length;
  const stars: Stars = {
    n, ra: new Float32Array(n), dec: new Float32Array(n), mag: new Float32Array(n),
    ci: new Uint8Array(n), hip: new Int32Array(n),
    name: new Array(n).fill(null), desig: new Array(n).fill(null), named: [],
  };
  for (let i = 0; i < n; i++) {
    const f = feats[i];
    const c = f.geometry.coordinates;
    stars.ra[i] = c[0];
    stars.dec[i] = c[1];
    stars.mag[i] = f.properties.mag;
    const bv = typeof f.properties.bv === 'number' ? f.properties.bv : 0.65;
    stars.ci[i] = clamp(Math.round(((bv + 0.4) / 2.4) * 47), 0, 47);
    const hip = typeof f.id === 'number' ? f.id : parseInt(f.id, 10) || 0;
    stars.hip[i] = hip;
    const nm = starNames[String(hip)];
    if (nm) {
      if (nm.name) { stars.name[i] = nm.name; stars.named.push(i); }
      if (nm.desig) stars.desig[i] = nm.desig;
    }
  }
  stars.named.sort((a, b) => stars.mag[a] - stars.mag[b]);

  const nameByKey: Record<string, string> = {};
  for (const k of Object.keys(dsoNames)) {
    const v = dsoNames[k];
    if (v?.name) nameByKey[norm(k)] = v.name;
  }
  const dsos: Dso[] = (messierRaw.features as any[]).map((f) => {
    const c = f.geometry.coordinates;
    const id = String(f.id ?? '');
    const desig = String(f.properties.desig ?? id);
    const mNum = /^M\s*(\d+)$/i.exec(desig.trim()) ?? /^M\s*(\d+)$/i.exec(id.trim());
    const messier = mNum ? parseInt(mNum[1], 10) : null;
    return {
      desig: messier != null ? `M ${messier}` : desig,
      name: nameByKey[norm(id)] ?? nameByKey[norm(desig)] ?? null,
      type: String(f.properties.type ?? ''),
      mag: typeof f.properties.mag === 'number' ? f.properties.mag : 999,
      dim: String(f.properties.dim ?? ''),
      ra: c[0], dec: c[1], messier,
    };
  });
  dsos.sort((a, b) => (a.messier ?? 999) - (b.messier ?? 999));

  const mw: MwLevel[] = (mwRaw.features as any[]).map((f, idx) => {
    const rings: Float32Array[] = [];
    const g = f.geometry;
    const polys: any[] = g.type === 'MultiPolygon' ? g.coordinates : [g.coordinates];
    for (const poly of polys) for (const ring of poly) rings.push(ringToRaDec(ring));
    const m = /(\d+)/.exec(String(f.id ?? ''));
    return { level: m ? parseInt(m[1], 10) : idx + 1, rings };
  }).sort((a, b) => a.level - b.level);

  return { stars, dsos, mw };
}

function clamp(v: number, lo: number, hi: number) {
  return v < lo ? lo : v > hi ? hi : v;
}
