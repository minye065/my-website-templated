import { createContext, useContext } from 'react';
import { motion } from 'motion/react';

export interface LightboxImage {
  url: string;
  alt: string;
  caption?: string;
}

/**
 * Call this (from anywhere under the provider) to expand an image.
 * Passing `null` is not needed — closing is handled by App / the overlay.
 */
export const LightboxContext = createContext<(img: LightboxImage) => void>(() => {});

export const useLightbox = () => useContext(LightboxContext);

/**
 * Full-screen image viewer. It deliberately keeps everything behind it
 * mounted and untouched, so closing (ESC / click / button) returns the
 * user to the exact same place they were before opening.
 */
export default function Lightbox({ image, onClose }: { image: LightboxImage; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={image.alt}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm sm:p-8"
    >
      <motion.figure
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.94, opacity: 0 }}
        transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-full max-w-5xl flex-col items-center"
      >
        <img
          src={image.url}
          alt={image.alt}
          className="max-h-[82vh] w-auto max-w-full rounded-lg object-contain shadow-2xl"
        />
      </motion.figure>

      <button
        onClick={onClose}
        aria-label="Close image (Esc)"
        className="absolute top-4 right-4 rounded-lg border border-white/15 bg-black/50 px-3 py-2 font-mono text-xs text-white/80 backdrop-blur-md hover:bg-black/80 hover:text-white"
      >
        ✕ Esc
      </button>
    </motion.div>
  );
}
