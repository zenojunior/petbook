// The animals a book can be about. A closed list of keys, stored as they are in pets.species,
// so books can be filtered by species and the labels can be translated later.
// To add an animal, add it here: no migration is needed. "other" covers the rest.

export const speciesGroups = [
  {
    label: "Dogs and cats",
    species: [
      { key: "dog", label: "Dog" },
      { key: "cat", label: "Cat" },
    ],
  },
  {
    label: "Small mammals",
    species: [
      { key: "rabbit", label: "Rabbit" },
      { key: "guinea-pig", label: "Guinea pig" },
      { key: "hamster", label: "Hamster" },
      { key: "gerbil", label: "Gerbil" },
      { key: "mouse", label: "Mouse" },
      { key: "rat", label: "Rat" },
      { key: "chinchilla", label: "Chinchilla" },
      { key: "ferret", label: "Ferret" },
      { key: "hedgehog", label: "Hedgehog" },
    ],
  },
  {
    label: "Birds",
    species: [
      { key: "parrot", label: "Parrot" },
      { key: "budgie", label: "Budgie" },
      { key: "cockatiel", label: "Cockatiel" },
      { key: "canary", label: "Canary" },
      { key: "chicken", label: "Chicken" },
      { key: "duck", label: "Duck" },
    ],
  },
  {
    label: "Reptiles and amphibians",
    species: [
      { key: "turtle", label: "Turtle" },
      { key: "tortoise", label: "Tortoise" },
      { key: "lizard", label: "Lizard" },
      { key: "snake", label: "Snake" },
      { key: "frog", label: "Frog" },
    ],
  },
  {
    label: "Fish",
    species: [{ key: "fish", label: "Fish" }],
  },
  {
    label: "Farm animals",
    species: [
      { key: "horse", label: "Horse" },
      { key: "donkey", label: "Donkey" },
      { key: "goat", label: "Goat" },
      { key: "sheep", label: "Sheep" },
      { key: "pig", label: "Pig" },
      { key: "cow", label: "Cow" },
    ],
  },
  {
    label: "Something else",
    species: [{ key: "other", label: "Other animal" }],
  },
] as const;

export type Species = (typeof speciesGroups)[number]["species"][number]["key"];

type SpeciesGroup = { label: string; species: readonly { key: Species; label: string }[] };

// Widened so TypeScript can flatten groups of different lengths.
const all = (speciesGroups as readonly SpeciesGroup[]).flatMap((group) => group.species);

export const speciesKeys = all.map((s) => s.key) as [Species, ...Species[]];

export function speciesLabel(key: string): string {
  return all.find((s) => s.key === key)?.label ?? "Other animal";
}

// Pets created before the list existed have free text ("Cat", "dog "). Matches it to a key by
// key or label, ignoring case and spaces; anything unknown becomes "other".
export function toSpecies(value: string): Species {
  const text = value.trim().toLowerCase();
  const match = all.find((s) => s.key === text || s.label.toLowerCase() === text);
  return match?.key ?? "other";
}
