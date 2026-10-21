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

export function updateView(v: View)
{
  v.cx = v.w / 2;
  v.cy = v.h / 2;
  const maxFov = Math.min(v.w, v.h) / Math.max(v.w / 360, v.h / 180);
  v.fov = clamp(v.fov, 0.4, Math.min(175, maxFov));
  v.scale = Math.min(v.w, v.h) / v.fov;
  const halfW = v.cx / v.scale;
  const halfH = v.cy / v.scale;
  v.ra = clamp(v.ra, halfW, 360 - halfW);
  v.dec = clamp(v.dec, -90 + halfH, 90 - halfH);
}

export const OUT = { x: 0, y: 0, ok: false };

export function projectRaDec(v: View, ra: number, dec: number): boolean {
  OUT.x = v.cx + (ra - v.ra) * v.scale;
  OUT.y = v.cy + (v.dec - dec) * v.scale;
  OUT.ok = OUT.x >= -220 && OUT.x <= v.w + 220 && OUT.y >= -220 && OUT.y <= v.h + 220;
  return OUT.ok;
}

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
