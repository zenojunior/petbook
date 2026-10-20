"use client";

import { ArrowDown, ArrowLeft, ArrowUp, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { saveBook } from "@/app/(app)/dashboard/actions";
import { StatusBadge } from "@/components/admin/status-badge";
import { DeleteBookButton } from "@/components/book/delete-book-button";
import { PublicationControls } from "@/components/book/publication-controls";
import { BookView } from "@/components/book/book-view";
import type { BookViewData, BookViewLayout } from "@/components/book/types";
import { SpeciesSelect } from "@/components/book/species-select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { BookInput } from "@/lib/books/input";
import type { CoverColor, CoverPattern } from "@/lib/domain/book-cover";
import { bookEditorSpread } from "@/lib/domain/book-editor-spread";
import { movePage } from "@/lib/domain/move-page";
import { speciesLabel, toSpecies, type Species } from "@/lib/domain/species";
import { cn } from "@/lib/utils";
import { LocationField, type PetLocation } from "./location-field";
import { CoverPicker } from "./cover-picker";
import { PhotoField } from "./photo-field";
import { ShareDialog } from "./share-dialog";

type BookStatus = "draft" | "in_review" | "published" | "rejected" | "needs_human";

type EditorPage = {
  key: string;
  layout: BookViewLayout;
  text: string;
  imageUrl: string | null;
  caption: string;
};

export type EditorState = {
  title: string;
  coverUrl: string | null;
  coverColor: CoverColor;
  coverPattern: CoverPattern;
  pet: {
    name: string;
    species: Species;
    bornOn: string;
    adoptedOn: string;
    passedOn: string;
    location: PetLocation | null;
  };
  pages: EditorPage[];
};

type SaveState = "saved" | "unsaved" | "saving" | "error";

const AUTOSAVE_DELAY_MS = 1200;

const layouts: { value: BookViewLayout; label: string }[] = [
  { value: "text", label: "Text" },
  { value: "photo", label: "Photo" },
  { value: "photo+text", label: "Photo + text" },
];

function toInput(state: EditorState): BookInput {
  return {
    title: state.title,
    coverUrl: state.coverUrl,
    coverColor: state.coverColor,
    coverPattern: state.coverPattern,
    pet: state.pet,
    pages: state.pages.map((page) => ({
      layout: page.layout,
      text: page.layout === "photo" ? "" : page.text,
      imageUrl: page.layout === "text" ? null : page.imageUrl,
      caption: page.layout === "photo" ? page.caption : "",
    })),
  };
}

function toPreview(state: EditorState): BookViewData {
  return {
    title: state.title,
    coverUrl: state.coverUrl,
    coverColor: state.coverColor,
    coverPattern: state.coverPattern,
    pet: {
      name: state.pet.name,
      species: speciesLabel(state.pet.species),
      bornOn: state.pet.bornOn || null,
      adoptedOn: state.pet.adoptedOn || null,
      passedOn: state.pet.passedOn || null,
      city: state.pet.location?.city ?? null,
    },
    pages: state.pages.map((page) => ({
      id: page.key,
      layout: page.layout,
      text: page.layout === "photo" ? null : page.text || null,
      imageUrl: page.layout === "text" ? null : page.imageUrl,
      caption: page.layout === "photo" ? page.caption || null : null,
    })),
  };
}

export function BookEditor({
  bookId,
  slug,
  status,
  shareToken,
  reviewReasons,
  initial,
}: {
  bookId: string;
  slug: string;
  status: BookStatus;
  shareToken: string | null;
  reviewReasons: string[];
  initial: EditorState;
}) {
  const [publicationPending, setPublicationPending] = useState(false);
  const editable = status === "draft" && !publicationPending;
  const [state, setState] = useState(initial);
  const [activeSide, setActiveSide] = useState(0);
  const [visibleSides, setVisibleSides] = useState<number[]>([0]);
  const [pendingFocus, setPendingFocus] = useState<string | null>(null);
  const editorRef = useRef<HTMLFieldSetElement>(null);
  const onSpreadChange = useCallback((sides: number[]) => setVisibleSides(sides), []);
  function setFocusPageIndex(index: number | undefined) {
    setActiveSide(index === undefined ? 0 : index + 2);
  }
  useEffect(() => {
    if (!pendingFocus) return;
    const page = editorRef.current?.querySelector(`[data-page-key="${pendingFocus}"]`);
    const field = page?.querySelector<HTMLElement>("textarea, input:not([type=file])")
      ?? page?.querySelector<HTMLElement>("button");
    if (field) {
      field.focus();
      setPendingFocus(null);
    }
  }, [pendingFocus, visibleSides]);
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  // What the server has, to skip saving when nothing changed (e.g. right after a save).
  const savedJson = useRef(JSON.stringify(toInput(initial)));
  const [savedSnapshot, setSavedSnapshot] = useState(() => JSON.stringify(toInput(initial)));

  const spread = bookEditorSpread(visibleSides, state.pages.length);
  const preview = useMemo(() => toPreview(state), [state]);

  // Autosave: wait for a pause in typing, then send the whole book.
  useEffect(() => {
    if (!editable) return;
    const json = JSON.stringify(toInput(state));
    if (json === savedJson.current) return;
    setSaveState("unsaved");
    const timer = setTimeout(() => {
      setSaveState("saving");
      startTransition(async () => {
        const result = await saveBook(bookId, JSON.parse(json) as BookInput);
        if (result.ok) {
          savedJson.current = json;
          setSavedSnapshot(json);
          setError(null);
          setSaveState("saved");
        } else {
          setError(result.error);
          setSaveState("error");
        }
      });
    }, AUTOSAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [state, editable, bookId]);

  // Warn before leaving the page with changes the server does not have yet.
  useEffect(() => {
    if (saveState === "saved") return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [saveState]);

  function setPet(field: Exclude<keyof EditorState["pet"], "location" | "species">, value: string) {
    setState((s) => ({ ...s, pet: { ...s.pet, [field]: value } }));
  }

  function updatePage(index: number, patch: Partial<EditorPage>) {
    setState((s) => ({ ...s, pages: s.pages.map((p, i) => (i === index ? { ...p, ...patch } : p)) }));
  }

  function addPage(layout: BookViewLayout) {
    const key = crypto.randomUUID();
    setPendingFocus(key);
    setState((s) => ({
      ...s,
      pages: [...s.pages, { key, layout, text: "", imageUrl: null, caption: "" }],
    }));
    setFocusPageIndex(state.pages.length);
  }

  function removePage(index: number) {
    setState((s) => ({ ...s, pages: s.pages.filter((_, i) => i !== index) }));
    setActiveSide(Math.min(index + 2, state.pages.length + 1));
  }

  function move(from: number, to: number) {
    setState((s) => ({ ...s, pages: movePage(s.pages, from, to) }));
    setFocusPageIndex(to);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/dashboard" />}>
          <ArrowLeft data-icon="inline-start" />
          My books
        </Button>
        <div className="flex flex-wrap items-center gap-3">
          {editable && <SaveIndicator state={saveState} error={error} />}
          <StatusBadge status={status} />
          <DeleteBookButton bookId={bookId} />
          <ShareDialog
            bookId={bookId}
            slug={slug}
            published={status === "published"}
            initialToken={shareToken}
          />
        </div>
      </div>

      <PublicationControls bookId={bookId} status={status} reasons={reviewReasons} onBusyChange={setPublicationPending}
        saved={saveState === "saved" && JSON.stringify(toInput(state)) === savedSnapshot} />

      {status !== "draft" && (
        <p className="rounded-lg border bg-secondary/60 px-4 py-3 text-sm text-muted-foreground">
          This book is not a draft anymore, so it cannot be edited right now.
        </p>
      )}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
        <div className="order-2 min-w-0 lg:order-1">
          <nav aria-label="Book sections" className="mb-4 flex flex-wrap gap-1">
            {[{ side: 0, label: "Cover" }, { side: 1, label: "Pet details" },
              ...state.pages.map((_, index) => ({ side: index + 2, label: String(index + 1) })),
              { side: state.pages.length + 2, label: "End" }].map(({ side, label }) => (
              <Button key={side} size="sm" variant={visibleSides.includes(side) ? "secondary" : "ghost"}
                aria-current={visibleSides.includes(side) ? "page" : undefined}
                aria-label={side >= 2 && side < state.pages.length + 2 ? `Edit page ${label}` : label}
                onClick={() => setActiveSide(side)}>{label}</Button>
            ))}
          </nav>
          <fieldset ref={editorRef} disabled={!editable} className="flex min-w-0 flex-col gap-6">
            {spread.pet && (
              <Card>
                <CardHeader>
                  <CardTitle>{spread.cover ? "The book" : "About your pet"}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  {spread.cover && (
                    <>
                      <Field id="title" label="Title">
                        <Input
                          id="title"
                          value={state.title}
                          maxLength={120}
                          onChange={(e) => setState((s) => ({ ...s, title: e.target.value }))}
                        />
                      </Field>
                      <div className="flex flex-col gap-2">
                        <Label>Cover photo</Label>
                        <PhotoField
                          bookId={bookId}
                          url={state.coverUrl}
                          label="Cover photo"
                          onChange={(coverUrl) => {
                            setState((s) => ({ ...s, coverUrl }));
                            setFocusPageIndex(undefined);
                          }}
                        />
                      </div>
                      <CoverPicker
                        color={state.coverColor}
                        pattern={state.coverPattern}
                        onChange={({ color, pattern }) => {
                          setState((s) => ({ ...s, coverColor: color, coverPattern: pattern }));
                          setFocusPageIndex(undefined);
                        }}
                      />
                    </>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <Field id="petName" label="Pet's name">
                      <Input
                        id="petName"
                        value={state.pet.name}
                        maxLength={80}
                        onChange={(e) => setPet("name", e.target.value)}
                      />
                    </Field>
                    <Field id="species" label="Species">
                      <SpeciesSelect
                        id="species"
                        value={state.pet.species}
                        onChange={(e) =>
                          setState((s) => ({ ...s, pet: { ...s.pet, species: toSpecies(e.target.value) } }))
                        }
                      />
                    </Field>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {(
                      [
                        ["bornOn", "Born"],
                        ["adoptedOn", "Came home"],
                        ["passedOn", "Passed away"],
                      ] as const
                    ).map(([field, label]) => (
                      <Field key={field} id={field} label={label}>
                        <Input
                          id={field}
                          type="date"
                          value={state.pet[field]}
                          onChange={(e) => setPet(field, e.target.value)}
                        />
                      </Field>
                    ))}
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="city">Where they lived</Label>
                    <LocationField
                      value={state.pet.location}
                      onChange={(location) => {
                        setState((s) => ({ ...s, pet: { ...s.pet, location } }));
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            <section className="flex flex-col gap-4" aria-labelledby="pages-heading">
              <h2 id="pages-heading" className="font-heading text-xl font-semibold">
                {spread.end ? "The end" : spread.pageIndexes.length > 0 ? "Pages" : "Add a page"}
              </h2>
              {spread.end && (
                <p className="text-sm text-muted-foreground">{state.title || "Untitled book"} · {state.pages.length} {state.pages.length === 1 ? "page" : "pages"}. Add another memory below, or use the navigator to revisit your story.</p>
              )}
              {state.pages.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No pages yet. Add the first one and watch it appear in the book.
                </p>
              )}
              <ol className="flex flex-col gap-4">
                {state.pages.map((page, index) => spread.pageIndexes.includes(index) && (
                  <li key={page.key} data-page-key={page.key}>
                    <PageEditor
                      bookId={bookId}
                      page={page}
                      index={index}
                      count={state.pages.length}
                      active={activeSide === index + 2}
                      onFocus={() => setFocusPageIndex(index)}
                      onChange={(patch) => updatePage(index, patch)}
                      onMove={(to) => move(index, to)}
                      onRemove={() => removePage(index)}
                    />
                  </li>
                ))}
              </ol>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => addPage("text")}>
                  <Plus data-icon="inline-start" />
                  Text page
                </Button>
                <Button variant="outline" onClick={() => addPage("photo+text")}>
                  <Plus data-icon="inline-start" />
                  Photo + text page
                </Button>
              </div>
            </section>
          </fieldset>
        </div>

        <div className="order-1 min-w-0 lg:order-2 lg:sticky lg:top-8 lg:self-start">
          <p className="mb-3 text-[0.65rem] font-medium tracking-[0.2em] text-muted-foreground uppercase">
            Live preview
          </p>
          <BookView book={preview} keyboardNavigation="document" activeSide={activeSide} onSideChange={setActiveSide} onSpreadChange={onSpreadChange} />
        </div>
      </div>
    </div>
  );
}

function Field({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}

function SaveIndicator({ state, error }: { state: SaveState; error: string | null }) {
  const text = {
    saved: "All changes saved",
    unsaved: "Unsaved changes",
    saving: "Saving…",
    error: error ?? "Could not save",
  }[state];
  return (
    <span
      role="status"
      className={cn("text-xs", state === "error" ? "text-destructive" : "text-muted-foreground")}
    >
      {text}
    </span>
  );
}

function PageEditor({
  bookId,
  page,
  index,
  count,
  active,
  onFocus,
  onChange,
  onMove,
  onRemove,
}: {
  bookId: string;
  page: EditorPage;
  index: number;
  count: number;
  active: boolean;
  onFocus: () => void;
  onChange: (patch: Partial<EditorPage>) => void;
  onMove: (to: number) => void;
  onRemove: () => void;
}) {
  const number = index + 1;
  const hasPhoto = page.layout !== "text";
  const hasText = page.layout !== "photo";

  return (
    <Card size="sm" onFocus={onFocus} className={cn("transition-shadow", active && "ring-2 ring-ring/60")}>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm">Page {number}</CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Move page ${number} up`}
              disabled={index === 0}
              onClick={() => onMove(index - 1)}
            >
              <ArrowUp />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Move page ${number} down`}
              disabled={index === count - 1}
              onClick={() => onMove(index + 1)}
            >
              <ArrowDown />
            </Button>
            <Button variant="ghost" size="icon-sm" aria-label={`Delete page ${number}`} onClick={onRemove}>
              <Trash2 />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div role="radiogroup" aria-label="Layout" className="flex gap-1 rounded-lg bg-muted p-1">
          {layouts.map((layout) => (
            <button
              key={layout.value}
              type="button"
              role="radio"
              aria-checked={page.layout === layout.value}
              onClick={() => onChange({ layout: layout.value })}
              className={cn(
                "flex-1 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                page.layout === layout.value && "bg-card text-foreground shadow-sm",
              )}
            >
              {layout.label}
            </button>
          ))}
        </div>
        {hasPhoto && (
          <>
            <PhotoField
              bookId={bookId}
              url={page.imageUrl}
              label={`Photo for page ${number}`}
              onChange={(imageUrl) => onChange({ imageUrl })}
            />
            {page.layout === "photo" && (
              <Input
                aria-label={`Caption for page ${number}`}
                placeholder="Caption (optional)"
                value={page.caption}
                maxLength={200}
                onChange={(e) => onChange({ caption: e.target.value })}
              />
            )}
          </>
        )}
        {hasText && (
          <Textarea
            aria-label={`Text for page ${number}`}
            placeholder="What do you want to remember?"
            value={page.text}
            maxLength={4000}
            rows={5}
            className="max-h-80"
            onChange={(e) => onChange({ text: e.target.value })}
          />
        )}
      </CardContent>
    </Card>
  );
}
