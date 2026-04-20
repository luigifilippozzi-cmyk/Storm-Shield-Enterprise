import Link from 'next/link';

export default function ForbiddenPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4">
      <h1 className="text-4xl font-bold">403</h1>
      <p className="text-muted-foreground">You don&apos;t have permission to access this workspace.</p>
      <Link href="/app" className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:opacity-90">
        Go to my workspace
      </Link>
    </div>
  );
}
