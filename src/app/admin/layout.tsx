// Every /admin page renders inside .admin, which switches to the tokens in src/styles/tokens.admin.css.
// Access is not checked here: a layout does not stop its pages from rendering. Each admin page
// calls requireAdmin() itself, and src/proxy.ts blocks the whole area first.
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return <div className="admin flex flex-1 flex-col bg-background text-foreground">{children}</div>;
}
