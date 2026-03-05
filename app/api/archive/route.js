import { auth } from "@/lib/auth";
import { getDb, initDb } from "@/lib/db";
import { cacheInvalidate } from "@/lib/cache";
import { nanoid } from "nanoid";
import puppeteerExtra from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import chromium from "@sparticuz/chromium";

// Apply stealth plugin to hide automation signals from Cloudflare
puppeteerExtra.use(StealthPlugin());

// Increase max execution time for Vercel serverless
export const maxDuration = 60;

/* ------- Size limits for image inlining ------- */
const MAX_SINGLE_IMAGE = 2 * 1024 * 1024; // 2 MB per image
const MAX_TOTAL_INLINE = 12 * 1024 * 1024; // 12 MB total budget

/**
 * Resolve a potentially relative URL to an absolute URL.
 */
function toAbsolute(raw, baseUrl) {
  if (
    !raw ||
    raw.startsWith("data:") ||
    raw.startsWith("blob:") ||
    raw.startsWith("#")
  ) {
    return raw;
  }
  try {
    return new URL(raw, baseUrl).href;
  } catch {
    return raw;
  }
}

/* ------- Download an image and return a data-URI ------- */
async function fetchAsDataUri(url) {
  try {
    const res = await fetch(url, {
      headers: {
        ...browserHeaders(url, 0),
        "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;

    const ct = res.headers.get("content-type") || "image/png";
    const buf = await res.arrayBuffer();

    if (buf.byteLength > MAX_SINGLE_IMAGE) return null; // too large
    if (!ct.startsWith("image/") && !ct.startsWith("font/")) return null;

    const b64 = Buffer.from(buf).toString("base64");
    return { dataUri: `data:${ct};base64,${b64}`, size: buf.byteLength };
  } catch {
    return null;
  }
}

/* ------- Collect all unique image URLs from HTML ------- */
function collectImageUrls(html, baseUrl) {
  const urls = new Set();

  // <img src="...">, <source srcset="...">, poster="...", <image href="..."> (svg)
  const srcRe = /<(?:img|source|video|audio|embed)\b[^>]*\bsrc\s*=\s*"([^"]*?)"/gi;
  let m;
  while ((m = srcRe.exec(html))) {
    const abs = toAbsolute(m[1], baseUrl);
    if (abs && !abs.startsWith("data:")) urls.add(abs);
  }

  // srcset entries
  const srcsetRe = /\bsrcset\s*=\s*"([^"]*?)"/gi;
  while ((m = srcsetRe.exec(html))) {
    for (const entry of m[1].split(",")) {
      const u = entry.trim().split(/\s+/)[0];
      if (u) {
        const abs = toAbsolute(u, baseUrl);
        if (abs && !abs.startsWith("data:")) urls.add(abs);
      }
    }
  }

  // CSS url(...) in <style> blocks and inline styles
  const cssUrlRe = /url\(\s*(?:"([^"]*?)"|'([^']*?)'|([^)]*?))\s*\)/gi;
  while ((m = cssUrlRe.exec(html))) {
    const val = m[1] ?? m[2] ?? m[3];
    if (!val || val.startsWith("data:")) continue;
    const abs = toAbsolute(val.trim(), baseUrl);
    if (abs && /\.(png|jpe?g|gif|webp|avif|svg|ico|bmp|cur)(\?|$)/i.test(abs)) {
      urls.add(abs);
    }
  }

  // favicon / shortcut icon
  const linkIconRe = /<link[^>]*\brel\s*=\s*"(?:icon|shortcut icon|apple-touch-icon)"[^>]*\bhref\s*=\s*"([^"]*?)"/gi;
  while ((m = linkIconRe.exec(html))) {
    const abs = toAbsolute(m[1], baseUrl);
    if (abs && !abs.startsWith("data:")) urls.add(abs);
  }

  return urls;
}

/* ------- Download images in parallel and build a URL→dataURI map ------- */
async function downloadImages(urls) {
  const map = new Map(); // url → dataUri
  let totalSize = 0;

  // Download in batches of 10 concurrently
  const urlArr = [...urls];
  for (let i = 0; i < urlArr.length; i += 10) {
    if (totalSize >= MAX_TOTAL_INLINE) break;
    const batch = urlArr.slice(i, i + 10);
    const results = await Promise.allSettled(
      batch.map((u) => fetchAsDataUri(u))
    );
    for (let j = 0; j < results.length; j++) {
      const r = results[j];
      if (r.status === "fulfilled" && r.value) {
        if (totalSize + r.value.size <= MAX_TOTAL_INLINE) {
          map.set(batch[j], r.value.dataUri);
          totalSize += r.value.size;
        }
      }
    }
  }
  return map;
}

