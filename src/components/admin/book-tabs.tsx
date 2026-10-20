"use client";

import type { ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Tabs for the admin book page. Every panel is already rendered by the server; this only shows one
// at a time and keeps the chosen tab in the address (?tab=), so a reload or a shared link lands on it.
export function BookTabs({
  initial,
  tabs,
}: {
  initial: string;
  tabs: { value: string; label: string; content: ReactNode }[];
}) {
  function remember(value: unknown) {
    if (typeof value !== "string") return;
    const url = new URL(window.location.href);
    url.searchParams.set("tab", value);
    window.history.replaceState(null, "", url);
  }

  return (
    <Tabs defaultValue={initial} onValueChange={remember} className="gap-6">
      <TabsList variant="line" className="h-auto w-full justify-start overflow-x-auto border-b">
        {tabs.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value} className="flex-none px-3 py-2">
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs.map((tab) => (
        <TabsContent key={tab.value} value={tab.value} className="flex flex-col gap-6">
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}
