import { Suspense } from "react";
import { AuthForm } from "@/components/auth-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SignInPage() {
  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>Welcome back. Your books are waiting.</CardDescription>
        </CardHeader>
        <CardContent>
          {/* AuthForm reads ?next= from the URL, which is request data. */}
          <Suspense fallback={null}>
            <AuthForm mode="sign-in" />
          </Suspense>
        </CardContent>
      </Card>
    </main>
  );
}
