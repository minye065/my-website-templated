import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { findPhoto, type NasaPhoto } from '../library/nasa';
import type { ObjectInfo } from './InfoPanel';

/** Small ambient caption shown while the background drifts on its own. */
export default function TourCard({ info }: { info: ObjectInfo }) {
  const [photo, setPhoto] = useState<NasaPhoto | null>(null);

  useEffect(() => {
    let alive = true;
    setPhoto(null);
    findPhoto(info.key, info.queries, info.tokens)
      .then((p) => alive && setPhoto(p))
      .catch(() => undefined);
    return () => { alive = false; };
  }, [info.key, info.queries, info.tokens]);

  return (
    <motion.div
      key={info.key}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="pointer-events-none absolute bottom-4 left-4 z-10 hidden w-64 overflow-hidden rounded-lg border border-white/10 bg-black/60 backdrop-blur-md sm:block"
    >
      {photo && (
        <div className="h-32 w-full overflow-hidden">
          <img
            src={photo.thumb}
            alt={photo.title}
            className="h-full w-full object-cover opacity-90"
            onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
          />
        </div>
      )}
      <div className="px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span
            className="rounded px-1.5 py-0.5 font-mono text-[9.5px]"
            style={{ background: `${info.accent}22`, color: info.accent }}
          >{info.badge}</span>
          <span className="font-mono text-[9.5px] tracking-wide text-white/40">{info.kind}</span>
        </div>
        <div className="mt-1 text-[13px] font-medium text-white/85">{info.title}</div>
        {photo && <div className="mt-0.5 font-mono text-[9px] tracking-wide text-white/30">NASA IMAGE LIBRARY</div>}
      </div>
    </motion.div>
  );
}
