import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Survivor Simulator" },
      { name: "description", content: "Create an account or sign in to save and revisit every Survivor season you simulate." },
      { property: "og:title", content: "Sign in — Survivor Simulator" },
      { property: "og:description", content: "Save your simulated Survivor seasons and come back to them any time." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const input = "w-full rounded-md border border-input bg-secondary px-3 py-2";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setMsg(null);
    if (mode === "up") {
      if (!username.trim()) { setMsg("Pick a username."); setBusy(false); return; }
      const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin, data: { username: username.trim() } } });
      if (error) setMsg(error.message);
      else if (!data.session) setMsg("Check your email to confirm your account, then sign in.");
      else navigate({ to: "/" });
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMsg(error.message); else navigate({ to: "/" });
    }
    setBusy(false);
  };

  const google = async () => {
    const res = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (res.error) { setMsg(res.error.message ?? "Google sign-in failed."); return; }
    if (res.redirected) return;
    navigate({ to: "/" });
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border bg-card p-6 torch-glow">
        <h1 className="text-5xl leading-none">{mode === "in" ? "Welcome back" : "Join the tribe"}</h1>
        <p className="mb-4 text-sm text-muted-foreground">Save every season you simulate.</p>
        <Button type="button" variant="secondary" className="mb-4 w-full" onClick={google}>Continue with Google</Button>
        <form onSubmit={submit} className="space-y-3">
          {mode === "up" && <input className={input} placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} maxLength={30} />}
          <input className={input} type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className={input} type="password" required minLength={6} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <Button type="submit" disabled={busy} className="w-full">{mode === "in" ? "Sign in" : "Create account"}</Button>
        </form>
        {msg && <p className="mt-3 text-sm text-accent">{msg}</p>}
        <button className="mt-4 text-sm text-muted-foreground underline" onClick={() => { setMode(mode === "in" ? "up" : "in"); setMsg(null); }}>
          {mode === "in" ? "New here? Create an account" : "Already have an account? Sign in"}
        </button>
        <div className="mt-2"><Link to="/" className="text-sm text-muted-foreground underline">← Back to the simulator</Link></div>
      </div>
    </div>
  );
}
