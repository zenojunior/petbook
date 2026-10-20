import { NativeSelect, NativeSelectOptGroup, NativeSelectOption } from "@/components/ui/native-select";
import { speciesGroups } from "@/lib/domain/species";

// The species list as a select. Uncontrolled (name) inside a form, or controlled (value/onChange)
// in the editor.
export function SpeciesSelect(props: React.ComponentProps<typeof NativeSelect>) {
  return (
    <NativeSelect className="w-full" {...props}>
      {/* Shown while nothing is picked yet (value or defaultValue ""). */}
      <NativeSelectOption value="" disabled>
        Choose one
      </NativeSelectOption>
      {speciesGroups.map((group) => (
        <NativeSelectOptGroup key={group.label} label={group.label}>
          {group.species.map((s) => (
            <NativeSelectOption key={s.key} value={s.key}>
              {s.label}
            </NativeSelectOption>
          ))}
        </NativeSelectOptGroup>
      ))}
    </NativeSelect>
  );
}
