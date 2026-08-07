import { CATALOG, DSO_TYPE, dsoFamily, FAMILY_COLOR } from './catalog';
import type { Selection } from './render';
import { bv2temp, fmtDec, fmtRa } from './sky';

export interface ObjectInfo {
  key: string;
  title: string;
  badge: string;
  kind: string;
  accent: string;
  ra: number;
  dec: number;
  fov: number;
  rows: [string, string][];
  queries: string[];
  tokens: string[];
}

export function buildInfo(sel: Selection): ObjectInfo {
  if (sel.kind === 'dso') {
    const d = CATALOG.dsos[sel.index];
    const fam = dsoFamily(d.type);
    const messier = /^M\d+$/.test(d.desig);
    const long = messier ? `Messier ${d.desig.slice(1)}` : d.desig;
    return {
      key: `dso:${d.desig}`,
      title: d.name ?? d.desig,
      badge: d.desig,
      kind: DSO_TYPE[d.type] ?? 'Deep sky object',
      accent: FAMILY_COLOR[fam],
      ra: d.ra,
      dec: d.dec,
      fov: Math.max(1.4, (d.size / 60) * 3.4),
      rows: [
        ['Right ascension', fmtRa(d.ra)],
        ['Declination', fmtDec(d.dec)],
        ['Magnitude', d.mag.toFixed(1)],
        ['Apparent size', `${d.size}′`],
        ['Constellation', d.con],
      ],
      queries: [
        d.name ? `${d.name}` : long,
        `${long}${d.name ? ` ${d.name}` : ''}`,
        long,
        d.desig,
      ].filter(Boolean),
      tokens: [d.desig, long, d.name ?? '', 'nebula', 'galaxy', 'cluster'].filter(Boolean),
    };
  }

  const s = CATALOG.stars[sel.index];
  const temp = Math.round(bv2temp(s.bv) / 50) * 50;
  return {
    key: `star:${s.name}`,
    title: s.name,
    badge: `mag ${s.mag.toFixed(2)}`,
    kind: 'Star',
    accent: '#cfe3ff',
    ra: s.ra,
    dec: s.dec,
    fov: 6,
    rows: [
      ['Right ascension', fmtRa(s.ra)],
      ['Declination', fmtDec(s.dec)],
      ['Magnitude', s.mag.toFixed(2)],
      ['Colour index B−V', s.bv.toFixed(2)],
      ['Est. temperature', `${temp.toLocaleString()} K`],
    ],
    queries: [`${s.name} star`, s.name, `${s.con} constellation`],
    tokens: [s.name, 'star', s.con],
  };
}
