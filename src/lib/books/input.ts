// Shapes the editor sends to the server. Parsed with zod in the actions, because
// anything coming from the browser is untrusted input.
import { z } from "zod";
import { coverColors, coverPatterns } from "@/lib/domain/book-cover";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => (value === "" ? null : value));

const optionalDate = z
  .union([z.literal(""), z.iso.date()])
  .transform((value) => (value === "" ? null : value));

export const newBookInput = z.object({
  petName: z.string().trim().min(1, "Tell us your pet's name.").max(80),
  species: z.string().trim().min(1, "Tell us what kind of animal they are.").max(60),
});

export const pageInput = z.object({
  layout: z.enum(["text", "photo", "photo+text"]),
  text: optionalText(4000),
  // Checked against the book in saveBook(): it must be one of this book's own photos.
  imageUrl: z.string().max(200).nullable(),
  caption: optionalText(200),
});

export const bookInput = z.object({
  title: z.string().trim().min(1, "The book needs a title.").max(120),
  coverUrl: z.string().max(200).nullable(),
  coverColor: z.enum(coverColors),
  coverPattern: z.enum(coverPatterns),
  pet: z.object({
    name: z.string().trim().min(1, "Your pet needs a name.").max(80),
    species: z.string().trim().min(1, "Tell us what kind of animal they are.").max(60),
    bornOn: optionalDate,
    adoptedOn: optionalDate,
    passedOn: optionalDate,
    // Only a city. The server rounds the coordinates with fuzzLocation() before storing them.
    location: z
      .object({
        city: z.string().trim().min(1).max(120),
        lat: z.number().min(-90).max(90),
        lng: z.number().min(-180).max(180),
      })
      .nullable(),
  }),
  pages: z.array(pageInput).max(100),
});

export type BookInput = z.input<typeof bookInput>;
