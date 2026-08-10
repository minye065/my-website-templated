import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { findPhoto, type NasaPhoto } from '../lib/nasa';
import type { ObjectInfo } from '../lib/info';

export default function TourCard({ info }: { info: ObjectInfo }) {
  const [photo, setPhoto] = useState<NasaPhoto | null>(null);

  useEffect(() => {
    let alive = true;
    setPhoto(null);
    findPhoto(info.key, info.queries, info.tokens)
      .then((p) => alive && setPhoto(p))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [info.key, info.queries, info.tokens]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="pointer-events-none absolute bottom-4 left-4 z-10 hidden w-60 overflow-hidden rounded-xl bg-black/55 sm:block">
      {photo && (
        <div className="h-28 w-full flex-1 overflow-hidden">
          <img
            src={photo.url}
            alt={photo.title}
            className="h-full w-full object-cover opacity-90"
            onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
          />
        </div>
      )}
      <div className="px-3 py-2.5">
        <div className="mt-1 text-xs font-medium" style={{ color: info.accent }}>{info.title}</div>
      </div>
    </motion.div>
  );
}
