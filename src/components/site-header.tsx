import Link from "next/link";
import { Suspense } from "react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/user-menu";
import { getCurrentUser } from "@/lib/auth";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/">
          <Logo />
        </Link>
        <nav className="flex items-center gap-1">
          <Button variant="ghost" nativeButton={false} render={<Link href="/#explore" />}>
            Explore
          </Button>
          <Suspense fallback={null}>
            <SessionArea />
          </Suspense>
        </nav>
      </div>
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
