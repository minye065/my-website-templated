import manifest from '../data/hubbleShowcase.json';
import overrides from '../data/imageOverrides.json';

export interface ShowcaseImage
{
  url: string;
  title: string;
  source: string;
}

type ShowcaseManifest = Record<string, { url: string; title: string; source: string }>;

const ALIASES: Record<string, string> =
{
  'NGC 7000': 'C20',
  'NGC 5139': 'C80',
  'NGC 253': 'C65',
  'NGC 3372': 'C92',
  'NGC 6960': 'C34',
  'NGC 4565': 'C38',
  'NGC 2070': 'C103',
};

export function findShowcase(desig: string): ShowcaseImage | null
{
  const aliased = ALIASES[desig] ?? '';
  const entry =
    (overrides as ShowcaseManifest)[desig] ??
    (overrides as ShowcaseManifest)[aliased] ??
    (manifest as ShowcaseManifest)[desig] ??
    (manifest as ShowcaseManifest)[aliased];
  return entry ? { ...entry } : null;
}
