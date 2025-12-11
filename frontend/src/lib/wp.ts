const WP_BASE = "https://lgnewsroundup.com";

type RawWPPost = {
  id: number;
  slug: string;
  date: string;
  title: { rendered: string };
  excerpt: { rendered: string };
  content: { rendered: string };
  _embedded?: {
    "wp:featuredmedia"?: Array<{
      source_url?: string;
      alt_text?: string;
    }>;
  };
};

export type WPPost = {
  id: number;
  slug: string;
  date: string;
  title: string;
  excerpt: string;
  content: string;
  imageUrl: string | null;
};

async function fetchJSON<T>(path: string): Promise<T> {
  const res = await fetch(`${WP_BASE}${path}`);
  if (!res.ok) {
    console.error(`WordPress API error: ${res.status} ${res.statusText}`);
    throw new Error(`WordPress API error: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as T;
}

function stripTags(html: string | undefined): string {
  if (!html) return "";
  return html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

function mapPost(raw: RawWPPost): WPPost {
  const media = raw._embedded?.["wp:featuredmedia"]?.[0];
  const imageUrl = media?.source_url ?? null;

  return {
    id: raw.id,
    slug: raw.slug,
    date: raw.date,
    title: stripTags(raw.title?.rendered),
    excerpt: stripTags(raw.excerpt?.rendered),
    content: raw.content?.rendered ?? "",
    imageUrl,
  };
}

export async function getLatestPosts(limit = 10): Promise<WPPost[]> {
  try {
    const posts = await fetchJSON<RawWPPost[]>(
      `/wp-json/wp/v2/posts?per_page=${limit}&_embed`
    );
    return posts.map(mapPost);
  } catch (err) {
    console.error("getLatestPosts failed, returning empty list:", err);
    return [];
  }
}

type SlugOnly = { slug: string };

export async function getAllPostSlugs(): Promise<string[]> {
  try {
    const posts = await fetchJSON<SlugOnly[]>(
      `/wp-json/wp/v2/posts?per_page=100&_fields=slug`
    );
    return posts.map((p) => p.slug);
  } catch (err) {
    console.error("getAllPostSlugs failed, returning empty list:", err);
    return [];
  }
}

export async function getPostBySlug(slug: string): Promise<WPPost | null> {
  try {
    const posts = await fetchJSON<RawWPPost[]>(
      `/wp-json/wp/v2/posts?slug=${slug}&_embed`
    );
    if (!posts.length) return null;
    return mapPost(posts[0]);
  } catch (err) {
    console.error(`getPostBySlug(${slug}) failed:`, err);
    return null;
  }
}