/**
 * Rewrite all resource URLs in the HTML.
 * Images that were downloaded are replaced with data URIs.
 * Everything else is made absolute so CSS/JS still load from origin.
 */
function rewriteUrls(html, pageUrl, imageMap) {
  const base = pageUrl;

  // Helper: return data URI if we have it, otherwise make absolute
  const resolve = (raw) => {
    const abs = toAbsolute(raw, base);
    if (imageMap.has(abs)) return imageMap.get(abs);
    return abs;
  };

  // 1. Rewrite src / href / poster / action attributes
  html = html.replace(
    /(\b(?:src|href|poster|action))\s*=\s*(?:"([^"]*?)"|'([^']*?)')/gi,
    (match, attr, doubleVal, singleVal) => {
      const val = doubleVal !== undefined ? doubleVal : singleVal;
      if (!val) return match;
      return `${attr}="${resolve(val)}"`;
    }
  );

  // 2. Rewrite srcset="..."
  html = html.replace(
    /(\bsrcset)\s*=\s*"([^"]*?)"/gi,
    (match, attr, val) => {
      if (!val) return match;
      const rewritten = val
        .split(",")
        .map((entry) => {
          const parts = entry.trim().split(/\s+/);
          if (parts.length >= 1) parts[0] = resolve(parts[0]);
          return parts.join(" ");
        })
        .join(", ");
      return `${attr}="${rewritten}"`;
    }
  );

  // 3. Rewrite CSS url(...)
  const rewriteCssUrls = (css) =>
    css.replace(
      /url\(\s*(?:"([^"]*?)"|'([^']*?)'|([^)]*?))\s*\)/gi,
      (match, dq, sq, bare) => {
        const val = dq !== undefined ? dq : sq !== undefined ? sq : bare;
        if (!val || val.startsWith("data:")) return match;
        return `url("${resolve(val)}")`;
      }
    );

  html = html.replace(
    /(<style[^>]*>)([\s\S]*?)(<\/style>)/gi,
    (match, open, css, close) => open + rewriteCssUrls(css) + close
  );

  html = html.replace(
    /(style\s*=\s*")([^"]*?)(")/gi,
    (match, open, css, close) => open + rewriteCssUrls(css) + close
  );

  // 4. Rewrite <meta content="..."> for og:image etc.
  html = html.replace(
    /(<meta[^>]*(?:property|name)\s*=\s*"(?:og:image|twitter:image)[^"]*"[^>]*content\s*=\s*")([^"]*?)(")/gi,
    (match, before, url, after) => before + resolve(url) + after
  );

  return html;
}

/**
 * Extract thumbnail URL and description from HTML.
 */
function extractMeta(html, pageUrl) {
  let thumbnail = "";
  const ogImageMatch = html.match(
    /<meta[^>]*property\s*=\s*"og:image"[^>]*content\s*=\s*"([^"]*?)"/i
  );
  if (ogImageMatch) thumbnail = ogImageMatch[1];

  if (!thumbnail) {
    const twitterMatch = html.match(
      /<meta[^>]*name\s*=\s*"twitter:image"[^>]*content\s*=\s*"([^"]*?)"/i
    );
    if (twitterMatch) thumbnail = twitterMatch[1];
  }

  if (!thumbnail) {
    const imgMatch = html.match(/<img[^>]*src\s*=\s*"([^"]*?)"/i);
    if (imgMatch && !imgMatch[1].startsWith("data:")) {
      thumbnail = imgMatch[1];
    }
  }

  if (thumbnail) thumbnail = toAbsolute(thumbnail, pageUrl);

  // No external thumbnail service — if no image found, leave empty
  // (thum.io gets blocked by Cloudflare and shows challenge pages)

  let description = "";
  const descMatch = html.match(
    /<meta[^>]*name\s*=\s*"description"[^>]*content\s*=\s*"([^"]*?)"/i
  );
  if (descMatch) description = descMatch[1];
  if (!description) {
    const ogDescMatch = html.match(
      /<meta[^>]*property\s*=\s*"og:description"[^>]*content\s*=\s*"([^"]*?)"/i
    );
    if (ogDescMatch) description = ogDescMatch[1];
  }

  return { thumbnail, description };
}

