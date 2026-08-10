import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { MarketingPage } from "@/components/marketing";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set a new password — T4P" },
      { name: "description", content: "Choose a new password for your T4P coaching account." },
      { property: "og:title", content: "Set a new T4P password" },
      { property: "og:description", content: "Choose a new password for your T4P account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error: err } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (err) {
      setError(err.message);
      return;
    }
    setDone(true);
    setTimeout(() => void navigate({ to: "/dashboard" }), 1200);
  }

  return (
    <MarketingPage>
      <div className="mx-auto max-w-md px-5 py-16">
        <h1 className="font-display text-2xl font-semibold uppercase tracking-wide">Set a new password</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Open this page from the reset link in your email, then choose a new password.
        </p>
        <form onSubmit={submit} className="mt-6 space-y-3">
          <label className="block">
            <span className="eyebrow">New password</span>
            <div className="relative mt-1">
              <input
                type={show ? "text" : "password"}
                value={password}
                required
                minLength={6}
                onChange={(e) => setPassword(e.target.value)}
                className="h-10 w-full rounded-md border border-input bg-surface-2 px-3 pr-10 text-sm"
              />
              <button
                type="button"
                onClick={() => setShow((v) => !v)}
                aria-label={show ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-0 grid w-10 place-items-center text-muted-foreground hover:text-foreground"
              >
                {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </label>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {done ? <p className="text-sm text-success">Password updated — taking you to the platform…</p> : null}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {busy ? "Saving…" : "Update password"}
          </button>
        </form>
      </div>
    </MarketingPage>
  );
}
