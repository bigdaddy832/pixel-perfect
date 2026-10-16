import { Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useSessionUser, useUsername } from "@/hooks/use-session";
import { Button } from "@/components/ui/button";

export function AccountBar() {
  const { user, ready } = useSessionUser();
  const username = useUsername(user?.id);
  const navigate = useNavigate();
  if (!ready) return <div className="h-10" />;
  return (
    <div className="flex items-center justify-end gap-3 border-b bg-card/60 px-4 py-2 text-sm">
      {user ? (
        <>
          <span className="text-muted-foreground">Signed in as <b className="text-foreground">{username ?? user.email}</b></span>
          <Link to="/history" className="rounded-md bg-secondary px-3 py-1 hover:bg-muted">Season History</Link>
          <Button variant="ghost" size="sm" onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/", replace: true }); }}>Sign out</Button>
        </>
      ) : (
        <>
          <span className="text-muted-foreground">Sign in to save your seasons</span>
          <Link to="/auth" className="rounded-md bg-primary px-3 py-1 font-semibold text-primary-foreground">Sign in / Sign up</Link>
        </>
      )}
    </div>
  );
}
