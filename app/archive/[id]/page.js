"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";

export default function ArchivePage() {
  const params = useParams();
  const id = params.id;
  const { data: session } = useSession();
  const [meta, setMeta] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [showBanner, setShowBanner] = useState(true);

  // Title editing state
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [saving, setSaving] = useState(false);

  const isOwner = session?.user?.dbId && meta?.userId && session.user.dbId === meta.userId;

  useEffect(() => {
    fetch(`/api/archive/${id}`, { method: "HEAD" })
      .then((res) => {
        if (!res.ok) {
          setNotFound(true);
          return;
        }
        setMeta({
          url: res.headers.get("x-archive-original-url") || "Unknown",
          date: res.headers.get("x-archive-date") || "",
          title: decodeURIComponent(
            res.headers.get("x-archive-title") || ""
          ),
          thumbnail: res.headers.get("x-archive-thumbnail") || "",
          user: decodeURIComponent(
            res.headers.get("x-archive-user") || ""
          ),
          userId: res.headers.get("x-archive-user-id") || "",
          description: decodeURIComponent(
            res.headers.get("x-archive-description") || ""
          ),
        });
      })
      .catch(() => setNotFound(true));
  }, [id]);

  async function handleSaveTitle() {
    if (!editTitle.trim() || editTitle.trim() === meta.title) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/archive/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setMeta((prev) => ({ ...prev, title: data.title }));
        setEditing(false);
      }
    } catch {
      // silently fail
    } finally {
      setSaving(false);
    }
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-[#101010] text-[#e8e8e8] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#282828] text-[120px] font-bold leading-none select-none mb-4">
            404
          </p>
          <h1 className="text-xl font-semibold mb-2">Archive not found</h1>
          <p className="text-[#555] text-sm mb-8">
            This archive doesn&apos;t exist or has been removed.
          </p>
          <a
            href="/"
            className="inline-block px-5 py-2.5 text-sm font-medium bg-[#e8e8e8] text-[#101010] hover:bg-white transition-colors no-underline rounded-sm"
          >
            Back to home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#101010]">
      {/* Top Banner */}
      {showBanner && (
        <div className="bg-[#101010] border-b border-[#282828] px-4 h-11 flex items-center gap-3 shrink-0">
          <a
            href="/"
            className="flex items-center gap-2 no-underline shrink-0"
          >
            <div className="w-5 h-5 bg-[#e8e8e8] rounded-sm flex items-center justify-center">
              <span className="text-[#101010] text-[9px] font-bold">W</span>
            </div>
            <span className="text-xs font-semibold text-[#e8e8e8] tracking-tight">
              WebSlab
            </span>
          </a>

          <div className="h-4 w-px bg-[#282828] mx-1" />

          {meta && (
            <div className="flex-1 min-w-0 flex items-center gap-3">
              {meta.thumbnail && (
                <img
                  src={meta.thumbnail}
                  alt=""
                  className="w-6 h-6 rounded-sm object-cover shrink-0 hidden sm:block ring-1 ring-[#282828]"
                  onError={(e) => (e.target.style.display = "none")}
                />
              )}
              <div className="flex-1 min-w-0 flex items-center gap-2">
                {editing ? (
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveTitle();
                        if (e.key === "Escape") setEditing(false);
                      }}
                      autoFocus
                      className="flex-1 min-w-0 h-6 px-2 bg-[#181818] border border-[#383838] text-[#e8e8e8] text-xs focus:outline-none focus:border-[#555] rounded-sm"
                    />
                    <button
                      onClick={handleSaveTitle}
                      disabled={saving}
                      className="px-2 py-0.5 text-[10px] bg-[#e8e8e8] text-[#101010] font-medium hover:bg-white disabled:opacity-40 cursor-pointer rounded-sm transition-colors"
                    >
                      {saving ? "..." : "Save"}
                    </button>
                    <button
                      onClick={() => setEditing(false)}
                      className="px-2 py-0.5 text-[10px] text-[#555] hover:text-[#e8e8e8] cursor-pointer transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="text-[#e8e8e8] text-xs truncate block max-w-md">
                      {meta.title || meta.url}
                    </span>
                    {isOwner && (
                      <button
                        onClick={() => {
                          setEditTitle(meta.title || "");
                          setEditing(true);
                        }}
                        className="shrink-0 p-0.5 text-[#383838] hover:text-[#888] cursor-pointer transition-colors"
                        title="Edit title"
                      >
                        <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                    )}
                  </>
                )}
              </div>
              <div className="shrink-0 hidden md:flex items-center gap-4 text-[10px] font-mono text-[#555]">
                {meta.date && (
                  <span>
                    {new Date(meta.date).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                )}
                {meta.user && <span>{meta.user}</span>}
              </div>
            </div>
          )}

          <div className="flex items-center gap-1.5 shrink-0 ml-auto">
            {meta && (
              <a
                href={meta.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 text-[10px] border border-[#282828] text-[#888] hover:text-[#e8e8e8] hover:border-[#383838] transition-colors no-underline hidden sm:block rounded-sm"
              >
                Original
              </a>
            )}
            <button
              onClick={() => setShowBanner(false)}
              className="p-1 hover:bg-[#1f1f1f] transition-colors text-[#555] hover:text-[#e8e8e8] cursor-pointer rounded-sm"
              title="Hide banner"
            >
              <svg
                width="14"
                height="14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Collapsed banner toggle */}
      {!showBanner && (
        <button
          onClick={() => setShowBanner(true)}
          className="fixed top-3 right-3 z-50 w-8 h-8 flex items-center justify-center bg-[#101010]/90 border border-[#282828] text-[#555] hover:text-[#e8e8e8] hover:border-[#383838] transition-colors cursor-pointer backdrop-blur-sm rounded-sm"
          title="Show banner"
        >
          <svg
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}

      {/* Iframe with archived content */}
      <iframe
        src={`/api/archive/${id}`}
        className="flex-1 w-full border-0 bg-white"
        title="Archived webpage"
        sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
      />
    </div>
  );
}
