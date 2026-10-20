import { notFound } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";
import { getMyBook } from "@/lib/books/data";
import { BookEditor } from "./book-editor";
import { toSpecies } from "@/lib/domain/species";
import { EditorSkeleton } from "@/components/skeletons";

export default function EditBookPage({ params }: PageProps<"/dashboard/books/[id]">) {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-8 sm:px-6">
      <Suspense fallback={<EditorSkeleton />}>
        <EditBook params={params} />
      </Suspense>
    </main>
  );
}

async function EditBook({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // A malformed id would make Postgres throw on the uuid cast; treat it as not found.
  if (!z.uuid().safeParse(id).success) notFound();

  // getMyBook only returns the signed-in user's own book, so someone else's id is a 404.
  const data = await getMyBook(id);
  if (!data) notFound();

  const { book, pet, pages } = data;
  return (
    <BookEditor
      key={`${book.id}:${book.status}`}
      reviewReasons={data.reviewReasons}
      bookId={book.id}
      slug={book.slug}
      status={book.status}
      shareToken={book.shareToken}
      initial={{
        title: book.title,
        coverUrl: book.coverUrl,
        coverColor: book.coverColor,
        coverPattern: book.coverPattern,
        pet: {
          name: pet.name,
          species: toSpecies(pet.species),
          bornOn: pet.bornOn ?? "",
          adoptedOn: pet.adoptedOn ?? "",
          passedOn: pet.passedOn ?? "",
          location:
            pet.city !== null && pet.lat !== null && pet.lng !== null
              ? { city: pet.city, lat: pet.lat, lng: pet.lng }
              : null,
        },
        pages: pages.map((page) => ({
          key: page.id,
          layout: page.layout,
          text: page.text ?? "",
          imageUrl: page.imageUrl,
          caption: page.caption ?? "",
        })),
      }}
    />
  );
}
