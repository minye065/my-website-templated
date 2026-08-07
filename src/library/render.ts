import type { Catalog, Dso } from './catalog';
import { dsoFamily, FAMILY_COLOR } from './catalog';
import { OUT, projectRaDec, STAR_COLORS, View, clamp, wrapLon } from './sky';

const TAU = 6.283185307179586;

export interface Layers {
  background: boolean;
  milkyway: boolean;
  labels: boolean;
  deepSky: boolean;
}

export interface Selection {
  kind: 'star' | 'dso';
  index: number;
}

interface Box { x0: number; y0: number; x1: number; y1: number }

function fits(boxes: Box[], b: Box): boolean {
  for (const o of boxes) if (b.x0 < o.x1 && b.x1 > o.x0 && b.y0 < o.y1 && b.y1 > o.y0) return false;
  boxes.push(b);
  return true;
}

const NASA_BG = 'https://science.nasa.gov/specials/apps/hubble-skymap/messier//background_image_set/';
let bgImage: HTMLImageElement | null = null;
let bgReady = false;

export function loadNasaBackground(onUpdate: () => void): void {
  if (bgImage) return;
  const load = (file: string, hi: boolean) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (hi || !bgReady) { bgImage = img; bgReady = true; onUpdate(); }
    };
    img.src = NASA_BG + file;
  };
  load('image-1.jpg', false);
  load('image.jpg', true);
}

function drawNasaBackground(ctx: CanvasRenderingContext2D, v: View) {
  if (!bgReady || !bgImage) return;
  const skyW = 360 * v.scale;
  const skyH = 180 * v.scale;
  const topY = v.cy + (v.dec - 90) * v.scale;
  let x = v.cx + wrapLon(-180 - v.ra) * v.scale;
  while (x > 0) x -= skyW;
  for (; x < v.w; x += skyW) ctx.drawImage(bgImage, x, topY, skyW, skyH);
}

function strokeRing(ctx: CanvasRenderingContext2D, v: View, ring: Float32Array, close: boolean) {
  const n = ring.length / 2;
  let pen = false, prevRa = 0;
  for (let i = 0; i < n; i++) {
    const ra = ring[i * 2], dec = ring[i * 2 + 1];
    if (!projectRaDec(v, ra, dec)) { if (!close) pen = false; continue; }
    if ((pen && Math.abs(ra - prevRa) < 180) || (close && pen)) ctx.lineTo(OUT.x, OUT.y);
    else { ctx.moveTo(OUT.x, OUT.y); pen = true; }
    prevRa = ra;
  }
  if (close && pen) ctx.closePath();
}

function drawMilkyWay(ctx: CanvasRenderingContext2D, v: View, cat: Catalog) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const lvl of cat.mw) {
    ctx.fillStyle = `rgba(150,172,236,${(0.016 + lvl.level * 0.012).toFixed(3)})`;
    ctx.beginPath();
    for (const ring of lvl.rings) if (ring.length >= 6) strokeRing(ctx, v, ring, true);
    ctx.fill();
  }
  ctx.restore();
}

function drawStars(ctx: CanvasRenderingContext2D, v: View, cat: Catalog, labels: boolean, boxes: Box[]) {
  const s = cat.stars;
  const zoomK = Math.pow(70 / v.fov, 0.3);
  const { w, h } = v;
  const bright: number[] = [];

  for (let i = 0; i < s.n; i++) {
    // Skip stars without names or designations (random unnamed points)
    if (!s.name[i] && !s.desig[i]) continue;

    if (!projectRaDec(v, s.ra[i], s.dec[i])) continue;
    const px = OUT.x, py = OUT.y;
    if (px < -20 || py < -20 || px > w + 20 || py > h + 20) continue;
    let r = (6.9 - s.mag[i]) * 0.34 * zoomK;
    let a = 1;
    if (r < 0.8) { a = clamp(r / 0.8, 0.14, 1); r = 0.8; }
    ctx.globalAlpha = a;
    ctx.fillStyle = STAR_COLORS[s.ci[i]];
    ctx.beginPath();
    ctx.arc(px, py, r, 0, TAU);
    ctx.fill();
    if (r > 2) bright.push(i, px, py, r);
  }
  ctx.globalAlpha = 1;

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let k = 0; k < bright.length; k += 4) {
    const i = bright[k], px = bright[k + 1], py = bright[k + 2], r = bright[k + 3];
    const g = ctx.createRadialGradient(px, py, 0, px, py, r * 4.2);
    const col = STAR_COLORS[s.ci[i]];
    g.addColorStop(0, col.replace('rgb', 'rgba').replace(')', ',0.42)'));
    g.addColorStop(0.4, col.replace('rgb', 'rgba').replace(')', ',0.10)'));
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(px, py, r * 4.2, 0, TAU);
    ctx.fill();
  }
  ctx.restore();

  if (!labels) return;
  const labelLimit = v.fov > 100 ? 1.8 : v.fov > 55 ? 2.6 : v.fov > 22 ? 3.4 : v.fov > 8 ? 4.4 : 6.5;
  ctx.save();
  ctx.font = '500 11.5px ui-sans-serif, system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(226,236,255,0.85)';
  for (const i of s.named) {
    if (s.mag[i] > labelLimit) break;
    if (!projectRaDec(v, s.ra[i], s.dec[i])) continue;
    const px = OUT.x, py = OUT.y;
    if (px < 0 || py < 0 || px > w || py > h) continue;
    const t = s.name[i]!;
    const tw = ctx.measureText(t).width;
    const bx = px + 7;
    if (fits(boxes, { x0: bx - 3, y0: py - 8, x1: bx + tw + 3, y1: py + 8 })) ctx.fillText(t, bx, py);
  }
  ctx.restore();
}