/* ------- Browser-like fetch with retries ------- */
const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:132.0) Gecko/20100101 Firefox/132.0",
];

function browserHeaders(url, uaIndex = 0) {
  return {
    "User-Agent": USER_AGENTS[uaIndex % USER_AGENTS.length],
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    "Cache-Control": "no-cache",
    "Pragma": "no-cache",
    "Sec-Ch-Ua": '"Chromium";v="131", "Not_A Brand";v="24"',
    "Sec-Ch-Ua-Mobile": "?0",
    "Sec-Ch-Ua-Platform": '"Windows"',
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Sec-Fetch-User": "?1",
    "Upgrade-Insecure-Requests": "1",
    "Referer": new URL(url).origin + "/",
  };
}

/**
 * Fetch a URL with browser-like headers.
 * Retries up to 3 times with different User-Agents.
 * On final retry, falls back to a Google Cache / web proxy.
 */
async function fetchPage(url) {
  let lastError = null;

  // Attempt 1-3: direct fetch with rotating UAs
  for (let i = 0; i < 3; i++) {
    try {
      const res = await fetch(url, {
        headers: browserHeaders(url, i),
        redirect: "follow",
        signal: AbortSignal.timeout(15000),
      });
      if (res.ok) return res;
      lastError = res.status;
      // If 403/406/451, try next UA; otherwise break
      if (![403, 406, 429, 451].includes(res.status)) break;
    } catch (e) {
      lastError = e.message;
    }
  }

  // Attempt 4: use Google webcache as proxy
  try {
    const cacheUrl = `https://webcache.googleusercontent.com/search?q=cache:${encodeURIComponent(url)}`;
    const res = await fetch(cacheUrl, {
      headers: browserHeaders(cacheUrl, 0),
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
    });
    if (res.ok) return res;
  } catch {
    // fall through
  }

  // Attempt 5: use archive.org Wayback as read-through proxy
  try {
    const wbUrl = `https://web.archive.org/web/2/${url}`;
    const res = await fetch(wbUrl, {
      headers: browserHeaders(wbUrl, 1),
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
    });
    if (res.ok) return res;
  } catch {
    // fall through
  }

  // Attempt 6: 12ft.io proxy (strips paywalls/blocks)
  try {
    const proxyUrl = `https://12ft.io/api/proxy?q=${encodeURIComponent(url)}`;
    const res = await fetch(proxyUrl, {
      headers: { "User-Agent": USER_AGENTS[0] },
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
    });
    if (res.ok) return res;
  } catch {
    // fall through
  }

  // Attempt 7: Headless browser (handles Cloudflare JS challenges)
  try {
    const html = await fetchWithBrowser(url);
    if (html) {
      // Wrap the HTML string in a Response-like object
      return {
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "text/html; charset=utf-8" }),
        text: async () => html,
      };
    }
  } catch (e) {
    console.error("Puppeteer fallback error:", e.message);
  }

  return { ok: false, status: lastError || 403, fallback: true };
}

/**
 * Launch a stealth headless Chromium browser to fetch a page.
 * Uses puppeteer-extra-plugin-stealth to hide automation signals
 * so Cloudflare and similar bot protections are bypassed.
 */
