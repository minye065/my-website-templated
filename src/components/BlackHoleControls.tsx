import { useState } from "react";
import { DEFAULTS, PRESETS, type Params } from "../blackhole//renderer/params";

function Slider({
  label, value, min, max, step = 0.01, unit = "", digits = 2, hue = false, onChange,
}: {
  label: string; value: number; min: number; max: number;
  step?: number; unit?: string; digits?: number; hue?: boolean;
  onChange: (v: number) => void;
}) {
  return (
    <label className="group block select-none py-[5px]">
      <div className="mb-[3px] flex items-baseline justify-between gap-3">
        <span className="label transition-colors group-hover:text-[var(--ink)]">{label}</span>
        <span className="value tabular-nums opacity-70 transition-opacity group-hover:opacity-100">
          {value.toFixed(digits)}<span className="opacity-40">{unit}</span>
        </span>
      </div>
      <input
        type="range"
        className={`sld ${hue ? "hue" : ""}`}
        min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number.parseFloat(e.target.value))}
      />
    </label>
  );
}

function Section({ title, index, children }: {
  title: string; index: string; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border-t border-[var(--line)]">
      <button
        type="button" onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 py-[9px] text-left"
      >
        <span className="value w-4 shrink-0 opacity-30">{index}</span>
        <span className="label flex-1 !text-[var(--ink)]">{title}</span>
        <span className="value opacity-35 transition-transform duration-300"
          style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)" }}>›</span>
      </button>
      <div className="grid transition-[grid-template-rows,opacity] duration-300 ease-out"
        style={{ gridTemplateRows: open ? "1fr" : "0fr", opacity: open ? 1 : 0 }}>
        <div className="overflow-hidden"><div className="pb-3">{children}</div></div>
      </div>
    </div>
  );
}

function rampCss(hue: number, sat: number, drift: number) {
  const h = (x: number) => ((x % 360) + 360) % 360;
  const c = (hh: number, ss: number, ll: number) =>
    `hsl(${h(hh)} ${Math.min(ss * 100, 100).toFixed(0)}% ${ll}%)`;
  return `linear-gradient(90deg,
    ${c(hue - drift * 0.35, 0.98 * sat, 3)} 0%,
    ${c(hue, sat, 30)} 33%,
    ${c(hue + drift, 0.42 * sat, 72.5)} 66%,
    #ffffff 100%)`;
}

