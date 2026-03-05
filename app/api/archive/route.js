import { auth } from "@/lib/auth";
import { getDb, initDb } from "@/lib/db";
import { cacheInvalidate } from "@/lib/cache";
import { nanoid } from "nanoid";

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
        "User-Agent":
          "Mozilla/5.0 (compatible; WebSlabArchive/1.0; +https://webslabarchive.vercel.app)",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(8000), // 8s timeout per image
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

  if (!thumbnail) {
    thumbnail = `https://image.thum.io/get/width/600/crop/400/noanimate/${pageUrl}`;
  }

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

    // Fetch the page
    const response = await fetch(parsedUrl.href, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; WebSlabArchive/1.0; +https://webslabarchive.vercel.app)",
      },
      redirect: "follow",
    });

    if (!response.ok) {
      return Response.json(
        { error: `Failed to fetch URL: HTTP ${response.status}` },
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
