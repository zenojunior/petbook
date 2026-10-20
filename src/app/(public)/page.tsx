import { BookOpen, Feather, Globe2, Heart, ImageOff, MapPinned, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { BookPreview } from "@/components/landing/book-preview";
import { MapPreview } from "@/components/landing/map-preview";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

import { MapSkeleton } from "@/components/skeletons";
// The dashboard asks for sign-in first and brings the author back afterwards.
const WRITE_HREF = "/dashboard";
const EXPLORE_HREF = "/explore";

export default function LandingPage() {
  return (
    <main className="flex flex-1 flex-col">
      <Hero />
      <HowItWorks />
      <TwoReasons />
      <Explore />
      <Care />
      <FinalCall />
      <Footer />
    </main>
  );
}

function Hero() {
  return (
    <section className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 pt-14 pb-20 sm:px-6 md:grid-cols-[1.1fr_1fr] md:pt-20">
      <div className="flex flex-col items-start gap-6">
        <p className="rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
          Little books for the pets we love
        </p>
        <h1 className="font-heading text-4xl leading-[1.05] font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
          Every pet has a story worth keeping.
        </h1>
        <p className="max-w-xl text-lg leading-relaxed text-pretty text-muted-foreground">
          Write a small illustrated book about your cat, your dog, or any animal who shared your life.
          Celebrate them, or remember them, and pin their story on a map of pets from all over the
          world.
        </p>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <Button size="lg" className="h-11 px-5 text-base" nativeButton={false} render={<Link href={WRITE_HREF} />}>
            <Feather data-icon="inline-start" />
            Write your pet&apos;s book
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-11 px-5 text-base"
            nativeButton={false}
            render={<Link href={EXPLORE_HREF} />}
          >
            <Globe2 data-icon="inline-start" />
            Explore books
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">Reading is free and needs no account.</p>
      </div>
      <BookPreview />
    </section>
  );
}

const steps = [
  {
    icon: Heart,
    title: "Tell us who they are",
    text: "Name, species, the day they arrived, and the city you shared. Only the city: never your address.",
  },
  {
    icon: BookOpen,
    title: "Fill the pages",
    text: "Add photos and a few words, page by page. Their quirks, their favourite spot, the day everything changed.",
  },
  {
    icon: Sparkles,
    title: "Share their story",
    text: "Once it is reviewed, your book gets its own link for family and friends, and a pin on the world map.",
  },
];

function HowItWorks() {
  return (
    <section className="border-y bg-secondary/50">
      <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
        <SectionHeading eyebrow="How it works" title="A book in three small steps" />
        <ol className="mt-12 grid gap-6 md:grid-cols-3">
          {steps.map((step, index) => (
            <li key={step.title} className="flex flex-col gap-4 rounded-2xl border bg-card p-6">
              <div className="flex items-center justify-between">
                <span className="flex size-10 items-center justify-center rounded-full bg-accent">
                  <step.icon className="size-5" />
                </span>
                <span className="font-heading text-3xl text-muted-foreground/50">{index + 1}</span>
              </div>
              <h3 className="font-heading text-xl font-medium">{step.title}</h3>
              <p className="leading-relaxed text-muted-foreground">{step.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function TwoReasons() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
      <SectionHeading eyebrow="Why people write one" title="To celebrate, or to remember" />
      <div className="mt-12 grid gap-6 md:grid-cols-2">
        <article className="flex flex-col gap-3 rounded-2xl border bg-card p-8">
          <p className="font-heading text-sm italic text-muted-foreground">The story of…</p>
          <h3 className="font-heading text-2xl font-medium">For the one asleep on your feet right now</h3>
          <p className="leading-relaxed text-muted-foreground">
            The adoption day, the first walk, the shoes they destroyed. Write it down while it is happening,
            and keep adding pages as the story grows.
          </p>
        </article>
        <article className="flex flex-col gap-3 rounded-2xl border bg-primary p-8 text-primary-foreground">
          <p className="font-heading text-sm italic text-primary-foreground/70">In memory of…</p>
          <h3 className="font-heading text-2xl font-medium">For the one you still look for at the door</h3>
          <p className="leading-relaxed text-primary-foreground/75">
            A gentle place to gather the photos and the small moments, so their story is never lost.
            Take your time. The book will wait for you.
          </p>
        </article>
      </div>
    </section>
  );
}

function Explore() {
  return (
    <section id="explore" className="scroll-mt-20 border-y bg-secondary/50">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 md:grid-cols-[1fr_1.4fr]">
        <div className="flex flex-col items-start gap-5">
          <SectionHeading eyebrow="Explore" title="A library of pets from around the world" align="left" />
          <p className="leading-relaxed text-muted-foreground">
            Every published book becomes a pin on the map. Wander from a cat in Lisbon to a dog in São
            Paulo, filter by species, and read any book page by page. No account needed.
          </p>
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPinned className="size-4" />
            Only reviewed, published books appear here.
          </p>
        </div>
        <div className="min-w-0 space-y-4">
          <Suspense fallback={<MapSkeleton className="h-[360px]" />}><MapPreview /></Suspense>
          <Button variant="outline" nativeButton={false} render={<Link href="/explore" />}>Explore all stories</Button>
        </div>
      </div>
    </section>
  );
}

const promises = [
  {
    icon: MapPinned,
    title: "Approximate places only",
    text: "We keep the city and blur the coordinates. The map shows a neighbourhood, never a home.",
  },
  {
    icon: ImageOff,
    title: "Photos without hidden data",
    text: "Location and camera details are removed from every photo before it is stored.",
  },
  {
    icon: ShieldCheck,
    title: "Reviewed before it is public",
    text: "Each book is checked before it goes live, so the library stays kind and spam-free.",
  },
];

function Care() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
      <SectionHeading eyebrow="Made with care" title="Their story is public. Your life is not." />
      <ul className="mt-12 grid gap-8 md:grid-cols-3">
        {promises.map((promise) => (
          <li key={promise.title} className="flex gap-4">
            <promise.icon className="mt-1 size-5 shrink-0" />
            <div className="space-y-1.5">
              <h3 className="font-medium">{promise.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{promise.text}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function FinalCall() {
  return (
    <section className="px-4 pb-20 sm:px-6">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-6 rounded-3xl bg-accent px-6 py-16 text-center text-accent-foreground">
        <h2 className="max-w-2xl font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          Who would your book be about?
        </h2>
        <p className="max-w-xl text-accent-foreground/75">
          Start with a name and one photo. You can come back and add pages whenever you like.
        </p>
        <Button size="lg" className="h-11 px-5 text-base" nativeButton={false} render={<Link href={WRITE_HREF} />}>
          <Feather data-icon="inline-start" />
          Write your pet&apos;s book
        </Button>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:px-6">
        <Logo className="text-foreground" />
        <p>Little books for the pets we love.</p>
      </div>
    </footer>
  );
}

function SectionHeading({
  eyebrow,
  title,
  align = "center",
}: {
  eyebrow: string;
  title: string;
  align?: "center" | "left";
}) {
  return (
    <div className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-xl"}>
      <p className="text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase">{eyebrow}</p>
      <h2 className="mt-3 font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
        {title}
      </h2>
    </div>
  );
}
