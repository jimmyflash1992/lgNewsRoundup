import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const REMOTE_FEED = "https://lgnewsroundup.com/feed/";

async function loadRemoteFeed() {
  const response = await fetch(REMOTE_FEED);
  if (!response.ok) {
    throw new Error(`Remote feed returned ${response.status}`);
  }
  return { xml: await response.text(), source: "remote" as const };
}

async function loadLocalFeed() {
  const localPath = fileURLToPath(new URL("../../../public/feed.xml", import.meta.url));
  const xml = await readFile(localPath, "utf-8");
  return { xml, source: "local" as const };
}

export async function GET() {
  try {
    const { xml, source } = await loadRemoteFeed().catch(loadLocalFeed);

    return new Response(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/rss+xml; charset=utf-8",
        "Cache-Control": "s-maxage=300, stale-while-revalidate=3600",
        "X-Feed-Source": source
      }
    });
  } catch (error) {
    console.error("Feed proxy error", error);
    return new Response("Feed unavailable", {
      status: 502,
      headers: { "Content-Type": "text/plain; charset=utf-8" }
    });
  }
}
