import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import StarMap from './components/StarMap';
import Profile from './components/Profile';
import Lightbox, { LightboxContext, type LightboxImage } from './components/Lightbox';

export default function App() {
  const [explore, setExplore] = useState(false);
  const [lightbox, setLightbox] = useState<LightboxImage | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (lightbox) {
        setLightbox(null);
        return;
      }
      setExplore(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox]);

  return (
    <LightboxContext.Provider value={setLightbox}>
      <div className="relative h-[100dvh] w-full overflow-hidden bg-[#03040a]">
        <StarMap active={explore} />
        {!explore && (
          <button
            aria-label="Explore the star map"
            onClick={() => setExplore(true)}
            className="absolute inset-0 z-10 h-full w-full cursor-crosshair bg-transparent"
          />
        )}

        <AnimatePresence>
          {!explore && (
            <motion.div
              key="panel"
              initial={{ opacity: 0, scale: 0.985 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="pointer-events-none absolute inset-0 z-20 grid place-items-center p-4 sm:p-6"
            >
              <Profile />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {explore && (
            <motion.button
              key="back"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              onClick={() => setExplore(false)}
              className="absolute top-3 left-1/2 z-40 -translate-x-1/2 border border-white/15 bg-black/60 px-3 py-2 font-mono text-xs text-white/80 backdrop-blur-md hover:bg-black/80 hover:text-white"
            >
              ← Exit explorer
            </motion.button>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {lightbox && <Lightbox key="lightbox" image={lightbox} onClose={() => setLightbox(null)} />}
        </AnimatePresence>
      </div>
    </LightboxContext.Provider>
  );
}
