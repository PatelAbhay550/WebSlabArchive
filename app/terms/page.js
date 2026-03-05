export const metadata = {
  title: "Terms of Service — WebSlab Archive",
  description: "Terms of service and acceptable use policy for WebSlab Archive.",
};

export default function TermsOfService() {
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
        <h1 className="text-3xl font-bold tracking-tight mb-10">Terms of Service</h1>

        <div className="space-y-8 text-[#888] text-sm leading-relaxed">
          <p>
            <span className="text-[#555] text-xs font-mono">Last updated: March 5, 2026</span>
          </p>

          <section>
            <h2 className="text-[#e8e8e8] text-base font-semibold mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing or using WebSlab Archive (&quot;the Service&quot;), you agree to be
              bound by these Terms of Service. If you do not agree to these terms, you
              must not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-[#e8e8e8] text-base font-semibold mb-3">2. Description of Service</h2>
            <p>
              WebSlab Archive is a web archiving tool that allows users to save snapshots
              of publicly accessible web pages. The Service stores a copy of the HTML
              content and embedded images at the time of archiving and provides a
              permanent link to access the archived version.
            </p>
          </section>

          <section>
            <h2 className="text-[#e8e8e8] text-base font-semibold mb-3">3. User Responsibilities &amp; Rights Requirement</h2>
            <div className="p-4 border border-[#282828] bg-[#181818] rounded-sm my-3">
              <p className="text-[#e8e8e8] font-medium mb-2">
                By using this Service to archive a web page, you represent and warrant that:
              </p>
              <ul className="list-disc ml-5 space-y-2">
                <li>
                  You <strong className="text-[#e8e8e8]">own the content</strong> of the web page, or
                  you have <strong className="text-[#e8e8e8]">explicit permission</strong> from the
                  content owner to archive it, or the content is <strong className="text-[#e8e8e8]">
                  publicly available</strong> and your archiving constitutes fair use under
                  applicable law.
                </li>
                <li>
                  You will <strong className="text-[#e8e8e8]">not use the Service</strong> to archive
                  content that is protected by copyright, trademark, or other intellectual
                  property rights without the rights holder&apos;s consent.
                </li>
                <li>
                  You are <strong className="text-[#e8e8e8]">solely responsible</strong> for ensuring
                  that your use of the Service complies with all applicable laws and
                  regulations, including but not limited to copyright law, the DMCA
                  (Digital Millennium Copyright Act), GDPR, and any other relevant
                  intellectual property or privacy legislation.
                </li>
                <li>
                  You acknowledge that the Service operator is <strong className="text-[#e8e8e8]">not
                  liable</strong> for any content archived by users and acts solely as a
                  technical intermediary.
                </li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-[#e8e8e8] text-base font-semibold mb-3">4. Prohibited Content</h2>
            <p>You must not use the Service to archive:</p>
            <ul className="list-disc ml-5 mt-2 space-y-1">
              <li>Content that infringes on any third party&apos;s intellectual property rights</li>
              <li>Private, confidential, or classified information</li>
              <li>Content that is illegal, defamatory, obscene, or harmful</li>
              <li>Pages behind authentication walls or paywalls without authorization</li>
              <li>Personally identifiable information (PII) of others without their consent</li>
              <li>Malware, phishing pages, or any malicious content</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[#e8e8e8] text-base font-semibold mb-3">5. DMCA &amp; Takedown Requests</h2>
            <p>
              If you believe that content archived on our Service infringes your copyright
              or other intellectual property rights, you may submit a takedown request. We
              will review all legitimate takedown requests and remove infringing content
              promptly. To submit a request, please contact us with:
            </p>
            <ul className="list-disc ml-5 mt-2 space-y-1">
              <li>Identification of the copyrighted work claimed to have been infringed</li>
              <li>The URL of the archived page on our Service</li>
              <li>Your contact information and a statement of good faith</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[#e8e8e8] text-base font-semibold mb-3">6. Disclaimer of Warranties</h2>
            <div className="p-4 border border-[#282828] bg-[#181818] rounded-sm my-3">
              <p>
                THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES
                OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO
                IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE,
                AND NON-INFRINGEMENT.
              </p>
              <p className="mt-3">
                WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE,
                OR THAT ARCHIVED CONTENT WILL BE PRESERVED INDEFINITELY. WE MAKE NO
                REPRESENTATIONS ABOUT THE ACCURACY, COMPLETENESS, OR RELIABILITY OF
                ANY ARCHIVED CONTENT.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-[#e8e8e8] text-base font-semibold mb-3">7. Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by applicable law, WebSlab Archive and its
              operator(s) shall not be liable for any indirect, incidental, special,
              consequential, or punitive damages, including but not limited to loss of
              profits, data, or use, arising out of or in connection with the Service,
              whether based on warranty, contract, tort, or any other legal theory.
            </p>
            <p className="mt-3">
              The total liability of the Service operator for any claim arising from
              or related to the Service shall not exceed the amount paid by you (if any)
              to use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-[#e8e8e8] text-base font-semibold mb-3">8. Indemnification</h2>
            <p>
              You agree to indemnify, defend, and hold harmless WebSlab Archive and its
              operator(s) from and against any claims, liabilities, damages, losses, and
              expenses (including reasonable legal fees) arising out of or in any way
              connected with your use of the Service or your violation of these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-[#e8e8e8] text-base font-semibold mb-3">9. Termination</h2>
            <p>
              We reserve the right to suspend or terminate your access to the Service at
              any time, without prior notice, for conduct that we believe violates these
              Terms or is harmful to other users, us, or third parties, or for any other
              reason at our sole discretion.
            </p>
          </section>

          <section>
            <h2 className="text-[#e8e8e8] text-base font-semibold mb-3">10. Changes to Terms</h2>
            <p>
              We may modify these Terms at any time. Continued use of the Service after
              changes are posted constitutes acceptance of the modified Terms.
            </p>
          </section>

          <section>
            <h2 className="text-[#e8e8e8] text-base font-semibold mb-3">11. Contact</h2>
            <p>
              For takedown requests, questions about these terms, or any other legal
              inquiries, please visit our <a href="/contact" className="text-[#e8e8e8] underline hover:text-white transition-colors">Contact page</a> and
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
