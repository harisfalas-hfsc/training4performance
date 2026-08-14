import { createFileRoute } from "@tanstack/react-router";
import { MarketingPage } from "@/components/marketing";
import { T4P } from "@/components/brand-text";
import { DesktopDownloads } from "@/components/desktop-downloads";
import { breadcrumbLd, seoHead, webPageLd } from "@/lib/seo";

export const Route = createFileRoute("/download")({
  head: () => ({
    ...seoHead({
      path: "/download",
      title: "Download & Install T4P for Windows and macOS",
      description:
        "Step-by-step instructions to download and install the T4P desktop app on Windows and macOS, including how to open the ZIP and run it offline.",
      keywords: ["T4P download", "install T4P Windows", "install T4P macOS", "football performance desktop app"],
    }),
    scripts: [
      webPageLd({
        path: "/download",
        name: "Download & Install T4P",
        description: "How to install the T4P desktop app on Windows and macOS.",
        breadcrumb: true,
      }),
      breadcrumbLd([
        { name: "Home", path: "/" },
        { name: "Download", path: "/download" },
      ]),
    ],
  }),
  component: DownloadPage,
});

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-4">
      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-blue/10 font-display text-sm font-semibold text-brand-blue">
        {n}
      </span>
      <div>
        <p className="font-semibold text-foreground">{title}</p>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{children}</p>
      </div>
    </li>
  );
}

function DownloadPage() {
  return (
    <MarketingPage>
      <section className="border-b border-border bg-gradient-to-br from-brand-blue/8 via-background to-brand-green/8">
        <div className="mx-auto max-w-7xl px-5 py-14 text-center">
          <p className="page-eyebrow">Desktop app</p>
          <h1 className="mt-3 font-display text-2xl font-semibold uppercase tracking-wide sm:text-4xl">
            Download &amp; install
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            <T4P /> runs in your browser, and also as a desktop app for Windows and macOS. The
            desktop app works offline — your data stays on the machine and syncs back to the cloud
            as soon as you are online again.
          </p>
          <DesktopDownloads className="mt-8" />
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-5 py-10">
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="panel border-brand-blue/30 p-6">
            <h2 className="font-display text-lg font-semibold uppercase tracking-wide">Windows</h2>
            <ol className="mt-5 space-y-5">
              <Step n={1} title="Download the installer">
                Click the Windows button above. You get <strong>T4P-Setup-Windows.exe</strong>.
              </Step>
              <Step n={2} title="Run the setup">
                Double-click it and follow the wizard (Welcome → Install). It installs T4P and
                creates a Start Menu and Desktop shortcut automatically.
              </Step>
              <Step n={3} title="Allow it on first launch">
                Windows may show “Windows protected your PC”. Click <strong>More info</strong> →{" "}
                <strong>Run anyway</strong> — this only appears because the app is not code-signed
                yet.
              </Step>
              <Step n={4} title="Uninstall any time">
                Settings → Apps → <strong>Training 4 Performance</strong> → Uninstall.
              </Step>
            </ol>
          </section>

          <section className="panel border-brand-green/30 p-6">
            <h2 className="font-display text-lg font-semibold uppercase tracking-wide">macOS</h2>
            <ol className="mt-5 space-y-5">
              <Step n={1} title="Download the disk image">
                Click the macOS button above to get <strong>T4P-Installer-macOS.dmg</strong> (Apple
                Silicon: M1–M4).
              </Step>
              <Step n={2} title="Open it and drag to Applications">
                Double-click the DMG, then drag <strong>T4P</strong> onto the{" "}
                <strong>Applications</strong> shortcut inside the window.
              </Step>
              <Step n={3} title="Open it the first time">
                Right-click (or Control-click) <strong>T4P</strong> in Applications →{" "}
                <strong>Open</strong> → <strong>Open</strong> again. Only needed once, because the
                app is not notarised yet.
              </Step>
              <Step n={4} title="Keep it in the Dock">
                While T4P is running, right-click its Dock icon → <strong>Options</strong> →{" "}
                <strong>Keep in Dock</strong>.
              </Step>
            </ol>
          </section>
        </div>

        <section className="panel mt-6 border-brand-amber/30 bg-gradient-to-br from-brand-amber/8 via-background to-brand-blue/8 p-6">
          <h2 className="font-display text-lg font-semibold uppercase tracking-wide">
            Good to know
          </h2>
          <ul className="mt-4 space-y-2 text-sm leading-relaxed text-muted-foreground [&_strong]:text-foreground">
            <li>
              <strong>Proper installers.</strong> Windows gets a setup wizard with shortcuts and an
              uninstaller; macOS gets a drag-to-Applications disk image.
            </li>
            <li>
              <strong>Sign in once.</strong> After your first sign-in with an internet connection,
              the app keeps working offline with your existing data.
            </li>
            <li>
              <strong>Offline edits are queued.</strong> Anything you change without a connection is
              stored locally and pushed to the cloud automatically when you are back online.
            </li>
            <li>
              <strong>Updating.</strong> Download the newest installer and run it over the old
              version. Your data lives in your account, not inside the app, so nothing is lost.
            </li>
            <li>
              <strong>Prefer no install?</strong> Open T4P in your browser and use “Install app”
              from the address bar — it also works offline.
            </li>
          </ul>
        </section>

        <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm font-semibold">
          <Link to="/manual" className="text-brand-blue hover:underline">
            Read chapter 16 in the manual
          </Link>
          <Link to="/faq" className="text-brand-blue hover:underline">
            Frequently asked questions
          </Link>
        </div>
      </div>
    </MarketingPage>
  );
}

