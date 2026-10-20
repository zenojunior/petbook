import { Suspense } from "react";
import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SignInButtonSkeleton } from "@/components/skeletons";

export default function SignInPage() {
  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>
            Reading is open to everyone. Sign in to write a book about your pet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* The button reads ?next= and ?error= from the URL, which is request data. */}
          <Suspense fallback={<SignInButtonSkeleton />}>
            <GoogleSignInButton />
          </Suspense>
        </CardContent>
      </Card>
    </main>
  );
}
