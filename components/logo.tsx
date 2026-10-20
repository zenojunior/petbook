import Image from "next/image";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-semibold", className)}>
      <Image src="/logo.png" alt="" width={32} height={32} priority />
      Petbook
    </span>
  );
}
