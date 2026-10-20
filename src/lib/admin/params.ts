import { z } from "zod";
import { BOOK_STATUSES } from "./data";

// Query strings are user input: anything invalid falls back to a sane default instead of erroring.
const pageParam = z.coerce.number().int().min(1).catch(1);
const queryParam = z
  .string()
  .trim()
  .max(100)
  .transform((q) => q || undefined)
  .optional()
  .catch(undefined);

export const usersParams = z.object({ q: queryParam, page: pageParam });

export const booksParams = z.object({
  q: queryParam,
  status: z.enum(BOOK_STATUSES).optional().catch(undefined),
  page: pageParam,
});

// Book ids are uuids. Checking first turns a malformed link into a 404 instead of a database error.
export const bookId = z.uuid();
