"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession, signIn, signOut } from "next-auth/react";

export default function Home() {
  const { data: session, status } = useSession();
  const isLoggedIn = !!session?.user;

  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [archives, setArchives] = useState([]);
  const [copied, setCopied] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchMode, setSearchMode] = useState(false);

  useEffect(() => {
    fetchArchives();
  }, []);

  async function fetchArchives() {
    try {
      const res = await fetch("/api/archives");
      const data = await res.json();
      setArchives(data.archives || []);
    } catch {
      // silently fail
    }
  }

  const handleSearch = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setSearchMode(false);
      fetchArchives();
      return;
    }
    setSearching(true);
    setSearchMode(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setArchives(data.archives || []);
    } catch {
      // silently fail
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(searchQuery);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, handleSearch]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);

    try {
      const res = await fetch("/api/archive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        return;
      }

      setResult(data);
      setUrl("");
      fetchArchives();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(""), 2000);
  }

  function formatDate(iso) {
    return new Date(iso).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function timeAgo(iso) {
    const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return formatDate(iso);
  }

  return (
    <div className="min-h-screen bg-[#101010] text-[#e8e8e8]">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-[#101010]/90 backdrop-blur-md border-b border-[#282828]">
        <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between">
          <a href="/" className="no-underline flex items-center gap-2.5">
            <div className="w-7 h-7 bg-[#e8e8e8] rounded-sm flex items-center justify-center">
              <span className="text-[#101010] text-xs font-bold tracking-tight">W</span>
            </div>
            <span className="text-sm font-semibold tracking-tight text-[#e8e8e8]">
              WebSlab Archive
            </span>
          </a>

          <div className="flex items-center gap-2">
            {status === "loading" ? (
              <div className="w-7 h-7 rounded-full bg-[#1f1f1f] animate-pulse" />
            ) : isLoggedIn ? (
              <div className="flex items-center gap-2.5">
                <img
                  src={session.user.image}
                  alt=""
                  className="w-7 h-7 rounded-full ring-1 ring-[#282828]"
                />
                <span className="text-xs text-[#888] hidden sm:inline">
                  {session.user.name}
                </span>
                <button
                  onClick={() => signOut()}
                  className="text-xs text-[#555] hover:text-[#e8e8e8] transition-colors cursor-pointer ml-1"
                >
                  Log out
                </button>
              </div>
            ) : (
              <button
                onClick={() => signIn("github")}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#e8e8e8] text-[#101010] hover:bg-white transition-colors cursor-pointer rounded-sm"
              >
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                Sign in
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <header className="max-w-6xl mx-auto px-5 pt-16 pb-10">
        <p className="text-[#555] text-xs font-mono uppercase tracking-widest mb-4">
          Web preservation tool
        </p>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-[1.1] mb-5 max-w-2xl">
          Save any page.
          <br />
          <span className="text-[#555]">Before it disappears.</span>
        </h1>
        <p className="text-[#888] text-base max-w-lg leading-relaxed">
          Capture full snapshots of webpages and get a permanent link.
          Search through all archived pages anytime.
        </p>
      </header>

      {/* Archive Form / Sign-in prompt */}
      <section className="max-w-6xl mx-auto px-5 pb-12">
        {isLoggedIn ? (
          <form onSubmit={handleSubmit} className="max-w-2xl">
            <div className="flex gap-2">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste a URL to archive..."
                required
                disabled={loading}
                className="flex-1 h-11 px-4 bg-[#181818] border border-[#282828] text-[#e8e8e8] text-sm placeholder:text-[#555] focus:outline-none focus:border-[#555] transition-colors disabled:opacity-40 rounded-sm font-mono"
              />
              <button
                type="submit"
                disabled={loading}
                className="h-11 px-5 bg-[#e8e8e8] text-[#101010] text-sm font-semibold hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer transition-colors rounded-sm whitespace-nowrap"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 border-2 border-[#101010]/20 border-t-[#101010] rounded-full animate-spin" />
                    Saving...
                  </span>
                ) : (
                  "Archive"
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="max-w-2xl border border-[#282828] bg-[#181818] p-5 rounded-sm">
            <p className="text-sm text-[#888] mb-3">
              Sign in with GitHub to start archiving webpages.
              <br />
              <span className="text-[#555]">Anyone can search and view existing archives.</span>
            </p>
            <button
              onClick={() => signIn("github")}
              className="flex items-center gap-2 px-4 py-2 bg-[#e8e8e8] text-[#101010] text-sm font-semibold hover:bg-white transition-colors cursor-pointer rounded-sm"
            >
              <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              Sign in with GitHub
            </button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-3 max-w-2xl px-4 py-3 border border-[#f87171]/20 bg-[#f87171]/5 text-[#f87171] text-sm rounded-sm">
            {error}
          </div>
        )}

        {/* Success */}
        {result && (
          <div className="mt-4 max-w-2xl border border-[#282828] bg-[#181818] rounded-sm overflow-hidden">
            {result.thumbnail && (
              <img
                src={result.thumbnail}
                alt=""
                className="w-full h-36 object-cover border-b border-[#282828]"
                onError={(e) => (e.target.style.display = "none")}
              />
            )}
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80]" />
                <span className="text-xs font-medium text-[#4ade80]">Archived</span>
              </div>
              <p className="text-sm text-[#e8e8e8] font-medium truncate mb-3">
                {result.title}
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 bg-[#101010] border border-[#282828] text-[#888] text-xs truncate font-mono rounded-sm">
                  webslabarchive.vercel.app/archive/{result.id}
                </code>
                <button
                  onClick={() =>
                    copyToClipboard(
                      `https://webslabarchive.vercel.app/archive/${result.id}`
                    )
                  }
                  className="px-3 py-2 text-xs border border-[#282828] text-[#888] hover:text-[#e8e8e8] hover:border-[#383838] transition-colors cursor-pointer rounded-sm"
                >
                  {copied ===
                  `https://webslabarchive.vercel.app/archive/${result.id}`
                    ? "Copied"
                    : "Copy"}
                </button>
                <a
                  href={`/archive/${result.id}`}
                  className="px-3 py-2 text-xs bg-[#e8e8e8] text-[#101010] font-medium hover:bg-white transition-colors no-underline rounded-sm"
                >
                  View
                </a>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Divider */}
      <div className="max-w-6xl mx-auto px-5">
        <div className="border-t border-[#282828]" />
      </div>

      {/* Search + Archives */}
      <section className="max-w-6xl mx-auto px-5 pt-10 pb-20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              {searchMode
                ? `${archives.length} result${archives.length !== 1 ? "s" : ""}`
                : "Recent archives"}
            </h2>
            <p className="text-xs text-[#555] mt-0.5">
              {searchMode ? "Matching your search" : "Latest saved pages"}
            </p>
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-72">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555]"
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search archives..."
              className="w-full h-9 pl-9 pr-3 bg-[#181818] border border-[#282828] text-sm text-[#e8e8e8] placeholder:text-[#555] focus:outline-none focus:border-[#555] transition-colors rounded-sm"
            />
            {searching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <span className="block w-3 h-3 border-2 border-[#555]/30 border-t-[#888] rounded-full animate-spin" />
              </div>
            )}
          </div>
        </div>

        {archives.length === 0 ? (
          <div className="border border-dashed border-[#282828] py-20 text-center rounded-sm">
            <p className="text-[#555] text-sm">
              {searchMode ? "No matching archives found." : "No archives yet."}
            </p>
            <p className="text-[#383838] text-xs mt-1">
              {searchMode
                ? "Try different keywords"
                : "Archive your first page to see it here"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-[#282828] border border-[#282828] rounded-sm overflow-hidden">
            {archives.map((archive) => (
              <a
                key={archive.id}
                href={`/archive/${archive.id}`}
                className="group bg-[#181818] hover:bg-[#1f1f1f] transition-colors no-underline block"
              >
                {/* Thumbnail */}
                <div className="relative aspect-16/10 bg-[#141414] overflow-hidden">
                  {archive.thumbnail ? (
                    <img
                      src={archive.thumbnail}
                      alt=""
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-200"
                      onError={(e) => {
                        e.target.style.display = "none";
                        e.target.nextElementSibling.style.display = "flex";
                      }}
                    />
                  ) : null}
                  <div
                    className={`absolute inset-0 ${archive.thumbnail ? "hidden" : "flex"} items-center justify-center bg-[#141414]`}
                  >
                    <span className="text-[#282828] text-2xl font-mono font-bold">
                      {(archive.title || archive.url || "?")[0].toUpperCase()}
                    </span>
                  </div>
                  {/* Time pill */}
                  <div className="absolute bottom-2 left-2 px-1.5 py-0.5 bg-[#101010]/80 backdrop-blur-sm text-[10px] text-[#888] font-mono rounded-sm">
                    {timeAgo(archive.created_at)}
                  </div>
                </div>

                {/* Card body */}
                <div className="p-3.5">
                  <h3 className="text-[#e8e8e8] text-sm font-medium truncate group-hover:text-white transition-colors">
                    {archive.title || "Untitled"}
                  </h3>
                  <p className="text-[#555] text-xs truncate mt-1 font-mono">
                    {archive.url?.replace(/^https?:\/\/(www\.)?/, "")}
                  </p>
                  {archive.description && (
                    <p className="text-[#555] text-xs line-clamp-2 mt-2 leading-relaxed">
                      {archive.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#282828]">
                    <span className="text-[10px] text-[#383838] font-mono">
                      {archive.id}
                    </span>
                    <div className="flex items-center gap-2 text-[10px] text-[#555]">
                      {archive.user_name && (
                        <span>{archive.user_name}</span>
                      )}
                      <span>{formatDate(archive.created_at)}</span>
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-[#282828] py-6">
        <div className="max-w-6xl mx-auto px-5">
          <p className="text-[10px] text-[#383838] leading-relaxed mb-4 max-w-2xl">
            By using this service you confirm you have the right to archive the submitted
            content. WebSlab Archive acts as a technical intermediary and is not responsible
            for user-archived content. See our{" "}
            <a href="/terms" className="text-[#555] hover:text-[#888] transition-colors underline">Terms</a>
            {" "}for details.
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#383838]">WebSlab Archive</span>
            <div className="flex items-center gap-4">
              <a href="/terms" className="text-xs text-[#383838] hover:text-[#888] transition-colors no-underline">Terms</a>
              <a href="/privacy" className="text-xs text-[#383838] hover:text-[#888] transition-colors no-underline">Privacy</a>
              <span className="text-xs text-[#383838] font-mono">
                {new Date().getFullYear()}
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
