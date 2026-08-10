import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { MarketingPage } from "@/components/marketing";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/lib/auth";


export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): { mode?: "signup" | "signin" } =>
    search["mode"] === "signup" ? { mode: "signup" } : {},

  head: () => ({
    meta: [
      { title: "Sign in — T4P Training 4 Performance" },
      {
        name: "description",
        content: "Sign in or create your T4P account to access the football performance platform.",
      },
      { property: "og:title", content: "Sign in to T4P" },
      { property: "og:description", content: "Access your squad, training, GPS and reporting workspace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { mode } = Route.useSearch();
  const navigate = useNavigate();
  const { session, hasAccess } = useAuth();
  const [isSignup, setIsSignup] = useState(mode === "signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [clubName, setClubName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (session) void navigate({ to: "/dashboard", replace: true });
  }, [session, navigate]);

  async function forgotPassword() {
    setError(null);
    setNotice(null);
    if (!email) {
      setError("Enter your email above first, then press “Forgot password”.");
      return;
    }
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (err) setError(err.message);
    else setNotice("Reset link sent — check your inbox.");
  }


  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      if (isSignup) {
        const { data, error: err } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: fullName, club_name: clubName },
          },
        });
        if (err) throw err;
        if (!data.session) setNotice("Check your email to confirm your account, then sign in.");
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    setError(null);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) setError("Google sign-in failed. Please try again.");
  }

  return (
    <MarketingPage>
      <div className="mx-auto max-w-md px-5 py-16">
        <h1 className="font-display text-2xl font-semibold uppercase tracking-wide">
          {isSignup ? "Create your account" : "Sign in"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {isSignup
            ? "Set up the account that will administer your club's teams."
            : "Access your T4P workspace."}
        </p>

        <button
          onClick={google}
          className="mt-6 w-full rounded-md border border-border bg-surface-2 px-4 py-2.5 text-sm font-semibold"
        >
          Continue with Google
        </button>

        <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" /> or with email <span className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={submit} className="space-y-3">
          {isSignup ? (
            <>
              <Field label="Full name" value={fullName} onChange={setFullName} required />
              <Field label="Club / organisation" value={clubName} onChange={setClubName} />
            </>
          ) : null}
          <Field label="Email" type="email" value={email} onChange={setEmail} required />
          <Field label="Password" type="password" value={password} onChange={setPassword} required />

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {notice ? <p className="text-sm text-success">{notice}</p> : null}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {busy ? "Please wait…" : isSignup ? "Create account" : "Sign in"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          {isSignup ? "Already have an account?" : "No account yet?"}{" "}
          <button onClick={() => setIsSignup((v) => !v)} className="font-medium text-primary hover:underline">
            {isSignup ? "Sign in" : "Create one"}
          </button>
        </p>
        <p className="mt-3 text-center text-xs text-muted-foreground">
          By continuing you accept the <Link to="/terms" className="underline">Terms</Link> and{" "}
          <Link to="/privacy" className="underline">Privacy Policy</Link>.
        </p>
      </div>
    </MarketingPage>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="eyebrow">{label}</span>
      <input
        type={type}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 h-10 w-full rounded-md border border-input bg-surface-2 px-3 text-sm"
      />
    </label>
  );
}
