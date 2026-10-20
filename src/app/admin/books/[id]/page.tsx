import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Field } from "@/components/admin/field";
import { formatDateTime, formatDay } from "@/components/admin/format";
import { PageHeader } from "@/components/admin/page-header";
import { ReviewsTable } from "@/components/admin/reviews-table";
import { StatusBadge } from "@/components/admin/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getBook } from "@/lib/admin/data";
import { bookId } from "@/lib/admin/params";

export default function BookPage({ params }: PageProps<"/admin/books/[id]">) {
  return (
    <>
      <div>
        <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/admin/books" />}>
          <ArrowLeft data-icon="inline-start" />
          All books
        </Button>
      </div>
      <Suspense fallback={null}>
        <BookDetail params={params} />
      </Suspense>
    </>
  );
}

async function BookDetail({ params }: Pick<PageProps<"/admin/books/[id]">, "params">) {
  const id = bookId.safeParse((await params).id);
  if (!id.success) notFound();
  const data = await getBook(id.data);
  if (!data) notFound();
  const { book, pet, owner } = data;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={book.title} description={`/${book.slug}`}>
        <StatusBadge status={book.status} />
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Book</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
              <Field
                label="Author"
                value={
                  <Link href={`/admin/users/${owner.id}`} className="hover:underline">
                    {owner.name}
                  </Link>
                }
              />
              <Field label="Author email" value={owner.email} />
              <Field label="Created" value={formatDateTime(book.createdAt)} />
              <Field label="Updated" value={formatDateTime(book.updatedAt)} />
              <Field label="Published" value={formatDateTime(book.publishedAt)} />
              <Field label="Cover" value={book.coverUrl ? "Yes" : "Missing"} />
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pet</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
              <Field label="Name" value={pet.name} />
              <Field label="Species" value={pet.species} />
              <Field label="Born" value={formatDay(pet.bornOn)} />
              <Field label="Adopted" value={formatDay(pet.adoptedOn)} />
              <Field label="Passed away" value={formatDay(pet.passedOn)} />
              {/* Already rounded by fuzzLocation() when it was stored. */}
              <Field label="Location" value={`${pet.city} (${pet.lat.toFixed(2)}, ${pet.lng.toFixed(2)})`} />
            </dl>
          </CardContent>
        </Card>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-lg font-medium">Pages ({data.pages.length})</h2>
        {data.pages.length === 0 ? (
          <p className="text-sm text-muted-foreground">This book has no pages yet.</p>
        ) : (
          <ol className="flex flex-col gap-3">
            {data.pages.map((page) => (
              <li key={page.id}>
                <Card size="sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      Page {page.position + 1}
                      <Badge variant="outline">{page.layout}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-2">
                    {page.imageUrl && (
                      <a href={page.imageUrl} target="_blank" rel="noreferrer" className="truncate underline">
                        {page.imageUrl}
                      </a>
                    )}
                    {page.caption && <p className="text-muted-foreground italic">{page.caption}</p>}
                    {page.text && <p className="whitespace-pre-wrap">{page.text}</p>}
                  </CardContent>
                </Card>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-lg font-medium">Review history</h2>
        <ReviewsTable reviews={data.reviews} showBook={false} />
      </section>
    </div>
  );
}
