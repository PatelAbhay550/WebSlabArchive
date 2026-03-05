import { getDb, initDb } from "@/lib/db";
import { cacheGet, cacheSet } from "@/lib/cache";

export const dynamic = "force-dynamic";

const LIST_TTL = 30_000; // 30 seconds

export async function GET() {
  try {
    const cacheKey = "archives:recent";
    const cached = cacheGet(cacheKey);
    if (cached) return Response.json({ archives: cached });

    await initDb();
    const db = getDb();
    const result = await db.execute(
      "SELECT id, url, title, thumbnail, description, user_name, created_at FROM archives ORDER BY created_at DESC LIMIT 50"
    );
    cacheSet(cacheKey, result.rows, LIST_TTL);
    return Response.json({ archives: result.rows });
  } catch (error) {
    console.error("List archives error:", error);
    return Response.json({ archives: [] });
  }
}
