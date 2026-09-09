import { PRESETS, type Params } from "../blackhole/renderer/params";

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

function Section({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-t border-[var(--line)] pt-2 pb-3">
      {children}
    </div>
  );
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
      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto px-5 pb-6">
        <Section>
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
        </Section>
      </div>
    </div>
  );
}