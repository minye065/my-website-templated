import { useEffect, useRef } from 'react';
import { animate, stagger } from 'animejs';
import { CONTACTS, NOW, PROFILE, PROJECTS } from '../content';

function isExternal(href: string) {
  return /^https?:\/\//i.test(href);
}

export default function Profile() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const animation = animate(el.querySelectorAll('[data-reveal]'), {
      opacity: [0, 1],
      translateY: [10, 0],
      delay: stagger(45, { start: 100 }),
      duration: 520,
      ease: 'outCubic',
    });
    return () => {
      animation.pause();
    };
  }, []);

  return (
    <div
      ref={ref}
      onWheel={(e) => e.stopPropagation()}
      className="pointer-events-auto max-h-[86vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-[#090b14]/85 p-6 text-white/90 shadow-2xl backdrop-blur-xl sm:p-8"
      data-scroll
    >
      <section data-reveal className="mt-6 opacity-0">
        <h2 className="font-mono text-[10px] tracking-[0.25em] text-white/35">PROJECTS</h2>
        <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {PROJECTS.map((p) => (
            <a
              key={p.name}
              href={p.href}
              target={isExternal(p.href) ? '_blank' : undefined}
              rel={isExternal(p.href) ? 'noreferrer noopener' : undefined}
              className="group flex flex-col rounded-xl border border-white/10 bg-white/[0.03] p-3.5 transition hover:border-sky-300/30 hover:bg-white/[0.06]"
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-mono text-xs font-semibold text-sky-200 group-hover:underline">{p.name}</span>
                <span className="font-mono text-[9px] text-white/30">→</span>
              </div>
              <p className="mt-1.5 flex-1 text-[12px] leading-relaxed text-white/60">{p.desc}</p>
              <span className="mt-2.5 font-mono text-[9.5px] tracking-wide text-white/30">{p.tag}</span>
            </a>
          ))}
        </div>
      </section>

      <section data-reveal className="mt-7 opacity-0">
        <h2 className="font-mono text-[10px] tracking-[0.25em] text-white/35">NOW</h2>
        <ul className="mt-3 space-y-1.5">
          {NOW.map((n) => (
            <li key={n} className="flex gap-2.5 text-[12.5px] leading-relaxed text-white/55">
              <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-sky-300/60" />
              {n}
            </li>
          ))}
        </ul>
      </section>

      <section data-reveal className="mt-7 opacity-0">
        <h2 className="font-mono text-[10px] tracking-[0.25em] text-white/35">CONTACT</h2>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 font-mono text-[11.5px]">
          {CONTACTS.map((c) => (
            <a
              key={c.label}
              href={c.href}
              target={isExternal(c.href) ? '_blank' : undefined}
              rel={isExternal(c.href) ? 'noreferrer noopener' : undefined}
              className="text-sky-300/80 hover:text-sky-200"
            >
              {c.label}
            </a>
          ))}
        </div>
      </section>

      <p data-reveal className="mt-8 font-mono text-[10px] leading-relaxed text-white/25 opacity-0">
        Click anywhere outside this card to take the wheel — pan, zoom and tap any star or nebula for its NASA
        photograph. Esc brings you back.
      </p>
    </div>
  );
}
