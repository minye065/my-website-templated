import { useEffect, useRef } from 'react';
import { animate, stagger } from 'animejs';

const PROJECTS = [
  {
    name: 'skysweep',
    desc: 'This star map. Canvas renderer over the Hipparcos + Messier catalogues, photos pulled live from the NASA image library.',
    tag: 'typescript · canvas',
    href: 'https://github.com',
  },
  {
    name: 'ledgerline',
    desc: 'A plain-text accounting viewer that turns beancount files into monthly burn charts.',
    tag: 'rust · cli',
    href: 'https://github.com',
  },
  {
    name: 'quietfeed',
    desc: 'RSS reader that batches everything into one daily digest. No unread counts, on purpose.',
    tag: 'go · sqlite',
    href: 'https://github.com',
  },
];

const NOW = [
  'Rewriting the skysweep renderer to cull off-screen labels properly',
  'Reading through the SQLite btree source, taking notes',
  'Slowly learning celestial navigation the analog way',
];

export default function Profile() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    animate(el.querySelectorAll('[data-reveal]'), {
      opacity: [0, 1],
      translateY: [10, 0],
      delay: stagger(55, { start: 120 }),
      duration: 550,
      ease: 'outCubic',
    });
  }, []);

  return (
    <div
      ref={ref}
      className="pointer-events-auto w-full max-w-xl overflow-y-auto rounded-xl border border-white/10 bg-[#05070ecc] shadow-[0_0_80px_rgba(0,0,0,0.6)] backdrop-blur-xl"
      style={{ maxHeight: 'min(84dvh, 46rem)' }}
    >
      <div className="p-6 sm:p-8">
        <header data-reveal className="opacity-0">
          <div className="font-mono text-[10px] tracking-[0.3em] text-sky-200/60">RA 05H 35M · DEC −05° 23′</div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">Jonas Herrera</h1>
          <p className="mt-1.5 text-[13.5px] leading-relaxed text-white/55">
            Systems-ish software developer. I build small tools, stare at the sky,
            and occasionally write things down. Currently freelancing from Lisbon.
          </p>
        </header>

        <section data-reveal className="mt-7 opacity-0">
          <h2 className="font-mono text-[10px] tracking-[0.25em] text-white/35">PROJECTS</h2>
          <ul className="mt-3 space-y-3">
            {PROJECTS.map((p) => (
              <li key={p.name}>
                <a
                  href={p.href}
                  target="_blank"
                  rel="noreferrer"
                  className="group block rounded-lg border border-white/8 bg-white/[0.03] px-4 py-3 transition-colors hover:border-white/20 hover:bg-white/[0.06]"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-[14px] font-medium text-white/90 group-hover:text-white">{p.name}</span>
                    <span className="font-mono text-[9.5px] tracking-wide text-white/30">{p.tag}</span>
                  </div>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-white/50">{p.desc}</p>
                </a>
              </li>
            ))}
          </ul>
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
            <a href="mailto:jonas@herrera.dev" className="text-sky-300/80 hover:text-sky-200">jonas@herrera.dev</a>
            <a href="https://github.com" target="_blank" rel="noreferrer" className="text-sky-300/80 hover:text-sky-200">github ↗</a>
            <a href="https://bsky.app" target="_blank" rel="noreferrer" className="text-sky-300/80 hover:text-sky-200">bluesky ↗</a>
          </div>
        </section>

        <footer data-reveal className="mt-8 border-t border-white/8 pt-4 opacity-0">
          <p className="font-mono text-[10px] leading-relaxed tracking-wide text-white/30">
            ✦ CLICK ANYWHERE OUTSIDE THIS PANEL TO EXPLORE THE SKY
          </p>
        </footer>
      </div>
    </div>
  );
}
