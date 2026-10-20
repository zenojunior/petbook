"use client";

import { BookOpen, ClipboardCheck, Database, LayoutDashboard, Settings, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "cn";
import { Button } from "@/components/ui/button";

const items = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/books", label: "Books", icon: BookOpen },
  { href: "/admin/reviews", label: "Review queue", icon: ClipboardCheck },
  { href: "/admin/database", label: "Database", icon: Database },
  { href: "/admin/settings", label: "Settings", icon: Settings },
] as const;

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto md:flex-col">
      {items.map(({ href, label, icon: Icon }) => {
        const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
        return (
          <Button
            key={href}
            variant="ghost"
            nativeButton={false}
            className={cn("justify-start", active && "bg-muted text-foreground")}
            render={<Link href={href} aria-current={active ? "page" : undefined} />}
          >
            <Icon data-icon="inline-start" />
            {label}
          </Button>
        );
      })}
    </nav>
  );
}
