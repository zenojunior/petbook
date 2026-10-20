import { Suspense } from "react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";

export default function DashboardPage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-12 sm:px-6">
      <Suspense fallback={null}>
        <Dashboard />
      </Suspense>
    </main>
  );
}

async function Dashboard() {
  const user = await requireUser("/dashboard");
  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-heading text-3xl font-semibold tracking-tight">Hi, {user.name.split(" ")[0]}</h1>
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Your books will live here</CardTitle>
          <CardDescription>
            The book editor is the next thing we are building. Soon you will be able to start your pet&apos;s
            book from this page.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
