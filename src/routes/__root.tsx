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
import { registerOfflineSupport } from "@/lib/offline";
import { OfflineBootstrap } from "@/components/offline-bootstrap";
import { OfflineStatus } from "@/components/offline-status";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { RoleProvider } from "../lib/roles";
import { AuthProvider } from "../lib/auth";
import { Toaster } from "../components/ui/sonner";
// Side effect: registers the training-load model as the single source of truth
// for load / ACWR / monotony everywhere in the platform.
import "@/data/gps-load";
import {
  jsonLd,
  CONTACT_EMAIL,
  ENTITY_DESCRIPTION,
  FOUNDER_ID,
  LOGO_ID,
  OG_IMAGE,
  ORGANIZATION_ID,
  SITE_NAME,
  SITE_SHORT_NAME,
  SITE_URL,
  SOFTWARE_ID,
  TOPIC_ENTITIES,
  WEBSITE_ID,
} from "../lib/seo";




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
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "mobile-web-app-capable", content: "yes" },
      { title: "T4P — Training 4 Performance | Football Performance System for S&C Coaches" },
      {
        name: "description",
        content:
          "T4P is the football performance system built for S&C coaches — squad availability, training design, GPS import, workload monitoring, wellness, testing, medical status, logbook, alerts and reports in one connected workspace.",
      },
      { name: "author", content: "Training 4 Performance" },
      // Google Search Console ownership proof for training4performance.com.
      // Issued by Google — do not edit or remove, or the property loses verification.
      {
        name: "google-site-verification",
        content: "47uV30zNueQDIoiP5jNex2mmnbsO14YsAoxJvCJGw9k",
      },
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
      {
        src: "https://www.googletagmanager.com/gtag/js?id=G-SYS21T611V",
        async: true,
      },
      {
        children: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-SYS21T611V');`,
      },
      {
        // Mark tablet portrait before body rendering. Responsive variants use
        // this class to select the genuine mobile layout without page scaling.
        children: `(function(){try{function apply(){var sw=window.screen.width,sh=window.screen.height;var s=Math.min(sw,sh),l=Math.max(sw,sh);var tablet=s>=600&&s<=1180&&l<=1600;var portrait=window.innerHeight>=window.innerWidth;document.documentElement.classList.toggle('tablet-portrait',tablet&&portrait);}apply();window.addEventListener('resize',apply);window.addEventListener('orientationchange',function(){setTimeout(apply,100);});}catch(e){}})();`,
      },
      {
        // Apply the saved colour theme before first paint.
        children: `(function(){try{if(localStorage.getItem('t4p.theme')==='dark'){document.documentElement.classList.add('dark');}}catch(e){}})();`,
      },
      {
        // Purge every retired account-data cache before application modules run.
        // Account records are cloud-authoritative; the shared demo is memory-only.
        children: `(function(){try{var p=['t4p.data.','t4p.tests.','t4p.testrecords.','t4p.customtests.','t4p.library.','t4p.loadmodel.','t4p.gpsTemplates.','t4p.teamSlots.','t4p.notifications.','t4p.alerts.','t4p.purge.'];Object.keys(localStorage).forEach(function(k){if(p.some(function(x){return k.indexOf(x)===0;})){localStorage.removeItem(k);}});}catch(e){}})();`,
      },



      jsonLd({
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "Organization",
            "@id": ORGANIZATION_ID,
            name: SITE_NAME,
            alternateName: SITE_SHORT_NAME,
            url: `${SITE_URL}/`,
            logo: { "@id": LOGO_ID },
            image: { "@id": LOGO_ID },
            description: ENTITY_DESCRIPTION,
            email: CONTACT_EMAIL,
            areaServed: "Worldwide",
            knowsAbout: TOPIC_ENTITIES,
            contactPoint: {
              "@type": "ContactPoint",
              contactType: "customer support",
              email: CONTACT_EMAIL,
              availableLanguage: ["English", "Greek"],
            },
            founder: { "@id": FOUNDER_ID },
          },
          {
            "@type": "Person",
            "@id": FOUNDER_ID,
            name: "Haris Falas",
            jobTitle: "Sports Scientist & Strength and Conditioning Coach",
            url: `${SITE_URL}/haris-falas`,
            worksFor: { "@id": ORGANIZATION_ID },
          },
          {
            "@type": "ImageObject",
            "@id": LOGO_ID,
            url: OG_IMAGE,
            contentUrl: OG_IMAGE,
            width: 512,
            height: 512,
            caption: SITE_NAME,
          },
          {
            "@type": "WebSite",
            "@id": WEBSITE_ID,
            name: SITE_NAME,
            alternateName: SITE_SHORT_NAME,
            url: `${SITE_URL}/`,
            inLanguage: "en",
            description: ENTITY_DESCRIPTION,
            publisher: { "@id": ORGANIZATION_ID },
          },
          {
            "@type": ["SoftwareApplication", "WebApplication"],
            "@id": SOFTWARE_ID,
            name: "T4P — Training 4 Performance",
            alternateName: SITE_SHORT_NAME,
            applicationCategory: "SportsApplication",
            applicationSubCategory: "Football performance management software",
            operatingSystem: "Web browser",
            browserRequirements: "Requires a modern web browser with JavaScript enabled",
            url: `${SITE_URL}/`,
            image: { "@id": LOGO_ID },
            description: ENTITY_DESCRIPTION,
            inLanguage: "en",
            audience: {
              "@type": "Audience",
              audienceType:
                "Football fitness coaches, strength and conditioning coaches, performance coaches, sports scientists, clubs and academies",
            },
            keywords: TOPIC_ENTITIES.join(", "),
            featureList: [
              "Squad management, player passports and availability tracking",
              "Match-day-cycle training calendar and microcycle planning",
              "Block-based training session designer and interactive football tactical board",
              "GPS data import from Catapult, STATSports, GPEXE and Polar exports, plus a mappable CSV/Excel template",
              "GPS metrics: total distance, high-speed running, sprint distance, maximum speed, accelerations and decelerations",
              "Composite training load, acute:chronic workload ratio, training monotony and strain",
              "Session RPE entry and planned versus actual load",
              "Daily wellness and readiness questionnaire with a player portal",
              "Fitness testing battery with personal-best tracking (CMJ, sprint splits, Yo-Yo, 30-15 IFT, strength)",
              "Automated workload, wellness and availability alerts",
              "Player and squad analytics, comparisons and one-click performance reports",
            ],
            offers: {
              "@type": "Offer",
              price: "699.00",
              priceCurrency: "EUR",
              url: `${SITE_URL}/pricing`,
              availability: "https://schema.org/InStock",
              category: "Monthly subscription, one team, unlimited staff users",
            },
            publisher: { "@id": ORGANIZATION_ID },
            isPartOf: { "@id": WEBSITE_ID },
          },
        ],
      }),
    ],

  }),


  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  useEffect(() => {
    const retiredDataPrefixes = [
      "t4p.data.", "t4p.tests.", "t4p.testrecords.", "t4p.customtests.",
      "t4p.library.", "t4p.loadmodel.", "t4p.gpsTemplates.", "t4p.teamSlots.",
      "t4p.notifications.", "t4p.alerts.", "t4p.purge.",
    ];
    Object.keys(window.localStorage).forEach((key) => {
      if (retiredDataPrefixes.some((prefix) => key.startsWith(prefix))) window.localStorage.removeItem(key);
    });
    registerOfflineSupport();
  }, []);

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
