"use client";

import Link from "next/link";
import { GlassPanel } from "@streamflare/ui/components/brand/glass-panel";
import { ManageProfiles } from "../../../components/profiles/manage-profiles";
import * as ROUTES from "../../../constants/routes";

export default function DeleteProfilePage() {
  return (
    <main className="grid min-h-dvh place-items-center bg-canvas px-6 py-16">
      <div className="w-full max-w-md space-y-6">
        <GlassPanel className="p-8"><ManageProfiles /></GlassPanel>
        <Link
          href={ROUTES.PROFILES}
          className="block text-center font-mono text-xs uppercase tracking-wide text-text-subtle hover:text-text"
        >
          Back to profiles
        </Link>
      </div>
    </main>
  );
}
