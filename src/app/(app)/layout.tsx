import { SiteHeader } from "@/components/site-header";

// Signed-in area. Each page checks the session itself with requireUser().
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      {children}
    </>
  );
}
