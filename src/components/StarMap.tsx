import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CATALOG } from '../lib/catalog';
import { buildInfo } from '../lib/info';
import { drawSky, loadNasaBackground, type Layers, pick, type Selection } from '../lib/render';
import { clamp, makeView, updateView, wrapLon } from '../lib/sky';
import InfoPanel from './InfoPanel';
import TourCard from './TourCard';

const LAYER_LABELS: { key: keyof Layers; label: string }[] = [
  { key: 'deepSky', label: 'Deep sky' },
  { key: 'labels', label: 'Labels' },
];

interface SearchHit {
  label: string;
  sub: string;
  sel: Selection;
}

export default function StarMap({ active }: { active: boolean }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewRef = useRef(makeView());
  const dirty = useRef(true);
  const anim = useRef<{ t0: number; dur: number; from: [number, number, number]; to: [number, number, number] } | null>(
    null,
  );

  const [ready, setReady] = useState(false);
  const [selected, setSelected] = useState<Selection | null>(null);
  const [query, setQuery] = useState('');
  const [layers, setLayers] = useState<Layers>({ background: true, labels: true, deepSky: true });

  const selRef = useRef<Selection | null>(null);
  selRef.current = selected;
  const layersRef = useRef(layers);
  layersRef.current = layers;
  const activeRef = useRef(active);
  activeRef.current = active;

  const info = useMemo(() => (selected ? buildInfo(selected) : null), [selected]);

  useEffect(() => {
    loadNasaBackground(() => {
      dirty.current = true;
    });
    const id = window.setTimeout(() => {
      setReady(true);
    }, 30);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    const el = wrapRef.current;
    const cv = canvasRef.current;
    if (!el || !cv) return;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      const v = viewRef.current;
      v.w = Math.max(1, r.width);
      v.h = Math.max(1, r.height);
      v.dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.round(v.w * v.dpr);
      cv.height = Math.round(v.h * v.dpr);
      cv.style.width = `${v.w}px`;
      cv.style.height = `${v.h}px`;
      updateView(v);
      dirty.current = true;
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    let raf = 0;
    let pulseTick = 0;
    let last = 0;
    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      const dt = last ? Math.min(t - last, 100) : 16;
      last = t;
      const v = viewRef.current;

      if (anim.current) {
        const a = anim.current;
        const k = clamp((t - a.t0) / a.dur, 0, 1);
        const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
        v.ra = wrapLon(a.from[0] + wrapLon(a.to[0] - a.from[0]) * e);
        v.dec = a.from[1] + (a.to[1] - a.from[1]) * e;
        v.fov = a.from[2] * Math.pow(a.to[2] / a.from[2], e);
        updateView(v);
        dirty.current = true;
        if (k >= 1) anim.current = null;
      } else if (!activeRef.current) {
        v.ra = wrapLon(v.ra + dt * 0.00008 * v.fov);
        updateView(v);
        dirty.current = true;
      }

      if (selRef.current && t - pulseTick > 70) {
        pulseTick = t;
        dirty.current = true;
      }
      if (!dirty.current) return;
      dirty.current = false;
      const ctx = canvasRef.current?.getContext('2d');
      if (!ctx) return;
      drawSky(ctx, v, layersRef.current, selRef.current, t);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [ready]);

  useEffect(() => {
    dirty.current = true;
  }, [layers, selected]);

  const panPixels = useCallback((dx: number, dy: number) => {
    const v = viewRef.current;
    v.ra -= dx / v.scale;
    v.dec += dy / v.scale;
    updateView(v);
    dirty.current = true;
  }, []);

  const zoomAt = useCallback(
    (factor: number, mx?: number, my?: number) => {
      const v = viewRef.current;
      const before = v.fov;
      v.fov = clamp(v.fov * factor, 0.4, 175);
      updateView(v);
      if (mx != null && my != null && before !== v.fov) {
        const f = 1 - before / v.fov;
        panPixels((mx - v.cx) * f, (my - v.cy) * f);
      }
      anim.current = null;
      dirty.current = true;
    },
    [panPixels],
  );

  const flyTo = useCallback((ra: number, dec: number, fov: number, dur = 900) => {
    const v = viewRef.current;
    anim.current = {
      t0: performance.now(),
      dur,
      from: [v.ra, v.dec, v.fov],
      to: [ra, clamp(dec, -88, 88), clamp(fov, 0.4, 175)],
    };
  }, []);

  useEffect(() => {
    if (active) return;
    const pool = CATALOG.dsos.map((d, i) => ({ d, i })).filter((x) => x.d.name && x.d.mag < 9.5);
    let idx = Math.floor(Math.random() * pool.length);
    const go = () => {
      const { d, i } = pool[idx];
      flyTo(d.ra, d.dec, clamp((d.size / 60) * 5, 20, 40), 4000);
      setSelected({ kind: 'dso', index: i });
      idx = (idx + 1 + Math.floor(Math.random() * 5)) % pool.length;
    };
    const t0 = window.setTimeout(go, 1200);
    const t = window.setInterval(go, 14000);
    return () => {
      window.clearTimeout(t0);
      window.clearInterval(t);
    };
  }, [active, flyTo]);

  useEffect(() => {
    anim.current = null;
    setSelected(null);
    setQuery('');
    if (active) {
      const v = viewRef.current;
      flyTo(v.ra, v.dec, Math.max(v.fov, 80), 600);
    }
  }, [active, flyTo]);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv || !active) return;
    let dragging = false;
    let moved = 0;
    let lastX = 0;
    let lastY = 0;
    const pinch = new Map<number, { x: number; y: number }>();
    let pinchDist = 0;

    const local = (e: PointerEvent) => {
      const r = cv.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };

    const down = (e: PointerEvent) => {
      cv.setPointerCapture(e.pointerId);
      const p = local(e);
      pinch.set(e.pointerId, p);
      dragging = true;
      moved = 0;
      lastX = p.x;
      lastY = p.y;
      anim.current = null;
    };
    const move = (e: PointerEvent) => {
      const p = local(e);
      if (pinch.has(e.pointerId)) pinch.set(e.pointerId, p);
      if (pinch.size === 2) {
        const [a, b] = [...pinch.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinchDist) zoomAt(pinchDist / d, (a.x + b.x) / 2, (a.y + b.y) / 2);
        pinchDist = d;
        return;
      }
      if (!dragging) return;
      const dx = p.x - lastX;
      const dy = p.y - lastY;
      lastX = p.x;
      lastY = p.y;
      moved += Math.abs(dx) + Math.abs(dy);
      panPixels(dx, dy);
    };
    const up = (e: PointerEvent) => {
      pinch.delete(e.pointerId);
      if (pinch.size < 2) pinchDist = 0;
      if (!dragging) return;
      dragging = false;
      if (moved < 5) {
        const p = local(e);
        const hit = pick(viewRef.current, p.x, p.y, layersRef.current);
        setSelected(hit);
      }
    };
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = cv.getBoundingClientRect();
      zoomAt(Math.exp(e.deltaY * 0.0015), e.clientX - r.left, e.clientY - r.top);
    };

    cv.addEventListener('pointerdown', down);
    cv.addEventListener('pointermove', move);
    cv.addEventListener('pointerup', up);
    cv.addEventListener('pointercancel', up);
    cv.addEventListener('wheel', wheel, { passive: false });
    return () => {
      cv.removeEventListener('pointerdown', down);
      cv.removeEventListener('pointermove', move);
      cv.removeEventListener('pointerup', up);
      cv.removeEventListener('pointercancel', up);
      cv.removeEventListener('wheel', wheel);
    };
  }, [active, panPixels, zoomAt]);

  const hits = useMemo<SearchHit[]>(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 1) return [];
    const out: SearchHit[] = [];
    CATALOG.dsos.forEach((d, i) => {
      const hay = `${d.desig} ${d.name ?? ''}`.toLowerCase();
      if (hay.includes(q)) out.push({ label: d.desig, sub: d.con, sel: { kind: 'dso', index: i } });
    });

    return out.slice(0, 8);
  }, [query]);

  const goTo = useCallback(
    (sel: Selection) => {
      const i = buildInfo(sel);
      setSelected(sel);
      flyTo(i.ra, i.dec, i.fov, 1100);
    },
    [flyTo],
  );

  return (
    <div ref={wrapRef} className="relative h-full w-full bg-[#03040a]">
      <canvas
        ref={canvasRef}
        className={`block h-full w-full ${active ? 'cursor-grab active:cursor-grabbing' : ''}`}
      />

      <AnimatePresence mode="wait">
        {!active && info && <TourCard key={info.key} info={info} />}
      </AnimatePresence>

      <AnimatePresence>
        {active && (
          <motion.div
            key="chrome"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="pointer-events-none absolute inset-0 z-20"
          >
            <div className="pointer-events-auto absolute top-3 left-3 w-64 max-w-[calc(100vw-24px)]">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search..."
                className="w-full rounded-lg border border-white/12 bg-black/60 px-3 py-2 font-mono text-xs text-white placeholder:text-white/30 backdrop-blur-md outline-none focus:border-sky-300/40"
              />
              {hits.length > 0 && (
                <ul className="mt-1 overflow-hidden rounded-lg border border-white/10 bg-black/80 backdrop-blur-md">
                  {hits.map((h) => (
                    <li key={`${h.sel.kind}-${h.sel.index}`}>
                      <button
                        onClick={() => {
                          goTo(h.sel);
                          setQuery('');
                        }}
                        className="block w-full px-3 py-1.5 text-left hover:bg-white/10"
                      >
                        <div className="text-[12px] text-white/90">{h.label}</div>
                        <div className="font-mono text-[10px] text-white/40">{h.sub}</div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="pointer-events-auto absolute bottom-3 left-3 flex overflow-hidden rounded-md bg-[#2d2423] backdrop-blur-md">
              {LAYER_LABELS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setLayers((l) => ({ ...l, [key]: !l[key] }))}
                  className={`relative isolate overflow-hidden px-2.5 py-1.5 font-mono text-[10px] transition before:pointer-events-none before:absolute before:inset-y-0 before:-left-[200%] before:z-0 before:w-[75%] before:skew-x-[-22deg] before:bg-[#ff4b4b]/30 before:opacity-0 before:transition-transform before:duration-500 before:ease-out hover:before:translate-x-[420%] hover:before:opacity-100 ${layers[key]
                      ? 'bg-[#4b2a29] text-[#ff4b4b]'
                      : 'text-[#d34343]/55 hover:bg-[#3c2726] hover:text-[#ff4b4b]'
                  }`}
                >
                  <span className="relative z-10">{label}</span>
                </button>
              ))}
            </div>

            <div className="pointer-events-auto absolute right-3 bottom-3 flex items-center gap-2">
              <div className="flex overflow-hidden rounded-md border border-white/10 bg-black/50 backdrop-blur-md">
                <button onClick={() => zoomAt(0.66)} className="px-2.5 py-1 text-white/70 hover:bg-white/10 hover:text-white">
                  +
                </button>
                <button onClick={() => zoomAt(1.5)} className="px-2.5 py-1 text-white/70 hover:bg-white/10 hover:text-white">
                  −
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {active && info && (
          <InfoPanel
            key={info.key}
            info={info}
            onClose={() => setSelected(null)}
            onCenter={() => flyTo(info.ra, info.dec, info.fov, 900)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
