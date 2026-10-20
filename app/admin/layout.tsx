// Every /admin page renders inside .admin, which switches to the tokens in styles/tokens.admin.css.
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return <div className="admin flex flex-1 flex-col bg-background text-foreground">{children}</div>;
}
