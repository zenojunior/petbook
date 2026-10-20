import Link from "next/link";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth";

export default function AdminPage() {
  return (
    <Suspense fallback={null}>
      <AdminHome />
    </Suspense>
  );
}

// All admin content lives below requireAdmin(), so none of it is prerendered or sent to non-admins.
async function AdminHome() {
  const admin = await requireAdmin();
  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Hello, {admin.name}</CardTitle>
          <CardDescription>The same Card and Button, with the admin tokens.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm">
          Only accounts with role = admin get here. Everyone else gets a 404.
        </CardContent>
        <CardFooter>
          <Button variant="outline" nativeButton={false} render={<Link href="/" />}>
            Back to the app
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}
