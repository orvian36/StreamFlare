"use client";

import * as React from "react";
import { ProfileAvatar } from "@streamflare/ui/components/brand/profile-avatar";
import { GlowButton } from "@streamflare/ui/components/brand/glow-button";
import { EmptyState } from "@streamflare/ui/components/brand/empty-state";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@streamflare/ui/components/ui/alert-dialog";
import { api } from "../../lib/api-client";
import { useAuth } from "../../context/auth-context";

interface Profile { PROFILE_ID: string }

export function ManageProfiles() {
  const auth = useAuth();
  const [profiles, setProfiles] = React.useState<Profile[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [target, setTarget] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  const load = React.useCallback(() => {
    if (!auth.email) return;
    api
      .get<{ profile: Profile[] }>(`/api/profiles/${auth.email}`)
      .then((res) => setProfiles(res.data.profile ?? []))
      .finally(() => setLoading(false));
  }, [auth.email]);

  React.useEffect(() => { load(); }, [load]);

  async function confirmDelete() {
    if (!auth.email || !target) return;
    setBusy(true);
    try {
      await api.delete("/api/profiles/delete", {
        data: { EMAIL: auth.email, PROFILE_ID: target },
        validateStatus: () => true,
      });
      const removed = target;
      setTarget(null);
      setProfiles((prev) => {
        const next = prev.filter((p) => p.PROFILE_ID !== removed);
        auth.set_num_profiles(next.length);
        return next;
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-text">Manage profiles</h1>
      {loading ? (
        <p className="text-text-muted">Loading...</p>
      ) : profiles.length === 0 ? (
        <EmptyState title="No profiles yet" description="Create a profile to start watching." />
      ) : (
        <ul className="space-y-3">
          {profiles.map((p) => (
            <li key={p.PROFILE_ID} className="flex items-center justify-between rounded-lg border border-hairline bg-surface-1 p-3">
              <div className="flex items-center gap-3">
                <ProfileAvatar name={p.PROFILE_ID} size="sm" />
                <span className="text-text">{p.PROFILE_ID}</span>
              </div>
              <GlowButton variant="ghost" size="sm" aria-label={`Remove ${p.PROFILE_ID}`} onClick={() => setTarget(p.PROFILE_ID)}>
                Remove
              </GlowButton>
            </li>
          ))}
        </ul>
      )}
      <AlertDialog open={target !== null} onOpenChange={(o) => !o && setTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {target}?</AlertDialogTitle>
            <AlertDialogDescription>This can&apos;t be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={busy}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
