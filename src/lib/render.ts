import { CATALOG, type Catalog, type Dso, dsoFamily, FAMILY_COLOR } from './catalog';
import { clamp, OUT, projectRaDec, type View, wrapLon } from './sky';

const TAU = Math.PI * 2;

export interface Layers {
  background: boolean;
  labels: boolean;
  deepSky: boolean;
}

export interface Selection {
  kind: 'dso';
  index: number;
}

interface Box {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

function fits(boxes: Box[], b: Box): boolean {
  for (const o of boxes) if (b.x0 < o.x1 && b.x1 > o.x0 && b.y0 < o.y1 && b.y1 > o.y0) return false;
  boxes.push(b);
  return true;
}

/* ------------------------------------------------------------------ */
/* NASA Hubble background image                                        */
/* ------------------------------------------------------------------ */

let bgImage: HTMLImageElement | null = null;
let bgReady = false;

const NASA_BG = 'https://science.nasa.gov/specials/apps/hubble-skymap/messier/background_image_set/';

export function getSkyTexture(): HTMLImageElement | null {
  return bgImage;
}

export function loadNasaBackground(onUpdate: () => void): void {
  if (bgImage) return;
  const load = (file: string, hi: boolean) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (hi || !bgReady) {
        bgImage = img;
        bgReady = true;
        onUpdate();
      }
    };
    img.onerror = () => {
      // fallback if NASA image fails to load
    };
    img.src = NASA_BG + file;
  };
  load('image-1.jpg', false);
  load('image.jpg', true);
}

function drawBackground(ctx: CanvasRenderingContext2D, v: View) {
  if (!bgReady || !bgImage) return;
  const skyW = 360 * v.scale;
  const skyH = 180 * v.scale;
  const topY = v.cy + (v.dec - 90) * v.scale;
  let x = v.cx + wrapLon(0 - v.ra) * v.scale;
  while (x > 0) x -= skyW;
  ctx.save();
  ctx.globalAlpha = 1;
  ctx.imageSmoothingEnabled = true;
  for (; x < v.w; x += skyW) ctx.drawImage(bgImage, x, topY, skyW, skyH);
  ctx.restore();
}

/* ------------------------------------------------------------------ */



export function dsoRadius(v: View, d: Dso): number {
  return clamp(((d.size / 60) * v.scale) / 2, 5, Math.max(5, Math.min(v.w, v.h) * 0.45));
}

function drawDsos(ctx: CanvasRenderingContext2D, v: View, cat: Catalog, labels: boolean, boxes: Box[]) {
  ctx.save();
  ctx.lineWidth = 1.3;
  ctx.font = '600 11px ui-sans-serif, system-ui, sans-serif';
  ctx.textBaseline = 'middle';
  for (const d of cat.dsos) {
    if (!projectRaDec(v, d.ra, d.dec)) continue;
    const px = OUT.x;
    const py = OUT.y;
    if (px < -60 || py < -60 || px > v.w + 60 || py > v.h + 60) continue;
    const fam = dsoFamily(d.type);
    const col = FAMILY_COLOR[fam];
    const r = dsoRadius(v, d);

    ctx.globalAlpha = 0.16;
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(px, py, r * 0.92, 0, TAU);
    ctx.fill();

    ctx.globalAlpha = 0.85;
    ctx.strokeStyle = col;
    ctx.beginPath();
    if (fam === 'galaxy') {
      ctx.ellipse(px, py, r, r * 0.56, -0.5, 0, TAU);
      ctx.stroke();
    } else if (fam === 'cluster') {
      ctx.setLineDash([2.5, 2.5]);
      ctx.arc(px, py, r, 0, TAU);
      ctx.stroke();
      ctx.setLineDash([]);
      if (d.type === 'gc') {
        ctx.beginPath();
        ctx.moveTo(px - r, py);
        ctx.lineTo(px + r, py);
        ctx.moveTo(px, py - r);
        ctx.lineTo(px, py + r);
        ctx.stroke();
      }
    } else {
      ctx.rect(px - r, py - r * 0.8, r * 2, r * 1.6);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    if (!labels) continue;
    if (v.fov > 110 && d.mag > 7) continue;
    const t = d.desig;
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
  const rr = r + 10 + Math.sin(t / 420) * 2.5;
  ctx.globalAlpha = 0.6;
  ctx.beginPath();
  ctx.arc(x, y, rr, 0, TAU);
  ctx.stroke();
  ctx.globalAlpha = 1;
  const g = rr + 8;
  ctx.beginPath();
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
    ctx.moveTo(x + dx * rr, y + dy * rr);
    ctx.lineTo(x + dx * g, y + dy * g);
  }
  ctx.stroke();
  ctx.restore();
}

export function drawSky(
  ctx: CanvasRenderingContext2D,
  v: View,
  layers: Layers,
  selected: Selection | null,
  time: number,
) {
  const cat = CATALOG;
  ctx.save();
  ctx.setTransform(v.dpr, 0, 0, v.dpr, 0, 0);
  ctx.fillStyle = '#03040a';
  ctx.fillRect(0, 0, v.w, v.h);

  if (layers.background) drawBackground(ctx, v);

  const boxes: Box[] = [];
  if (layers.deepSky) drawDsos(ctx, v, cat, layers.labels, boxes);

  if (selected && selected.kind === 'dso') {
    const d = cat.dsos[selected.index];
    if (d && projectRaDec(v, d.ra, d.dec)) drawReticle(ctx, OUT.x, OUT.y, dsoRadius(v, d), time);
  }
  ctx.restore();
}

export function pick(v: View, mx: number, my: number, layers: Layers): Selection | null {
  const cat = CATALOG;
  let best: Selection | null = null;
  let bestScore = Infinity;

  if (layers.deepSky) {
    for (let i = 0; i < cat.dsos.length; i++) {
      const d = cat.dsos[i];
      if (!projectRaDec(v, d.ra, d.dec)) continue;
      const dd = Math.hypot(OUT.x - mx, OUT.y - my);
      const reach = Math.max(22, dsoRadius(v, d));
      if (dd < reach && dd < bestScore) {
        bestScore = dd;
        best = { kind: 'dso', index: i };
      }
    }
  }

  return best;
}
