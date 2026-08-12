import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { findPhoto, type NasaPhoto } from '../lib/nasa';
import type { ObjectInfo } from '../lib/info';
import { useLightbox } from './Lightbox';

export default function InfoPanel({
  info,
  onClose,
}: {
  info: ObjectInfo;
  onClose: () => void;
  onCenter?: () => void;
}) {
  const [photo, setPhoto] = useState<NasaPhoto | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageReady, setImageReady] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const openLightbox = useLightbox();

  useEffect(() => {
    let alive = true;
    setPhoto(null);
    setImageReady(false);
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
          <h2 className="mt-1 text-lg leading-tight font-medium text-[#edebe5]">{info.title}</h2>
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          className="rounded-lg border border-white/10 p-1.5 text-white/50 hover:border-white/20 hover:bg-white/5 hover:text-white"
        >
          ✕
        </button>
      </div>

      <div className="mt-4 space-y-1.5  p-3 text-xs">
        {info.rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-3 font-mono">
            <span className="text-[#edebe5]">{label}</span>
            <span className="text-[#edebe5]">{value}</span>
          </div>
        ))}
      </div>

      {loading && (
        <div className="mt-4 animate-pulse space-y-3 rounded-xl border border-white/5 bg-white/[0.02] p-3" aria-label="Loading NASA image">
          <div className="h-44 rounded-lg bg-white/[0.06]" />
          <div className="h-2.5 w-2/3 rounded bg-white/[0.06]" />
          <div className="h-2 w-full rounded bg-white/[0.04]" />
        </div>
      )}

      {!loading && !photo && (
        <div className="mt-4 rounded-xl border border-white/5 bg-white/[0.02] p-3 font-mono text-[11px] text-white/35">
          No matching image in the NASA library.
        </div>
      )}

      {!loading && photo && (
        <div className="mt-4 space-y-2 p-3">
          <button
            type="button"
            onClick={() => openLightbox({ url: photo.url, alt: photo.title, caption: photo.title })}
            aria-label={`Expand image: ${photo.title}`}
            className="group relative block w-full cursor-zoom-in overflow-hidden rounded-lg bg-black/40"
          >
            <img src={photo.thumb} alt="" className="h-44 w-full scale-105 object-cover blur-sm" />
            <img
              src={photo.url}
              alt={photo.title}
              loading="eager"
              decoding="async"
              fetchPriority="high"
              onLoad={() => setImageReady(true)}
              className={`absolute inset-0 h-44 w-full object-cover transition duration-300 group-hover:scale-[1.03] ${
                imageReady ? 'opacity-100' : 'opacity-0'
              }`}
            />
            <span className="pointer-events-none absolute right-2 bottom-2 rounded bg-black/60 px-1.5 py-0.5 font-mono text-[9px] tracking-wide text-white/80 opacity-0 backdrop-blur-sm transition group-hover:opacity-100">
              ⤢ expand
            </span>
          </button>
          <div className="flex items-center justify-between gap-2 pt-1">
            {photo.isHubble && (
              <span className="rounded bg-[#080b08] text-[#E5E4E2] px-1.5 py-0.5 font-mono text-[9.5px] tracking-wide">
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
                {expanded ? 'retract' : 'expand'}
              </button>
            )}
            <a
              href={photo.link}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1 font-mono text-[10px] text-sky-300/80 hover:text-sky-200"
            >
              NASA
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="1em"
                height="1em"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                focusable="false"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            </a>
          </div>
        </div>
      )}
    </motion.aside>
  );
}
