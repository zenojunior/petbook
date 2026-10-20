import { Suspense } from "react";
import { FeaturedBookForm } from "@/components/admin/featured-book-form";
import { PageHeader } from "@/components/admin/page-header";
import { TableSkeleton } from "@/components/skeletons";
import { requireAdmin } from "@/lib/auth";
import { getPinnedBookId, listFeaturableBooks } from "@/lib/books/featured";

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
  const [books, pinnedId] = await Promise.all([listFeaturableBooks(), getPinnedBookId()]);
  return <FeaturedBookForm books={books} pinnedId={pinnedId} />;
}