export default function Controls({
  p, set,
}: {
  p: Params; set: (patch: Partial<Params>) => void;
}) {
  const activePreset = PRESETS.find(
    (x) => Math.abs(x.hue - p.hue) < 0.5 && Math.abs(x.sat - p.saturation) < 0.02,
  );

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 px-5 pb-3 pt-5">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="serif text-[27px] leading-[0.95] tracking-tight">Black Hole</h1>
            <p className="label mt-[6px]">Schwarzschild ray tracer</p>
          </div>
        </div>
        <div className="mt-4">
          <div className="h-[26px] w-full border border-[var(--line)]"
            style={{ background: rampCss(p.hue, p.saturation, p.drift) }} />
          <div className="mt-[5px] flex justify-between">
            <span className="label !text-[8px]">void</span>
            <span className="label !text-[8px]">photosphere</span>
          </div>
        </div>
      </div>

      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto px-5 pb-6">
        <Section title="Spectrum" index="01">
          <div className="mb-3 grid grid-cols-4 gap-[5px]">
            {PRESETS.map((preset) => {
              const on = activePreset?.name === preset.name;
              return (
                <button key={preset.name} type="button"
                  onClick={() => set({ hue: preset.hue, saturation: preset.sat, drift: preset.drift })}
                  className="group/p flex flex-col items-center gap-[5px] py-[3px]"
                  title={preset.name}>
                  <span className="h-[13px] w-full transition-transform duration-200 group-hover/p:scale-y-[1.35]"
                    style={{ background: preset.swatch, boxShadow: on ? `0 0 10px ${preset.swatch}` : "none", opacity: on ? 1 : 0.5 }} />
                  <span className="label !text-[7.5px] !tracking-[0.1em] transition-colors"
                    style={{ color: on ? "var(--ink)" : undefined }}>{preset.name}</span>
                </button>
              );
            })}
          </div>
          <Slider label="Hue" value={p.hue} min={0} max={360} step={1} digits={0} unit="°" hue onChange={(v) => set({ hue: v })} />
          <Slider label="Saturation" value={p.saturation} min={0} max={1.4} onChange={(v) => set({ saturation: v })} />
          <Slider label="Hue drift" value={p.drift} min={-40} max={40} step={1} digits={0} unit="°" onChange={(v) => set({ drift: v })} />
          <Slider label="Exposure" value={p.exposure} min={0.2} max={2.6} onChange={(v) => set({ exposure: v })} />
          <Slider label="Falloff" value={p.contrast} min={0.5} max={2.2} onChange={(v) => set({ contrast: v })} />
        </Section>

        <Section title="Accretion disk" index="02">
          <Slider label="Inner radius" value={p.innerRadius} min={1.6} max={7} unit=" rs" onChange={(v) => set({ innerRadius: v })} />
          <Slider label="Outer radius" value={p.outerRadius} min={4} max={26} unit=" rs" onChange={(v) => set({ outerRadius: v })} />
          <Slider label="Angular velocity" value={p.spin} min={-3} max={3} onChange={(v) => set({ spin: v })} />
          <Slider label="Filament contrast" value={p.density} min={0} max={1} onChange={(v) => set({ density: v })} />
          <Slider label="Turbulence" value={p.detail} min={0.3} max={2.6} onChange={(v) => set({ detail: v })} />
          <Slider label="Doppler beaming" value={p.doppler} min={0} max={1} onChange={(v) => set({ doppler: v })} />
          <Slider label="Inner rim glow" value={p.diskGlow} min={0} max={0.8} onChange={(v) => set({ diskGlow: v })} />
        </Section>

        <Section title="Observer" index="03">
          <Slider label="Inclination" value={p.inclination} min={-89} max={89} step={0.5} digits={1} unit="°" onChange={(v) => set({ inclination: v })} />
          <Slider label="Azimuth" value={p.azimuth} min={-180} max={180} step={1} digits={0} unit="°" onChange={(v) => set({ azimuth: v })} />
          <Slider label="Distance" value={p.distance} min={3.5} max={45} unit=" rs" digits={1} onChange={(v) => set({ distance: v })} />
          <Slider label="Roll" value={p.roll} min={-180} max={180} step={1} digits={0} unit="°" onChange={(v) => set({ roll: v })} />
          <Slider label="Focal length" value={p.focalLength} min={0.7} max={4} onChange={(v) => set({ focalLength: v })} />
          <Slider label="Auto orbit" value={p.autoRotate} min={-2} max={2} onChange={(v) => set({ autoRotate: v })} />
        </Section>

        <Section title="Field" index="04">
          <Slider label="Star density" value={p.starAmount} min={0} max={1} onChange={(v) => set({ starAmount: v })} />
          <Slider label="Star magnitude" value={p.starBrightness} min={0} max={2} onChange={(v) => set({ starBrightness: v })} />
          <Slider label="Nebulosity" value={p.nebulosity} min={0} max={1.2} onChange={(v) => set({ nebulosity: v })} />
        </Section>

        <Section title="Integrator" index="05">
          <Slider label="Quality" value={p.quality} min={0.15} max={1} onChange={(v) => set({ quality: v })} />
          <div className="mt-2 flex items-center justify-between border-t border-[var(--line)] pt-2">
            <span className="label">{Math.round(110 + p.quality * 260)} steps</span>
            <button type="button" onClick={() => set(DEFAULTS)}
              className="label border border-[var(--line)] px-2 py-[5px] transition-colors hover:!text-[var(--ink)] hover:border-[var(--accent)]">
              Reset all
            </button>
          </div>
        </Section>
      </div>
    </div>
  );
}