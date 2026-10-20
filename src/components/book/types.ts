import type { CoverColor, CoverPattern } from "@/lib/domain/book-cover";

// What <BookView> needs to draw a book. Plain data, so the same component renders
// the live preview in the editor (unsaved form state) and, later, the public reader.

export type BookViewLayout = "text" | "photo" | "photo+text";

export type BookViewPage = {
  id: string;
  layout: BookViewLayout;
  text: string | null;
  imageUrl: string | null;
  caption: string | null;
};

export type BookViewPet = {
  name: string;
  species: string;
  // ISO dates (YYYY-MM-DD) or null.
  bornOn: string | null;
  adoptedOn: string | null;
  passedOn: string | null;
  city: string | null;
};

export type BookViewData = {
  title: string;
  coverUrl: string | null;
  coverColor: CoverColor;
  coverPattern: CoverPattern;
  pet: BookViewPet;
  pages: BookViewPage[];
};
