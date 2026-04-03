export function Header() {
  return (
    <header className="flex h-16 items-center justify-between border-b px-6">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold">Storm Shield Enterprise</h2>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">user@example.com</span>
      </div>
    </header>
  );
}
