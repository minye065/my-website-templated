import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { findPhoto, type NasaPhoto } from '../lib/nasa';
import { useLightbox } from './Lightbox';

const QUERY_KEY = 'home:featured';
const QUERIES = ['Hubble Deep Field'];
const TOKENS = ['hubble', 'deep field'];

export default function Layer1InfoPanel({
  onClose,
}: {
  onClose: () => void;
}) {
  const [photo, setPhoto] = useState<NasaPhoto | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageReady, setImageReady] = useState(false);
  const openLightbox = useLightbox();

  useEffect(() => {
    let alive = true;
    setLoading(true);
    findPhoto(QUERY_KEY, QUERIES, TOKENS)
      .then((p) => { if (alive) { setPhoto(p); setLoading(false); } })
      .catch(() => alive && setLoading(false));
    return () => { alive = false; };
  }, []);

  return (
    <motion.aside
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="pointer-events-auto absolute top-3 right-3 z-30 flex h-fit max-h-[calc(100dvh-24px)] w-[330px] max-w-[calc(100vw-24px)] flex-col overflow-y-auto rounded-2xl border border-white/12 bg-[#080a12]/90 p-5 text-white shadow-2xl backdrop-blur-xl"
      data-scroll
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-lg leading-tight font-medium text-[#edebe5]">Info</h2>
        <button
          onClick={onClose}
          aria-label="Close"
          className="rounded-lg border border-white/10 p-1.5 text-white/50 hover:border-white/20 hover:bg-white/5 hover:text-white"
        >
          ✕
        </button>
      </div>

      {loading && (
        <div className="mt-3 animate-pulse rounded-lg bg-white/[0.06] h-44" />
      )}

      {!loading && !photo && (
        <div className="mt-3 rounded-lg border border-white/5 bg-white/[0.02] p-3 font-mono text-[11px] text-white/35">
          No matching image found.
        </div>
      )}

      {!loading && photo && (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => openLightbox({ url: photo.url, alt: photo.title, caption: photo.title })}
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
              ⤢
            </span>
          </button>

          <a
            href={photo.link}
            target="_blank"
            rel="noreferrer noopener"
            className="mt-1.5 inline-flex items-center gap-1 font-mono text-[10px] text-sky-300/80 hover:text-sky-200"
          >
            NASA
            <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
          </a>
        </div>
      )}
    </motion.aside>
  );
}