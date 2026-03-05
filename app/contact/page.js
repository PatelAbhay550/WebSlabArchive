export const metadata = {
  title: "Contact — WebSlab Archive",
  description: "Contact WebSlab Archive for bug reports, DMCA takedowns, and general inquiries.",
};

export default function Contact() {
  return (
    <div className="min-h-screen bg-[#101010] text-[#e8e8e8]">
      <nav className="border-b border-[#282828]">
        <div className="max-w-3xl mx-auto px-5 h-14 flex items-center">
          <a href="/" className="no-underline flex items-center gap-2.5">
            <div className="w-7 h-7 bg-[#e8e8e8] rounded-sm flex items-center justify-center">
              <span className="text-[#101010] text-xs font-bold tracking-tight">W</span>
            </div>
            <span className="text-sm font-semibold tracking-tight text-[#e8e8e8]">
              WebSlab Archive
            </span>
          </a>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-5 py-16">
        <p className="text-[#555] text-xs font-mono uppercase tracking-widest mb-4">
          Support
        </p>
        <h1 className="text-3xl font-bold tracking-tight mb-4">Contact Us</h1>
        <p className="text-[#888] text-sm leading-relaxed mb-10 max-w-xl">
          For bug reports, DMCA takedown requests, content removal, or general inquiries,
          reach out via email. Please follow the formats below so we can respond faster.
        </p>

        {/* Email */}
        <div className="border border-[#282828] bg-[#181818] p-5 rounded-sm mb-10">
          <p className="text-xs text-[#555] font-mono uppercase tracking-widest mb-2">Email</p>
          <a
            href="mailto:patelabhay550@gmail.com"
            className="text-[#e8e8e8] text-lg font-mono hover:underline"
          >
            patelabhay550@gmail.com
          </a>
        </div>

        <div className="space-y-10">
          {/* Bug Report */}
          <section>
            <h2 className="text-base font-semibold mb-1 flex items-center gap-2">
              <span className="w-5 h-5 bg-[#282828] rounded-sm flex items-center justify-center text-[10px]">1</span>
              Bug Report
            </h2>
            <p className="text-[#555] text-xs mb-3">Something broken? Use this format.</p>
            <div className="border border-[#282828] bg-[#141414] p-4 rounded-sm font-mono text-xs text-[#888] leading-relaxed whitespace-pre-wrap">
{`Subject: [BUG] Brief description of the issue

1. What happened:
   Describe what went wrong.

2. Steps to reproduce:
   - Step 1
   - Step 2
   - Step 3

3. Expected behavior:
   What should have happened instead.

4. URL (if applicable):
   The URL you were trying to archive.

5. Browser & OS:
   e.g. Chrome 131 / Windows 11

6. Screenshots (optional):
   Attach any relevant screenshots.`}
            </div>
          </section>

          {/* DMCA Takedown */}
          <section>
            <h2 className="text-base font-semibold mb-1 flex items-center gap-2">
              <span className="w-5 h-5 bg-[#282828] rounded-sm flex items-center justify-center text-[10px]">2</span>
              DMCA / Copyright Takedown
            </h2>
            <p className="text-[#555] text-xs mb-3">
              If your copyrighted content has been archived without permission.
            </p>
            <div className="border border-[#282828] bg-[#141414] p-4 rounded-sm font-mono text-xs text-[#888] leading-relaxed whitespace-pre-wrap">
{`Subject: [DMCA] Takedown request for <archived URL>

1. Copyrighted work:
   Description or link to the original copyrighted work.

2. Infringing archive URL:
   The full URL on webslabarchive.vercel.app/archive/...

3. Your relationship to the work:
   e.g. "I am the copyright owner" / "I am authorized to act
   on behalf of the copyright owner"

4. Contact information:
   Full name:
   Organization (if applicable):
   Email:
   Phone (optional):

5. Statement of good faith:
   "I have a good faith belief that the use of the material
   is not authorized by the copyright owner, its agent, or
   the law."

6. Statement of accuracy:
   "The information in this notice is accurate. Under penalty
   of perjury, I am authorized to act on behalf of the owner
   of the copyright that is allegedly infringed."

7. Signature:
   Your full legal name (electronic signature).`}
            </div>
          </section>

          {/* Content Removal */}
          <section>
            <h2 className="text-base font-semibold mb-1 flex items-center gap-2">
              <span className="w-5 h-5 bg-[#282828] rounded-sm flex items-center justify-center text-[10px]">3</span>
              Content Removal Request
            </h2>
            <p className="text-[#555] text-xs mb-3">
              For removing archived content that contains personal data or violates our terms.
            </p>
            <div className="border border-[#282828] bg-[#141414] p-4 rounded-sm font-mono text-xs text-[#888] leading-relaxed whitespace-pre-wrap">
{`Subject: [REMOVAL] Content removal request

1. Archive URL to remove:
   The full URL on webslabarchive.vercel.app/archive/...

2. Reason for removal:
   e.g. Contains personal information / Violates terms /
   Other (please explain)

3. Your relationship to the content:
   e.g. "I am the website owner" / "This page contains
   my personal information"

4. Contact information:
   Full name:
   Email:`}
            </div>
          </section>

          {/* General Inquiry */}
          <section>
            <h2 className="text-base font-semibold mb-1 flex items-center gap-2">
              <span className="w-5 h-5 bg-[#282828] rounded-sm flex items-center justify-center text-[10px]">4</span>
              General Inquiry
            </h2>
            <p className="text-[#555] text-xs mb-3">
              For anything else — questions, suggestions, feedback.
            </p>
            <div className="border border-[#282828] bg-[#141414] p-4 rounded-sm font-mono text-xs text-[#888] leading-relaxed whitespace-pre-wrap">
{`Subject: [INQUIRY] Your topic here

Describe your question, suggestion, or feedback.
Include any relevant links or context.`}
            </div>
          </section>
        </div>

        {/* Response time note */}
        <div className="mt-10 pt-6 border-t border-[#282828]">
          <p className="text-[#555] text-xs leading-relaxed">
            We aim to respond within <strong className="text-[#888]">48 hours</strong>.
            DMCA and content removal requests are prioritized and typically processed
            within <strong className="text-[#888]">24 hours</strong>.
          </p>
        </div>
      </main>

      <footer className="border-t border-[#282828] py-6">
        <div className="max-w-3xl mx-auto px-5 flex items-center justify-between">
          <span className="text-xs text-[#383838]">WebSlab Archive</span>
          <div className="flex items-center gap-4">
            <a href="/terms" className="text-xs text-[#383838] hover:text-[#888] transition-colors no-underline">Terms</a>
            <a href="/privacy" className="text-xs text-[#383838] hover:text-[#888] transition-colors no-underline">Privacy</a>
            <a href="/contact" className="text-xs text-[#383838] hover:text-[#888] transition-colors no-underline">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
