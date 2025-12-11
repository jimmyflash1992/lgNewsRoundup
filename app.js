const DEFAULT_LOGO = "logo.png";

document.addEventListener("DOMContentLoaded", () => {
  initThemeToggle();
  initNavDropdowns();
  initNavToggle();
  initSubscribeForm();
  // Prefer proxied feed (handles CORS) then fall back to local XML
  loadFeed("/api/feed.xml", "/feed.xml");
});

function setImageWithFallback(imgEl, src, alt) {
  if (!imgEl) return;
  imgEl.src = src || DEFAULT_LOGO;
  imgEl.alt = alt || "Story image";
  imgEl.loading = "lazy";
  imgEl.onerror = () => {
    if (imgEl.src.includes(DEFAULT_LOGO)) return;
    imgEl.src = DEFAULT_LOGO;
  };
}

function initNavDropdowns() {
  const dropdowns = document.querySelectorAll(".has-dropdown");

  dropdowns.forEach((dropdown) => {
    const trigger = dropdown.querySelector(".nav-trigger");
    const menu = dropdown.querySelector(".dropdown");

    if (!trigger || !menu) return;

    const setMenuOpen = (isOpen) => {
      dropdown.classList.toggle("open", isOpen);
      trigger.setAttribute("aria-expanded", String(isOpen));
    };

    // Hover / pointer support (ignore touch to avoid accidental open)
    dropdown.addEventListener("pointerenter", (event) => {
      if (event.pointerType === "mouse" || event.pointerType === "pen") {
        setMenuOpen(true);
      }
    });
    dropdown.addEventListener("pointerleave", (event) => {
      if (event.pointerType === "mouse" || event.pointerType === "pen") {
        setMenuOpen(false);
      }
    });

    // Keyboard and focus support
    dropdown.addEventListener("focusin", () => setMenuOpen(true));
    dropdown.addEventListener("focusout", () => {
      setTimeout(() => {
        if (!dropdown.contains(document.activeElement)) {
          setMenuOpen(false);
        }
      }, 50);
    });

    // Tap/click fallback for touch devices
    trigger.addEventListener("click", (event) => {
      event.preventDefault();
      const isOpen = dropdown.classList.toggle("open");
      trigger.setAttribute("aria-expanded", String(isOpen));
    });

    dropdown.addEventListener("keyup", (event) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        trigger.blur();
      }
    });

    document.addEventListener("click", (event) => {
      if (!dropdown.contains(event.target)) {
        setMenuOpen(false);
      }
    });
  });
}

function initNavToggle() {
  const nav = document.getElementById("primary-nav");
  const toggle = document.getElementById("nav-toggle");

  if (!nav || !toggle) return;

  const closeNav = () => {
    nav.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
  };

  toggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeNav);
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth >= 720) {
      closeNav();
    }
  });

  document.addEventListener("keyup", (event) => {
    if (event.key === "Escape") {
      closeNav();
    }
  });
}

function initSubscribeForm() {
  const form = document.querySelector(".subscribe-form");
  if (!form) return;

  const emailInput = form.querySelector('input[type="email"]');
  const statusEl = document.createElement("p");
  statusEl.className = "muted small subscribe-status";
  statusEl.setAttribute("aria-live", "polite");
  form.appendChild(statusEl);

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const email = emailInput ? emailInput.value.trim() : "";

    if (!email) {
      statusEl.textContent = "Please enter a work email to subscribe.";
      emailInput?.focus();
      return;
    }

    statusEl.textContent = "Thanks! We'll send the next edition to " + email + ".";
  });
}

function initThemeToggle() {
  const toggle = document.getElementById("theme-toggle");
  const savedTheme = localStorage.getItem("lg-theme");
  const initialTheme = savedTheme || "light";

  applyTheme(initialTheme, toggle);

  if (toggle) {
    toggle.addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme") || "light";
      const next = current === "dark" ? "light" : "dark";
      applyTheme(next, toggle);
      localStorage.setItem("lg-theme", next);
    });
  }
}

function applyTheme(mode, toggleBtn) {
  document.documentElement.setAttribute("data-theme", mode);
  if (toggleBtn) {
    const isDark = mode === "dark";
    toggleBtn.setAttribute("aria-pressed", isDark);
    toggleBtn.classList.toggle("is-dark", isDark);
    const icon = toggleBtn.querySelector(".toggle-icon");
    if (icon) {
      icon.textContent = isDark ? "🌙" : "☀️";
    }
  }
}