async function fetchWithBrowser(url) {
  let browser = null;
  try {
    browser = await puppeteerExtra.launch({
      args: [
        ...chromium.args,
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-blink-features=AutomationControlled",
      ],
      defaultViewport: { width: 1280, height: 800 },
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();

    // Set realistic browser fingerprint
    await page.setUserAgent(USER_AGENTS[0]);
    await page.setExtraHTTPHeaders({
      "Accept-Language": "en-US,en;q=0.9",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    });

    // Override navigator.webdriver to hide automation
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, "webdriver", { get: () => false });
      // Fake plugins
      Object.defineProperty(navigator, "plugins", {
        get: () => [1, 2, 3, 4, 5],
      });
      // Fake languages
      Object.defineProperty(navigator, "languages", {
        get: () => ["en-US", "en"],
      });
      // Pass Chrome-specific checks
      window.chrome = { runtime: {} };
    });

    // Navigate and wait for network to settle
    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: 35000,
    });

    // Check if stuck on a Cloudflare challenge
    const isChallenge = await page.evaluate(() => {
      return (
        document.title.includes("Just a moment") ||
        document.title.includes("Cloudflare") ||
        !!document.querySelector("#challenge-running") ||
        !!document.querySelector("#challenge-stage") ||
        !!document.querySelector(".cf-challenge")
      );
    });

    if (isChallenge) {
      console.log("Cloudflare challenge detected, waiting for resolution...");
      // Wait for challenge to auto-resolve (stealth plugin helps here)
      try {
        await page.waitForFunction(
          () => {
            return (
              !document.title.includes("Just a moment") &&
              !document.title.includes("Cloudflare") &&
              !document.querySelector("#challenge-running") &&
              !document.querySelector("#challenge-stage")
            );
          },
          { timeout: 20000 }
        );
        // Extra wait for page content to load after challenge
        await new Promise((r) => setTimeout(r, 2000));
      } catch {
        // Challenge didn't resolve in time
        await browser.close();
        browser = null;
        return null;
      }
    } else {
      // Small wait for dynamic content
      await new Promise((r) => setTimeout(r, 1500));
    }

    const html = await page.content();
    await browser.close();
    browser = null;

    // Final sanity check — make sure we didn't capture a challenge page
    if (
      html.includes("Performing security verification") ||
      html.includes("cf-challenge-running")
    ) {
      return null;
    }

    return html;
  } catch (e) {
    console.error("Stealth browser fetch error:", e.message);
    return null;
  } finally {
    if (browser) {
      try { await browser.close(); } catch {}
    }
  }
}

export async function POST(request) {
  try {
    // Require authentication
    const session = await auth();
    if (!session?.user) {
      return Response.json(
        { error: "You must be signed in to archive a webpage." },
        { status: 401 }
      );
    }

    const { url } = await request.json();

    // Validate URL
    let parsedUrl;
    try {
      parsedUrl = new URL(url);
    } catch {
      return Response.json(
        { error: "Invalid URL provided." },
        { status: 400 }
      );
    }

    // Only allow http/https
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return Response.json(
        { error: "Only HTTP and HTTPS URLs are supported." },
        { status: 400 }
      );
    }

    // Fetch the page with browser impersonation + fallback proxies
    const response = await fetchPage(parsedUrl.href);

    if (!response.ok) {
      return Response.json(
        { error: `Failed to fetch URL: HTTP ${response.status}. The site may be blocking automated access.` },
        { status: 502 }
      );
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html")) {
      return Response.json(
        { error: "URL does not return an HTML page." },
        { status: 400 }
      );
    }

    let html = await response.text();

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : parsedUrl.hostname;

    // Extract metadata (thumbnail, description) before rewriting
    const { thumbnail, description } = extractMeta(html, parsedUrl.href);

    // ----- Download images and inline as base64 data URIs -----
    const imageUrls = collectImageUrls(html, parsedUrl.href);
    const imageMap = await downloadImages(imageUrls);

    // Rewrite all URLs: inlined images become data URIs, rest become absolute
    html = rewriteUrls(html, parsedUrl.href, imageMap);

    // Also inject a <base> tag as fallback for anything the regex missed
    const baseTag = `<base href="${parsedUrl.origin}/" />`;
    if (html.match(/<head[^>]*>/i)) {
      html = html.replace(/<head[^>]*>/i, (m) => `${m}${baseTag}`);
    } else {
      html = baseTag + html;
    }

    // Generate short ID
    const id = nanoid(10);

    // Store in Turso
    await initDb();
    const db = getDb();
    await db.execute({
      sql: `INSERT INTO archives (id, url, title, html, thumbnail, description, user_id, user_name)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        parsedUrl.href,
        title,
        html,
        thumbnail,
        description,
        session.user.dbId || null,
        session.user.name || "",
      ],
    });

    // Invalidate list/search caches so new archive shows up
    cacheInvalidate("archives:");
    cacheInvalidate("search:");

    return Response.json({
      id,
      archiveUrl: `/archive/${id}`,
      title,
      thumbnail,
      originalUrl: parsedUrl.href,
    });
  } catch (error) {
    console.error("Archive error:", error);
    return Response.json(
      { error: "Something went wrong while archiving. Please try again." },
      { status: 500 }
    );
  }
}
