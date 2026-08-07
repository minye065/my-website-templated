import { CATALOG, type Catalog, type Dso, dsoFamily, FAMILY_COLOR } from './catalog';
import { clamp, OUT, projectRaDec, STAR_COLORS, type View, wrapLon } from './sky';

const TAU = Math.PI * 2;

export interface Layers {
  background: boolean;
  labels: boolean;
  deepSky: boolean;
}

export interface Selection {
  kind: 'star' | 'dso';
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


function starRadius(v: View, mag: number) {
  const zoomK = Math.pow(70 / v.fov, 0.28);
  return Math.max(1.1, (6.4 - mag) * 0.72 * zoomK);
}

function drawStars(ctx: CanvasRenderingContext2D, v: View, cat: Catalog, labels: boolean, boxes: Box[]) {
  ctx.save();
  for (const s of cat.stars) {
    if (!projectRaDec(v, s.ra, s.dec)) continue;
    const px = OUT.x;
    const py = OUT.y;
    if (px < -30 || py < -30 || px > v.w + 30 || py > v.h + 30) continue;
    const r = starRadius(v, s.mag);
    const col = STAR_COLORS[s.ci];

    const g = ctx.createRadialGradient(px, py, 0, px, py, r * 5);
    g.addColorStop(0, col.replace('rgb(', 'rgba(').replace(')', ',0.34)'));
    g.addColorStop(0.35, col.replace('rgb(', 'rgba(').replace(')', ',0.08)'));
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(px, py, r * 5, 0, TAU);
    ctx.fill();

    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(px, py, r, 0, TAU);
    ctx.fill();
  }

  if (labels) {
    const limit = v.fov > 110 ? 2.1 : v.fov > 60 ? 2.8 : v.fov > 25 ? 3.6 : 6.5;
    ctx.font = '500 11.5px ui-sans-serif, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(222,233,255,0.82)';
    for (const i of cat.named) {
      const s = cat.stars[i];
      if (s.mag > limit) break;
      if (!projectRaDec(v, s.ra, s.dec)) continue;
      const px = OUT.x;
      const py = OUT.y;
      if (px < 0 || py < 0 || px > v.w || py > v.h) continue;
      const tw = ctx.measureText(s.name).width;
      const bx = px + starRadius(v, s.mag) + 6;
      if (fits(boxes, { x0: bx - 3, y0: py - 8, x1: bx + tw + 3, y1: py + 8 })) ctx.fillText(s.name, bx, py);
    }
  }
  ctx.restore();
}

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
    const t = v.fov < 40 && d.name ? `${d.desig} · ${d.name}` : d.desig;
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
  drawStars(ctx, v, cat, layers.labels, boxes);
  if (layers.deepSky) drawDsos(ctx, v, cat, layers.labels, boxes);

  if (selected) {
    if (selected.kind === 'dso') {
      const d = cat.dsos[selected.index];
      if (d && projectRaDec(v, d.ra, d.dec)) drawReticle(ctx, OUT.x, OUT.y, dsoRadius(v, d), time);
    } else {
      const s = cat.stars[selected.index];
      if (s && projectRaDec(v, s.ra, s.dec)) drawReticle(ctx, OUT.x, OUT.y, starRadius(v, s.mag) + 3, time);
    }
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

  for (let i = 0; i < cat.stars.length; i++) {
    const s = cat.stars[i];
    if (!projectRaDec(v, s.ra, s.dec)) continue;
    const dd = Math.hypot(OUT.x - mx, OUT.y - my);
    if (dd < 18 && dd - 4 < bestScore) {
      bestScore = dd - 4;
      best = { kind: 'star', index: i };
    }
  }
  return best;
}
