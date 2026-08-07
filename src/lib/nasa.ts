export interface NasaPhoto {
  title: string;
  description: string;
  date: string;
  url: string;
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
const inflight = new Map<string, Promise<NasaPhoto | null>>();
const BAD = /(illustration|artist|concept|logo|poster|briefing|conference|portrait|award|employee|administrator|ceremony)/;

async function search(q: string): Promise<RawItem[]> {
  try {
    const res = await fetch(
      `https://images-api.nasa.gov/search?media_type=image&page_size=40&q=${encodeURIComponent(q)}`,
    );
    if (!res.ok) return [];
    const json = await res.json();
    return json?.collection?.items ?? [];
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
  if (/hubble|webb|chandra|spitzer/.test(title)) s += 2;
  if (BAD.test(hay)) s -= 8;
  return s;
}

function toPhoto(item: RawItem): NasaPhoto | null {
  const d = item.data?.[0];
  if (!d) return null;
  // Only accept http(s) media, and upgrade to https to avoid mixed-content blocks.
  const https = (u: string) => u.replace(/^http:\/\//i, 'https://');
  const links = (item.links ?? [])
    .map((l) => l.href)
    .filter((h): h is string => !!h && /^https?:\/\//i.test(h))
    .map(https);
  const byName = (frag: string) => links.find((l) => l.includes(frag));
  const url = byName('~medium') ?? byName('~small') ?? byName('~thumb') ?? links[0];
  if (!url) return null;
  const hay = `${d.title ?? ''} ${(d.keywords ?? []).join(' ')} ${d.description ?? ''}`;
  return {
    title: d.title ?? 'Untitled',
    description: (d.description ?? '').replace(/\s+/g, ' ').trim(),
    date: (d.date_created ?? '').slice(0, 10),
    url,
    thumb: byName('~thumb') ?? url,
    isHubble: /hubble/i.test(hay),
    link: `https://images.nasa.gov/details/${encodeURIComponent(d.nasa_id ?? '')}`,
  };
}

export async function findPhoto(key: string, queries: string[], tokens: string[]): Promise<NasaPhoto | null> {
  if (cache.has(key)) return cache.get(key) ?? null;
  const running = inflight.get(key);
  if (running) return running;

  const job = (async () => {
    const lowered = tokens.map((t) => t.toLowerCase()).filter(Boolean);
    for (const q of queries) {
      const items = await search(q);
      let best: RawItem | null = null;
      let maxS = -Infinity;
      for (const it of items) {
        const s = score(it, lowered);
        if (s > maxS) {
          maxS = s;
          best = it;
        }
      }
      if (best && maxS > 0) {
        const photo = toPhoto(best);
        if (photo) {
          cache.set(key, photo);
          return photo;
        }
      }
    }
    cache.set(key, null);
    return null;
  })().finally(() => inflight.delete(key));

  inflight.set(key, job);
  return job;
}
