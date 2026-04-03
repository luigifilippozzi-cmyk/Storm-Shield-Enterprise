import { auth } from '@clerk/nextjs/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function Home() {
  const { userId } = await auth();

  if (userId) {
    redirect('/dashboard');
  }

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
        <Link
          href="/register"
          className="rounded-md border px-6 py-3 hover:bg-accent"
        >
          Sign Up
        </Link>
      </div>
    </div>
  );
}
