import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import StarMap from './components/StarMap';
import Layer1InfoPanel from './components/Layer1InfoPanel';
import Lightbox, { LightboxContext, type LightboxImage } from './components/Lightbox';

export default function App() {
  const [explore, setExplore] = useState(false);
  const [lightbox, setLightbox] = useState<LightboxImage | null>(null);
  const [showPanel, setShowPanel] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (lightbox) {
        setLightbox(null);
        return;
      }
      if (showPanel) {
        setShowPanel(false);
        return;
      }
      setExplore(false);
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox, showPanel]);

  return (
    <LightboxContext.Provider value={setLightbox}>
      <div className="relative h-[100dvh] w-full overflow-hidden bg-[#03040a]">
        <StarMap active={explore} />

        {!explore && !showPanel && (
          <button
            aria-label="Explore the star map"
            onClick={() => setExplore(true)}
            className="absolute inset-0 z-10 h-full w-full cursor-crosshair bg-transparent"
          />
        )}

        {!explore && (
          <button
            aria-label={showPanel ? 'Close panel' : 'Open info'}
            onClick={() => setShowPanel((prev) => !prev)}
            className="absolute bottom-4 left-4 z-40 h-40 w-60 bg-transparent"
          />
        )}

        <AnimatePresence>
          {!explore && showPanel && (
            <Layer1InfoPanel
              key="layer1-panel"
              onClose={() => setShowPanel(false)}
            />
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
              className="absolute top-3 left-1/2 z-40 -translate-x-1/2 isolate overflow-hidden bg-[#2d2423] px-3 py-2 font-mono text-xs text-[#d34343]/80 backdrop-blur-md transition hover:bg-[#3c2726] hover:text-[#ff4b4b] before:pointer-events-none before:absolute before:inset-y-0 before:-left-[200%] before:z-0 before:w-[75%] before:skew-x-[-22deg] before:bg-[#ff4b4b]/30 before:opacity-0 before:transition-transform before:duration-500 before:ease-out hover:before:translate-x-[420%] hover:before:opacity-100"
            >
              <span className="relative z-10">← Exit explorer</span>
            </motion.button>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {lightbox && (
            <Lightbox
              key="lightbox"
              image={lightbox}
              onClose={() => setLightbox(null)}
            />
          )}
        </AnimatePresence>
      </div>
    </LightboxContext.Provider>
  );
}