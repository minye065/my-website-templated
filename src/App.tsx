import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import StarMap from './components/StarMap';
import Profile from './components/Profile';

export default function App() {
  const [explore, setExplore] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setExplore(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-[#03040a]">
      <StarMap active={explore} />

      {/* Click anywhere outside the panel to hand control to the sky */}
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
            className="absolute top-3 right-3 z-40 rounded-md border border-white/15 bg-black/60 px-3 py-2 font-mono text-[10.5px] tracking-wider text-white/75 backdrop-blur-md hover:text-white sm:top-4 sm:right-4"
          >
            ✕ BACK · ESC
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
