import { Suspense } from "react";
import { AuthForm } from "@/components/auth-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SignUpPage() {
  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Create your account</CardTitle>
          <CardDescription>An account lets you write a book about your pet.</CardDescription>
        </CardHeader>
        <CardContent>
          {/* AuthForm reads ?next= from the URL, which is request data. */}
          <Suspense fallback={null}>
            <AuthForm mode="sign-up" />
          </Suspense>
        </CardContent>
      </Card>
    </main>
  );
}
