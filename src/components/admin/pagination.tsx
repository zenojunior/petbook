import Link from "next/link";
import { Button } from "@/components/ui/button";

type Props = {
  pathname: string;
  // The current filters, kept on every page link.
  params: Record<string, string | undefined>;
  page: number;
  pageSize: number;
  total: number;
  pageKey?: string;
};

export function Pagination({ pathname, params, page, pageSize, total, pageKey = "page" }: Props) {
  const lastPage = Math.max(1, Math.ceil(total / pageSize));
  if (lastPage === 1) return null;

  function href(target: number) {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) if (value) search.set(key, value);
    if (target > 1) search.set(pageKey, String(target));
    const query = search.toString();
    return query ? `${pathname}?${query}` : pathname;
  }

  return (
    <div className="flex items-center justify-between gap-4 text-sm text-muted-foreground">
      <span>
        Page {page} of {lastPage}
      </span>
      <div className="flex gap-2">
        {page > 1 && (
          <Button variant="outline" size="sm" nativeButton={false} render={<Link href={href(page - 1)} />}>
            Previous
          </Button>
        )}
        {page < lastPage && (
          <Button variant="outline" size="sm" nativeButton={false} render={<Link href={href(page + 1)} />}>
            Next
          </Button>
        )}
      </div>
    </div>
  );
}
