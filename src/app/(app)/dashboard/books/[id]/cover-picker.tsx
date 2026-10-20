"use client";

import { CoverSurface } from "@/components/book/cover-surface";
import {
  coverColors,
  coverPatterns,
  type CoverColor,
  type CoverPattern,
} from "@/lib/domain/book-cover";
import { cn } from "@/lib/utils";

const colorLabels: Record<CoverColor, string> = {
  sage: "Sage",
  sky: "Sky",
  lavender: "Lavender",
  rose: "Rose",
  peach: "Peach",
  butter: "Butter",
  terracotta: "Terracotta",
  forest: "Forest",
  navy: "Navy",
  cocoa: "Cocoa",
};

const patternLabels: Record<CoverPattern, string> = {
  plain: "Plain",
  stripes: "Stripes",
  dots: "Dots",
  paws: "Paws",
  check: "Check",
};

// Native radio inputs, visually hidden, so arrow keys and focus work like any radio group.
const swatch =
  "block cursor-pointer border-2 border-transparent shadow-sm ring-offset-2 ring-offset-card transition-shadow peer-checked:ring-2 peer-checked:ring-foreground peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50";

export function CoverPicker({
  color,
  pattern,
  onChange,
}: {
  color: CoverColor;
  pattern: CoverPattern;
  onChange: (cover: { color: CoverColor; pattern: CoverPattern }) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium">Cover color</legend>
        <div className="flex flex-wrap gap-2.5">
          {coverColors.map((value) => (
            <label key={value} title={colorLabels[value]}>
              <input
                type="radio"
                name="cover-color"
                value={value}
                checked={color === value}
                onChange={() => onChange({ color: value, pattern })}
                className="peer sr-only"
              />
              <span className="sr-only">{colorLabels[value]}</span>
              <CoverSurface color={value} pattern="plain" className={cn(swatch, "size-7 rounded-full")} />
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium">Pattern</legend>
        <div className="flex flex-wrap gap-2.5">
          {coverPatterns.map((value) => (
            <label key={value} className="flex flex-col items-center gap-1">
              <input
                type="radio"
                name="cover-pattern"
                value={value}
                checked={pattern === value}
                onChange={() => onChange({ color, pattern: value })}
                className="peer sr-only"
              />
              <CoverSurface color={color} pattern={value} className={cn(swatch, "h-12 w-10 rounded-md")} />
              <span className="text-xs text-muted-foreground">{patternLabels[value]}</span>
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
