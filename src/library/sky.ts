export const DEG = Math.PI / 180;

export const wrapLon = (d: number) => (((d + 180) % 360) + 360) % 360 - 180;
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

export function makeView(): View {
  return { ra: 84, dec: -3, fov: 95, w: 1, h: 1, cx: 0.5, cy: 0.5, scale: 10, dpr: 1 };
}

export function updateView(v: View) {
  v.cx = v.w / 2;
  v.cy = v.h / 2;
  v.fov = clamp(v.fov, 0.25, 175);
  v.dec = clamp(v.dec, -85, 85);
  v.ra = wrapLon(v.ra);
  v.scale = Math.min(v.w, v.h) / v.fov;
}

export const OUT = { x: 0, y: 0, ok: false };

export function projectRaDec(v: View, ra: number, dec: number): boolean {
  OUT.x = v.cx + wrapLon(ra - v.ra) * v.scale;
  OUT.y = v.cy + (v.dec - dec) * v.scale;
  OUT.ok = OUT.x >= -200 && OUT.x <= v.w + 200 && OUT.y >= -200 && OUT.y <= v.h + 200;
  return OUT.ok;
}

export function bv2temp(bv: number): number {
  const b = clamp(bv, -0.4, 2.0);
  return 4600 * (1 / (0.92 * b + 1.7) + 1 / (0.92 * b + 0.62));
}

function temp2rgb(kelvin: number): [number, number, number] {
  const t = clamp(kelvin, 1000, 40000) / 100;
  let r: number, g: number, b: number;
  if (t <= 66) {
    r = 255;
    g = 99.4708025861 * Math.log(t) - 161.1195681661;
  } else {
    r = 329.698727446 * Math.pow(t - 60, -0.1332047592);
    g = 288.1221695283 * Math.pow(t - 60, -0.0755148492);
  }
  b = t >= 66 ? 255 : t <= 19 ? 0 : 138.5177312231 * Math.log(t - 10) - 305.0447927307;
  const f = (c: number) => Math.round(clamp(c, 0, 255) * 0.55 + 255 * 0.45);
  return [f(r), f(g), f(b)];
}

export const STAR_COLORS: string[] = Array.from({ length: 48 }, (_, i) => {
  const [r, g, b] = temp2rgb(bv2temp(-0.4 + (i / 47) * 2.4));
  return `rgb(${r},${g},${b})`;
});
