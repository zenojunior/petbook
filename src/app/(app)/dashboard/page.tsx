import { BookOpen, Plus } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { StatusBadge } from "@/components/admin/status-badge";
import { formatDate } from "@/components/admin/format";
import { NewBookForm } from "@/components/book/new-book-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { listMyBooks } from "@/lib/books/data";

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
  const books = await listMyBooks();
  const firstName = user.name.split(" ")[0];

  if (books.length === 0) {
    return (
      <div className="flex flex-col gap-8">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">Hi, {firstName}</h1>
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle className="font-heading text-2xl">Write your first book</CardTitle>
            <CardDescription>
              Start with their name. You can add pages, dates and photos in the editor, and see the
              book take shape as you write.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <NewBookForm />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-heading text-3xl font-semibold tracking-tight">Hi, {firstName}</h1>
          <p className="text-muted-foreground">Your books</p>
        </div>
        <Button nativeButton={false} render={<Link href="/dashboard/books/new" />}>
          <Plus data-icon="inline-start" />
          New book
        </Button>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {books.map((book) => (
          <li key={book.id}>
            <Link
              href={`/dashboard/books/${book.id}`}
              className="group block rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <Card className="h-full transition-shadow group-hover:shadow-md">
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle className="font-heading text-lg leading-snug">{book.title}</CardTitle>
                    <StatusBadge status={book.status} />
                  </div>
                  <CardDescription>
                    {book.petName} · {book.species}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex items-center gap-2 text-xs text-muted-foreground">
                  <BookOpen className="size-3.5" />
                  {book.pageCount === 1 ? "1 page" : `${book.pageCount} pages`} · edited{" "}
                  {formatDate(book.updatedAt)}
                </CardContent>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
