import { Suspense } from "react";
import { FeaturedBookForm } from "@/components/admin/featured-book-form";
import { PageHeader } from "@/components/admin/page-header";
import { TableSkeleton } from "@/components/skeletons";
import { requireAdmin } from "@/lib/auth";
import { getFeaturableBook, getPinnedBookId } from "@/lib/books/featured";

export default function SettingsPage() {
  return (
    <>
      <PageHeader
        title="Settings"
        description="Choose the book shown on the landing page. Until one is chosen, each visit shows a random published book."
      />
      <Suspense fallback={<TableSkeleton />}>
        <FeaturedBook />
      </Suspense>
    </>
  );
}

async function FeaturedBook() {
  await requireAdmin();
  const pinnedId = await getPinnedBookId();
  const pinned = pinnedId ? await getFeaturableBook(pinnedId) : null;
  return <FeaturedBookForm pinned={pinned} />;
}
