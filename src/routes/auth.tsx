import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — BEGIN UPSC" },
      {
        name: "description",
        content: "Sign in, create an account, or reset your BEGIN UPSC password.",
      },
      { property: "og:title", content: "Sign in — BEGIN UPSC" },
      {
        property: "og:description",
        content: "Access your UPSC syllabus, tests, notes, planner and analytics.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

type AuthMode = "signin" | "signup" | "forgot" | "reset";

function initialMode(): AuthMode {
  if (typeof window === "undefined") return "signin";
  const params = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  if (params.get("mode") === "signup") return "signup";
  if (params.get("mode") === "forgot") return "forgot";
  if (params.get("mode") === "reset" || hash.get("type") === "recovery") return "reset";
  return "signin";
}

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sentConfirmation, setSentConfirmation] = useState(false);
  const [sentReset, setSentReset] = useState(false);

  const copy = useMemo(() => {
    if (mode === "signup") return ["Create your BEGIN UPSC account", "Build a preparation record that follows every topic, test and goal."];
    if (mode === "forgot") return ["Reset your password", "We will email a secure reset link if this email is registered."];
    if (mode === "reset") return ["Set a new password", "Choose a new password for your BEGIN UPSC account."];
    return ["Welcome back", "Continue your UPSC preparation with your saved progress."];
  }, [mode]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session && mode !== "reset") navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate, mode]);

  async function ensureProfile() {
    const { data } = await supabase.auth.getUser();
    if (!data.user) return;
    await supabase.from("profiles").upsert({
      id: data.user.id,
      email: data.user.email ?? email,
      full_name: fullName || (data.user.user_metadata?.["full_name"] as string | undefined) || null,
      avatar_url: (data.user.user_metadata?.["avatar_url"] as string | undefined) ?? null,
    });
    await supabase.from("user_roles").upsert({ user_id: data.user.id, role: "user" });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth`,
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        if (data.user) await ensureProfile();
        if (!data.session) {
          setSentConfirmation(true);
          return;
        }
        navigate({ to: "/onboarding", replace: true });
        return;
      }

      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setSentReset(true);
        return;
      }

      if (mode === "reset") {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        toast.success("Password updated. Please sign in again.");
        await supabase.auth.signOut();
        setMode("signin");
        setPassword("");
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      await ensureProfile();
      navigate({ to: "/dashboard", replace: true });
    } catch {
      toast.error("We could not complete that request. Please check your details and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setBusy(false);
      toast.error("Google sign-in failed. Please try again.");
      return;
    }
    if (result.redirected) return;
    await ensureProfile();
    navigate({ to: "/dashboard", replace: true });
  }

  return (
    <div className="surface-grid flex min-h-screen flex-col items-center justify-center px-5 py-12">
      <Link to="/" className="mb-8 flex items-center gap-2">
        <span className="grid h-10 w-10 place-items-center rounded-md bg-primary font-display text-xl font-bold text-primary-foreground">B</span>
        <span className="font-display text-2xl font-semibold tracking-normal">BEGIN UPSC</span>
      </Link>

      <Card className="w-full max-w-md border-border/70 bg-card/95">
        {sentConfirmation || sentReset ? (
          <CardContent className="space-y-4 py-10 text-center">
            <CardTitle className="text-xl">Check your email</CardTitle>
            <p className="text-sm text-muted-foreground">
              {sentConfirmation
                ? "We sent a confirmation link. Open it to verify your account, then sign in."
                : "If the email is registered, a password reset link is on its way."}
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSentConfirmation(false);
                setSentReset(false);
                setMode("signin");
              }}
            >
              Back to sign in
            </Button>
          </CardContent>
        ) : (
          <>
            <CardHeader>
              <CardTitle className="text-2xl">{copy[0]}</CardTitle>
              <CardDescription>{copy[1]}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {mode !== "forgot" && mode !== "reset" ? (
                <>
                  <Button type="button" variant="outline" className="w-full" disabled={busy} onClick={handleGoogle}>
                    Continue with Google
                  </Button>
                  <div className="flex items-center gap-3">
                    <span className="h-px flex-1 bg-border" />
                    <span className="text-xs uppercase tracking-wider text-muted-foreground">or</span>
                    <span className="h-px flex-1 bg-border" />
                  </div>
                </>
              ) : null}

              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === "signup" && (
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full name</Label>
                    <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" autoComplete="name" required />
                  </div>
                )}
                {mode !== "reset" && (
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
                  </div>
                )}
                {mode !== "forgot" && (
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" autoComplete={mode === "signin" ? "current-password" : "new-password"} />
                  </div>
                )}
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy
                    ? "Please wait…"
                    : mode === "signup"
                      ? "Create account"
                      : mode === "forgot"
                        ? "Send reset link"
                        : mode === "reset"
                          ? "Update password"
                          : "Sign in"}
                </Button>
              </form>

              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                {mode === "signin" ? (
                  <button type="button" className="text-primary hover:underline" onClick={() => setMode("forgot")}>Forgot password?</button>
                ) : <span />}
                <button
                  type="button"
                  className="text-primary hover:underline"
                  onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
                >
                  {mode === "signup" ? "Already have an account?" : "New to BEGIN UPSC?"}
                </button>
              </div>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}
