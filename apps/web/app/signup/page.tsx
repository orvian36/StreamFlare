import { Suspense } from "react";
import { AuthShell } from "../../components/auth/auth-shell";
import { SignUpForm } from "../../components/auth/sign-up-form";

export default function SignUpPage() {
  return (
    <AuthShell>
      <Suspense fallback={null}>
        <SignUpForm />
      </Suspense>
    </AuthShell>
  );
}
