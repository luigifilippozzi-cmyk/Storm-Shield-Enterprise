import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="text-4xl font-bold text-primary">Storm Shield Enterprise</h1>
      <p className="mt-4 text-muted-foreground">ERP SaaS for auto repair businesses</p>
      <div className="mt-8 flex gap-4">
        <Link
          href="/login"
          className="rounded-md bg-primary px-6 py-3 text-primary-foreground hover:opacity-90"
        >
          Sign In
        </Link>
      </div>
    </div>
  );
}
