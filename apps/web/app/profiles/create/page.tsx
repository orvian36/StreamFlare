"use client";

import { useRouter } from "next/navigation";
import { GlassPanel } from "@streamflare/ui/components/brand/glass-panel";
import { ProfileCreateForm } from "../../../components/profiles/profile-create-form";
import * as ROUTES from "../../../constants/routes";

export default function CreateProfilePage() {
  const router = useRouter();
  return (
    <main className="grid min-h-dvh place-items-center bg-canvas px-6 py-16">
      <div className="w-full max-w-md">
        <GlassPanel className="p-8">
          <ProfileCreateForm onSuccess={() => router.push(ROUTES.BROWSE)} />
        </GlassPanel>
      </div>
    </main>
  );
}
