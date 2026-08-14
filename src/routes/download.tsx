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
      <div className="mx-auto max-w-7xl px-5 py-12">
        <h1 className="font-display text-3xl font-semibold uppercase tracking-wide sm:text-4xl">
          Download &amp; install
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          <T4P /> runs in your browser, and also as a desktop app for Windows and macOS. The desktop
          app works offline — your data stays on the machine and syncs back to the cloud as soon as
          you are online again.
        </p>

        <DesktopDownloads className="mt-8 items-start sm:items-start" />

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-display text-lg font-semibold">Windows</h2>
            <ol className="mt-5 space-y-5">
              <Step n={1} title="Download the ZIP">
                Click the Windows button above. The file <strong>T4P-Windows.zip</strong> lands in
                your Downloads folder.
              </Step>
              <Step n={2} title="Extract the folder">
                Right-click the ZIP → <strong>Extract All…</strong> → choose a permanent place, for
                example <code>C:\Program Files\T4P</code> or your Documents folder. Do not run the
                app from inside the ZIP.
              </Step>
              <Step n={3} title="Open T4P.exe">
                Inside the extracted folder, double-click <strong>T4P.exe</strong>. The other files
                next to it are the app engine — leave them where they are.
              </Step>
              <Step n={4} title="Allow it on first launch">
                Windows may show “Windows protected your PC”. Click <strong>More info</strong> →{" "}
                <strong>Run anyway</strong>. This appears only because the app is not code-signed
                yet; it is safe.
              </Step>
              <Step n={5} title="Pin it for easy access">
                Right-click <strong>T4P.exe</strong> → <strong>Send to</strong> →{" "}
                <strong>Desktop (create shortcut)</strong>, or right-click the running icon in the
                taskbar → <strong>Pin to taskbar</strong>.
              </Step>
            </ol>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-display text-lg font-semibold">macOS</h2>
            <ol className="mt-5 space-y-5">
              <Step n={1} title="Download the ZIP">
                Click the macOS button above. Safari usually unzips it automatically.
              </Step>
              <Step n={2} title="Move T4P to Applications">
                Drag <strong>T4P.app</strong> into your <strong>Applications</strong> folder.
              </Step>
              <Step n={3} title="Open it the first time">
                Right-click (or Control-click) <strong>T4P.app</strong> → <strong>Open</strong> →{" "}
                <strong>Open</strong> again in the dialog. This is only needed once, because the app
                is not notarised yet.
              </Step>
              <Step n={4} title="Keep it in the Dock">
                While T4P is running, right-click its Dock icon →{" "}
                <strong>Options</strong> → <strong>Keep in Dock</strong>.
              </Step>
            </ol>
          </section>
        </div>

        <section className="mt-6 rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display text-lg font-semibold">Good to know</h2>
          <ul className="mt-4 space-y-2 text-sm leading-relaxed text-muted-foreground [&_strong]:text-foreground">
            <li>
              <strong>There is no installer wizard.</strong> The ZIP is the app itself — extract it
              once and open it. Nothing is written to your system registry.
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
              <strong>Updating.</strong> Download the newest ZIP and replace the old folder or app.
              Your data is not stored inside the folder, so nothing is lost.
            </li>
            <li>
              <strong>Prefer no install?</strong> Open T4P in your browser and use “Install app”
              from the address bar — it also works offline.
            </li>
          </ul>
        </section>
      </div>
    </MarketingPage>
  );
}
