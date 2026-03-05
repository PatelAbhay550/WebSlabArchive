// In-memory archive store
// For production, replace with a database (e.g. Vercel KV, Supabase, MongoDB)

const archives = new Map();

export function saveArchive(id, data) {
  archives.set(id, {
    ...data,
    createdAt: new Date().toISOString(),
  });
}

export function getArchive(id) {
  return archives.get(id) || null;
}

export function getAllArchives() {
  return Array.from(archives.entries())
    .map(([id, data]) => ({
      id,
      url: data.url,
      title: data.title,
      createdAt: data.createdAt,
    }))
    .reverse(); // newest first
}
