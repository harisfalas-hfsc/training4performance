import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useEffect, useState, type ComponentType } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "@/lib/auth";
import { activateDemo } from "@/lib/demo";
import { toolsNav } from "@/lib/nav-items";
import { cn } from "@/lib/utils";

export const publicLinks = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/how-it-works", label: "How it works" },
  { to: "/pricing", label: "Pricing" },
  { to: "/faq", label: "FAQ" },
  { to: "/manual", label: "Platform manual" },
] as const;

export type PlatformItem = {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color: string;
};

/**
 * Universal discovery menu — identical button for visitors, free users and
 * subscribers. Public pages are always listed first; the platform sections
 * are appended underneath once the user is signed in.
 */
export function DiscoverMenu({
  platformItems = [],
  className,
}: {
  platformItems?: readonly PlatformItem[];
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const { session } = useAuth();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const close = () => setOpen(false);
  const openDemo = () => {
    close();
    activateDemo(true);
    window.location.assign("/dashboard");
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open discovery menu"
        className={cn(
          "grid size-9 shrink-0 place-items-center rounded-full text-primary transition-opacity hover:opacity-70 sm:size-10",
          className,
        )}
      >
        <Menu className="size-5" />
      </button>

      {open && mounted
        ? createPortal(
            <div className="fixed inset-0 z-50 flex">
              <button
                aria-label="Close menu"
                onClick={close}
                className="absolute inset-0 bg-foreground/30 backdrop-blur-sm"
              />
              <aside className="relative flex h-full w-[min(20rem,85vw)] flex-col overflow-y-auto border-r border-border bg-background px-6 py-6">
                <div className="flex items-center justify-between">
                  <p className="eyebrow">Discover</p>
                  <button onClick={close} aria-label="Close">
                    <X className="size-4 text-muted-foreground" />
                  </button>
                </div>

                <nav className="mt-5 flex flex-col">
                  {publicLinks.map((l) => (
                    <Link
                      key={l.to}
                      to={l.to}
                      onClick={close}
                      className="border-b border-border py-3.5 font-display text-lg uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground"
                      activeProps={{ className: "text-foreground" }}
                      activeOptions={{ exact: l.to === "/" }}
                    >
                      {l.label}
                    </Link>
                  ))}
                  <button
                    type="button"
                    onClick={openDemo}
                    className="border-b border-border py-3.5 text-left font-display text-lg uppercase tracking-wide text-primary transition-opacity hover:opacity-70"
                  >
                    Try demo
                  </button>
                </nav>

                {session && platformItems.length ? (
                  <>
                    <p className="eyebrow mt-6">Platform</p>
                    <nav className="mt-3 flex flex-col gap-0.5">
                      {platformItems.map((item) => (
                        <Link
                          key={item.to}
                          to={item.to}
                          onClick={close}
                          className="flex items-center gap-3 rounded-md px-2 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                          activeProps={{ className: "bg-accent text-primary" }}
                        >
                          <item.icon className="size-4" style={{ color: item.color }} />
                          {item.label}
                        </Link>
                      ))}
                    </nav>
                  </>
                ) : null}

                {session ? (
                  <>
                    <p className="eyebrow mt-6">Tools</p>
                    <nav className="mt-3 flex flex-col gap-0.5">
                      {toolsNav.map((item) => (
                        <Link
                          key={item.to}
                          to={item.to}
                          onClick={close}
                          className="flex items-center gap-3 rounded-md px-2 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                          activeProps={{ className: "bg-accent text-primary" }}
                        >
                          <item.icon className="size-4" style={{ color: item.color }} />
                          {item.label}
                        </Link>
                      ))}
                    </nav>
                  </>
                ) : null}

                <div className="mt-auto pt-6">
                  {session ? (
                    <Link
                      to="/dashboard"
                      onClick={close}
                      className="block rounded-full bg-primary px-4 py-3 text-center text-sm font-semibold text-primary-foreground"
                    >
                      Go to platform
                    </Link>
                  ) : (
                    <Link
                      to="/auth"
                      search={{ mode: "signup" }}
                      onClick={close}
                      className="block rounded-full bg-primary px-4 py-3 text-center text-sm font-semibold text-primary-foreground"
                    >
                      Get started
                    </Link>
                  )}
                </div>
              </aside>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
