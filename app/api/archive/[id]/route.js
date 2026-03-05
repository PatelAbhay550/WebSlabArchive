import { getDb, initDb } from "@/lib/db";
import { auth } from "@/lib/auth";
import { cacheGet, cacheSet, cacheDel, cacheInvalidate } from "@/lib/cache";

const ARCHIVE_TTL = 5 * 60_000; // 5 minutes

export async function GET(request, { params }) {
  const { id } = await params;

  // Check cache first
  const cacheKey = `archive:${id}`;
  let archive = cacheGet(cacheKey);

  if (!archive) {
    await initDb();
    const db = getDb();
    const result = await db.execute({
      sql: "SELECT * FROM archives WHERE id = ?",
      args: [id],
    });
    archive = result.rows[0] || null;
    if (archive) cacheSet(cacheKey, archive, ARCHIVE_TTL);
  }

  if (!archive) {
    return new Response(
      `<!DOCTYPE html><html><head><title>Not Found</title></head><body style="font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#101010;color:#e8e8e8"><h1>Archive not found</h1></body></html>`,
      {
        status: 404,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      }
    );
  }

  return new Response(archive.html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "X-Archive-Original-Url": archive.url,
      "X-Archive-Date": archive.created_at,
      "X-Archive-Title": encodeURIComponent(archive.title || ""),
      "X-Archive-Thumbnail": archive.thumbnail || "",
      "X-Archive-User": encodeURIComponent(archive.user_name || ""),
      "X-Archive-User-Id": archive.user_id || "",
      "X-Archive-Description": encodeURIComponent(archive.description || ""),
    },
  });
}

/**
 * PATCH /api/archive/:id — update the title (owner only)
 */
export async function PATCH(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Not authenticated." }, { status: 401 });
    }

    const { id } = await params;
    const { title } = await request.json();

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return Response.json({ error: "Title cannot be empty." }, { status: 400 });
    }

    const cleanTitle = title.trim().slice(0, 200);

    await initDb();
    const db = getDb();

    // Verify ownership
    const result = await db.execute({
      sql: "SELECT user_id FROM archives WHERE id = ?",
      args: [id],
    });

    if (!result.rows[0]) {
      return Response.json({ error: "Archive not found." }, { status: 404 });
    }

    if (result.rows[0].user_id !== session.user.dbId) {
      return Response.json({ error: "You can only edit your own archives." }, { status: 403 });
    }

    await db.execute({
      sql: "UPDATE archives SET title = ? WHERE id = ?",
      args: [cleanTitle, id],
    });

    // Invalidate caches
    cacheDel(`archive:${id}`);
    cacheInvalidate("archives:");

    return Response.json({ ok: true, title: cleanTitle });
  } catch (error) {
    console.error("PATCH archive error:", error);
    return Response.json({ error: "Failed to update title." }, { status: 500 });
  }
}
