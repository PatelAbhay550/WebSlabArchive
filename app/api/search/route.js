import { getDb, initDb } from "@/lib/db";
import { cacheGet, cacheSet } from "@/lib/cache";

export const dynamic = "force-dynamic";

const SEARCH_TTL = 20_000; // 20 seconds

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim();

    if (!q || q.length < 2) {
      return Response.json({
        archives: [],
        message: "Search query must be at least 2 characters.",
      });
    }

    const cacheKey = `search:${q.toLowerCase()}`;
    const cached = cacheGet(cacheKey);
    if (cached) return Response.json({ archives: cached });

    await initDb();
    const db = getDb();

    const searchTerm = `%${q}%`;

    const result = await db.execute({
      sql: `SELECT id, url, title, thumbnail, description, user_name, created_at 
            FROM archives 
            WHERE url LIKE ? OR title LIKE ? OR description LIKE ?
            ORDER BY created_at DESC 
            LIMIT 30`,
      args: [searchTerm, searchTerm, searchTerm],
    });

    cacheSet(cacheKey, result.rows, SEARCH_TTL);
    return Response.json({ archives: result.rows });
  } catch (error) {
    console.error("Search error:", error);
    return Response.json({ archives: [], error: "Search failed." });
  }
}
