export const metadata = {
  title: "Privacy Policy — WebSlab Archive",
  description: "Privacy policy for WebSlab Archive web archiving service.",
};

export default function PrivacyPolicy() {
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
          Legal
        </p>
        <h1 className="text-3xl font-bold tracking-tight mb-10">Privacy Policy</h1>

        <div className="space-y-8 text-[#888] text-sm leading-relaxed">
          <p>
            <span className="text-[#555] text-xs font-mono">Last updated: March 5, 2026</span>
          </p>

          <section>
            <h2 className="text-[#e8e8e8] text-base font-semibold mb-3">1. Information We Collect</h2>
            <p>
              When you sign in via GitHub, we receive and store your GitHub display name,
              email address, and profile picture. We do not access your repositories,
              private data, or any other GitHub information beyond basic profile details.
            </p>
          </section>

          <section>
            <h2 className="text-[#e8e8e8] text-base font-semibold mb-3">2. How We Use Your Information</h2>
            <p>Your information is used solely to:</p>
            <ul className="list-disc ml-5 mt-2 space-y-1">
              <li>Authenticate your identity for the archiving feature</li>
              <li>Display your name alongside archives you create</li>
              <li>Contact you regarding your account if necessary</li>
            </ul>
            <p className="mt-2">
              We do not sell, share, or rent your personal information to third parties.
            </p>
          </section>

          <section>
            <h2 className="text-[#e8e8e8] text-base font-semibold mb-3">3. Data Storage</h2>
            <p>
              Your account data and archived web pages are stored in a secured database.
              Archived pages contain the HTML content and embedded images of the URL you
              submitted at the time of archiving. We retain this data indefinitely unless
              you request deletion.
            </p>
          </section>

          <section>
            <h2 className="text-[#e8e8e8] text-base font-semibold mb-3">4. Cookies</h2>
            <p>
              We use a session cookie for authentication purposes only. We do not use
              tracking cookies, analytics beacons, or any third-party advertising cookies.
            </p>
          </section>

          <section>
            <h2 className="text-[#e8e8e8] text-base font-semibold mb-3">5. Third-Party Services</h2>
            <p>We use the following third-party services:</p>
            <ul className="list-disc ml-5 mt-2 space-y-1">
              <li><strong className="text-[#e8e8e8]">GitHub OAuth</strong> — for authentication</li>
              <li><strong className="text-[#e8e8e8]">Turso</strong> — for database hosting</li>
              <li><strong className="text-[#e8e8e8]">Vercel</strong> — for application hosting</li>
            </ul>
            <p className="mt-2">
              Each of these services has its own privacy policy governing how they handle data.
            </p>
          </section>

          <section>
            <h2 className="text-[#e8e8e8] text-base font-semibold mb-3">6. Your Rights</h2>
            <p>You may at any time:</p>
            <ul className="list-disc ml-5 mt-2 space-y-1">
              <li>Request a copy of the data we hold about you</li>
              <li>Request deletion of your account and all associated archives</li>
              <li>Revoke GitHub OAuth access from your GitHub settings</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[#e8e8e8] text-base font-semibold mb-3">7. Changes to This Policy</h2>
            <p>
              We may update this privacy policy from time to time. Any changes will be
              reflected on this page with an updated date.
            </p>
          </section>

          <section>
            <h2 className="text-[#e8e8e8] text-base font-semibold mb-3">8. Contact</h2>
            <p>
              If you have questions about this policy or wish to exercise your data rights,
              please visit our <a href="/contact" className="text-[#e8e8e8] underline hover:text-white transition-colors">Contact page</a> or
              email us at <a href="mailto:patelabhay550@gmail.com" className="text-[#e8e8e8] underline hover:text-white transition-colors font-mono">patelabhay550@gmail.com</a>.
            </p>
          </section>
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
