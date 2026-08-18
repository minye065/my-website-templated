export const wrapLon = (d: number) => ((((d + 180) % 360) + 360) % 360) - 180;
export const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);

export interface View {
  ra: number;
  dec: number;
  fov: number;
  w: number;
  h: number;
  cx: number;
  cy: number;
  scale: number;
  dpr: number;
}

export const HOME = { ra: 84, dec: -3, fov: 95 };

export function makeView(): View {
  return { ...HOME, w: 1, h: 1, cx: 0.5, cy: 0.5, scale: 10, dpr: 1 };
}

export function updateView(v: View) {
  v.cx = v.w / 2;
  v.cy = v.h / 2;
  v.fov = clamp(v.fov, 0.4, 175);
  v.dec = clamp(v.dec, -88, 88);
  v.ra = wrapLon(v.ra);
  v.scale = Math.min(v.w, v.h) / v.fov;
}

export const OUT = { x: 0, y: 0, ok: false };

/** Simple plate-carrée projection: fast, wraps cleanly, good enough for a map. */
export function projectRaDec(v: View, ra: number, dec: number): boolean {
  OUT.x = v.cx + wrapLon(ra - v.ra) * v.scale;
  OUT.y = v.cy + (v.dec - dec) * v.scale;
  OUT.ok = OUT.x >= -220 && OUT.x <= v.w + 220 && OUT.y >= -220 && OUT.y <= v.h + 220;
  return OUT.ok;
}

function tempToRgb(kelvin: number): [number, number, number] {
  const t = clamp(kelvin, 1500, 40000) / 100;
  let r: number, g: number, b: number;
  if (t <= 66) {
    r = 255;
    g = 99.47 * Math.log(t) - 161.12;
    b = t <= 19 ? 0 : 138.52 * Math.log(t - 10) - 305.04;
  } else {
    r = 329.7 * Math.pow(t - 60, -0.1332);
    g = 288.12 * Math.pow(t - 60, -0.0755);
    b = 255;
  }
  // pull toward white a bit so faint stars read well on dark background
  const mix = (c: number) => Math.round(clamp(c * 0.82 + 255 * 0.18, 0, 255));
  return [mix(r), mix(g), mix(b)];
}

const RA_GP = 192.85948 * DEG;
const DEC_GP = 27.12825 * DEG;
const L_NCP = 122.93192 * DEG;
export function fmtRa(ra: number): string {
  const r = ((ra % 360) + 360) % 360;
  const hours = r / 15;
  const h = Math.floor(hours);
  const m = Math.floor((hours - h) * 60);
  const s = Math.round(((hours - h) * 60 - m) * 60);
  return `${h}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
}

export function fmtDec(dec: number): string {
  const sign = dec < 0 ? '-' : '+';
  const a = Math.abs(dec);
  const d = Math.floor(a);
  const m = Math.floor((a - d) * 60);
  const s = Math.round(((a - d) * 60 - m) * 60);
  return `${sign}${d}° ${String(m).padStart(2, '0')}′ ${String(s).padStart(2, '0')}″`;
}