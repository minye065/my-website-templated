import { useEffect, useRef } from 'react';
import { animate, stagger } from 'animejs';
import { CONTACTS, PROJECTS } from '../content';

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
      <header data-reveal className="opacity-0">
        <p className="mt-1 text-xs text-white/45">Bunch of stuff i made</p>
      </header>

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
            </a>
          ))}
        </div>
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
    </div>
  );
}
