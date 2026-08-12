import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { MarketingPage } from "@/components/marketing";
import { T4P } from "@/components/brand-text";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { seoHead } from "@/lib/seo";


export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): { mode?: "signup" | "signin" } =>
    search["mode"] === "signup" ? { mode: "signup" } : {},

  head: () => ({
    ...seoHead({
      path: "/auth",
      title: "Sign in | T4P Training 4 Performance",
      description: "Sign in or create your T4P account to access the football performance platform.",
      card: "summary",
      noindex: true,
    }),
  }),
  component: AuthPage,
});

function AuthPage() {
  const { mode } = Route.useSearch();
  const navigate = useNavigate();
  const { session } = useAuth();
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


  return (
    <MarketingPage>
      <div className="mx-auto max-w-md px-5 py-16">
        <h1 className="font-display text-2xl font-semibold uppercase tracking-wide">
          {isSignup ? "Create your account" : "Sign in"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {isSignup
            ? "Set up the account that will administer your club's teams."
            : (
              <>
                Access your <T4P /> workspace.
              </>
            )}
        </p>




        <form onSubmit={submit} className="space-y-3">
          {isSignup ? (
            <>
              <Field label="Full name" value={fullName} onChange={setFullName} required />
              <Field label="Club / organisation" value={clubName} onChange={setClubName} />
            </>
          ) : null}
          <Field label="Email" type="email" value={email} onChange={setEmail} required />
          <Field label="Password" type="password" value={password} onChange={setPassword} required />

          {!isSignup ? (
            <button
              type="button"
              onClick={forgotPassword}
              className="text-xs font-medium text-primary hover:underline"
            >
              Forgot your password?
            </button>
          ) : null}


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
  const isPassword = type === "password";
  const [show, setShow] = useState(false);
  return (
    <label className="block">
      <span className="eyebrow">{label}</span>
      <div className={`mt-1 ${isPassword ? "grid grid-cols-[minmax(0,1fr)_2.5rem]" : ""}`}>
        <input
          type={isPassword && show ? "text" : type}
          value={value}
          required={required}
          onChange={(e) => onChange(e.target.value)}
          className={`h-10 min-w-0 border border-input bg-surface-2 px-3 text-sm ${isPassword ? "rounded-l-md border-r-0" : "w-full rounded-md"}`}
        />
        {isPassword ? (
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            aria-label={show ? "Hide password" : "Show password"}
            className="grid size-10 place-items-center rounded-r-md border border-input bg-surface-2 text-muted-foreground hover:text-foreground"
          >
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        ) : null}
      </div>
    </label>
  );
}

