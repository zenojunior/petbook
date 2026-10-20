import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { NewBookForm } from "@/components/book/new-book-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";

export default function NewBookPage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-12 sm:px-6">
      <Button variant="ghost" size="sm" className="self-start" nativeButton={false} render={<Link href="/dashboard" />}>
        <ArrowLeft data-icon="inline-start" />
        My books
      </Button>
      <Suspense fallback={null}>
        <NewBook />
      </Suspense>
    </main>
  );
}

async function NewBook() {
  await requireUser("/dashboard/books/new");
  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle className="font-heading text-2xl">A new book</CardTitle>
        <CardDescription>Who is this book about?</CardDescription>
      </CardHeader>
      <CardContent>
        <NewBookForm />
      </CardContent>
    </Card>
  );
}