function dsoRadius(v: View, d: Dso): number {
  const m = /([\d.]+)/.exec(d.dim);
  const arcmin = m ? parseFloat(m[1]) : 6;
  return clamp(((arcmin / 60) * v.scale) / 2, 4.5, Math.max(4.5, Math.min(v.w, v.h) * 0.45));
}

function drawDsos(ctx: CanvasRenderingContext2D, v: View, cat: Catalog, labels: boolean, boxes: Box[]) {
  ctx.save();
  ctx.lineWidth = 1.4;
  ctx.font = '600 11px ui-sans-serif, system-ui, sans-serif';
  ctx.textBaseline = 'middle';
  for (const d of cat.dsos) {
    if (!projectRaDec(v, d.ra, d.dec)) continue;
    const px = OUT.x, py = OUT.y;
    if (px < -40 || py < -40 || px > v.w + 40 || py > v.h + 40) continue;
    const fam = dsoFamily(d.type);
    const col = FAMILY_COLOR[fam];
    const r = dsoRadius(v, d);
    ctx.strokeStyle = col;
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    if (fam === 'galaxy') {
      ctx.ellipse(px, py, r, r * 0.58, -0.5, 0, TAU);
      ctx.stroke();
    } else if (fam === 'cluster') {
      ctx.setLineDash([2.5, 2.5]);
      ctx.arc(px, py, r, 0, TAU);
      ctx.stroke();
      ctx.setLineDash([]);
      if (d.type === 'gc') {
        ctx.beginPath();
        ctx.moveTo(px - r, py); ctx.lineTo(px + r, py);
        ctx.moveTo(px, py - r); ctx.lineTo(px, py + r);
        ctx.stroke();
      }
    } else {
      ctx.rect(px - r, py - r * 0.8, r * 2, r * 1.6);
      ctx.stroke();
    }
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(px, py, r * 0.9, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 1;

    if (!labels || (v.fov > 110 && (d.mag > 7 || d.mag === 999))) continue;
    const t = v.fov < 45 && d.name ? `${d.desig} · ${d.name}` : d.desig;
    ctx.textAlign = 'center';
    const tw = ctx.measureText(t).width;
    const ly = py + r + 9;
    if (!fits(boxes, { x0: px - tw / 2 - 3, y0: ly - 7, x1: px + tw / 2 + 3, y1: ly + 7 })) continue;
    ctx.fillStyle = col;
    ctx.globalAlpha = 0.95;
    ctx.fillText(t, px, ly);
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

function drawReticle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, t: number) {
  ctx.save();
  ctx.strokeStyle = 'rgba(120,255,225,0.95)';
  ctx.lineWidth = 1.5;
  const rr = r + 8 + Math.sin(t / 420) * 2;
  ctx.globalAlpha = 0.55;
  ctx.beginPath();
  ctx.arc(x, y, rr, 0, TAU);
  ctx.stroke();
  ctx.globalAlpha = 1;
  const g = rr + 7;
  ctx.beginPath();
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
    ctx.moveTo(x + dx * rr, y + dy * rr);
    ctx.lineTo(x + dx * g, y + dy * g);
  }
  ctx.stroke();
  ctx.restore();
}

export function drawSky(
  ctx: CanvasRenderingContext2D, v: View, cat: Catalog,
  layers: Layers, selected: Selection | null, time: number,
) {
  ctx.save();
  ctx.setTransform(v.dpr, 0, 0, v.dpr, 0, 0);
  ctx.clearRect(0, 0, v.w, v.h);
  ctx.fillStyle = '#03040a';
  ctx.fillRect(0, 0, v.w, v.h);

  if (layers.background) drawNasaBackground(ctx, v);
  if (layers.milkyway) drawMilkyWay(ctx, v, cat);

  const boxes: Box[] = [];
  drawStars(ctx, v, cat, layers.labels, boxes);
  if (layers.deepSky) drawDsos(ctx, v, cat, layers.labels, boxes);

  if (selected) {
    if (selected.kind === 'dso') {
      const d = cat.dsos[selected.index];
      if (d && projectRaDec(v, d.ra, d.dec)) drawReticle(ctx, OUT.x, OUT.y, dsoRadius(v, d), time);
    } else {
      const s = cat.stars, i = selected.index;
      if (projectRaDec(v, s.ra[i], s.dec[i])) drawReticle(ctx, OUT.x, OUT.y, 6, time);
    }
  }
  ctx.restore();
}

export function pick(v: View, cat: Catalog, mx: number, my: number, layers: Layers): Selection | null {
  let best: Selection | null = null;
  let bestD = 24 * 24;
  if (layers.deepSky) {
    for (let i = 0; i < cat.dsos.length; i++) {
      const d = cat.dsos[i];
      if (!projectRaDec(v, d.ra, d.dec)) continue;
      const dd = (OUT.x - mx) ** 2 + (OUT.y - my) ** 2;
      if (dd < bestD) { bestD = dd; best = { kind: 'dso', index: i }; }
    }
  }
  const s = cat.stars;
  let starD = 20 * 20;
  let starBest: Selection | null = null;
  for (let i = 0; i < s.n; i++) {
    if (s.mag[i] > 5.2 || !projectRaDec(v, s.ra[i], s.dec[i])) continue;
    const dd = (OUT.x - mx) ** 2 + (OUT.y - my) ** 2;
    const w = dd + s.mag[i] * 6;
    if (dd < 400 && w < starD) { starD = w; starBest = { kind: 'star', index: i }; }
  }
  if (starBest && (!best || starD < bestD)) return starBest;
  return best ?? starBest;
}
