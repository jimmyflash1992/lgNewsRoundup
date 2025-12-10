document.addEventListener("DOMContentLoaded", () => {
  // Local XML file in the same folder
  loadFeed("./feed.xml");
});

async function loadFeed(url) {
  const heroTitle = document.getElementById("hero-title");
  const heroDescription = document.getElementById("hero-description");
  const heroImage = document.getElementById("hero-image");
  const heroTags = document.getElementById("hero-tags");
  const editionStatus = document.getElementById("edition-status");
  const editionDate = document.getElementById("edition-date");
  const storiesList = document.getElementById("stories-list");
  const notesStatus = document.getElementById("notes-status");

  try {
    // Try remote feed first (client site). If it fails (CORS or network), fall back to the provided local `url`.
    let xmlText = null;
    try {
      const remoteUrl = "https://lgnewsroundup.com/feed/";
      const remoteResp = await fetch(remoteUrl);
      if (remoteResp && remoteResp.ok) {
        xmlText = await remoteResp.text();
        editionStatus && (editionStatus.textContent = "Loaded from lgnewsroundup.com");
      } else {
        throw new Error('Remote feed unavailable');
      }
    } catch (remoteErr) {
      // Remote failed (likely CORS or network). Try the local file passed in `url`.
      const response = await fetch(url);
      if (!response.ok) throw new Error("Network error loading feed.xml");
      xmlText = await response.text();
      editionStatus && (editionStatus.textContent = "Loaded from local feed");
    }
    const parser = new DOMParser();
    const xml = parser.parseFromString(xmlText, "application/xml");

    if (xml.querySelector("parsererror")) {
      throw new Error("Error parsing feed.xml");
    }

    const items = Array.from(xml.querySelectorAll("item"));
    if (!items.length) {
      showEmptyState();
      return;
    }

    const stories = items.map((item) => normaliseItem(item));

    // Deduplicate by link or title
    const seen = new Set();
    const uniqueStories = stories.filter((s) => {
      const key = (s.link || "") + "|" + (s.title || "");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    if (!uniqueStories.length) {
      showEmptyState();
      return;
    }

    const [hero, ...rest] = uniqueStories;

    // Render hero
    heroTitle.textContent = hero.title || "Latest edition";
    heroDescription.textContent =
      hero.description ||
      "Fresh local government stories will appear here once the feed updates.";

    // Tags
    heroTags.innerHTML = "";
    if (hero.primaryTag) {
      const tag = document.createElement("span");
      tag.className = "tag";
      tag.textContent = hero.primaryTag;
      heroTags.appendChild(tag);
    }
    const curatedTag = document.createElement("span");
    curatedTag.className = "tag tag-secondary";
    curatedTag.textContent = "Curated analysis";
    heroTags.appendChild(curatedTag);

    const weeklyTag = document.createElement("span");
    weeklyTag.className = "tag tag-secondary";
    weeklyTag.textContent = "Weekly";
    heroTags.appendChild(weeklyTag);

    // Hero image: set <img> src and use logo fallback
    if (heroImage) {
      heroImage.src = hero.imageUrl || "logo.png";
      heroImage.alt = hero.title || "Lead story image";
    }

    // Edition meta
    editionStatus.textContent = "Latest edition";
    if (hero.pubDate) {
      editionDate.textContent = "Edition date · " + formatDate(hero.pubDate);
      // Mirror edition date into a duplicate element for alternate placements
      const editionDup = document.getElementById("edition-date-duplicate");
      if (editionDup) editionDup.textContent = editionDate.textContent;
    }

    // Render list
    storiesList.innerHTML = "";
    const extraStories = rest.slice(0, 6);

    if (extraStories.length) {
      extraStories.forEach((story) => {
        storiesList.appendChild(renderStoryCard(story));
      });
      notesStatus.textContent = "";
    } else {
      notesStatus.textContent = "No additional stories in this edition yet.";
    }
  } catch (err) {
    console.error(err);
    showErrorState();
  }
}

function normaliseItem(item) {
  const getText = (selector) => {
    const el = item.querySelector(selector);
    return el ? el.textContent.trim() : "";
  };

  const title = getText("title");
  const link = getText("link");
  const description = stripHtml(getText("description"));
  const pubDateRaw = getText("pubDate");
  const pubDate = pubDateRaw ? new Date(pubDateRaw) : null;

  // Categories
  const categories = Array.from(item.querySelectorAll("category")).map((c) =>
    c.textContent.trim()
  );
  const primaryTag = categories[0] || "";

  // Try to find an image from common RSS conventions or inside the description
  let imageUrl = null;

  // 1) enclosure url
  const enclosure = item.querySelector('enclosure');
  if (enclosure && enclosure.getAttribute('url')) {
    imageUrl = enclosure.getAttribute('url');
  }

  // 2) media:content / media:thumbnail or other namespaced media
  if (!imageUrl) {
    const mediaContent = item.getElementsByTagName('media:content')[0] || item.getElementsByTagName('media:thumbnail')[0];
    if (mediaContent) {
      imageUrl = mediaContent.getAttribute('url') || mediaContent.getAttribute('src') || mediaContent.textContent.trim();
    }
  }

  // 3) look for an <img> tag inside description CDATA
  if (!imageUrl) {
    const descEl = item.querySelector('description');
    if (descEl) {
      const imgMatch = descEl.textContent.match(/<img[^>]+src=["']([^"']+)["']/i);
      if (imgMatch) imageUrl = imgMatch[1];
    }
  }

  // 4) last-resort: look for any child element with url/href attributes
  if (!imageUrl) {
    for (const child of Array.from(item.children)) {
      const u = child.getAttribute && (child.getAttribute('url') || child.getAttribute('href') || child.getAttribute('src'));
      if (u) {
        imageUrl = u;
        break;
      }
    }
  }

  // 5) fallback to logo.png (client should add their logo.png at repo root)
  if (!imageUrl) imageUrl = 'logo.png';

  return {
    title,
    link,
    description,
    pubDate,
    primaryTag,
    imageUrl
  };
}

function renderStoryCard(story) {
  const article = document.createElement("article");
  article.className = "story-card";

  // Optional image for the story. If there's no image, show logo.png as fallback
  if (story.imageUrl) {
    const img = document.createElement('img');
    img.src = story.imageUrl;
    img.alt = story.title || 'Story image';
    article.appendChild(img);
  } else {
    const img = document.createElement('img');
    img.src = 'logo.png';
    img.alt = 'LG News Roundup logo';
    article.appendChild(img);
  }

  const main = document.createElement("div");
  main.className = "story-main";

  const title = document.createElement("h4");
  title.className = "story-title";

  if (story.link) {
    const a = document.createElement("a");
    a.href = story.link;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.textContent = story.title || "Read story";
    title.appendChild(a);
  } else {
    title.textContent = story.title || "Story";
  }

  const desc = document.createElement("p");
  desc.className = "story-description";
  desc.textContent = story.description;

  main.appendChild(title);
  main.appendChild(desc);

  const meta = document.createElement("div");
  meta.className = "story-meta";

  if (story.primaryTag) {
    const tag = document.createElement("div");
    tag.className = "story-tag";
    tag.textContent = story.primaryTag;
    meta.appendChild(tag);
  }

  if (story.pubDate instanceof Date && !isNaN(story.pubDate)) {
    const dateEl = document.createElement("div");
    dateEl.textContent = formatDate(story.pubDate);
    meta.appendChild(dateEl);
  }

  article.appendChild(main);
  article.appendChild(meta);

  return article;
}

function stripHtml(html) {
  if (!html) return "";
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return (tmp.textContent || tmp.innerText || "").trim();
}

function formatDate(dateInput) {
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(d)) return "";
  return d.toLocaleDateString("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function showEmptyState() {
  document.getElementById("hero-title").textContent = "No editions yet";
  document.getElementById("hero-description").textContent =
    "When the first XML edition is published, it will appear here.";
  document.getElementById("notes-status").textContent =
    "No stories in this edition yet.";
}

function showErrorState() {
  document.getElementById("hero-title").textContent =
    "We couldn't load the latest edition.";
  document.getElementById("hero-description").textContent =
    "Please check that feed.xml is present in the same folder as this page.";
  document.getElementById("notes-status").textContent =
    "There was a problem loading the latest stories.";
}
