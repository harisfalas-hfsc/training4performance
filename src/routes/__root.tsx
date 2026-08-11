import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { RoleProvider } from "../lib/roles";
import { AuthProvider } from "../lib/auth";
import { Toaster } from "../components/ui/sonner";
import { jsonLd, SITE_NAME, SITE_URL } from "../lib/seo";



function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "T4P — Training 4 Performance | Football Performance System for S&C Coaches" },
      {
        name: "description",
        content:
          "T4P is the football performance system built for S&C coaches — squad availability, training design, GPS import, workload monitoring, wellness, testing, medical status, logbook, alerts and reports in one connected workspace.",
      },
      { name: "author", content: "Training 4 Performance" },
      { name: "theme-color", content: "#fafafa" },
      { name: "apple-mobile-web-app-title", content: "T4P" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { property: "og:title", content: "T4P — Training 4 Performance | Football Performance System for S&C Coaches" },
      {
        property: "og:description",
        content:
          "The daily companion for football S&C coaches: squad availability, session design, GPS, workload, wellness, testing, medical status and one-click reports — all connected.",
      },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Training 4 Performance" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&family=Barlow:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", type: "image/png", href: "/favicon.png" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      { rel: "manifest", href: "/site.webmanifest" },
    ],
    scripts: [
      jsonLd({
        "@context": "https://schema.org",
        "@type": "Organization",
        name: SITE_NAME,
        alternateName: "T4P",
        url: `${SITE_URL}/`,
        logo: `${SITE_URL}/logo-t4p.png`,
        description:
          "Training 4 Performance (T4P) is a football sports science platform for strength and conditioning coaches: squad management, GPS training load, ACWR, fitness testing, wellness and reporting.",
        email: "harisfalas@gmail.com",
        founder: {
          "@type": "Person",
          name: "Haris Falas",
          jobTitle: "Sports Scientist & Strength and Conditioning Coach",
          url: `${SITE_URL}/haris-falas`,
        },
        sameAs: [`${SITE_URL}/about`, `${SITE_URL}/haris-falas`],
      }),
      jsonLd({
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: SITE_NAME,
        alternateName: "T4P",
        url: `${SITE_URL}/`,
        inLanguage: "en",
        publisher: { "@type": "Organization", name: SITE_NAME, url: `${SITE_URL}/` },
      }),
    ],
  }),


  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>

      <body>
        {children}
        <Toaster position="bottom-center" richColors closeButton />
        <Scripts />
      </body>
    </html>

  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RoleProvider>
          {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
          <Outlet />
        </RoleProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
