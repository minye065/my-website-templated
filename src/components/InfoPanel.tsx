import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { findPhoto, type NasaPhoto } from '../lib/nasa';
import type { ObjectInfo } from '../lib/info';

export default function InfoPanel({
  info,
  onClose,
  onCenter,
}: {
  info: ObjectInfo;
  onClose: () => void;
  onCenter: () => void;
}) {
  const [photo, setPhoto] = useState<NasaPhoto | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let alive = true;
    setPhoto(null);
    setExpanded(false);
    setLoading(true);
    findPhoto(info.key, info.queries, info.tokens)
      .then((p) => {
        if (alive) {
          setPhoto(p);
          setLoading(false);
        }
      })
      .catch(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [info.key, info.queries, info.tokens]);

  return (
    <motion.aside
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="pointer-events-auto absolute top-3 right-3 bottom-3 z-30 flex w-[330px] max-w-[calc(100vw-24px)] flex-col overflow-y-auto rounded-2xl border border-white/12 bg-[#080a12]/90 p-5 text-white shadow-2xl backdrop-blur-xl"
      data-scroll
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] tracking-widest text-white/40 uppercase">{info.kind}</span>
            <span
              className="rounded px-1.5 py-0.5 font-mono text-[9.5px]"
              style={{ background: `${info.accent}22`, color: info.accent }}
            >
              {info.badge}
            </span>
          </div>
          <h2 className="mt-1 text-lg leading-tight font-medium text-white">{info.title}</h2>
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          className="rounded-lg border border-white/10 p-1.5 text-white/50 hover:border-white/20 hover:bg-white/5 hover:text-white"
        >
          ✕
        </button>
      </div>

      <div className="mt-4 space-y-1.5 rounded-xl border border-white/5 bg-white/[0.02] p-3 text-xs">
        {info.rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-3 font-mono">
            <span className="text-white/40">{label}</span>
            <span className="text-white/80">{value}</span>
          </div>
        ))}
      </div>

      {loading && (
        <div className="mt-4 flex h-36 items-center justify-center rounded-xl border border-white/5 bg-white/[0.02] font-mono text-xs text-white/30">
          Fetching NASA imagery…
        </div>
      )}

      {!loading && !photo && (
        <div className="mt-4 rounded-xl border border-white/5 bg-white/[0.02] p-3 font-mono text-[11px] text-white/35">
          No matching image in the NASA library.
        </div>
      )}

      {!loading && photo && (
        <div className="mt-4 space-y-2 rounded-xl border border-white/10 bg-white/[0.02] p-3">
          <div className="relative overflow-hidden rounded-lg bg-black/40">
            <img src={photo.url} alt={photo.title} loading="lazy" className="h-44 w-full object-cover" />
          </div>
          <div className="flex items-center justify-between gap-2 pt-1">
            {photo.isHubble && (
              <span className="rounded bg-violet-400/15 px-1.5 py-0.5 font-mono text-[9.5px] tracking-wide text-violet-200">
                HUBBLE
              </span>
            )}
            <span className="ml-auto font-mono text-[9.5px] tracking-wide text-white/35">
              NASA{photo.date ? ` · ${photo.date}` : ''}
            </span>
          </div>
          <div className="text-[12px] font-medium text-white/80">{photo.title}</div>
          {photo.description && (
            <p className={`text-[11.5px] leading-relaxed text-white/50 ${expanded ? '' : 'line-clamp-4'}`}>
              {photo.description}
            </p>
          )}
          <div className="flex gap-3 pt-0.5">
            {photo.description && photo.description.length > 220 && (
              <button
                onClick={() => setExpanded((e) => !e)}
                className="font-mono text-[10px] text-sky-300/80 hover:text-sky-200"
              >
                {expanded ? 'less' : 'more'}
              </button>
            )}
            <a
              href={photo.link}
              target="_blank"
              rel="noreferrer noopener"
              className="font-mono text-[10px] text-sky-300/80 hover:text-sky-200"
            >
              images.nasa.gov ↗
            </a>
          </div>
        </div>
      )}

      <button
        onClick={onCenter}
        className="mt-auto w-full shrink-0 rounded-md border border-white/15 bg-white/10 py-2 font-mono text-xs font-medium text-white hover:bg-white/20"
      >
        Center on star map
      </button>
    </motion.aside>
  );
}
