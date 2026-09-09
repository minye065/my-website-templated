import { motion } from "motion/react";
import { PRESETS, type Params } from "../blackhole/renderer/params";

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  digits?: number;
  hue?: boolean;
  onChange: (v: number) => void;
}

function Slider({
  label, value, min, max, step = 0.01, unit = "", digits = 2, onChange,
}: SliderProps) {
  return (
    <label className="group block select-none py-1.5">
      <div className="mb-1 flex items-baseline justify-between gap-3 font-mono text-xs">
        <span className="text-[#edebe5] opacity-80 group-hover:opacity-100 transition-opacity">{label}</span>
        <span className="text-white/60 group-hover:text-white/90 transition-colors">
          {value.toFixed(digits)}<span className="text-white/30 text-[10px] ml-0.5">{unit}</span>
        </span>
      </div>
      <input
        type="range"
        className="h-1 w-full cursor-ew-resize appearance-none rounded-lg bg-white/10 accent-sky-400 outline-none transition-all hover:bg-white/20"
        min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number.parseFloat(e.target.value))}
      />
    </label>
  );
}

export default function Controls({
  p, set, onClose,
}: {
  p: Params;
  set: (patch: Partial<Params>) => void;
  onClose: () => void;
}) {
  const activePreset = PRESETS.find(
    (x) => Math.abs(x.hue - p.hue) < 0.5 && Math.abs(x.sat - p.saturation) < 0.02
  );

  return (
    <motion.aside
      initial={{ opacity: 0, scale: 0.95, x: "-50%", y: "-45%" }}
      animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
      exit={{ opacity: 0, scale: 0.95, x: "-50%", y: "-45%" }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="pointer-events-auto absolute left-1/2 top-1/2 z-30 flex h-fit max-h-[calc(100dvh-48px)] w-[290px] max-w-[calc(100vw-24px)] flex-col overflow-y-auto rounded-2xl border border-white/10 bg-[#080a12]/[80%] p-5 text-white shadow-2xl backdrop-blur-xl"
      data-scroll
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="mt-1 text-lg leading-tight font-medium text-[#edebe5]">Spectrum</h2>
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          className="rounded-lg border border-white/10 p-1.5 text-white/50 hover:border-white/20 hover:bg-white/5 hover:text-white transition"
        >
          ✕
        </button>
      </div>

      <div className="mt-5 mb-4 flex flex-wrap justify-center gap-2 border-b border-white/5 pb-4">
        {PRESETS.map((preset) => {
          const on = activePreset?.name === preset.name;
          return (
            <button
              key={preset.name}
              type="button"
              onClick={() => set({ hue: preset.hue, saturation: preset.sat, drift: preset.drift })}
              className="group/p flex w-[44px] flex-col items-center gap-1 py-1"
              title={preset.name}
            >
              <span
                className="h-3 w-full rounded-sm transition-all duration-200 group-hover/p:scale-y-125"
                style={{
                  background: preset.swatch,
                  boxShadow: on ? `0 0 8px ${preset.swatch}` : "none",
                  opacity: on ? 1 : 0.4,
                }}
              />
              <span
                className="font-mono text-[8px] tracking-wide transition-colors"
                style={{ color: on ? "#edebe5" : "rgba(255,255,255,0.35)" }}
              >
                {preset.name}
              </span>
            </button>
          );
        })}
      </div>

      <div className="space-y-3">
        <Slider label="Hue" value={p.hue} min={0} max={360} step={1} digits={0} unit="°" onChange={(v) => set({ hue: v })} />
        <Slider label="Saturation" value={p.saturation} min={0} max={1.4} onChange={(v) => set({ saturation: v })} />
        <Slider label="Hue drift" value={p.drift} min={-40} max={40} step={1} digits={0} unit="°" onChange={(v) => set({ drift: v })} />
      </div>
    </motion.aside>
  );
}