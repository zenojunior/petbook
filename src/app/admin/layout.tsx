import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { AdminNav } from "@/components/admin/admin-nav";
import { Button } from "@/components/ui/button";

// Every /admin page renders inside .admin, which switches to the tokens in src/styles/tokens.admin.css.
// Access is not checked here: a layout does not stop its pages from rendering. Each admin page
// calls requireAdmin() itself, and src/proxy.ts blocks the whole area first.
// The shell below is static (links only), so it holds no data worth protecting.
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="admin flex flex-1 flex-col bg-background text-foreground md:flex-row">
      <aside className="flex flex-col gap-4 border-b p-3 md:sticky md:top-0 md:h-svh md:w-56 md:shrink-0 md:border-r md:border-b-0">
        <div className="flex items-center justify-between gap-2 px-2.5 md:pt-2">
          <span className="text-sm font-semibold">Petbook Admin</span>
        </div>
        <Suspense fallback={null}>
          <AdminNav />
        </Suspense>
        <div className="hidden md:mt-auto md:block">
          <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/" />}>
            <ArrowLeft data-icon="inline-start" />
            Back to the app
          </Button>
        </div>
      </aside>
      <main className="flex min-w-0 flex-1 flex-col gap-6 p-4 md:p-8">{children}</main>
    </div>
  );
}
