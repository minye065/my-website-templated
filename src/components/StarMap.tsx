import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  loadCatalog, type Catalog, type Dso, DSO_TYPE, dsoFamily, FAMILY_COLOR,
} from '../library/catalog';
import { drawSky, loadNasaBackground, pick, type Layers, type Selection } from '../library/render';
import { clamp, makeView, updateView, wrapLon, bv2temp } from '../library/sky';
import InfoPanel from './InfoPanel';

interface Target {
  key: string;
  label: string;
  sub: string;
  ra: number;
  dec: number;
  fov: number;
  sel: Selection | null;
}

const LAYER_LABELS: { key: keyof Layers; label: string }[] = [
  { key: 'background', label: 'Background' },
  { key: 'constellations', label: 'Constellations' },
  { key: 'deepSky', label: 'Deep sky' },
  { key: 'grid', label: 'Grid' },
  { key: 'labels', label: 'Labels' },
];

const HOME = { ra: 84, dec: -3, fov: 95 };

export default function StarMap() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewRef = useRef(makeView());
  const dirty = useRef(true);
  const anim = useRef<{ t0: number; from: [number, number, number]; to: [number, number, number] } | null>(null);

  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Selection | null>(null);
  const [hud, setHud] = useState(HOME);
  const [query, setQuery] = useState('');
  const [layers, setLayers] = useState<Layers>({
    background: true, milkyway: false, constellations: true, grid: false, labels: true, deepSky: true,
  });

  const selRef = useRef<Selection | null>(null);
  selRef.current = selected;
  const layersRef = useRef(layers);
  layersRef.current = layers;

  useEffect(() => {
    let alive = true;
    loadNasaBackground(() => { if (alive) dirty.current = true; });
    loadCatalog((p) => alive && setProgress(p))
      .then((c) => { if (alive) { setCatalog(c); dirty.current = true; } })
      .catch((e) => alive && setError(String(e?.message ?? e)));
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    const el = wrapRef.current, cv = canvasRef.current;
    if (!el || !cv) return;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      const v = viewRef.current;
      v.w = r.width;
      v.h = r.height;
      v.dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.round(r.width * v.dpr);
      cv.height = Math.round(r.height * v.dpr);
      cv.style.width = `${r.width}px`;
      cv.style.height = `${r.height}px`;
      updateView(v);
      dirty.current = true;
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    let raf = 0, hudTick = 0, pulseTick = 0;
    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      const v = viewRef.current;
      if (anim.current) {
        const a = anim.current;
        const k = clamp((t - a.t0) / 900, 0, 1);
        const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
        v.ra = wrapLon(a.from[0] + wrapLon(a.to[0] - a.from[0]) * e);
        v.dec = a.from[1] + (a.to[1] - a.from[1]) * e;
        v.fov = a.from[2] * Math.pow(a.to[2] / a.from[2], e);
        updateView(v);
        dirty.current = true;
        if (k >= 1) anim.current = null;
      }
      if (selRef.current && t - pulseTick > 70) { pulseTick = t; dirty.current = true; }
      if (!dirty.current || !catalog) return;
      dirty.current = false;
      const ctx = canvasRef.current?.getContext('2d');
      if (!ctx) return;
      drawSky(ctx, v, catalog, layersRef.current, selRef.current, t);
      if (t - hudTick > 120) {
        hudTick = t;
        setHud((h) =>
          h.ra === v.ra && h.dec === v.dec && h.fov === v.fov ? h : { ra: v.ra, dec: v.dec, fov: v.fov });
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [catalog]);

  useEffect(() => { dirty.current = true; }, [layers, selected]);

  const panPixels = useCallback((dx: number, dy: number) => {
    const v = viewRef.current;
    v.ra -= dx / v.scale;
    v.dec += dy / v.scale;
    updateView(v);
    dirty.current = true;
  }, []);

  const zoomAt = useCallback((factor: number, mx?: number, my?: number) => {
    const v = viewRef.current;
    const before = v.fov;
    v.fov = clamp(v.fov * factor, 0.25, 175);
    updateView(v);
    if (mx != null && my != null && before !== v.fov) {
      const f = 1 - before / v.fov;
      panPixels((mx - v.cx) * f, (my - v.cy) * f);
    }
    anim.current = null;
    dirty.current = true;
  }, [panPixels]);

  const flyTo = useCallback((ra: number, dec: number, fov: number) => {
    const v = viewRef.current;
    anim.current = { t0: performance.now(), from: [v.ra, v.dec, v.fov], to: [ra, dec, clamp(fov, 0.25, 175)] };
  }, []);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const pts = new Map<number, { x: number; y: number }>();
    let moved = 0, downAt = 0, pinch = 0;
    const local = (e: PointerEvent) => {
      const r = cv.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const onDown = (e: PointerEvent) => {
      cv.setPointerCapture(e.pointerId);
      pts.set(e.pointerId, local(e));
      if (pts.size === 1) { moved = 0; downAt = performance.now(); anim.current = null; }
      if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch = Math.hypot(a.x - b.x, a.y - b.y); }
    };
    const onMove = (e: PointerEvent) => {
      const p = local(e), prev = pts.get(e.pointerId);
      if (!prev) return;
      pts.set(e.pointerId, p);
      if (pts.size === 1) {
        moved += Math.abs(p.x - prev.x) + Math.abs(p.y - prev.y);
        panPixels(p.x - prev.x, p.y - prev.y);
      } else if (pts.size === 2) {
        const [a, b] = [...pts.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinch > 0 && d > 0) zoomAt(pinch / d, (a.x + b.x) / 2, (a.y + b.y) / 2);
        pinch = d;
        moved += 10;
      }
    };
    const onUp = (e: PointerEvent) => {
      const p = pts.get(e.pointerId);
      pts.delete(e.pointerId);
      if (pts.size < 2) pinch = 0;
      if (p && moved < 6 && performance.now() - downAt < 700 && catalog)
        setSelected(pick(viewRef.current, catalog, p.x, p.y, layersRef.current));
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = cv.getBoundingClientRect();
      zoomAt(Math.exp(clamp(e.deltaY, -120, 120) * 0.0016), e.clientX - r.left, e.clientY - r.top);
    };
    cv.addEventListener('pointerdown', onDown);
    cv.addEventListener('pointermove', onMove);
    cv.addEventListener('pointerup', onUp);
    cv.addEventListener('pointercancel', onUp);
    cv.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      cv.removeEventListener('pointerdown', onDown);
      cv.removeEventListener('pointermove', onMove);
      cv.removeEventListener('pointerup', onUp);
      cv.removeEventListener('pointercancel', onUp);
      cv.removeEventListener('wheel', onWheel);
    };
  }, [catalog, panPixels, zoomAt]);

  const targets = useMemo<Target[]>(() => {
    if (!catalog) return [];
    const out: Target[] = [];
    catalog.dsos.forEach((d, i) => out.push({
      key: `d${i}`, label: d.name ? `${d.desig} — ${d.name}` : d.desig,
      sub: DSO_TYPE[d.type] ?? 'Deep-sky object', ra: d.ra, dec: d.dec, fov: 3.2,
      sel: { kind: 'dso', index: i },
    }));
    const s = catalog.stars;
    for (const i of s.named.slice(0, 260)) out.push({
      key: `s${i}`, label: s.name[i]!,
      sub: `Star · ${s.desig[i] ?? `HIP ${s.hip[i]}`} · mag ${s.mag[i].toFixed(2)}`,
      ra: s.ra[i], dec: s.dec[i], fov: 12, sel: { kind: 'star', index: i },
    });
    catalog.constellations.forEach((c, i) => out.push({
      key: `c${i}`, label: c.name, sub: `Constellation · ${c.id}`,
      ra: c.ra, dec: c.dec, fov: 46, sel: null,
    }));
    return out;
  }, [catalog]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const compact = q.replace(/\s+/g, '');
    return targets
      .map((t) => {
        const l = t.label.toLowerCase(), lc = l.replace(/\s+/g, '');
        const s = lc.startsWith(compact) ? 0 : l.includes(q) ? 1 : lc.includes(compact) ? 2 : -1;
        return { t, s };
      })
      .filter((r) => r.s >= 0)
      .sort((a, b) => a.s - b.s || a.t.label.length - b.t.label.length)
      .slice(0, 8)
      .map((r) => r.t);
  }, [targets, query]);

  const goTo = useCallback((t: Target) => {
    flyTo(t.ra, t.dec, t.fov);
    setSelected(t.sel);
    setQuery('');
  }, [flyTo]);

  const selInfo = useMemo(() => {
    if (!catalog || !selected) return null;
    if (selected.kind === 'dso') {
      const d: Dso = catalog.dsos[selected.index];
      const queries: string[] = [], tokens: string[] = [];
      if (d.name) { queries.push(`${d.name} Hubble`, d.name); tokens.push(d.name); }
      if (d.messier != null) {
        queries.push(`Messier ${d.messier} Hubble`, `M${d.messier} ${DSO_TYPE[d.type] ?? ''}`);
        tokens.push(`messier ${d.messier}`, `m${d.messier}`, `messier${d.messier}`);
      }
      queries.push(`${d.desig} Hubble`);
      tokens.push(d.desig.toLowerCase());
      return {
        key: `dso:${d.desig}`, title: d.name ?? d.desig, badge: d.desig,
        kind: DSO_TYPE[d.type] ?? 'Deep-sky object', accent: FAMILY_COLOR[dsoFamily(d.type)],
        rows: [
          ['Apparent magnitude', d.mag === 999 ? '—' : d.mag.toFixed(1)],
          ['Apparent size', d.dim ? `${d.dim}′` : '—'],
          ['Catalogue', d.messier != null ? `Messier ${d.messier}` : d.desig],
        ] as [string, string][],
        queries, tokens,
      };
    }
    const s = catalog.stars, i = selected.index, name = s.name[i];
    const t = bv2temp(-0.4 + (s.ci[i] / 47) * 2.4);
    return {
      key: `star:${s.hip[i]}`, title: name ?? s.desig[i] ?? `HIP ${s.hip[i]}`,
      badge: s.desig[i] ?? `HIP ${s.hip[i]}`, kind: 'Star', accent: '#cfe0ff',
      rows: [
        ['Apparent magnitude', s.mag[i].toFixed(2)],
        ['Colour temperature', `≈ ${Math.round(t / 50) * 50} K`],
        ['Hipparcos ID', `HIP ${s.hip[i]}`],
      ] as [string, string][],
      queries: name ? [`${name} star Hubble`, `${name} star`] : [`HIP ${s.hip[i]}`],
      tokens: name ? [name] : [`hip ${s.hip[i]}`],
    };
  }, [catalog, selected]);

  const zoomLabel = hud.fov >= 1 ? `${hud.fov.toFixed(hud.fov < 10 ? 1 : 0)}°` : `${(hud.fov * 60).toFixed(0)}′`;

  return (
    <div ref={wrapRef} className="relative h-full w-full overflow-hidden bg-[#03040a] select-none">
      <canvas ref={canvasRef} className="absolute inset-0 block cursor-grab touch-none active:cursor-grabbing" />

      {!catalog && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className="text-center">
            <div className="mb-3 font-mono text-[11px] tracking-[0.25em] text-sky-200/70">
              {error ? 'CATALOGUE ERROR' : 'LOADING CATALOGUES'}
            </div>
            <div className="mx-auto h-px w-56 overflow-hidden bg-white/10">
              <div className="h-full bg-sky-300/80 transition-[width] duration-300"
                style={{ width: `${Math.round(progress * 100)}%` }} />
            </div>
            <div className="mt-3 font-mono text-[10px] text-white/35">
              {error ?? 'Hipparcos · Messier · IAU figures · Milky Way isophotes'}
            </div>
          </div>
        </div>
      )}

      <div className="pointer-events-none absolute top-0 left-0 z-20 flex w-full items-start justify-between gap-3 p-3 sm:p-4">
        <div className="pointer-events-auto w-[58%] max-w-sm min-w-[9rem]">
          <div className="relative">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && results[0]) goTo(results[0]);
                if (e.key === 'Escape') setQuery('');
              }}
              placeholder="Search…"
              className="w-full rounded-md border border-white/10 bg-zinc-950/80 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 outline-none backdrop-blur-md transition focus:border-white/30 focus:ring-1 focus:ring-white/20"
            />
            {results.length > 0 && (
              <ul className="absolute top-full left-0 z-30 mt-1.5 w-full overflow-hidden rounded-lg border border-white/12 bg-black/85 backdrop-blur-xl">
                {results.map((t) => (
                  <li key={t.key}>
                    <button onClick={() => goTo(t)} className="block w-full px-3 py-2 text-left hover:bg-white/10">
                      <div className="text-[13px] text-white/90">{t.label}</div>
                      <div className="font-mono text-[10px] text-white/40">{t.sub}</div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="pointer-events-auto flex flex-1 flex-wrap justify-end gap-1.5">
          {LAYER_LABELS.map((l) => (
            <button
              key={l.key}
              onClick={() => setLayers((s) => ({ ...s, [l.key]: !s[l.key] }))}
              className={`rounded-sm border px-2.5 py-1 font-mono text-[10px] tracking-wider transition-all duration-150 ${
                layers[l.key]
                  ? 'border-violet/30 bg-rgba(48, 25, 52, 0.47) text-white shadow-sm hover:bg-rgba(48,25,52,0.8)'
                  : 'border-white/10 bg-zinc-900/60 text-zinc-400 hover:border-white/20 hover:text-zinc-200'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-3 left-3 z-20 font-mono text-[10px] leading-relaxed text-white/45 sm:bottom-4 sm:left-4">
        <div className="text-white/30">FIELD {zoomLabel} · drag to pan · scroll to zoom</div>
      </div>

      <div className="absolute right-3 bottom-3 z-20 flex flex-col gap-1.5 sm:right-4 sm:bottom-4">
        <button onClick={() => zoomAt(0.66)} className="h-8 w-8 rounded border border-white/12 bg-black/50 text-white/70 backdrop-blur-md hover:text-white">+</button>
        <button onClick={() => zoomAt(1.5)} className="h-8 w-8 rounded border border-white/12 bg-black/50 text-white/70 backdrop-blur-md hover:text-white">−</button>
        <button
          onClick={() => { flyTo(HOME.ra, HOME.dec, HOME.fov); setSelected(null); }}
          className="h-8 w-8 rounded border border-white/12 bg-black/50 font-mono text-[10px] text-white/70 backdrop-blur-md hover:text-white"
        >⤢</button>
      </div>

      {selInfo && (
        <InfoPanel
          info={selInfo}
          onClose={() => setSelected(null)}
          onCenter={() => {
            const v = viewRef.current;
            if (selected?.kind === 'dso' && catalog) {
              const d = catalog.dsos[selected.index];
              flyTo(d.ra, d.dec, Math.min(v.fov, 2.5));
            } else if (selected?.kind === 'star' && catalog) {
              flyTo(catalog.stars.ra[selected.index], catalog.stars.dec[selected.index], Math.min(v.fov, 10));
            }
          }}
        />
      )}
    </div>
  );
}
