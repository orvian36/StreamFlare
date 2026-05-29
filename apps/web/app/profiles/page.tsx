"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { ProfileAvatar } from "@streamflare/ui/components/brand/profile-avatar";
import { Stagger, StaggerItem } from "@streamflare/ui/motion";
import { api } from "../../lib/api-client";
import { useAuth } from "../../context/auth-context";
import { GateHeader } from "../../components/profiles/gate-header";
import * as ROUTES from "../../constants/routes";

interface Profile { PROFILE_ID: string; DOB: string | null }

export default function ProfilesPage() {
  const auth = useAuth();
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.email) { router.push(ROUTES.SIGN_IN); return; }
    api
      .get<{ profile: Profile[] }>(`/api/profiles/${auth.email}`)
      .then((res) => {
        const list = res.data.profile ?? [];
        setProfiles(list);
        auth.set_num_profiles(list.length);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [auth.email, router]);

  function select(profileId: string, index: number) {
    auth.set_ptbd(index);
    auth.set_profile(profileId);
    router.push(ROUTES.BROWSE);
  }

  const canAdd = profiles.length < (auth.max_profiles ?? 0);

  return (
    <main className="flex min-h-dvh flex-col bg-canvas">
      <GateHeader />
      <div className="flex flex-1 flex-col items-center justify-center px-6 pb-24">
        <h1 className="mb-10 font-display text-3xl font-bold tracking-tight text-text md:text-5xl">
          Who&apos;s watching?
        </h1>
        {loading ? (
          <div className="flex gap-6">
            {[0, 1, 2].map((i) => (
              <div key={i} className="size-24 animate-pulse rounded-xl bg-surface-2" />
            ))}
          </div>
        ) : (
          <Stagger className="flex flex-wrap items-start justify-center gap-6 md:gap-8">
            {profiles.map((p, index) => (
              <StaggerItem key={p.PROFILE_ID}>
                <button
                  type="button"
                  onClick={() => select(p.PROFILE_ID, index)}
                  className="group flex flex-col items-center gap-3"
                >
                  <ProfileAvatar
                    name={p.PROFILE_ID}
                    size="lg"
                    className="transition-transform group-hover:scale-105 group-focus-visible:ring-2 group-focus-visible:ring-ring"
                  />
                  <span className="text-sm text-text-muted group-hover:text-text">{p.PROFILE_ID}</span>
                </button>
              </StaggerItem>
            ))}
            {canAdd ? (
              <StaggerItem>
                <Link href={ROUTES.CREATE_PROFILE} className="group flex flex-col items-center gap-3">
                  <span className="grid size-24 place-items-center rounded-xl border-2 border-dashed border-hairline text-text-subtle transition-colors group-hover:border-brand group-hover:text-text">
                    <Plus className="size-8" />
                  </span>
                  <span className="text-sm text-text-muted group-hover:text-text">Add profile</span>
                </Link>
              </StaggerItem>
            ) : null}
          </Stagger>
        )}
        <Link
          href={ROUTES.DELETE_PROFILE}
          className="mt-12 font-mono text-xs uppercase tracking-wide text-text-subtle hover:text-text"
        >
          Manage profiles
        </Link>
      </div>
    </main>
  );
}
