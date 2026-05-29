import { Wordmark } from "@streamflare/ui";

const COLUMNS: { heading: string; links: string[] }[] = [
  { heading: "Watch", links: ["FAQ", "Ways to Watch", "Originals", "New & Popular"] },
  { heading: "Account", links: ["Help Center", "Account", "Redeem Gift Cards", "Privacy"] },
  { heading: "Company", links: ["Jobs", "Terms of Use", "Cookie Preferences", "Legal Notices"] },
  { heading: "Connect", links: ["Contact Us", "Media Center", "Investor Relations", "Speed Test"] },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-hairline bg-canvas px-6 py-14 md:px-12">
      <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[1.2fr_repeat(4,1fr)]">
        <div className="space-y-3">
          <Wordmark />
          <p className="max-w-xs text-sm text-text-subtle">
            Unlimited films and series, streaming on every screen.
          </p>
        </div>
        {COLUMNS.map((col) => (
          <nav key={col.heading} className="space-y-3">
            <p className="font-mono text-xs uppercase tracking-wide text-text-subtle">{col.heading}</p>
            <ul className="space-y-2">
              {col.links.map((link) => (
                <li key={link}>
                  <a href="#" className="text-sm text-text-muted transition-colors hover:text-text">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <p className="mx-auto mt-12 max-w-6xl font-mono text-xs text-text-subtle">
        © {new Date().getFullYear()} StreamFlare. A portfolio project.
      </p>
    </footer>
  );
}
