import Link from "next/link";
import { Suspense } from "react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/user-menu";
import { getCurrentUser } from "@/lib/auth";

export function SiteHeader() {
  return (
    <header className="flex h-14 items-center justify-between border-b px-4">
      <Link href="/">
        <Logo />
      </Link>
      <Suspense fallback={null}>
        <SessionArea />
      </Suspense>
    </header>
  );
}

async function SessionArea() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <Button variant="outline" nativeButton={false} render={<Link href="/sign-in" />}>
        Sign in
      </Button>
    );
  }
  return <UserMenu name={user.name} email={user.email} isAdmin={user.role === "admin"} />;
}
