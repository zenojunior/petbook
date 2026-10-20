"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { safeRedirectPath } from "@/lib/domain/safe-redirect";

export function GoogleSignInButton() {
  const searchParams = useSearchParams();
  const next = safeRedirectPath(searchParams.get("next"));
  const [pending, setPending] = useState(false);
  // Better Auth sends the user back here with ?error=... when Google sign-in fails.
  const failed = searchParams.has("error");

  async function signIn() {
    setPending(true);
    const { error } = await authClient.signIn.social({
      provider: "google",
      callbackURL: next,
      errorCallbackURL: `/sign-in?next=${encodeURIComponent(next)}`,
    });
    // On success the browser is already leaving for Google; only an error comes back here.
    if (error) setPending(false);
  }

  return (
    <div className="flex flex-col gap-3">
      {failed && (
        <p role="alert" className="text-sm text-destructive">
          We could not sign you in with Google. Please try again.
        </p>
      )}
      <Button size="lg" onClick={signIn} disabled={pending}>
        Continue with Google
      </Button>
    </div>
  );
}
