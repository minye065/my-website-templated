import manifest from '../data/hubbleShowcase.json';
import overrides from '../data/imageOverrides.json';

export interface ShowcaseImage {
  url: string;
  title: string;
  source: string;
}

type ShowcaseManifest = Record<string, { url: string; title: string; source: string }>;

// catalog.ts rows that duplicate a Caldwell/Messier object under an NGC designation
const ALIASES: Record<string, string> = {
  'NGC 7000': 'C20', // North America Nebula
  'NGC 5139': 'C80', // Omega Centauri
  'NGC 253': 'C65', // Sculptor Galaxy
  'NGC 3372': 'C92', // Carina Nebula
  'NGC 6960': 'C34', // Veil Nebula
  'NGC 2237': 'C49', // Rosette Nebula
  'NGC 4565': 'C38', // Needle Galaxy
};

export function findShowcase(desig: string): ShowcaseImage | null {
  const aliased = ALIASES[desig] ?? '';
  const entry =
    (overrides as ShowcaseManifest)[desig] ??
    (overrides as ShowcaseManifest)[aliased] ??
    (manifest as ShowcaseManifest)[desig] ??
    (manifest as ShowcaseManifest)[aliased];
  return entry ? { ...entry } : null;
}