async function loadFeed(apiUrl, fallbackUrl) {
  const heroTitle = document.getElementById("hero-title");
  const heroDescription = document.getElementById("hero-description");
  const heroImage = document.getElementById("hero-image");
  const heroTags = document.getElementById("hero-tags");
  const editionStatus = document.getElementById("edition-status");
  const editionDate = document.getElementById("edition-date");
  const storiesList = document.getElementById("stories-list");
  const notesStatus = document.getElementById("notes-status");

  try {
    let xmlText = null;

    const apiResponse = await fetch(apiUrl);

    if (apiResponse.ok) {
      xmlText = await apiResponse.text();
      const sourceHeader = apiResponse.headers.get("x-feed-source");
      if (editionStatus) {
        editionStatus.textContent =
          sourceHeader === "remote" ? "Loaded from lgnewsroundup.com" : "Loaded from local feed";
      }
    }

    if (!xmlText && fallbackUrl) {
      const fallbackResponse = await fetch(fallbackUrl);
      if (!fallbackResponse.ok) throw new Error("Network error loading fallback feed.xml");
      xmlText = await fallbackResponse.text();
      editionStatus && (editionStatus.textContent = "Loaded from bundled feed");
    }
    if (!xmlText) throw new Error("No feed response");

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
    const heroCategories = (hero.categories || []).slice(0, 4);
    heroCategories.forEach((cat) => {
      const tag = document.createElement("span");
      tag.className = "tag";
      tag.textContent = cat;
      heroTags.appendChild(tag);
    });
    const curatedTag = document.createElement("span");
    curatedTag.className = "tag tag-secondary";
    curatedTag.textContent = "Curated analysis";
    heroTags.appendChild(curatedTag);

    const weeklyTag = document.createElement("span");
    weeklyTag.className = "tag tag-secondary";
    weeklyTag.textContent = "Weekly";
    heroTags.appendChild(weeklyTag);

    // Hero image: set <img> src and use logo fallback
    setImageWithFallback(heroImage, hero.imageUrl || DEFAULT_LOGO, hero.title || "Lead story image");

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
    const extraStories = rest.slice(0, 8);

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
  const categoriesDeduped = Array.from(new Set(categories));
  const primaryTag = categoriesDeduped[0] || "";

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
      imageUrl = extractImgSrc(descEl.textContent);
    }
  }

  // 4) look for an <img> inside content:encoded (WordPress full content)
  if (!imageUrl) {
    const contentEl = item.getElementsByTagName('content:encoded')[0];
    if (contentEl) {
      imageUrl = extractImgSrc(contentEl.textContent);
    }
  }

  // 5) last-resort: look for any child element with url/href attributes
  if (!imageUrl) {
    for (const child of Array.from(item.children)) {
      const u = child.getAttribute && (child.getAttribute('url') || child.getAttribute('href') || child.getAttribute('src'));
      if (u) {
        imageUrl = u;
        break;
      }
    }
  }

  // 6) fallback to logo.png (client should add their logo.png at repo root)
  if (!imageUrl) imageUrl = DEFAULT_LOGO;

  return {
    title,
    link,
    description,
    pubDate,
    categories: categoriesDeduped,
    primaryTag,
    imageUrl
  };
}

function extractImgSrc(htmlText) {
  if (!htmlText) return null;
  const imgMatch = htmlText.match(/<img[^>]+src=["']([^"']+)["']/i);
  return imgMatch ? imgMatch[1] : null;
}

function renderStoryCard(story) {
  const article = document.createElement("article");
  article.className = "story-card";

  const storyImg = document.createElement('img');
  setImageWithFallback(storyImg, story.imageUrl || DEFAULT_LOGO, story.title || 'Story image');
  article.appendChild(storyImg);

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

  const tagWrap = document.createElement("div");
  tagWrap.className = "story-tags";
  const tagsToRender = (story.categories || []).slice(0, 3);
  tagsToRender.forEach((tagText) => {
    const tag = document.createElement("div");
    tag.className = "story-tag";
    tag.textContent = tagText;
    tagWrap.appendChild(tag);
  });
  if (tagWrap.childElementCount) meta.appendChild(tagWrap);

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
