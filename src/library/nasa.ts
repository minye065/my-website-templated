export interface NasaPhoto {
  title: string;
  description: string;
  date: string;
  thumb: string;
  isHubble: boolean;
  link: string;
}

interface RawItem {
  data?: Array<{
    title?: string;
    description?: string;
    date_created?: string;
    nasa_id?: string;
    keywords?: string[];
  }>;
  links?: Array<{ href?: string; rel?: string }>;
}

const cache = new Map<string, NasaPhoto | null>();
const BAD = /\b(illustration|artist|concept|logo|poster|briefing|conference|portrait|award|employee)\b/;

async function search(q: string): Promise<RawItem[]> {
  try {
    const res = await fetch(
      `https://images-api.nasa.gov/search?media_type=image&page_size=40&q=${encodeURIComponent(q)}`,
    );
    if (!res.ok) return [];
    return (await res.json())?.collection?.items ?? [];
  } catch {
    return [];
  }
}

function score(item: RawItem, tokens: string[]): number {
  const d = item.data?.[0];
  if (!d) return -Infinity;
  const title = (d.title ?? '').toLowerCase();
  const hay = `${title} ${(d.keywords ?? []).join(' ')} ${d.description ?? ''}`.toLowerCase();
  let s = 0;
  for (const t of tokens) if (t) s += title.includes(t) ? 6 : hay.includes(t) ? 2 : 0;
  if (/hubble/.test(hay)) s += 3;
  if (/hubble/.test(title)) s += 2;
  if (BAD.test(hay)) s -= 6;
  return s;
}

function toPhoto(item: RawItem): NasaPhoto | null {
  const d = item.data?.[0];
  if (!d) return null;
  const links = (item.links ?? []).filter((l) => !!l.href);
  const byName = (frag: string) => links.find((l) => l.href!.includes(frag))?.href;
  const thumb = byName('~medium') ?? byName('~small') ?? byName('~thumb')
    ?? links.find((l) => l.rel === 'preview')?.href ?? links[0]?.href;
  if (!thumb) return null;
  const hay = `${d.title ?? ''} ${(d.keywords ?? []).join(' ')} ${d.description ?? ''}`;
  return {
    title: d.title ?? 'Untitled',
    description: (d.description ?? '').replace(/\s+/g, ' ').trim(),
    date: (d.date_created ?? '').slice(0, 10),
    thumb,
    isHubble: /hubble/i.test(hay),
    link: `https://images.nasa.gov/details/${encodeURIComponent(d.nasa_id ?? '')}`,
  };
}

export async function findPhoto(key: string, queries: string[], tokens: string[]): Promise<NasaPhoto | null> {
  if (cache.has(key)) return cache.get(key) ?? null;
  const lowered = tokens.map((t) => t.toLowerCase()).filter(Boolean);
  let best: RawItem | null = null;
  let bestScore = -Infinity;
  for (const q of queries) {
    for (const it of (await search(q)).slice(0, 25)) {
      const s = score(it, lowered);
      if (s > bestScore) { bestScore = s; best = it; }
    }
    if (bestScore >= 8) break;
  }
  const photo = best && bestScore > 0 ? toPhoto(best) : null;
  cache.set(key, photo);
  return photo;
}
