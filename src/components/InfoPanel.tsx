import { useEffect, useState } from 'react';
import { findPhoto, type NasaPhoto } from '../library/nasa';

export interface ObjectInfo {
  key: string;
  title: string;
  badge: string;
  kind: string;
  accent: string;
  rows: [string, string][];
  queries: string[];
  tokens: string[];
}

export default function InfoPanel({ info, onClose, onCenter }: {
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
      .then((p) => { if (alive) { setPhoto(p); setLoading(false); } })
      .catch(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [info.key]);

  return (
    <aside className="pointer-events-auto absolute right-0 bottom-0 z-30 max-h-[72%] w-full overflow-y-auto border-t border-white/10 bg-black/80 backdrop-blur-xl sm:top-20 sm:right-4 sm:bottom-auto sm:max-h-[calc(100%-7rem)] sm:w-[340px] sm:rounded-xl sm:border">
      <div className="relative">
        <div className="aspect-[4/3] w-full overflow-hidden bg-[#080b16] sm:rounded-t-xl">
          {photo ? (
            <img
              src={photo.thumb}
              alt={photo.title}
              loading="lazy"
              className="h-full w-full object-cover opacity-95 transition-opacity duration-500"
              onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
            />
          ) : (
            <div className="grid h-full w-full place-items-center">
              <span className="font-mono text-[10px] tracking-[0.2em] text-white/30">
                {loading ? 'QUERYING NASA IMAGE LIBRARY…' : 'NO NASA IMAGE FOUND'}
              </span>
            </div>
          )}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-full bg-gradient-to-t from-black/85 via-transparent to-transparent" />
        </div>

        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-2 right-2 grid h-7 w-7 place-items-center rounded-md border border-white/15 bg-black/60 text-white/70 backdrop-blur hover:text-white"
        >✕</button>

        <div className="absolute right-3 bottom-2 left-3">
          <div className="flex items-center gap-2">
            <span
              className="rounded px-1.5 py-0.5 font-mono text-[10px]"
              style={{ background: `${info.accent}22`, color: info.accent }}
            >{info.badge}</span>
            <span className="font-mono text-[10px] tracking-wide text-white/45">{info.kind}</span>
          </div>
          <h2 className="mt-1 text-lg leading-tight font-semibold text-white">{info.title}</h2>
        </div>
      </div>

      <div className="space-y-3 p-3.5">
        <dl className="grid grid-cols-1 gap-y-1">
          {info.rows.map(([k, v]) => (
            <div key={k} className="flex items-baseline justify-between gap-3 border-b border-white/5 pb-1">
              <dt className="text-[11px] text-white/40">{k}</dt>
              <dd className="font-mono text-[11.5px] text-white/85">{v}</dd>
            </div>
          ))}
        </dl>

        {photo && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              {photo.isHubble && (
                <span className="rounded bg-violet-400/15 px-1.5 py-0.5 font-mono text-[9.5px] tracking-wide text-violet-200">HUBBLE</span>
              )}
              <span className="font-mono text-[9.5px] tracking-wide text-white/35">
                NASA IMAGE LIBRARY{photo.date ? ` · ${photo.date}` : ''}
              </span>
            </div>
            <div className="text-[12px] font-medium text-white/80">{photo.title}</div>
            {photo.description && (
              <p className={`text-[11.5px] leading-relaxed text-white/50 ${expanded ? '' : 'line-clamp-4'}`}>
                {photo.description}
              </p>
            )}
            <div className="flex gap-3 pt-0.5">
              {photo.description.length > 220 && (
                <button onClick={() => setExpanded((e) => !e)} className="font-mono text-[10px] text-sky-300/80 hover:text-sky-200">
                  {expanded ? 'less' : 'more'}
                </button>
              )}
              <a href={photo.link} target="_blank" rel="noreferrer" className="font-mono text-[10px] text-sky-300/80 hover:text-sky-200">
                images.nasa.gov ↗
              </a>
            </div>
          </div>
        )}

        <button
          onClick={onCenter}
          className="w-full rounded-md border border-white/12 bg-white/5 py-1.5 font-mono text-[10.5px] tracking-wide text-white/70 hover:bg-white/10 hover:text-white"
        >CENTRE &amp; ZOOM</button>
      </div>
    </aside>
  );
}
